import { Buffer } from 'buffer/index.js';

import {
    CISContract,
    ContractDryRun,
    ContractTransactionMetadata,
    ContractUpdateTransactionWithSchema,
    CreateContractTransactionMetadata,
    getContractUpdateDefaultExpiryDate,
} from '../GenericContract.js';
import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { AccountSigner } from '../signHelpers.js';
import type { HexString, InvokeContractResult } from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as BlockHash from '../types/BlockHash.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as ContractName from '../types/ContractName.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Timestamp from '../types/Timestamp.js';
import * as TransactionExpiry from '../types/TransactionExpiry.js';
import * as TransactionHash from '../types/TransactionHash.js';
import {
    CIS4,
    REVOKE_DOMAIN,
    Web3IdSigner,
    deserializeCIS4CredentialEntry,
    deserializeCIS4CredentialStatus,
    deserializeCIS4MetadataResponse,
    deserializeCIS4RevocationKeys,
    formatCIS4RegisterCredential,
    formatCIS4RevokeCredentialHolder,
    formatCIS4RevokeCredentialIssuer,
    formatCIS4RevokeCredentialOther,
    formatCIS4UpdateRevocationKeys,
    serializeCIS4RegisterCredentialParam,
    serializeCIS4RevocationDataHolder,
    serializeCIS4RevocationDataOther,
    serializeCIS4RevokeCredentialIssuerParam,
    serializeCIS4UpdateRevocationKeysParam,
} from './util.js';

type Views = 'credentialEntry' | 'credentialStatus' | 'issuer' | 'registryMetadata' | 'revocationKeys';

type Updates =
    | 'registerCredential'
    | 'revokeCredentialIssuer'
    | 'revokeCredentialHolder'
    | 'revokeCredentialOther'
    | 'registerRevocationKeys'
    | 'removeRevocationKeys';

/**
 * Defines methods for performing dry-run invocations of CIS4 contract updates.
 * Is accessible throught the `dryRun` property of a `CIS4Contract` instance.
 */
