import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "@math-blocks/editor-core";
import {comicSans, FontMetricsContext} from "@math-blocks/metrics";

import MathEditor from "../math-editor";

const {row, glyph} = Editor.builders;

export default {
    title: "MathEditor",
    component: MathEditor,
};

type EmptyProps = Record<string, never>;

export const Editable: React.FunctionComponent<EmptyProps> = () => {
    // TODO: write a function to convert a Semantic AST into an Editor AST
    const math = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);

    const zipper: Editor.Zipper = {
        breadcrumbs: [],
        row: {
            id: math.id,
            type: "zrow",
            left: [],
            selection: null,
            right: math.children,
        },
    };

    const fontData = {
        fontMetrics: comicSans,
        fontFamily: "comic sans ms",
    };

    return (
        <FontMetricsContext.Provider value={fontData}>
            <MathEditor
                readonly={false}
                zipper={zipper}
                focus={true}
                onChange={action("onChange")}
                onSubmit={action("onSubmit")}
            />
        </FontMetricsContext.Provider>
    );
};

export const Readonly: React.FunctionComponent<EmptyProps> = () => {
    // TODO: how to convert
    const math = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);

    const zipper: Editor.Zipper = {
        breadcrumbs: [],
        row: {
            id: math.id,
            type: "zrow",
            left: [],
            selection: null,
            right: math.children,
        },
    };

    const fontData = {
        fontMetrics: comicSans,
        fontFamily: "comic sans ms",
    };

    return (
        <FontMetricsContext.Provider value={fontData}>
            <MathEditor readonly={true} zipper={zipper} focus={false} />
        </FontMetricsContext.Provider>
    );
};
