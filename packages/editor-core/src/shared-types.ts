// TODO: make all of these object types readonly

// A = Atom type
// C = Common type
export type Row<A, C> = C & {
    readonly type: "row";
    readonly children: readonly Node<A, C>[];
};

export type Delimited<A, C> = C & {
    readonly type: "delimited";
    readonly children: readonly [Row<A, C>];
    // How do we limit what can be used as a delimiter?s
    readonly leftDelim: Atom<A, C>;
    readonly rightDelim: Atom<A, C>;
};

export type RowStyle = {
    readonly border?: "top" | "bottom";
    readonly alignment?: "top" | "middle" | "bottom";
};

type ColStyle = {
    readonly border?: "left" | "right";
    readonly alignment?: "left" | "center" | "right";
};

export type Table<A, C> = C & {
    readonly type: "table";
    readonly subtype: "matrix" | "algebra";
    readonly children: readonly (Row<A, C> | null)[];
    readonly rowCount: number;
    readonly colCount: number;
    // How do we limit what can be used as a delimiter?s
    readonly delimiters?: {
        readonly left: Atom<A, C>;
        readonly right: Atom<A, C>;
    };
    readonly rowStyles?: readonly (RowStyle | null)[];
    readonly colStyles?: readonly (ColStyle | null)[];
};

export type SubSup<A, C> = C & {
    readonly type: "subsup";
    readonly children: readonly [Row<A, C> | null, Row<A, C> | null]; // subscript, superscript
};

export type Limits<A, C> = C & {
    readonly type: "limits";
    readonly inner: Node<A, C>;
    readonly children: readonly [Row<A, C>, Row<A, C> | null]; // lower, upper
};

export type Frac<A, C> = C & {
    readonly type: "frac";
    readonly children: readonly [Row<A, C>, Row<A, C>]; // numerator, denominator
};

export type Root<A, C> = C & {
    readonly type: "root";
    readonly children: readonly [Row<A, C> | null, Row<A, C>]; // index, radicand
};

export type Atom<A, C> = C & {
    readonly type: "atom";
    readonly value: A;
};

export type Node<A, C> =
    | Row<A, C>
    | Delimited<A, C>
    | Table<A, C>
    | SubSup<A, C>
    | Limits<A, C>
    | Frac<A, C>
    | Root<A, C>
    | Atom<A, C>;
