import ConcordiumNodeClient from './client';
import {
    getAccountTransactionHash,
    getAccountTransactionSignDigest,
    getCredentialDeploymentSignDigest,
    getCredentialDeploymentTransactionHash,
    getCredentialForExistingAccountSignDigest,
    serializeInitContractParameters,
    serializeUpdateContractParameters,
} from './serialization';
import { sha256 } from './hash';
import { getModuleBuffer } from './deserializeSchema';

export { ConcordiumNodeClient };
export * from './types';
export {
    getAccountTransactionHash,
    getAccountTransactionSignDigest,
    getCredentialDeploymentSignDigest,
    getCredentialDeploymentTransactionHash,
    getCredentialForExistingAccountSignDigest,
    serializeInitContractParameters,
    serializeUpdateContractParameters,
    getModuleBuffer,
};
export { sha256 };
export { CredentialRegistrationId } from './types/CredentialRegistrationId';
export { AccountAddress } from './types/accountAddress';
export { GtuAmount } from './types/gtuAmount';
export { TransactionExpiry } from './types/transactionExpiry';
export { DataBlob } from './types/DataBlob';
export { ModuleReference } from './types/moduleReference';
export { decryptMobileWalletExport, EncryptedData } from './wallet/crypto';
export { MobileWalletExport } from './wallet/types';
export {
    createCredentialDeploymentTransaction,
    createUnsignedCredentialForExistingAccount,
    getAccountAddress,
    buildSignedCredentialForExistingAccount,
} from './credentialDeploymentTransactions';
export { isAlias, getAlias } from './alias';
export {
    generateBakerKeys,
    BakerKeyVariant,
    buildAddBakerPayload,
    buildUpdateBakerKeysPayload,
    serializeBakerCredentials,
    getBakerId,
} from './wallet/baker';
export { deserializeContractState } from './deserialization';
