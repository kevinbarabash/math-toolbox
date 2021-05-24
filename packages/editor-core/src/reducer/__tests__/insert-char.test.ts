import * as builders from "../../builders";

import {insertChar} from "../insert-char";
import {row, toEqualEditorNodes, zrow} from "../test-util";
import type {Zipper} from "../types";

expect.extend({toEqualEditorNodes});

describe("insertChar", () => {
    test("it inserts characters at the end", () => {
        const zipper: Zipper = {
            row: zrow(row("1+").children, []),
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "2");

        expect(result.row.left).toEqualEditorNodes(row("1+2").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    test("it inserts characters at the start", () => {
        const zipper: Zipper = {
            row: zrow([], row("+2").children),
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "1");

        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("+2").children);
    });

    test("it inserts characters in the middle", () => {
        const zipper: Zipper = {
            row: zrow([builders.glyph("1")], [builders.glyph("2")]),
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "+");

        expect(result.row.left).toEqualEditorNodes(row("1+").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    test("it inserts 'limits' characters", () => {
        const zipper: Zipper = {
            row: zrow(row("1+").children, []),
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "\u03a3"); // \sum

        expect(result.row.left).toEqualEditorNodes(
            builders.row([
                builders.glyph("1"),
                builders.glyph("+"),
                builders.limits(builders.glyph("\u03a3"), [], []),
            ]).children,
        );
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    describe("selections", () => {
        test("replace selection in zipper.row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("1")],
                    selection: [builders.glyph("+")],
                    right: [builders.glyph("2")],
                    style: {},
                },
                breadcrumbs: [],
            };

            const result = insertChar(zipper, "\u2122");

            expect(result.row.left).toEqualEditorNodes(row("1\u2122").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("inserts 'limits' characte before selection", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("1")],
                    selection: [builders.glyph("+")],
                    right: [builders.glyph("2")],
                    style: {},
                },
                breadcrumbs: [],
            };

            const result = insertChar(zipper, "\u03a3"); // \sum

            expect(result.row.left).toEqualEditorNodes(
                builders.row([
                    builders.glyph("1"),
                    builders.limits(builders.glyph("\u03a3"), [], []),
                    builders.glyph("+"),
                ]).children,
            );
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });
    });
});
