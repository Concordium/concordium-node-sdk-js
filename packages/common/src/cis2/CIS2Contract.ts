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
    serializeCIS2TokenIds,
    deserializeCIS2TokenMetadataResponse,
    CIS2MetadataUrl,
    CIS2OperatorOfQuery,
    serializeCIS2OperatorOfQueries,
    deserializeCIS2OperatorOfResponse,
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
    transfer(
        sender: Address,
        transfers: CIS2Transfer | CIS2Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'transfer',
            getInvoker(sender),
            serializeCIS2Transfers,
            transfers,
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
    updateOperator(
        owner: Address,
        updates: CIS2UpdateOperator | CIS2UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'updateOperator',
            getInvoker(owner),
            serializeCIS2OperatorUpdates,
            updates,
            blockHash
        );
    }

    private invokeMethod<T>(
        entrypoint: string,
        invoker: ContractAddress | AccountAddress,
        serializer: (input: T[]) => Buffer,
        input: T | T[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const parameter = makeSerializeDynamic(serializer)(input);
        return this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                invoker,
                method: `${this.contractName}.${entrypoint}`,
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
            serializeCIS2Transfers,
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
            serializeCIS2OperatorUpdates,
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
            serializeCIS2BalanceOfQueries,
            deserializeCIS2BalanceOfResponse,
            queries,
            blockHash
        );
    }

    operatorOf(
        queries: CIS2OperatorOfQuery,
        blockHash?: HexString
    ): Promise<boolean>;
    operatorOf(
        queries: CIS2OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean[]>;
    operatorOf(
        queries: CIS2OperatorOfQuery | CIS2OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean | boolean[]> {
        return this.invokeView(
            'operatorOf',
            serializeCIS2OperatorOfQueries,
            deserializeCIS2OperatorOfResponse,
            queries,
            blockHash
        );
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
            serializeCIS2TokenIds,
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
        serializer: (input: T[]) => Buffer,
        signer: AccountSigner,
        {
            amount = 0n,
            senderAddress,
            nonce,
            energy,
            expiry = getDefaultExpiryDate(),
        }: CIS2TransactionMetadata,
        input: T | T[]
    ): Promise<HexString> {
        const parameter = makeSerializeDynamic(serializer)(input);
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
        serializer: (input: T[]) => Buffer,
        deserializer: (input: HexString) => R[],
        input: T | T[],
        blockHash?: HexString
    ): Promise<R | R[]> {
        const parameter = makeSerializeDynamic(serializer)(input);
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
