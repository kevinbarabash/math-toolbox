import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";

type Common = {
    id?: number;
    color?: string;
};

export type Group = {
    type: "group";
    // position relative the parent group
    x: number;
    y: number;
    width: number;
    height: number;
    layers: Node[][];
} & Common;

export type Glyph = {
    type: "glyph";
    x: number;
    y: number;
    width: number;
    glyph: Layout.Glyph;
} & Common;

export type Line = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
} & Common;

export type Rect = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
} & Common;

export type Node = Group | Glyph | Line | Rect;

const unionRect = (rects: Rect[]): Rect => {
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;

    rects.forEach((rect) => {
        if (rect.x < xMin) {
            xMin = rect.x;
        }
        if (rect.y < yMin) {
            yMin = rect.y;
        }
        if (rect.x + rect.width > xMax) {
            xMax = rect.x + rect.width;
        }
        if (rect.y + rect.height > yMax) {
            yMax = rect.y + rect.height;
        }
    });

    return {
        type: "rect",
        x: xMin,
        y: yMin,
        width: xMax - xMin,
        height: yMax - yMin,
    };
};

export type Point = {
    x: number;
    y: number;
};

const processHRule = (hrule: Layout.HRule, loc: Point): Node => {
    const advance = Layout.getWidth(hrule);
    return {
        type: "line",
        x1: loc.x,
        y1: loc.y,
        x2: loc.x + advance,
        y2: loc.y,
        color: hrule.color,
        id: hrule.id,
    };
};

const processGlyph = (glyph: Layout.Glyph, loc: Point): Node => {
    return {
        type: "glyph",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(glyph),
        glyph: glyph,
        color: glyph.color,
        id: glyph.id,
    };
};

export type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

const processHBox = ({
    box,
    cancelRegions,
    loc,
}: {
    box: Layout.Box;
    cancelRegions?: LayoutCursor[];
    loc: Point;
}): Group => {
    const pen = {x: 0, y: 0};
    const {multiplier} = box;

    const currentCancelRegions = (cancelRegions || []).filter(
        (region) => region.parent === box.id,
    );

    // set up arrays to track state of each cancel region being processed
    const cancelBoxes: Rect[][] = currentCancelRegions.map(() => []);
    const selectionBoxes: Rect[] = [];

    const editorLayer: Node[] = [];
    const nonEditorLayer: Node[] = [];
    const belowLayer: Node[] = [];
    const aboveLayer: Node[] = [];

    const hasSelection = box.content.length === 3 && box.content[1].length > 0;

    box.content.forEach((section, index) => {
        const isSelection = hasSelection && index === 1;

        // There should only be two sections max.  If there are two sections
        // then we should draw a cursor in between the two of them.
        if (index === 1 && !hasSelection) {
            // Draw the cursor.
            belowLayer.push({
                type: "rect",
                x: pen.x,
                y: pen.y - 64 * 0.85 * multiplier,
                width: 2,
                height: 64 * multiplier,
            });
        }

        section.forEach((node) => {
            // We use the `id` property as an indicator that this layout
            // node was directly derived from an editor node.
            const layer =
                typeof node.id === "number" ? editorLayer : nonEditorLayer;

            currentCancelRegions.forEach((region, regionIndex) => {
                if (
                    layer === editorLayer &&
                    region.prev < editorLayer.length &&
                    region.next > editorLayer.length
                ) {
                    const yMin = -Math.max(
                        Layout.getHeight(node),
                        64 * 0.85 * multiplier,
                    );

                    const height = Math.max(
                        Layout.getHeight(node) + Layout.getDepth(node),
                        64 * multiplier,
                    );

                    // TODO: union cancel boxes as we go instead of doing it later
                    // this will allow us to avoid having an array of an array.
                    cancelBoxes[regionIndex].push({
                        type: "rect",
                        x: pen.x,
                        y: yMin,
                        width: Layout.getWidth(node),
                        height: height,
                    });
                }
            });

            if (isSelection) {
                const yMin = -Math.max(
                    Layout.getHeight(node),
                    64 * 0.85 * multiplier,
                );

                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    64 * multiplier,
                );

                selectionBoxes.push({
                    type: "rect",
                    x: pen.x,
                    y: yMin,
                    width: Layout.getWidth(node),
                    height: height,
                });
            }

            const advance = Layout.getWidth(node);

            switch (node.type) {
                case "Box":
                    layer.push(
                        processBox({
                            box: node,
                            cancelRegions,
                            loc: {x: pen.x, y: pen.y + node.shift},
                        }),
                    );
                    break;
                case "HRule":
                    layer.push(processHRule(node, pen));
                    break;
                case "Glyph":
                    layer.push(processGlyph(node, pen));
                    break;
                case "Kern":
                    // We don't need to include kerns in the output since we include
                    // the cursor or select rectangle in the scene graph.
                    break;
                default:
                    throw new UnreachableCaseError(node);
            }

            pen.x += advance;
        });
    });

    for (const boxes of cancelBoxes) {
        const box = unionRect(boxes);
        aboveLayer.push({
            type: "line",
            x1: box.x + box.width,
            y1: box.y,
            x2: box.x,
            y2: box.y + box.height,
        });
    }

    // Draw the selection.
    for (const selectionBox of selectionBoxes) {
        belowLayer.unshift({
            ...selectionBox,
            fill: "rgba(0,64,255,0.3)",
        });
    }

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        layers: [belowLayer, editorLayer, nonEditorLayer, aboveLayer],
        color: box.color,
        id: box.id,
    };
};

