import {
    AddAnonymityRevoker,
    AddIdentityProvider,
    AuthorizationsV0,
    AuthorizationsV1,
    Base58String,
    CooldownParameters,
    ElectionDifficulty,
    ExchangeRate,
    GasRewards,
    HexString,
    KeysWithThreshold,
    MintDistributionV0,
    MintDistributionV1,
    PoolParametersV0,
    PoolParametersV1,
    ProtocolUpdate,
    TimeParameters,
    TransactionFeeDistribution,
} from '..';

export type UpdatePublicKey = HexString;

export type PendingUpdate = undefined;

export interface PendingUpdate_RootKeys extends KeysWithThreshold {
    tag: 'rootKeys';
}

export interface PendingUpdate_Level1Keys extends KeysWithThreshold {
    tag: 'level1Keys';
}

export interface PendingUpdate_Level2KeysCpv0 extends AuthorizationsV0 {
    tag: 'level2KeysCpv0';
}

export interface PendingUpdate_Level2KeysCpv1 extends AuthorizationsV1 {
    tag: 'level2KeysCpv1';
}

export interface PendingUpdate_Protocol extends ProtocolUpdate {
    tag: 'protocol';
}

export interface PendingUpdate_ElectionDifficulty extends ElectionDifficulty {
    tag: 'electionDifficulty';
}
export interface PendingUpdate_EuroPerEnergy {
    tag: 'euroPerEnergy';
    euroPerEnergy: ExchangeRate;
}
export interface PendingUpdate_MicroCcdPerEuro {
    tag: 'microCcdPerEuro';
    microCcdPerEuro: ExchangeRate;
}
export interface PendingUpdate_FoundationAccount {
    tag: 'foundationAccount';
    foundationAccount: Base58String;
}
export interface PendingUpdate_MintDistributionCpv0 extends MintDistributionV0 {
    tag: 'mintDistributionCpv0';
}
export interface PendingUpdate_MintDistributionCpv1 extends MintDistributionV1 {
    tag: 'mintDistributionCpv1';
}
export interface PendingUpdate_TransactionFeeDistribution
    extends TransactionFeeDistribution {
    tag: 'transactionFeeDistribution';
}
export interface PendingUpdate_GasRewards extends GasRewards {
    tag: 'gasRewards';
}
export interface PendingUpdate_PoolParametersCpv0 extends PoolParametersV0 {
    tag: 'poolParametersCpv0';
}
export interface PendingUpdate_PoolParametersCpv1 extends PoolParametersV1 {
    tag: 'poolParametersCpv1';
}
export interface PendingUpdate_AddAnonymityRevoker extends AddAnonymityRevoker {
    tag: 'addAnonymityRevoker';
}
export interface PendingUpdate_AddIdentityProvider extends AddIdentityProvider {
    tag: 'addIdentityProvider';
}
export interface PendingUpdate_CooldownParameters extends CooldownParameters {
    tag: 'cooldownParameters';
}
export interface PendingUpdate_TimeParameters extends TimeParameters {
    tag: 'timeParameters';
}
