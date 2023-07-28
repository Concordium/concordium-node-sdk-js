import { Buffer } from 'buffer/';

import type { ContractAddress, HexString } from '../types';
import type { CIS2 } from '../cis2';
import {
    deserializeCIS2MetadataUrl,
    serializeCIS2MetadataUrl,
    serializeContractAddress,
} from '../cis2/util';
import { Cursor, makeDeserializeListResponse } from '../deserializationHelpers';
import {
    encodeBool,
    encodeWord64,
    makeSerializeOptional,
    packBufferWithWord16Length,
} from '../serializationHelpers';
import { OptionJson, toOptionJson } from '../schemaTypes';
import { getSignature } from '../signHelpers';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS4 {
    /** Structure holding an url pointing to some metadata, including an optional checksum */
    export type MetadataUrl = CIS2.MetadataUrl;

    /** Holds info pertaining to a credential. */
    export type CredentialInfo = {
        /** Ed25519 public key of credential holder (hex encoded) */
        holderPubKey: HexString;
        /** Whether holder can revoke or not */
        holderRevocable: boolean;
        /** Time the credential is valid from */
        validFrom: Date;
        /** Time the credential is valid until */
        validUntil?: Date;
        /** Metadata url of the credential */
        metadataUrl: MetadataUrl;
    };

    /** Response to a credential data query. */
    export type CredentialEntry = {
        /** Info for the credential entry */
        credentialInfo: CredentialInfo;
        /** A schema URL or DID address pointing to the JSON schema for a verifiable credential */
        schemaRef: MetadataUrl;
        /**
         * The nonce is used to avoid replay attacks when checking the holder's
         * signature on a revocation message. This is the nonce that should be used
         * when signing a revocation.
         */
        revocationNonce: bigint;
    };

    export enum CredentialStatus {
        Active,
        Revoked,
        Expired,
        NotActivated,
    }

    export type RevocationKeyWithNonce = {
        key: HexString;
        nonce: bigint;
    };

    export type RegisterCredentialParam = {
        credInfo: CredentialInfo;
        additionalData: HexString;
    };

    export type RevokeCredentialIssuerParam = {
        credHolderPubKey: HexString;
        reason?: string;
    };

    export type SigningData = {
        contractAddress: ContractAddress;
        entryPoint: string; // TODO: this seems to be missing or not taken into account in the implementation in the rust SDK?
        nonce: bigint;
        timestamp: Date;
    };

    export type RevocationDataHolder = {
        credentialPubKey: HexString;
        signingData: SigningData;
        reason?: string;
    };

    export type RevokeCredentialHolderParam = {
        signature: HexString;
        data: RevocationDataHolder;
    };

    export type RevocationDataOther = {
        credentialPubKey: HexString;
        signingData: SigningData;
        revocationPubKey: HexString;
        reason?: string;
    };

    export type RevokeCredentialOtherParam = {
        signature: HexString;
        data: RevocationDataOther;
    };

    /** schema serializable JSON representation of parameter for the "registerCredential" entrypoint */
    export type RegisterCredentialParamJson = {
        credential_info: {
            holder_id: HexString;
            holder_revocable: boolean;
            /** Time (as ms since unix epoch) the credential is valid from */
            valid_from: number;
            /** Time (as ms since unix epoch) the credential is valid until */
            valid_until: OptionJson<number>;
            metadata_url: {
                url: string;
                hash: OptionJson<HexString>;
            };
        };
        /** Additional data to include, hex encoded */
        auxiliary_data: HexString;
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialIssuer" entrypoint */
    export type RevokeCredentialIssuerParamJson = {
        cred_holder_id: HexString;
        reason: OptionJson<string>;
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialHolder" entrypoint */
    export type RevokeCredentialHolderParamJson = {
        signature: HexString;
        data: {
            credential_id: HexString;
            signing_data: {
                contract_address: {
                    index: number;
                    subindex: number;
                };
                entry_point: string;
                nonce: number;
                timestamp: number;
            };
            reason: OptionJson<string>;
        };
    };

    /** schema serializable JSON representation of parameter for the "revokeCredentialOther" entrypoint */
    export type RevokeCredentialOtherParamJson = {
        signature: HexString;
        data: {
            credential_id: HexString;
            signing_data: {
                contract_address: {
                    index: number;
                    subindex: number;
                };
                entry_point: string;
                nonce: number;
                timestamp: number;
            };
            revocation_key: HexString;
            reason: OptionJson<string>;
        };
    };
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
    constructor(private privateKey: HexString, private publicKey: HexString) {}

    /** Public key of signer */
    public get pubKey(): HexString {
        return this.publicKey;
    }

    /**
     * Signs the message given
     *
     * @param {Buffer} message - the message to sign
     *
     * @returns {Buffer} the signature on `message`
     */
    public async sign(message: Buffer): Promise<Buffer> {
        return getSignature(message, this.privateKey);
    }
}

/**
 * Expected prefix of messages signed for CIS4 revocation entrypoints.
 */
export const REVOKE_DOMAIN = Buffer.from('WEB3ID:REVOKE', 'utf8');

function serializeDate(date: Date): Buffer {
    return Buffer.from(date.toISOString(), 'utf8');
}

function deserializeDate(cursor: Cursor): Date {
    const value = cursor.read(20).toString('utf8'); // TODO: Assuming a fixed length of 20 is used?
    return new Date(value);
}

function deserializeEd25519PublicKey(cursor: Cursor): HexString {
    return cursor.read(32).toString('hex');
}

function serializeCIS4CredentialInfo(credInfo: CIS4.CredentialInfo): Buffer {
    const holderPubKey = Buffer.from(credInfo.holderPubKey, 'hex');
    const holderRevocable = encodeBool(credInfo.holderRevocable);
    const validFrom = serializeDate(credInfo.validFrom);
    const validUntil = makeSerializeOptional(serializeDate)(
        credInfo.validUntil
    );
    const metadataUrl = serializeCIS2MetadataUrl(credInfo.metadataUrl);

    return Buffer.concat([
        holderPubKey,
        holderRevocable,
        validFrom,
        validUntil,
        metadataUrl,
    ]);
}

export function serializeCIS4RegisterCredentialParam(
    param: CIS4.RegisterCredentialParam
): Buffer {
    const credInfo = serializeCIS4CredentialInfo(param.credInfo);
    const additionalData = packBufferWithWord16Length(
        Buffer.from(param.additionalData, 'hex')
    );
    return Buffer.concat([credInfo, additionalData]);
}

function deserializeCIS4CredentialInfo(cursor: Cursor): CIS4.CredentialInfo {
    const holderPubKey = deserializeEd25519PublicKey(cursor);
    const holderRevocable = cursor.read(1).readUInt8(0) === 1;
    const validFrom = deserializeDate(cursor);
    const validUntil = deserializeDate(cursor);
    const metadataUrl = deserializeCIS2MetadataUrl(cursor);

    return {
        holderPubKey,
        holderRevocable,
        validFrom,
        validUntil,
        metadataUrl,
    };
}

export function deserializeCIS4CredentialEntry(
    value: HexString
): CIS4.CredentialEntry {
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

export function deserializeCIS4CredentialStatus(
    value: HexString
): CIS4.CredentialStatus {
    const b = Buffer.from(value, 'hex');
    return b.readUInt8(0); // TODO: Assumes the status is represented as a uint8?
}

function deserializeCIS4RevocationKey(
    cursor: Cursor
): CIS4.RevocationKeyWithNonce {
    const key = deserializeEd25519PublicKey(cursor);
    const nonce = cursor.read(8).readBigInt64LE(0).valueOf();

    return {
        key,
        nonce,
    };
}

export const deserializeCIS4RevocationKeys = makeDeserializeListResponse(
    deserializeCIS4RevocationKey
);

/**
 * Format {@link CIS4.RegisterCredentialParam} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS4RegisterCredential({
    credInfo,
    additionalData,
}: CIS4.RegisterCredentialParam): CIS4.RegisterCredentialParamJson {
    return {
        credential_info: {
            holder_id: credInfo.holderPubKey,
            holder_revocable: credInfo.holderRevocable,
            valid_from: credInfo.validFrom.getTime(),
            valid_until: toOptionJson(credInfo.validUntil?.getTime()),
            metadata_url: {
                url: credInfo.metadataUrl.url,
                hash: toOptionJson(credInfo.metadataUrl.hash),
            },
        },
        auxiliary_data: additionalData,
    };
}

export function serializeCIS4RevokeCredentialIssuerParam(
    param: CIS4.RevokeCredentialIssuerParam
): Buffer {
    const credHolderPubKey = Buffer.from(param.credHolderPubKey, 'hex');
    const reason = makeSerializeOptional<string>((r) => Buffer.from(r, 'utf8'))(
        param.reason
    );

    return Buffer.concat([credHolderPubKey, reason]);
}

/**
 * Format {@link CIS4.RevokeCredentialIssuerParam} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS4RevokeCredentialIssuer({
    credHolderPubKey,
    reason,
}: CIS4.RevokeCredentialIssuerParam): CIS4.RevokeCredentialIssuerParamJson {
    return {
        cred_holder_id: credHolderPubKey,
        reason: toOptionJson(reason),
    };
}

export function serializeCIS4RevocationDataHolder(
    data: CIS4.RevocationDataHolder
): Buffer {
    const credentialPubKey = Buffer.from(data.credentialPubKey, 'hex');
    const contractAddress = serializeContractAddress(
        data.signingData.contractAddress
    );
    // const entrypoint = Buffer.from(data.signingData.entryPoint, 'ascii'); // TODO: this doesn't seem to be used in the version in the rust SDK?
    const nonce = encodeWord64(data.signingData.nonce);
    const timestamp = encodeWord64(
        BigInt(data.signingData.timestamp.getTime())
    );
    const reason = makeSerializeOptional<string>((r) => Buffer.from(r, 'utf8'))(
        data.reason
    );

    return Buffer.concat([
        credentialPubKey,
        contractAddress,
        /* entrypoint, */
        nonce,
        timestamp,
        reason,
    ]);
}

