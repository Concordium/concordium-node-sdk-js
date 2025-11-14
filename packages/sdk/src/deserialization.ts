import { getAccountTransactionHandler } from './accountTransactions.js';
import { Cursor } from './deserializationHelpers.js';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    ChainArData,
    CredentialPublicKeys,
    isAccountTransactionType,
    UpdateCredentialsPayload,
    VerifyKey,
} from './types.js';
import * as AccountAddress from './types/AccountAddress.js';
import * as Energy from './types/Energy.js';
import * as AccountSequenceNumber from './types/SequenceNumber.js';
import * as TransactionExpiry from './types/TransactionExpiry.js';

/**
 * Reads an unsigned 8-bit integer from the given {@link Cursor}.
 *
 * @param source input stream
 * @returns number from 0 to 255
 */
export function deserializeUint8(source: Cursor): number {
    return source.read(1).readUInt8(0);
}

function deserializeMap<K extends string | number | symbol, T>(
    serialized: Cursor,
    decodeSize: (size: Cursor) => number,
    decodeKey: (k: Cursor) => K,
    decodeValue: (t: Cursor) => T
): Record<K, T> {
    const size = decodeSize(serialized);
    const result = {} as Record<K, T>;
    for (let i = 0; i < size; i += 1) {
        const key = decodeKey(serialized);
        const value = decodeValue(serialized);
        result[key] = value;
    }
    return result;
}

function deserializeAccountTransactionSignature(signatures: Cursor): AccountTransactionSignature {
    const decodeSignature = (serialized: Cursor) => {
        const length = serialized.read(2).readUInt16BE(0);
        return serialized.read(length).toString('hex');
    };
    const decodeCredentialSignatures = (serialized: Cursor) =>
        deserializeMap(serialized, deserializeUint8, deserializeUint8, decodeSignature);
    return deserializeMap(signatures, deserializeUint8, deserializeUint8, decodeCredentialSignatures);
}

function deserializeTransactionHeader(serializedHeader: Cursor): AccountTransactionHeader {
    const sender = AccountAddress.fromBuffer(serializedHeader.read(32));
    const nonce = AccountSequenceNumber.create(serializedHeader.read(8).readBigUInt64BE(0));
    // execution energyAmount
    const executionEnergyAmount = Energy.create(serializedHeader.read(8).readBigUInt64BE(0));
    // payloadSize
    const payloadSize = serializedHeader.read(4).readUInt32BE(0);
    const expiry = TransactionExpiry.fromEpochSeconds(serializedHeader.read(8).readBigUInt64BE(0));
    return {
        sender,
        nonce,
        expiry,
        executionEnergyAmount,
        payloadSize,
    };
}

export function deserializeAccountTransaction(serializedTransaction: Cursor): {
    accountTransaction: AccountTransaction;
    signatures: AccountTransactionSignature;
} {
    const signatures = deserializeAccountTransactionSignature(serializedTransaction);

    const header = deserializeTransactionHeader(serializedTransaction);

    const transactionType = deserializeUint8(serializedTransaction);
    if (!isAccountTransactionType(transactionType)) {
        throw new Error('TransactionType is not a valid value: ' + transactionType);
    }
    const accountTransactionHandler = getAccountTransactionHandler(transactionType);
    const payload = accountTransactionHandler.deserialize(serializedTransaction);

    return {
        accountTransaction: {
            type: transactionType,
            payload,
            header,
        },
        signatures,
    };
}

