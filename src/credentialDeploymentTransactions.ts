import { encodeWord16, encodeWord32, encodeWord64, encodeWord8, encodeWord8FromString, serializeMap, serializeVerifyKey, serializeYearMonth } from "./serializationHelpers";
import { Buffer } from 'buffer/';
import { AttributesKeys, CredentialDeploymentValues, IdOwnershipProofs, UnsignedCredentialDeploymentInformation } from "./types";
import { TransactionExpiry } from ".";

function serializeCredentialDeploymentValues(credential: CredentialDeploymentValues) {
    const buffers = [];
    buffers.push(
        serializeMap(
            credential.credentialPublicKeys.keys,
            encodeWord8,
            encodeWord8FromString,
            serializeVerifyKey
        )
    );

    buffers.push(encodeWord8(credential.credentialPublicKeys.threshold));
    buffers.push(Buffer.from(credential.credId, 'hex'));
    buffers.push(encodeWord32(credential.ipIdentity));
    buffers.push(encodeWord8(credential.revocationThreshold));
    buffers.push(
        serializeMap(
            credential.arData,
            encodeWord16,
            (key) => encodeWord32(parseInt(key, 10)),
            (arData) => Buffer.from(arData.encIdCredPubShare, 'hex')
        )
    );
    buffers.push(serializeYearMonth(credential.policy.validTo));
    buffers.push(serializeYearMonth(credential.policy.createdAt));
    const revealedAttributes = Object.entries(
        credential.policy.revealedAttributes
    );
    buffers.push(encodeWord16(revealedAttributes.length));

    const revealedAttributeTags: [
        number,
        string
    ][] = revealedAttributes.map(([tagName, value]) => [
        AttributesKeys[tagName as keyof typeof AttributesKeys],
        value,
    ]);
    revealedAttributeTags
        .sort((a, b) => a[0] - b[0])
        .forEach(([tag, value]) => {
            const serializedAttributeValue = Buffer.from(value, 'utf-8');
            const serializedTag = encodeWord8(tag);
            const serializedAttributeValueLength = encodeWord8(serializedAttributeValue.length);
            buffers.push(Buffer.concat([serializedTag, serializedAttributeValueLength]));
            buffers.push(serializedAttributeValue);
        });

    return Buffer.concat(buffers);
}

/**
 * Serializes the IdOwnershipProofs as expected by the node. This constitutes
 * a part of the serialization of a credential deployment.
 * @param proofs the proofs the serialize
 * @returns the serialization of IdOwnershipProofs
 */
function serializeIdOwnershipProofs(proofs: IdOwnershipProofs) {
    const proofIdCredPub = encodeWord32(Object.entries(proofs.proofIdCredPub).length);
    const idCredPubProofs = Buffer.concat(
        Object.entries(proofs.proofIdCredPub)
            .sort(
                ([indexA], [indexB]) =>
                    parseInt(indexA, 10) - parseInt(indexB, 10)
            )
            .map(([index, value]) => {
                // TODO I think I want to rewrite this with the encode methods instead.
                const proof = Buffer.alloc(4 + 96);
                proof.writeUInt32BE(parseInt(index, 10), 0);
                proof.write(value, 4, 100, 'hex');
                return proof;
            })
    );

    return Buffer.concat([
        Buffer.from(proofs.sig, 'hex'),
        Buffer.from(proofs.commitments, 'hex'),
        Buffer.from(proofs.challenge, 'hex'),
        proofIdCredPub,
        idCredPubProofs,
        Buffer.from(proofs.proofIpSig, 'hex'),
        Buffer.from(proofs.proofRegId, 'hex'),
        Buffer.from(proofs.credCounterLessThanMaxAccounts, 'hex'),
    ]);
}

/**
 * Serializes unsigned credential deployment information. This serialization is used to be
 * hashed and signed as part of a credential deployment transaction.
 * @param unsignedCredentialDeploymentInformation the credential information to sign
 * @returns the serialization of the unsigned credential deployment information
 */
export function serializeCredentialDeploymentInformation(unsignedCredentialDeploymentInformation: UnsignedCredentialDeploymentInformation, expiry: TransactionExpiry) {
    const serializedCredentialValues = serializeCredentialDeploymentValues(unsignedCredentialDeploymentInformation);
    const serializedIdOwnershipProofs = serializeIdOwnershipProofs(unsignedCredentialDeploymentInformation.proofs);
    const newAccountByte = encodeWord8(0);
    return Buffer.concat([serializedCredentialValues, serializedIdOwnershipProofs, newAccountByte, encodeWord64(expiry.expiryEpochSeconds)]);
}
