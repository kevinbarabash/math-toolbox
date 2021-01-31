// A = Atom type
// C = Common type
export type Row<A, C> = C & {
    type: "row";
    children: Node<A, C>[];
};

export type SubSup<A, C> = C & {
    type: "subsup";
    children: readonly [Row<A, C> | null, Row<A, C> | null]; // sub, sup
};

export type Limits<A, C> = C & {
    type: "limits";
    inner: Node<A, C>;
    children: readonly [Row<A, C>, Row<A, C> | null]; // lower, upper
};

export type Frac<A, C> = C & {
    type: "frac";
    children: readonly [Row<A, C>, Row<A, C>]; // numerator, denominator
};

export type Root<A, C> = C & {
    type: "root";
    // TODO: reverse the order so that we can enter the index from the left
    // when there is one
    children: readonly [Row<A, C> | null, Row<A, C>]; // radicand, index
};

export type Atom<A, C> = C & {
    type: "atom";
    value: A;
};

export type Node<A, C> =
    | Row<A, C>
    | SubSup<A, C>
    | Limits<A, C>
    | Frac<A, C>
    | Root<A, C>
    | Atom<A, C>;
