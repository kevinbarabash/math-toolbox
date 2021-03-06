import {UnreachableCaseError} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";
import type {Mutable} from "utility-types";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";
import {RenderMode} from "./enums";
import {fontSizeForContext} from "./utils";

import {typesetDelimited} from "./typesetters/delimited";
import {typesetFrac} from "./typesetters/frac";
import {typesetLimits} from "./typesetters/limits";
import {typesetRoot} from "./typesetters/root";
import {typesetSubsup} from "./typesetters/subsup";
import {typesetTable} from "./typesetters/table";
import {maybeAddOperatorPadding} from "./typesetters/atom";

import type {Context} from "./types";
import type {Scene} from "./scene-graph";

const typesetRow = (
    row: Editor.types.Row,
    context: Context,
    padFirstOperator?: boolean,
): Layout.HBox => {
    const box = Layout.makeStaticHBox(
        typesetNodes(
            row.children,
            context,
            undefined,
            undefined,
            padFirstOperator,
        ),
        context,
    ) as Mutable<Layout.HBox>;
    box.id = row.id;
    box.style = {
        ...box.style,
        color: row.style.color,
    };

    if (context.renderMode === RenderMode.Dynamic) {
        ensureMinDepthAndHeight(box, context);
    }

    return box;
};

/**
 * This function is used to guarantee a certain depth/height for a box that is
 * equal to the depth/height of the cursor or selection rectangle.  This is
 * useful for typesetting while editing since it minimize changes to vertical
 * size of the rendered math.
 *
 * WARNING: This function mutates `box`.
 *
 * TODO: add originalDepth and originalHeight so that getDelimiter can make its
 * decisions based on the original dimensions of the box.
 *
 * @param {Mutable<Layout.Dim>} dim
 * @param {Context} context
 * @return {void}
 */
const ensureMinDepthAndHeight = (
    dim: Mutable<Layout.Dim>,
    context: Context,
): void => {
    const {
        fontData: {font},
    } = context;
    const fontSize = fontSizeForContext(context);
    const parenMetrics = font.getGlyphMetrics(font.getGlyphID(")"));

    // This assumes that parenMetrics.height < font.head.unitsPerEm
    const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;

    const depth =
        ((parenMetrics.height - parenMetrics.bearingY + overshoot) * fontSize) /
        font.head.unitsPerEm;
    dim.depth = Math.max(dim.depth, depth);

    const height =
        ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;
    dim.height = Math.max(dim.height, height);
};

const getTypesetChildFromZipper = (
    zipper: Editor.Zipper,
    focus: Editor.Focus,
): ((index: number, context: Context) => Layout.HBox | null) => {
    return (
        index: number,
        context: Context,
        padFirstOperator?: boolean,
    ): Layout.HBox | null => {
        if (index < focus.left.length) {
            const child = focus.left[index];
            return child && typesetRow(child, context, padFirstOperator);
        } else if (index === focus.left.length) {
            return _typesetZipper(zipper, context, padFirstOperator);
        } else {
            const child = focus.right[index - focus.left.length - 1];
            return child && typesetRow(child, context, padFirstOperator);
        }
    };
};

const getTypesetChildFromNodes = <
    T extends readonly (Editor.types.Row | null)[],
>(
    children: T,
): ((index: number, context: Context) => Layout.HBox | null) => {
    return (
        index: number,
        context: Context,
        padFirstOperator?: boolean,
    ): Layout.HBox | null => {
        const child = children[index];
        return child && typesetRow(child, context, padFirstOperator);
    };
};

const typesetFocus = (
    focus: Editor.Focus,
    zipper: Editor.Zipper,
    context: Context,
    prevEditNode?: Editor.types.Node,
    prevLayoutNode?: Layout.Node,
): Layout.Node => {
    const typesetChild = getTypesetChildFromZipper(zipper, focus);
    switch (focus.type) {
        case "zfrac": {
            return typesetFrac(typesetChild, focus, context);
        }
        case "zsubsup": {
            return typesetSubsup(
                typesetChild,
                focus,
                context,
                prevEditNode,
                prevLayoutNode,
            );
        }
        case "zroot": {
            return typesetRoot(typesetChild, focus, context);
        }
        case "zlimits": {
            return typesetLimits(typesetChild, focus, context, typesetNode);
        }
        case "zdelimited": {
            return typesetDelimited(typesetChild, focus, context);
        }
        case "ztable": {
            return typesetTable(typesetChild, focus, context, zipper);
        }
        default:
            throw new UnreachableCaseError(focus);
    }
};

