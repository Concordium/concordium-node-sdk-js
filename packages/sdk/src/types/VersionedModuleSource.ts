import { Buffer } from 'buffer/index.js';

import * as H from '../contractHelpers.js';
import { Cursor, deserializeUInt32BE } from '../deserializationHelpers.js';
import { sha256 } from '../hash.js';
import { RawModuleSchema } from '../schemaTypes.js';
import { encodeWord32 } from '../serializationHelpers.js';
import { VersionedModuleSource } from '../types.js';
import { schemaBytesFromWasmModule } from '../util.js';
import * as ModuleReference from './ModuleReference.js';

/** Interface of a smart contract containing the name of the contract and every entrypoint. */
export type ContractInterface = {
    /** The name of the smart contract. Note: This does _not_ including the 'init_' prefix. */
    contractName: H.ContractName;
    /** A set of entrypoints exposed by the smart contract. Note: These do _not_ include the '<contractName>.' prefix. */
    entrypointNames: Set<H.EntrypointName>;
};

/** Interface of a smart contract module containing the interface of every contract in the module. */
export type ModuleInterface = Map<H.ContractName, ContractInterface>;

/**
 * Parse a smart contract module source from bytes, potentially read from a file.
 * @param {ArrayBuffer} buffer Bytes encoding a versioned smart contract module.
 * @throws When provided bytes fails to be parsed or are using an unknown smart contract module version.
 */
export function versionedModuleSourceFromBuffer(buffer: ArrayBuffer): VersionedModuleSource {
    const cursor = Cursor.fromBuffer(buffer);
    const version = deserializeUInt32BE(cursor);
    const sourceLength = deserializeUInt32BE(cursor);
    const source = cursor.read(sourceLength);
    if (version !== 0 && version !== 1) {
        throw new Error(`Unsupported module version ${version}, The only supported versions are 0 and 1.`);
    }
    return {
        version,
        source,
    };
}

/**
 * Serialize a versioned module source. Useful when saving to file.
 * @param {VersionedModuleSource} moduleSource The versioned module source to serialize.
 * @returns {Uint8Array} Buffer with serialized module source.
 */
export function versionedModuleSourceToBuffer(moduleSource: VersionedModuleSource): Uint8Array {
    const versionBytes = encodeWord32(moduleSource.version);
    const lengthBytes = encodeWord32(moduleSource.source.byteLength);
    return Buffer.concat([versionBytes, lengthBytes, moduleSource.source]);
}

/**
 * Calculate the module reference from the module source.
 * @param {VersionedModuleSource} moduleSource The smart contract module source.
 * @returns {ModuleReference} The calculated reference of the module
 */
export function calculateModuleReference(moduleSource: VersionedModuleSource): ModuleReference.Type {
    const prefix = Buffer.alloc(8);
    prefix.writeUInt32BE(moduleSource.version, 0);
    prefix.writeUInt32BE(moduleSource.source.length, 4);
    const hash = sha256([prefix, moduleSource.source]);
    return ModuleReference.fromBuffer(hash);
}

/**
 * Build a module interface based on exports from the WebAssembly module.
 *
 * @param {VersionedModuleSource} moduleSource The smart contract module source.
 * @returns The interface of the smart contract module.
 */
export async function parseModuleInterface(moduleSource: VersionedModuleSource): Promise<ModuleInterface> {
    const wasmModule = await WebAssembly.compile(moduleSource.source);
    const map = new Map<string, ContractInterface>();
    const wasmExports = WebAssembly.Module.exports(wasmModule);

    for (const exp of wasmExports) {
        if (exp.kind !== 'function') {
            continue;
        }
        if (H.isInitName(exp.name)) {
            const contractName = H.getContractNameFromInit(exp.name);
            getOrInsert(map, contractName, {
                contractName: contractName,
                entrypointNames: new Set(),
            });
        } else if (H.isReceiveName(exp.name)) {
            const parts = H.getNamesFromReceive(exp.name);
            const entry = getOrInsert(map, parts.contractName, {
                contractName: parts.contractName,
                entrypointNames: new Set(),
            });
            entry.entrypointNames.add(parts.entrypointName);
        }
    }
    return map;
}

/**
 * Extract the embedded smart contract schema bytes. Returns `null` if no schema is embedded.
 * @param {VersionedModuleSource} moduleSource The smart contract module source.
 * @returns {RawModuleSchema | null} The raw module schema if found.
 */
export async function getEmbeddedModuleSchema(moduleSource: VersionedModuleSource): Promise<RawModuleSchema | null> {
    const wasmModule = await WebAssembly.compile(moduleSource.source);
    const versionedSchema = schemaBytesFromWasmModule(wasmModule, 'concordium-schema');
    if (versionedSchema !== null) {
        return { type: 'versioned', buffer: versionedSchema };
    }
    const unversionedSchemaV0 = schemaBytesFromWasmModule(wasmModule, 'concordium-schema-v1');
    if (unversionedSchemaV0 !== null) {
        return { type: 'unversioned', version: 0, buffer: unversionedSchemaV0 };
    }
    const unversionedSchemaV1 = schemaBytesFromWasmModule(wasmModule, 'concordium-schema-v2');
    if (unversionedSchemaV1 !== null) {
        return { type: 'unversioned', version: 1, buffer: unversionedSchemaV1 };
    }
    return null;
}

/**
 * Get a key from a map, if not present, insert a new value and return this.
 * @param map The map to get or insert into.
 * @param key The key to lookup or insert to.
 * @param value The value to be inserted if nothing is present.
 * @returns The value currently in the map or just insert into it.
 */
function getOrInsert<K, V>(map: Map<K, V>, key: K, value: V): V {
    const current = map.get(key);
    if (current !== undefined) {
        return current;
    }
    map.set(key, value);
    return value;
}
