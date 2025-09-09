import type { Upward } from '../grpc/upward.js';
import type { BakerId, HexString } from '../types.js';
import type * as Duration from '../types/Duration.js';
import type * as Timestamp from '../types/Timestamp.js';

export interface NodeInfo {
    peerVersion: string;
    localTime: Timestamp.Type;
    peerUptime: Duration.Type;
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

export type NodeInfoDetails = NodeInfoDetails_Bootstrapper | NodeInfoDetails_Node;

export interface NodeInfoDetails_Bootstrapper {
    tag: 'bootstrapper';
}

export interface NodeInfoDetails_Node {
    tag: 'node';
    consensusStatus: NodeInfoConsensusStatus;
}

export type NodeInfoConsensusStatus = NodeInfoConsensusStatusGeneric | NodeInfoConsensusStatusActive;

export interface NodeInfoConsensusStatusGeneric {
    tag: 'notRunning' | 'passive';
}

export interface NodeInfoConsensusStatusActive {
    tag: 'active';
    bakerId: BakerId;
    status: BakerConsensusInfoStatus;
}

export type BakerConsensusInfoStatus = BakerConsensusInfoStatusGeneric | BakerConsensusInfoStatusPassiveCommitteeInfo;

export interface BakerConsensusInfoStatusGeneric {
    tag: 'activeBakerCommitteeInfo' | 'activeFinalizerCommitteeInfo';
}

export interface BakerConsensusInfoStatusPassiveCommitteeInfo {
    tag: 'passiveCommitteeInfo';
    passiveCommitteeInfo: Upward<PassiveCommitteeInfo>;
}

export enum PassiveCommitteeInfo {
    NotInCommittee = 0,
    AddedButNotActiveInCommittee = 1,
    AddedButWrongKeys = 2,
}
