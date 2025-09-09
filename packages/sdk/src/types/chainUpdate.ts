import { Upward } from '../index.js';
import { CreatePLTPayload } from '../plt/types.js';
import type {
    ArInfo,
    AuthorizationsV0,
    AuthorizationsV1,
    Base58String,
    CommissionRates,
    ExchangeRate,
    FinalizationCommitteeParameters,
    GasRewardsV0,
    GasRewardsV1,
    HexString,
    IpInfo,
    MintDistribution,
    MintRate,
    TimeoutParameters,
    TransactionFeeDistribution,
    UpdatePublicKey,
    ValidatorScoreParameters,
} from '../types.js';
import type * as CcdAmount from './CcdAmount.js';
import type * as Duration from './Duration.js';
import type * as Energy from './Energy.js';
import type * as Timestamp from './Timestamp.js';

type ChainUpdate<UpdateType, T> = {
    /** The type of the update */
    updateType: UpdateType;
    /** The parameters used for the update */
    update: T;
};

/** An update to mint distribution parameters */
export type MintDistributionUpdate = ChainUpdate<UpdateType.MintDistribution, MintDistribution>;

/** An update to the foundation account */
export type FoundationAccountUpdate = ChainUpdate<UpdateType.FoundationAccount, FoundationAccount>;

/** An update to election difficulty parameters */
export type ElectionDifficultyUpdate = ChainUpdate<UpdateType.ElectionDifficulty, ElectionDifficulty>;

/** An update to the euro per energy exchange rate */
export type EuroPerEnergyUpdate = ChainUpdate<UpdateType.EuroPerEnergy, ExchangeRate>;

/** An update to the micro CCD per euro exchange rate */
export type MicroGtuPerEuroUpdate = ChainUpdate<UpdateType.MicroGtuPerEuro, ExchangeRate>;

/** An update to transaction fee distribution parameters */
export type TransactionFeeDistributionUpdate = ChainUpdate<
    UpdateType.TransactionFeeDistribution,
    TransactionFeeDistribution
>;

/** An update to gas reward parameters for protocol version 1-5 */
export type GasRewardsV0Update = ChainUpdate<UpdateType.GasRewards, GasRewardsV0>;

/** An update to gas reward parameters from protocol version 6 */
export type GasRewardsV1Update = ChainUpdate<UpdateType.GasRewardsCpv2, GasRewardsV1>;

/** An update to add an anonymity revoker */
export type AddAnonymityRevokerUpdate = ChainUpdate<UpdateType.AddAnonymityRevoker, AddAnonymityRevoker>;

/** An update to add an identity provider */
export type AddIdentityProviderUpdate = ChainUpdate<UpdateType.AddIdentityProvider, AddIdentityProvider>;

/** An update to staking cooldown parameters */
export type CooldownParametersUpdate = ChainUpdate<UpdateType.CooldownParameters, CooldownParameters>;

/** An update to time parameters */
export type TimeParametersUpdate = ChainUpdate<UpdateType.TimeParameters, TimeParameters>;

/** An update holding a protocol update */
export type ProtocolUpdate = ChainUpdate<UpdateType.Protocol, ProtocolUpdateDetails>;

/** An update to baker pool parameters */
export type PoolParametersUpdate = ChainUpdate<UpdateType.PoolParameters, PoolParameters>;

/** An update to baker stake threshold parameters */
export type BakerStakeThresholdUpdate = ChainUpdate<UpdateType.BakerStakeThreshold, BakerStakeThreshold>;

/** An update to timeout parameters, used from protocol version 6 */
export type TimeoutParametersUpdate = ChainUpdate<UpdateType.TimeoutParameters, TimeoutParameters>;

/** An update to mininum time between blocks, used from protocol version 6 */
export type MinBlockTimeUpdate = ChainUpdate<UpdateType.MinBlockTime, Duration.Type>;

/** An update to maximum amount of energy per block, used from protocol version 6 */
export type BlockEnergyLimitUpdate = ChainUpdate<UpdateType.BlockEnergyLimit, Energy.Type>;

/** An update to finalization committee parameters, used from protocol version 6 */
export type FinalizationCommitteeParametersUpdate = ChainUpdate<
    UpdateType.FinalizationCommitteeParameters,
    FinalizationCommitteeParameters
>;

/** An update to level 1 key */
export type Level1Update = ChainUpdate<UpdateType.Level1, KeyUpdate>;

/** An update to root key */
export type RootUpdate = ChainUpdate<UpdateType.Root, KeyUpdate>;

/** A pending update to higher level keys */
export type PendingHigherLevelKeyUpdate = ChainUpdate<UpdateType.HigherLevelKeyUpdate, HigherLevelKeyUpdate>;

/** A pending update to authorization keys */
export type PendingAuthorizationKeysUpdate = ChainUpdate<UpdateType.AuthorizationKeysUpdate, AuthorizationKeysUpdate>;

/** A pending update to validator score parameters */
export type PendingValidatorScoreUpdate = ChainUpdate<UpdateType.ValidatorScoreParameters, ValidatorScoreParameters>;

export type CreatePLTUpdate = ChainUpdate<UpdateType.CreatePLT, CreatePLTPayload>;

/** A union of chain updates, barring key updates */
export type CommonUpdate =
    | MicroGtuPerEuroUpdate
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
    | FinalizationCommitteeParametersUpdate
    | PendingValidatorScoreUpdate
    | CreatePLTUpdate;

/** A union of chain updates */
export type UpdateInstructionPayload = CommonUpdate | RootUpdate | Level1Update;

/** A pending update */
export type PendingUpdate = {
    /** The effective time of the update */
    effectiveTime: Timestamp.Type;
    /**
     * The effect of the update.
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    effect: Upward<PendingUpdateEffect>;
};

/** A union of possible effects */
export type PendingUpdateEffect = CommonUpdate | PendingHigherLevelKeyUpdate | PendingAuthorizationKeysUpdate;

/** Chain update types */
export enum UpdateType {
    Root = 'root',
    Level1 = 'level1',
    HigherLevelKeyUpdate = 'higherLevelKeyUpdate',
    AuthorizationKeysUpdate = 'AuthorizationKeysUpdate',
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
    GasRewardsCpv2 = 'gasRewardsCpv2',
    TimeoutParameters = 'timeoutParameters',
    MinBlockTime = 'minBlockTime',
    BlockEnergyLimit = 'blockEnergyLimit',
    FinalizationCommitteeParameters = 'finalizationCommitteeParameters',
    ValidatorScoreParameters = 'validatorScoreParameters',
    CreatePLT = 'createPLT',
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
    minimumEquityCapital: CcdAmount.Type;
    capitalBound: number;
    leverageBound: Fraction;
}

export enum KeyUpdateEntryStatus {
    Added,
    Removed,
    Unchanged,
}

export interface KeyWithStatus {
    key: UpdatePublicKey;
    status: KeyUpdateEntryStatus;
}

export enum HigherLevelKeyUpdateType {
    RootKeysUpdate = 'rootKeysUpdate',
    Level1KeysUpdate = 'level1KeysUpdate',
}

export interface HigherLevelKeyUpdate {
    typeOfUpdate: HigherLevelKeyUpdateType;
    /**
     * The authorization keys included in the update.
     */
    updateKeys: UpdatePublicKey[];
    /**
     * The key threshold needed to perform the update to higher level keys.
     */
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

export type UpdateInstructionHeader = {
    sequenceNumber: bigint;
    effectiveTime: bigint;
    timeout: bigint;
};

export type UpdateInstruction = {
    header: UpdateInstructionHeader;
    payload: HexString;
};
