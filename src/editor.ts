import {Node, HasChildren} from "./editor-ast";
import {getId} from "./unique-id";

export type EditorCursor = Readonly<{
  path: ReadonlyArray<Node>,
  // these are indices of the node inside the parent
  prev: number | null,
  next: number | null,
}>;

const hasChildren = (node: Node): node is HasChildren => {
  return node.type === "row" || node.type === "parens";
}

const getChildWithId = <T extends {id: number}>(children: T[], childId: number): T | undefined => {
  return children.find(child => child.id === childId);
}

const firstId = <T extends {id: number}>(items: T[]) => items.length > 0 ? items[0].id : null;
const lastId = <T extends {id: number}>(items: T[]) => items.length > 0 ? items[items.length - 1].id : null;

const removeIndex = <T>(array: T[], index: number): T[] => {
  return [
    ...array.slice(0, index),
    ...array.slice(index + 1),
  ];
}

const removeChildWithId = <T extends {id: number}>(children: T[], id: number): T[] => {
  const index = children.findIndex(child => child.id === id);
  return index === -1
    ? children
    : [
      ...children.slice(0, index),
      ...children.slice(index + 1),
    ];
}

const insertBeforeChildWithId = <T extends {id: number}>(children: T[], id: number, newChild: T): T[] => {
  const index = children.findIndex(child => child.id === id);
  return index === -1
    ? children
    : [
      ...children.slice(0, index),
      newChild,
      ...children.slice(index),
    ];
}

const nextId = (children: Node[], childId: number) => {
  const index = children.findIndex(child => child.id === childId);
  if (index === -1) {
    return null;
  }
  return index < children.length - 1 ? children[index + 1].id : null;
}

const prevId = (children: Node[], childId: number) => {
  const index = children.findIndex(child => child.id === childId);
  if (index === -1) {
    return null;
  }
  return index > 0 ? children[index - 1].id : null;
}

const moveLeft = (currentNode: HasChildren, cursor: EditorCursor): EditorCursor => {
  const {children} = currentNode;
  if (cursor.prev != null) {
    const prevNode = getChildWithId(currentNode.children, cursor.prev);
    if (prevNode && prevNode.type === "frac") {
      // enter fraction (denominator)
      return {
        path: [...cursor.path, prevNode, prevNode.denominator],
        next: null,
        prev: lastId(prevNode.denominator.children),
      };
    } else if (prevNode && prevNode.type === "subsup") {
      // enter sup/sub
      if (prevNode.sup) {
        return {
          path: [...cursor.path, prevNode, prevNode.sup],
          next: null,
          prev: lastId(prevNode.sup.children),
        };
      } else if (prevNode.sub) {
        return {
          path: [...cursor.path, prevNode, prevNode.sub],
          next: null,
          prev: lastId(prevNode.sub.children),
        };
      } else {
        throw new Error("subsup node must have at least a sub or sup");
      }
    } else {
      // move to the left
      return {
        path: cursor.path,
        next: cursor.prev,
        prev: prevId(children, cursor.prev),
      };
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if (parent.type === "subsup" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.sup && hasChildren(grandparent)) {
        if (parent.sub) {
          return {
            path: [...cursor.path.slice(0, -1), parent.sub],
            next: null,
            prev: lastId(parent.sub.children),
          };
        } else {
          return {
            path: cursor.path.slice(0, -2),
            next: parent.id,
            prev: prevId(grandparent.children, parent.id),
          };
        }
      } else if (currentNode === parent.sub && hasChildren(grandparent)) {
        return {
          path: cursor.path.slice(0, -2),
          next: parent.id,
          prev: prevId(grandparent.children, parent.id),
        };
      }
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.denominator) {
        // move from denominator to numerator
        return {
          path: [...cursor.path.slice(0, -1), parent.numerator],
          next: null,
          prev: lastId(parent.numerator.children),
        };
      } else if (currentNode === parent.numerator && hasChildren(grandparent)) {
        // exit fraction to the left
        return {
          path: cursor.path.slice(0, -2),
          next: parent.id,
          prev: prevId(grandparent.children, parent.id),
        };
      }
    }
  }
  return cursor;
}

