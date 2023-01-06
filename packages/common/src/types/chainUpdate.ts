import type {
    IpInfo,
    ArInfo,
    VerifyKey,
    ExchangeRate,
    TransactionFeeDistribution,
    MintDistribution,
    GasRewards,
    MintRate,
    CommissionRates,
} from '../types';

export type UpdateInstructionPayload =
    | ExchangeRate
    | TransactionFeeDistribution
    | FoundationAccount
    | MintDistribution
    | ProtocolUpdate
    | GasRewards
    | BakerStakeThreshold
    | ElectionDifficulty
    | HigherLevelKeyUpdate
    | AuthorizationKeysUpdate
    | AddAnonymityRevoker
    | AddIdentityProvider
    | CooldownParameters
    | PoolParameters
    | TimeParameters;

export interface Fraction {
    numerator: bigint;
    denominator: bigint;
}

export type AddIdentityProvider = IpInfo;
export type AddAnonymityRevoker = ArInfo;

export interface FoundationAccount {
    address: string;
}

export interface ProtocolUpdate {
    message: string;
    specificationUrl: string;
    specificationHash: string;
    specificationAuxiliaryData?: string;
}

export interface BakerStakeThreshold {
    threshold: bigint;
}

export interface ElectionDifficulty {
    electionDifficulty: number;
}

export interface TimeParameters {
    rewardPeriodLength: bigint;
    mintRatePerPayday: MintRate;
}

export interface CooldownParameters {
    poolOwnerCooldown: bigint;
    delegatorCooldown: bigint;
}

export interface CommissionRange {
    min: number;
    max: number;
}

export interface CommissionRanges {
    finalizationRewardCommission: CommissionRange;
    bakingRewardCommission: CommissionRange;
    transactionFeeCommission: CommissionRange;
}

export interface PoolParameters {
    passiveCommissions: CommissionRates;
    commissionBounds: CommissionRanges;
    minimumEquityCapital: bigint;
    capitalBound: number;
    leverageBound: Fraction;
}

export enum KeyUpdateEntryStatus {
    Added,
    Removed,
    Unchanged,
}

export interface KeyWithStatus {
    key: VerifyKey;
    status: KeyUpdateEntryStatus;
}

export type HigherLevelKeyUpdateType = 0 | 1;
/**
 * The higher level key update covers three transaction types:
 *  - Updating root keys with root keys
 *  - Updating level 1 keys with root keys
 *  - Updating level 1 keys with level 1 keys
 */
export interface HigherLevelKeyUpdate {
    // Has to be 0 when updating root keys with root keys,
    // 1 when updating level 1 keys with root keys, and
    // 0 when updating level 1 keys with level 1 keys.
    keyUpdateType: HigherLevelKeyUpdateType;
    updateKeys: KeyWithStatus[];
    threshold: number;
}

export interface KeyIndexWithStatus {
    index: number;
    status: KeyUpdateEntryStatus;
}

export enum AccessStructureEnum {
    emergency,
    protocol,
    electionDifficulty,
    euroPerEnergy,
    microGtuPerEuro,
    foundationAccount,
    mintDistribution,
    transactionFeeDistribution,
    gasRewards,
    poolParameters,
    addAnonymityRevoker,
    addIdentityProvider,
    cooldownParameters,
    timeParameters,
}

export interface AccessStructure {
    publicKeyIndicies: KeyIndexWithStatus[];
    threshold: number;
    type: AccessStructureEnum;
}

export interface AuthorizationKeysUpdate {
    keyUpdateType: number;
    keys: VerifyKey[];
    accessStructures: AccessStructure[];
}
