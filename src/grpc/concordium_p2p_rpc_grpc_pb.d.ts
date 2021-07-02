// package: concordium
// file: concordium_p2p_rpc.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as concordium_p2p_rpc_pb from "./concordium_p2p_rpc_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

interface IP2PService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    peerConnect: IP2PService_IPeerConnect;
    peerDisconnect: IP2PService_IPeerDisconnect;
    peerUptime: IP2PService_IPeerUptime;
    peerTotalSent: IP2PService_IPeerTotalSent;
    peerTotalReceived: IP2PService_IPeerTotalReceived;
    peerVersion: IP2PService_IPeerVersion;
    peerStats: IP2PService_IPeerStats;
    peerList: IP2PService_IPeerList;
    banNode: IP2PService_IBanNode;
    unbanNode: IP2PService_IUnbanNode;
    joinNetwork: IP2PService_IJoinNetwork;
    leaveNetwork: IP2PService_ILeaveNetwork;
    nodeInfo: IP2PService_INodeInfo;
    getConsensusStatus: IP2PService_IGetConsensusStatus;
    getBlockInfo: IP2PService_IGetBlockInfo;
    getAncestors: IP2PService_IGetAncestors;
    getBranches: IP2PService_IGetBranches;
    getBlocksAtHeight: IP2PService_IGetBlocksAtHeight;
    sendTransaction: IP2PService_ISendTransaction;
    startBaker: IP2PService_IStartBaker;
    stopBaker: IP2PService_IStopBaker;
    getAccountList: IP2PService_IGetAccountList;
    getInstances: IP2PService_IGetInstances;
    getAccountInfo: IP2PService_IGetAccountInfo;
    getInstanceInfo: IP2PService_IGetInstanceInfo;
    getRewardStatus: IP2PService_IGetRewardStatus;
    getBirkParameters: IP2PService_IGetBirkParameters;
    getModuleList: IP2PService_IGetModuleList;
    getModuleSource: IP2PService_IGetModuleSource;
    getIdentityProviders: IP2PService_IGetIdentityProviders;
    getAnonymityRevokers: IP2PService_IGetAnonymityRevokers;
    getCryptographicParameters: IP2PService_IGetCryptographicParameters;
    getBannedPeers: IP2PService_IGetBannedPeers;
    shutdown: IP2PService_IShutdown;
    dumpStart: IP2PService_IDumpStart;
    dumpStop: IP2PService_IDumpStop;
    getTransactionStatus: IP2PService_IGetTransactionStatus;
    getTransactionStatusInBlock: IP2PService_IGetTransactionStatusInBlock;
    getAccountNonFinalizedTransactions: IP2PService_IGetAccountNonFinalizedTransactions;
    getBlockSummary: IP2PService_IGetBlockSummary;
    getNextAccountNonce: IP2PService_IGetNextAccountNonce;
}

