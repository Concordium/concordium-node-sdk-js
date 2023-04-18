import { ContractAddress } from './types';
import ConcordiumNodeClient from './GRPCClient';

export class CIS2Client {
    constructor(
        private grpcClient: ConcordiumNodeClient,
        private contractAddress: ContractAddress
    ) {}

    transfer(): void {
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
}
