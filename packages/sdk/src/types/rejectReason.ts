import { EncodedTokenModuleRejectReason, TokenId } from '../plt/index.js';
import { Address, BakerId, Base58String, HexString } from '../types.js';
import type * as CcdAmount from './CcdAmount.js';
import type * as ContractAddress from './ContractAddress.js';
import type * as InitName from './InitName.js';
import type * as ModuleReference from './ModuleReference.js';
import type * as Parameter from './Parameter.js';
import type * as ReceiveName from './ReceiveName.js';

/*
 * An enum containing all the possible reject reasons that can be
 * received from a node as a response to a transaction submission.
 *
 * This should be kept in sync with the list of reject reasons
 * found here: https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Types/Execution.hs
 */
export enum RejectReasonTag {
    // Module not "well formed", meaning it is not a valid smart contract
    ModuleNotWF = 'ModuleNotWF',
    ModuleHashAlreadyExists = 'ModuleHashAlreadyExists',
    InvalidAccountReference = 'InvalidAccountReference',
    InvalidInitMethod = 'InvalidInitMethod',
    InvalidReceiveMethod = 'InvalidReceiveMethod',
    InvalidModuleReference = 'InvalidModuleReference',
    InvalidContractAddress = 'InvalidContractAddress',
    RuntimeFailure = 'RuntimeFailure',
    AmountTooLarge = 'AmountTooLarge',
    SerializationFailure = 'SerializationFailure',
    OutOfEnergy = 'OutOfEnergy',
    RejectedInit = 'RejectedInit',
    RejectedReceive = 'RejectedReceive',
    NonExistentRewardAccount = 'NonExistentRewardAccount',
    InvalidProof = 'InvalidProof',
    AlreadyABaker = 'AlreadyABaker',
    NotABaker = 'NotABaker',
    InsufficientBalanceForBakerStake = 'InsufficientBalanceForBakerStake',
    StakeUnderMinimumThresholdForBaking = 'StakeUnderMinimumThresholdForBaking',
    BakerInCooldown = 'BakerInCooldown',
    DuplicateAggregationKey = 'DuplicateAggregationKey',
    NonExistentCredentialID = 'NonExistentCredentialID',
    KeyIndexAlreadyInUse = 'KeyIndexAlreadyInUse',
    InvalidAccountThreshold = 'InvalidAccountThreshold',
    InvalidCredentialKeySignThreshold = 'InvalidCredentialKeySignThreshold',
    InvalidEncryptedAmountTransferProof = 'InvalidEncryptedAmountTransferProof',
    InvalidTransferToPublicProof = 'InvalidTransferToPublicProof',
    EncryptedAmountSelfTransfer = 'EncryptedAmountSelfTransfer',
    InvalidIndexOnEncryptedTransfer = 'InvalidIndexOnEncryptedTransfer',
    ZeroScheduledAmount = 'ZeroScheduledAmount',
    NonIncreasingSchedule = 'NonIncreasingSchedule',
    FirstScheduledReleaseExpired = 'FirstScheduledReleaseExpired',
    ScheduledSelfTransfer = 'ScheduledSelfTransfer',
    InvalidCredentials = 'InvalidCredentials',
    DuplicateCredIDs = 'DuplicateCredIDs',
    NonExistentCredIDs = 'NonExistentCredIDs',
    RemoveFirstCredential = 'RemoveFirstCredential',
    CredentialHolderDidNotSign = 'CredentialHolderDidNotSign',
    NotAllowedMultipleCredentials = 'NotAllowedMultipleCredentials',
    NotAllowedToReceiveEncrypted = 'NotAllowedToReceiveEncrypted',
    NotAllowedToHandleEncrypted = 'NotAllowedToHandleEncrypted',
    MissingBakerAddParameters = 'MissingBakerAddParameters',
    FinalizationRewardCommissionNotInRange = 'FinalizationRewardCommissionNotInRange',
    BakingRewardCommissionNotInRange = 'BakingRewardCommissionNotInRange',
    TransactionFeeCommissionNotInRange = 'TransactionFeeCommissionNotInRange',
    AlreadyADelegator = 'AlreadyADelegator',
    InsufficientBalanceForDelegationStake = 'InsufficientBalanceForDelegationStake',
    MissingDelegationAddParameters = 'MissingDelegationAddParameters',
    InsufficientDelegationStake = 'InsufficientDelegationStake',
    DelegatorInCooldown = 'DelegatorInCooldown',
    NotADelegator = 'NotADelegator',
    DelegationTargetNotABaker = 'DelegationTargetNotABaker',
    StakeOverMaximumThresholdForPool = 'StakeOverMaximumThresholdForPool',
    PoolWouldBecomeOverDelegated = 'PoolWouldBecomeOverDelegated',
    PoolClosed = 'PoolClosed',
    NonExistentTokenId = 'NonExistentTokenId',
    TokenUpdateTransactionFailed = 'TokenUpdateTransactionFailed',
}

export interface RejectedReceive {
    tag: RejectReasonTag.RejectedReceive;
    contractAddress: ContractAddress.Type;
    receiveName: ReceiveName.Type;
    rejectReason: number;
    parameter: Parameter.Type;
}

export interface RejectedInit {
    tag: RejectReasonTag.RejectedInit;
    rejectReason: number;
}

