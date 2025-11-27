import { ConcordiumGRPCClient } from '../../grpc/index.js';
import { ArInfo, AttributeKey, HexString, IpInfo, Network } from '../../types.js';
import { BlockHash, CredentialRegistrationId } from '../../types/index.js';
import { bail } from '../../util.js';
import { CredentialStatus, CredentialsInputsIdentity, DIDString, parseYearMonth } from '../../web3-id/index.js';
import { VerifiableCredentialV1 } from './index.js';
import { AtomicStatementV1 } from './proof.js';
import { ZKProofV4 } from './types.js';

/**
 * A verifiable credential based on identity information from an identity provider.
 * This credential type contains zero-knowledge proofs about identity attributes
 * without revealing the actual identity information.
 */
type IdentityCredential = {
    /** Type identifiers for this credential format */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIdBasedCredential'];
    /** The credential subject containing identity-based statements */
    credentialSubject: {
        /** The identity disclosure information also acts as ephemeral ID */
        id: HexString;
        /** Statements about identity attributes (should match request) */
        statement: AtomicStatementV1<AttributeKey>[];
    };
    /** ISO formatted datetime specifying when the credential is valid from */
    validFrom: string;
    /** ISO formatted datetime specifying when the credential expires */
    validUntil: string;
    /** The zero-knowledge proof for attestation */
    proof: ZKProofV4;
    /** Issuer of the original ID credential */
    issuer: DIDString;
};

/**
 * A verifiable credential based on identity information from an identity provider.
 * This credential type contains zero-knowledge proofs about identity attributes
 * without revealing the actual identity information.
 */
export type Identity = IdentityCredential;

/**
 * A verifiable credential based on an account credential on the Concordium blockchain.
 * This credential type contains zero-knowledge proofs about account credentials
 * and their associated identity attributes.
 */
type AccountCredential = {
    /** Type identifiers for this credential format */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumAccountBasedCredential'];
    /** The credential subject containing account-based statements */
    credentialSubject: {
        /** The account credential identifier as a DID */
        id: DIDString;
        /** Statements about account attributes (should match request) */
        statement: AtomicStatementV1<AttributeKey>[];
    };
    /** The zero-knowledge proof for attestation */
    proof: ZKProofV4;
    /** The issuer of the ID credential used to open the account credential */
    issuer: DIDString;
};

/**
 * A verifiable credential based on an account credential on the Concordium blockchain.
 * This credential type contains zero-knowledge proofs about account credentials
 * and their associated identity attributes.
 */
export type Account = AccountCredential;

/**
 * Union type representing all supported verifiable credential formats
 * in Concordium verifiable presentations.
 *
 * The structure is reminiscent of a w3c verifiable credential
 */
type Credential = IdentityCredential | AccountCredential;

/**
 * Union type representing all supported verifiable credential formats
 * in Concordium verifiable presentations.
 *
 * The structure is reminiscent of a w3c verifiable credential
 */
export type Type = Credential;

export function isIdentityCredential(credential: Credential): credential is IdentityCredential {
    return (credential as IdentityCredential).type.includes('ConcordiumIdBasedCredential');
}

export function isAccountCredential(credential: Credential): credential is AccountCredential {
    return (credential as AccountCredential).type.includes('ConcordiumAccountBasedCredential');
}

// Verification

/**
 * The public data needed to verify an account based verifiable credential.
 */
// This type must match the JSON serialization format of `CredentialVerificationMaterial::Account` in
// concordium-base.
export type AccountVerificationMaterial = {
    /** Union tag */
    type: 'account';
    /** Issuer of the credential. */
    issuer: number;
    /** Commitments for the ID attributes of the account */
    commitments: Partial<Record<AttributeKey, HexString>>;
};

/**
 * The public data needed to verify an identity based verifiable credential.
 */
// This type must match the JSON serialization format of `CredentialVerificationMaterial::Identity`
// in concordium-base.
export type IdentityVerificationMaterial = CredentialsInputsIdentity;

/**
 * Union type of all verification material types used for verification.
 * These inputs contain the public credential data needed to verify proofs.
 */
// This type must match the JSON serialization format of `CredentialVerificationMaterial` in
// concordium-base.
export type VerificationMaterial = AccountVerificationMaterial | IdentityVerificationMaterial;

function parseAccountProofMetadata(cred: AccountCredential): {
    credId: CredentialRegistrationId.Type;
    issuer: number;
} {
    const _bail = () => bail('Failed to parse metedata from account credential proof');
    const [, c] = cred.credentialSubject.id.match(/.*:cred:(.*)$/) ?? _bail();
    const [, i] = cred.issuer.match(/.*:idp:(\d*)$/) ?? _bail();

    const credId = CredentialRegistrationId.fromHexString(c);
    const issuer = Number(i);

    return { credId, issuer };
}

