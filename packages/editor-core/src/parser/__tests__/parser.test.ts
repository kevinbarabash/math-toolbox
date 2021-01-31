import * as Testing from "@math-blocks/testing";

import {row, glyph, subsup} from "../../builders";
import * as util from "../../reducer/util";

import * as parser from "../parser";

expect.addSnapshotSerializer(Testing.serializer);

describe("EditorParser", () => {
    it("should handle equations", () => {
        const input = util.row("2x=10");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (eq
              (mul.imp 2 x)
              10)
        `);

        expect(ast.loc).toEqual({
            start: 0,
            end: 5,
            path: [],
        });
        if (ast.type === "eq") {
            expect(ast.args[0].loc).toEqual({
                start: 0,
                end: 2,
                path: [],
            });
            expect(ast.args[1].loc).toEqual({
                start: 3,
                end: 5,
                path: [],
            });
        }
    });

    it("should handle n-ary equality", () => {
        const input = util.row("x=y=z");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`(eq x y z)`);
    });

    it("should parse binary expressions containing subtraction", () => {
        const input = util.row("1-2");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg.sub 2))
        `);
    });

    it("should parse n-ary expressions containing subtraction", () => {
        const input = util.row("1-2-3");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg.sub 2)
              (neg.sub 3))
        `);
    });

    it("should handle subtracting negative numbers", () => {
        const input = util.row("1--2");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg.sub (neg 2)))
        `);
    });

    it("should parse expressions containing unary minus", () => {
        const input = util.row("1+-2+3");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg 2)
              3)
        `);
    });

    it("should parse explicit multiplication", () => {
        const input = util.row("1*2");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2)`);
    });

    it("should parse n-ary explicit multiplication", () => {
        const input = util.row("1*2*3");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2 3)`);
    });

    it("should parse implicit multiplication", () => {
        const input = util.row("abc");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
    });

    it("should handle fractions", () => {
        const input = row([glyph("1"), glyph("+"), util.frac("1", "x")]);

        const parseTree = parser.parse(input);

        expect(parseTree).toMatchInlineSnapshot(`
            (add
              1
              (div 1 x))
        `);
        expect(parseTree.loc).toEqual({
            start: 0,
            end: 3,
            path: [],
        });
        if (parseTree.type === "add") {
            expect(parseTree.args[1].loc).toEqual({
                start: 2,
                end: 3,
                path: [],
            });
            if (parseTree.args[1].type === "div") {
                // numerator
                expect(parseTree.args[1].args[0].loc).toEqual({
                    start: 0,
                    end: 1,
                    path: [2, 0],
                });
                // denominator
                expect(parseTree.args[1].args[1].loc).toEqual({
                    start: 0,
                    end: 1,
                    path: [2, 1],
                });
            }
        }
    });

    it("should handle exponents", () => {
        const input = row([glyph("x"), util.sup("2")]);

        const parseTree = parser.parse(input);

        expect(parseTree).toMatchInlineSnapshot(`(pow :base x :exp 2)`);
        expect(parseTree.loc).toEqual({
            start: 0,
            end: 2,
            path: [],
        });
        if (parseTree.type === "pow") {
            expect(parseTree.exp.loc).toEqual({
                start: 0,
                end: 1,
                path: [1, 1],
            });
        }
    });

    it("should handle nested exponents", () => {
        const input = row([
            glyph("x"),
            subsup(undefined, [glyph("y"), util.sup("2")]),
        ]);

        const parseTree = parser.parse(input);

        expect(parseTree).toMatchInlineSnapshot(`
            (pow
              :base x
              :exp (pow :base y :exp 2))
        `);
    });

    it("should handle subscripts on identifiers", () => {
        const input = row([glyph("a"), util.sub("n+1")]);

        const parseTree = parser.parse(input);

        expect(parseTree).toMatchInlineSnapshot(`(ident a (add n 1))`);

        expect(parseTree.loc).toEqual({
            start: 0,
            end: 1,
            path: [],
        });
        if (parseTree.type === "identifier") {
            if (parseTree.subscript) {
                expect(parseTree.subscript.loc).toEqual({
                    start: 0,
                    end: 3, // n + 1
                    path: [1, 0],
                });
            }
        }
    });

    it("should handle subscripts and superscripts identifiers", () => {
        const input = row([glyph("a"), util.subsup("n+1", "2")]);

        const parseTree = parser.parse(input);

        expect(parseTree).toMatchInlineSnapshot(
            `(pow :base (ident a (add n 1)) :exp 2)`,
        );
    });

    it("should throw when a subscript is being used on a number", () => {
        const input = row([glyph("2"), util.sub("0")]);

        expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
            `"subscripts are only allowed on identifiers"`,
        );
    });

    it("should throw when an atom is expected", () => {
        const input = util.row("2-");

        expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
            `"Unexpected 'eol' atom"`,
        );
    });

    it("should throw on a trailing '+'", () => {
        const input = util.row("2+2+");

        expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
            `"Unexpected 'eol' atom"`,
        );
    });

    it("should handle an ellispis", () => {
        const input = util.row("1+...+n");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              ...
              n)
        `);

        expect(ast.loc).toEqual({
            path: [],
            start: 0,
            end: 7,
        });
    });

    it("should handle adding with parens", () => {
        const input = util.row("a+(b+c)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              (add b c))
        `);
    });

    it("negation is lower precedence than implicit multiplication", () => {
        const input = util.row("-ab");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`(neg (mul.imp a b))`);
    });

    it("negation can be on individual factors when wrapped in parens", () => {
        // (-a)(b)
        const input = util.row("(-a)(b)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg a)
              b)
        `);
    });

    it("should handle implicit multiplication with parens", () => {
        const input = util.row("a(b+c)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (add b c))
        `);
    });

    it("should handle implicit multiplication with multiple parens", () => {
        const input = util.row("a(b+c)(d+e)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (add b c)
              (add d e))
        `);
    });

    it("should handle implicit multiplication with parens at the start", () => {
        const input = util.row("(b+c)(d+e)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (add b c)
              (add d e))
        `);
    });

    it("should handle implicit multiplication by a number at the end", () => {
        const input = util.row("(b)2");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`(mul.imp b 2)`);
    });

    it("should handle implicit multiplication by a frac at the end", () => {
        const input = row([...util.row("(a+b)").children, util.frac("1", "2")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (add a b)
              (div 1 2))
        `);
    });

    it("should handle implicit multiplication by a frac at the start", () => {
        const input = row([util.frac("1", "2"), glyph("b")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (div 1 2)
              b)
        `);
    });

    it("should error on two fractions in a row without an operator", () => {
        const input = row([util.frac("1", "2"), util.frac("1", "2")]);

        expect(() => parser.parse(input)).toThrowError(
            "An operator is required between fractions",
        );
    });

    it("should handle implicit multiplication with roots", () => {
        const input = row([glyph("a"), util.root("b", "2")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (root :radicand 2 :index b))
        `);

        expect(ast.loc).toEqual({
            start: 0,
            end: 2,
            path: [],
        });
        if (ast.type === "mul") {
            expect(ast.args[0].loc).toEqual({
                start: 0,
                end: 1,
                path: [],
            });
            expect(ast.args[1].loc).toEqual({
                start: 1,
                end: 2,
                path: [],
            });
            if (ast.args[1].type === "root") {
                expect(ast.args[1].radicand.loc).toEqual({
                    start: 0,
                    end: 1,
                    path: [1, 0],
                });
                expect(ast.args[1].index.loc).toEqual({
                    start: 0,
                    end: 1,
                    path: [1, 1],
                });
            }
        }
    });

    it("should handle implicit multiplication with multiple roots", () => {
        const input = row([
            glyph("a"),
            util.root("b", "2"),
            util.root("c", "3"),
        ]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (root :radicand 2 :index b)
              (root :radicand 3 :index c))
        `);
    });

    it("should handle implicit multiplication starting with a root", () => {
        const input = row([util.root("b", "2"), util.root("c", "3")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index b)
              (root :radicand 3 :index c))
        `);
    });

    it("should handle (√2)a", () => {
        const input = row([util.root("2", "2"), glyph("a")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              a)
        `);
    });

    it("should handle 5√2", () => {
        const input = row([glyph("5"), util.root("2", "2")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              5
              (root :radicand 2 :index 2))
        `);
    });

    it("should handle √2 5", () => {
        const input = row([util.root("2", "2"), glyph("5")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              5)
        `);
    });

    it("should handle √2√3", () => {
        const input = row([util.root("2", "2"), util.root("3", "2")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              (root :radicand 2 :index 3))
        `);
    });

    it("should handle √2 a", () => {
        const input = row([util.root("2", "2"), glyph("a")]);

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              a)
        `);
    });

    it("-1(a + b)", () => {
        const input = util.row("-1(a+b)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (neg (mul.imp
              1
              (add a b)))
        `);
    });

    it("(-1)(a + b)", () => {
        const input = util.row("(-1)(a+b)");

        const ast = parser.parse(input);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg 1)
              (add a b))
        `);
    });

    describe("unmatched paren", () => {
        it("(a+b", () => {
            const input = util.row("(a+b");

            expect(() =>
                parser.parse(input),
            ).toThrowErrorMatchingInlineSnapshot(`"unmatched left paren"`);
        });

        it("a+b)", () => {
            const input = util.row("a+b)");

            expect(() =>
                parser.parse(input),
            ).toThrowErrorMatchingInlineSnapshot(`"unexpected token"`);
        });
    });

    describe("excess parens", () => {
        it("(x)", () => {
            const input = util.row("(x)");

            const ast = parser.parse(input);

            expect(ast).toMatchInlineSnapshot(`(parens x)`);
        });

        it("((x))", () => {
            const input = util.row("((x))");

            const ast = parser.parse(input);

            expect(ast).toMatchInlineSnapshot(`(parens (parens x))`);
        });

        it("1 + (x)", () => {
            const input = util.row("1 + (x)");

            const ast = parser.parse(input);

            expect(ast).toMatchInlineSnapshot(`
                (add
                  1
                  (parens x))
            `);
        });

        it("2((x + y))", () => {
            const input = util.row("2((x + y))");

            const ast = parser.parse(input);

            expect(ast).toMatchInlineSnapshot(`
                (mul.imp
                  2
                  (parens (add x y)))
            `);
        });

        it("(xy)", () => {
            const input = util.row("1 + (xy)");

            const ast = parser.parse(input);

            expect(ast).toMatchInlineSnapshot(`
                (add
                  1
                  (parens (mul.imp x y)))
            `);
        });

        it("a + (-b)", () => {
            const input = util.row("a + (-b)");

            const ast = parser.parse(input);

            expect(ast).toMatchInlineSnapshot(`
                (add
                  a
                  (parens (neg b)))
            `);
        });
    });
});
