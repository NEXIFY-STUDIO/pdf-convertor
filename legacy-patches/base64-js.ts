// Import real CJS module via separate alias (avoids circular 'base64-js' alias)
import * as mod from 'base64-js-cjs';

type Base64Js = {
  byteLength: (b64: string) => number;
  toByteArray: (b64: string) => Uint8Array;
  fromByteArray: (bytes: Uint8Array) => string;
};

const lib = ((mod as { default?: Base64Js }).default ?? mod) as Base64Js;

const api: Base64Js = {
  byteLength: lib.byteLength.bind(lib),
  toByteArray: lib.toByteArray.bind(lib),
  fromByteArray: lib.fromByteArray.bind(lib),
};

export default api;
export const byteLength = api.byteLength;
export const toByteArray = api.toByteArray;
export const fromByteArray = api.fromByteArray;