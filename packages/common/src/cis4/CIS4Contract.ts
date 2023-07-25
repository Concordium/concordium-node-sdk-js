import { Buffer } from 'buffer/';

import { ConcordiumGRPCClient, HexString } from '..';
import { GenericContract, GenericContractDryRun } from '../GenericContract';
import { ContractAddress } from '../types';
import { CIS4, deserializeCIS4CredentialEntry } from './util';

type Updates =
    | 'registerCredential'
    | 'revokeCredentialIssuer'
    | 'revokeCredentialHolder';

class CIS4DryRun extends GenericContractDryRun {}

export class CIS4Contract extends GenericContract<CIS4DryRun, Updates> {
    public schemas: Record<Updates, string> = {
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

    /**
     * Look up an entry in the registry by its id.
     */
    public credentialEntry(
        credentialHolderPubKey: HexString,
        blockHash?: HexString
    ): Promise<CIS4.CredentialEntry> {
        return this.invokeView(
            'credentialEntry',
            (k) => Buffer.from(k, 'hex'),
            deserializeCIS4CredentialEntry,
            credentialHolderPubKey,
            blockHash
        );
    }
}
