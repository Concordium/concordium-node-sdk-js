import { AuthorizationsV0, AuthorizationsV1 } from '..';
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

export interface MicroGtuPerEuroUpdate {
    updateType: UpdateType.MicroGtuPerEuro;
    update: ExchangeRate;
}

export interface TransactionFeeDistributionUpdate {
    updateType: UpdateType.TransactionFeeDistribution;
    update: TransactionFeeDistribution;
}

export interface GasRewardsUpdate {
    updateType: UpdateType.GasRewards;
    update: GasRewards;
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

export interface Level1Update {
    updateType: UpdateType.Level1;
    update: KeyUpdate;
}

export interface RootUpdate {
    updateType: UpdateType.Root;
    update: KeyUpdate;
}

export type UpdateInstructionPayload =
    | MicroGtuPerEuroUpdate
    | EuroPerEnergyUpdate
    | TransactionFeeDistributionUpdate
    | FoundationAccountUpdate
    | MintDistributionUpdate
    | ProtocolUpdate
    | GasRewardsUpdate
    | BakerStakeThresholdUpdate
    | ElectionDifficultyUpdate
    | AddAnonymityRevokerUpdate
    | AddIdentityProviderUpdate
    | CooldownParametersUpdate
    | PoolParametersUpdate
    | TimeParametersUpdate
    | RootUpdate
    | Level1Update;

export enum UpdateType {
    Root = 'root',
    Level1 = 'level1',
    Protocol = 'protocol',
    ElectionDifficulty = 'electionDifficulty',
    EuroPerEnergy = 'euroPerEnergy',
    MicroGtuPerEuro = 'microGtuPerEuro',
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
}

export type KeyUpdate = HigherLevelKeyUpdate | AuthorizationKeysUpdate;

export interface Fraction {
    numerator: bigint;
    denominator: bigint;
}

export type AddIdentityProvider = IpInfo;
export type AddAnonymityRevoker = ArInfo;

export interface FoundationAccount {
    address: string;
}

export interface ProtocolUpdateDetails {
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
