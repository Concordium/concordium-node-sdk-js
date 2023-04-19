import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionType,
    ContractAddress,
    HexString,
    InvokeContractResult,
    UpdateContractPayload,
} from '../types';
import ConcordiumNodeClient from '../GRPCClient';
import { AccountSigner, signTransaction } from '../signHelpers';
import {
    CIS2TransactionMetadata,
    CIS2Transfer,
    CIS2UpdateOperator,
    serializeCIS2OperatorUpdates,
    serializeCIS2Transfers,
    makeSerializeDynamic,
    CIS2BalanceOfQuery,
    serializeCIS2BalanceOfQueries,
    deserializeCIS2BalanceOfResponse,
    Address,
    isContractAddress,
    getPrintableContractAddress,
    serializeTokenIds,
    deserializeCIS2TokenMetadataResponse,
    CIS2MetadataUrl,
} from './util';
import { AccountAddress } from '../types/accountAddress';
import { CcdAmount } from '../types/ccdAmount';
import { TransactionExpiry } from '../types/transactionExpiry';

const getInvoker = (address: Address): ContractAddress | AccountAddress =>
    isContractAddress(address) ? address : new AccountAddress(address);

const getDefaultExpiryDate = (): Date => {
    const future5Minutes = Date.now() + 5 * 60 * 1000;
    return new Date(future5Minutes);
};

// - Ensure parameter size doesn't exceed 1024 bytes
// - Make dry-run versions of all methods

class CIS2DryRun {
    constructor(
        private grpcClient: ConcordiumNodeClient,
        private contractAddress: ContractAddress,
        private contractName: string
    ) {}

    transfer(
        sender: Address,
        transfer: CIS2Transfer,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    transfer(
        sender: Address,
        transfers: CIS2Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    async transfer(
        sender: Address,
        transfers: CIS2Transfer | CIS2Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const parameter = makeSerializeDynamic(serializeCIS2Transfers)(
            transfers
        );
        return await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                invoker: getInvoker(sender),
                method: `${this.contractName}.transfer`,
            },
            blockHash
        );
    }

    updateOperator(
        owner: Address,
        update: CIS2UpdateOperator,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    updateOperator(
        owner: Address,
        updates: CIS2UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    async updateOperator(
        owner: Address,
        updates: CIS2UpdateOperator | CIS2UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const parameter = makeSerializeDynamic(serializeCIS2OperatorUpdates)(
            updates
        );
        return await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                invoker: getInvoker(owner),
                method: `${this.contractName}.updateOperator`,
            },
            blockHash
        );
    }
}

export class CIS2Contract {
    private dryRunInstance: CIS2DryRun;

    constructor(
        private grpcClient: ConcordiumNodeClient,
        private contractAddress: ContractAddress,
        private contractName: string
    ) {
        this.dryRunInstance = new CIS2DryRun(
            grpcClient,
            contractAddress,
            contractName
        );
    }

    static async create(
        grpcClient: ConcordiumNodeClient,
        contractAddress: ContractAddress
    ): Promise<CIS2Contract> {
        const instanceInfo = await grpcClient.getInstanceInfo(contractAddress);

        if (instanceInfo === undefined) {
            throw new Error(
                `Could not get contract instance info for contract at address ${JSON.stringify(
                    getPrintableContractAddress(contractAddress)
                )}`
            );
        }

        const contractName = instanceInfo.name.substring(5);
        return new CIS2Contract(grpcClient, contractAddress, contractName);
    }

    transfer(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        transfer: CIS2Transfer
    ): Promise<HexString>;
    transfer(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        transfers: CIS2Transfer[]
    ): Promise<HexString>;
    transfer(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        transfers: CIS2Transfer | CIS2Transfer[]
    ): Promise<HexString> {
        return this.invokeReceive(
            'transfer',
            makeSerializeDynamic(serializeCIS2Transfers),
            signer,
            metadata,
            transfers
        );
    }

