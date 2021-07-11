import * as types from "../ast/types";
import * as util from "./util";
import {verticalWork} from "./vertical-work";

import type {ZRow, Zipper, State} from "./types";

export const moveVertically = (
    state: State,
    direction: "up" | "down",
): State => {
    if (state.selecting) {
        return verticalWork(state, direction);
    }

    const {breadcrumbs} = state.zipper;
    const crumb = breadcrumbs[breadcrumbs.length - 1];
    if (crumb?.focus.type === "ztable") {
        if (crumb.focus.subtype === "algebra") {
            // We defer to 'verticalWork' to handle vertical navigation for
            // 'algebra' tables.
            return verticalWork(state, direction);
        }
        const {colCount, rowCount, left, right} = crumb.focus;

        const oldRow: ZRow = state.zipper.row;
        const orderedChildren: (types.Row | null)[] = [
            ...left,
            util.zrowToRow(oldRow),
            ...right,
        ];

        const focusIndex = left.length;
        const focusRow = Math.floor(focusIndex / colCount);
        const focusCol = focusIndex % colCount;

        let newCursorRow = focusRow;
        let focusedChild: types.Row | null = null;
        if (direction === "down") {
            newCursorRow++;
            while (newCursorRow < rowCount) {
                const newFocusIndex =
                    newCursorRow * crumb.focus.colCount + focusCol;
                focusedChild = orderedChildren[newFocusIndex];
                if (focusedChild) {
                    break;
                }
                newCursorRow++;
            }
        }
        if (direction === "up") {
            newCursorRow--;
            while (newCursorRow >= 0) {
                const newFocusIndex =
                    newCursorRow * crumb.focus.colCount + focusCol;
                focusedChild = orderedChildren[newFocusIndex];
                if (focusedChild) {
                    break;
                }
                newCursorRow--;
            }
        }

        if (!focusedChild) {
            throw new Error("focusedChild should always be defined here");
        }

        // TODO: determine cursorIndex based on column alignment, e.g. if
        // the cursor is in the middle of the cell it was exiting in should
        // be place near the middle of the cell it enters
        const cursorIndex = oldRow.left.length;
        const newCell: ZRow = {
            id: focusedChild.id,
            type: "zrow",
            left: focusedChild.children.slice(0, cursorIndex),
            selection: [],
            right: focusedChild.children.slice(cursorIndex),
            style: focusedChild.style,
        };

        const newFocusIndex = newCursorRow * crumb.focus.colCount + focusCol;
        const newCrumb = {
            ...crumb,
            focus: {
                ...crumb.focus,
                left: orderedChildren.slice(0, newFocusIndex),
                right: orderedChildren.slice(newFocusIndex + 1),
            },
        };
        const restCrumbs = breadcrumbs.slice(0, -1);

        const {zipper} = state;
        const newZipper: Zipper = {
            ...zipper,
            row: newCell,
            breadcrumbs: [...restCrumbs, newCrumb],
        };

        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    return verticalWork(state, direction);
};
