import {
    AccountAddress,
    CcdAmount,
    ConcordiumGRPCClient,
    ContractAddress,
    ContractName,
    ReceiveName,
} from '@concordium/web-sdk';
import { useEffect, useState } from 'react';

import { errorString } from './error';

/**
 * Data and state of a smart contract.
 */
export interface Info {
    /**
     * Version of the contract's semantics.
     */
    version: number;

    /**
     * The contract's index on the chain.
     */
    index: bigint;

    /**
     * The contract's name without the "init_" prefix.
     */
    name: string;

    /**
     * The contract's balance.
     */
    amount: CcdAmount.Type;

    /**
     * The address of the account that owns the contract.
     */
    owner: AccountAddress.Type;

    /**
     * The contract's invokable methods.
     */
    methods: string[];

    /**
     * The reference identifier of the contract's module.
     */
    moduleRef: string;
}

async function refresh(rpc: ConcordiumGRPCClient, index: bigint): Promise<Info> {
    const info = await rpc.getInstanceInfo(ContractAddress.create(index, BigInt(0)));
    if (!info) {
        throw new Error(`contract ${index} not found`);
    }

    const { version, name, owner, amount, methods, sourceModule } = info;
    return {
        version,
        index,
        name: ContractName.fromInitName(name).value,
        amount,
        owner,
        methods: methods.map(ReceiveName.toString),
        moduleRef: sourceModule.moduleRef,
    };
}

function parseContractIndex(input: string) {
    try {
        return BigInt(input);
    } catch (e) {
        throw new Error(`invalid contract index '${input}'`);
    }
}

async function loadContract(rpc: ConcordiumGRPCClient, input: string) {
    const index = parseContractIndex(input);
    return refresh(rpc, index);
}

/**
 * A {@link useContractSelector} instance.
 */
export interface ContractSelector {
    /**
     * The selected contract info, if available.
     * Is undefined if there isn't any index to look up, during lookup, or the lookup failed.
     * In the latter case {@link error} will be non-empty.
     */
    selected: Info | undefined;

    /**
     * Indicator of whether the lookup is in progress.
     */
    isLoading: boolean;

    /**
     * Error parsing the input string or RPC error looking up the contract.
     */
    error: string;
}

/**
 * React hook to look up a smart contract's data and state from its index.
 * @param rpc gRPC client through which to perform the lookup.
 * @param input The index of the contract to look up.
 * @return The resolved contract and related state.
 */
export function useContractSelector(rpc: ConcordiumGRPCClient | undefined, input: string): ContractSelector {
    const [selected, setSelected] = useState<Info>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        setSelected(undefined);
        setError('');
        if (rpc && input) {
            setIsLoading(true);
            loadContract(rpc, input)
                .then(setSelected)
                .catch((err) => {
                    setError(errorString(err));
                    setSelected(undefined); // prevents race condition against an ongoing successful query
                })
                .finally(() => setIsLoading(false));
        }
    }, [rpc, input]);
    return { selected, isLoading, error };
}
