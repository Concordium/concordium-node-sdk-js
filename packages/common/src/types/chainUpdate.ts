import {
    Amount,
    AuthorizationsV0,
    AuthorizationsV1,
    Base58String,
    Duration,
    Energy,
    FinalizationCommitteeParameters,
    GasRewardsV0,
    GasRewardsV1,
    HexString,
    TimeoutParameters,
} from '..';
import type {
    IpInfo,
    ArInfo,
    VerifyKey,
    ExchangeRate,
    TransactionFeeDistribution,
    MintDistribution,
    MintRate,
    CommissionRates,
} from '../types';

export interface MintDistributionUpdate {
    updateType: UpdateType.MintDistribution;
    update: MintDistribution;
}

export interface FoundationAccountUpdate {
    updateType: UpdateType.FoundationAccount;
    update: FoundationAccount;
}

export interface ElectionDifficultyUpdate {
    updateType: UpdateType.ElectionDifficulty;
    update: ElectionDifficulty;
}

export interface EuroPerEnergyUpdate {
    updateType: UpdateType.EuroPerEnergy;
    update: ExchangeRate;
}

export interface MicroCCDPerEuroUpdate {
    updateType: UpdateType.MicroCCDPerEuro;
    update: ExchangeRate;
}

export interface TransactionFeeDistributionUpdate {
    updateType: UpdateType.TransactionFeeDistribution;
    update: TransactionFeeDistribution;
}

export interface GasRewardsV0Update {
    updateType: UpdateType.GasRewards;
    update: GasRewardsV0;
}

export interface GasRewardsV1Update {
    updateType: UpdateType.GasRewardsCpv2;
    update: GasRewardsV1;
}

export interface AddAnonymityRevokerUpdate {
    updateType: UpdateType.AddAnonymityRevoker;
    update: AddAnonymityRevoker;
}

export interface AddIdentityProviderUpdate {
    updateType: UpdateType.AddIdentityProvider;
    update: AddIdentityProvider;
}

export interface CooldownParametersUpdate {
    updateType: UpdateType.CooldownParameters;
    update: CooldownParameters;
}

export interface TimeParametersUpdate {
    updateType: UpdateType.TimeParameters;
    update: TimeParameters;
}

export interface ProtocolUpdate {
    updateType: UpdateType.Protocol;
    update: ProtocolUpdateDetails;
}

export interface PoolParametersUpdate {
    updateType: UpdateType.PoolParameters;
    update: PoolParameters;
}

export interface BakerStakeThresholdUpdate {
    updateType: UpdateType.BakerStakeThreshold;
    update: BakerStakeThreshold;
}

export interface TimeoutParametersUpdate {
    updateType: UpdateType.TimeoutParameters;
    update: TimeoutParameters;
}

export interface MinBlockTimeUpdate {
    updateType: UpdateType.MinBlockTime;
    update: Duration;
}

export interface BlockEnergyLimitUpdate {
    updateType: UpdateType.BlockEnergyLimit;
    update: Energy;
}

export interface FinalizationCommitteeParametersUpdate {
    updateType: UpdateType.FinalizationCommitteeParameters;
    update: FinalizationCommitteeParameters;
}

export interface Level1Update {
    updateType: UpdateType.Level1;
    update: KeyUpdate;
}

export interface RootUpdate {
    updateType: UpdateType.Root;
    update: KeyUpdate;
}

export interface PendingHigherLevelKeyUpdate {
    updateType: UpdateType.HigherLevelKeyUpdate;
    update: HigherLevelKeyUpdate;
}

export interface PendingAuthorizationKeysUpdate {
    updateType: UpdateType.AuthorizationKeysUpdate;
    update: AuthorizationKeysUpdate;
}

export type CommonUpdate =
    | MicroCCDPerEuroUpdate
    | EuroPerEnergyUpdate
    | TransactionFeeDistributionUpdate
    | FoundationAccountUpdate
    | MintDistributionUpdate
    | ProtocolUpdate
    | GasRewardsV0Update
    | BakerStakeThresholdUpdate
    | ElectionDifficultyUpdate
    | AddAnonymityRevokerUpdate
    | AddIdentityProviderUpdate
    | CooldownParametersUpdate
    | PoolParametersUpdate
    | TimeParametersUpdate
    | GasRewardsV1Update
    | TimeoutParametersUpdate
    | MinBlockTimeUpdate
    | BlockEnergyLimitUpdate
    | FinalizationCommitteeParametersUpdate;

export type UpdateInstructionPayload = CommonUpdate | RootUpdate | Level1Update;

export type PendingUpdate =
    | CommonUpdate
    | PendingHigherLevelKeyUpdate
    | PendingAuthorizationKeysUpdate;

export enum UpdateType {
    Root = 'root',
    Level1 = 'level1',
    HigherLevelKeyUpdate = 'higherLevelKeyUpdate',
    AuthorizationKeysUpdate = 'AuthorizationKeysUpdate',
    Protocol = 'protocol',
    ElectionDifficulty = 'electionDifficulty',
    EuroPerEnergy = 'euroPerEnergy',
    MicroCCDPerEuro = 'microCCDPerEuro',
    FoundationAccount = 'foundationAccount',
    MintDistribution = 'mintDistribution',
    TransactionFeeDistribution = 'transactionFeeDistribution',
    GasRewards = 'gasRewards',
    PoolParameters = 'poolParameters',
    AddAnonymityRevoker = 'addAnonymityRevoker',
    AddIdentityProvider = 'addIdentityProvider',
    CooldownParameters = 'cooldownParameters',
    TimeParameters = 'timeParameters',
    ProtocolUpdate = 'protocolUpdate',
    BakerStakeThreshold = 'bakerStakeThreshold',
    Emergency = 'emergency',
    GasRewardsCpv2 = 'gasRewardsCpv2',
    TimeoutParameters = 'timeoutParameters',
    MinBlockTime = 'minBlockTime',
    BlockEnergyLimit = 'blockEnergyLimit',
    FinalizationCommitteeParameters = 'finalizationCommitteeParameters',
}

export type KeyUpdate = HigherLevelKeyUpdate | AuthorizationKeysUpdate;

export interface Fraction {
    numerator: bigint;
    denominator: bigint;
}

export type AddIdentityProvider = IpInfo;
export type AddAnonymityRevoker = ArInfo;

export interface FoundationAccount {
    address: Base58String;
}

export interface ProtocolUpdateDetails {
    message: string;
    specificationUrl: string;
    specificationHash: HexString;
    specificationAuxiliaryData: string;
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
    minimumEquityCapital: Amount;
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

export enum HigherLevelKeyUpdateType {
    RootKeysUpdate = 'rootKeysUpdate',
    Level1KeysUpdate = 'level1KeysUpdate',
}

export interface HigherLevelKeyUpdate {
    typeOfUpdate: HigherLevelKeyUpdateType;
    updateKeys: VerifyKey[];
    threshold: number;
}

export enum AuthorizationKeysUpdateType {
    Level2KeysUpdate = 'level2KeysUpdate',
    Level2KeysUpdateV1 = 'level2KeysUpdateV1',
}

export type AuthorizationKeysUpdate =
    | {
          typeOfUpdate: AuthorizationKeysUpdateType.Level2KeysUpdate;
          updatePayload: AuthorizationsV0;
      }
    | {
          typeOfUpdate: AuthorizationKeysUpdateType.Level2KeysUpdateV1;
          updatePayload: AuthorizationsV1;
      };
