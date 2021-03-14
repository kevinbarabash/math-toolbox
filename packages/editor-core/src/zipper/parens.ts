import * as builders from "../builders";

import {Node} from "../types";

import {Dir} from "./enums";
import {rezipSelection} from "./util";

import type {Zipper} from "./types";

// TODO: write tests

const isPending = (node: Node | undefined, char: string): boolean => {
    return Boolean(
        node?.type === "atom" && node.value.char === char && node.value.pending,
    );
};

export const parens = (zipper: Zipper, dir: Dir): Zipper => {
    zipper = rezipSelection(zipper);
    const {left, selection, right} = zipper.row;

    const leftParen = builders.glyph("(");
    const rightParen = builders.glyph(")");

    if (selection) {
        console.log(selection);
        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...left, leftParen, ...selection.nodes, rightParen],
                selection: null,
            },
        };
    }

    // TODO: iterate over all of the glyphs in the row to ensure that we're
    // removing the correct matching paren.
    // Get rid of matching pending paren when inserting a matching paren for real.
    if (dir === Dir.Left) {
        const first = left[0];
        if (isPending(first, "(")) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left.slice(1), builders.glyph("(")],
                },
            };
        }
    } else {
        const last = right[right.length - 1];
        if (isPending(last, ")")) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, builders.glyph(")")],
                    right: right.slice(0, -1),
                },
            };
        }
    }

    if (dir === Dir.Left) {
        rightParen.value.pending = true;
    } else {
        leftParen.value.pending = true;
    }

    return {
        ...zipper,
        row:
            dir === Dir.Left
                ? {
                      ...zipper.row,
                      left: [...left, leftParen],
                      right: [...right, rightParen],
                  }
                : {
                      ...zipper.row,
                      left: [leftParen, ...left, rightParen],
                  },
    };
};
