import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionType,
    Address,
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
} from './util';
import { AccountAddress } from '../types/accountAddress';
import { CcdAmount } from '../types/ccdAmount';
import { TransactionExpiry } from '../types/transactionExpiry';

const getInvoker = (address: Address): ContractAddress | AccountAddress =>
    address.type === 'AddressContract'
        ? address.address
        : new AccountAddress(address.address);

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
                amount: undefined,
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
                amount: undefined,
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
    async transfer(
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
    async updateOperator(
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

    balanceOf(): void {
        throw new Error('Not yet implemented');
    }

    operatorOf(): void {
        throw new Error('Not yet implemented');
    }

    tokenMetadata(): void {
        throw new Error('Not yet implemented');
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
}
