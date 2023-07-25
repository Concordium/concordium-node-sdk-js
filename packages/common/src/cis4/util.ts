import { Buffer } from 'buffer/';

import type { HexString } from '../types';
import type { CIS2 } from '../cis2';
import { deserializeCIS2MetadataUrl } from '../cis2/util';
import { Cursor } from '../deserializationHelpers';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS4 {
    /** Structure holding an url pointing to some metadata, including an optional checksum */
    export type MetadataUrl = CIS2.MetadataUrl;

    /** Holds info pertaining to a credential. */
    export type CredentialInfo = {
        /** Ed25519 public key of credential holder */
        holderPubKey: HexString;
        /** Whether holder can revoke or not */
        holderRevocable: boolean;
        /** Pedersen commitment to the attributes of the verifiable credential represented as hex string */
        commitment: HexString;
        /** Time the credential is valid from */
        validFrom: Date;
        /** Time the credential is valid until */
        validUntil: Date;
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
        /** The nonce is used to avoid replay attacks when checking the holder's
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
}

function deserializeCredentialType(cursor: Cursor): string {
    const length = cursor.read(1).readUInt8(0);
    return cursor.read(length).toString();
}

function deserializeDate(cursor: Cursor): Date {
    const value = cursor.read(20).toString('utf8'); // TODO: Asuming a fixed length of 20 is used?
    return new Date(value);
}

function deserializePedersenCommitment(cursor: Cursor): HexString {
    const length = cursor.read(2).readUInt16LE(0);
    const value = cursor.read(length).toString('hex');
    return value;
}

function deserializeCredentialInfo(cursor: Cursor): CIS4.CredentialInfo {
    const holderPubKey = cursor.read(32).toString('hex');
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
    const cursor = new Cursor(Buffer.from(value, 'hex'));

    const credentialInfo = deserializeCredentialInfo(cursor);
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
