import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionSignature,
    ConsensusStatus,
    ContractAddress,
    InstanceInfo,
    NextAccountNonce,
    TransactionStatus,
} from './types';
import { AccountAddress } from './types/accountAddress';
import Provider, { JsonRpcResponse } from './providers/provider';
import { serializeAccountTransactionForSubmission } from './serialization';
import { GtuAmount } from './types/gtuAmount';
import { ModuleReference } from './types/moduleReference';
import { buildJsonResponseReviver, intToStringTransformer } from './util';

function handleResponse<R>(
    res: JsonRpcResponse,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: (res: any) => R = (result) => result
): R | undefined {
    if (res.error) {
        throw new Error(res.error.code + ': ' + res.error.message);
    } else if (res.result) {
        return transform(res.result);
    }
    return undefined;
}

function transformJsonResponse(
    jsonString: string,
    reviver?: (this: unknown, key: string, value: unknown) => unknown,
    transformer?: (json: string) => string
) {
    if (jsonString === 'null') {
        return undefined;
    }

    if (transformer) {
        const transformedJson = transformer(jsonString);
        return JSON.parse(transformedJson, reviver);
    }

    return JSON.parse(jsonString, reviver);
}

export class JsonRpcClient {
    provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async getNextAccountNonce(
        accountAddress: AccountAddress
    ): Promise<NextAccountNonce | undefined> {
        const res = await this.provider.request('getNextAccountNonce', {
            address: accountAddress.address,
        });
        return handleResponse(res, (result) => ({
            nonce: BigInt(result.nonce),
            allFinal: result.allFinal,
        }));
    }

    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        const res = await this.provider.request('getTransactionStatus', {
            transactionHash: transactionHash,
        });
        return handleResponse(res);
    }

    async sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean> {
        const serializedAccountTransaction: Buffer = Buffer.from(
            serializeAccountTransactionForSubmission(
                accountTransaction,
                signatures
            )
        );
        const res = await this.provider.request('sendAccountTransaction', {
            transaction: serializedAccountTransaction.toString('base64'),
        });
        return handleResponse(res) || false;
    }

    async getConsensusStatus(): Promise<ConsensusStatus> {
        const response = await this.provider.request('getConsensusStatus', {});

        // TODO Avoid code duplication with nodejs client
        const datePropertyKeys: (keyof ConsensusStatus)[] = [
            'blockLastReceivedTime',
            'blockLastArrivedTime',
            'genesisTime',
            'currentEraGenesisTime',
            'lastFinalizedTime',
        ];
        const bigIntPropertyKeys: (keyof ConsensusStatus)[] = [
            'epochDuration',
            'slotDuration',
            'bestBlockHeight',
            'lastFinalizedBlockHeight',
            'finalizationCount',
            'blocksVerifiedCount',
            'blocksReceivedCount',
            'protocolVersion',
        ];

        return handleResponse(response, (r) =>
            transformJsonResponse(
                JSON.stringify(r),
                buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
                intToStringTransformer(bigIntPropertyKeys)
            )
        );
    }

    /**
     * Retrieve information about a given smart contract instance.
     * @param blockHash the block hash to get the smart contact instances at
     * @param address the address of the smart contract
     * @returns A JSON object with information about the contract instance
     */
    async getInstanceInfo(
        address: ContractAddress,
        blockHash?: string
    ): Promise<InstanceInfo | undefined> {
        if (!blockHash) {
            const consensusStatus = await this.getConsensusStatus();
            blockHash = consensusStatus.lastFinalizedBlock;
        }

        const res = await this.provider.request('getInstanceInfo', {
            address: `{"subindex":${address.subindex},"index":${address.index}}`,
            blockHash,
        });
        return handleResponse(res, (result) => {
            // TODO: Avoid code duplication with nodejs client
            const common = {
                amount: new GtuAmount(BigInt(result.amount)),
                sourceModule: new ModuleReference(result.sourceModule),
                owner: new AccountAddress(result.owner),
                methods: result.methods,
                name: result.name,
            };

            switch (result.version) {
                case 1:
                    return {
                        version: 1,
                        ...common,
                    };
                case undefined:
                case 0:
                    return {
                        version: 0,
                        ...common,
                        model: Buffer.from(result.model, 'hex'),
                    };
                default:
                    throw new Error(
                        'InstanceInfo had unsupported version: ' +
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (result as any).version
                    );
            }
        });
    }
}