interface IP2PService_IPeerConnect extends grpc.MethodDefinition<concordium_p2p_rpc_pb.PeerConnectRequest, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/PeerConnect";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerConnectRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerConnectRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IPeerDisconnect extends grpc.MethodDefinition<concordium_p2p_rpc_pb.PeerConnectRequest, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/PeerDisconnect";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerConnectRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerConnectRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IPeerUptime extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NumberResponse> {
    path: "/concordium.P2P/PeerUptime";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.NumberResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.NumberResponse>;
}
interface IP2PService_IPeerTotalSent extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NumberResponse> {
    path: "/concordium.P2P/PeerTotalSent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.NumberResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.NumberResponse>;
}
interface IP2PService_IPeerTotalReceived extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NumberResponse> {
    path: "/concordium.P2P/PeerTotalReceived";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.NumberResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.NumberResponse>;
}
interface IP2PService_IPeerVersion extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.StringResponse> {
    path: "/concordium.P2P/PeerVersion";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.StringResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.StringResponse>;
}
interface IP2PService_IPeerStats extends grpc.MethodDefinition<concordium_p2p_rpc_pb.PeersRequest, concordium_p2p_rpc_pb.PeerStatsResponse> {
    path: "/concordium.P2P/PeerStats";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeersRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeersRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerStatsResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerStatsResponse>;
}
interface IP2PService_IPeerList extends grpc.MethodDefinition<concordium_p2p_rpc_pb.PeersRequest, concordium_p2p_rpc_pb.PeerListResponse> {
    path: "/concordium.P2P/PeerList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeersRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeersRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerListResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerListResponse>;
}
interface IP2PService_IBanNode extends grpc.MethodDefinition<concordium_p2p_rpc_pb.PeerElement, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/BanNode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerElement>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerElement>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IUnbanNode extends grpc.MethodDefinition<concordium_p2p_rpc_pb.PeerElement, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/UnbanNode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerElement>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerElement>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IJoinNetwork extends grpc.MethodDefinition<concordium_p2p_rpc_pb.NetworkChangeRequest, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/JoinNetwork";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.NetworkChangeRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.NetworkChangeRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_ILeaveNetwork extends grpc.MethodDefinition<concordium_p2p_rpc_pb.NetworkChangeRequest, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/LeaveNetwork";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.NetworkChangeRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.NetworkChangeRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_INodeInfo extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NodeInfoResponse> {
    path: "/concordium.P2P/NodeInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.NodeInfoResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.NodeInfoResponse>;
}
interface IP2PService_IGetConsensusStatus extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetConsensusStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetBlockInfo extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetBlockInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetAncestors extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHashAndAmount, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetAncestors";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHashAndAmount>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHashAndAmount>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetBranches extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetBranches";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetBlocksAtHeight extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHeight, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetBlocksAtHeight";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHeight>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHeight>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_ISendTransaction extends grpc.MethodDefinition<concordium_p2p_rpc_pb.SendTransactionRequest, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/SendTransaction";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.SendTransactionRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.SendTransactionRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IStartBaker extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/StartBaker";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IStopBaker extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/StopBaker";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IGetAccountList extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetAccountList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetInstances extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetInstances";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetAccountInfo extends grpc.MethodDefinition<concordium_p2p_rpc_pb.GetAddressInfoRequest, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetAccountInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.GetAddressInfoRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.GetAddressInfoRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetInstanceInfo extends grpc.MethodDefinition<concordium_p2p_rpc_pb.GetAddressInfoRequest, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetInstanceInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.GetAddressInfoRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.GetAddressInfoRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetRewardStatus extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetRewardStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetBirkParameters extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetBirkParameters";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetModuleList extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetModuleList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetModuleSource extends grpc.MethodDefinition<concordium_p2p_rpc_pb.GetModuleSourceRequest, concordium_p2p_rpc_pb.BytesResponse> {
    path: "/concordium.P2P/GetModuleSource";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.GetModuleSourceRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.GetModuleSourceRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BytesResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BytesResponse>;
}
interface IP2PService_IGetIdentityProviders extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetIdentityProviders";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetAnonymityRevokers extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetAnonymityRevokers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetCryptographicParameters extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetCryptographicParameters";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetBannedPeers extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.PeerListResponse> {
    path: "/concordium.P2P/GetBannedPeers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.PeerListResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.PeerListResponse>;
}
interface IP2PService_IShutdown extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/Shutdown";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IDumpStart extends grpc.MethodDefinition<concordium_p2p_rpc_pb.DumpRequest, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/DumpStart";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.DumpRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.DumpRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IDumpStop extends grpc.MethodDefinition<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse> {
    path: "/concordium.P2P/DumpStop";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.Empty>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.Empty>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.BoolResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BoolResponse>;
}
interface IP2PService_IGetTransactionStatus extends grpc.MethodDefinition<concordium_p2p_rpc_pb.TransactionHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetTransactionStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.TransactionHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.TransactionHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetTransactionStatusInBlock extends grpc.MethodDefinition<concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetTransactionStatusInBlock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetAccountNonFinalizedTransactions extends grpc.MethodDefinition<concordium_p2p_rpc_pb.AccountAddress, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetAccountNonFinalizedTransactions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.AccountAddress>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.AccountAddress>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetBlockSummary extends grpc.MethodDefinition<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetBlockSummary";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.BlockHash>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.BlockHash>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}
interface IP2PService_IGetNextAccountNonce extends grpc.MethodDefinition<concordium_p2p_rpc_pb.AccountAddress, concordium_p2p_rpc_pb.JsonResponse> {
    path: "/concordium.P2P/GetNextAccountNonce";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<concordium_p2p_rpc_pb.AccountAddress>;
    requestDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.AccountAddress>;
    responseSerialize: grpc.serialize<concordium_p2p_rpc_pb.JsonResponse>;
    responseDeserialize: grpc.deserialize<concordium_p2p_rpc_pb.JsonResponse>;
}

