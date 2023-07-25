import { Buffer } from 'buffer/';

import { ConcordiumGRPCClient, HexString } from '..';
import { GenericContract, GenericContractDryRun } from '../GenericContract';
import { ContractAddress } from '../types';
import {
    CIS4,
    deserializeCIS4CredentialEntry,
    deserializeCIS4CredentialStatus,
} from './util';

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
     *
     * @param {HexString} credHolderPubKey public key identifying the credential holder
     * @param {HexString} [blockHash] block to query credential entry at.
     *
     * @returns {CIS4.CredentialEntry} a corresponding credential entry.
     */
    public credentialEntry(
        credHolderPubKey: HexString,
        blockHash?: HexString
    ): Promise<CIS4.CredentialEntry> {
        return this.invokeView(
            'credentialEntry',
            (k) => Buffer.from(k, 'hex'),
            deserializeCIS4CredentialEntry,
            credHolderPubKey,
            blockHash
        );
    }

    /**
     * Look up an entry in the registry by its id.
     *
     * @param {HexString} credHolderPubKey public key identifying the credential holder
     * @param {HexString} [blockHash] block to query credential entry at.
     *
     * @returns {CIS4.CredentialStatus} a corresponding credential status.
     */
    public credentialStatus(
        credHolderPubKey: HexString,
        blockHash?: HexString
    ): Promise<CIS4.CredentialStatus> {
        return this.invokeView(
            'credentialStatus',
            (k) => Buffer.from(k, 'hex'),
            deserializeCIS4CredentialStatus,
            credHolderPubKey,
            blockHash
        );
    }
}
