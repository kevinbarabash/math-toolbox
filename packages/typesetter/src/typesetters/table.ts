import * as Layout from "../layout";
import {fontSizeForContext, makeDelimiter} from "../utils";

import type {Context} from "../types";

type Row = {
    children: Layout.Box[];
    height: number;
    depth: number;
};
type Col = {
    children: Layout.Box[];
    width: number;
};

const interspaceKerns = (
    boxes: Layout.Box[],
    kernSize: number,
): Layout.Node[] => {
    return boxes.flatMap((box, index) => {
        if (index > 0) {
            return [Layout.makeKern(kernSize), box];
        } else {
            return [box];
        }
    });
};

const COL_GAP = 50;

export const typesetTable = (
    typesetChildren: (Layout.Box | null)[],
    colCount: number,
    rowCount: number,
    context: Context,
): Layout.Box => {
    const columns: Col[] = [];
    const rows: Row[] = [];

    // Group cells into rows and columns and determine the width of each
    // columna and the depth/height of each row.
    for (let i = 0; i < colCount; i++) {
        for (let j = 0; j < rowCount; j++) {
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
            let cell = typesetChildren[j * colCount + i];
            if (cell) {
                columns[i].width = Math.max(cell.width, columns[i].width);
                rows[j].height = Math.max(cell.height, rows[j].height);
                rows[j].depth = Math.max(cell.depth, rows[j].depth);
            } else {
                // Use an empty Layout.Box for children that were null
                cell = {
                    type: "Box",
                    kind: "hbox",
                    shift: 0,
                    content: [],
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
            const kernSize = (col.width - originalWidth) / 2;
            const cell = Layout.rebox(
                col.children[j],
                Layout.makeKern(kernSize, "start"),
                Layout.makeKern(kernSize, "end"),
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

    // TODO: adjust the reboxing above in order to drop the kerns we add here.
    // This will make it easier to position a cursor within a table since right
    // now clicking on one of these kerns will result in the cursor being ejected
    // from the table.
    const rowBoxes = rows.map((row) =>
        Layout.hpackNat([interspaceKerns(row.children, COL_GAP)], context),
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

    const open = makeDelimiter("[", inner, thresholdOptions, context);
    const close = makeDelimiter("]", inner, thresholdOptions, context);

    const table = Layout.hpackNat([[open, inner, close]], context);

    return table;
};
