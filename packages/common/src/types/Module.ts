import { ModuleReference } from './moduleReference';
import * as H from '../contractHelpers';
import { sha256 } from '../hash';

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
    /** The version of the smart contract module. */
    public version: number;
    /** Cache of the parsed WebAssembly module. */
    private wasmModule: WebAssembly.Module | undefined;
    /** Cache of the module reference. */
    private moduleRef: ModuleReference | undefined;

    private constructor(public moduleSource: Buffer) {
        this.version = moduleSource.readInt32LE();
    }

    /**
     * Construct a smart contract module from the module source.
     */
    public static from(moduleSource: Buffer): Module {
        return new Module(moduleSource);
    }

    /** Calculate the module reference from the module source. The module reference is cached. */
    public getModuleRef(): ModuleReference {
        if (this.moduleRef !== undefined) {
            return this.moduleRef;
        }
        const hash = sha256([this.moduleSource]);
        return ModuleReference.fromBytes(hash);
    }

    /** Parse the WebAssembly module in the smart contract module. The parsed module is cached. */
    public getWasmModule(): Promise<WebAssembly.Module> {
        return this.wasmModule !== undefined
            ? Promise.resolve(this.wasmModule)
            : WebAssembly.compile(this.moduleSource.subarray(8));
    }

    /**
     * Build a module interface based on exports from the WebAssembly module.
     * @returns The interface of the smart contract module.
     */
    public async parseModuleInterface(): Promise<ModuleInterface> {
        const map = new Map<string, ContractInterface>();
        const wasmExports = WebAssembly.Module.exports(
            await this.getWasmModule()
        );

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
                continue;
            }
            if (H.isReceiveName(exp.name)) {
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
