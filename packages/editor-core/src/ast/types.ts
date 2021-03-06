import * as sharedTypes from "../shared-types";

export type Glyph = {
    readonly kind: "glyph";
    readonly char: string;
    readonly pending?: boolean; // TODO: move this into Style
};

export type Style = {
    readonly color?: string;
    readonly cancel?: number; // The ID of the cancel notation
};

type Common = {readonly id: number; readonly style: Readonly<Style>};

export type Row = sharedTypes.Row<Glyph, Common>;
export type Delimited = sharedTypes.Delimited<Glyph, Common>;
export type Table = sharedTypes.Table<Glyph, Common>;
export type SubSup = sharedTypes.SubSup<Glyph, Common>;
export type Limits = sharedTypes.Limits<Glyph, Common>;
export type Frac = sharedTypes.Frac<Glyph, Common>;
export type Root = sharedTypes.Root<Glyph, Common>;
export type Atom = sharedTypes.Atom<Glyph, Common>;

// TODO: split the concept of Node and Children where Children doesn't include
// Row.
export type Node =
    | Row
    | Delimited
    | Table
    | SubSup
    | Limits
    | Frac
    | Root
    | Atom;

// The editor nodes need IDs so we can position the cursor relative to
// layout nodes which get their ID from the editor nodes.

export type HasChildren = Row;

export type Cursor = {
    readonly path: readonly number[];
    // these are indices of the node inside the parent
    readonly prev: number;
    readonly next: number;
};
