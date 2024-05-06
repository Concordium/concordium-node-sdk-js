import { ConcordiumGRPCClient } from '../grpc/GRPCClient.ts';
import { BlockHash, VerifiablePresentation, Network } from '../pub/types.ts';
import { VerifiableCredentialProof } from '../types/VerifiablePresentation.ts';
import { CredentialWithMetadata } from './types.ts';

// TODO: doc
export async function verifyCredentialMetadata(
    grpc: ConcordiumGRPCClient,
    network: Network,
    credential: VerifiableCredentialProof,
    blockHash?: BlockHash.Type
): Promise<CredentialWithMetadata> {
    throw new Error('Not implemented');
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
