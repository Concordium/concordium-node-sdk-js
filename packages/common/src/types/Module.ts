import { ModuleReference } from './moduleReference';
import * as H from '../contractHelpers';
import { sha256 } from '../hash';
import { Buffer } from 'buffer/';
import { VersionedModuleSource } from '../types';

/** Interface of a smart contract containing the name of the contract and every entrypoint. */
export type ContractInterface = {
    /** The name of the smart contract. Note: This does _not_ including the 'init_' prefix. */
    contractName: H.ContractName;
    /** A set of entrypoints exposed by the smart contract. Note: These does _not_ include the '<contractName>.' prefix. */
    entrypointNames: Set<H.EntrypointName>;
};

/** Interface of a smart contract module containing the interface of every contract in the module. */
export type ModuleInterface = Map<H.ContractName, ContractInterface>;

/**
 * A versioned smart contract module.
 */
export class Module {
    /** Reference to the parsed WebAssembly module. Used to reuse an already compiled wasm module. */
    private wasmModule: WebAssembly.Module | undefined;
    /** Reference to the calculated module reference. Used to reuse an already calculated module ref. */
    private moduleRef: ModuleReference | undefined;

    private constructor(
        /** The version of the smart contract module. */
        public version: 0 | 1,
        /** Bytes for the WebAssembly module. */
        public moduleSource: Buffer
    ) {}

    /**
     * Construct a smart contract module object from bytes, potentially read from a file.
     * @param bytes Bytes encoding a versioned smart contract module.
     */
    public static fromRawBytes(bytes: Buffer): Module {
        const version = bytes.readUInt32BE(0);
        const sourceLength = bytes.readUInt32BE(4);
        const moduleSource = bytes.subarray(8, 8 + sourceLength);
        if (moduleSource.length !== sourceLength) {
            throw new Error('Insufficient bytes provided for module.');
        }
        if (version !== 0 && version !== 1) {
            throw new Error(
                `Unsupported module version ${version}, The only supported versions are 0 and 1.`
            );
        }
        return new Module(version, Buffer.from(moduleSource));
    }

    /**
     * Contruct a smart contract module object from a versioned module source.
     * @param versionedModule The versioned module.
     */
    public static fromModuleSource(
        versionedModule: VersionedModuleSource
    ): Module {
        return new Module(versionedModule.version, versionedModule.source);
    }

    /**
     * Calculate the module reference from the module source.
     * A reference to the result is reused in future invocations of this method.
     */
    public getModuleRef(): ModuleReference {
        if (this.moduleRef === undefined) {
            const prefix = Buffer.alloc(8);
            prefix.writeUInt32BE(this.version, 0);
            prefix.writeUInt32BE(this.moduleSource.length, 4);
            const hash = sha256([prefix, this.moduleSource]);
            this.moduleRef = ModuleReference.fromBytes(hash);
        }
        return this.moduleRef;
    }

    /**
     * Parse the WebAssembly module in the smart contract module. The parsed module is cached.
     * A reference to the result is reused in future invocations of this method.
     */
    public async getWasmModule(): Promise<WebAssembly.Module> {
        if (this.wasmModule === undefined) {
            this.wasmModule = await WebAssembly.compile(this.moduleSource);
        }
        return this.wasmModule;
    }

    /**
     * Build a module interface based on exports from the WebAssembly module.
     * @returns The interface of the smart contract module.
     */
    public async parseModuleInterface(): Promise<ModuleInterface> {
        const map = new Map<string, ContractInterface>();
        const wasmModule = await this.getWasmModule();
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
