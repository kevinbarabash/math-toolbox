import * as React from "react";

import {MathEditor, MathKeypad, FontDataContext} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";
import {parse, getFontData} from "@math-blocks/opentype";
import type {FontData} from "@math-blocks/opentype";
import {RadicalDegreeAlgorithm} from "@math-blocks/typesetter";

import {examples} from "./examples";

const EditorPage: React.FunctionComponent = () => {
    const [stixFontData, setStixFontData] = React.useState<FontData | null>(
        null,
    );
    const [lmFontData, setLmFontData] = React.useState<FontData | null>(null);
    const [bonumFontData, setBonumFontData] = React.useState<FontData | null>(
        null,
    );
    const [
        pagellaFontData,
        setPagellaFontData,
    ] = React.useState<FontData | null>(null);
    const [scholaFontData, setScholaFontData] = React.useState<FontData | null>(
        null,
    );
    const [termesFontData, setTermesFontData] = React.useState<FontData | null>(
        null,
    );
    const [fontIndex, setFontIndex] = React.useState<number>(0);

    const [zipper, setZipper] = React.useState<Editor.Zipper>({
        breadcrumbs: [],
        row: {
            id: examples[0].id,
            type: "zrow",
            left: [],
            selection: [],
            right: examples[0].children,
        },
    });

    const [radicalDegreeAlgorithm, setRadicalDegreeAlgorithm] = React.useState<
        RadicalDegreeAlgorithm
    >(RadicalDegreeAlgorithm.OpenType);

    const [debug, setDebug] = React.useState<boolean>(false);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/STIX2Math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            setStixFontData(getFontData(font, "STIX2"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/latinmodern-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            setLmFontData(getFontData(font, "LM-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyrebonum-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            setBonumFontData(getFontData(font, "Bonum-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyrepagella-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            setPagellaFontData(getFontData(font, "Pagella-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyreschola-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            setScholaFontData(getFontData(font, "Schola-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyretermes-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            setTermesFontData(getFontData(font, "Termes-Math"));
        };

        loadFont();
    }, []);

    if (
        !stixFontData ||
        !lmFontData ||
        !bonumFontData ||
        !pagellaFontData ||
        !scholaFontData ||
        !termesFontData
    ) {
        return null;
    }

    const fonts = [
        stixFontData,
        lmFontData,
        bonumFontData,
        pagellaFontData,
        scholaFontData,
        termesFontData,
    ];
    const fontData = fonts[fontIndex];
    const fontSize = 64;

    // TODO:
    // - render glyphs using <path> and <text> side by side to compare their size
    // - fix radical and index positioning

    return (
        <FontDataContext.Provider value={fontData}>
            <MathEditor
                fontSize={fontSize}
                readonly={false}
                zipper={zipper}
                radicalDegreeAlgorithm={radicalDegreeAlgorithm}
                debug={debug}
            />
            <br />
            <br />
            <div style={{fontFamily: "Bonum-Math", fontSize: fontSize}}></div>
            <div style={{display: "flex", alignItems: "center"}}>
                <span style={{fontFamily: "sans-serif", paddingRight: 8}}>
                    Example:{" "}
                </span>
                <select
                    onChange={(e) => {
                        const index = parseInt(e.target.value);
                        const example = examples[index];
                        const zipper: Editor.Zipper = {
                            breadcrumbs: [],
                            row: {
                                id: example.id,
                                type: "zrow",
                                left: [],
                                selection: [],
                                right: example.children,
                            },
                        };
                        setZipper(zipper);
                    }}
                    defaultValue={0}
                >
                    <option value={0}>Adding Fractions</option>
                    <option value={1}>Simple Equation</option>
                    <option value={2}>All Node Types</option>
                    <option value={3}>Tall Delimiters</option>
                    <option value={4}>Nested Fractions</option>
                </select>
                <span
                    style={{
                        fontFamily: "sans-serif",
                        paddingRight: 8,
                        marginLeft: 32,
                    }}
                >
                    Font:{" "}
                </span>
                <select
                    onChange={(e) => setFontIndex(parseInt(e.target.value))}
                    defaultValue={fontIndex}
                >
                    <option value={0}>STIX2</option>
                    <option value={1}>Latin Modern</option>
                    <option value={2}>Gyre Bonum</option>
                    <option value={3}>Gyre Pagella</option>
                    <option value={4}>Gyre Schola</option>
                    <option value={5}>Gyre Termes</option>
                </select>
                <span
                    style={{
                        fontFamily: "sans-serif",
                        paddingRight: 8,
                        marginLeft: 32,
                    }}
                >
                    Radical Degree Algorithm:{" "}
                </span>
                <select
                    onChange={(e) =>
                        setRadicalDegreeAlgorithm(parseInt(e.target.value))
                    }
                    defaultValue={RadicalDegreeAlgorithm.OpenType}
                >
                    <option value={RadicalDegreeAlgorithm.OpenType}>
                        OpenType
                    </option>
                    <option value={RadicalDegreeAlgorithm.MathML}>
                        MathML/Word
                    </option>
                </select>
                <span
                    style={{
                        fontFamily: "sans-serif",
                        paddingRight: 8,
                        marginLeft: 32,
                    }}
                >
                    Debug
                </span>
                <input
                    type="checkbox"
                    onChange={(e) => setDebug(e.target.checked)}
                ></input>
            </div>
            <div style={{position: "fixed", bottom: 0, left: 0}}>
                {/* <EditingPanel /> */}
                <div style={{height: 8}} />
                <MathKeypad />
            </div>
        </FontDataContext.Provider>
    );
};

export default EditorPage;
