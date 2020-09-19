// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";

import * as Editor from "@math-blocks/editor";
import * as Typesetter from "@math-blocks/typesetter";

import fontMetrics from "@math-blocks/metrics";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const {useEffect, useState, useRef} = React;

type Row = Editor.Row<Editor.Glyph, {id: number}>;

// TODO: dedupe with typeset.ts
type Below = {
    lhs: Row;
    rhs: Row;
};

type Props = {
    value: Row;
    work?: Row;
    readonly: boolean;

    // TODO: figure out a better way of handling focus
    focus?: boolean;

    onSubmit?: (value: Row) => unknown;
    onChange?: (value: Row) => unknown;

    /**
     * Style
     */
    style?: React.CSSProperties;
};

export const MathEditor: React.SFC<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);
    const [state, setState] = useState<Editor.State>({
        above: {
            math: props.value,
            cursor: {
                path: [],
                prev: -Infinity,
                next: 0,
            },
            selectionStart: undefined,
            cancelRegions: [],
        },
        below: props.work
            ? {
                  math: props.work,
                  cursor: {
                      path: [],
                      prev: -Infinity,
                      next: 0,
                  },
              }
            : undefined,
        mode: props.work ? "below" : "above",
    });
    useEffect(() => {
        if (props.focus && containerRef.current) {
            containerRef.current.focus();
        }
    }, ["hot"]);

    // update state to match props
    if (!props.focus && active) {
        setActive(false);
    }

    useEventListener("keydown", (e: KeyboardEvent) => {
        if (active && !props.readonly) {
            const action = {
                type: e.key,
                shift: e.shiftKey,
            };
            if (e.key === "Enter" && props.onSubmit) {
                const success = props.onSubmit(state.above.math);
                if (success) {
                    setActive(false);
                }
            } else {
                const value = Editor.reducer(state, action);
                setState(value);
                if (
                    props.onChange &&
                    e.keyCode !== 37 &&
                    e.keyCode !== 38 &&
                    e.keyCode !== 39 &&
                    e.keyCode !== 40
                ) {
                    props.onChange(value.above.math);
                }
            }
        }
    });

    const {cancelRegions} = state.above;
    const {style} = props;

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const box = state.below
        ? Typesetter.typesetWithWork(
              state.above.math,
              state.below.math,
              context,
          )
        : (Typesetter.typeset(state.above.math, {
              fontMetrics,
              baseFontSize: fontSize,
              multiplier: 1.0,
              cramped: false,
          }) as Typesetter.Layout.Box); // TODO: make typeset return a Box

    // @ts-ignore: fix this type error
    const layoutCursor = Editor.layoutCursorFromState(state[state.mode]);

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className={css(styles.container)}
            style={style}
            role="textbox"
        >
            <MathRenderer
                box={box}
                cursor={active ? layoutCursor : undefined}
                cancelRegions={cancelRegions}
            />
        </div>
    );
};

MathEditor.defaultProps = {
    style: {},
};

const styles = StyleSheet.create({
    container: {
        display: "inline-block",
        border: "solid 1px gray",
        outline: "none",
        borderRadius: 4,
        ":focus": {
            border: "solid 1px blue",
        },
        lineHeight: 0,
    },
});

export default MathEditor;
