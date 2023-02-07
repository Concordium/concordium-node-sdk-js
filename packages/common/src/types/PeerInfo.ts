import { IpAddressString, PeerId } from '..';

export interface PeerInfo {
    peerId: PeerId;
    ip: IpAddressString;
    port: number;
    networkStats?: PeerNetworkStats;
    consensusInfo: PeerConsensusInfo;
}

export interface PeerNetworkStats {
    packetsSent: bigint;
    packetsReceived: bigint;
    latency: bigint;
}

export type PeerConsensusInfo =
    | PeerConsensusInfo_Bootstrapper
    | PeerConsensusInfo_CatchupStatus;

export interface PeerConsensusInfo_Bootstrapper {
    tag: 'bootstrapper';
}

export interface PeerConsensusInfo_CatchupStatus {
    tag: 'nodeCatchupStatus';
    catchupStatus: NodeCatchupStatus;
}

export enum NodeCatchupStatus {
    UpToDate = 0,
    Pending = 1,
    CatchingUp = 2,
}