    updateOperator(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        update: CIS2UpdateOperator
    ): Promise<HexString>;
    updateOperator(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        updates: CIS2UpdateOperator[]
    ): Promise<HexString>;
    updateOperator(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        updates: CIS2UpdateOperator | CIS2UpdateOperator[]
    ): Promise<HexString> {
        return this.invokeReceive(
            'updateOperator',
            makeSerializeDynamic(serializeCIS2OperatorUpdates),
            signer,
            metadata,
            updates
        );
    }

    balanceOf(
        query: CIS2BalanceOfQuery,
        blockHash?: HexString
    ): Promise<bigint>;
    balanceOf(
        queries: CIS2BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint[]>;
    async balanceOf(
        queries: CIS2BalanceOfQuery | CIS2BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint | bigint[]> {
        return this.invokeView(
            'balanceOf',
            makeSerializeDynamic(serializeCIS2BalanceOfQueries),
            deserializeCIS2BalanceOfResponse,
            queries,
            blockHash
        );
    }

    operatorOf(): void {
        throw new Error('Not yet implemented');
    }

    tokenMetadata(
        tokenId: HexString,
        blockHash?: HexString
    ): Promise<CIS2MetadataUrl>;
    tokenMetadata(
        tokenIds: HexString[],
        blockHash?: HexString
    ): Promise<CIS2MetadataUrl[]>;
    tokenMetadata(
        tokenIds: HexString | HexString[],
        blockHash?: HexString
    ): Promise<CIS2MetadataUrl | CIS2MetadataUrl[]> {
        return this.invokeView(
            'tokenMetadata',
            makeSerializeDynamic(serializeTokenIds),
            deserializeCIS2TokenMetadataResponse,
            tokenIds,
            blockHash
        );
    }

    get dryRun(): CIS2DryRun {
        return this.dryRunInstance;
    }

    private async invokeReceive<T>(
        entrypoint: string,
        serializer: (input: T) => Buffer,
        signer: AccountSigner,
        {
            amount = 0n,
            senderAddress,
            nonce,
            energy,
            expiry = getDefaultExpiryDate(),
        }: CIS2TransactionMetadata,
        input: T
    ): Promise<HexString> {
        const parameter = serializer(input);
        const payload: UpdateContractPayload = {
            amount: new CcdAmount(amount),
            address: this.contractAddress,
            receiveName: `${this.contractName}.${entrypoint}`,
            maxContractExecutionEnergy: energy,
            message: parameter,
        };
        const transaction: AccountTransaction = {
            type: AccountTransactionType.Update,
            header: {
                expiry: new TransactionExpiry(expiry),
                nonce,
                sender: new AccountAddress(senderAddress),
            },
            payload,
        };
        const signature = await signTransaction(transaction, signer);
        return this.grpcClient.sendAccountTransaction(transaction, signature);
    }

    private async invokeView<T, R>(
        entrypoint: string,
        serializer: (input: T | T[]) => Buffer,
        deserializer: (input: HexString) => R[],
        input: T | T[],
        blockHash?: HexString
    ): Promise<R | R[]> {
        const parameter = serializer(input);
        const response = await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                method: `${this.contractName}.${entrypoint}`,
            },
            blockHash
        );
        if (
            response === undefined ||
            response.tag === 'failure' ||
            response.returnValue === undefined
        ) {
            throw new Error(
                `Failed to invoke view ${entrypoint} for contract at ${JSON.stringify(
                    this.contractAddress
                )}`
            );
        }

        const values = deserializer(response.returnValue);
        const isListInput = Array.isArray(input);
        const expectedValuesLength = isListInput ? input.length : 1;

        if (values.length !== expectedValuesLength) {
            throw new Error(
                'Mismatch between length of queries in request and values in response.'
            );
        }

        if (isListInput) {
            return values;
        } else {
            return values[0];
        }
    }
}