const typesetNode = (
    node: Editor.types.Node,
    context: Context,
    prevEditNode?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
    padFirstOperator?: boolean,
): Layout.Node => {
    switch (node.type) {
        case "row": {
            // The only time this can happen is if limits.inner is a row
            return typesetRow(node, context);
        }
        case "frac": {
            const typesetChild = getTypesetChildFromNodes(node.children);
            return typesetFrac(typesetChild, node, context);
        }
        case "subsup": {
            return typesetSubsup(
                getTypesetChildFromNodes(node.children),
                node,
                context,
                prevEditNode,
                prevLayoutNode,
            );
        }
        case "root": {
            const typesetChild = getTypesetChildFromNodes(node.children);
            return typesetRoot(typesetChild, node, context);
        }
        case "limits": {
            const typesetChild = getTypesetChildFromNodes(node.children);
            return typesetLimits(typesetChild, node, context, typesetNode);
        }
        case "delimited": {
            const typesetChild = getTypesetChildFromNodes(node.children);
            return typesetDelimited(typesetChild, node, context);
        }
        case "table": {
            const typesetChild = getTypesetChildFromNodes(node.children);
            return typesetTable(typesetChild, node, context);
        }
        case "atom": {
            return maybeAddOperatorPadding(
                prevEditNode,
                node,
                context,
                padFirstOperator,
            );
        }
        default:
            throw new UnreachableCaseError(node);
    }
};

const typesetNodes = (
    nodes: readonly Editor.types.Node[],
    context: Context,
    prevChild?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
    padFirstOperator?: boolean,
): readonly Layout.Node[] => {
    return nodes.map((child, index) => {
        const result = typesetNode(
            child,
            context,
            prevChild,
            prevLayoutNode,
            index === 0 ? padFirstOperator : undefined,
        );
        prevLayoutNode = result;
        prevChild = child;
        return result;
    });
};

const _typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
    padFirstOperator?: boolean,
): Layout.HBox => {
    // The bottommost crumb is the outermost row
    const [crumb, ...restCrumbs] = zipper.breadcrumbs;

    if (crumb) {
        const row = crumb.row;
        const nextZipper: Editor.Zipper = {
            ...zipper,
            breadcrumbs: restCrumbs,
        };
        const nodes: Layout.Node[] = [];

        nodes.push(
            ...typesetNodes(
                row.left,
                context,
                undefined,
                undefined,
                padFirstOperator,
            ),
        );
        nodes.push(
            typesetFocus(
                crumb.focus,
                nextZipper,
                context,
                row.left[row.left.length - 1], // previous edit node
                nodes[nodes.length - 1], // previous layout node
            ),
        );
        nodes.push(
            ...typesetNodes(
                row.right,
                context,
                crumb.focus, // previous edit node
                nodes[nodes.length - 1], // previous layout node
                padFirstOperator,
            ),
        );

        const box = Layout.makeStaticHBox(
            nodes,
            context,
        ) as Mutable<Layout.HBox>;
        box.id = row.id;
        box.style = {
            ...box.style,
            color: row.style.color,
        };

        if (context.renderMode === RenderMode.Dynamic) {
            ensureMinDepthAndHeight(box, context);
        }

        return box;
    } else {
        const row = zipper.row;

        const input = [...row.left, ...row.selection, ...row.right];
        const output = typesetNodes(
            input,
            context,
            undefined,
            undefined,
            padFirstOperator,
        );

        const firstCut = row.left.length;
        const secondCut = firstCut + row.selection.length;

        const left = output.slice(0, firstCut);
        const selection = output.slice(firstCut, secondCut);
        const right = output.slice(secondCut);

        const box = (
            selection.length > 0
                ? Layout.makeSelectionHBox(left, selection, right, context)
                : Layout.makeCursorHBox(left, right, context)
        ) as Mutable<Layout.HBox>;

        box.id = row.id;
        box.style = {
            ...box.style,
            color: row.style.color,
        };

        if (context.renderMode === RenderMode.Dynamic) {
            ensureMinDepthAndHeight(box, context);
        }

        return box;
    }
};

export type Options = {
    readonly showCursor?: boolean;
};

export const typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
    options: Options = {},
): Scene => {
    const box = _typesetZipper(zipper, context) as Layout.HBox;
    return processBox(box, context.fontData, options);
};

export const typeset = (
    node: Editor.types.Node,
    context: Context,
    options: Options = {},
): Scene => {
    const box = typesetNode(node, context) as Layout.HBox;
    return processBox(box, context.fontData, options);
};
