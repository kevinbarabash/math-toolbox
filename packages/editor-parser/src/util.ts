import {Location} from "./editor-lexer";

export const locFromRange = (
    start?: Location,
    end?: Location,
): Location | undefined => {
    if (start && end) {
        // TODO: assert start.path === end.path
        return {
            path: start.path,
            start: start.start,
            end: end.end,
        };
    }
    return undefined;
};
