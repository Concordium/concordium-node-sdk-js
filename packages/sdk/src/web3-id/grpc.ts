import { CIS4Contract } from '../cis4/CIS4Contract.js';
import { CIS4 } from '../cis4/util.js';
import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { BlockHash, ContractAddress, CredentialRegistrationId, Network, VerifiablePresentation } from '../pub/types.js';
import {
    VerifiableCredentialProof,
    VerifiableCredentialProofAccount,
    VerifiableCredentialProofWeb3Id,
    isWeb3IdProof,
} from '../types/VerifiablePresentation.js';
import { bail } from '../util.js';
import { parseYearMonth } from './helpers.js';
import { CredentialWithMetadata, CredentialsInputsAccount, CredentialsInputsWeb3 } from './types.js';

function parseAccountProofMetadata(cred: VerifiableCredentialProofAccount): {
    credId: CredentialRegistrationId.Type;
    issuer: number;
} {
    const _bail = () => bail('Failed to parse metedata from credential proof');
    const [, c] = cred.credentialSubject.id.match(/.*:cred:(.*)$/) ?? _bail();
    const [, i] = cred.issuer.match(/.*:idp:(\d*)$/) ?? _bail();

    const credId = CredentialRegistrationId.fromHexString(c);
    const issuer = Number(i);

    return { credId, issuer };
}

function parseWeb3IdProofMetadata(cred: VerifiableCredentialProofWeb3Id): {
    contract: ContractAddress.Type;
    holder: string;
} {
    const _bail = () => bail('Failed to parse metedata from credential proof');
    const [, index, subindex] = cred.issuer.match(/.*:sci:(\d*):(\d*)\/issuer$/) ?? _bail();
    const [, h] = cred.credentialSubject.id.match(/.*:pkc:(.*)$/) ?? _bail();

    const contract = ContractAddress.create(BigInt(index), BigInt(subindex));
    const holder = h;

    return { contract, holder };
}

/**
 * Verifies the public metadata of the {@linkcode VerifiableCredentialProof}.
 *
 * @param grpc - The {@linkcode ConcordiumGRPCClient} to use for querying
 * @param network - The target network
 * @param credential - The credential proof to verify metadata for
 * @param [blockHash] - The block to verify the proof at. If not specified, the last finalized block is used.
 *
 * @returns The corresponding {@linkcode CredentialWithMetadata} if successful.
 * @throws If credential proof could not be successfully verified
 */
export async function verifyCredentialMetadata(
    grpc: ConcordiumGRPCClient,
    network: Network,
    credential: VerifiableCredentialProof,
    blockHash?: BlockHash.Type
): Promise<CredentialWithMetadata> {
    const [, parsedNetwork] =
        credential.credentialSubject.id.match(/did:ccd:(.*):.*:.*/) ?? bail('Failed to parse network from credential');
    if (parsedNetwork.toLowerCase() !== network.toLowerCase()) {
        bail(
            `Network found in credential (${parsedNetwork.toLowerCase()}) did not match expected network (${network.toLowerCase()})`
        );
    }

    if (isWeb3IdProof(credential)) {
        const { contract, holder } = parseWeb3IdProofMetadata(credential);
        const cis4 = await CIS4Contract.create(grpc, contract);

        const issuerPk = await cis4.issuer();
        const status = await cis4.credentialStatus(holder);

        const inputs: CredentialsInputsWeb3 = { type: 'web3', issuerPk };
        return { status, inputs };
    } else {
        const { credId, issuer } = parseAccountProofMetadata(credential);
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
        if (ipIdentity !== issuer) {
            throw new Error('Mismatch between expected issuer and found issuer for credential');
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
}

/**
 * Get all public metadata of the {@linkcode VerifiablePresentation}. The metadata is verified as part of this.
 *
 * @param grpc - The {@linkcode ConcordiumGRPCClient} to use for querying
 * @param network - The target network
 * @param presentation - The verifiable presentation to verify
 * @param [blockHash] - The block to verify the proof at. If not specified, the last finalized block is used.
 *
 * @returns The corresponding list of {@linkcode CredentialWithMetadata} if successful.
 * @throws If presentation could not be successfully verified
 */
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