export function deserializeCredentialDeploymentValues(serializedPayload: Cursor, data: Partial<UpdateCredentialsPayload>, currentLocation: number) {

    //CredentialDeploymentValues.publicKeys
    const publicKeys = deserializeCredentialPublicKeys(serializedPayload);
    
    //CredentialDeploymentValues.credId
    const credId = serializedPayload.read(48);

    //CredentialDeploymentValues.ipId
    const ipId = serializedPayload.read(4).readUInt32BE(0);

    //CredentialDeploymentValues.revocationThreshold
    const revocationThreshold = serializedPayload.read(1).readUInt8(0);

    //CredentialDeploymentValues.arData
    const arDataCount = serializedPayload.read(1).readUInt8(0);
    const arData = deserializeArDataEntry(serializedPayload);

    //CredentialDeploymentValues.policy section
    const validTo = serializedPayload.read(3);
    const createdAt = serializedPayload.read(3);
    const countAtrributes = serializedPayload.read(2).readUInt16BE(0);

    const revealedAttributes: Partial<Record<any,any>> = {}; 
    for(let a = 0; a < countAtrributes; a++) {
        //AttributeEntry
        const attributeTag = serializedPayload.read(1);
        const countAttributeValue = serializedPayload.read(1).readUInt8(0);
        const attributeValue = serializedPayload.read(countAttributeValue);
        
        revealedAttributes[attributeTag.toString()] = attributeValue;
    }
    //end of policy section
    
    if(data.newCredentials) {
        data.newCredentials[currentLocation].cdi = {
            credId: credId.toString(),
            revocationThreshold: revocationThreshold,
            arData: arData,

            //TODO: Still looking for this
            commitments: {
                cmmPrf: '',
                cmmCredCounter: '',
                cmmIdCredSecSharingCoeff: [],
                cmmAttributes: {},
                cmmMaxAccounts: '',
            },
            //TODO: still looking for this
            proofs: '',

            ipIdentity: ipId,
            credentialPublicKeys: publicKeys,
            policy: {
                validTo: validTo.toString(),
                createdAt: createdAt.toString(),
                revealedAttributes: revealedAttributes,
            },
        }
    }
}

export function deserializeArDataEntry(serializedPayload: Cursor): Record<any, any> {

    const result:Record<any, any> = {};
    //ArData.count
    const count = serializedPayload.read(1).readUInt8(0);
    
    for(let i = 0; i < count; i++) {
        //ArData.ArDataEntry
        //          .arIdentity
        const arIdentity = serializedPayload.read(4);
        //          .data
        const data = deserializeChainArData(serializedPayload);

        result[arIdentity.toString()] = data;
    }
    
    return result;
}

export function deserializeChainArData(serializedPayload: Cursor): ChainArData {
    //ChainArData.idCredPubShare
    const idCredPubShare = serializedPayload.read(96);

    return {
        encIdCredPubShare: idCredPubShare.toString(),
    }
}

export function deserializeCredentialPublicKeys(serializedPayload: Cursor): CredentialPublicKeys {
    //CredentialPublicKeys.count
    const count = serializedPayload.read(1).readUInt8(0);

    //CredentialPublicKeys.keys: count x CredentialVerifyKeyEntry
    const keys: Record<any, any> = {};
    for(let i = 0; i < count; i++) {
        const credentialVerifyKeyEntry = deserializeCredentialVerifyKey(serializedPayload);
        keys[credentialVerifyKeyEntry.index] = credentialVerifyKeyEntry.key;
    }

    //CredentialPublicKeys.threshold
    const threshold = serializedPayload.read(1).readUInt8(0);

    return {
        keys: keys,
        threshold: threshold,
    }
}

interface CredentialVerifyKeyEntry {
    index: number;
    key: VerifyKey;
}

export function deserializeCredentialVerifyKey(serializedPayload: Cursor): CredentialVerifyKeyEntry {
    //CredentialVerifyKeyEntry.index
    const index = serializedPayload.read(1).readUInt8(0);

    //CredentialVerifyKeyEntry.key
    const scheme = serializedPayload.read(1).readUInt8(0);
    const verifyKey = serializedPayload.read(32);

    const verifyKeyObject: VerifyKey = {
        schemeId: scheme.toString(),
        verifyKey: verifyKey.toString('hex'),
    }

    return {
        index: index,
        key: verifyKeyObject,
    }
}

