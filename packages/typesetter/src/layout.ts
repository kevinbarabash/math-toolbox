import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from "@math-blocks/core";

type Dist = number;

type Dim = {
    width: Dist;
    depth: Dist;
    height: Dist;
};

type BoxKind = "hbox" | "vbox";

export type Box = Dim & {
    type: "Box";
    id?: number;
    kind: BoxKind;
    shift: Dist;
    content: Node[];
    multiplier: number;
};

export type Glyph = {
    type: "Glyph";
    id?: number;
    char: string;
    size: number;
    metrics: FontMetrics;
    pending?: boolean;
};

export type Kern = {
    type: "Kern";
    id?: number;
    size: Dist;
};

export type HRule = {
    type: "HRule";
    id?: number;
    thickness: number;
    width: number;
};

export type Node = Box | Glyph | Kern | HRule;

export const makeBox = (
    kind: BoxKind,
    dim: Dim,
    content: Node[],
    multiplier: number,
): Box => ({
    type: "Box",
    kind,
    ...dim,
    shift: 0,
    content,
    multiplier,
});

export const makeKern = (size: Dist): Kern => ({
    type: "Kern",
    size,
});

export const makeHRule = (thickness: number, width: number): HRule => ({
    type: "HRule",
    thickness,
    width,
});

export const makeGlyph = (fontMetrics: FontMetrics) => (fontSize: number) => (
    char: string,
): Glyph => {
    return {
        type: "Glyph",
        char,
        size: fontSize,
        metrics: fontMetrics,
    };
};

export const getCharAdvance = (glyph: Glyph): number => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.advance * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharBearingX = (glyph: Glyph): number => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.bearingX * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharWidth = (glyph: Glyph): number => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.width * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharHeight = (glyph: Glyph): number => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.bearingY * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharDepth = (glyph: Glyph): number => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (
        ((metrics.height - metrics.bearingY) * glyph.size) /
        fontMetrics.unitsPerEm
    );
};

export const getWidth = (node: Node): number => {
    switch (node.type) {
        case "Box":
            return node.width;
        case "Glyph":
            return getCharAdvance(node);
        case "Kern":
            return node.size;
        case "HRule":
            return node.width;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const getHeight = (node: Node): number => {
    switch (node.type) {
        case "Box":
            return node.height - node.shift;
        case "Glyph":
            return getCharHeight(node);
        case "Kern":
            return 0;
        case "HRule":
            return node.thickness / 2;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const getDepth = (node: Node): number => {
    switch (node.type) {
        case "Box":
            return node.depth + node.shift;
        case "Glyph":
            return getCharDepth(node);
        case "Kern":
            return 0;
        case "HRule":
            return node.thickness / 2;
        default:
            throw new UnreachableCaseError(node);
    }
};

const vwidth = (node: Node): number => {
    switch (node.type) {
        case "Box":
            return node.width + node.shift;
        case "Glyph":
            return getCharAdvance(node);
        case "Kern":
            return 0;
        case "HRule":
            return node.width;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const vsize = (node: Node): number => {
    switch (node.type) {
        case "Box":
            return node.height + node.depth;
        case "Glyph":
            return getCharHeight(node) + getCharDepth(node);
        case "Kern":
            return node.size;
        case "HRule":
            return node.thickness;
        default:
            throw new UnreachableCaseError(node);
    }
};

const add = (a: number, b: number): number => a + b;
const zero = 0;
const sum = (values: number[]): number => values.reduce(add, zero);
const max = (values: number[]): number => Math.max(...values);

export const hlistWidth = (nodes: Node[]): number => sum(nodes.map(getWidth));
const hlistHeight = (nodes: Node[]): number => max(nodes.map(getHeight));
const hlistDepth = (nodes: Node[]): number => max(nodes.map(getDepth));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const vlistWidth = (nodes: Node[]): number => max(nodes.map(vwidth));
const vlistVsize = (nodes: Node[]): number => sum(nodes.map(vsize));

export const hpackNat = (nl: Node[], multiplier = 1): Box => {
    const dim = {
        width: hlistWidth(nl),
        height: hlistHeight(nl),
        depth: hlistDepth(nl),
    };
    return makeBox("hbox", dim, nl, multiplier);
};

export const makeVBox = (
    width: Dist,
    node: Node,
    upList: Node[],
    dnList: Node[],
    multiplier = 1,
): Box => {
    const dim = {
        width,
        depth: vlistVsize(dnList) + getDepth(node),
        height: vlistVsize(upList) + getHeight(node),
    };
    const nodeList = [...upList.reverse(), node, ...dnList];
    return makeBox("vbox", dim, nodeList, multiplier);
};

const makeList = (size: Dist, box: Box): Node[] => [makeKern(size), box];

// TODO: compute width from numBox and denBox
export const makeFract = (
    multiplier: number,
    thickness: Dist,
    numBox: Box,
    denBox: Box,
): Box => {
    const width = Math.max(
        Math.max(getWidth(numBox), getWidth(denBox)), // TODO: calculate this based on current font size
        30 * multiplier,
    );
    const stroke = hpackNat([
        makeHRule(thickness * multiplier, width - thickness),
    ]);
    stroke.shift = thickness / 2;

    // TODO: try to figure out the baseline and use that to space this our right
    const upList = makeList(-10 * multiplier, numBox);
    const dnList = makeList(6 * multiplier, denBox);

    const fracBox = makeVBox(width, stroke, upList, dnList);
    // TODO: calculate this based on current font size
    fracBox.shift = -22 * multiplier;

    if (getWidth(numBox) < width) {
        numBox.shift = (width - getWidth(numBox)) / 2;
    }

    if (getWidth(denBox) < width) {
        denBox.shift = (width - getWidth(denBox)) / 2;
    }

    return fracBox;
};

export const makeSubSup = (
    multiplier: number,
    subBox?: Box,
    supBox?: Box,
): Box => {
    if (!supBox && !subBox) {
        throw new Error("at least one of supBox and subBox must be defined");
    }

    const width = Math.max(
        supBox ? getWidth(supBox) : 0,
        subBox ? getWidth(subBox) : 0,
    );
    const upList = supBox ? makeList(10 * multiplier, supBox) : [];
    // TODO: make the shift depend on the height of the subscript
    const dnList = subBox ? makeList(0 * multiplier, subBox) : [];
    // we can't have a non-zero kern b/c it has no height/depth
    const gap = makeKern(0);

    const subsupBox = makeVBox(width, gap, upList, dnList);
    // TODO: calculate this based on current font size
    subsupBox.shift = -10 * multiplier;
    return subsupBox;
};
