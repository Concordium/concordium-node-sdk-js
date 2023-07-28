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
    ContractUpdateTransactionWithSchema,
    CreateContractTransactionMetadata,
    CISContract,
    ContractDryRun,
    getDefaultExpiryDate,
    getInvoker,
} from '../GenericContract';
import { ContractAddress } from '../types';
import {
    CIS4,
    deserializeCIS4CredentialEntry,
    deserializeCIS4CredentialStatus,
    deserializeCIS4RevocationKeys,
    formatCIS4RegisterCredential,
    formatCIS4RevokeCredentialHolder,
    formatCIS4RevokeCredentialIssuer,
    formatCIS4RevokeCredentialOther,
    REVOKE_DOMAIN,
    serializeCIS4RegisterCredentialParam,
    serializeCIS4RevocationDataHolder,
    serializeCIS4RevocationDataOther,
    serializeCIS4RevokeCredentialIssuerParam,
    Web3IdSigner,
} from './util';

type Updates =
    | 'registerCredential'
    | 'revokeCredentialIssuer'
    | 'revokeCredentialHolder'
    | 'revokeCredentialOther';

class CIS4DryRun extends ContractDryRun<Updates> {
    /**
     * Performs a dry-run invocation of "CIS4.registerCredential"
     *
     * @param {Base58String | ContractAddress} sender - Address of the sender of the transfer.
     * @param {CIS4.CredentialInfo} credInfo - the credential info to register
     * @param {HexString} [additionalData] - any additional data to include
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
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

    /**
     * Performs a dry-run invocation of "CIS4.revokeCredentialIssuer"
     *
     * @param {Base58String | ContractAddress} sender - Address of the sender of the transfer.
     * @param {HexString} credHolderPubKey - the public key of the credential holder (hex encoded)
     * @param {string} [reason] - the reason for the revocation
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public revokeCredentialAsIssuer(
        sender: Base58String | ContractAddress,
        credHolderPubKey: HexString,
        reason?: string,
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'revokeCredentialIssuer',
            getInvoker(sender),
            serializeCIS4RevokeCredentialIssuerParam,
            { credHolderPubKey, reason },
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.revokeCredentialHolder"
     *
     * @param {Base58String | ContractAddress} sender - Address of the sender of the transfer.
     * @param {Web3IdSigner} credHolderSigner - A signer structure for the credential holder
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {Date} expiry - Expiry time of the revocation message
     * @param {string} [reason] - the reason for the revocation
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public async revokeCredentialAsHolder(
        sender: Base58String | ContractAddress,
        credHolderSigner: Web3IdSigner,
        nonce: bigint,
        expiry: Date,
        reason?: string,
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const credentialPubKey = credHolderSigner.pubKey;
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entryPoint: '', // TODO: where do we get this from? Is it even used?
            nonce,
            timestamp: expiry,
        };
        const serializedData = serializeCIS4RevocationDataHolder({
            credentialPubKey,
            signingData,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await credHolderSigner.sign(digest);

        return this.invokeMethod(
            'revokeCredentialHolder',
            getInvoker(sender),
            () => Buffer.concat([signature, serializedData]), // Reuse existing serialization
            undefined,
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.revokeCredentialOther"
     *
     * @param {Base58String | ContractAddress} sender - Address of the sender of the transfer.
     * @param {Web3IdSigner} revokerSigner - A signer structure for the credential holder
     * @param {HexString} credentialPubKey - the public key (hex encoded) for the credential to revoke
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {Date} expiry - Expiry time of the revocation message
     * @param {string} [reason] - the reason for the revocation
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public async revokeCredentialAsOther(
        sender: Base58String | ContractAddress,
        revokerSigner: Web3IdSigner,
        credentialPubKey: HexString,
        nonce: bigint,
        expiry: Date,
        reason?: string,
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const revocationPubKey = revokerSigner.pubKey;
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entryPoint: '', // TODO: where do we get this from? Is it even used?
            nonce,
            timestamp: expiry,
        };
        const serializedData = serializeCIS4RevocationDataOther({
            credentialPubKey,
            signingData,
            revocationPubKey,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await revokerSigner.sign(digest);

        return this.invokeMethod(
            'revokeCredentialOther',
            getInvoker(sender),
            () => Buffer.concat([signature, serializedData]), // Reuse existing serialization
            undefined,
            blockHash
        );
    }
}

export class CIS4Contract extends CISContract<Updates, CIS4DryRun> {
    public schema: Record<Updates, string> = {
        // FIXME: add schemas
        registerCredential: '',
        revokeCredentialHolder: '',
        revokeCredentialIssuer: '',
        revokeCredentialOther: '',
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
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.registerCredential update.
     */
    public createRegisterCredential(
        metadata: CreateContractTransactionMetadata,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = ''
    ): ContractUpdateTransactionWithSchema {
        return this.createUpdateTransaction(
            'registerCredential',
            serializeCIS4RegisterCredentialParam,
            metadata,
            { credInfo, additionalData },
            formatCIS4RegisterCredential
        );
    }

