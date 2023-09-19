import { BakerId, Duration, HexString, Timestamp } from '../types.js';

export interface NodeInfo {
    peerVersion: string;
    localTime: Timestamp;
    peerUptime: Duration;
    networkInfo: NodeNetworkInfo;
    details: NodeInfoDetails;
}

export interface NodeNetworkInfo {
    nodeId: HexString;
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
    | NodeInfoConsensusStatusGeneric
    | NodeInfoConsensusStatusActive;

export interface NodeInfoConsensusStatusGeneric {
    tag: 'notRunning' | 'passive';
}

export interface NodeInfoConsensusStatusActive {
    tag: 'active';
    bakerId: BakerId;
    status: BakerConsensusInfoStatus;
}

export type BakerConsensusInfoStatus =
    | BakerConsensusInfoStatusGeneric
    | BakerConsensusInfoStatusPassiveCommitteeInfo;

export interface BakerConsensusInfoStatusGeneric {
    tag: 'activeBakerCommitteeInfo' | 'activeFinalizerCommitteeInfo';
}

export interface BakerConsensusInfoStatusPassiveCommitteeInfo {
    tag: 'passiveCommitteeInfo';
    passiveCommitteeInfo: PassiveCommitteeInfo;
}

export enum PassiveCommitteeInfo {
    NotInCommittee = 0,
    AddedButNotActiveInCommittee = 1,
    AddedButWrongKeys = 2,
}
