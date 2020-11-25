/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import {getId} from "@math-blocks/core";

import {
    Location,
    NumericExpression,
    Expression,
    Ident,
    Add,
    Mul,
    Num,
    Ellipsis,
    Neg,
    Eq,
    Div,
    Root,
    Exp,
} from "./validation-types";

export const identifier = (name: string, loc?: Location): Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(value: T, loc?: Location): Num => ({
    type: "number",
    id: getId(),
    // @ts-ignore: $FIXME
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = (loc?: Location): Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<NumericExpression>,
    loc?: Location,
): Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<NumericExpression>,
    implicit = false,
    loc?: Location,
): Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = (args: TwoOrMore<Expression>, loc?: Location): Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: NumericExpression,
    subtraction = false,
    loc?: Location,
): Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const div = (
    num: NumericExpression,
    den: NumericExpression,
    loc?: Location,
): Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const exp = (
    base: NumericExpression,
    exp: NumericExpression,
    loc?: Location,
): Exp => ({
    type: "exp",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: NumericExpression,
    index?: NumericExpression,
    loc?: Location,
): Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});

export const isSubtraction = (node: NumericExpression): node is Neg =>
    node.type === "neg" && node.subtraction;

export const isNegative = (node: NumericExpression): node is Neg =>
    node.type === "neg" && !node.subtraction;

export const getFactors = (
    node: NumericExpression,
): OneOrMore<NumericExpression> => (node.type === "mul" ? node.args : [node]);

export const getTerms = (
    node: NumericExpression,
): OneOrMore<NumericExpression> => (node.type === "add" ? node.args : [node]);

export const mulFactors = (
    factors: NumericExpression[],
    implicit = false,
    loc?: Location,
): NumericExpression => {
    switch (factors.length) {
        case 0:
            return number("1", loc);
        case 1:
            return factors[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "mul",
                id: getId(),
                implicit,
                args: factors as TwoOrMore<NumericExpression>,
                loc,
            };
    }
};

export const addTerms = (
    terms: NumericExpression[],
    loc?: Location,
): NumericExpression => {
    switch (terms.length) {
        case 0:
            return number("0", loc);
        case 1:
            return terms[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<NumericExpression>,
                loc,
            };
    }
};

// TODO: create a function to check if an answer is simplified or not
export const isNumber = (node: Expression): boolean => {
    if (node.type === "number") {
        return true;
    } else if (node.type === "neg") {
        return isNumber(node.arg);
    } else if (node.type === "div") {
        return node.args.every(isNumber);
    } else if (node.type === "mul") {
        return node.args.every(isNumber);
    } else if (node.type === "add") {
        return node.args.every(isNumber);
    } else if (node.type === "root") {
        return isNumber(node.radicand) && isNumber(node.index);
    } else if (node.type === "exp") {
        return isNumber(node.base) && isNumber(node.exp);
    } else {
        return false;
    }
};

// TODO: autogenerate this from the validation schema
export const isNumeric = (node: Expression): node is NumericExpression => {
    return [
        "number",
        "identifier",
        "pi",
        "infinity",
        "ellipsis",
        "add",
        "mul",
        "func",
        "div",
        "mod",
        "root",
        "exp",
        "log",
        "neg",
        "abs",
        "sum",
        "prod",
        "limit",
        "diff",
        "pdiff",
        "int",
    ].includes(node.type);
};
