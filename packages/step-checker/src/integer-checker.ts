import * as Semantic from "@math-blocks/semantic";

import {Result, Check} from "./types";
import {FAILED_CHECK} from "./constants";

const addInverse: Check = (prev, next, context, reverse) => {
    const {checker} = context;
    if (reverse) {
        [prev, next] = [next, prev];
    }
    if (prev.type !== "add") {
        return FAILED_CHECK;
    }

    const indicesToRemove = new Set();
    const terms = Semantic.getTerms(prev);

    // TODO: extract this code into a helper so that we can test it better
    for (let i = 0; i < terms.length; i++) {
        for (let j = 0; j < terms.length; j++) {
            if (i === j) {
                continue;
            }
            const a = terms[i];
            const b = terms[j];
            // TODO: add a sub-step in the subtraction case
            if (Semantic.isNegative(b) || Semantic.isSubtraction(b)) {
                const result = checker.checkStep(a, b.arg, context);
                if (
                    result.equivalent &&
                    // Avoid removing a term that matches a term that's
                    // already been removed.
                    (!indicesToRemove.has(j) || !indicesToRemove.has(j))
                ) {
                    // TODO: capture the reasons and include them down below
                    indicesToRemove.add(i);
                    indicesToRemove.add(j);
                }
            }
        }
    }
    if (indicesToRemove.size > 0) {
        const newPrev = Semantic.addTerms(
            terms.filter(
                (term: Semantic.Expression, index: number) =>
                    !indicesToRemove.has(index),
            ),
        );
        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);

        if (result.equivalent) {
            return {
                equivalent: true,
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message: "adding inverse",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message: "adding inverse",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

const doubleNegative: Check = (prev, next, context, reverse) => {
    if (reverse) {
        [prev, next] = [next, prev];
    }
    const {checker} = context;
    if (Semantic.isNegative(prev) && Semantic.isNegative(prev.arg)) {
        const newPrev = prev.arg.arg;
        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);
        if (result.equivalent) {
            return {
                equivalent: true,
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message: "negative of a negative is positive",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message: "negative of a negative is positive",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

const subIsNeg: Check = (prev, next, context, reverse) => {
    const {checker} = context;
    const results: Result[] = [];

    if (reverse) {
        [prev, next] = [next, prev];
    }
    if (prev.type === "add" && next.type === "add") {
        const subs: Semantic.Neg[] = prev.args.filter(Semantic.isSubtraction);

        // We iterate through all args that are subtraction and compute
        // their result so that we can pick the shortest set of steps below.
        for (const sub of subs) {
            const index = prev.args.indexOf(sub);
            const neg =
                sub.arg.type === "mul"
                    ? Semantic.mul([
                          Semantic.neg(sub.arg.args[0]),
                          ...sub.arg.args.slice(1),
                      ] as TwoOrMore<Semantic.Expression>)
                    : Semantic.neg(sub.arg);

            const newPrev = Semantic.addTerms([
                ...prev.args.slice(0, index),
                neg,
                ...prev.args.slice(index + 1),
            ]);

            const result = reverse
                ? checker.checkStep(next, newPrev, context)
                : checker.checkStep(newPrev, next, context);
            if (result.equivalent) {
                results.push({
                    equivalent: true,
                    steps: reverse
                        ? [
                              ...result.steps,
                              {
                                  message:
                                      "subtracting is the same as adding the inverse",
                                  nodes: [newPrev, prev],
                              },
                          ]
                        : [
                              {
                                  message:
                                      "subtracting is the same as adding the inverse",
                                  nodes: [prev, newPrev],
                              },
                              ...result.steps,
                          ],
                });
            }
        }
    }

    // If there are multiple results, pick the one with the shortest number
    // of steps.
    if (results.length > 0) {
        let shortestResult = results[0];
        for (const result of results.slice(1)) {
            if (result.steps.length < shortestResult.steps.length) {
                shortestResult = result;
            }
        }
        return shortestResult;
    }

    return FAILED_CHECK;
};

const negIsMulNegOne: Check = (prev, next, context, reverse) => {
    const {checker} = context;
    if (reverse) {
        [prev, next] = [next, prev];
    }
    if (
        prev.type === "neg" &&
        !prev.subtraction && // exclude -1 to avoid an infinite expansion
        !(prev.arg.type == "number" && prev.arg.value == "1")
    ) {
        const newPrev = Semantic.mulFactors([
            Semantic.neg(Semantic.number("1")),
            ...Semantic.getFactors(prev.arg),
        ]);

        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);
        if (result.equivalent) {
            return {
                equivalent: true,
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message:
                                  "negation is the same as multipling by negative one",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message:
                                  "negation is the same as multipling by negative one",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

const mulTwoNegsIsPos: Check = (prev, next, context, reverse) => {
    const {checker} = context;
    if (reverse) {
        [prev, next] = [next, prev];
    }
    if (prev.type === "mul" && next.type === "mul") {
        // TODO: handle more factors
        if (prev.args.length === 2 && next.args.length === 2) {
            if (prev.args[0].type === "neg" && prev.args[1].type === "neg") {
                const newPrev = Semantic.mulFactors([
                    prev.args[0].arg,
                    prev.args[1].arg,
                ]);

                const result = reverse
                    ? checker.checkStep(next, newPrev, context)
                    : checker.checkStep(newPrev, next, context);
                if (result.equivalent) {
                    return {
                        equivalent: true,
                        steps: reverse
                            ? [
                                  ...result.steps,
                                  {
                                      message:
                                          "multiplying two negatives is a positive",
                                      nodes: [],
                                  },
                              ]
                            : [
                                  {
                                      message:
                                          "multiplying two negatives is a positive",
                                      nodes: [],
                                  },
                                  ...result.steps,
                              ],
                    };
                }
            }
        }
    }

    return FAILED_CHECK;
};

export const runChecks: Check = (prev, next, context) => {
    let result: Result;
    let result1: Result;
    let result2: Result;

    result = addInverse(prev, next, context, false);
    if (result.equivalent) {
        return result;
    }

    result = addInverse(prev, next, context, true);
    if (result.equivalent) {
        return result;
    }

    result1 = subIsNeg(prev, next, context, false);
    result2 = subIsNeg(prev, next, context, true);
    if (result1.equivalent && result2.equivalent) {
        if (result1.steps.length < result2.steps.length) {
            return result1;
        } else {
            return result2;
        }
    } else if (result1.equivalent) {
        return result1;
    } else if (result2.equivalent) {
        return result2;
    }

    result = mulTwoNegsIsPos(prev, next, context, false);
    if (result.equivalent) {
        return result;
    }

    result = mulTwoNegsIsPos(prev, next, context, true);
    if (result.equivalent) {
        return result;
    }

    // Choose the fastest route when multiple paths exist.
    result1 = doubleNegative(prev, next, context, false);
    result2 = doubleNegative(prev, next, context, true);
    if (result1.equivalent && result2.equivalent) {
        if (result1.steps.length < result2.steps.length) {
            return result1;
        } else {
            return result2;
        }
    } else if (result1.equivalent) {
        return result1;
    } else if (result2.equivalent) {
        return result2;
    }

    // It's important that these methods are called after doubleNegative.  This
    // is because negatives can be interpreted as multiplying by -1 providing an
    // alternative path from --a -> a.
    // TODO: provide a way to show this more detailed version of --a -> a so that
    // students know why --a -> a is true.
    result = negIsMulNegOne(prev, next, context, false);
    if (result.equivalent) {
        return result;
    }

    result = negIsMulNegOne(prev, next, context, true);
    if (result.equivalent) {
        return result;
    }

    return FAILED_CHECK;
};