class CIS4DryRun extends ContractDryRun<Updates> {
    /**
     * Performs a dry-run invocation of "CIS4.registerCredential"
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - Address of the sender of the transfer.
     * @param {CIS4.CredentialInfo} credInfo - the credential info to register
     * @param {HexString} [additionalData] - any additional data to include
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public registerCredential(
        sender: AccountAddress.Type | ContractAddress.Type,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = '',
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('registerCredential'),
            sender,
            serializeCIS4RegisterCredentialParam,
            { credInfo, additionalData },
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.revokeCredentialIssuer"
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - Address of the sender of the transfer.
     * @param {HexString} credHolderPubKey - the public key of the credential holder (hex encoded)
     * @param {string} [reason] - the reason for the revocation
     * @param {HexString} [additionalData] - any additional data to include
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public revokeCredentialAsIssuer(
        sender: AccountAddress.Type | ContractAddress.Type,
        credHolderPubKey: HexString,
        reason?: string,
        additionalData: HexString = '',
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('revokeCredentialIssuer'),
            sender,
            serializeCIS4RevokeCredentialIssuerParam,
            { credHolderPubKey, reason, additionalData },
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.revokeCredentialHolder"
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - Address of the sender of the transfer.
     * @param {Web3IdSigner} credHolderSigner - A signer structure for the credential holder
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {Date} expiry - Expiry time of the revocation message
     * @param {string} [reason] - the reason for the revocation
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public async revokeCredentialAsHolder(
        sender: AccountAddress.Type | ContractAddress.Type,
        credHolderSigner: Web3IdSigner,
        nonce: bigint,
        expiry: Date,
        reason?: string,
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const credentialPubKey = credHolderSigner.pubKey;
        const entrypoint = EntrypointName.fromStringUnchecked('revokeCredentialHolder');
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entrypoint,
            nonce,
            timestamp: Timestamp.fromDate(expiry),
        };
        const serializedData = serializeCIS4RevocationDataHolder({
            credentialPubKey,
            signingData,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await credHolderSigner.sign(digest);

        return this.invokeMethod(
            entrypoint,
            sender,
            () => Buffer.concat([signature, serializedData]), // Reuse existing serialization
            undefined,
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.revokeCredentialOther"
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - Address of the sender of the transfer.
     * @param {Web3IdSigner} revokerSigner - A signer structure for the credential holder
     * @param {HexString} credentialPubKey - the public key (hex encoded) for the credential to revoke
     * @param {bigint} nonce - the nonce of the owner inside the contract
     * @param {Date} expiry - Expiry time of the revocation message
     * @param {string} [reason] - the reason for the revocation
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public async revokeCredentialAsOther(
        sender: AccountAddress.Type | ContractAddress.Type,
        revokerSigner: Web3IdSigner,
        credentialPubKey: HexString,
        nonce: bigint,
        expiry: Date,
        reason?: string,
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const revocationPubKey = revokerSigner.pubKey;
        const entrypoint = EntrypointName.fromStringUnchecked('revokeCredentialOther');
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entrypoint,
            nonce,
            timestamp: Timestamp.fromDate(expiry),
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
            entrypoint,
            sender,
            () => Buffer.concat([signature, serializedData]), // Reuse existing serialization
            undefined,
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.registerRevocationKeys"
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - Address of the sender of the transfer.
     * @param {HexString | HexString[]} keys - a single or list of hex encoded public keys to be used for revocation
     * @param {HexString} [additionalData] - any additional data to include
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public registerRevocationKeys(
        sender: AccountAddress.Type | ContractAddress.Type,
        keys: HexString | HexString[],
        additionalData: HexString = '',
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const ks = Array.isArray(keys) ? keys : [keys];
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('registerRevocationKeys'),
            sender,
            serializeCIS4UpdateRevocationKeysParam,
            { additionalData, keys: ks },
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "CIS4.removeRevocationKeys"
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - Address of the sender of the transfer.
     * @param {HexString | HexString[]} keys - a single or list of hex encoded public keys to be removed
     * @param {HexString} [additionalData] - any additional data to include
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public removeRevocationKeys(
        sender: AccountAddress.Type | ContractAddress.Type,
        keys: HexString | HexString[],
        additionalData: HexString = '',
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const ks = Array.isArray(keys) ? keys : [keys];
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('removeRevocationKeys'),
            sender,
            serializeCIS4UpdateRevocationKeysParam,
            { additionalData, keys: ks },
            blockHash
        );
    }
}

/**
 * Defines methods for interacting with CIS4 contracts.
 */
export class CIS4Contract extends CISContract<Updates, Views, CIS4DryRun> {
    /**
     * Parameter schemas for each CIS4 update entrypoint.
     * These are returned individually when creating update transactions to be used for serializing
     * a corresponding JSON representation of the parameter.
     */
    public schema: Record<Updates, string> = {
        /** Parameter schema for `registerCredential` entrypoint */
        registerCredential:
            'FAACAAAADwAAAGNyZWRlbnRpYWxfaW5mbxQABQAAAAkAAABob2xkZXJfaWQeIAAAABAAAABob2xkZXJfcmV2b2NhYmxlAQoAAAB2YWxpZF9mcm9tDQsAAAB2YWxpZF91bnRpbBUCAAAABAAAAE5vbmUCBAAAAFNvbWUBAQAAAA0MAAAAbWV0YWRhdGFfdXJsFAACAAAAAwAAAHVybBYBBAAAAGhhc2gVAgAAAAQAAABOb25lAgQAAABTb21lAQEAAAAeIAAAAA4AAABhdXhpbGlhcnlfZGF0YRABAg',
        /** Parameter schema for `revokeCredentialHolder` entrypoint */
        revokeCredentialHolder:
            'FAACAAAACQAAAHNpZ25hdHVyZR5AAAAABAAAAGRhdGEUAAMAAAANAAAAY3JlZGVudGlhbF9pZB4gAAAADAAAAHNpZ25pbmdfZGF0YRQABAAAABAAAABjb250cmFjdF9hZGRyZXNzDAsAAABlbnRyeV9wb2ludBYBBQAAAG5vbmNlBQkAAAB0aW1lc3RhbXANBgAAAHJlYXNvbhUCAAAABAAAAE5vbmUCBAAAAFNvbWUBAQAAABQAAQAAAAYAAAByZWFzb24WAA',
        /** Parameter schema for `revokeCredentialIssuer` entrypoint */
        revokeCredentialIssuer:
            'FAADAAAADQAAAGNyZWRlbnRpYWxfaWQeIAAAAAYAAAByZWFzb24VAgAAAAQAAABOb25lAgQAAABTb21lAQEAAAAUAAEAAAAGAAAAcmVhc29uFgAOAAAAYXV4aWxpYXJ5X2RhdGEQAQI',
        /** Parameter schema for `revokeCredentialOther` entrypoint */
        revokeCredentialOther:
            'FAACAAAACQAAAHNpZ25hdHVyZR5AAAAABAAAAGRhdGEUAAQAAAANAAAAY3JlZGVudGlhbF9pZB4gAAAADAAAAHNpZ25pbmdfZGF0YRQABAAAABAAAABjb250cmFjdF9hZGRyZXNzDAsAAABlbnRyeV9wb2ludBYBBQAAAG5vbmNlBQkAAAB0aW1lc3RhbXANDgAAAHJldm9jYXRpb25fa2V5HiAAAAAGAAAAcmVhc29uFQIAAAAEAAAATm9uZQIEAAAAU29tZQEBAAAAFAABAAAABgAAAHJlYXNvbhYA',
        /** Parameter schema for `registerRevocationKeys` entrypoint */
        registerRevocationKeys: 'FAACAAAABAAAAGtleXMQAR4gAAAADgAAAGF1eGlsaWFyeV9kYXRhEAEC',
        /** Parameter schema for `removeRevocationKeys` entrypoint */
        removeRevocationKeys: 'FAACAAAABAAAAGtleXMQAR4gAAAADgAAAGF1eGlsaWFyeV9kYXRhEAEC',
    };

