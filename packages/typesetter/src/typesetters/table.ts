import * as Editor from "@math-blocks/editor-core";
import type {Mutable} from "utility-types";

import * as Layout from "../layout";
import {fontSizeForContext, makeDelimiter} from "../utils";
import {MathStyle} from "../enums";

import type {Context} from "../types";

const DEFAULT_GUTTER_WIDTH = 50;

const isCellEqualSign = (cell: Editor.types.Row | null): boolean =>
    cell?.children.length === 1 && Editor.util.isAtom(cell.children[0], "=");

const isCellPlusMinus = (cell: Editor.types.Row | null): boolean =>
    cell?.children.length === 1 &&
    Editor.util.isAtom(cell.children[0], ["+", "\u2212"]);

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
    typesetChild: (
        index: number,
        context: Context,
        padFirstOperator?: boolean,
    ) => Layout.HBox | null,
    node: Editor.types.Table | Editor.ZTable,
    context: Context,
    zipper?: Editor.Zipper,
): Layout.HBox | Layout.VBox => {
    type Row = {
        children: Mutable<Layout.HBox>[];
        height: number;
        depth: number;
    };
    type Col = {
        children: Mutable<Layout.HBox>[];
        width: number;
    };

    const columns: Col[] = [];
    const rows: Row[] = [];
    const childContext = childContextForTable(context);

    const gutterWidth: number =
        node.subtype === "algebra" ? 0 : DEFAULT_GUTTER_WIDTH;

    const children =
        node.type === "table"
            ? node.children
            : [
                  ...node.left,
                  // @ts-expect-error: zipper is always defined when
                  // node is a ZTable
                  Editor.zrowToRow(zipper.row),
                  ...node.right,
              ];

    const topRowChildren = children.slice(0, node.colCount);

    // Group cells into rows and columns and determine the width of each
    // column and the depth/height of each row.
    for (let j = 0; j < node.rowCount; j++) {
        for (let i = 0; i < node.colCount; i++) {
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

            let padFirstOperator = false;

            // We only want to add padding around the first operator in some
            // cells when the table is being used for showing work vertically
            // which is what the "algebra" subtype is for.
            if (node.subtype === "algebra") {
                // Pad the first operator in cells if the cell in the top row
                // of the same column is empty.
                if (j > 0) {
                    const content = rows[0].children[i].content;
                    if (
                        content.type === "static" &&
                        content.nodes.length === 0
                    ) {
                        padFirstOperator = true;
                    } else if (
                        content.type === "cursor" &&
                        content.left.length === 0 &&
                        content.right.length === 0
                    ) {
                        padFirstOperator = true;
                    } else if (
                        content.type === "selection" &&
                        content.left.length === 0 &&
                        content.selection.length === 0 &&
                        content.right.length === 0
                    ) {
                        padFirstOperator = true;
                    }
                }
            }

            // Pad if the cell in the top row is a single plus/minus operator,
            // including the cell in the top row.
            const topRowChild = topRowChildren[i];
            if (
                topRowChild &&
                topRowChild.children.length === 1 &&
                topRowChild.children[0].type === "atom" &&
                ["+", "\u2212"].includes(topRowChild.children[0].value.char)
            ) {
                padFirstOperator = true;
            }

            let cell = typesetChild(
                j * node.colCount + i,
                childContext,
                padFirstOperator,
            );

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

    const cursorIndex = node.type === "ztable" ? node.left.length : -1;
    if (node.subtype === "algebra" && cursorIndex !== -1) {
        const col = cursorIndex % node.colCount;
        const zrow = zipper?.row;

        type Column = readonly Editor.types.Row[];
        const cellColumns: Column[] = [];
        for (let i = 0; i < node.colCount; i++) {
            const col: Editor.types.Row[] = [];
            for (let j = 0; j < node.rowCount; j++) {
                const index = j * node.colCount + i;
                // TODO: check that children[index] isn't null
                col.push(children[index] as Editor.types.Row);
            }
            cellColumns.push(col); // this is unsafe
        }

        if (zrow) {
            if (
                col < cellColumns.length - 1 &&
                cellColumns[col + 1].some(isCellEqualSign) &&
                zrow.left.length === 0
            ) {
                // Add left padding on every cell in the row except the first
                for (let row = 1; row < node.rowCount; row++) {
                    let cell = rows[row].children[col];
                    cell = Layout.rebox(
                        cell,
                        Layout.makeKern(16),
                        Layout.makeKern(0),
                    );
                    rows[row].children[col] = cell;
                    columns[col].children[row] = cell;
                    columns[col].width = Math.max(
                        columns[col].width,
                        cell.width,
                    );
                }
            } else if (
                col > 0 &&
                cellColumns[col - 1].some(isCellEqualSign) &&
                zrow.right.length === 0
            ) {
                // Add right padding on every cell in the row except the first
                for (let row = 1; row < node.rowCount; row++) {
                    let cell = rows[row].children[col];
                    cell = Layout.rebox(
                        cell,
                        Layout.makeKern(0),
                        Layout.makeKern(16),
                    );
                    rows[row].children[col] = cell;
                    columns[col].children[row] = cell;
                    columns[col].width = Math.max(
                        columns[col].width,
                        cell.width,
                    );
                }
            } else if (
                col < cellColumns.length - 1 &&
                cellColumns[col + 1].some(isCellPlusMinus) &&
                Editor.isColumnEmpty(cellColumns[col])
                // zrow.left.length === 0 && zrow.right.length === 0
            ) {
                // Add left padding on every cell in the row except the first
                for (let row = 1; row < node.rowCount; row++) {
                    let cell = rows[row].children[col];
                    cell = Layout.rebox(
                        cell,
                        Layout.makeKern(16),
                        Layout.makeKern(0),
                    );
                    rows[row].children[col] = cell;
                    columns[col].children[row] = cell;
                    columns[col].width = Math.max(
                        columns[col].width,
                        cell.width,
                    );
                }
            } else if (col === 0 && zrow.right.length === 0) {
                // Add right padding on every cell in the row except the first
                for (let row = 1; row < node.rowCount; row++) {
                    let cell = rows[row].children[col];
                    cell = Layout.rebox(
                        cell,
                        Layout.makeKern(0),
                        Layout.makeKern(16),
                    );
                    rows[row].children[col] = cell;
                    columns[col].children[row] = cell;
                    columns[col].width = Math.max(
                        columns[col].width,
                        cell.width,
                    );
                }
            } else if (col === node.colCount - 1 && zrow.left.length === 0) {
                // Add left padding on every cell in the row except the first
                for (let row = 1; row < node.rowCount; row++) {
                    let cell = rows[row].children[col];
                    cell = Layout.rebox(
                        cell,
                        Layout.makeKern(16),
                        Layout.makeKern(0),
                    );
                    rows[row].children[col] = cell;
                    columns[col].children[row] = cell;
                    columns[col].width = Math.max(
                        columns[col].width,
                        cell.width,
                    );
                }
            }
        }
    }

    // Adjust the width of cells in the same column to be the same
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        for (let j = 0; j < col.children.length; j++) {
            // center the cell content
            const originalWidth = Layout.getWidth(col.children[j]);
            const baseKernSize = (col.width - originalWidth) / 2;
            let rightKernSize =
                i < columns.length - 1
                    ? baseKernSize + gutterWidth / 2
                    : baseKernSize;
            let leftKernSize =
                i > 0 ? baseKernSize + gutterWidth / 2 : baseKernSize;
            const child = children[j * node.colCount + i];
            // Right align any child that has content when showing work
            if (
                node.subtype === "algebra" &&
                child &&
                child.children.length > 0
            ) {
                leftKernSize = baseKernSize * 2;
                rightKernSize = 0;
            }
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

    const width =
        columns.reduce((sum, col) => sum + col.width, 0) +
        gutterWidth * (columns.length - 1);

    const {constants} = context.fontData.font.math;
    const fontSize = fontSizeForContext(context);

    const rowBoxes = rows.map((row, index) => {
        const result = Layout.makeStaticHBox(row.children, context);
        const style = node.rowStyles?.[index];
        if (style?.border === "top") {
            const thickness =
                (fontSize * constants.fractionRuleThickness.value) / 1000;
            const stroke = Layout.makeStaticHBox(
                [Layout.makeHRule(thickness, width)],
                context,
            );

            const {mathStyle} = context;
            const useDisplayStyle = mathStyle === MathStyle.Display;

            const minDenGap = useDisplayStyle
                ? (fontSize * constants.fractionDenomDisplayStyleGapMin.value) /
                  1000
                : (fontSize * constants.fractionDenominatorGapMin.value) / 1000;

            const minNumGap = useDisplayStyle
                ? (fontSize * constants.fractionNumDisplayStyleGapMin.value) /
                  1000
                : (fontSize * constants.fractionNumeratorGapMin.value) / 1000;

            return Layout.makeVBox(
                width,
                stroke,
                [Layout.makeKern(minNumGap)],
                [Layout.makeKern(minDenGap), result],
                context,
            );
        }
        return result;
    });

    const inner = Layout.makeVBox(
        width,
        rowBoxes[0],
        [],
        rowBoxes.slice(1),
        context,
    ) as Mutable<Layout.VBox>;

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

    const table = Layout.makeStaticHBox(
        [open, inner, close],
        context,
    ) as Mutable<Layout.HBox>;

    table.id = node.id;
    table.style = node.style;

    return table;
};