const moveRight = (currentNode: HasChildren, cursor: EditorCursor): EditorCursor => {
  const {children} = currentNode;
  if (cursor.next != null) {
    const nextNode = getChildWithId(currentNode.children, cursor.next);
    if (nextNode && nextNode.type === "frac") {
      // enter fraction (numerator)
      return {
        path: [...cursor.path, nextNode, nextNode.numerator],
        prev: null,
        next: firstId(nextNode.numerator.children),
      };
    } else if (nextNode && (nextNode.type === "subsup")) {
      // enter sup/sub
      if (nextNode.sub) {
        return {
          path: [...cursor.path, nextNode, nextNode.sub],
          prev: null,
          next: firstId(nextNode.sub.children),
        };
      } else if (nextNode.sup) {
        return {
          path: [...cursor.path, nextNode, nextNode.sup],
          prev: null,
          next: firstId(nextNode.sup.children),
        };
      } else {
        throw new Error("subsup node must have at least a sub or sup");
      }
    } else {
      // move to the right
      return {
        path: cursor.path,
        prev: cursor.next,
        next: nextId(children, cursor.next),
      };
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if ((parent.type === "subsup") && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.sub && hasChildren(grandparent)) {
        if (parent.sup) {
          return {
            path: [...cursor.path.slice(0, -1), parent.sup],
            prev: null,
            next: firstId(parent.sup.children),
          };
        } else {
          return {
            path: cursor.path.slice(0, -2),
            prev: parent.id,
            next: nextId(grandparent.children, parent.id),
          };
        }
      } else if (currentNode === parent.sup && hasChildren(grandparent)) {
        return {
          path: cursor.path.slice(0, -2),
          prev: parent.id,
          next: nextId(grandparent.children, parent.id),
        }
      }
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.numerator) {
        // move from numerator to denominator
        return {
          path: [...cursor.path.slice(0, -1), parent.denominator],
          prev: null,
          next: firstId(parent.denominator.children),
        };
      } else if (currentNode === parent.denominator && hasChildren(grandparent)) {
        // exit fraction to the right
        return {
          path: cursor.path.slice(0, -2),
          prev: parent.id,
          next: nextId(grandparent.children, parent.id),
        };
      }
    }
  }
  return cursor;
}

