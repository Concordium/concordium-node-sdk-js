import { ConcordiumGRPCClient } from '..';
import { GenericContract, GenericContractDryRun } from '../GenericContract';
import { ContractAddress } from '../types';

type Entrypoints =
    | 'registerCredential'
    | 'revokeCredentialIssuer'
    | 'revokeCredentialHolder';

class CIS4DryRun extends GenericContractDryRun {}

export class CIS4Contract extends GenericContract<CIS4DryRun, Entrypoints> {
    public schemas: Record<Entrypoints, string> = {
        // FIXME: add schemas
        registerCredential: '',
        revokeCredentialHolder: '',
        revokeCredentialIssuer: '',
    };

    protected makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress,
        contractName: string
    ): GenericContractDryRun {
        return new CIS4DryRun(grpcClient, contractAddress, contractName);
    }
}
