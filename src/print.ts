import * as Semantic from "./semantic/semantic";
import {UnreachableCaseError} from "./util";

// TODO: determine when to wrap subexpressions in parens

// NOTE: This is mainly for debugging purposes
const print = (expr: Semantic.Expression): string => {
    switch (expr.type) {
        case "number":
            return expr.value;
        case "identifier":
            return expr.name;

        // Arithmetic operations
        case "add": {
            let result = print(expr.args[0]);
            for (let i = 1; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (arg.type === "neg" && arg.subtraction) {
                    result += " - ";
                } else {
                    result += " + ";
                }
                result += print(arg);
            }
            return result;
        }
        case "mul":
            return expr.args
                .map(arg => {
                    return arg.type === "add" ? `(${print(arg)})` : print(arg);
                })
                .join(" * ");
        case "div":
            return `${print(expr.args[0])} / ${print(expr.args[1])}`;
        case "mod":
            return `${print(expr.args[0])} mod ${print(expr.args[1])}`;
        case "neg": {
            const arg = expr.args[0];
            // Should we wrap an explicit "mul" node in parens too?
            const printedArg =
                arg.type === "add"
                    ? `(${print(expr.args[0])})`
                    : print(expr.args[0]);
            return expr.subtraction ? printedArg : `-${printedArg}`;
        }
        case "root": {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [radicand, index] = expr.args;
            if (index.type === "number" && index.value === "2") {
                return `√(${print(radicand)})`;
            } else {
                // TODO: include the index
                return `√(${print(radicand)})`;
            }
        }
        case "log":
            return `log_${print(expr.args[0])}(${print(expr.args[1])})`;
        case "exp":
            if (expr.args[0].type === "exp") {
                return `(${print(expr.args[0])})^${print(expr.args[1])}`;
            } else {
                return `${print(expr.args[0])}^${print(expr.args[1])}`;
            }
        case "abs":
            return `|${print(expr.args[0])}|`;
        case "func":
            return `${print(expr.func)}(${expr.args.map(print).join(", ")})`;

        case "sum":
            return `Σ_(${print(expr.bvar)}=${print(
                expr.limits.args[0],
            )})^${print(expr.limits.args[1])} ${print(expr.arg)}`;
        case "prod":
            return `Π_(${print(expr.bvar)}=${print(
                expr.limits.args[0],
            )})^${print(expr.limits.args[1])} ${print(expr.arg)}`;
        case "lim":
            return `lim_(${print(expr.bvar)}→${print(expr.target)}) ${print(
                expr.value,
            )}`;
        case "diff": {
            // TODO: handle degree > 1
            return `${print(expr.args[0])}'`;
        }
        case "int":
            return `∫_(${print(expr.limits.args[0])})^(${print(
                expr.limits.args[1],
            )}) ${print(expr.arg)} ${print(expr.bvar)}`;

        case "ellipsis":
            return "⋯";
        case "infinity":
            return "∞";
        case "pi":
            return "π";

        // Numeric relations
        case "eq":
            return expr.args.map(print).join(" = ");
        case "neq":
            return expr.args.map(print).join(" ≠ ");
        case "lt":
            return expr.args.map(print).join(" < ");
        case "lte":
            return expr.args.map(print).join(" ≤ ");
        case "gt":
            return expr.args.map(print).join(" > ");
        case "gte":
            return expr.args.map(print).join(" ≥ ");

        // Logical operations
        case "and":
            return expr.args.map(print).join(" ∧ ");
        case "or":
            return expr.args.map(print).join(" ∨ ");
        case "xor":
            return expr.args.map(print).join(" ⊕ ");
        case "implies":
            return `${print(expr.args[0])} ⇒ ${print(expr.args[1])}`;
        case "iff":
            return `${print(expr.args[0])} ⇔ ${print(expr.args[1])}`;
        case "not":
            return "¬" + print(expr.args[0]);

        // Logical (Boolean) values
        case "true":
            return "T";
        case "false":
            return "F";

        // Sets
        case "set":
            return `{${expr.args.map(print).join(", ")}}`;
        case "union":
            return expr.args.map(print).join(" ⋃ ");
        case "intersection":
            return expr.args.map(print).join(" ⋂ ");
        case "setdiff":
            return `${print(expr.args[0])} ∖ ${print(expr.args[1])}`;
        case "cartesianproduct":
            return expr.args.map(print).join(" × ");

        case "in":
            return `${print(expr.args[0])} ∈ ${print(expr.args[1])}`;
        case "notin":
            return `${print(expr.args[0])} ∉ ${print(expr.args[1])}`;
        case "subset":
            return expr.args.map(print).join(" ⊆ ");
        case "prsubset":
            return expr.args.map(print).join(" ⊂ ");
        case "notsubset":
            return expr.args.map(print).join(" ⊈ ");
        case "notprsubset":
            return expr.args.map(print).join(" ⊄ ");

        case "empty":
            return "∅";
        case "naturals":
            return "ℕ";
        case "integers":
            return "ℤ";
        case "rationals":
            return "ℚ";
        case "reals":
            return "ℝ";
        case "complexes":
            return "ℂ";

        default:
            throw new UnreachableCaseError(expr);
    }
};

export default print;
