import reducer, {State} from "../../row-reducer";
import * as Util from "../../util";
import {toEqualMath} from "../../test-util";

expect.extend({toEqualMath});

describe("cancel", () => {
    it("should handle being called without a selection", () => {
        const math = Util.row("1+2");
        const cursor = {
            path: [],
            prev: Infinity,
            next: 0,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "Cancel"});

        expect(newState.math).toEqualMath(Util.row("1+2"));
    });

    it("should clear the selection", () => {
        const math = Util.row("1+2");
        const selectionStart = {
            path: [],
            prev: -Infinity,
            next: 0,
        };
        const cursor = {
            path: [],
            prev: 2,
            next: Infinity,
        };

        const state: State = {math, cursor, selectionStart};
        const newState = reducer(state, {type: "Cancel"});

        expect(newState.selectionStart).toBeUndefined();
    });

    it("should add a cancel region", () => {
        const math = Util.row("1+2");
        const selectionStart = {
            path: [],
            prev: -Infinity,
            next: 0,
        };
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor, selectionStart};
        const newState = reducer(state, {type: "Cancel"});

        // TODO: try to avoid the need for unique IDs by relying on paths instead
        // We can convert paths to strings for easier comparison.
        expect(newState.cancelRegions).toEqual([
            {
                parent: expect.any(Number),
                prev: -Infinity,
                next: expect.any(Number),
                selection: true,
            },
        ]);
    });
});