function parseIdentityProofMetadata(cred: IdentityCredential): number {
    const _bail = () => bail('Failed to parse metedata from identity credential proof');
    const [, i] = cred.issuer.match(/.*:idp:(\d*)$/) ?? _bail();
    return Number(i);
}

/** Contains the credential status and inputs required to verify a corresponding credential proof */
export type MetadataVerificationResult = {
    /** The credential status */
    status: CredentialStatus;
    /** The public data required to verify a corresponding credential proof */
    inputs: VerificationMaterial;
};

async function verifyIdentityMetadata(
    credential: VerifiableCredentialV1.Identity,
    grpc: ConcordiumGRPCClient,
    blockHash?: BlockHash.Type
): Promise<{ status: CredentialStatus; inputs: IdentityVerificationMaterial }> {
    const issuerIndex = parseIdentityProofMetadata(credential);
    let ipInfo: IpInfo | undefined;
    for await (const idp of grpc.getIdentityProviders()) {
        if (idp.ipIdentity !== issuerIndex) {
            continue;
        }

        ipInfo = idp;
        break;
    }
    if (ipInfo === undefined) throw new Error('Failed to find identity provider for credential');

    const arsInfos: Record<number, ArInfo> = {};
    for await (const arInfo of grpc.getAnonymityRevokers()) {
        arsInfos[arInfo.arIdentity] = arInfo;
    }

    const { blockSlotTime: now } = await grpc.getBlockInfo(blockHash);

    const validFrom = new Date(credential.validFrom);
    const validUntil = new Date(credential.validUntil);

    let status = CredentialStatus.Active;
    if (validFrom > now) status = CredentialStatus.NotActivated;
    if (validUntil < now) status = CredentialStatus.Expired;

    return { inputs: { type: 'identity', arsInfos, ipInfo }, status };
}

async function verifyAccountMetadata(
    credential: VerifiableCredentialV1.Account,
    grpc: ConcordiumGRPCClient,
    blockHash?: BlockHash.Type
): Promise<{ status: CredentialStatus; inputs: AccountVerificationMaterial }> {
    const { credId } = parseAccountProofMetadata(credential);
    const ai = await grpc.getAccountInfo(credId, blockHash);

    const cred =
        Object.values(ai.accountCredentials).find((c) => {
            const _credId = c.value.type === 'initial' ? c.value.contents.regId : c.value.contents.credId;
            return credId.credId === _credId;
        }) ?? bail(`Could not find credential for account ${ai.accountAddress}`);

    if (cred.value.type === 'initial') {
        throw new Error(`Initial credential ${cred.value.contents.regId} cannot be used`);
    }
    const { ipIdentity, policy, commitments } = cred.value.contents;

    // At this point, we know we're dealing with a "normal" account credential.
    const validFrom = parseYearMonth(policy.createdAt);
    const validUntil = parseYearMonth(policy.validTo);

    const { blockSlotTime: now } = await grpc.getBlockInfo(blockHash);
    let status = CredentialStatus.Active;
    if (validFrom > now) status = CredentialStatus.NotActivated;
    if (validUntil < now) status = CredentialStatus.Expired;

    const inputs: AccountVerificationMaterial = {
        type: 'account',
        issuer: ipIdentity,
        commitments: commitments.cmmAttributes,
    };
    return { status, inputs };
}

/**
 * Verifies the public metadata of the {@linkcode VerifiableCredentialProof}.
 *
 * @param credential - The credential proof to verify metadata for
 * @param grpc - The {@linkcode ConcordiumGRPCClient} to use for querying
 * @param network - The target network
 * @param [blockHash] - The block to verify the proof at. If not specified, the last finalized block is used.
 *
 * @returns The corresponding verification material along with a credential status if successful.
 * @throws If credential metadata could not be successfully verified
 */
export async function verifyMetadata(
    credential: VerifiableCredentialV1.Type,
    grpc: ConcordiumGRPCClient,
    network: Network,
    blockHash?: BlockHash.Type
): Promise<MetadataVerificationResult> {
    const [, parsedNetwork] =
        credential.credentialSubject.id.match(/did:ccd:(.*):.*:.*/) ?? bail('Failed to parse network from credential');
    if (parsedNetwork.toLowerCase() !== network.toLowerCase()) {
        bail(
            `Network found in credential (${parsedNetwork.toLowerCase()}) did not match expected network (${network.toLowerCase()})`
        );
    }

    if (VerifiableCredentialV1.isIdentityCredential(credential)) {
        return verifyIdentityMetadata(credential, grpc, blockHash);
    } else {
        return verifyAccountMetadata(credential, grpc, blockHash);
    }
}
