"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StringUtils {
    static timestamptzToDate(date) {
        return date.getFullYear() + "-" + (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + date.getDate();
    }
}
;
exports.default = StringUtils;
//# sourceMappingURL=string.js.map