import { Buffer } from 'buffer/';

import type { HexString } from '../types';
import type { CIS2 } from '../cis2';
import {
    deserializeCIS2MetadataUrl,
    serializeCIS2MetadataUrl,
} from '../cis2/util';
import { Cursor, makeDeserializeListResponse } from '../deserializationHelpers';
import {
    encodeBool,
    makeSerializeOptional,
    packBufferWithWord16Length,
    packBufferWithWord8Length,
} from '../serializationHelpers';
import { OptionJson, toOptionJson } from '../schemaTypes';

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
        /** Pedersen commitment to the attributes of the verifiable credential represented as hex string */
        commitment: HexString;
        /** Time the credential is valid from */
        validFrom: Date;
        /** Time the credential is valid until */
        validUntil?: Date;
        /** The type of the credential, which is used to identify which schema the credential is based on */
        credentialType: string;
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

    /** schema serializable JSON representation of parameter for the "registerCredential entrypoint"*/
    export type RegisterCredentialParamJson = {
        credential_info: {
            holder_id: HexString;
            holder_revocable: boolean;
            commitment: HexString;
            /** Time (as ms since unix epoch) the credential is valid from */
            valid_from: number;
            /** Time (as ms since unix epoch) the credential is valid until */
            valid_until: OptionJson<number>;
            credential_type: string;
            metadata_url: {
                url: string;
                hash: OptionJson<HexString>;
            };
        };
        /** Additional data to include, hex encoded */
        auxiliary_data: HexString;
    };
}

function serializeCredentialType(type: string): Buffer {
    const b = Buffer.from(type, 'utf8');
    return packBufferWithWord8Length(b);
}

function deserializeCredentialType(cursor: Cursor): string {
    const length = cursor.read(1).readUInt8(0);
    return cursor.read(length).toString();
}

function serializeDate(date: Date): Buffer {
    return Buffer.from(date.toISOString(), 'utf8');
}

function deserializeDate(cursor: Cursor): Date {
    const value = cursor.read(20).toString('utf8'); // TODO: Asuming a fixed length of 20 is used?
    return new Date(value);
}

function serializePedersenCommitment(value: HexString): Buffer {
    const b = Buffer.from(value, 'hex');
    return packBufferWithWord16Length(b);
}

function deserializePedersenCommitment(cursor: Cursor): HexString {
    const length = cursor.read(2).readUInt16LE(0);
    const value = cursor.read(length).toString('hex');
    return value;
}

function deserializeEd25519PublicKey(cursor: Cursor): HexString {
    return cursor.read(32).toString('hex');
}

function serializeCIS4CredentialInfo(credInfo: CIS4.CredentialInfo): Buffer {
    const holderPubKey = Buffer.from(credInfo.holderPubKey, 'hex');
    const holderRevocable = encodeBool(credInfo.holderRevocable);
    const commitment = serializePedersenCommitment(credInfo.commitment);
    const validFrom = serializeDate(credInfo.validFrom);
    const validUntil = makeSerializeOptional(serializeDate)(
        credInfo.validUntil
    );
    const credentialType = serializeCredentialType(credInfo.credentialType);
    const metadataUrl = serializeCIS2MetadataUrl(credInfo.metadataUrl);

    return Buffer.concat([
        holderPubKey,
        holderRevocable,
        commitment,
        validFrom,
        validUntil,
        credentialType,
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
    const commitment = deserializePedersenCommitment(cursor);
    const validFrom = deserializeDate(cursor);
    const validUntil = deserializeDate(cursor);
    const credentialType = deserializeCredentialType(cursor);
    const metadataUrl = deserializeCIS2MetadataUrl(cursor);

    return {
        holderPubKey,
        holderRevocable,
        commitment,
        validFrom,
        validUntil,
        credentialType,
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
 * Format {@link CIS2.UpdateOperator} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS4RegisterCredential({
    credInfo,
    additionalData,
}: CIS4.RegisterCredentialParam): CIS4.RegisterCredentialParamJson {
    return {
        credential_info: {
            holder_id: credInfo.holderPubKey,
            holder_revocable: credInfo.holderRevocable,
            commitment: credInfo.commitment,
            valid_from: credInfo.validFrom.getTime(),
            valid_until: toOptionJson(credInfo.validUntil?.getTime()),
            credential_type: credInfo.credentialType,
            metadata_url: {
                url: credInfo.metadataUrl.url,
                hash: toOptionJson(credInfo.metadataUrl.hash),
            },
        },
        auxiliary_data: additionalData,
    };
}
