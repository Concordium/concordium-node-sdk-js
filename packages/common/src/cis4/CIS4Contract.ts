import { Buffer } from 'buffer/';

import {
    AccountAddress,
    AccountSigner,
    Base58String,
    ConcordiumGRPCClient,
    HexString,
    InvokeContractResult,
} from '..';
import { deserializeCIS2MetadataUrl } from '../cis2/util';
import {
    ContractTransactionMetadata,
    ContractUpdateTransaction,
    CreateContractTransactionMetadata,
    GenericContract,
    GenericContractDryRun,
    getInvoker,
} from '../GenericContract';
import { ContractAddress } from '../types';
import {
    CIS4,
    deserializeCIS4CredentialEntry,
    deserializeCIS4CredentialStatus,
    deserializeCIS4RevocationKeys,
    formatCIS4RegisterCredential,
    serializeCIS4RegisterCredentialParam,
} from './util';

type Updates =
    | 'registerCredential'
    | 'revokeCredentialIssuer'
    | 'revokeCredentialHolder';

class CIS4DryRun extends GenericContractDryRun {
    public registerCredential(
        sender: Base58String | ContractAddress,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = '',
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'registerCredential',
            getInvoker(sender),
            serializeCIS4RegisterCredentialParam,
            { credInfo, additionalData },
            blockHash
        );
    }
}

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
    ): CIS4DryRun {
        return new CIS4DryRun(grpcClient, contractAddress, contractName);
    }

    /**
     * Look up an entry in the registry by the public key of its holder.
     *
     * @param {HexString} credHolderPubKey - public key identifying the credential holder
     * @param {HexString} [blockHash] - block to perform query at.
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
     * @param {HexString} credHolderPubKey - public key identifying the credential holder
     * @param {HexString} [blockHash] - block to perform query at.
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
     * @param {HexString} [blockHash] - block to perform query at.
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
     * @param {HexString} [blockHash] - block to perform query at.
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
     * @param {HexString} [blockHash] - block to perform query at.
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

    /**
     * Create the details necessary to submit a CIS4.registerCredential update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {CIS4.CredentialInfo} credInfo - the credential info to register
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {ContractUpdateTransaction} Transaction data for a CIS4.registerCredential update.
     */
    public createRegisterCredential(
        metadata: CreateContractTransactionMetadata,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = ''
    ): ContractUpdateTransaction {
        return this.createUpdateTransaction(
            'registerCredential',
            serializeCIS4RegisterCredentialParam,
            formatCIS4RegisterCredential,
            metadata,
            { credInfo, additionalData }
        );
    }

    /**
     * Submit CIS4.registerCredentail update transaction.
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {CIS4.CredentialInfo} credInfo - the credential info to register
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {ContractUpdateTransaction} Transaction data for a register credential update.
     */
    public registerCredential(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = ''
    ): Promise<HexString> {
        const transaction = this.createUpdateTransaction(
            'registerCredential',
            serializeCIS4RegisterCredentialParam,
            formatCIS4RegisterCredential,
            metadata,
            { credInfo, additionalData }
        );
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }
}
