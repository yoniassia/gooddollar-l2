"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRITE_METHODS = void 0;
/** Write methods that need a non-readOnly upstream */
exports.WRITE_METHODS = new Set([
    'eth_sendTransaction',
    'eth_sendRawTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTransaction',
    'eth_signTypedData_v4',
]);
//# sourceMappingURL=types.js.map