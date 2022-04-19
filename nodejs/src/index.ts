import ConcordiumNodeClient from './client';
import {
    getAccountTransactionHash,
    getAccountTransactionSignDigest,
    getCredentialDeploymentSignDigest,
    getCredentialDeploymentTransactionHash,
    getCredentialForExistingAccountSignDigest,
    serializeInitContractParameters,
    serializeUpdateContractParameters,
} from '@concordium/common/lib/src/serialization';
import { sha256 } from '@concordium/common/lib/src/hash';
import { getModuleBuffer } from '@concordium/common/lib/src/deserializeSchema';

export { ConcordiumNodeClient };
export * from '@concordium/common/lib/src/types';
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
export { CredentialRegistrationId } from '@concordium/common/lib/src/types/CredentialRegistrationId';
export { AccountAddress } from '@concordium/common/lib/src/types/accountAddress';
export { GtuAmount } from '@concordium/common/lib/src/types/gtuAmount';
export { TransactionExpiry } from '@concordium/common/lib/src/types/transactionExpiry';
export { DataBlob } from '@concordium/common/lib/src/types/DataBlob';
export { ModuleReference } from '@concordium/common/lib/src/types/moduleReference';
export {
    decryptMobileWalletExport,
    EncryptedData,
} from '@concordium/common/lib/src/wallet/crypto';
export { MobileWalletExport } from '@concordium/common/lib/src/wallet/types';
export {
    createCredentialDeploymentTransaction,
    createUnsignedCredentialForExistingAccount,
    getAccountAddress,
    buildSignedCredentialForExistingAccount,
} from '@concordium/common/lib/src/credentialDeploymentTransactions';
export { isAlias, getAlias } from '@concordium/common/lib/src/alias';
export { deserializeContractState } from '@concordium/common/lib/src/deserialization';
export * from '@concordium/common/lib/src/blockSummaryHelpers';
