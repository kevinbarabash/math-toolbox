import * as Editor from "@math-blocks/editor-core";

import * as Layout from "../layout";
import {fontSizeForContext, makeDelimiter} from "../utils";
import {MathStyle} from "../enums";

import type {Context} from "../types";

type Row = {
    children: Layout.HBox[];
    height: number;
    depth: number;
};
type Col = {
    children: Layout.HBox[];
    width: number;
};

const COL_GAP = 50;

const childContextForTable = (context: Context): Context => {
    const {mathStyle} = context;

    const childMathStyle = {
        [MathStyle.Display]: MathStyle.Text,
        [MathStyle.Text]: MathStyle.Script,
        [MathStyle.Script]: MathStyle.ScriptScript,
        [MathStyle.ScriptScript]: MathStyle.ScriptScript,
    }[mathStyle];

    const childContext: Context = {
        ...context,
        mathStyle: childMathStyle,
    };

    return childContext;
};

export const typesetTable = (
    typesetChild: (index: number, context: Context) => Layout.HBox | null,
    node: Editor.types.Table | Editor.ZTable,
    context: Context,
): Layout.HBox | Layout.VBox => {
    const columns: Col[] = [];
    const rows: Row[] = [];
    const childContext = childContextForTable(context);

    // Group cells into rows and columns and determine the width of each
    // columna and the depth/height of each row.
    for (let i = 0; i < node.colCount; i++) {
        for (let j = 0; j < node.rowCount; j++) {
            if (!columns[i]) {
                columns[i] = {
                    children: [],
                    width: 0,
                };
            }
            if (!rows[j]) {
                rows[j] = {
                    children: [],
                    height: 0,
                    depth: 0,
                };
            }
            let cell = typesetChild(j * node.colCount + i, childContext);
            if (cell) {
                columns[i].width = Math.max(cell.width, columns[i].width);
                rows[j].height = Math.max(cell.height, rows[j].height);
                rows[j].depth = Math.max(cell.depth, rows[j].depth);
            } else {
                // Use an empty Layout.Box for children that were null
                cell = {
                    type: "HBox",
                    shift: 0,
                    content: {
                        type: "static",
                        nodes: [],
                    },
                    // These values don't matter since the box is empty
                    fontSize: 0,
                    style: {},
                    // These will get filled in later
                    width: 0,
                    height: 0,
                    depth: 0,
                };
            }

            columns[i].children.push(cell);
            rows[j].children.push(cell);
        }
    }

    // Adjust the width of cells in the same column to be the same
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        for (let j = 0; j < col.children.length; j++) {
            // center the cell content
            const originalWidth = Layout.getWidth(col.children[j]);
            const baseKernSize = (col.width - originalWidth) / 2;
            const rightKernSize =
                i < columns.length - 1
                    ? baseKernSize + COL_GAP / 2
                    : baseKernSize;
            const leftKernSize =
                i > 0 ? baseKernSize + COL_GAP / 2 : baseKernSize;
            const cell = Layout.rebox(
                col.children[j],
                Layout.makeKern(leftKernSize, "start"),
                Layout.makeKern(rightKernSize, "end"),
            );
            col.children[j] = cell;
            // rows[] has its own references so we need to update it as well
            rows[j].children[i] = cell;
        }
    }

    // Adjust the height/depth of cells in the same row to be the same
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        for (let j = 0; j < row.children.length; j++) {
            row.children[j].height = row.height;
            row.children[j].depth = row.depth;
        }
    }

    const rowBoxes = rows.map((row) =>
        Layout.makeStaticHBox(row.children, context),
    );
    const width =
        columns.reduce((sum, col) => sum + col.width, 0) +
        COL_GAP * (columns.length - 1);

    const inner = Layout.makeVBox(
        width,
        rowBoxes[0],
        [],
        rowBoxes.slice(1),
        context,
    );

    const {constants} = context.fontData.font.math;
    const fontSize = fontSizeForContext(context);
    const shift = (fontSize * constants.axisHeight.value) / 1000;
    // Equalize the depth and height and then shift up so the center of the
    // table aligns with the central axis.
    const vsize = Layout.vsize(inner);
    inner.height = vsize / 2 + shift;
    inner.depth = vsize / 2 - shift;

    const thresholdOptions = {
        value: "sum" as const,
        strict: true,
    };

    if (!node.delimiters) {
        inner.id = node.id;
        inner.style = node.style;

        return inner;
    }

    const open = makeDelimiter(
        node.delimiters.left.value.char,
        inner,
        thresholdOptions,
        context,
    );
    const close = makeDelimiter(
        node.delimiters.right.value.char,
        inner,
        thresholdOptions,
        context,
    );

    const table = Layout.makeStaticHBox([open, inner, close], context);

    table.id = node.id;
    table.style = node.style;

    return table;
};