export type SimpleRejectReasonTag =
    | RejectReasonTag.ModuleNotWF
    | RejectReasonTag.RuntimeFailure
    | RejectReasonTag.SerializationFailure
    | RejectReasonTag.OutOfEnergy
    | RejectReasonTag.InvalidProof
    | RejectReasonTag.InsufficientBalanceForBakerStake
    | RejectReasonTag.StakeUnderMinimumThresholdForBaking
    | RejectReasonTag.BakerInCooldown
    | RejectReasonTag.NonExistentCredentialID
    | RejectReasonTag.KeyIndexAlreadyInUse
    | RejectReasonTag.InvalidAccountThreshold
    | RejectReasonTag.InvalidCredentialKeySignThreshold
    | RejectReasonTag.InvalidEncryptedAmountTransferProof
    | RejectReasonTag.InvalidTransferToPublicProof
    | RejectReasonTag.InvalidIndexOnEncryptedTransfer
    | RejectReasonTag.ZeroScheduledAmount
    | RejectReasonTag.NonIncreasingSchedule
    | RejectReasonTag.FirstScheduledReleaseExpired
    | RejectReasonTag.InvalidCredentials
    | RejectReasonTag.RemoveFirstCredential
    | RejectReasonTag.CredentialHolderDidNotSign
    | RejectReasonTag.NotAllowedMultipleCredentials
    | RejectReasonTag.NotAllowedToReceiveEncrypted
    | RejectReasonTag.NotAllowedToHandleEncrypted
    | RejectReasonTag.MissingBakerAddParameters
    | RejectReasonTag.FinalizationRewardCommissionNotInRange
    | RejectReasonTag.BakingRewardCommissionNotInRange
    | RejectReasonTag.TransactionFeeCommissionNotInRange
    | RejectReasonTag.AlreadyADelegator
    | RejectReasonTag.InsufficientBalanceForDelegationStake
    | RejectReasonTag.MissingDelegationAddParameters
    | RejectReasonTag.InsufficientDelegationStake
    | RejectReasonTag.DelegatorInCooldown
    | RejectReasonTag.StakeOverMaximumThresholdForPool
    | RejectReasonTag.PoolWouldBecomeOverDelegated
    | RejectReasonTag.PoolClosed;

export type ModuleRefRejectReasonTag = RejectReasonTag.ModuleHashAlreadyExists | RejectReasonTag.InvalidModuleReference;

export type AccountAddressRejectReasonTag =
    | RejectReasonTag.InvalidAccountReference
    | RejectReasonTag.NotADelegator
    | RejectReasonTag.NonExistentRewardAccount
    | RejectReasonTag.NotABaker
    | RejectReasonTag.ScheduledSelfTransfer
    | RejectReasonTag.EncryptedAmountSelfTransfer;

export type StringRejectReasonTag =
    | ModuleRefRejectReasonTag
    | AccountAddressRejectReasonTag
    | RejectReasonTag.DuplicateAggregationKey;

export type TokenRejectReasonTag = RejectReasonTag.NonExistentTokenId | RejectReasonTag.TokenUpdateTransactionFailed;

export interface StringRejectReason {
    tag: StringRejectReasonTag;
    contents: HexString | Base58String;
}
export type BakerIdRejectReasonTag = RejectReasonTag.AlreadyABaker | RejectReasonTag.DelegationTargetNotABaker;

export interface BakerIdRejectReason {
    tag: BakerIdRejectReasonTag;
    contents: BakerId;
}

export interface SimpleRejectReason {
    tag: SimpleRejectReasonTag;
}

export interface InvalidReceiveMethod {
    tag: RejectReasonTag.InvalidReceiveMethod;
    contents: {
        moduleRef: ModuleReference.Type;
        receiveName: ReceiveName.Type;
    };
}

export interface InvalidInitMethod {
    tag: RejectReasonTag.InvalidInitMethod;
    contents: {
        moduleRef: ModuleReference.Type;
        initName: InitName.Type;
    };
}

export interface AmountTooLarge {
    tag: RejectReasonTag.AmountTooLarge;
    contents: {
        address: Address;
        amount: CcdAmount.Type;
    };
}

export interface InvalidContractAddress {
    tag: RejectReasonTag.InvalidContractAddress;
    contents: ContractAddress.Type;
}

export type CredIdsRejectReasonTag = RejectReasonTag.DuplicateCredIDs | RejectReasonTag.NonExistentCredIDs;

export interface CredIdsRejectReason {
    tag: CredIdsRejectReasonTag;
    contents: string[];
}

export type NonExistingTokenIdRejectReason = {
    tag: RejectReasonTag.NonExistentTokenId;
    /** The non-existent token ID that caused the rejection */
    contents: TokenId.Type;
};

export type TokenUpdateTransactionFailedRejectReason = {
    tag: RejectReasonTag.TokenUpdateTransactionFailed;
    /** The specific token module reject reason that caused the transaction to fail */
    contents: EncodedTokenModuleRejectReason;
};

export type TokenRejectReason = NonExistingTokenIdRejectReason | TokenUpdateTransactionFailedRejectReason;

type RejectReasonCommon =
    | SimpleRejectReason
    | StringRejectReason
    | RejectedInit
    | RejectedReceive
    | InvalidContractAddress
    | CredIdsRejectReason;

export type RejectReason =
    | RejectReasonCommon
    | BakerIdRejectReason
    | InvalidReceiveMethod
    | InvalidInitMethod
    | AmountTooLarge
    | TokenRejectReason;
