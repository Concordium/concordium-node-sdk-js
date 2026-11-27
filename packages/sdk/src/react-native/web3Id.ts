import type { AttributeKey, AttributeList, IdentityObjectV1, IdentityProvider } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';
import { AttributesKeys } from '../types/attributes.js';
import {
    createAccountCommitmentInput,
    createIdentityCommitmentInput,
    createWeb3CommitmentInput,
} from '../web3-id/commitmentInputs.js';
import type {
    AccountCommitmentInput,
    AtomicStatementV2,
    CredentialSubject,
    IdentityCommitmentInput,
    Web3IssuerCommitmentInput,
} from '../web3-id/types.js';
import type { ConcordiumHdWallet } from './HdWallet.js';

export async function createAccountCommitmentInputWithHdWallet(
    statements: AtomicStatementV2[],
    identityProvider: number,
    attributes: AttributeList,
    wallet: ConcordiumHdWallet,
    identityIndex: number,
    credIndex: number
): Promise<AccountCommitmentInput> {
    const entries = await Promise.all(
        statements.map(async ({ attributeTag }) => {
            const derived = await wallet.getAttributeCommitmentRandomness(
                identityProvider,
                identityIndex,
                credIndex,
                AttributesKeys[attributeTag as AttributeKey]
            );
            return [attributeTag, derived.toString('hex')] as const;
        })
    );
    return createAccountCommitmentInput(statements, identityProvider, attributes, Object.fromEntries(entries));
}

export async function createWeb3CommitmentInputWithHdWallet(
    wallet: ConcordiumHdWallet,
    issuer: ContractAddress.Type,
    credentialIndex: number,
    credentialSubject: CredentialSubject,
    randomness: Record<string, string>,
    signature: string
): Promise<Web3IssuerCommitmentInput> {
    const key = await wallet.getVerifiableCredentialSigningKey(issuer, credentialIndex);
    return createWeb3CommitmentInput(key.toString('hex'), credentialSubject, randomness, signature);
}

export async function createIdentityCommitmentInputWithHdWallet(
    idObject: IdentityObjectV1,
    identityProvider: IdentityProvider,
    identityIndex: number,
    wallet: ConcordiumHdWallet
): Promise<IdentityCommitmentInput> {
    const provider = identityProvider.ipInfo.ipIdentity;
    const [prfKey, idCredSecret, randomness] = await Promise.all([
        wallet.getPrfKey(provider, identityIndex),
        wallet.getIdCredSec(provider, identityIndex),
        wallet.getSignatureBlindingRandomness(provider, identityIndex),
    ]);
    return createIdentityCommitmentInput(identityProvider, idObject, {
        randomness: randomness.toString('hex'),
        aci: {
            prfKey: prfKey.toString('hex'),
            credentialHolderInformation: { idCredSecret: idCredSecret.toString('hex') },
        },
    });
}
