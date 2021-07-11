import * as builders from "../ast/builders";
import * as types from "../ast/types";
import {isAtom} from "../ast/util";

import * as util from "./util";
import {moveRight} from "./move-right";
import {
    zipperToVerticalWork,
    verticalWorkToZTable,
    isColumnEmpty,
    isCellEmpty,
    adjustEmptyColumns,
} from "./vertical-work-utils";

import type {VerticalWork, Column} from "./vertical-work-utils";
import type {Zipper, State} from "./types";

// TODO: place cursor in lower limits
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

const isCellPlusMinus = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["+", "\u2212"]);

const isCellRelationOperator = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["=", ">", "<"]);

export const insertChar = (state: State, char: string): State => {
    const zipper = state.zipper;
    const {left, selection} = zipper.row;
    let newNode;
    if (LIMIT_CHARS.includes(char)) {
        newNode = builders.limits(builders.glyph(char), [], []);
    } else {
        newNode = builders.glyph(char);
    }

    if (selection.length > 0) {
        // When inserting limits, we move the current selection to the right
        // of the new node.
        const newLeft = LIMIT_CHARS.includes(char)
            ? [...left, newNode, ...selection]
            : [...left, newNode];

        const newZipper: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                selection: [],
                left: newLeft,
            },
        };
        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    const work = zipperToVerticalWork(zipper);
    if (work) {
        const {cursorId, columns, rowCount, crumb, rowStyles} = work;

        const cursorCol = columns.find((col) =>
            col.some((cell) => cell.id === cursorId),
        );
        if (!cursorCol) {
            throw new Error(
                "Couldn't find column with a cell.id matching cursorId",
            );
        }
        const cursorCell = cursorCol.find((cell) => cell.id === cursorId);
        const otherCells = cursorCol.filter((cell) => cell.id !== cursorId);
        if (!cursorCell) {
            throw new Error("Couldn't find a cell with id matching cursorId");
        }

        if (isColumnEmpty(cursorCol)) {
            if (["+", "\u2212"].includes(char)) {
                const cursorColIndex = columns.findIndex(
                    (col) => col === cursorCol,
                );
                const cursorRow = cursorCol.findIndex(
                    (cell) => cell.id === cursorCell.id,
                );
                const newEmptyCol: types.Row[] = [];
                for (let i = 0; i < rowCount; i++) {
                    newEmptyCol.push(builders.row([]));
                }
                const newPlusMinusCol: Column = [
                    ...cursorCol.slice(0, cursorRow),
                    builders.row([newNode]),
                    ...cursorCol.slice(cursorRow + 1),
                ];
                const newCursorCol: types.Row[] = [];
                for (let i = 0; i < rowCount; i++) {
                    newCursorCol.push(builders.row([]));
                }
                const newColumns = [
                    ...columns.slice(0, cursorColIndex),
                    newEmptyCol,
                    newPlusMinusCol,
                    newCursorCol,
                    ...columns.slice(cursorColIndex + 1),
                ];
                const newWork: VerticalWork = {
                    columns: newColumns,
                    colCount: newColumns.length,
                    rowCount: rowCount,
                    cursorId: newCursorCol[cursorRow].id,
                    crumb: crumb,
                    rowStyles: rowStyles,
                };
                const newZipper = verticalWorkToZTable(
                    adjustEmptyColumns(newWork),
                );
                return util.zipperToState(newZipper);
            }
        }

        if (!isCellEmpty(cursorCell) && zipper.row.right.length === 0) {
            if (["+", "\u2212"].includes(char)) {
                const cursorColIndex = columns.findIndex(
                    (col) => col === cursorCol,
                );
                const cursorRow = cursorCol.findIndex(
                    (cell) => cell.id === cursorCell.id,
                );
                const newPlusMinusCol: types.Row[] = [];
                for (let i = 0; i < rowCount; i++) {
                    if (i === cursorRow) {
                        newPlusMinusCol.push(builders.row([newNode]));
                    } else {
                        newPlusMinusCol.push(builders.row([]));
                    }
                }
                const newCursorCol: types.Row[] = [];
                for (let i = 0; i < rowCount; i++) {
                    newCursorCol.push(builders.row([]));
                }
                const newColumns = [
                    ...columns.slice(0, cursorColIndex + 1),
                    newPlusMinusCol,
                    newCursorCol,
                    ...columns.slice(cursorColIndex + 1),
                ];
                const newWork: VerticalWork = {
                    columns: newColumns,
                    colCount: newColumns.length,
                    rowCount: rowCount,
                    cursorId: newCursorCol[cursorRow].id,
                    crumb: crumb,
                    rowStyles: rowStyles,
                };
                const newZipper = verticalWorkToZTable(
                    adjustEmptyColumns(newWork),
                );
                return util.zipperToState(newZipper);
            }
        }

        // If there's a +/- in one of the other cells in the current column...
        if (
            cursorCell.children.length === 0 &&
            otherCells.some(isCellPlusMinus)
        ) {
            // ...and the char being inserted is a +/-...
            if (["+", "\u2212"].includes(char)) {
                // ...insert the char...
                const newZipper: Zipper = {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: [newNode], // safe b/c the cell was empty
                    },
                };
                // ...and then move right...
                return moveRight(util.zipperToState(newZipper));
            } else {
                // ...otherwise, move to the right first...
                const newState = moveRight({
                    ...state,
                    selecting: false,
                });
                const zipper = newState.zipper;
                // ...and then insert the character
                const newZipper: Zipper = {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        // safe b/c we moved to the start of next cell
                        left: [newNode],
                    },
                };
                return util.zipperToState(newZipper);
            }
        }
        // If there's a relationship operator in one of the other cells in
        // the current column...
        else if (
            cursorCell.children.length === 0 &&
            otherCells.some(isCellRelationOperator)
        ) {
            // ...and the current char being inserted is also a relationship
            // operator...
            if (["=", ">", "<"].includes(char)) {
                const newZipper: Zipper = {
                    // ...insert the char...
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: [newNode], // safe b/c the cell was empty
                    },
                };
                // ...and then move right...
                return moveRight(util.zipperToState(newZipper));
            } else {
                // ...otherwise, move to the right first...
                const newState = moveRight({
                    ...state,
                    selecting: false,
                });
                const zipper = newState.zipper;
                // ...and then insert the character
                const newZipper: Zipper = {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        // safe b/c we moved to the start of the next cell
                        left: [newNode],
                    },
                };
                return util.zipperToState(newZipper);
            }
        }
    }

    const newZipper: Zipper = {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...left, newNode],
        },
    };

    const newWork = zipperToVerticalWork(newZipper);
    if (newWork) {
        // TODO: main the position of the cursor withing the current zrow
        return util.zipperToState({
            ...verticalWorkToZTable(adjustEmptyColumns(newWork)),
            row: newZipper.row,
        });
    }

    return util.zipperToState(newZipper);
};
