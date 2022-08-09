import { Buffer } from 'buffer/';
import {
    AccountInfo,
    AccountTransaction,
    AccountTransactionSignature,
    buildInvoker,
    ConsensusStatus,
    ContractAddress,
    ContractContext,
    CryptographicParameters,
    InstanceInfo,
    InvokeContractResult,
    NextAccountNonce,
    SignedCredentialDeploymentDetails,
    TransactionStatus,
    TransactionSummary,
    Versioned,
} from './types';
import { AccountAddress } from './types/accountAddress';
import Provider, { JsonRpcResponse } from './providers/provider';
import {
    serializeAccountTransactionForSubmission,
    serializeSignedCredentialDeploymentDetailsForSubmission,
} from './serialization';
import { GtuAmount } from './types/gtuAmount';
import { ModuleReference } from './types/moduleReference';
import {
    buildJsonResponseReviver,
    intToStringTransformer,
    isValidHash,
} from './util';
import { CredentialRegistrationId } from './types/CredentialRegistrationId';

function transformJsonResponse<Result>(
    jsonString: string,
    reviver?: (this: unknown, key: string, value: unknown) => unknown,
    transformer?: (json: string) => string
): JsonRpcResponse<Result | undefined> {
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
        const response = await this.provider.request('getNextAccountNonce', {
            address: accountAddress.address,
        });

        const bigIntPropertyKeys: (keyof NextAccountNonce)[] = ['nonce'];

        const res = transformJsonResponse<NextAccountNonce>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
        return res.result;
    }

    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        const response = await this.provider.request('getTransactionStatus', {
            transactionHash: transactionHash,
        });

        // TODO avoid code duplication with nodejs client
        const bigIntPropertyKeys: (keyof TransactionSummary)[] = [
            'cost',
            'energyCost',
            'index',
        ];

        const res = transformJsonResponse<TransactionStatus>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
        return res.result;
    }

    /**
     * @param serializedTransaction the transaction serialized as a base64-encoded string.
     */
    async sendRawTransaction(serializedTransaction: string): Promise<boolean> {
        const res = await this.provider.request('sendAccountTransaction', {
            transaction: serializedTransaction,
        });
        return JSON.parse(res).result || false;
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
        return this.sendRawTransaction(
            serializedAccountTransaction.toString('base64')
        );
    }

    async sendCredentialDeployment(
        credentialDetails: SignedCredentialDeploymentDetails
    ): Promise<boolean> {
        const serializedDetails =
            serializeSignedCredentialDeploymentDetailsForSubmission(
                credentialDetails
            );
        return this.sendRawTransaction(serializedDetails.toString('base64'));
    }

    async getConsensusStatus(): Promise<ConsensusStatus> {
        const response = await this.provider.request('getConsensusStatus');

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

        const res = transformJsonResponse<ConsensusStatus>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );

        if (!res.result) {
            throw new Error(
                'Nothing was returned when trying to get the consensus status.'
            );
        }

        return res.result;
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
        } else if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const response = await this.provider.request('getInstanceInfo', {
            index: address.index,
            subindex: address.subindex,
            blockHash,
        });

        const result = JSON.parse(response).result;

        if (!result) {
            return undefined;
        }

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
    }

    /**
     * Retrieves the account info for the given account. If the provided block
     * hash is in a block prior to the finalization of the account, then the account
     * information will not be available.
     * A credential registration id can also be provided, instead of an address. In this case
     * the node will return the account info of the account, which the corresponding credential
     * is (or was) deployed to.
     * @param accountAddress base58 account address (or a credential registration id) to get the account info for
     * @param blockHash the block hash to get the account info at
     * @returns the account info for the provided account address, undefined is the account does not exist
     */
    async getAccountInfo(
        accountAddress: AccountAddress | CredentialRegistrationId,
        blockHash?: string
    ): Promise<AccountInfo | undefined> {
        if (!blockHash) {
            const consensusStatus = await this.getConsensusStatus();
            blockHash = consensusStatus.lastFinalizedBlock;
        } else if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const address =
            accountAddress instanceof AccountAddress
                ? accountAddress.address
                : accountAddress.credId;

        const response = await this.provider.request('getAccountInfo', {
            blockHash,
            address,
        });

        const datePropertyKeys = ['timestamp', 'effectiveTime'];
        const bigIntPropertyKeys = [
            'accountAmount',
            'accountNonce',
            'accountIndex',
            'startIndex',
            'total',
            'amount',
            'stakedAmount',
            'bakerId',
            'newStake',
            'epoch',
        ];
        const res = transformJsonResponse<AccountInfo>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );

        return res.result;
    }

    /**
     * Retrieves the global cryptographic parameters on the blockchain at
     * the provided block.
     * @param blockHash the block to get the cryptographic parameters at
     * @returns the global cryptographic parameters at the given block, or undefined it the block does not exist.
     */
    async getCryptographicParameters(
        blockHash?: string
    ): Promise<Versioned<CryptographicParameters> | undefined> {
        if (!blockHash) {
            const consensusStatus = await this.getConsensusStatus();
            blockHash = consensusStatus.lastFinalizedBlock;
        } else if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const response = await this.provider.request(
            'getCryptographicParameters',
            {
                blockHash,
            }
        );

        const res =
            transformJsonResponse<Versioned<CryptographicParameters>>(response);

        return res.result;
    }

    /**
     * Retrieves the source of the given module at
     * the provided block.
     * @param moduleReference the module's reference, which is the hex encoded hash of the source.
     * @param blockHash the block to get the cryptographic parameters at
     * @returns the source of the module as raw bytes.
     */
    async getModuleSource(
        moduleReference: ModuleReference,
        blockHash?: string
    ): Promise<Buffer> {
        if (!blockHash) {
            const consensusStatus = await this.getConsensusStatus();
            blockHash = consensusStatus.lastFinalizedBlock;
        } else if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const response = await this.provider.request('getModuleSource', {
            moduleReference: moduleReference.moduleRef,
            blockHash,
        });

        return Buffer.from(JSON.parse(response).result, 'base64');
    }

    /**
     * Invokes a smart contract.
     * @param context the collection of details used to invoke the contract. Must include the address of the contract and the method invoked.
     * @param blockHash the block hash at which the contract should be invoked at. The contract is invoked in the state at the end of this block.
     * @returns If the node was able to invoke, then a object describing the outcome is returned.
     * The outcome is determined by the `tag` field, which is either `success` or `failure`.
     * The `usedEnergy` field will always be present, and is the amount of NRG was used during the execution.
     * If the tag is `success`, then an `events` field is present, and it contains the events that would have been generated.
     * If invoking a V1 contract and it produces a return value, it will be present in the `returnValue` field.
     * If the tag is `failure`, then a `reason` field is present, and it contains the reason the update would have been rejected.
     * If either the block does not exist, or then node fails to parse of any of the inputs, then undefined is returned.
     */
    async invokeContract(
        contractContext: ContractContext,
        blockHash?: string
    ): Promise<InvokeContractResult | undefined> {
        if (!blockHash) {
            const consensusStatus = await this.getConsensusStatus();
            blockHash = consensusStatus.lastFinalizedBlock;
        } else if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const invoker = buildInvoker(contractContext.invoker);

        const context = {
            ...contractContext,
            invoker,
            amount:
                contractContext.amount && contractContext.amount.microGtuAmount,
            parameter:
                contractContext.parameter &&
                contractContext.parameter.toString('hex'),
        };

        const response = await this.provider.request('invokeContract', {
            blockHash,
            context,
        });

        const bigIntPropertyKeys = ['usedEnergy', 'index', 'subindex'];
        const res = transformJsonResponse<InvokeContractResult>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );

        return res.result;
    }
}
