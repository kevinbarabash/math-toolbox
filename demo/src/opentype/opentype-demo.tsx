import * as React from "react";
import {parse} from "@math-blocks/opentype";

import type {Font, Glyph, Path} from "@math-blocks/opentype";

const getPath = (glyph: Glyph): string => {
    let result = "";

    // The glyph's path is in font units.
    const path = glyph.path;

    for (const cmd of path) {
        if (cmd.type === "M") {
            result += `M ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "L") {
            result += `L ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "C") {
            result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
        } else if (cmd.type === "Q") {
            result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
        } else {
            result += "Z";
        }
    }

    return result;
};

const lerp = (a: number, b: number, amount: number): number => {
    return amount * b + (1 - amount) * a;
};

const lerpPath = (path1: Path, path2: Path, amount: number): string => {
    const commands: Path = [];

    for (let i = 0; i < path1.length; i++) {
        const cmd1 = path1[i];
        const cmd2 = path2[i];

        if (cmd1.type === "M" && cmd2.type === "M") {
            commands.push({
                type: "M",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
            });
        } else if (cmd1.type === "L" && cmd2.type === "L") {
            commands.push({
                type: "L",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
            });
        } else if (cmd1.type === "C" && cmd2.type === "C") {
            commands.push({
                type: "C",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
                x1: lerp(cmd1.x1, cmd2.x1, amount),
                y1: lerp(cmd1.y1, cmd2.y1, amount),
                x2: lerp(cmd1.x2, cmd2.x2, amount),
                y2: lerp(cmd1.y2, cmd2.y2, amount),
            });
        } else if (cmd1.type === "Q" && cmd2.type === "Q") {
            commands.push({
                type: "Q",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
                x1: lerp(cmd1.x1, cmd2.x1, amount),
                y1: lerp(cmd1.y1, cmd2.y1, amount),
            });
        } else if (cmd1.type === "Z" && cmd2.type === "Z") {
            commands.push({
                type: "Z",
            });
        } else {
            throw new Error("Command type mismatch");
        }
    }

    let result = "";

    for (const cmd of commands) {
        if (cmd.type === "M") {
            result += `M ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "L") {
            result += `L ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "C") {
            result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
        } else if (cmd.type === "Q") {
            result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
        } else {
            result += "Z";
        }
    }

    return result;
};

const makeAssembly = (font: Font, char: string): React.ReactNode => {
    /**
     * Steps:
     *
     * 1. Assemble all parts with all extenders removed and with connections
     * overlapping by the maximum amount. This gives the smallest possible result.
     *
     * 2. Determine how much extra width/height can be obtained from all existing
     * connections between neighboring parts by using minimal overlaps. If that
     * is enough to achieve the size goal, extend each connection equally by
     * changing overlaps of connectors to finish the job.
     *
     * 3. If all connections have been extended to the minimum overlap and further
     * growth is needed, add one of each extender, and repeat the process from
     * the first step.
     */
    const glyphID = font.getGlyphID(char);
    const c = font.math.variants.getVertGlyphConstruction(glyphID);

    const fontSize = 72;
    const scale = fontSize / font.head.unitsPerEm;

    const minConnectorOverlap = scale * font.math.variants.minConnectorOverlap;

    console.log(c);
    console.log(font.math.variants);

    if (c?.glyphAssembly?.partRecords) {
        const parts = c.glyphAssembly.partRecords;

        const getSize = (extendCount: number): number => {
            const extenderParts = parts.filter(
                (part) => part.partsFlags & 0x0001,
            );
            const fixedParts = parts.filter(
                (part) => !(part.partsFlags & 0x0001),
            );

            let sum = 0;
            for (const part of fixedParts) {
                sum += scale * part.fullAdvance;
            }

            for (let i = 0; i < extendCount; i++) {
                for (const part of extenderParts) {
                    sum += scale * part.fullAdvance;
                }
            }

            return (
                sum -
                (fixedParts.length + extendCount * extenderParts.length - 1) *
                    minConnectorOverlap
            );
        };

        // glyphs are arrange from bottom to top

        for (let i = 0; i < parts.length; i++) {
            const height = scale * parts[i].fullAdvance;
            console.log(`height = ${height}`);
        }

        let y = 550;
        const extendCount = 0;
        const paths = [];
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.partsFlags === 0) {
                paths.push(
                    <path
                        transform={`translate(150, ${y}) scale(${scale}, -${scale})`}
                        d={getPath(font.getGlyph(parts[i].glyphID))}
                    />,
                );

                let advance = scale * part.fullAdvance;
                if (i !== parts.length - 1) {
                    advance = advance - minConnectorOverlap;
                }

                y = y - advance;
            } else if (part.partsFlags === 1 && extendCount > 0) {
                /// pass
            }
        }

        const height = 550 - y;
        console.log(`height = ${height}`);

        console.log(`extendCount = 0 - size = ${getSize(0)}`);
        console.log(`extendCount = 1 - size = ${getSize(1)}`);
        console.log(`extendCount = 2 - size = ${getSize(2)}`);
        console.log(`extendCount = 3 - size = ${getSize(3)}`);
        console.log(`extendCount = 4 - size = ${getSize(4)}`);

        // TODO: compute a formula for the height max height based on the number
        // of extensions there are, starting with 0.

        // We subtract (n - 1) * minConnectorOverlap from the overall height of
        // the assembly where `n` is the number of parts used.

        // Steps:
        // 1: loop through the parts and count the number of non-extension parts
        // 2: compute the size of the assembly without extensions
        // 3: compute the size of adding in one extension for each extension part
        // 4:

        // reverses the paint order
        paths.reverse();

        paths.push(
            <path
                transform={`translate(250, 500) scale(${scale}, -${scale})`}
                d={getPath(font.getGlyph(parts[1].glyphID))}
            />,
        );

        paths.push(
            <path
                transform={`translate(250, 400) scale(${scale}, -${scale})`}
                d={getPath(font.getGlyph(parts[3].glyphID))}
            />,
        );

        return <g>{paths}</g>;
    } else {
        return null;
    }
};

