import { BakerId, Duration, Timestamp } from '../types';

export type PeerId = string;

export interface NodeInfo {
    peerVersion: string;
    localTime: Timestamp;
    peerUptime: Duration;
    networkInfo: NodeNetworkInfo;
    details: NodeInfoDetails;
}

export interface NodeNetworkInfo {
    nodeId: PeerId;
    peerTotalSent: bigint;
    peerTotalReceived: bigint;
    avgBpsIn: bigint;
    avgBpsOut: bigint;
}

export type NodeInfoDetails =
    | NodeInfoDetails_Bootstrapper
    | NodeInfoDetails_Node;

export interface NodeInfoDetails_Bootstrapper {
    tag: 'bootstrapper';
}

export interface NodeInfoDetails_Node {
    tag: 'node';
    consensusStatus: NodeInfoConsensusStatus;
}

export type NodeInfoConsensusStatus =
    | NodeInfoConsensusStatus_Generic
    | NodeInfoConsensusStatus_Active;

export interface NodeInfoConsensusStatus_Generic {
    tag: 'notRunning' | 'passive';
}

export interface NodeInfoConsensusStatus_Active {
    tag: 'notRunning' | 'passive' | 'active';
    bakerId: BakerId;
    status: BakerConsensusInfoStatus;
}

export type BakerConsensusInfoStatus =
    | BakerConsensusInfoStatus_Generic
    | BakerConsensusInfoStatus_PassiveCommitteeInfo;

export interface BakerConsensusInfoStatus_Generic {
    tag: 'activeBakerCommitteeInfo' | 'activeFinalizerCommitteeInfo';
}

export interface BakerConsensusInfoStatus_PassiveCommitteeInfo {
    tag: 'passiveCommitteeInfo';
    passiveCommitteeInfo: PassiveCommitteeInfo;
}

export enum PassiveCommitteeInfo {
    NotInCommittee = 0,
    AddedButNotActiveInCommittee = 1,
    AddedButWrongKeys = 2,
}
