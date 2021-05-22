import {getId} from "@math-blocks/core";

import {backspace} from "./backspace";
import {insertChar} from "./insert-char";
import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
import {parens} from "./parens";
import {root} from "./root";
import {slash} from "./slash";
import {subsup} from "./subsup";
import {zrow} from "./util";
import type {Zipper} from "./types";

export type State = Zipper;

const initialState: State = {
    row: zrow(getId(), [], []),
    breadcrumbs: [],
};

type Action = {type: string};

// TODO: check if cursor is valid before process action
// Even better, replace the cursor with a zip-tree
export const zipperReducer = (
    state: State = initialState,
    action: Action,
    startZipper?: Zipper,
): State => {
    switch (action.type) {
        case "ArrowLeft": {
            return moveLeft(state, startZipper);
        }
        case "ArrowRight": {
            return moveRight(state, startZipper);
        }
        case "Backspace": {
            return backspace(state);
        }
        case "_": {
            return subsup(state, 0);
        }
        case "^": {
            return subsup(state, 1);
        }
        case "(":
        case ")":
        case "[":
        case "]":
        case "{":
        case "}": {
            return parens(state, action.type);
        }
        case "/": {
            return slash(state);
        }
        // TODO: use "Sqrt" and "NthRoot" to differentiate the two possibilities
        case "\u221A": {
            return root(state, false);
        }
        // We don't handle any other actions yet so ignore them and return the
        // current state.
        default: {
            // We ignore all control characters as well the space character.
            if (action.type.length === 1 && action.type.charCodeAt(0) > 32) {
                let char = action.type;
                if (char === "*") {
                    char = "\u00B7";
                } else if (char === "-") {
                    char = "\u2212";
                }
                return insertChar(state, char);
            }
            return state;
        }
    }
};
