import { useEffect, useState } from 'react';
import { AccountAddress, CcdAmount, JsonRpcClient } from '@concordium/web-sdk';

export interface Info {
    version: number;
    index: bigint;
    name: string;
    amount: CcdAmount;
    owner: AccountAddress;
    methods: string[];
    moduleRef: string;
}

async function refresh(rpc: JsonRpcClient, index: bigint) {
    console.debug(`Refreshing info for contract ${index.toString()}`);
    const info = await rpc.getInstanceInfo({ index, subindex: BigInt(0) });
    if (!info) {
        throw new Error(`contract ${index} not found`);
    }

    const { version, name, owner, amount, methods, sourceModule } = info;
    const prefix = 'init_';
    if (!name.startsWith(prefix)) {
        throw new Error(`name "${name}" doesn't start with "init_"`);
    }
    return { version, index, name: name.substring(prefix.length), amount, owner, methods, moduleRef: sourceModule.moduleRef };
}

function parseContractIndex(input: string) {
    try {
        return BigInt(input);
    } catch (e) {
        throw new Error(`invalid contract index '${input}'`);
    }
}

async function loadContract(rpc: JsonRpcClient, input: string) {
    const index = parseContractIndex(input);
    return refresh(rpc, index);
}

export function useContractSelector(rpc: JsonRpcClient | undefined) {
    const [selected, setSelected] = useState<Info>();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string>();
    useEffect(() => {
        setSelected(undefined);
        setValidationError('');
        if (rpc && input) {
            setIsLoading(true);
            loadContract(rpc, input)
                .then(setSelected)
                .catch((err) => {
                    setValidationError((err as Error).message);
                    setSelected(undefined); // prevents race condition against an ongoing successful query
                })
                .finally(() => setIsLoading(false));
        }
    }, [rpc, input]);
    return { selected, input, setInput, isLoading, validationError };
}