export function deserializeCredentialDeploymentProofs(serializedPayload: Cursor, data: Partial<UpdateCredentialsPayload>, currentLocation: number) {

    //CredentialDeploymentProofs.idProofs
    //  IdOwnershipProofs.sig
    const blindedSignature = serializedPayload.read(96);

    //  IdOwnershipProofs.commitments
    const prf = serializedPayload.read(48);
    const credCounter = serializedPayload.read(48);
    const maxAccounts = serializedPayload.read(48);
    
    const attributeCommitmentRecords: Record<any, any> = {};
    const lengthAttributes = serializedPayload.read(2).readUInt16BE(0);
    for(let a = 0; a < lengthAttributes; a++) {
        //AttributeCommitment
        const attributeTag = serializedPayload.read(1).readUInt8(0);
        const attributeCommitment = serializedPayload.read(48);
        attributeCommitmentRecords[attributeTag] = attributeCommitment;
    }
    
    const sharingCoeffsLength = serializedPayload.read(8).readBigUInt64BE(0);
    for(let a = 0; a < sharingCoeffsLength; a++) {
        serializedPayload.read(48); //sharingCoeffs being read, not stored anywhere
    }

    //  IdOwnershipProofs.challenge
    const challenge = serializedPayload.read(32);

    //  IdOwnershipProofs.proofIdCredPub
    const proofIdCredPubLength = serializedPayload.read(4).readUInt32BE(0);
    for(let a = 0; a < proofIdCredPubLength; a++) {
        const arIdentity = serializedPayload.read(4);
        const comEncEqResponse = serializedPayload.read(96);
    }

    //  start of IdOwnershipProofs.proofIpSig
    const responseRho = serializedPayload.read(32);
    const proofLength = serializedPayload.read(4).readUInt32BE(0);
    //length x (F, F)
    for(let a = 0; a < proofLength; a++) {
        const firstF = serializedPayload.read(32);
        const secondF = serializedPayload.read(32);
    }
    //  end of IdOwnershipProofs.proofIpSig

    //IdOwnershipProofs.proofRegId
    serializedPayload.read(160);

    //IdOwnershipProofs.proofCredCounter
    serializedPayload.read(48*4); //4 times 48, g1Elements
    serializedPayload.read(32*3); //3 times 32, scalars1
    
    const groupElementLength = serializedPayload.read(4).readUInt32BE(0);
    for(let a = 0; a < groupElementLength; a++) {
        serializedPayload.read(48);
        serializedPayload.read(48);
    }

    serializedPayload.read(32*2) //2 times 32, scalars2

    //AccountOwnershipProof
    const numberOfSignatures = serializedPayload.read(1).readUInt8(0);

    for(let a = 0; a < numberOfSignatures; a++) {
        //AccountOwnershipProofEntry
        const index = serializedPayload.read(1);
        const sig = serializedPayload.read(64);
    }

    //populate placeholder, if any can be populated, and go back to the for loop in deserialize() and read next CredentialDeploymentInformation, if any    
}

export function deserializeCredentialsToBeRemoved(serializedPayload: Cursor, data: Partial<UpdateCredentialsPayload>) {
    
    //TransactionPayload.UpdateCredentials.removeLength
    //number of credentials to be removed
    const removeLength = serializedPayload.read(1).readUInt8(0);

    //TransactionPayload.UpdateCredentials.CredIds
    const removeCredIds: string[] = [];
    //the credential IDs of the credentials to be removed, based on the removeLength value
    for(let a = 0; a < removeLength; a++) {
        const credentialRegistrationId = serializedPayload.read(48);
        removeCredIds[a] = credentialRegistrationId.toString();
    }

    //TransactionPayload.UpdateCredentials.newThresholdd
    //AccountThreshold
    const newThreshold = serializedPayload.read(1).readUInt8(0);

    //populate placeholder
    data.removeCredentialIds = removeCredIds;
    data.threshold = newThreshold;

    //TODO:This is not part of the transaction model, so no value to deserialize, will be passing an empty value for now
    data.currentNumberOfCredentials = undefined;

    //now need to construct the UpdateCredentialsPayload based on the partial data, so we return our way upwards to the deserialize() function
}

