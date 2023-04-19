import { Buffer } from 'buffer/';
import {
    Address,
    ContractAddress,
    HexString,
    InvokeContractResult,
} from '../types';
import ConcordiumNodeClient from '../GRPCClient';
import { AccountSigner } from '../signHelpers';
import {
    CIS2Transfer,
    CIS2UpdateOperator,
    serializeCIS2OperatorUpdates,
    serializeCIS2Transfers,
} from './util';
import { AccountAddress } from '../types/accountAddress';

const DEFAULT_EXECUTION_ENERGY = 10000000n;

const getInvoker = (address: Address): ContractAddress | AccountAddress =>
    address.type === 'AddressContract'
        ? address.address
        : new AccountAddress(address.address);

const serializeDynamic = <T>(serializer: (a: T[]) => Buffer, input: T | T[]) =>
    serializer(Array.isArray(input) ? input : [input]);

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
        const parameter = serializeDynamic(serializeCIS2Transfers, transfers);
        return await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                amount: undefined,
                parameter,
                invoker: getInvoker(sender),
                method: `${this.contractName}.transfer`,
                energy: DEFAULT_EXECUTION_ENERGY,
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
        const parameter = serializeDynamic(
            serializeCIS2OperatorUpdates,
            updates
        );
        return await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                amount: undefined,
                parameter,
                invoker: getInvoker(owner),
                method: `${this.contractName}.updateOperator`,
                energy: DEFAULT_EXECUTION_ENERGY,
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

    transfer(signer: AccountSigner, transfer: CIS2Transfer): Promise<HexString>;
    transfer(
        signer: AccountSigner,
        transfers: CIS2Transfer[]
    ): Promise<HexString>;
    async transfer(
        signer: AccountSigner,
        transfers: CIS2Transfer | CIS2Transfer[]
    ): Promise<HexString> {
        throw new Error('Not yet implemented');
    }

    updateOperator(): void {
        throw new Error('Not yet implemented');
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
}
