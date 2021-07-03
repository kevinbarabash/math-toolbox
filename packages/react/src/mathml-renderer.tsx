import * as React from "react";

import * as Semantic from "@math-blocks/semantic";

// pipelines:
// Semantic -> HAST(MathML) -> React/Vue/etc.
// Editor -> HAST(SVG) -> React/Vue/etc.

const print = (math: Semantic.types.Node): React.ReactElement | null => {
    switch (math.type) {
        case "add": {
            // TODO: handle adding parens when necessary (this is kind of link printers we have)
            const children: React.ReactNode[] = [];
            // TODO: give each child a key
            for (const arg of math.args) {
                if (arg.type === "neg" && arg.subtraction) {
                    children.push(<mo>-</mo>);
                } else if (arg.type === "plusminus" && arg.arity === "binary") {
                    children.push(<mo>±</mo>);
                } else {
                    children.push(<mo>+</mo>);
                }
                children.push(print(arg));
            }
            children.shift(); // removes the leading operator
            return <mrow>{children}</mrow>;
        }
        case "mul": {
            const children: React.ReactNode[] = [];
            // TODO: give each child a key
            for (const arg of math.args) {
                const child = print(arg);
                if (arg.type === "add") {
                    children.push(
                        <mrow>
                            <mo>(</mo>
                            {child}
                            <mo>)</mo>
                        </mrow>,
                    );
                } else {
                    children.push(child);
                }
                if (math.implicit) {
                    children.push(<mo>&#x2062;</mo>); // invisible times
                } else {
                    children.push(<mo>&times;</mo>);
                }
            }
            children.pop(); // removes the trailing operator
            return <mrow>{children}</mrow>;
        }
        case "number": {
            return <mn>{math.value}</mn>;
        }
        case "identifier": {
            if (math.subscript) {
                return (
                    <msub>
                        <mi>{math.name}</mi>
                        {print(math.subscript)}
                    </msub>
                );
            } else {
                return <mi>{math.name}</mi>;
            }
        }
        case "neg": {
            const arg = print(math.arg);
            return math.subtraction ? (
                arg
            ) : (
                <mrow>
                    <mo>-</mo>
                    {arg}
                </mrow>
            );
        }
        case "plusminus": {
            const arg = print(math.arg);
            return math.arity === "binary" ? (
                arg
            ) : (
                <mrow>
                    <mo>±</mo>
                    {arg}
                </mrow>
            );
        }
        case "eq": {
            const children: React.ReactNode[] = [];
            // TODO: give each child a key
            for (const arg of math.args) {
                children.push(print(arg));
                children.push(<mo>=</mo>);
            }
            children.pop(); // removes the trailing &equals;
            return <mrow>{children}</mrow>;
        }
        case "div": {
            // TODO: fraction from division using the division operator
            // TODO: remove <mrow> wrapper on children
            return (
                <mfrac>
                    {print(math.args[0])}
                    {print(math.args[1])}
                </mfrac>
            );
        }
        case "pow": {
            // TODO: check if math.base is an identifier with a subscript and
            // use msubsup in that situation
            return (
                <msup>
                    {print(math.base)}
                    {print(math.exp)}
                </msup>
            );
        }
        case "root": {
            if (math.sqrt) {
                // TODO: remove extra <mrow>
                return <msqrt>{print(math.radicand)}</msqrt>;
            } else {
                return (
                    <mroot>
                        {print(math.radicand)}
                        {print(math.index)}
                    </mroot>
                );
            }
        }
        default: {
            return null;
        }
    }
};

type Props = {
    readonly math: Semantic.types.Node | null;
    readonly style?: React.CSSProperties;
};

const MathmlRenderer = React.forwardRef<HTMLElement, Props>((props, ref) => {
    const {math, style} = props;

    if (!math) {
        return null;
    }
    return (
        <math
            xmlns="http://www.w3.org/1998/Math/MathML"
            ref={ref}
            style={style}
        >
            {print(math)}
        </math>
    );
});

MathmlRenderer.displayName = "MathmlRenderer";

export default MathmlRenderer;