    /**
     * Creates a new `CIS4Contract` instance by querying the node for the necessary information through the supplied `grpcClient`.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The client used for contract invocations and updates.
     * @param {ContractAddress} contractAddress - Address of the contract instance.
     *
     * @throws If `InstanceInfo` could not be received for the contract,
     * or if the contract name could not be parsed from the information received from the node.
     */
    public static async create(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type
    ): Promise<CIS4Contract> {
        const contractName = await super.getContractName(grpcClient, contractAddress);
        return new CIS4Contract(grpcClient, contractAddress, contractName);
    }

    protected makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type,
        contractName: ContractName.Type
    ): CIS4DryRun {
        return new CIS4DryRun(grpcClient, contractAddress, contractName);
    }

    /**
     * Look up an entry in the registry by the public key of its holder.
     *
     * @param {HexString} credHolderPubKey - public key identifying the credential holder
     * @param {BlockHash.Type} [blockHash] - block to perform query at.
     *
     * @returns {CIS4.CredentialEntry} a corresponding credential entry.
     */
    public credentialEntry(credHolderPubKey: HexString, blockHash?: BlockHash.Type): Promise<CIS4.CredentialEntry> {
        return this.invokeView(
            EntrypointName.fromStringUnchecked('credentialEntry'),
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
     * @param {BlockHash.Type} [blockHash] - block to perform query at.
     *
     * @returns {CIS4.CredentialStatus} a corresponding credential status.
     */
    public credentialStatus(credHolderPubKey: HexString, blockHash?: BlockHash.Type): Promise<CIS4.CredentialStatus> {
        return this.invokeView(
            EntrypointName.fromStringUnchecked('credentialStatus'),
            (k) => Buffer.from(k, 'hex'),
            deserializeCIS4CredentialStatus,
            credHolderPubKey,
            blockHash
        );
    }

    /**
     * Get list of all revocation keys and their corresponding nonces.
     *
     * @param {BlockHash.Type} [blockHash] - block to perform query at.
     *
     * @returns {CIS4.RevocationKeyWithNonce[]} the revocation keys wityh corresponding nonces.
     */
    public revocationKeys(blockHash?: BlockHash.Type): Promise<CIS4.RevocationKeyWithNonce[]> {
        return this.invokeView(
            EntrypointName.fromStringUnchecked('revocationKeys'),
            () => Buffer.alloc(0),
            deserializeCIS4RevocationKeys,
            undefined,
            blockHash
        );
    }

    /**
     * Get the registry metadata.
     *
     * @param {BlockHash.Type} [blockHash] - block to perform query at.
     *
     * @returns {CIS4.MetadataUrl} a metadata URL.
     */
    public registryMetadata(blockHash?: BlockHash.Type): Promise<CIS4.MetadataResponse> {
        return this.invokeView(
            EntrypointName.fromStringUnchecked('registryMetadata'),
            () => Buffer.alloc(0),
            deserializeCIS4MetadataResponse,
            undefined,
            blockHash
        );
    }

    /**
     * Get the {@link AccountAddress} public key of the issuer.
     *
     * @param {BlockHash.Type} [blockHash] - block to perform query at.
     *
     * @returns {HexString} a hex encoded public key.
     */
    public issuer(blockHash?: BlockHash.Type): Promise<HexString> {
        return this.invokeView(
            EntrypointName.fromStringUnchecked('issuer'),
            () => Buffer.alloc(0),
            (value) => value,
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
            EntrypointName.fromStringUnchecked('registerCredential'),
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
     * @returns {TransactionHash.Type} The hash of the submitted transaction
     */
    public registerCredential(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credInfo: CIS4.CredentialInfo,
        additionalData: HexString = ''
    ): Promise<TransactionHash.Type> {
        const transaction = this.createRegisterCredential(metadata, credInfo, additionalData);
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Create the details necessary to submit a CIS4.revokeCredentialIssuer update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString} credHolderPubKey - the public key of the credential holder (hex encoded)
     * @param {string} [reason] - the reason for the revocation
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.revokeCredentialIssuer update.
     */
    public createRevokeCredentialAsIssuer(
        metadata: CreateContractTransactionMetadata,
        credHolderPubKey: HexString,
        reason?: string,
        additionalData: HexString = ''
    ): ContractUpdateTransactionWithSchema {
        return this.createUpdateTransaction(
            EntrypointName.fromStringUnchecked('revokeCredentialIssuer'),
            serializeCIS4RevokeCredentialIssuerParam,
            metadata,
            { credHolderPubKey, reason, additionalData },
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
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {TransactionHash.Type} The hash of the submitted transaction
     */
    public revokeCredentialAsIssuer(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credHolderPubKey: HexString,
        reason?: string,
        additionalData: HexString = ''
    ): Promise<TransactionHash.Type> {
        const transaction = this.createRevokeCredentialAsIssuer(metadata, credHolderPubKey, reason, additionalData);
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
        const entrypoint = EntrypointName.fromStringUnchecked('revokeCredentialHolder');
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entrypoint,
            nonce,
            timestamp: Timestamp.fromDate(expiry),
        };
        const serializedData = serializeCIS4RevocationDataHolder({
            credentialPubKey,
            signingData,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await credHolderSigner.sign(digest);

        return this.createUpdateTransaction<CIS4.RevokeCredentialHolderParam, CIS4.RevokeCredentialHolderParamJson>(
            entrypoint,
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
     * @returns {TransactionHash.Type} The hash of the submitted transaction
     */
    public async revokeCredentialAsHolder(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        credHolderSigner: Web3IdSigner,
        nonce: bigint,
        reason?: string
    ): Promise<TransactionHash.Type> {
        const transaction = await this.createRevokeCredentialAsHolder(
            metadata,
            credHolderSigner,
            nonce,
            TransactionExpiry.toDate(metadata.expiry ?? getContractUpdateDefaultExpiryDate()),
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
        const entrypoint = EntrypointName.fromStringUnchecked('revokeCredentialOther');
        const signingData: CIS4.SigningData = {
            contractAddress: this.contractAddress,
            entrypoint,
            nonce,
            timestamp: Timestamp.fromDate(expiry),
        };
        const serializedData = serializeCIS4RevocationDataOther({
            credentialPubKey,
            revocationPubKey,
            signingData,
            reason,
        });
        const digest = Buffer.concat([REVOKE_DOMAIN, serializedData]);
        const signature = await revokerSigner.sign(digest);

        return this.createUpdateTransaction<CIS4.RevokeCredentialOtherParam, CIS4.RevokeCredentialOtherParamJson>(
            entrypoint,
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
     * @returns {TransactionHash.Type} The hash of the submitted transaction
     */
    public async revokeCredentialAsOther(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        revokerSigner: Web3IdSigner,
        credentialPubKey: HexString,
        nonce: bigint,
        reason?: string
    ): Promise<TransactionHash.Type> {
        const transaction = await this.createRevokeCredentialAsOther(
            metadata,
            revokerSigner,
            credentialPubKey,
            nonce,
            TransactionExpiry.toDate(metadata.expiry ?? getContractUpdateDefaultExpiryDate()),
            reason
        );
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Create the details necessary to submit a CIS4.registerRevicationKeys update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString | HexString[]} keys - a single or list of hex encoded public keys to be used for revocation
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.registerRevicationKeys update.
     */
    public createRegisterRevocationKeys(
        metadata: CreateContractTransactionMetadata,
        keys: HexString | HexString[],
        additionalData: HexString = ''
    ): ContractUpdateTransactionWithSchema {
        const ks = Array.isArray(keys) ? keys : [keys];
        return this.createUpdateTransaction(
            EntrypointName.fromStringUnchecked('registerRevocationKeys'),
            serializeCIS4UpdateRevocationKeysParam,
            metadata,
            { additionalData, keys: ks },
            formatCIS4UpdateRevocationKeys
        );
    }

    /**
     * Submit CIS4.registerRevocationKeys update transaction.
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString | HexString[]} keys - a single or list of hex encoded public keys to be used for revocation
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {TransactionHash.Type} The hash of the submitted transaction
     */
    public registerRevocationKeys(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        keys: HexString | HexString[],
        additionalData: HexString = ''
    ): Promise<TransactionHash.Type> {
        const transaction = this.createRegisterRevocationKeys(metadata, keys, additionalData);
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Create the details necessary to submit a CIS4.removeRevicationKeys update transaction.
     *
     * @param {CreateContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString | HexString[]} keys - a single or list of hex encoded public keys to be removed
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a CIS4.removeRevicationKeys update.
     */
    public createRemoveRevocationKeys(
        metadata: CreateContractTransactionMetadata,
        keys: HexString | HexString[],
        additionalData: HexString = ''
    ): ContractUpdateTransactionWithSchema {
        const ks = Array.isArray(keys) ? keys : [keys];
        return this.createUpdateTransaction(
            EntrypointName.fromStringUnchecked('removeRevocationKeys'),
            serializeCIS4UpdateRevocationKeysParam,
            metadata,
            { additionalData, keys: ks },
            formatCIS4UpdateRevocationKeys
        );
    }

    /**
     * Submit CIS4.removeRevocationKeys update transaction.
     *
     * @param {AccountSigner} signer - to be used for signing the transaction sent to the node.
     * @param {ContractTransactionMetadata} metadata - transaction metadata
     * @param {HexString | HexString[]} keys - a single or list of hex encoded public keys to be removed
     * @param {HexString} [additionalData] - any additional data to include
     *
     * @returns {TransactionHash.Type} The hash of the submitted transaction
     */
    public removeRevocationKeys(
        signer: AccountSigner,
        metadata: ContractTransactionMetadata,
        keys: HexString | HexString[],
        additionalData: HexString = ''
    ): Promise<TransactionHash.Type> {
        const transaction = this.createRemoveRevocationKeys(metadata, keys, additionalData);
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }
}