    /**
     * Submit CIS4.registerCredential update transaction.
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {CIS4.CredentialInfo} credInfo - the credential info to register
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {HexString} The hash of the submitted transaction
     */
    public registerCredential(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = ''
    ): Promise<HexString> {
        const transaction = this.createRegisterCredential(
            metadata,
            credInfo,
            additionalData
        );
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Create the details necessary to submit a CIS4.revokeCredentialIssuer update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString} credHolderPubKey - the public key of the credential holder (hex encoded)
     * @param {string} [reason] - the reason for the revocation
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.revokeCredentialIssuer update.
     */
    public createRevokeCredentialAsIssuer(
        metadata: CreateContractTransactionMetadata,
        credHolderPubKey: HexString,
        reason?: string
    ): ContractUpdateTransactionWithSchema {
        return this.createUpdateTransaction(
            'revokeCredentialIssuer',
            serializeCIS4RevokeCredentialIssuerParam,
            metadata,
            { credHolderPubKey, reason },
            formatCIS4RevokeCredentialIssuer
        );
    }

    /**
     * Submit CIS4.revokeCredentialIssuer update transaction.
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString} credHolderPubKey - the public key of the credential holder (hex encoded)
     * @param {string} [reason] - the reason for the revocation
     *
     * @returns {HexString} The hash of the submitted transaction
     */
    public revokeCredentialAsIssuer(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credHolderPubKey: HexString,
        reason?: string
    ): Promise<HexString> {
        const transaction = this.createRevokeCredentialAsIssuer(
            metadata,
            credHolderPubKey,
            reason
        );
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Create the details necessary to submit a CIS4.revokeCredentialHolder update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {Web3IdSigner} credHolderSigner - A signer structure for the credential holder
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {Date} expiry - Expiry time of the revocation message
     * @param {string} [reason] - the reason for the revocation
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.revokeCredentialHolder update.
     */
    public async createRevokeCredentialAsHolder(
        metadata: CreateContractTransactionMetadata,
        credHolderSigner: Web3IdSigner,
        nonce: bigint,
        expiry: Date,
        reason?: string
    ): Promise<ContractUpdateTransactionWithSchema> {
        const credentialPubKey = credHolderSigner.pubKey;
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entryPoint: '', // TODO: where do we get this from? Is it even used?
            nonce,
            timestamp: expiry,
        };
        const serializedData = serializeCIS4RevocationDataHolder({
            credentialPubKey,
            signingData,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await credHolderSigner.sign(digest);

        return this.createUpdateTransaction<
            CIS4.RevokeCredentialHolderParam,
            CIS4.RevokeCredentialHolderParamJson
        >(
            'revokeCredentialHolder',
            () => Buffer.concat([signature, serializedData]), // Reuse existing serialization
            metadata,
            {
                signature: signature.toString('hex'),
                data: { credentialPubKey, signingData, reason },
            },
            formatCIS4RevokeCredentialHolder
        );
    }

    /**
     * Submit CIS4.revokeCredentialHolder update transaction.
     * The revocation message is set to expire at the same time as the transaction (from `metadata.expiry`)
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {Web3IdSigner} credHolderSigner - A signer structure for the credential holder
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {string} [reason] - the reason for the revocation
     *
     * @returns {HexString} The hash of the submitted transaction
     */
    public async revokeCredentialAsHolder(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credHolderSigner: Web3IdSigner,
        nonce: bigint,
        reason?: string
    ): Promise<HexString> {
        const transaction = await this.createRevokeCredentialAsHolder(
            metadata,
            credHolderSigner,
            nonce,
            metadata.expiry ?? getDefaultExpiryDate(),
            reason
        );
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Create the details necessary to submit a CIS4.revokeCredentialOther update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {Web3IdSigner} revokerSigner - A signer structure for the revoker
     * @param {HexString} credentialPubKey - the public key (hex encoded) for the credential to revoke
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {Date} expiry - Expiry time of the revocation message
     * @param {string} [reason] - the reason for the revocation
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.revokeCredentialOther update.
     */
    public async createRevokeCredentialAsOther(
        metadata: CreateContractTransactionMetadata,
        revokerSigner: Web3IdSigner,
        credentialPubKey: HexString,
        nonce: bigint,
        expiry: Date,
        reason?: string
    ): Promise<ContractUpdateTransactionWithSchema> {
        const revocationPubKey = revokerSigner.pubKey;
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entryPoint: '', // TODO: where do we get this from? Is it even used?
            nonce,
            timestamp: expiry,
        };
        const serializedData = serializeCIS4RevocationDataOther({
            credentialPubKey,
            revocationPubKey,
            signingData,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await revokerSigner.sign(digest);

        return this.createUpdateTransaction<
            CIS4.RevokeCredentialOtherParam,
            CIS4.RevokeCredentialOtherParamJson
        >(
            'revokeCredentialOther',
            () => Buffer.concat([signature, serializedData]), // Reuse existing serialization
            metadata,
            {
                signature: signature.toString('hex'),
                data: {
                    credentialPubKey,
                    signingData,
                    revocationPubKey,
                    reason,
                },
            },
            formatCIS4RevokeCredentialOther
        );
    }

    /**
     * Submit CIS4.revokeCredentialOther update transaction.
     * The revocation message is set to expire at the same time as the transaction (from `metadata.expiry`)
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {Web3IdSigner} revokerSigner - A signer structure for the credential holder
     * @param {HexString} credentialPubKey - the public key (hex encoded) for the credential to revoke
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {string} [reason] - the reason for the revocation
     *
     * @returns {HexString} The hash of the submitted transaction
     */
    public async revokeCredentialAsOther(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        revokerSigner: Web3IdSigner,
        credentialPubKey: HexString,
        nonce: bigint,
        reason?: string
    ): Promise<HexString> {
        const transaction = await this.createRevokeCredentialAsOther(
            metadata,
            revokerSigner,
            credentialPubKey,
            nonce,
            metadata.expiry ?? getDefaultExpiryDate(),
            reason
        );
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }
}
