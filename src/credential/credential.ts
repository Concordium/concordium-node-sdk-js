import { CommitmentsRandomness, CryptographicParameters, UnsignedCredentialDeploymentInformation, VerifyKey, WithRandomness } from "../types";
import { Identity } from "../mobileTypes";
import * as wasm from "../../pkg/desktop_wallet";

export function createUnsignedCredentialInfo(
    identity: Identity,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number
): WithRandomness<UnsignedCredentialDeploymentInformation> {
    const identityProvider = identity.identityProvider;
    const credentialInput: Record<string, unknown> = {
        ipInfo: identityProvider.ipInfo,
        arsInfos: identityProvider.arsInfos,
        global: cryptographicParameters,
        identityObject: identity.identityObject,
        randomness: {
            randomness: identity.privateIdObjectData.randomness
        },
        publicKeys,
        credentialNumber: credentialIndex,
        threshold,
        prfKey: identity.privateIdObjectData.aci.prfKey,
        idCredSec: identity.privateIdObjectData.aci.credentialHolderInformation.idCredSecret,
        revealedAttributes: []
    };

    const unsignedCredentialDeploymentInfoString = wasm.generateUnsignedCredential(JSON.stringify(credentialInput));
    const result: WithRandomness<UnsignedCredentialDeploymentInformation> = JSON.parse(unsignedCredentialDeploymentInfoString);
    return result;
}
