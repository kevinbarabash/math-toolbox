import {serializer} from "@math-blocks/semantic";
import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";
import {deepEquals} from "../util";

expect.addSnapshotSerializer(serializer);

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

expect.extend({
    toParseLike(received, expected) {
        if (deepEquals(received, parse(expected))) {
            return {
                message: () => `expected steps not to match`,
                pass: true,
            };
        }
        return {
            message: () => `expected steps not to match`,
            pass: false,
        };
    },
});

describe("FractionChecker", () => {
    it("a * 1/b -> a / b", () => {
        const result = checkStep("a * 1/b", "a / b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying by one over something results in a fraction",
        ]);
    });

    it("1/b * a -> a / b", () => {
        const result = checkStep("1/b * a", "a / b");

        expect(result.equivalent).toBe(true);
        expect(result.steps).toHaveLength(2);

        expect(result.steps[0].message).toEqual("commutative property");
        expect(result.steps[0].nodes[0]).toParseLike("1/b * a");
        expect(result.steps[0].nodes[1]).toParseLike("a * 1/b");

        expect(result.steps[1].message).toEqual(
            "multiplying by one over something results in a fraction",
        );
        expect(result.steps[1].nodes[0]).toParseLike("a * 1/b");
        expect(result.steps[1].nodes[1]).toParseLike("a / b");
    });

    it("a / b -> a * 1/b", () => {
        const result = checkStep("a / b", "a * 1/b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
        ]);
    });

    // TODO: simplify this case
    it("1/a * 1/b -> 1*1 / a*b -> 1 / ab", () => {
        const result = checkStep("1/a * 1/b", "1 / ab");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "fraction is the same as multiplying by one over",
            "multiplication with identity",
            "multiplication with identity",
        ]);
    });

    it("1 -> a/a", () => {
        const result = checkStep("1", "a/a");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by the same value",
        ]);
    });

    it("a/b * c/d -> ac / bd", () => {
        const result = checkStep("a/b * c/d", "ac / bd");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ac / bd -> a/b * c/d", () => {
        const result = checkStep("ac / bd", "a/b * c/d");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ab/cd * e/f -> abe / cdf", () => {
        const result = checkStep("ab/cd * e/f", "abe / cdf");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("a/b * 1/d -> a*1 / bd -> a / bd", () => {
        const result = checkStep("a/b * 1/d", "a / bd");

        expect(result.equivalent).toBe(true);
        expect(result.steps).toHaveLength(2);

        expect(result.steps[0].message).toEqual("multiplying fractions");
        expect(result.steps[0].nodes[0]).toParseLike("a/b * 1/d");
        expect(result.steps[0].nodes[1]).toParseLike("(a * 1) / (b * d)");

        expect(result.steps[1].message).toEqual("multiplication with identity");
        expect(result.steps[1].nodes[0]).toParseLike("a * 1");
        expect(result.steps[1].nodes[1]).toParseLike("a");
    });

    it("30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5", () => {
        const checker = new StepChecker({skipEvalChecker: true});
        const result = checker.checkStep(parse("30 / 6"), parse("5"), []);

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "prime factorization",
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    it("24 / 6 -> 2*2*2*3 / 2*3 -> 2*3/2*3 * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4", () => {
        const checker = new StepChecker({evalFractions: false});
        const result = checker.checkStep(parse("24 / 6"), parse("4"), []);

        expect(result.equivalent).toBe(true);
        expect(result.steps).toHaveLength(6);

        expect(result.steps[0].message).toEqual("prime factorization");
        expect(result.steps[0].nodes[0]).toParseLike("24 / 6");
        expect(result.steps[0].nodes[1]).toParseLike("(2*2*2*3) / (2*3)");

        expect(result.steps[1].message).toEqual(
            "extract common factors from numerator and denominator",
        );
        expect(result.steps[1].nodes[0]).toParseLike("(2*2*2*3) / (2*3)");
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`
            (mul.exp
              (div
                (mul.exp 2 3)
                (mul.exp 2 3))
              (div
                (mul.exp 2 2)
                1))
        `);

        expect(result.steps[2].message).toEqual("division by the same value");
        expect(result.steps[2].nodes[0]).toParseLike("(2*3) / (2*3)");
        expect(result.steps[2].nodes[1]).toParseLike("1");

        expect(result.steps[3].message).toEqual("multiplication with identity");
        expect(result.steps[3].nodes[0]).toMatchInlineSnapshot(`
            (mul.exp
              1
              (div
                (mul.exp 2 2)
                1))
        `);
        expect(result.steps[3].nodes[1]).toParseLike("(2*2) / 1");

        expect(result.steps[4].message).toEqual("evaluation of multiplication");
        expect(result.steps[4].nodes[0]).toParseLike("2 * 2");
        expect(result.steps[4].nodes[1]).toParseLike(`4`);

        expect(result.steps[5].message).toEqual("division by one");
        expect(result.steps[5].nodes[0]).toParseLike("4 / 1");
        expect(result.steps[5].nodes[1]).toParseLike(`4`);
    });

    it("(2)(2)(2)(3) / (2)(3) -> (2)(2)(2) / (2)", () => {
        const checker = new StepChecker({evalFractions: false});
        const result = checker.checkStep(
            parse("(2)(2)(2)(3) / (2)(3)"),
            parse("(2)(2)(2) / 2"),
            [],
        );

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    describe("reciprocals", () => {
        it("a / (b/c) -> a * c/b", () => {
            const result = checkStep("a / (b/c)", "a * c/b");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
            ]);
        });

        it("1 / (a/b) -> b / a", () => {
            const result = checkStep("1 / (a/b)", "b / a");

            expect(result.equivalent).toBe(true);
            expect(result.steps).toHaveLength(2);

            expect(result.steps[0].message).toEqual(
                "dividing by a fraction is the same as multiplying by the reciprocal",
            );
            expect(result.steps[0].nodes[0]).toParseLike("1 / (a/b)");
            expect(result.steps[0].nodes[1]).toParseLike("1 * b/a");

            expect(result.steps[1].message).toEqual(
                "multiplication with identity",
            );
            expect(result.steps[1].nodes[0]).toParseLike("1 * b/a");
            expect(result.steps[1].nodes[1]).toParseLike("b / a");
        });

        it("1 / (1/a) -> a", () => {
            const result = checkStep("1 / (1/a)", "a");

            expect(result.equivalent).toBe(true);
            expect(result.steps).toHaveLength(3);

            expect(result.steps[0].message).toEqual(
                "dividing by a fraction is the same as multiplying by the reciprocal",
            );
            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
                (div
                  1
                  (div 1 a))
            `);
            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
                (mul.exp
                  1
                  (div a 1))
            `);

            expect(result.steps[1].message).toEqual(
                "multiplication with identity",
            );
            expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`
                (mul.exp
                  1
                  (div a 1))
            `);
            expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`(div a 1)`);

            expect(result.steps[2].message).toEqual("division by one");
            expect(result.steps[2].nodes[0]).toMatchInlineSnapshot(`(div a 1)`);
            expect(result.steps[2].nodes[1]).toMatchInlineSnapshot(`a`);
        });

        it("a / (1/b) -> a * b/1 -> ab", () => {
            const result = checkStep("a / (1/b)", "ab");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "division by one",
            ]);
        });

        it("a/b * b/a -> ab/ba -> ab/ab -> 1", () => {
            const result = checkStep("a/b * b/a", "1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplying fractions",
                "commutative property",
                "division by the same value",
            ]);
        });
    });

    it("24ab / 6a -> 2*2*2*3*a*b / 2*3*a -> 2*3*a/2*3*a * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4b", () => {
        const result = checkStep("24ab / 6a", "4b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "prime factorization",
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "evaluation of multiplication",
            "division by one",
        ]);
    });

    // TODO: make this 2a/a -> a/a * 2 instead
    it("2a/a -> a/a * 2/1 -> 1 * 2/1 -> 2/1 -> 2", () => {
        const result = checkStep("2a/a", "2");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    it("2a/a -> 2b [incorrect]", () => {
        const result = checkStep("2a/a", "2b");

        expect(result.equivalent).toBe(false);
        expect(result.steps).toEqual([]);
    });

    it("2abc/ab -> ab/ab * 2c/1 -> 1 * 2c/1 -> 2c", () => {
        const result = checkStep("2abc/ab", "2c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    // test that we don't cancel all common factors
    it("2abc/ab -> a/a * 2bc/b -> 1 * 2bc/b -> 2bc/b", () => {
        const result = checkStep("2abc/ab", "2bc/b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("2abc/abd -> 2c/d", () => {
        const result = checkStep("2abc/abd", "2c/d");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("ab/abde -> ab/ab * 1/de -> 1 * 1/de -> 1/de", () => {
        const result = checkStep("ab/abde", "1/de");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a * b/b -> a * 1 -> a", () => {
        const result = checkStep("a * b/b", "a");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1 -> a * b/b", () => {
        const result = checkStep("a", "a * b/b");

        expect(result.equivalent).toBe(true);
        // TODO: order the substeps based on the order of the steps
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a / 1", () => {
        const result = checkStep("a", "a / 1");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    it("ab -> ab / 1", () => {
        const result = checkStep("ab", "ab / 1");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    // TODO: make sure distribution is including substeps
    // e.g. 1/c * a + 1/c * b
    it("(a + b) * 1/c -> a/c + b/c", () => {
        const result = checkStep("(a + b) * 1/c", "a/c  + b/c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "distribution",
            "fraction is the same as multiplying by one over",
            "fraction is the same as multiplying by one over",
        ]);
    });

    // e.g. 1/c * a + 1/c * b
    it("a/c + b/c -> 1/c * (a + b)", () => {
        const result = checkStep("a/c + b/c", "1/c * (a + b)");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
            "commutative property",
            "fraction is the same as multiplying by one over",
            "commutative property",
            "factoring",
        ]);
    });

    it("(a + b) / c -> a/c + b/c", () => {
        const result = checkStep("(a + b) / c", "a/c  + b/c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
            "distribution",
            "fraction is the same as multiplying by one over",
            "fraction is the same as multiplying by one over",
        ]);
    });

    it("(a + b) / c -> (a + b) * 1/c", () => {
        const result = checkStep("(a + b) / c", "(a + b) * 1/c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
        ]);
    });

    it("a/c + b/c -> (a + b) / c", () => {
        const result = checkStep("a/c  + b/c", "(a + b) / c");

        expect(result.equivalent).toBe(true);
        expect(result.steps).toHaveLength(4);

        expect(result.steps[0].message).toEqual(
            "fraction is the same as multiplying by one over",
        );
        expect(result.steps[0].nodes[0]).toParseLike("a / c");
        expect(result.steps[0].nodes[1]).toParseLike("a * 1/c");

        expect(result.steps[1].message).toEqual(
            "fraction is the same as multiplying by one over",
        );
        expect(result.steps[1].nodes[0]).toParseLike("b / c");
        expect(result.steps[1].nodes[1]).toParseLike("b * 1/c");

        expect(result.steps[2].message).toEqual("factoring");
        expect(result.steps[2].nodes[0]).toParseLike("a * 1/c + b * 1/c");
        expect(result.steps[2].nodes[1]).toParseLike("(a + b) * 1/c");

        expect(result.steps[3].message).toEqual(
            "multiplying by one over something results in a fraction",
        );
        expect(result.steps[3].nodes[0]).toParseLike("(a + b) * 1/c");
        expect(result.steps[3].nodes[1]).toParseLike("(a + b) / c");
    });
});