export const P2PService: IP2PService;

export interface IP2PServer {
    peerConnect: grpc.handleUnaryCall<concordium_p2p_rpc_pb.PeerConnectRequest, concordium_p2p_rpc_pb.BoolResponse>;
    peerDisconnect: grpc.handleUnaryCall<concordium_p2p_rpc_pb.PeerConnectRequest, concordium_p2p_rpc_pb.BoolResponse>;
    peerUptime: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NumberResponse>;
    peerTotalSent: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NumberResponse>;
    peerTotalReceived: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NumberResponse>;
    peerVersion: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.StringResponse>;
    peerStats: grpc.handleUnaryCall<concordium_p2p_rpc_pb.PeersRequest, concordium_p2p_rpc_pb.PeerStatsResponse>;
    peerList: grpc.handleUnaryCall<concordium_p2p_rpc_pb.PeersRequest, concordium_p2p_rpc_pb.PeerListResponse>;
    banNode: grpc.handleUnaryCall<concordium_p2p_rpc_pb.PeerElement, concordium_p2p_rpc_pb.BoolResponse>;
    unbanNode: grpc.handleUnaryCall<concordium_p2p_rpc_pb.PeerElement, concordium_p2p_rpc_pb.BoolResponse>;
    joinNetwork: grpc.handleUnaryCall<concordium_p2p_rpc_pb.NetworkChangeRequest, concordium_p2p_rpc_pb.BoolResponse>;
    leaveNetwork: grpc.handleUnaryCall<concordium_p2p_rpc_pb.NetworkChangeRequest, concordium_p2p_rpc_pb.BoolResponse>;
    nodeInfo: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.NodeInfoResponse>;
    getConsensusStatus: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.JsonResponse>;
    getBlockInfo: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getAncestors: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHashAndAmount, concordium_p2p_rpc_pb.JsonResponse>;
    getBranches: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.JsonResponse>;
    getBlocksAtHeight: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHeight, concordium_p2p_rpc_pb.JsonResponse>;
    sendTransaction: grpc.handleUnaryCall<concordium_p2p_rpc_pb.SendTransactionRequest, concordium_p2p_rpc_pb.BoolResponse>;
    startBaker: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse>;
    stopBaker: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse>;
    getAccountList: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getInstances: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getAccountInfo: grpc.handleUnaryCall<concordium_p2p_rpc_pb.GetAddressInfoRequest, concordium_p2p_rpc_pb.JsonResponse>;
    getInstanceInfo: grpc.handleUnaryCall<concordium_p2p_rpc_pb.GetAddressInfoRequest, concordium_p2p_rpc_pb.JsonResponse>;
    getRewardStatus: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getBirkParameters: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getModuleList: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getModuleSource: grpc.handleUnaryCall<concordium_p2p_rpc_pb.GetModuleSourceRequest, concordium_p2p_rpc_pb.BytesResponse>;
    getIdentityProviders: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getAnonymityRevokers: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getCryptographicParameters: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getBannedPeers: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.PeerListResponse>;
    shutdown: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse>;
    dumpStart: grpc.handleUnaryCall<concordium_p2p_rpc_pb.DumpRequest, concordium_p2p_rpc_pb.BoolResponse>;
    dumpStop: grpc.handleUnaryCall<concordium_p2p_rpc_pb.Empty, concordium_p2p_rpc_pb.BoolResponse>;
    getTransactionStatus: grpc.handleUnaryCall<concordium_p2p_rpc_pb.TransactionHash, concordium_p2p_rpc_pb.JsonResponse>;
    getTransactionStatusInBlock: grpc.handleUnaryCall<concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, concordium_p2p_rpc_pb.JsonResponse>;
    getAccountNonFinalizedTransactions: grpc.handleUnaryCall<concordium_p2p_rpc_pb.AccountAddress, concordium_p2p_rpc_pb.JsonResponse>;
    getBlockSummary: grpc.handleUnaryCall<concordium_p2p_rpc_pb.BlockHash, concordium_p2p_rpc_pb.JsonResponse>;
    getNextAccountNonce: grpc.handleUnaryCall<concordium_p2p_rpc_pb.AccountAddress, concordium_p2p_rpc_pb.JsonResponse>;
}

