/**
 * TypeScript declaration to allow importing WebAssembly files as modules.
 * This is used to avoid TypeScript errors when importing .wasm files.
 * Example: import wasmBase64 from '../lib/dapp/web/esm/index_bg.wasm';
 */
declare module "*.wasm" {
  const wasm: string;
  export default wasm;
}