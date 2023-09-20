import {
    Address,
    Base58String,
    DigitString,
    HexString,
    Amount,
    BakerId,
} from '../types.js';
import type * as ContractAddress from './ContractAddress.js';

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
}

export interface RejectedReceive {
    tag: RejectReasonTag.RejectedReceive;
    contractAddress: ContractAddress.Type;
    receiveName: string;
    rejectReason: number;
    parameter: HexString;
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

export type ModuleRefRejectReasonTag =
    | RejectReasonTag.ModuleHashAlreadyExists
    | RejectReasonTag.InvalidModuleReference;

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

export interface StringRejectReason {
    tag: StringRejectReasonTag;
    contents: HexString | Base58String;
}
export type BakerIdRejectReasonTag =
    | RejectReasonTag.AlreadyABaker
    | RejectReasonTag.DelegationTargetNotABaker;

export interface BakerIdRejectReason {
    tag: BakerIdRejectReasonTag;
    contents: BakerId;
}

/**
 * @deprecated This is type for describing return types for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface NumberRejectReason {
    tag: BakerIdRejectReasonTag;
    contents: number;
}

export interface SimpleRejectReason {
    tag: SimpleRejectReasonTag;
}

export interface InvalidReceiveMethod {
    tag: RejectReasonTag.InvalidReceiveMethod;
    contents: {
        moduleRef: HexString;
        receiveName: string;
    };
}

/**
 * @deprecated This is type for describing return types for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface InvalidReceiveMethodV1 {
    tag: RejectReasonTag.InvalidReceiveMethod;
    contents: [HexString, string]; // [moduleRef, receiveName]
}

export interface InvalidInitMethod {
    tag: RejectReasonTag.InvalidInitMethod;
    contents: {
        moduleRef: HexString;
        initName: string; // [moduleRef, initName]
    };
}

/**
 * @deprecated This is type for describing return types for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface InvalidInitMethodV1 {
    tag: RejectReasonTag.InvalidInitMethod;
    contents: [HexString, string]; // [moduleRef, initName]
}

export interface AmountTooLarge {
    tag: RejectReasonTag.AmountTooLarge;
    contents: {
        address: Address;
        amount: Amount;
    };
}

/**
 * @deprecated This is type for describing return types for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface AmountTooLargeV1 {
    tag: RejectReasonTag.AmountTooLarge;
    contents: [Address, DigitString]; // [address, amount]
}

export interface InvalidContractAddress {
    tag: RejectReasonTag.InvalidContractAddress;
    contents: ContractAddress.Type;
}

export type CredIdsRejectReasonTag =
    | RejectReasonTag.DuplicateCredIDs
    | RejectReasonTag.NonExistentCredIDs;

export interface CredIdsRejectReason {
    tag: CredIdsRejectReasonTag;
    contents: string[];
}

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
    | AmountTooLarge;

/**
 * @deprecated This is type for describing return types for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export type RejectReasonV1 =
    | RejectReasonCommon
    | NumberRejectReason
    | InvalidReceiveMethodV1
    | InvalidInitMethodV1
    | AmountTooLargeV1;