const OpenTypeDemo: React.FC = () => {
    const [font, setFont] = React.useState<Font | null>(null);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/STIX2Math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setFont(font);
        };

        loadFont();
    }, []);

    if (font) {
        const children = [];

        const glyphs = {
            LEFT_PAREN: {
                start: 1301,
                count: 11, // there's 12 but we're counting from 0
            },
            LEFT_BRACE: {
                start: 1349,
                count: 10, // there's actually 11 when counting from 0
            },
        };

        const count = glyphs.LEFT_BRACE.count;
        const start = glyphs.LEFT_BRACE.start;
        const end = start + count;

        const fontSize = 72;
        const scale = fontSize / font.head.unitsPerEm;

        for (let i = 0; i <= count; i++) {
            const d = getPath(font.getGlyph(start + i));
            children.push(
                <path
                    key={start + i}
                    d={d}
                    transform={`translate(${
                        i * 50
                    }, 0) scale(${scale}, -${scale})`}
                />,
            );
        }

        const lerpChildren = [];

        const d1 = font.getGlyph(start);
        const d12 = font.getGlyph(end);

        for (let i = 0; i <= count + 5; i++) {
            const d = lerpPath(d1.path, d12.path, i / count);
            lerpChildren.push(
                <path
                    key={start + i}
                    d={d}
                    transform={`translate(${
                        i * 50
                    }, 0) scale(${scale}, -${scale})`}
                />,
            );
        }

        const surdChildren = [];

        const surd = font.getGlyph(1657);
        const surd4 = font.getGlyph(1660);

        // overshoot by twice
        for (let i = 0; i <= 12 + 12; i++) {
            const d = lerpPath(surd.path, surd4.path, i / 12);
            surdChildren.push(
                <path
                    key={start + i}
                    d={d}
                    transform={`translate(${
                        i * 25
                    }, 0) scale(${scale}, -${scale})`}
                />,
            );
        }

        const intPath = lerpPath(
            font.getGlyph(1701).path,
            font.getGlyph(1702).path,
            0.5,
        );

        const gid = 3354;
        const glyph = font.getGlyph(gid);

        let parenPath = "";
        for (const cmd of glyph.path) {
            if (cmd.type === "M") {
                parenPath += `M ${cmd.x},${cmd.y} `;
            } else if (cmd.type === "L") {
                parenPath += `L ${cmd.x},${cmd.y} `;
            } else if (cmd.type === "C") {
                parenPath += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
            } else if (cmd.type === "Q") {
                parenPath += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
            } else {
                parenPath += "Z";
            }
        }

        const metrics = font.getGlyphMetrics(gid);
        metrics.bearingX *= scale;
        metrics.bearingY *= scale;
        metrics.width *= scale;
        metrics.height *= scale;

        return (
            <svg viewBox="0 0 1024 1024" width={1024} height={1024}>
                <g fill="currentcolor">
                    {makeAssembly(font, "}")}
                    <g style={{visibility: "hidden"}}>
                        <path
                            transform={`translate(100, 150) scale(${scale}, -${scale})`}
                            d={intPath}
                        />
                        <path
                            transform={`translate(150, 150) scale(${scale}, -${scale})`}
                            d={getPath(font.getGlyph(3354))}
                        />
                        <path
                            transform={`translate(200, 150) scale(${scale}, -${scale})`}
                            d={getPath(font.getGlyph(3329))}
                        />
                        <path
                            transform={`translate(250, 150)  scale(${scale}, -${scale})`}
                            d={getPath(font.getGlyph(1679))}
                        />
                        <g fill="blue" transform="translate(15, 512)">
                            {children}
                        </g>
                        <g fill="red" transform="translate(30, 512)">
                            {lerpChildren}
                        </g>
                        <g transform="translate(15, 800)">{surdChildren}</g>
                    </g>
                    <path
                        transform={`translate(500, 1000) scale(${scale}, -${scale})`}
                        d={getPath(font.getGlyph(1661))}
                    />
                    <path
                        transform={`translate(500, 800) scale(${scale}, -${scale})`}
                        d={getPath(font.getGlyph(1662))}
                    />
                    <path
                        transform={`translate(500, 850) scale(${scale}, -${scale})`}
                        d={getPath(font.getGlyph(1664))}
                    />
                    {/* uni221A.var is a variant for sqrt without overbar */}
                    <g style={{visibility: "hidden"}}>
                        <path
                            transform={`translate(600, 1000) scale(${scale}, -${scale})`}
                            d={getPath(font.getGlyph(1663))}
                        />
                        <rect
                            x={150 + metrics.bearingX}
                            // bearingY is the distance up from the origin, but SVG
                            // has the y-axis pointing down whereas fonts have the
                            // y-axis pointing up.
                            y={200 - metrics.bearingY}
                            width={metrics.width}
                            height={metrics.height}
                            fill="transparent"
                            stroke="orange"
                        />
                        <path
                            transform={`translate(150, 200) scale(${scale}, ${-scale})`}
                            d={parenPath}
                        />
                        <ellipse cx={150} cy={200} rx={3} ry={3} fill="blue" />
                    </g>
                </g>
            </svg>
        );
    }

    return <h1>Loading font...</h1>;
};

export default OpenTypeDemo;
