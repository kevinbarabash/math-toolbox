// @flow
/**
 * Generic Pratt (Top-Down Operator Precedence) parser.
 *
 * Generic parameters used in this file:
 * - T: Token
 * - N: Node
 * - O: Operator
 */

export class Parser<T: {+type: string, ...}, N, O> {
    // Machinery
    index: number;
    tokens: Array<T>;

    // Configration
    EOL: T;
    getPrefixParselet: (token: T) => ?PrefixParselet<T, N, O>;
    getInfixParselet: (token: T) => ?InfixParselet<T, N, O>;
    getOpPrecedence: O => number;

    // TODO #1: instead of having a complex constructor we should have
    // a parser factory function which returns a simple parser constructor
    // TODO #2: if we weren't using classes we could just call `parse` and
    // wouldn't have to worry about initializing things because it would do
    // it for us and all state would be caught in the closure.
    constructor(
        getPrefixParselet: (token: T) => ?PrefixParselet<T, N, O>,
        getInfixParselet: (token: T) => ?InfixParselet<T, N, O>,
        getOpPrecedence: O => number,
        EOL: T,
    ) {
        this.getInfixParselet = getInfixParselet;
        this.getPrefixParselet = getPrefixParselet;
        this.getOpPrecedence = getOpPrecedence;
        this.EOL = EOL;
    }

    // returns the next token but does not consume
    peek(): T {
        return this.tokens[this.index] || this.EOL;
    }

    consume(): T {
        return this.index < this.tokens.length
            ? this.tokens[this.index++]
            : this.EOL;
    }

    getPrecedence() {
        const token = this.peek();
        const parselet = this.getInfixParselet(token);
        return parselet ? this.getOpPrecedence(parselet.op) : 0;
    }

    parseInfix(left: N): N {
        const token = this.peek();
        const parselet = this.getInfixParselet(token);
        return parselet ? parselet.parse(this, left) : left;
    }

    parsePrefix(): N {
        const token = this.consume();
        // TODO: combine getPrefixParselet and parselet.parse
        const parselet = this.getPrefixParselet(token);
        if (!parselet) {
            throw new Error("Unexpected token");
        }
        return parselet.parse(this);
    }

    parseWithPrecedence(precedence: number): N {
        let left: N = this.parsePrefix();
        while (precedence < this.getPrecedence()) {
            left = this.parseInfix(left);
        }
        return left;
    }

    parse(tokens: Array<T>): N {
        this.tokens = tokens;
        this.index = 0;
        return this.parseWithPrecedence(0);
    }
}

export type InfixParselet<T, N, O> = {
    op: O,
    parse: (Parser<T, N, O>, N) => N,
};

export type PrefixParselet<T, N, O> = {
    parse: (Parser<T, N, O>) => N,
};