export interface IP2PClient {
    peerConnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    peerConnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    peerConnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    peerDisconnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    peerDisconnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    peerDisconnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    peerUptime(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerUptime(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerUptime(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerTotalSent(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerTotalSent(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerTotalSent(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerTotalReceived(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerTotalReceived(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerTotalReceived(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    peerVersion(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.StringResponse) => void): grpc.ClientUnaryCall;
    peerVersion(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.StringResponse) => void): grpc.ClientUnaryCall;
    peerVersion(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.StringResponse) => void): grpc.ClientUnaryCall;
    peerStats(request: concordium_p2p_rpc_pb.PeersRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerStatsResponse) => void): grpc.ClientUnaryCall;
    peerStats(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerStatsResponse) => void): grpc.ClientUnaryCall;
    peerStats(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerStatsResponse) => void): grpc.ClientUnaryCall;
    peerList(request: concordium_p2p_rpc_pb.PeersRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    peerList(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    peerList(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    banNode(request: concordium_p2p_rpc_pb.PeerElement, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    banNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    banNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    unbanNode(request: concordium_p2p_rpc_pb.PeerElement, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    unbanNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    unbanNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    joinNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    joinNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    joinNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    leaveNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    leaveNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    leaveNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    nodeInfo(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NodeInfoResponse) => void): grpc.ClientUnaryCall;
    nodeInfo(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NodeInfoResponse) => void): grpc.ClientUnaryCall;
    nodeInfo(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NodeInfoResponse) => void): grpc.ClientUnaryCall;
    getConsensusStatus(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getConsensusStatus(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getConsensusStatus(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlockInfo(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlockInfo(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlockInfo(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAncestors(request: concordium_p2p_rpc_pb.BlockHashAndAmount, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAncestors(request: concordium_p2p_rpc_pb.BlockHashAndAmount, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAncestors(request: concordium_p2p_rpc_pb.BlockHashAndAmount, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBranches(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBranches(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBranches(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlocksAtHeight(request: concordium_p2p_rpc_pb.BlockHeight, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlocksAtHeight(request: concordium_p2p_rpc_pb.BlockHeight, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlocksAtHeight(request: concordium_p2p_rpc_pb.BlockHeight, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    sendTransaction(request: concordium_p2p_rpc_pb.SendTransactionRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    sendTransaction(request: concordium_p2p_rpc_pb.SendTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    sendTransaction(request: concordium_p2p_rpc_pb.SendTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    startBaker(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    startBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    startBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    stopBaker(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    stopBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    stopBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    getAccountList(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getInstances(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getInstances(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getInstances(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getInstanceInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getInstanceInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getInstanceInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getRewardStatus(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getRewardStatus(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getRewardStatus(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBirkParameters(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBirkParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBirkParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getModuleList(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getModuleList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getModuleList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getModuleSource(request: concordium_p2p_rpc_pb.GetModuleSourceRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BytesResponse) => void): grpc.ClientUnaryCall;
    getModuleSource(request: concordium_p2p_rpc_pb.GetModuleSourceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BytesResponse) => void): grpc.ClientUnaryCall;
    getModuleSource(request: concordium_p2p_rpc_pb.GetModuleSourceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BytesResponse) => void): grpc.ClientUnaryCall;
    getIdentityProviders(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getIdentityProviders(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getIdentityProviders(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAnonymityRevokers(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAnonymityRevokers(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAnonymityRevokers(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getCryptographicParameters(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getCryptographicParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getCryptographicParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBannedPeers(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    getBannedPeers(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    getBannedPeers(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    shutdown(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    shutdown(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    shutdown(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    dumpStart(request: concordium_p2p_rpc_pb.DumpRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    dumpStart(request: concordium_p2p_rpc_pb.DumpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    dumpStart(request: concordium_p2p_rpc_pb.DumpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    dumpStop(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    dumpStop(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    dumpStop(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    getTransactionStatus(request: concordium_p2p_rpc_pb.TransactionHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getTransactionStatus(request: concordium_p2p_rpc_pb.TransactionHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getTransactionStatus(request: concordium_p2p_rpc_pb.TransactionHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getTransactionStatusInBlock(request: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getTransactionStatusInBlock(request: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getTransactionStatusInBlock(request: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountNonFinalizedTransactions(request: concordium_p2p_rpc_pb.AccountAddress, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountNonFinalizedTransactions(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getAccountNonFinalizedTransactions(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlockSummary(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlockSummary(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getBlockSummary(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getNextAccountNonce(request: concordium_p2p_rpc_pb.AccountAddress, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getNextAccountNonce(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    getNextAccountNonce(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
}

export class P2PClient extends grpc.Client implements IP2PClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public peerConnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public peerConnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public peerConnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public peerDisconnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public peerDisconnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public peerDisconnect(request: concordium_p2p_rpc_pb.PeerConnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public peerUptime(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerUptime(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerUptime(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerTotalSent(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerTotalSent(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerTotalSent(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerTotalReceived(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerTotalReceived(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerTotalReceived(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NumberResponse) => void): grpc.ClientUnaryCall;
    public peerVersion(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.StringResponse) => void): grpc.ClientUnaryCall;
    public peerVersion(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.StringResponse) => void): grpc.ClientUnaryCall;
    public peerVersion(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.StringResponse) => void): grpc.ClientUnaryCall;
    public peerStats(request: concordium_p2p_rpc_pb.PeersRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerStatsResponse) => void): grpc.ClientUnaryCall;
    public peerStats(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerStatsResponse) => void): grpc.ClientUnaryCall;
    public peerStats(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerStatsResponse) => void): grpc.ClientUnaryCall;
    public peerList(request: concordium_p2p_rpc_pb.PeersRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    public peerList(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    public peerList(request: concordium_p2p_rpc_pb.PeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    public banNode(request: concordium_p2p_rpc_pb.PeerElement, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public banNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public banNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public unbanNode(request: concordium_p2p_rpc_pb.PeerElement, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public unbanNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public unbanNode(request: concordium_p2p_rpc_pb.PeerElement, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public joinNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public joinNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public joinNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public leaveNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public leaveNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public leaveNetwork(request: concordium_p2p_rpc_pb.NetworkChangeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public nodeInfo(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NodeInfoResponse) => void): grpc.ClientUnaryCall;
    public nodeInfo(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NodeInfoResponse) => void): grpc.ClientUnaryCall;
    public nodeInfo(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.NodeInfoResponse) => void): grpc.ClientUnaryCall;
    public getConsensusStatus(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getConsensusStatus(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getConsensusStatus(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlockInfo(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlockInfo(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlockInfo(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAncestors(request: concordium_p2p_rpc_pb.BlockHashAndAmount, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAncestors(request: concordium_p2p_rpc_pb.BlockHashAndAmount, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAncestors(request: concordium_p2p_rpc_pb.BlockHashAndAmount, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBranches(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBranches(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBranches(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlocksAtHeight(request: concordium_p2p_rpc_pb.BlockHeight, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlocksAtHeight(request: concordium_p2p_rpc_pb.BlockHeight, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlocksAtHeight(request: concordium_p2p_rpc_pb.BlockHeight, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public sendTransaction(request: concordium_p2p_rpc_pb.SendTransactionRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public sendTransaction(request: concordium_p2p_rpc_pb.SendTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public sendTransaction(request: concordium_p2p_rpc_pb.SendTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public startBaker(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public startBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public startBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public stopBaker(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public stopBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public stopBaker(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public getAccountList(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getInstances(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getInstances(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getInstances(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getInstanceInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getInstanceInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getInstanceInfo(request: concordium_p2p_rpc_pb.GetAddressInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getRewardStatus(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getRewardStatus(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getRewardStatus(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBirkParameters(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBirkParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBirkParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getModuleList(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getModuleList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getModuleList(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getModuleSource(request: concordium_p2p_rpc_pb.GetModuleSourceRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BytesResponse) => void): grpc.ClientUnaryCall;
    public getModuleSource(request: concordium_p2p_rpc_pb.GetModuleSourceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BytesResponse) => void): grpc.ClientUnaryCall;
    public getModuleSource(request: concordium_p2p_rpc_pb.GetModuleSourceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BytesResponse) => void): grpc.ClientUnaryCall;
    public getIdentityProviders(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getIdentityProviders(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getIdentityProviders(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAnonymityRevokers(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAnonymityRevokers(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAnonymityRevokers(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getCryptographicParameters(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getCryptographicParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getCryptographicParameters(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBannedPeers(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    public getBannedPeers(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    public getBannedPeers(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.PeerListResponse) => void): grpc.ClientUnaryCall;
    public shutdown(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public shutdown(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public shutdown(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public dumpStart(request: concordium_p2p_rpc_pb.DumpRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public dumpStart(request: concordium_p2p_rpc_pb.DumpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public dumpStart(request: concordium_p2p_rpc_pb.DumpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public dumpStop(request: concordium_p2p_rpc_pb.Empty, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public dumpStop(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public dumpStop(request: concordium_p2p_rpc_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.BoolResponse) => void): grpc.ClientUnaryCall;
    public getTransactionStatus(request: concordium_p2p_rpc_pb.TransactionHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getTransactionStatus(request: concordium_p2p_rpc_pb.TransactionHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getTransactionStatus(request: concordium_p2p_rpc_pb.TransactionHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getTransactionStatusInBlock(request: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getTransactionStatusInBlock(request: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getTransactionStatusInBlock(request: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountNonFinalizedTransactions(request: concordium_p2p_rpc_pb.AccountAddress, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountNonFinalizedTransactions(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getAccountNonFinalizedTransactions(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlockSummary(request: concordium_p2p_rpc_pb.BlockHash, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlockSummary(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getBlockSummary(request: concordium_p2p_rpc_pb.BlockHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getNextAccountNonce(request: concordium_p2p_rpc_pb.AccountAddress, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getNextAccountNonce(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
    public getNextAccountNonce(request: concordium_p2p_rpc_pb.AccountAddress, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: concordium_p2p_rpc_pb.JsonResponse) => void): grpc.ClientUnaryCall;
}
