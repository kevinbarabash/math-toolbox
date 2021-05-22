import {getId} from "@math-blocks/core";

import * as builders from "../builders";

import * as util from "./util";
import type {Zipper, Focus, Breadcrumb} from "./types";

export const root = (zipper: Zipper, withIndex: boolean): Zipper => {
    const {selection} = zipper.row;

    const focus: Focus = withIndex
        ? {
              id: getId(),
              type: "zroot",
              left: [],
              right: [builders.row([])],
          }
        : {
              id: getId(),
              type: "zroot",
              left: [null],
              right: [],
          };

    const crumb: Breadcrumb = {
        row: {
            type: "bcrow",
            id: zipper.row.id,
            left: zipper.row.left,
            right: zipper.row.right,
        },
        focus,
    };

    return {
        ...zipper,
        breadcrumbs: [...zipper.breadcrumbs, crumb],
        row: util.zrow(getId(), selection, []),
    };
};