const processVBox = ({
    box,
    cancelRegions,
    loc,
}: {
    box: Layout.Box;
    cancelRegions?: LayoutCursor[];
    loc: Point;
}): Group => {
    const pen = {x: 0, y: 0};

    pen.y -= box.height;

    const editorLayer: Node[] = [];
    const nonEditorLayer: Node[] = [];

    box.content.forEach((section) => {
        section.forEach((node) => {
            const height = Layout.getHeight(node);
            const depth = Layout.getDepth(node);

            // We use the `id` property as an indicator that this layout
            // node was directly derived from an editor node.
            const layer =
                typeof node.id === "number" ? editorLayer : nonEditorLayer;

            switch (node.type) {
                case "Box":
                    // TODO: reconsider whether we should be taking the shift into
                    // account when computing the height, maybe we can drop this
                    // and simplify things.  The reason why we zero out the shift
                    // here is that when we render a box inside of a vbox, the shift
                    // is a horizontal shift as opposed to a vertical one.
                    // I'm not sure we can do this properly since how the shift is
                    // used depends on the parent box type.  We could pass that info
                    // to the getHeight() function... we should probably do an audit
                    // of all the callsites for getHeight()
                    pen.y += Layout.getHeight({...node, shift: 0});
                    // TODO: see if we can get rid of this check in the future
                    if (Number.isNaN(pen.y)) {
                        // eslint-disable-next-line no-debugger
                        debugger;
                    }
                    layer.push(
                        processBox({
                            box: node,
                            cancelRegions,
                            loc: {x: pen.x + node.shift, y: pen.y},
                        }),
                    );
                    pen.y += Layout.getDepth({...node, shift: 0});
                    break;
                case "HRule":
                    pen.y += height;
                    layer.push(processHRule(node, pen));
                    pen.y += depth;
                    break;
                case "Glyph":
                    pen.y += height;
                    layer.push(processGlyph(node, pen));
                    pen.y += depth;
                    break;
                case "Kern":
                    pen.y += node.size;
                    break;
                default:
                    throw new UnreachableCaseError(node);
            }
        });
    });

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        layers: [editorLayer, nonEditorLayer],
        color: box.color,
        id: box.id,
    };
};

export const processBox = ({
    box,
    cancelRegions,
    loc,
}: {
    box: Layout.Box;
    cancelRegions?: LayoutCursor[];
    loc?: Point;
}): Group => {
    // If we weren't passed a location then this is the top-level call, in which
    // case we set the location based on box being passed in.  Setting loc.y to
    // the height of the box shifts the box into view.
    if (!loc) {
        loc = {x: 0, y: Layout.getHeight(box)};
    }

    switch (box.kind) {
        case "hbox":
            return processHBox({box, cancelRegions, loc});
        case "vbox":
            return processVBox({box, cancelRegions, loc});
    }
};