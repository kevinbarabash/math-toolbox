import {types} from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {applyStep} from "../../apply-step";

import {simplify as _simplify} from "../simplify";
import {Step} from "../types";

const simplify = (node: types.Node): Step => {
    const result = _simplify(node, []);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

describe("simplify", () => {
    describe("collect like terms", () => {
        test("3x + 4x -> 7x", () => {
            const ast = parse("3x + 4x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("7x");
        });

        test("x + 3x -> 4x", () => {
            const ast = parse("x + 3x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("4x");
        });

        test("-x + 3x -> 2x", () => {
            const ast = parse("-x + 3x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("2x");
        });

        // Shows that we drop the `1` in `-1x`
        test("x - 2x -> -x", () => {
            const ast = parse("x - 2x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("-x");
        });

        // Shows that we convert additive inverse to subtraction where possible
        test("a + x - 2x -> a - x", () => {
            const ast = parse("a + x - 2x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("a - x");
        });

        // Shows that we convert additive inverse to subtraction where possible
        test("a + 2x - 5x -> a - 3x", () => {
            const ast = parse("a + 2x - 5x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("a - 3x");
        });

        // TODO: add transform that converts (neg (mul 2 x)) to (mul (neg 2 x))
        // or update how deal directly with the first and then add a transform that
        // converts (mul (neg 2) x) to (neg (mul 2 x)).  The second option seems easier.
        test("2x - (-3)(x) -> 5x", () => {
            const ast = parse("2x - (-3)(x)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "simplify multiplication",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("5x");

            const first = applyStep(ast, step.substeps[0]);
            const second = applyStep(first, step.substeps[1]);
            expect(print(first)).toEqual("2x - -3x");
            expect(print(second)).toEqual("5x");
        });

        test("2x - -3x -> 5x", () => {
            const ast = parse("2x - -3x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("5x");
        });

        test("5x + -3x -> 2x", () => {
            const ast = parse("5x + -3x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("2x");
        });

        test("4x + -3x - 1 -> 7x - 1", () => {
            const ast = parse("4x + -3x - 1");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x - 1");
        });

        test("4x - 3x - 1 -> 7x - 1", () => {
            const ast = parse("4x - 3x - 1");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x - 1");
        });

        test("x/2 + x/2 -> x", () => {
            const ast = parse("x/2 + x/2");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x");
        });

        test("x/2 - x/3 -> x / 6", () => {
            const ast = parse("x/2 - x/3");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
                "multiply fraction(s)",
                "simplify multiplication",
            ]);
            expect(print(step.after)).toEqual("x / 6");
        });

        test("x/2 + x/-3 -> x", () => {
            const ast = parse("x/2 + x/-3");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
                "multiply fraction(s)",
                "simplify multiplication",
            ]);
            expect(print(step.after)).toEqual("x / 6");
        });

        test("x/-2 + x/3 -> x", () => {
            const ast = parse("x/-2 + x/3");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
                "multiply fraction(s)",
                "simplify multiplication",
            ]);
            expect(print(step.after)).toEqual("-(x / 6)");
        });

        test("2xy + 3xy -> 5xy", () => {
            const ast = parse("2xy + 3xy");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("5xy");
        });

        test("1x -> x", () => {
            const ast = parse("1x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "simplify multiplication",
            ]);
            expect(print(step.after)).toEqual("x");
        });

        test("-1x -> -x", () => {
            const ast = parse("-1x");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "simplify multiplication",
            ]);
            expect(print(step.after)).toEqual("-x");
        });

        test("x/2 + x/3 -> x", () => {
            const ast = parse("x/2 + x/3");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
                "multiply fraction(s)",
            ]);
            expect(print(step.after)).toEqual("5x / 6");
        });

        test("x + 1 + 4 -> x + 5", () => {
            const ast = parse("x + 1 + 4");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x + 5");
        });

        // drop parens
        test("(x + 1) + 4 -> x + 5", () => {
            const ast = parse("(x + 1) + 4");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "drop parentheses",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x + 5");
        });

        test("3 - 1x - 1 -> -x + 2", () => {
            const ast = parse("3 - 1x - 1");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "simplify multiplication",
                "collect like terms",
            ]);

            expect(print(step.after)).toEqual("2 - x");
        });

        test("1 - (2x + 3x) -> 1 - 5x", () => {
            const ast = parse("1 - (2x + 3x)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("1 - 5x");
        });

        test("1 - (2x + 3x + 4y) -> 1 - 5x + 4y", () => {
            const ast = parse("1 - (2x + 3x + 4y)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("1 - 5x - 4y");
        });
    });

    describe("distribution", () => {
        test("3(x + 1) + 4 -> 3x + 7", () => {
            const ast = parse("3(x + 1) + 4");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("3x + 7");
        });

        test("3(x + 1) -> 3x + 3", () => {
            const ast = parse("3(x + 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3");

            expect(
                step.substeps[0].substeps.map((step) => step.message),
            ).toEqual(["multiply each term", "multiply monomials"]);
        });

        test("3(x + y + z) -> 3x + 3y + 3z", () => {
            const ast = parse("3(x + y + z)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3y + 3z");
        });

        test("(-2)(x - 3) -> -2x + 6", () => {
            const ast = parse("(-2)(x - 3)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
            ]);
            expect(print(step.after)).toEqual("-2x + 6");
        });

        test("(1 + 2)(x + 1) -> 3x + 3", () => {
            const ast = parse("(1 + 2)(x + 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate addition",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3");
        });

        test("(6 * 1/2)(x + 1) -> 3x + 3", () => {
            const ast = parse("(6 * 1/2)(x + 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3");
        });

        test("3 - (x + 1) -> -x + 2", () => {
            const ast = parse("3 - (x + 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
            ]);
            expect(print(step.substeps[0].after)).toEqual("3 - x - 1");
            expect(print(step.after)).toEqual("2 - x");

            expect(
                step.substeps[0].substeps.map((substep) => substep.message),
            ).toEqual([
                "negation is the same as multipyling by one",
                "multiply each term",
                "multiplying a negative by a positive is negative",
                "multiplying a negative by a positive is negative",
                "adding the negative is the same as subtraction",
                "adding the negative is the same as subtraction",
            ]);
            expect(print(step.substeps[0].substeps[0].before)).toEqual(
                "-(x + 1)",
            );
            expect(print(step.substeps[0].substeps[0].after)).toEqual(
                "-1(x + 1)",
            );
            expect(print(step.substeps[0].substeps[1].before)).toEqual(
                "-1(x + 1)",
            );
            expect(print(step.substeps[0].substeps[1].after)).toEqual(
                "-1x + (-1)(1)",
            );
            expect(print(step.substeps[0].substeps[2].before)).toEqual("-1x");
            expect(print(step.substeps[0].substeps[2].after)).toEqual("-x");

            const first = applyStep(ast, step.substeps[0].substeps[0]);
            const second = applyStep(first, step.substeps[0].substeps[1]);
            expect(print(first)).toEqual("3 + -1(x + 1)");
            expect(print(second)).toEqual("3 + -1x + (-1)(1)");
            // ... and so on.
        });

        test("3(x + 2(x - 1)) -> 3(3x - 2) -> 9x - 6", () => {
            const ast = parse("3(x + 2(x - 1))");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
                "distribute",
            ]);
            expect(
                step.substeps[2].substeps.map((substep) => substep.message),
            ).toEqual([
                "subtraction is the same as adding the negative",
                "multiply each term",
                "multiply monomials",
                "multiplying a negative by a positive is negative",
                "adding the negative is the same as subtraction",
            ]);
            expect(print(step.after)).toEqual("9x - 6");
        });

        test("(ab)(xy - yz)", () => {
            const ast = parse("(ab)(xy - yz)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
            ]);
            expect(print(step.after)).toEqual("abxy - abyz");
        });

        test("(-ab)(xy - yz)", () => {
            const ast = parse("(-ab)(xy - yz)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
            ]);
            expect(print(step.after)).toEqual("-abxy + abyz");

            expect(
                step.substeps[0].substeps.map((substep) => substep.message),
            ).toEqual([
                "subtraction is the same as adding the negative",
                "multiply each term",
                "multiplying a negative by a positive is negative",
                "multiplying two negatives is a positive",
            ]);
        });

        test("(3)(3)(x) - 6 -> 9x - 6", () => {
            const ast = parse("(3)(3)(x) - 6");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
            ]);
            expect(print(step.after)).toEqual("9x - 6");
        });

        test("3(x + 1) + 4(x - 1) -> 7x - 1", () => {
            const ast = parse("3(x + 1) + 4(x - 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "distribute",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("7x - 1");
        });

        test("3x + (3)(1) + 4x + (4)(-1)", () => {
            const ast = parse("3x + (3)(1) + 4x + (4)(-1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "simplify multiplication",
                "simplify multiplication",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("7x - 1");
        });

        test("3(x + 1) - (2x + 5) -> x - 2", () => {
            const ast = parse("3(x + 1) - (2x + 5)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "distribute",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x - 2");
        });

        test("x(x + 1) -> x^2 + x", () => {
            const ast = parse("x(x + 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("x^2 + x");

            expect(
                step.substeps[0].substeps.map((substep) => substep.message),
            ).toEqual(["multiply each term", "multiply monomials"]);
        });

        test("x(x - 1) -> x^2 - x", () => {
            const ast = parse("x(x - 1)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("x^2 - x");

            expect(
                step.substeps[0].substeps.map((substep) => substep.message),
            ).toEqual([
                "subtraction is the same as adding the negative",
                "multiply each term",
                "multiplying a negative by a positive is negative",
                "adding the negative is the same as subtraction",
            ]);
        });

        test("(x + 1)(x + 3) -> x^2 + 4x + 3", () => {
            const ast = parse("(x + 1)(x + 3)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "distribute",
                "distribute",
                "collect like terms",
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("x^2 + 4x + 3");

            const first = applyStep(ast, step.substeps[0]);
            expect(print(first)).toEqual("(x + 1)x + 3(x + 1)"); // is the 3 at the front?
            const second = applyStep(first, step.substeps[1]);
            expect(print(second)).toEqual("xx + x + 3(x + 1)");
            const third = applyStep(second, step.substeps[2]);
            expect(print(third)).toEqual("xx + x + 3x + 3");
            const fourth = applyStep(third, step.substeps[3]);
            expect(print(fourth)).toEqual("x^2 + 4x + 3");
        });

        test.skip("(x + 1)^2 -> x^2 + 2x + 1", () => {
            const ast = parse("(x + 1)^2");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate addition",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("x^2 + 2x + 1");
        });
    });

    describe("powers", () => {
        test("(x)(x) -> x^2", () => {
            const ast = parse("(x)(x)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("x^2");
        });

        test("(3)(3) -> 9", () => {
            const ast = parse("(3)(3)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
            ]);
            expect(print(step.after)).toEqual("9");
        });

        test("banana -> ba^3n^2", () => {
            const ast = parse("banana");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("ba^3n^2");
        });

        test.skip("(a^2)(a^3) -> a^5", () => {
            const ast = parse("(a^2)(a^3)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate addition",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("a^5");
        });
    });

    describe("reduce fraction", () => {
        test("abc / bc -> a", () => {
            const ast = parse("abc / bc");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("a");
        });

        test("ab / abc -> 1 / c", () => {
            const ast = parse("ab / abc");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("1 / c");
        });

        test("abc / bcd -> a / d", () => {
            const ast = parse("abc / bcd");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("a / d");
        });

        test("-abc / bcd -> -a / d", () => {
            const ast = parse("-abc / bcd");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("-a / d");
        });

        test("abc / -bcd -> a / -d", () => {
            const ast = parse("abc / -bcd");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("a / -d");
        });

        test("abc / abc -> 1", () => {
            const ast = parse("abc / abc");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("1");
        });

        test("-a / -1", () => {
            const ast = parse("-a / -1");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("a");
        });

        test("a / -1", () => {
            const ast = parse("a / -1");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("-a");
        });

        test("-ab / ab", () => {
            const ast = parse("-ab / ab");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("-1");
        });

        test("ab / -ab", () => {
            const ast = parse("ab / -ab");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("-1");
        });

        test("(-a)(b)(c) / b", () => {
            const ast = parse("(-a)(b)(c) / b");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "simplify multiplication",
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("-ac");
        });
    });

    describe("evaluate division", () => {
        test("4/6 -> 2/3", () => {
            const ast = parse("4 / 6");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate division",
            ]);
            expect(print(step.after)).toEqual("2 / 3");
        });

        test("-(4/6) -> -(2/3)", () => {
            const ast = parse("-(4/6)");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate division",
            ]);
            expect(print(step.after)).toEqual("-(2 / 3)");
        });

        test.skip("-4/6 -> -2/3", () => {
            const ast = parse("-4/6");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate division",
            ]);
            // TODO: if the numerator or denominator was signed to begin with
            // keep it that way instead of making the entire fraction signed.
            expect(print(step.after)).toEqual("-2 / 3");
        });

        test("2/3 cannot be simplified", () => {
            const ast = parse("2 / 3");

            expect(() => simplify(ast)).toThrowError();
        });

        test("2x / 2 -> x", () => {
            const ast = parse("2x / 2");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "reduce fraction",
            ]);
            expect(print(step.after)).toEqual("x");
        });
    });

    describe("addition of negative is subtraction", () => {
        test("a + -b", () => {
            const ast = parse("a + -b");

            const step = simplify(ast);

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "adding the inverse is the same as subtraction",
            ]);
            expect(print(step.after)).toEqual("a - b");
        });
    });
});