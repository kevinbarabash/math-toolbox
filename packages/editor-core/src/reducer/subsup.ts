import {getId} from "@math-blocks/core";

import * as util from "./util";
import {Dir} from "./enums";
import type {Zipper} from "./types";

export const subsup = (zipper: Zipper, dir: Dir): Zipper => {
    const {row, breadcrumbs} = zipper;

    if (row.right.length > 0) {
        const [next, ...rest] = row.right;

        if (next.type === "subsup") {
            const [sub, sup] = next.children;

            return {
                ...zipper,
                breadcrumbs: [
                    ...breadcrumbs,
                    {
                        row: {
                            ...row,
                            right: rest,
                        },
                        focus: {
                            id: next.id, // reuse the id of the subsup we're updating
                            type: "zsubsup",
                            dir: dir,
                            other: dir === Dir.Left ? sup : sub,
                        },
                    },
                ],
                row:
                    dir === Dir.Left
                        ? sub
                            ? util.zrow(sub.id, [], sub.children)
                            : util.zrow(getId(), [], [])
                        : sup
                        ? util.zrow(sup.id, [], sup.children)
                        : util.zrow(getId(), [], []),
            };
        }
    }

    return {
        ...zipper,
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: zipper.row,
                focus: {
                    id: getId(),
                    type: "zsubsup",
                    dir: dir,
                    other: null, // this is a new subsup so don't give it a sub
                },
            },
        ],
        row: util.zrow(getId(), [], []),
    };
};
