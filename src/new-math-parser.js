// @flow
import * as Parser from "./parser.js";

// TODO: fill this list out
export type TokenType =
    | "plus"
    | "minus"
    | "star"
    | "equal"
    | "number"
    | "identifier"
    | "eol";

export type Token = {
    type: TokenType,
    value: string,
};

export type Number = {
    type: "number",
    value: string,
};

export type Identifier = {
    type: "identifier",
    name: string,
};

// TOODO: fill out this list
export type Operator = "add" | "sub" | "mul" | "div" | "eq" | "neg";

export type Apply = {
    type: Operator,
    args: Array<Node>,
};

export type Node = Number | Identifier | Apply;

type MathParser = Parser.Parser<Token, Node, Operator>;

const prefixParseletMap: Parser.PrefixParseletMap<Token, Node, Operator> = {
    minus: {
        parse: (parser, _) => ({
            type: "neg",
            args: [parser.parseWithPrecedence(parser.getOpPrecedence("neg"))],
        }),
    },
    identifier: {
        parse: (_, token) => ({
            type: "identifier",
            name: token.value,
        }),
    },
    number: {
        parse: (_, token) => ({
            type: "number",
            value: token.value,
        }),
    },
};

// most (all?) of the binary only operations will be handled by the editor
const parseBinaryInfix = (op: Operator) => (
    parser: MathParser,
    left: Node,
): Node => {
    parser.consume();
    return {
        type: op,
        args: [left, parser.parseWithPrecedence(parser.getOpPrecedence(op))],
    };
};

const parseNaryInfix = (op: Operator) => (
    parser: MathParser,
    left: Node,
): Node => {
    return {
        type: op,
        args: [left, ...parseNaryArgs(parser, op)],
    };
};

const parseNaryArgs = (parser: MathParser, op: Operator) => {
    // TODO: handle implicit multiplication
    const token = parser.peek();
    if (token.type === "identifier") {
        // implicit multiplication
    } else {
        parser.consume();
    }
    let expr = parser.parseWithPrecedence(parser.getOpPrecedence(op));
    if (op === "sub") {
        expr = {type: "neg", args: [expr]};
        op = "add";
    }
    const nextToken = parser.peek();
    if (op === "add" && nextToken.type === "plus") {
        return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === "mul" && nextToken.type === "identifier") {
        // implicit multiplication
        return [expr, ...parseNaryArgs(parser, op)];
    } else {
        return [expr];
    }
};

const infixParseletMap: Parser.InfixParseletMap<Token, Node, Operator> = {
    plus: {op: "add", parse: parseNaryInfix("add")},
    minus: {op: "add", parse: parseNaryInfix("sub")},
    equal: {op: "eq", parse: parseNaryInfix("eq")},
    identifier: {op: "mul", parse: parseNaryInfix("mul")},
};

const getOpPrecedence = (op: Operator) => {
    switch (op) {
        case "eq":
            return 2;
        case "add":
            return 3;
        case "sub":
            return 3;
        case "mul":
            return 5;
        case "div":
            return 6;
        case "neg":
            return 8;
        default:
            (op: empty);
            throw new Error("foo");
    }
};

const EOL = {
    type: "eol",
    value: "",
};

const parser = new Parser.Parser<Token, Node, Operator>(
    infixParseletMap,
    prefixParseletMap,
    getOpPrecedence,
    EOL,
);

export default parser;
