import { Address, ContractAddress, HexString } from '../types';
import ConcordiumNodeClient from '../GRPCClient';
import { AccountSigner } from '../signHelpers';
import { CIS2Transfer } from './util';

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
    ): Promise<bigint>;
    transfer(
        sender: Address,
        transfers: CIS2Transfer[],
        blockHash?: HexString
    ): Promise<bigint>;
    async transfer(
        sender: Address,
        transfers: CIS2Transfer | CIS2Transfer[],
        blockHash?: HexString
    ): Promise<bigint> {
        throw new Error('Not yet implemented');
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
