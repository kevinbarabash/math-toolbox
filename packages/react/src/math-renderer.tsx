import * as React from "react";

import {Layout} from "@math-blocks/typesetter";
import {UnreachableCaseError} from "@math-blocks/core";

type GlyphProps = {glyph: Layout.Glyph; x: number; y: number};

const Glyph: React.SFC<GlyphProps> = ({glyph, x, y}) => {
    return (
        <text
            x={x}
            y={y}
            fontFamily="comic sans ms"
            fontSize={glyph.size}
            fill={glyph.pending ? "#CCC" : "black"}
        >
            {glyph.char}
        </text>
    );
};

type HRuleProps = {rule: Layout.HRule; x: number; y: number};

const HRule: React.SFC<HRuleProps> = ({rule, x, y}) => {
    return (
        <line
            stroke="currentColor"
            strokeWidth={rule.thickness}
            strokeLinecap="round"
            x1={x}
            y1={y}
            x2={x + Layout.getWidth(rule)}
            y2={y}
        />
    );
};

type LayoutCursor = {
    parent: number;
    prev: number | null;
    next: number | null;
    selection: boolean;
};

type BoxProps = {
    readonly box: Layout.Box;
    readonly cursor?: LayoutCursor;
    x?: number;
    y?: number;
};

const HBox: React.SFC<BoxProps> = ({box, cursor, x = 0, y = 0}) => {
    const pen = {x: 0, y: 0};
    const availableSpace = box.width - Layout.hlistWidth(box.content);
    const {multiplier} = box;

    let cursorPos: {startX: number; endX: number; y: number} | null = null;

    const showCursor = cursor && cursor.parent === box.id;
    const selection = cursor && cursor.selection;

    const result = box.content.map((node, index) => {
        let result: React.ReactElement | null = null;

        if (showCursor && cursor) {
            if (cursor.prev === node.id) {
                cursorPos = {
                    startX: pen.x - 1,
                    endX: pen.x - 1,
                    y: -64 * 0.85 * multiplier,
                };
            }

            if (cursor.prev == null && index === 0) {
                cursorPos = {
                    startX: pen.x - 1,
                    endX: pen.x - 1,
                    y: -64 * 0.85 * multiplier,
                };
            }

            if (selection && cursorPos) {
                if (cursor.next && cursor.next === node.id) {
                    cursorPos.endX = pen.x - 1;
                }
            }
        }

        switch (node.type) {
            case "Box":
                result = (
                    <Box
                        key={index}
                        box={node}
                        cursor={cursor}
                        x={pen.x}
                        y={pen.y + node.shift}
                    />
                );
                pen.x += Layout.getWidth(node);
                break;
            case "HRule":
                result = <HRule key={index} rule={node} {...pen} />;
                pen.x += Layout.getWidth(node);
                break;
            case "Glue":
                // TODO: add a pen to keep track of the horizontal position of things
                pen.x += availableSpace / 2;
                break;
            case "Glyph":
                result = <Glyph key={index} glyph={node} {...pen} />;
                pen.x += Layout.getWidth(node);
                break;
            case "Kern":
                pen.x += Layout.getWidth(node);
                break;
            default:
                throw new UnreachableCaseError(node);
        }

        if (showCursor && cursor && cursor.prev === node.id) {
            cursorPos = {
                startX: pen.x - 1,
                endX: pen.x - 1,
                y: -64 * 0.85 * multiplier,
            };
        }

        return result;
    });

    if (selection && cursorPos && cursor && cursor.next == null) {
        // @ts-ignore: this is a TypeScript bug
        cursorPos.endX = pen.x - 1;
    }

    if (box.content.length === 0 && cursor && cursor.parent === box.id) {
        cursorPos = {
            startX: pen.x - 1 + box.width / 2,
            endX: pen.x - 1 + box.width / 2,
            y: -64 * 0.85 * multiplier,
        };
    }

    if (cursorPos) {
        if (cursorPos.startX === cursorPos.endX) {
            result.push(
                <rect
                    key="cursor"
                    x={cursorPos.startX}
                    y={cursorPos.y}
                    width={2}
                    height={64 * multiplier}
                />,
            );
        } else {
            result.unshift(
                <rect
                    key="cursor"
                    x={cursorPos.startX}
                    y={cursorPos.y}
                    width={cursorPos.endX - cursorPos.startX + 2}
                    height={64 * multiplier}
                    fill="rgba(0,64,255,0.3)"
                />,
            );
        }
    }

    return (
        <g
            id={box.id != undefined ? String(box.id) : undefined}
            transform={`translate(${x},${y})`}
        >
            {result}
        </g>
    );
};

const VBox: React.SFC<BoxProps> = ({box, cursor, x = 0, y = 0}) => {
    const pen = {x: 0, y: 0};
    const availableSpace = box.width - Layout.hlistWidth(box.content);

    pen.y -= box.height;

    const result = box.content.map((node, index) => {
        let result: React.ReactElement | null = null;

        switch (node.type) {
            case "Box": {
                pen.y += Layout.getHeight({...node, shift: 0});
                if (Number.isNaN(pen.y)) {
                    // eslint-disable-next-line no-debugger
                    debugger;
                }
                result = (
                    <Box
                        key={index}
                        box={node}
                        cursor={cursor}
                        x={pen.x + node.shift}
                        y={pen.y}
                    />
                );
                pen.y += Layout.getDepth({...node, shift: 0});
                break;
            }
            case "HRule": {
                pen.y += Layout.getHeight(node);
                result = <HRule key={index} rule={node} {...pen} />;
                pen.y += Layout.getDepth(node);
                break;
            }
            case "Glyph": {
                pen.y += Layout.getHeight(node);
                result = <Glyph key={index} glyph={node} {...pen} />;
                pen.y += Layout.getDepth(node);
                break;
            }
            case "Kern": {
                pen.y += node.size;
                break;
            }
            case "Glue": {
                // TODO: add a pen to keep track of the horizontal position of things
                pen.y += availableSpace / 2;
                break;
            }
            default:
                throw new UnreachableCaseError(node);
        }

        return result;
    });

    return (
        <g
            id={box.id != undefined ? String(box.id) : undefined}
            transform={`translate(${x},${y})`}
        >
            {result}
        </g>
    );
};

const Box: React.SFC<BoxProps> = props => {
    switch (props.box.kind) {
        case "hbox": {
            return <HBox {...props} />;
        }
        case "vbox": {
            return <VBox {...props} />;
        }
        default: {
            throw new UnreachableCaseError(props.box.kind);
        }
    }
};

type Props = {
    box: Layout.Box;
    cursor?: LayoutCursor;
};

const CURSOR_WIDTH = 2;

export const MathRenderer: React.SFC<Props> = props => {
    const {box, cursor} = props;
    const height = Layout.getHeight(box);
    const depth = Layout.getDepth(box);
    const width = Layout.getWidth(box) + CURSOR_WIDTH;
    const viewBox = `-${CURSOR_WIDTH / 2} -${height} ${width} ${height +
        depth}`;

    return (
        <svg
            style={{margin: 8}}
            width={width}
            height={height + depth}
            viewBox={viewBox}
        >
            <g fill="currentColor">
                <Box box={box} cursor={cursor} />
            </g>
        </svg>
    );
};

export default MathRenderer;