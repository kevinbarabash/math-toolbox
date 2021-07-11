import {row} from "../test-util";
import {adjustEmptyColumns} from "../vertical-work-utils";
import type {VerticalWork, Column} from "../vertical-work-utils";
import type {Breadcrumb} from "../types";
import {getId} from "@math-blocks/core";
import {toEqualEditorNodes} from "../test-util";

expect.extend({toEqualEditorNodes});

// TODO: update tests to verify the location of the cursor

const crumb: Breadcrumb = {
    row: {
        id: getId(),
        type: "bcrow",
        left: [],
        right: [],
        style: {},
    },
    focus: {
        id: getId(),
        type: "ztable",
        subtype: "algebra",
        rowCount: 0,
        colCount: 0,
        left: [],
        right: [],
        style: {},
    },
};

const checkWork = (
    actualWork: VerticalWork,
    expectedColumns: readonly Column[],
): void => {
    const {colCount, rowCount} = actualWork;
    expect(colCount).toEqual(expectedColumns.length);
    for (let i = 0; i < colCount; i++) {
        for (let j = 0; j < rowCount; j++) {
            const newCell = actualWork.columns[i][j];
            const expectedCell = expectedColumns[i][j];
            expect(newCell.children).toEqualEditorNodes(expectedCell.children);
        }
    }
};

describe("adjustEmptyColumns", () => {
    test("it should not remove interior empty columns if both prev and next cells are empty", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row("+"), row("")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[0][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(5);

        checkWork(actualWork, columns);
    });

    test("it should remove interior empty columns if the prev cell isn't empty", () => {
        const columns = [
            [row("2x"), row("2x")],
            [row(""), row("")],
            [row("+"), row("+")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[0][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(3);

        // TODO: add columns at the start/end of the rows
        const expectedColumns = [
            [row("2x"), row("2x")],
            [row(""), row("")],
            [row("+"), row("+")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("it should not remove interior empty columns if the next cell isn't empty", () => {
        const columns = [
            [row("2x"), row("2x")],
            [row(""), row("")],
            [row("+"), row("+")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[0][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(3);

        const expectedColumns = [
            [row("2x"), row("2x")],
            [row(""), row("")],
            [row("+"), row("+")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("it should not remove leading empty columns if the next cell is empty", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row("+"), row("+")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(4);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row("+"), row("+")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("it should remove leading empty columns if the next cell isn't empty", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("2x")],
            [row("+"), row("+")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(3);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("2x")],
            [row("+"), row("+")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("it should not remove trailing empty columns if the prev cell is empty", () => {
        const columns = [
            [row("2x"), row("2x")],
            [row("+"), row("")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(4);

        const expectedColumns = [
            [row("2x"), row("2x")],
            [row(""), row("")],
            [row("+"), row("")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("it should remove trailing empty columns if the prev cell isn't empty", () => {
        const columns = [
            [row("2x"), row("2x")],
            [row("+"), row("+")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(3);

        checkWork(actualWork, columns);
    });

    test("it should insert empty columns between every column which has an empty cell in the current row", () => {
        const columns = [
            [row("2x"), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: 3,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(6);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("it should insert an empty column at the start...", () => {
        const columns = [
            [row("2x"), row("")],
            [row("+"), row("+")],
            [row("5"), row("5")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(5);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row("+"), row("+")],
            [row("5"), row("5")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("custom test", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(8);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("custom test 2", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(9);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("custom test 3", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(9);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("")],
            [row("+"), row("")],
            [row("5"), row("")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("custom test 4", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("+")],
            [row(""), row("z")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][0].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(9);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("")],
            [row(""), row("+")],
            [row(""), row("z")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });

    test("custom test 5", () => {
        const columns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("")],
            [row(""), row("+")],
            [row(""), row("z")],
            [row(""), row("")],
        ];
        const work: VerticalWork = {
            columns: columns,
            colCount: columns.length,
            rowCount: 2,
            // which column the cursor is in doesn't matter
            cursorId: columns[1][1].id,
            crumb,
        };

        const actualWork = adjustEmptyColumns(work);
        const {rowCount, colCount} = actualWork;

        expect(rowCount).toEqual(2);
        expect(colCount).toEqual(8);

        const expectedColumns = [
            [row(""), row("")],
            [row("2x"), row("")],
            [row(""), row("")],
            [row(""), row("\u2212")],
            [row(""), row("3y")],
            [row(""), row("+")],
            [row(""), row("z")],
            [row(""), row("")],
        ];

        checkWork(actualWork, expectedColumns);
    });
});
