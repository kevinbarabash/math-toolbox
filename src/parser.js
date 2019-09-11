// @flow
import assert from "assert";
import * as Editor from "./editor";
import * as Lexer from "./lexer";
import * as Semantic from "./semantic";

import {UnreachableCaseError} from "./util";

const parseChildren = (
    nodes: Editor.Node<Lexer.Token>[],
): Semantic.NumericExpression => {
    const operands: Semantic.NumericExpression[] = [];
    const operators: Lexer.Symbol[] = [];

    // Instead of a for loop we need a while loop and a way to consume
    // the next token.  That way when we encounter a minus, we can grab
    // the next token right away.
    for (const node of nodes) {
        if (node.type === "atom") {
            if (node.value.kind === "number") {
                operands.push(node.value);
            } else if (node.value.kind === "identifier") {
                operands.push({
                    kind: "identifier",
                    name: node.value.name,
                });
            } else {
                const lastOperator = operators[operators.length - 1];
                if (lastOperator && lastOperator.symbol === node.value.symbol) {
                    continue;
                }
                operators.push(node.value);
            }
        }
        console.log(node);
    }

    console.log(operators);
    console.log(operands);

    for (const operator of operators) {
        if (operator.symbol === "+") {
            const args = [...operands]; // copy operands
            operands.length = 0; // empty operands
            const result: Semantic.AddNode = {
                kind: "add",
                args,
            };
            operands.push(result);
        } else if (operator.symbol === "\u2212") {
            const lastArg = operands.pop();
            const args = [
                ...operands,
                {
                    kind: "neg",
                    subtraction: true,
                    arg: lastArg,
                },
            ];
            operands.length = 0;
            const result: Semantic.AddNode = {
                kind: "add",
                args,
            };
            operands.push(result);
        }
    }

    // TODO: implement a pratt parser
    // we need a stack to keep track of all our operators
    // we also need to specify the precedence of the those operators

    assert.equal(operands.length, 1);
    return operands[0];
};

const parseFrac = (frac: Editor.Frac<Lexer.Token>): Semantic.DivNode => {
    const dividend = parseChildren(frac.numerator.children);
    const divisor = parseChildren(frac.denominator.children);
    return {
        kind: "div",
        dividend,
        divisor,
    };
};

// Instead of the editor returning a general node, it should probably return
// a row at the top level.
export const parse = (node: Editor.Node<Lexer.Token>): Semantic.Expression => {
    switch (node.type) {
        case "parens":
        case "row":
            return parseChildren(node.children);
        case "subsup": {
            const sub = node.sub && parseChildren(node.sub.children);
            const sup = node.sup && parseChildren(node.sup.children);
            // TODO: track the token in from the of the subsup and use that
            // to determine whether this is a summation, integral, limit, etc.

            // Placeholder, returns "0"
            return {
                kind: "number",
                value: "0",
            };
        }
        case "frac":
            return parseFrac(node);

        // These should be parsed
        case "atom": {
            const {value} = node;
            switch (value.kind) {
                case "number":
                    return {
                        kind: "number",
                        value: value.value,
                    };
                case "identifier":
                    return {
                        kind: "identifier",
                        name: value.name,
                    };
                case "symbol":
                    throw new Error("this symbol should already be parsed");
                default:
                    throw new UnreachableCaseError(value);
            }
        }

        default:
            throw new UnreachableCaseError(node);
    }
};
