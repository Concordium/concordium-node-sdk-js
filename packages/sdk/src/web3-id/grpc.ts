import { CIS4 } from '../cis4/util.ts';
import { ConcordiumGRPCClient } from '../grpc/GRPCClient.ts';
import {
    BlockHash,
    VerifiablePresentation,
    Network,
    CredentialRegistrationId,
} from '../pub/types.ts';
import {
    VerifiableCredentialProof,
    VerifiableCredentialProofAccount,
} from '../types/VerifiablePresentation.ts';
import { parseYearMonth } from './helpers.ts';
import { CredentialWithMetadata, CredentialsInputsAccount } from './types.ts';

function parseAccountProofMetadata(cred: VerifiableCredentialProofAccount): {
    credId: CredentialRegistrationId.Type;
    issuer: number;
} {
    const credIdRaw = cred.credentialSubject.id.match(/.*:cred:(.*)$/)?.[1];
    const issuer = Number(cred.issuer.match(/.*:idp:(\d*)$/)?.[1]);

    if (credIdRaw === undefined || Number.isNaN(issuer)) {
        throw new Error('Failed to parse metedata from credential proof');
    }

    const credId = CredentialRegistrationId.fromHexString(credIdRaw);

    return { credId, issuer };
}

// TODO: doc
export async function verifyCredentialMetadata(
    grpc: ConcordiumGRPCClient,
    network: Network,
    credential: VerifiableCredentialProof,
    blockHash?: BlockHash.Type
): Promise<CredentialWithMetadata> {
    switch (credential.tag) {
        case 'account': {
            const { credId, issuer } = parseAccountProofMetadata(credential);
            const ai = await grpc.getAccountInfo(credId, blockHash);

            const cred = Object.values(ai.accountCredentials).find((c) => {
                const _credId =
                    c.value.type === 'initial'
                        ? c.value.contents.regId
                        : c.value.contents.credId;
                return credId.credId === _credId;
            });
            if (cred === undefined) {
                throw new Error(
                    `Could not find credential for account ${ai.accountAddress}`
                );
            }
            if (cred.value.type === 'initial') {
                throw new Error(
                    `Initial credential ${cred.value.contents.regId} cannot be used`
                );
            }
            const { ipIdentity, policy, commitments } = cred.value.contents;
            if (ipIdentity !== issuer) {
                throw new Error(
                    'Mismatch between expected issuer and found issuer for credential'
                );
            }

            // At this point, we know we're dealing with a "normal" account credential.
            const validFrom = parseYearMonth(policy.createdAt);
            const validUntil = parseYearMonth(policy.validTo);

            const { blockSlotTime: now } = await grpc.getBlockInfo(blockHash);
            let status = CIS4.CredentialStatus.Active;
            if (validFrom > now) status = CIS4.CredentialStatus.NotActivated;
            if (validUntil < now) status = CIS4.CredentialStatus.Expired;

            const inputs: CredentialsInputsAccount = {
                type: 'account',
                commitments: commitments.cmmAttributes,
            };
            return { status, inputs };
        }
        case 'web3Id': {
            throw new Error('Not implemented');
        }
        default: {
            throw new Error(
                `Unknown tag for union found: ${
                    (credential as VerifiableCredentialProof).tag
                }`
            );
        }
    }
}

// TODO: doc
export async function getPublicData(
    grpc: ConcordiumGRPCClient,
    network: Network,
    presentation: VerifiablePresentation,
    blockHash?: BlockHash.Type
): Promise<CredentialWithMetadata[]> {
    const promises = presentation.verifiableCredential.map((vc) =>
        verifyCredentialMetadata(grpc, network, vc, blockHash)
    );

    return await Promise.all(promises);
}