/**
 * Format {@link CIS4.RevokeCredentialHolderParam} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS4RevokeCredentialHolder({
    signature,
    data,
}: CIS4.RevokeCredentialHolderParam): CIS4.RevokeCredentialHolderParamJson {
    return {
        signature: signature,
        data: {
            credential_id: data.credentialPubKey,
            signing_data: {
                contract_address: {
                    index: Number(data.signingData.contractAddress.index),
                    subindex: Number(data.signingData.contractAddress.subindex),
                },
                entry_point: data.signingData.entryPoint,
                nonce: Number(data.signingData.nonce),
                timestamp: data.signingData.timestamp.getTime(),
            },
            reason: toOptionJson(data.reason),
        },
    };
}

export function serializeCIS4RevocationDataOther(
    data: CIS4.RevocationDataOther
): Buffer {
    const credentialPubKey = Buffer.from(data.credentialPubKey, 'hex');
    const contractAddress = serializeContractAddress(
        data.signingData.contractAddress
    );
    // const entrypoint = Buffer.from(data.signingData.entryPoint, 'ascii'); // TODO: this doesn't seem to be used in the version in the rust SDK?
    const nonce = encodeWord64(data.signingData.nonce);
    const timestamp = encodeWord64(
        BigInt(data.signingData.timestamp.getTime())
    );
    const revocationPubKey = Buffer.from(data.revocationPubKey, 'hex');
    const reason = makeSerializeOptional<string>((r) => Buffer.from(r, 'utf8'))(
        data.reason
    );

    return Buffer.concat([
        credentialPubKey,
        contractAddress,
        /* entrypoint, */
        nonce,
        timestamp,
        revocationPubKey,
        reason,
    ]);
}

/**
 * Format {@link CIS4.RevokeCredentialOtherParam} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS4RevokeCredentialOther({
    signature,
    data,
}: CIS4.RevokeCredentialOtherParam): CIS4.RevokeCredentialOtherParamJson {
    return {
        signature: signature,
        data: {
            credential_id: data.credentialPubKey,
            signing_data: {
                contract_address: {
                    index: Number(data.signingData.contractAddress.index),
                    subindex: Number(data.signingData.contractAddress.subindex),
                },
                entry_point: data.signingData.entryPoint,
                nonce: Number(data.signingData.nonce),
                timestamp: data.signingData.timestamp.getTime(),
            },
            revocation_key: data.revocationPubKey,
            reason: toOptionJson(data.reason),
        },
    };
}
