// self-referencing not allowed by eslint resolver
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ed from '@concordium/web-sdk/shims/ed25519';
import { Buffer } from 'buffer/index.js';

import type { CIS2 } from '../cis2/util.js';
import {
    deserializeCIS2MetadataUrl,
    serializeCIS2MetadataUrl,
    serializeContractAddress,
    serializeReceiveHookName,
} from '../cis2/util.js';
import { Cursor, makeDeserializeListResponse } from '../deserializationHelpers.js';
import { isKnown } from '../grpc/index.js';
import { OptionJson, toOptionJson } from '../schemaTypes.js';
import {
    encodeBool,
    encodeWord16,
    encodeWord64,
    makeSerializeOptional,
    packBufferWithWord8Length,
    packBufferWithWord16Length,
} from '../serializationHelpers.js';
import { getSignature } from '../signHelpers.js';
import {
    type BlockItemSummary,
    type ContractTraceEvent,
    type HexString,
    type InvokeContractSuccessResult,
    TransactionKindString,
    TransactionSummaryType,
} from '../types.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as ContractEvent from '../types/ContractEvent.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Timestamp from '../types/Timestamp.js';

/** Holds all types related to CIS4 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS4 {
    /** Structure holding an url pointing to some metadata, including an optional checksum */
    export type MetadataUrl = CIS2.MetadataUrl;
    /** Structure holding an url pointing to some metadata, including an optional checksum */
    export type SchemaRef = MetadataUrl;

    /** Response type for `registryMetadata` query */
    export type MetadataResponse = {
        /** URL for issuer metadata */
        issuerMetadata: MetadataUrl;
        /** The credential type */
        credentialType: string;
        /** URL for the credential schema */
        credentialSchema: SchemaRef;
    };

    /** Holds info pertaining to a credential. */
    export type CredentialInfo = {
        /** Ed25519 public key of credential holder (hex encoded) */
        holderPubKey: HexString;
        /** Whether holder can revoke or not */
        holderRevocable: boolean;
        /** Time the credential is valid from */
        validFrom: Timestamp.Type;
        /** (Optional) time the credential is valid until */
        validUntil?: Timestamp.Type;
        /** Metadata url of the credential */
        metadataUrl: MetadataUrl;
    };

    /** Response to a credential data query. */
    export type CredentialEntry = {
        /** Info for the credential entry */
        credentialInfo: CredentialInfo;
        /** A schema URL or DID address pointing to the JSON schema for a verifiable credential */
        schemaRef: SchemaRef;
        /**
         * The nonce is used to avoid replay attacks when checking the holder's
         * signature on a revocation message. This is the nonce that should be used
         * when signing a revocation.
         */
        revocationNonce: bigint;
    };

    /** Response type for `credentialStatus` query */
    export enum CredentialStatus {
        /** The credential is active */
        Active,
        /** The credential has been revoked */
        Revoked,
        /** The credential has expired */
        Expired,
        /** The credential has not been activated */
        NotActivated,
    }

    /** A revocation key and its corresponding nonce */
    export type RevocationKeyWithNonce = {
        /** The revocation key (hex encoded) */
        key: HexString;
        /** The nonce of the revocation key */
        nonce: bigint;
    };

    /** Data needed for the `registerCredential` update */
    export type RegisterCredentialParam = {
        /** The credential info to register */
        credInfo: CredentialInfo;
        /** Any additional data to include in the parameter (hex encoded) */
        additionalData: HexString;
    };

    /** schema serializable JSON representation of parameter for the "registerCredential" entrypoint */
    export type RegisterCredentialParamJson = {
        /** The credential info to register */
        credential_info: {
            /** Ed25519 public key of credential holder (hex encoded) */
            holder_id: HexString;
            /** Whether holder can revoke or not */
            holder_revocable: boolean;
            /** Time (as ISO string) the credential is valid from */
            valid_from: Timestamp.SchemaValue;
            /** (Optional) Time (as ISO string) the credential is valid until */
            valid_until: OptionJson<Timestamp.SchemaValue>;
            /** Metadata url of the credential */
            metadata_url: {
                /** The url */
                url: string;
                /** An optional checksum of the data at the URL destination */
                hash: OptionJson<HexString>;
            };
        };
        /** Any additional data to include in the parameter (hex encoded) */
        auxiliary_data: number[];
    };

    /** Data needed for the `revokeCredentialIssuer` update */
    export type RevokeCredentialIssuerParam = {
        /** The public key of the credential holder (hex encoded) */
        credHolderPubKey: HexString;
        /** An optional reason for the revocation */
        reason?: string;
        /** Any additional data to include in the parameter (hex encoded) */
        additionalData: HexString;
    };

    /** schema serializable JSON representation of a revocation reason */
    export type RevocationReasonJson = {
        /** The reason for revocation */
        reason: string;
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialIssuer" entrypoint */
    export type RevokeCredentialIssuerParamJson = {
        /** The public key of the credential holder (hex encoded) */
        credential_id: HexString;
        /** An optional reason for the revocation */
        reason: OptionJson<RevocationReasonJson>;
        /** Any additional data to include in the parameter (hex encoded) */
        auxiliary_data: number[];
    };

    /** Signing metadata for credential revocation */
    export type SigningData = {
        /** The contract address of the CIS4 contract */
        contractAddress: ContractAddress.Type;
        /** The CIS4 entrypoint from which the revocation is done */
        entrypoint: EntrypointName.Type;
        /** The credential nonce */
        nonce: bigint;
        /** Timestamp at which the revocation should be invalidated */
        timestamp: Timestamp.Type;
    };

    export type SigningDataJson = {
        /** The contract address of the CIS4 contract */
        contract_address: {
            /** The contract index */
            index: number;
            /** The contract subindex */
            subindex: number;
        };
        /** The CIS4 entrypoint from which the revocation is done */
        entry_point: string;
        /** The credential nonce */
        nonce: number;
        /** Timestamp at which the revocation should be invalidated */
        timestamp: string;
    };

    /** Revocation data for revocations done by the credential holder */
    export type RevocationDataHolder = {
        /** The public key of the credential to revoke (hex encoded) */
        credentialPubKey: HexString;
        /** The signing metadata of the revocation */
        signingData: SigningData;
        /** An optional reason for the revocation */
        reason?: string;
    };

    /** Data needed for the `revokeCredentialHolder` update */
    export type RevokeCredentialHolderParam = {
        /** Signature on the `data` (hex encoded) */
        signature: HexString;
        /** The revocation data */
        data: RevocationDataHolder;
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialHolder" entrypoint */
    export type RevokeCredentialHolderParamJson = {
        /** Signature on the `data` (hex encoded) */
        signature: HexString;
        /** The revocation data */
        data: {
            /** The public key of the credential to revoke (hex encoded) */
            credential_id: HexString;
            /** The signing metadata of the revocation */
            signing_data: SigningDataJson;
            /** An optional reason for the revocation */
            reason: OptionJson<RevocationReasonJson>;
        };
    };

    /** Revocation data for revocations done by other revocation entities */
    export type RevocationDataOther = {
        /** The public key of the credential to revoke (hex encoded) */
        credentialPubKey: HexString;
        /** The data signed */
        signingData: SigningData;
        /** The public key of the revoker (hex encoded) */
        revocationPubKey: HexString;
        /** An optional reason for the revocation */
        reason?: string;
    };

    /** Data needed for the `revokeCredentialOther` update */
    export type RevokeCredentialOtherParam = {
        /** Signature on the `data` (hex encoded) */
        signature: HexString;
        /** The revocation data */
        data: RevocationDataOther;
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialOther" entrypoint */
    export type RevokeCredentialOtherParamJson = {
        /** Signature on the `data` (hex encoded) */
        signature: HexString;
        /** The revocation data */
        data: {
            /** The public key of the credential to revoke (hex encoded) */
            credential_id: HexString;
            /** The signing metadata of the revocation */
            signing_data: SigningDataJson;
            /** The public key of the revoker (hex encoded) */
            revocation_key: HexString;
            /** An optional reason for the revocation */
            reason: OptionJson<RevocationReasonJson>;
        };
    };

    /** Data needed for the `registerRevocationKeys` and `removeRevocationKeys` update */
    export type UpdateRevocationKeysParam = {
        /** The keys to register/remove */
        keys: HexString[];
        /** Any additional data to include in the parameter (hex encoded) */
        additionalData: HexString;
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialIssuer" entrypoint */
    export type UpdateRevocationKeysParamJson = {
        /** The keys to register/remove */
        keys: HexString[];
        /** Any additional data to include in the parameter (hex encoded) */
        auxiliary_data: number[];
    };

    /** A type of credential revoker. Either the issuer of the credential,
     * holder of the credential, or a third party authority. */
    export enum RevokerType {
        /** The issuer of the credential */
        Issuer,
        /** The holder of the credential */
        Holder,
        /** A third party credential authority */
        Other,
    }

    /** A revoker of a credential */
    export type Revoker =
        | {
              /** The type of revoker */
              type: RevokerType.Issuer | RevokerType.Holder;
          }
        | {
              /** The type of revoker */
              type: RevokerType.Other;
              /** The public key of the third party credential revoker (hex encoded) */
              key: HexString;
          };

    /** An action determining if a revocation key is registered or removed */
    export enum RevocationKeyAction {
        /** Register a revocation key */
        Register,
        /** Remove a revocation key */
        Remove,
    }

    /** A type of CIS-4 event */
    export enum EventType {
        /** A credential was registered */
        RegisterCredential,
        /** A credential was revoked */
        RevokeCredential,
        /** The issuer metadata was updated */
        IssuerMetadata,
        /** The credential metadata was updated */
        CredentialMetadata,
        /** The credential schema reference was updated */
        CredentialSchemaRef,
        /** A revocation key was registered or removed */
        RevocationKey,
        /** A custom event outside CIS-4 */
        Custom,
    }

    /** A RegisterCredential event from the CIS-4 standard */
    export type RegisterCredentialEvent = {
        /** The type of the event */
        type: EventType.RegisterCredential;
        /** The public key of the registered credential (hex encoded) */
        credentialPubKey: HexString;
        /** The schema reference of the registered credential */
        schemaRef: SchemaRef;
        /** The credential type of the registered credential */
        credentialType: string;
        /** The metadata URL of the registered credential */
        metadataUrl: MetadataUrl;
    };

    /** A RevokeCredential event from the CIS-4 standard */
    export type RevokeCredentialEvent = {
        /** The type of the event */
        type: EventType.RevokeCredential;
        /** The public key of the revoked credential (hex encoded) */
        credentialPubKey: HexString;
        /** The revoker that revoked the credential */
        revoker: Revoker;
        /** An optional reason for the revocation */
        reason?: string;
    };

    /** An IssuerMetadata event from the CIS-4 standard */
    export type IssuerMetadataEvent = {
        /** The type of the event */
        type: EventType.IssuerMetadata;
        /** The updated metadata URL of the issuer */
        metadataUrl: MetadataUrl;
    };

    /** A CredentialMetadata event from the CIS-4 standard */
    export type CredentialMetadataEvent = {
        /** The type of the event */
        type: EventType.CredentialMetadata;
        /** The public key of the credential (hex encoded) */
        credentialPubKey: HexString;
        /** The updated metadata URL of the credential */
        metadataUrl: MetadataUrl;
    };

    /** A CredentialSchemaRef event from the CIS-4 standard */
    export type CredentialSchemaRefEvent = {
        /** The type of the event */
        type: EventType.CredentialSchemaRef;
        /** The credential type of the credential */
        credentialType: string;
        /** The updated schema reference of the credential */
        schemaRef: SchemaRef;
    };

    /** A RevocationKey event from the CIS-4 standard */
    export type RevocationKeyEvent = {
        /** The type of the event */
        type: EventType.RevocationKey;
        /** The key being registered or removed */
        key: HexString;
        /** The action (either registration or removal) performed on the revocation key */
        action: RevocationKeyAction;
    };

    /** A custom event outside CIS-4 */
    export type CustomEvent = {
        /** The type of the event */
        type: EventType.Custom;
        /** The raw data of the event */
        data: Uint8Array;
    };

    /** A CIS-4 event */
    export type Event =
        | RegisterCredentialEvent
        | RevokeCredentialEvent
        | IssuerMetadataEvent
        | CredentialMetadataEvent
        | CredentialSchemaRefEvent
        | RevocationKeyEvent
        | CustomEvent;

    /** A CIS-4 event which is not a custom event */
    export type NonCustomEvent = Exclude<Event, CustomEvent>;
}

/**
 * A wrapper around an ed25519 keypair which is used by {@link CIS4Contract} methods for signing as various entities.
 */
export class Web3IdSigner {
    /**
     * Builds a `Web3IdSigner` from ed25519 keypair
     *
     * @param {HexString} privateKey - the ed25519 private key used for signing
     * @param {HexString} publicKey - the ed25519 public key used for verifcation of signature
     */
    constructor(
        private privateKey: HexString,
        private publicKey: HexString
    ) {}

    /**
     * Builds a `Web3IdSigner` from ed25519 private key
     *
     * @param {HexString} privateKey - the ed25519 private key used for signing
     *
     * @returns {Web3IdSigner} signer structure.
     */
    public static async from(privateKey: HexString): Promise<Web3IdSigner> {
        const publicKey = Buffer.from(await ed.getPublicKeyAsync(Buffer.from(privateKey, 'hex'))).toString('hex');
        return new Web3IdSigner(privateKey, publicKey);
    }

    /** Public key of signer */
    public get pubKey(): HexString {
        return this.publicKey;
    }

    /**
     * Signs the message given
     *
     * @param {ArrayBuffer} message - the message to sign
     *
     * @returns {Buffer} the signature on `message`
     */
    public async sign(message: ArrayBuffer): Promise<Buffer> {
        return getSignature(message, this.privateKey);
    }
}

/**
 * Expected prefix of messages signed for CIS4 revocation entrypoints.
 */
export const REVOKE_DOMAIN = Buffer.from('WEB3ID:REVOKE', 'utf8');

const deserializeOptional = <T>(cursor: Cursor, fun: (c: Cursor) => T): T | undefined => {
    const hasValue = cursor.read(1).readUInt8(0);
    if (!hasValue) {
        return undefined;
    }

    return fun(cursor);
};

export function serializeDate(date: Timestamp.Type): Buffer {
    return encodeWord64(BigInt(date.value), true);
}

export function deserializeDate(cursor: Cursor): Timestamp.Type {
    const value = cursor.read(8).readBigInt64LE(0);
    return Timestamp.fromMillis(Number(value));
}

function deserializeEd25519PublicKey(cursor: Cursor): HexString {
    return cursor.read(32).toString('hex');
}

function deserializeReason(cursor: Cursor): string | undefined {
    return deserializeOptional(cursor, (c) => {
        const len = c.read(1).readUInt8(0);
        return c.read(len).toString('utf8');
    });
}

function serializeCIS4CredentialInfo(credInfo: CIS4.CredentialInfo): Buffer {
    const holderPubKey = Buffer.from(credInfo.holderPubKey, 'hex');
    const holderRevocable = encodeBool(credInfo.holderRevocable);
    const validFrom = serializeDate(credInfo.validFrom);
    const validUntil = makeSerializeOptional(serializeDate)(credInfo.validUntil);
    const metadataUrl = serializeCIS2MetadataUrl(credInfo.metadataUrl);

    return Buffer.concat([holderPubKey, holderRevocable, validFrom, validUntil, metadataUrl]);
}

function serializeAdditionalData(data: HexString): Buffer {
    return packBufferWithWord16Length(Buffer.from(data, 'hex'), true);
}

/**
 * Serializes {@link CIS4.RegisterCredentialParam} into bytes which can be
 * supplied as parameters to `registerCredential` entrypoints on CIS4 contracts
 *
 * @param {CIS4.RegisterCredentialParam} param - The parameters to serialize
 *
 * @returns {Buffer} the parameters serialized to bytes
 */
export function serializeCIS4RegisterCredentialParam(param: CIS4.RegisterCredentialParam): Buffer {
    const credInfo = serializeCIS4CredentialInfo(param.credInfo);
    const additionalData = serializeAdditionalData(param.additionalData);
    return Buffer.concat([credInfo, additionalData]);
}

function deserializeCIS4CredentialInfo(cursor: Cursor): CIS4.CredentialInfo {
    const holderPubKey = deserializeEd25519PublicKey(cursor);
    const holderRevocable = cursor.read(1).readUInt8(0) === 1;
    const validFrom = deserializeDate(cursor);
    const validUntil = deserializeOptional(cursor, deserializeDate);
    const metadataUrl = deserializeCIS2MetadataUrl(cursor);

    return {
        holderPubKey,
        holderRevocable,
        validFrom,
        validUntil,
        metadataUrl,
    };
}

/**
 * Attemps to deserializes a value into {@link CIS4.CredentialEntry}
 *
 * @param {HexString} value - The value (hex encoded) to deserialize
 *
 * @throws If deserialization fails
 *
 * @returns {CIS4.CredentialEntry} The credential entry
 */
export function deserializeCIS4CredentialEntry(value: HexString): CIS4.CredentialEntry {
    const cursor = Cursor.fromHex(value);

    const credentialInfo = deserializeCIS4CredentialInfo(cursor);
    const schemaRef = deserializeCIS2MetadataUrl(cursor);
    const revocationNonce = cursor.read(8).readBigInt64LE(0).valueOf();

    return {
        credentialInfo,
        schemaRef,
        revocationNonce,
    };
}

/**
 * Attemps to deserializes a value into {@link CIS4.CredentialStatus}
 *
 * @param {HexString} value - The value (hex encoded) to deserialize
 *
 * @throws If deserialization fails
 *
 * @returns {CIS4.CredentialStatus} The credential status
 */
export function deserializeCIS4CredentialStatus(value: HexString): CIS4.CredentialStatus {
    const b = Buffer.from(value, 'hex');
    return b.readUInt8(0);
}

function deserializeCIS4RevocationKey(cursor: Cursor): CIS4.RevocationKeyWithNonce {
    const key = deserializeEd25519PublicKey(cursor);
    const nonce = cursor.read(8).readBigInt64LE(0).valueOf();

    return {
        key,
        nonce,
    };
}

/**
 * Attemps to deserializes a value into a list of {@link CIS4.RevocationKeyWithNonce}
 *
 * @param {HexString} value - The value (hex encoded) to deserialize
 *
 * @throws If deserialization fails
 *
 * @returns {CIS4.RevocationKeyWithNonce[]} The revocation keys
 */
export const deserializeCIS4RevocationKeys = makeDeserializeListResponse(deserializeCIS4RevocationKey);

function formatAdditionalData(data: HexString): number[] {
    return Buffer.from(data, 'hex').toJSON().data;
}

/**
 * Format {@link CIS4.RegisterCredentialParam} as JSON compatible with serialization with corresponding schema.
 */
export function formatCIS4RegisterCredential({
    credInfo,
    additionalData,
}: CIS4.RegisterCredentialParam): CIS4.RegisterCredentialParamJson {
    return {
        credential_info: {
            holder_id: credInfo.holderPubKey,
            holder_revocable: credInfo.holderRevocable,
            valid_from: Timestamp.toSchemaValue(credInfo.validFrom),
            valid_until: toOptionJson(
                credInfo.validUntil === undefined ? undefined : Timestamp.toSchemaValue(credInfo.validUntil)
            ),
            metadata_url: {
                url: credInfo.metadataUrl.url,
                hash: toOptionJson(credInfo.metadataUrl.hash),
            },
        },
        auxiliary_data: formatAdditionalData(additionalData),
    };
}

function serializeReason(reason: string) {
    const b = Buffer.from(reason);
    return packBufferWithWord8Length(b);
}

/**
 * Serializes {@link CIS4.RevokeCredentialIssuerParam} into bytes which can be
 * supplied as parameters to `revokeCredentialIssuer` entrypoints on CIS4 contracts
 *
 * @param {CIS4.RevokeCredentialIssuerParam} param - The parameters to serialize
 *
 * @returns {Buffer} the parameters serialized to bytes
 */
export function serializeCIS4RevokeCredentialIssuerParam(param: CIS4.RevokeCredentialIssuerParam): Buffer {
    const credHolderPubKey = Buffer.from(param.credHolderPubKey, 'hex');
    const reason = makeSerializeOptional<string>(serializeReason)(param.reason);
    const additionalData = serializeAdditionalData(param.additionalData);

    return Buffer.concat([credHolderPubKey, reason, additionalData]);
}

/**
 * Format {@link CIS4.RevokeCredentialIssuerParam} as JSON compatible with serialization with corresponding schema.
 */
export function formatCIS4RevokeCredentialIssuer({
    credHolderPubKey,
    reason,
    additionalData,
}: CIS4.RevokeCredentialIssuerParam): CIS4.RevokeCredentialIssuerParamJson {
    return {
        credential_id: credHolderPubKey,
        reason: toOptionJson(reason ? { reason } : undefined),
        auxiliary_data: formatAdditionalData(additionalData),
    };
}

/**
 * Serializes {@link CIS4.RevocationDataHolder} into bytes which can be
 * supplied as parameters to `revokeCredentialHolder` entrypoints on CIS4 contracts prefixed
 * with a signature on the data
 *
 * @param {CIS4.RevocationDataHolder} data - The data to serialize
 *
 * @returns {Buffer} the data serialized to bytes
 */
export function serializeCIS4RevocationDataHolder(data: CIS4.RevocationDataHolder): Buffer {
    const credentialPubKey = Buffer.from(data.credentialPubKey, 'hex');
    const contractAddress = serializeContractAddress(data.signingData.contractAddress);
    const entrypoint = serializeReceiveHookName(data.signingData.entrypoint);
    const nonce = encodeWord64(data.signingData.nonce, true);
    const timestamp = serializeDate(data.signingData.timestamp);
    const reason = makeSerializeOptional<string>(serializeReason)(data.reason);

    return Buffer.concat([credentialPubKey, contractAddress, entrypoint, nonce, timestamp, reason]);
}

/**
 * Format {@link CIS4.RevokeCredentialHolderParam} as JSON compatible with serialization with corresponding schema.
 */
export function formatCIS4RevokeCredentialHolder({
    signature,
    data,
}: CIS4.RevokeCredentialHolderParam): CIS4.RevokeCredentialHolderParamJson {
    const reason = data.reason;
    return {
        signature: signature,
        data: {
            credential_id: data.credentialPubKey,
            signing_data: {
                contract_address: {
                    index: Number(data.signingData.contractAddress.index),
                    subindex: Number(data.signingData.contractAddress.subindex),
                },
                entry_point: EntrypointName.toString(data.signingData.entrypoint),
                nonce: Number(data.signingData.nonce),
                timestamp: Timestamp.toSchemaValue(data.signingData.timestamp),
            },
            reason: toOptionJson(reason ? { reason } : undefined),
        },
    };
}

/**
 * Serializes {@link CIS4.RevocationDataOther} into bytes which can be
 * supplied as parameters to `revokeCredentialOther` entrypoints on CIS4 contracts prefixed
 * with a signature on the data
 *
 * @param {CIS4.RevocationDataOther} data - The data to serialize
 *
 * @returns {Buffer} the data serialized to bytes
 */
export function serializeCIS4RevocationDataOther(data: CIS4.RevocationDataOther): Buffer {
    const credentialPubKey = Buffer.from(data.credentialPubKey, 'hex');
    const contractAddress = serializeContractAddress(data.signingData.contractAddress);
    const entrypoint = serializeReceiveHookName(data.signingData.entrypoint);
    const nonce = encodeWord64(data.signingData.nonce);
    const timestamp = serializeDate(data.signingData.timestamp);
    const revocationPubKey = Buffer.from(data.revocationPubKey, 'hex');
    const reason = makeSerializeOptional<string>(serializeReason)(data.reason);

    return Buffer.concat([credentialPubKey, contractAddress, entrypoint, nonce, timestamp, revocationPubKey, reason]);
}

/**
 * Format {@link CIS4.RevokeCredentialOtherParam} as JSON compatible with serialization with corresponding schema.
 */
export function formatCIS4RevokeCredentialOther({
    signature,
    data,
}: CIS4.RevokeCredentialOtherParam): CIS4.RevokeCredentialOtherParamJson {
    const reason = data.reason;
    return {
        signature: signature,
        data: {
            credential_id: data.credentialPubKey,
            signing_data: {
                contract_address: {
                    index: Number(data.signingData.contractAddress.index),
                    subindex: Number(data.signingData.contractAddress.subindex),
                },
                entry_point: EntrypointName.toString(data.signingData.entrypoint),
                nonce: Number(data.signingData.nonce),
                timestamp: Timestamp.toSchemaValue(data.signingData.timestamp),
            },
            revocation_key: data.revocationPubKey,
            reason: toOptionJson(reason ? { reason } : undefined),
        },
    };
}

/**
 * Serializes {@link CIS4.UpdateRevocationKeysParam} into bytes which can be
 * supplied as parameters to `registerRevocationKeys` and `removeRevocationKeys`
 * entrypoints on CIS4 contracts
 *
 * @param {CIS4.RevokeCredentialIssuerParam} param - The parameters to serialize
 *
 * @returns {Buffer} the parameters serialized to bytes
 */
export function serializeCIS4UpdateRevocationKeysParam(param: CIS4.UpdateRevocationKeysParam): Buffer {
    const ks = param.keys.map((k) => Buffer.from(k, 'hex'));
    const numKeys = encodeWord16(ks.length, true);
    const additionalData = serializeAdditionalData(param.additionalData);

    return Buffer.concat([numKeys, ...ks, additionalData]);
}

function deserializeCredentialType(cursor: Cursor): string {
    const len = cursor.read(1).readUInt8(0);
    return cursor.read(len).toString('utf8');
}

/**
 * Format {@link CIS4.UpdateRevocationKeysParam} as JSON compatible with serialization with corresponding schema.
 */
export function formatCIS4UpdateRevocationKeys({
    keys,
    additionalData,
}: CIS4.UpdateRevocationKeysParam): CIS4.UpdateRevocationKeysParamJson {
    return { keys, auxiliary_data: formatAdditionalData(additionalData) };
}

/**
 * Attemps to deserializes a value into a list of {@link CIS4.MetadataResponse}
 *
 * @param {HexString} value - The value (hex encoded) to deserialize
 *
 * @throws If deserialization fails
 *
 * @returns {CIS4.MetadataResponse} The metadata
 */
export function deserializeCIS4MetadataResponse(value: HexString): CIS4.MetadataResponse {
    const cursor = Cursor.fromHex(value);
    const issuerMetadata = deserializeCIS2MetadataUrl(cursor);
    const credentialType = deserializeCredentialType(cursor);
    const credentialSchema = deserializeCIS2MetadataUrl(cursor);

    return { issuerMetadata, credentialType, credentialSchema };
}

/**
 * Deserializes a CIS-4 event according to the CIS-4 standard.
 *
 * @param {ContractEvent.Type} event - The event to deserialize
 *
 * @returns {CIS4.Event} The deserialized event
 *
 * @throws If the event is not custom (starts with an unreserved tag)
 * and the event cannot be deserialized to a valid CIS-4 event
 */
export function deserializeCIS4Event(event: ContractEvent.Type): CIS4.Event {
    // An empty buffer is a valid custom event
    if (event.buffer.length === 0) {
        return {
            type: CIS4.EventType.Custom,
            data: event.buffer,
        };
    }

    const cursor = Cursor.fromBuffer(event.buffer);
    const tag = cursor.read(1).readUInt8(0);
    if (tag == 249) {
        const credentialPubKey = deserializeEd25519PublicKey(cursor);
        const schemaRef = deserializeCIS2MetadataUrl(cursor);
        const credentialType = deserializeCredentialType(cursor);
        const metadataUrl = deserializeCIS2MetadataUrl(cursor);
        return {
            type: CIS4.EventType.RegisterCredential,
            credentialPubKey,
            schemaRef,
            credentialType,
            metadataUrl,
        };
    } else if (tag == 248) {
        const credentialPubKey = deserializeEd25519PublicKey(cursor);
        const revokerType = cursor.read(1).readUInt8(0);
        let revoker: CIS4.Revoker;
        if (revokerType == 0) {
            revoker = {
                type: CIS4.RevokerType.Issuer,
            };
        } else if (revokerType == 1) {
            revoker = {
                type: CIS4.RevokerType.Holder,
            };
        } else if (revokerType == 2) {
            const key = deserializeEd25519PublicKey(cursor);
            revoker = {
                type: CIS4.RevokerType.Other,
                key,
            };
        } else {
            throw new Error('Failed deserializing CIS-4 RevokeCredential event: Unknown revoker type');
        }
        const reason = deserializeReason(cursor);
        return {
            type: CIS4.EventType.RevokeCredential,
            credentialPubKey,
            revoker,
            reason,
        };
    } else if (tag == 247) {
        const metadataUrl = deserializeCIS2MetadataUrl(cursor);
        return {
            type: CIS4.EventType.IssuerMetadata,
            metadataUrl,
        };
    } else if (tag == 246) {
        const credentialPubKey = deserializeEd25519PublicKey(cursor);
        const metadataUrl = deserializeCIS2MetadataUrl(cursor);
        return {
            type: CIS4.EventType.CredentialMetadata,
            credentialPubKey,
            metadataUrl,
        };
    } else if (tag == 245) {
        const credentialType = deserializeCredentialType(cursor);
        const schemaRef = deserializeCIS2MetadataUrl(cursor);
        return {
            type: CIS4.EventType.CredentialSchemaRef,
            credentialType,
            schemaRef,
        };
    } else if (tag == 244) {
        const key = deserializeEd25519PublicKey(cursor);
        const actionByte = cursor.read(1).readUInt8(0);
        let action: CIS4.RevocationKeyAction;
        if (actionByte == 0) {
            action = CIS4.RevocationKeyAction.Register;
        } else if (actionByte == 1) {
            action = CIS4.RevocationKeyAction.Remove;
        } else {
            throw new Error('Failed deserializing CIS-4 RevocationKey event: Unknown revocation key action');
        }
        return {
            type: CIS4.EventType.RevocationKey,
            key,
            action,
        };
    } else {
        return {
            type: CIS4.EventType.Custom,
            data: event.buffer,
        };
    }
}

/**
 * Deserializes a successful contract invokation to a list of all CIS-4 events
 * (skipping custom events) according to the CIS-4 standard.
 *
 * @param {InvokeContractSuccessResult} result - The contract invokation result to deserialize
 *
 * @returns {CIS4.NonCustomEvent[]} The deserialized events
 */
export function deserializeCIS4EventsFromInvokationResult(result: InvokeContractSuccessResult): CIS4.NonCustomEvent[] {
    return deserializeCIS4ContractTraceEvents(result.events.filter(isKnown));
}

/**
 * Deserializes all CIS-4 events (skipping custom events) from a {@linkcode BlockItemSummary}.
 *
 * @param {BlockItemSummary} summary - The summary to deserialize
 *
 * @returns {CIS4.NonCustomEvent[]} The deserialized events
 */
export function deserializeCIS4EventsFromSummary(summary: BlockItemSummary): CIS4.NonCustomEvent[] {
    if (summary.type !== TransactionSummaryType.AccountTransaction) {
        return [];
    }

    switch (summary.transactionType) {
        case TransactionKindString.Update:
            return deserializeCIS4ContractTraceEvents(summary.events.filter(isKnown));
        case TransactionKindString.InitContract:
            const deserializedEvents = [];
            for (const event of summary.contractInitialized.events) {
                const deserializedEvent = deserializeCIS4Event(ContractEvent.fromHexString(event));
                if (deserializedEvent.type !== CIS4.EventType.Custom) {
                    deserializedEvents.push(deserializedEvent);
                }
            }
            return deserializedEvents;
        default:
            return [];
    }
}

/**
 * Deserializes a list of {@linkcode ContractTraceEvent} into a list of CIS-4 events.
 * This function filters out any custom events.
 *
 * @param {ContractTraceEvent[]} events - The list of contract trace events to deserialize
 *
 * @returns {CIS4.NonCustomEvent[]} The deserialized CIS-4 events
 */
function deserializeCIS4ContractTraceEvents(events: ContractTraceEvent[]): CIS4.NonCustomEvent[] {
    const deserializedEvents = [];
    for (const traceEvent of events) {
        if (!('events' in traceEvent)) {
            continue;
        }
        for (const event of traceEvent.events) {
            const deserializedEvent = deserializeCIS4Event(event);
            if (deserializedEvent.type !== CIS4.EventType.Custom) {
                deserializedEvents.push(deserializedEvent);
            }
        }
    }
    return deserializedEvents;
}
