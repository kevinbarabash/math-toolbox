import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../ast/types";

import type {
    ZRow,
    ZFrac,
    ZSubSup,
    ZRoot,
    ZLimits,
    ZDelimited,
    Focus,
    ZTable,
    Zipper,
    State,
} from "./types";

export const frac = (focus: ZFrac, replacement: types.Row): types.Frac => {
    return {
        id: focus.id,
        type: "frac",
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.Row | null)[] as readonly [types.Row, types.Row],
        style: focus.style,
    };
};

export const zfrac = (node: types.Frac, index: 0 | 1): ZFrac => {
    return index === 0
        ? {
              id: node.id,
              type: "zfrac",
              left: [],
              right: [node.children[1]],
              style: node.style,
          }
        : {
              id: node.id,
              type: "zfrac",
              left: [node.children[0]],
              right: [],
              style: node.style,
          };
};

export const subsup = (
    focus: ZSubSup,
    replacement: types.Row,
): types.SubSup => {
    return {
        id: focus.id,
        type: "subsup",
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.Row | null)[] as readonly [
            types.Row | null,
            types.Row | null,
        ],
        style: focus.style,
    };
};

export const zsubsup = (node: types.SubSup, index: 0 | 1): ZSubSup => {
    return index === 0
        ? {
              id: node.id,
              type: "zsubsup",
              left: [],
              right: [node.children[1]],
              style: node.style,
          }
        : {
              id: node.id,
              type: "zsubsup",
              left: [node.children[0]],
              right: [],
              style: node.style,
          };
};

export const root = (focus: ZRoot, replacement: types.Row): types.Root => {
    return {
        id: focus.id,
        type: "root",
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.Row | null)[] as readonly [
            types.Row | null,
            types.Row,
        ],
        style: focus.style,
    };
};

export const zroot = (node: types.Root, index: 0 | 1): ZRoot => {
    return index === 0
        ? {
              id: node.id,
              type: "zroot",
              left: [],
              right: [node.children[1]],
              style: node.style,
          }
        : {
              id: node.id,
              type: "zroot",
              left: [node.children[0]],
              right: [],
              style: node.style,
          };
};

export const limits = (
    focus: ZLimits,
    replacement: types.Row,
): types.Limits => {
    return {
        id: focus.id,
        type: "limits",
        inner: focus.inner,
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.Row | null)[] as readonly [
            types.Row,
            types.Row | null,
        ],
        style: focus.style,
    };
};

export const zlimits = (node: types.Limits, index: 0 | 1): ZLimits => {
    return index === 0
        ? {
              id: node.id,
              type: "zlimits",
              left: [],
              right: [node.children[1]],
              inner: node.inner,
              style: node.style,
          }
        : {
              id: node.id,
              type: "zlimits",
              left: [node.children[0]],
              right: [],
              inner: node.inner,
              style: node.style,
          };
};

export const table = (focus: ZTable, replacement: types.Row): types.Table => {
    return {
        id: focus.id,
        type: "table",
        subtype: focus.subtype,
        rowCount: focus.rowCount,
        colCount: focus.colCount,
        rowStyles: focus.rowStyles,
        colStyles: focus.colStyles,
        delimiters: focus.delimiters,
        children: [...focus.left, replacement, ...focus.right],
        style: focus.style,
    };
};

export const ztable = (node: types.Table, index: number): ZTable => {
    return {
        id: node.id,
        type: "ztable",
        subtype: node.subtype,
        rowCount: node.rowCount,
        colCount: node.colCount,
        rowStyles: node.rowStyles,
        colStyles: node.colStyles,
        delimiters: node.delimiters,
        left: node.children.slice(0, index),
        right: node.children.slice(index + 1),
        style: node.style,
    };
};

export const delimited = (
    focus: ZDelimited,
    replacement: types.Row,
): types.Delimited => {
    return {
        id: focus.id,
        type: "delimited",
        children: [replacement], // focus.left and focus.right are always empty arrays
        leftDelim: focus.leftDelim,
        rightDelim: focus.rightDelim,
        style: focus.style,
    };
};

export const zdelimited = (node: types.Delimited): ZDelimited => {
    return {
        id: node.id,
        type: "zdelimited",
        left: [],
        right: [],
        leftDelim: node.leftDelim,
        rightDelim: node.rightDelim,
        style: node.style,
    };
};

export const focusToNode = (
    focus: Focus,
    replacement: types.Row,
): types.Node => {
    switch (focus.type) {
        case "zfrac":
            return frac(focus, replacement);
        case "zsubsup":
            return subsup(focus, replacement);
        case "zlimits":
            return limits(focus, replacement);
        case "zroot":
            return root(focus, replacement);
        case "zdelimited":
            return delimited(focus, replacement);
        case "ztable":
            return table(focus, replacement);
        default: {
            throw new UnreachableCaseError(focus);
        }
    }
};

export const nodeToFocus = (
    node:
        | types.Frac
        | types.SubSup
        | types.Root
        | types.Limits
        | types.Delimited
        | types.Table,
    index: number,
): Focus => {
    switch (node.type) {
        case "frac":
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zfrac(node, index);
        case "subsup":
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zsubsup(node, index);
        case "root":
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zroot(node, index);
        case "limits":
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zlimits(node, index);
        case "delimited":
            return zdelimited(node);
        case "table":
            return ztable(node, index);
        default:
            throw new UnreachableCaseError(node);
    }
};

export const insertRight = <
    T extends {
        readonly left: readonly types.Node[];
        readonly right: readonly types.Node[];
    },
>(
    zrow: T,
    node: types.Node,
): T => {
    return {
        ...zrow,
        right: [node, ...zrow.right],
    };
};

export const zrowToRow = (zrow: ZRow): types.Row => {
    return {
        id: zrow.id,
        type: "row",
        children: [...zrow.left, ...zrow.selection, ...zrow.right],
        style: zrow.style,
    };
};

export const zrow = (
    id: number,
    left: readonly types.Node[],
    right: readonly types.Node[],
    style?: types.Style,
): ZRow => ({
    id: id,
    type: "zrow",
    left,
    selection: [],
    right,
    style: style ?? {},
});

export const zipperToState = (zipper: Zipper): State => {
    return {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };
};