export const createEditor = (root: Node, cursor: EditorCursor, callback: (cursor: EditorCursor) => void) => {
  callback(cursor);

  document.body.addEventListener("keydown", (e) => {  
    const currentNode = cursor.path[cursor.path.length - 1];
    if (!hasChildren(currentNode)) {
      throw new Error("currentNode can't be a glyph, fraction, sup, or sub");
    }
    // TODO: handle deleting from within a sup/sub
  
    switch (e.keyCode) {
      case 37: {
        const newCursor = moveLeft(currentNode, cursor);
        callback(newCursor);
        cursor = newCursor;
        break;
      }
      case 39: {
        const newCursor = moveRight(currentNode, cursor);
        callback(newCursor);
        cursor = newCursor;
        break;
      }
      // backspace
      case 8: {
        if (cursor.prev != null) {
          const removeId = cursor.prev;
          const newCursor = {
            ...cursor,
            prev: prevId(currentNode.children, cursor.prev),
          };
          currentNode.children = removeChildWithId(currentNode.children, removeId);
          callback(newCursor);
          cursor = newCursor;
          return;
        } else if (cursor.path.length > 1) {
          const parent = cursor.path[cursor.path.length - 2];
          const grandparent = cursor.path[cursor.path.length - 3];

          if (parent.type === "subsup") {
            if (!hasChildren(grandparent)) {
              return;
            }

            const index = grandparent.children.findIndex(child => child.id === parent.id);
            const newChildren = index === -1
              ? grandparent.children
              // replace currentNode with currentNode's children
              : [
                ...grandparent.children.slice(0, index),
                ...currentNode.children,
                ...grandparent.children.slice(index + 1),
              ];

            // update cursor
            const next = currentNode.children.length > 0
              ? currentNode.children[0].id
              : nextId(grandparent.children, parent.id);
            const prev = next ? prevId(newChildren, next) : firstId(grandparent.children);
            const newCursor = {
              path: cursor.path.slice(0, -2), // move up two levels
              prev, 
              next,
            };

            // update children
            grandparent.children = newChildren;

            callback(newCursor);
            cursor = newCursor;
            return;
          }
        }
      }
    }

    // don't bother triggering an update
  });

  document.body.addEventListener("keypress", (e) => {  
    const currentNode = cursor.path[cursor.path.length - 1];
    if (currentNode.type === "glyph") {
      throw new Error("current node can't be a glyph");
    }
    if (currentNode.type === "frac") {
      throw new Error("current node can't be a fraction... yet");
    }
    if (currentNode.type === "subsup") {
      throw new Error("current node can't be a subsup... yet");
    }

    const nextNode = cursor.next && hasChildren(currentNode)
      ? currentNode.children.find(child => child.id === cursor.next)
      : null;

    const char = String.fromCharCode(e.keyCode);
    
    let newNode: Node;
    if (char === "/") {
      newNode = {
        id: getId(),
        type: "frac",
        numerator: {
          id: getId(),
          type: "row",
          children: [],
        },
        denominator: {
          id: getId(),
          type: "row",
          children: [],
        },
      }
    } else if (char === "^") {
      if (nextNode && nextNode.type === "subsup") {
        if (!nextNode.sup) {
          nextNode.sup = {
            id: getId(),
            type: "row",
            children: [],
          };
        }
        const newCursor = {
          path: [...cursor.path, nextNode, nextNode.sup],
          prev: null,
          next: firstId(nextNode.sup.children),
        };
        callback(newCursor);
        cursor = newCursor;
        return;
      } else {
        newNode = {
          id: getId(),
          type: "subsup",
          sup: {
            id: getId(),
            type: "row",
            children: [],
          },
        };
      }
    } else if (char === "_") {
      if (nextNode && nextNode.type === "subsup") {
        if (!nextNode.sub) {
          nextNode.sub = {
            id: getId(),
            type: "row",
            children: [],
          };
        }
        const newCursor = {
          path: [...cursor.path, nextNode, nextNode.sub],
          prev: null,
          next: firstId(nextNode.sub.children),
        };
        callback(newCursor);
        cursor = newCursor;
        return;
      } else {
        newNode = {
          id: getId(),
          type: "subsup",
          sub: {
            id: getId(),
            type: "row",
            children: [],
          },
        };
      }
    } else if (char === "*") {
      newNode = {
        id: getId(),
        type: "glyph",
        char: "\u00B7",
      };
    } else if (char === "-") {
      newNode = {
        id: getId(),
        type: "glyph",
        char: "\u2212",
      };
    } else if (char.charCodeAt(0) >= 32) {
      newNode = {
        id: getId(),
        type: "glyph",
        char,
      };
    } else {
      return;
    }

    if (cursor.next == null) {
      currentNode.children.push(newNode);
    } else {
      currentNode.children = insertBeforeChildWithId(currentNode.children, cursor.next, newNode);
    }

    if (newNode.type === "frac") {
      const newCursor = {
        path: [...cursor.path, newNode, newNode.numerator],
        next: null,
        prev: null,
      };
      callback(newCursor);
      cursor = newCursor;
    } else if (newNode.type === "subsup") {
      if (newNode.sup) {
        const newCursor = {
          path: [...cursor.path, newNode, newNode.sup],
          next: null,
          prev: null,
        };
        callback(newCursor);
        cursor = newCursor;
      } else if (newNode.sub) {
        const newCursor = {
          path: [...cursor.path, newNode, newNode.sub],
          next: null,
          prev: null,
        };
        callback(newCursor);
        cursor = newCursor;
      }
    } else {
      const newCursor = {
        ...cursor,
        prev: newNode.id,
      };
      callback(newCursor);
      cursor = newCursor;
    }
  });
}
