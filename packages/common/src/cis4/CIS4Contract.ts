import { Buffer } from 'buffer/';

import { AccountAddress, ConcordiumGRPCClient, HexString } from '..';
import { deserializeCIS2MetadataUrl } from '../cis2/util';
import { GenericContract, GenericContractDryRun } from '../GenericContract';
import { ContractAddress } from '../types';
import {
    CIS4,
    deserializeCIS4CredentialEntry,
    deserializeCIS4CredentialStatus,
    deserializeCIS4RevocationKeys,
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
     * Look up an entry in the registry by the public key of its holder.
     *
     * @param {HexString} credHolderPubKey public key identifying the credential holder
     * @param {HexString} [blockHash] block to perform query at.
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
     * Look up the status of a credential by the public key of its holder.
     *
     * @param {HexString} credHolderPubKey public key identifying the credential holder
     * @param {HexString} [blockHash] block to perform query at.
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

    /**
     * Get list of all revocation keys and their corresponding nonces.
     *
     * @param {HexString} [blockHash] block to perform query at.
     *
     * @returns {CIS4.RevocationKeyWithNonce[]} the revocation keys wityh corresponding nonces.
     */
    public revocationKeys(
        blockHash?: HexString
    ): Promise<CIS4.RevocationKeyWithNonce[]> {
        return this.invokeView(
            'revocationKeys',
            () => Buffer.alloc(0),
            deserializeCIS4RevocationKeys,
            undefined,
            blockHash
        );
    }

    /**
     * Get the {@link CIS4.MetadataUrl} URL for the issuer metadata.
     *
     * @param {HexString} [blockHash] block to perform query at.
     *
     * @returns {CIS4.MetadataUrl} a metadata URL.
     */
    public issuerMetadata(blockHash?: HexString): Promise<CIS4.MetadataUrl> {
        return this.invokeView(
            'issuerMetadata',
            () => Buffer.alloc(0),
            deserializeCIS2MetadataUrl,
            undefined,
            blockHash
        );
    }

    /**
     * Get the {@link AccountAddress} account address of the issuer.
     *
     * @param {HexString} [blockHash] block to perform query at.
     *
     * @returns {AccountAddress} an account address.
     */
    public issuerAddress(blockHash?: HexString): Promise<AccountAddress> {
        return this.invokeView(
            'issuer',
            () => Buffer.alloc(0),
            (value) => AccountAddress.fromBytes(Buffer.from(value, 'hex')),
            undefined,
            blockHash
        );
    }
}
