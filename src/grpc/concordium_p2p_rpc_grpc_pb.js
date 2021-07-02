// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var concordium_p2p_rpc_pb = require('./concordium_p2p_rpc_pb.js');
var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');

function serialize_concordium_AccountAddress(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.AccountAddress)) {
    throw new Error('Expected argument of type concordium.AccountAddress');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_AccountAddress(buffer_arg) {
  return concordium_p2p_rpc_pb.AccountAddress.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_BlockHash(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.BlockHash)) {
    throw new Error('Expected argument of type concordium.BlockHash');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_BlockHash(buffer_arg) {
  return concordium_p2p_rpc_pb.BlockHash.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_BlockHashAndAmount(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.BlockHashAndAmount)) {
    throw new Error('Expected argument of type concordium.BlockHashAndAmount');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_BlockHashAndAmount(buffer_arg) {
  return concordium_p2p_rpc_pb.BlockHashAndAmount.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_BlockHeight(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.BlockHeight)) {
    throw new Error('Expected argument of type concordium.BlockHeight');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_BlockHeight(buffer_arg) {
  return concordium_p2p_rpc_pb.BlockHeight.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_BoolResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.BoolResponse)) {
    throw new Error('Expected argument of type concordium.BoolResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_BoolResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.BoolResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_BytesResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.BytesResponse)) {
    throw new Error('Expected argument of type concordium.BytesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_BytesResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.BytesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_DumpRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.DumpRequest)) {
    throw new Error('Expected argument of type concordium.DumpRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_DumpRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.DumpRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_Empty(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.Empty)) {
    throw new Error('Expected argument of type concordium.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_Empty(buffer_arg) {
  return concordium_p2p_rpc_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_GetAddressInfoRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.GetAddressInfoRequest)) {
    throw new Error('Expected argument of type concordium.GetAddressInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_GetAddressInfoRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.GetAddressInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_GetModuleSourceRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.GetModuleSourceRequest)) {
    throw new Error('Expected argument of type concordium.GetModuleSourceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_GetModuleSourceRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.GetModuleSourceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_GetTransactionStatusInBlockRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest)) {
    throw new Error('Expected argument of type concordium.GetTransactionStatusInBlockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_GetTransactionStatusInBlockRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_JsonResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.JsonResponse)) {
    throw new Error('Expected argument of type concordium.JsonResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_JsonResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.JsonResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_NetworkChangeRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.NetworkChangeRequest)) {
    throw new Error('Expected argument of type concordium.NetworkChangeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_NetworkChangeRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.NetworkChangeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_NodeInfoResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.NodeInfoResponse)) {
    throw new Error('Expected argument of type concordium.NodeInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_NodeInfoResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.NodeInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_NumberResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.NumberResponse)) {
    throw new Error('Expected argument of type concordium.NumberResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_NumberResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.NumberResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_PeerConnectRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.PeerConnectRequest)) {
    throw new Error('Expected argument of type concordium.PeerConnectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_PeerConnectRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.PeerConnectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_PeerElement(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.PeerElement)) {
    throw new Error('Expected argument of type concordium.PeerElement');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_PeerElement(buffer_arg) {
  return concordium_p2p_rpc_pb.PeerElement.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_PeerListResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.PeerListResponse)) {
    throw new Error('Expected argument of type concordium.PeerListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_PeerListResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.PeerListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_PeerStatsResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.PeerStatsResponse)) {
    throw new Error('Expected argument of type concordium.PeerStatsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_PeerStatsResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.PeerStatsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_PeersRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.PeersRequest)) {
    throw new Error('Expected argument of type concordium.PeersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_PeersRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.PeersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_SendTransactionRequest(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.SendTransactionRequest)) {
    throw new Error('Expected argument of type concordium.SendTransactionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_SendTransactionRequest(buffer_arg) {
  return concordium_p2p_rpc_pb.SendTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_StringResponse(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.StringResponse)) {
    throw new Error('Expected argument of type concordium.StringResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_StringResponse(buffer_arg) {
  return concordium_p2p_rpc_pb.StringResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_concordium_TransactionHash(arg) {
  if (!(arg instanceof concordium_p2p_rpc_pb.TransactionHash)) {
    throw new Error('Expected argument of type concordium.TransactionHash');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_concordium_TransactionHash(buffer_arg) {
  return concordium_p2p_rpc_pb.TransactionHash.deserializeBinary(new Uint8Array(buffer_arg));
}


var P2PService = exports.P2PService = {
  // ! Suggest to a peer to connect to the submitted peer details.
// ! This, if successful, adds the peer to the list of given addresses.
peerConnect: {
    path: '/concordium.P2P/PeerConnect',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.PeerConnectRequest,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_PeerConnectRequest,
    requestDeserialize: deserialize_concordium_PeerConnectRequest,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  // ! Disconnect from the peer and remove them from the given addresses list
// ! if they are on it. Return if the request was processed successfully.
peerDisconnect: {
    path: '/concordium.P2P/PeerDisconnect',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.PeerConnectRequest,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_PeerConnectRequest,
    requestDeserialize: deserialize_concordium_PeerConnectRequest,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  // ! Peer uptime in milliseconds
peerUptime: {
    path: '/concordium.P2P/PeerUptime',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.NumberResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_NumberResponse,
    responseDeserialize: deserialize_concordium_NumberResponse,
  },
  // ! Peer total number of sent packets
peerTotalSent: {
    path: '/concordium.P2P/PeerTotalSent',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.NumberResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_NumberResponse,
    responseDeserialize: deserialize_concordium_NumberResponse,
  },
  // ! Peer total number of received packets
peerTotalReceived: {
    path: '/concordium.P2P/PeerTotalReceived',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.NumberResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_NumberResponse,
    responseDeserialize: deserialize_concordium_NumberResponse,
  },
  // ! Peer client software version
peerVersion: {
    path: '/concordium.P2P/PeerVersion',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.StringResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_StringResponse,
    responseDeserialize: deserialize_concordium_StringResponse,
  },
  // ! Stats for connected peers
peerStats: {
    path: '/concordium.P2P/PeerStats',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.PeersRequest,
    responseType: concordium_p2p_rpc_pb.PeerStatsResponse,
    requestSerialize: serialize_concordium_PeersRequest,
    requestDeserialize: deserialize_concordium_PeersRequest,
    responseSerialize: serialize_concordium_PeerStatsResponse,
    responseDeserialize: deserialize_concordium_PeerStatsResponse,
  },
  // ! List of connected peers
peerList: {
    path: '/concordium.P2P/PeerList',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.PeersRequest,
    responseType: concordium_p2p_rpc_pb.PeerListResponse,
    requestSerialize: serialize_concordium_PeersRequest,
    requestDeserialize: deserialize_concordium_PeersRequest,
    responseSerialize: serialize_concordium_PeerListResponse,
    responseDeserialize: deserialize_concordium_PeerListResponse,
  },
  banNode: {
    path: '/concordium.P2P/BanNode',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.PeerElement,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_PeerElement,
    requestDeserialize: deserialize_concordium_PeerElement,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  unbanNode: {
    path: '/concordium.P2P/UnbanNode',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.PeerElement,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_PeerElement,
    requestDeserialize: deserialize_concordium_PeerElement,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  joinNetwork: {
    path: '/concordium.P2P/JoinNetwork',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.NetworkChangeRequest,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_NetworkChangeRequest,
    requestDeserialize: deserialize_concordium_NetworkChangeRequest,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  leaveNetwork: {
    path: '/concordium.P2P/LeaveNetwork',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.NetworkChangeRequest,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_NetworkChangeRequest,
    requestDeserialize: deserialize_concordium_NetworkChangeRequest,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  // ! Get information about the running Node
nodeInfo: {
    path: '/concordium.P2P/NodeInfo',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.NodeInfoResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_NodeInfoResponse,
    responseDeserialize: deserialize_concordium_NodeInfoResponse,
  },
  // ! see https://gitlab.com/Concordium/notes-wiki/wikis/Consensus-queries#getconsensusstatus
getConsensusStatus: {
    path: '/concordium.P2P/GetConsensusStatus',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! see https://gitlab.com/Concordium/notes-wiki/wikis/Consensus-queries#getblockinfo
getBlockInfo: {
    path: '/concordium.P2P/GetBlockInfo',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! see https://gitlab.com/Concordium/notes-wiki/wikis/Consensus-queries#getancestors
getAncestors: {
    path: '/concordium.P2P/GetAncestors',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHashAndAmount,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHashAndAmount,
    requestDeserialize: deserialize_concordium_BlockHashAndAmount,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! see https://gitlab.com/Concordium/notes-wiki/wikis/Consensus-queries#getbranches
getBranches: {
    path: '/concordium.P2P/GetBranches',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! Get the blocks at the given height
getBlocksAtHeight: {
    path: '/concordium.P2P/GetBlocksAtHeight',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHeight,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHeight,
    requestDeserialize: deserialize_concordium_BlockHeight,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! Submit a local transaction
sendTransaction: {
    path: '/concordium.P2P/SendTransaction',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.SendTransactionRequest,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_SendTransactionRequest,
    requestDeserialize: deserialize_concordium_SendTransactionRequest,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  // ! Start the baker in the consensus module
startBaker: {
    path: '/concordium.P2P/StartBaker',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  // ! Stop the baker in the consensus module
stopBaker: {
    path: '/concordium.P2P/StopBaker',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  getAccountList: {
    path: '/concordium.P2P/GetAccountList',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getInstances: {
    path: '/concordium.P2P/GetInstances',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getAccountInfo: {
    path: '/concordium.P2P/GetAccountInfo',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.GetAddressInfoRequest,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_GetAddressInfoRequest,
    requestDeserialize: deserialize_concordium_GetAddressInfoRequest,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getInstanceInfo: {
    path: '/concordium.P2P/GetInstanceInfo',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.GetAddressInfoRequest,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_GetAddressInfoRequest,
    requestDeserialize: deserialize_concordium_GetAddressInfoRequest,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getRewardStatus: {
    path: '/concordium.P2P/GetRewardStatus',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getBirkParameters: {
    path: '/concordium.P2P/GetBirkParameters',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getModuleList: {
    path: '/concordium.P2P/GetModuleList',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getModuleSource: {
    path: '/concordium.P2P/GetModuleSource',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.GetModuleSourceRequest,
    responseType: concordium_p2p_rpc_pb.BytesResponse,
    requestSerialize: serialize_concordium_GetModuleSourceRequest,
    requestDeserialize: deserialize_concordium_GetModuleSourceRequest,
    responseSerialize: serialize_concordium_BytesResponse,
    responseDeserialize: deserialize_concordium_BytesResponse,
  },
  getIdentityProviders: {
    path: '/concordium.P2P/GetIdentityProviders',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getAnonymityRevokers: {
    path: '/concordium.P2P/GetAnonymityRevokers',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getCryptographicParameters: {
    path: '/concordium.P2P/GetCryptographicParameters',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  getBannedPeers: {
    path: '/concordium.P2P/GetBannedPeers',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.PeerListResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_PeerListResponse,
    responseDeserialize: deserialize_concordium_PeerListResponse,
  },
  shutdown: {
    path: '/concordium.P2P/Shutdown',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  dumpStart: {
    path: '/concordium.P2P/DumpStart',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.DumpRequest,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_DumpRequest,
    requestDeserialize: deserialize_concordium_DumpRequest,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  dumpStop: {
    path: '/concordium.P2P/DumpStop',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.Empty,
    responseType: concordium_p2p_rpc_pb.BoolResponse,
    requestSerialize: serialize_concordium_Empty,
    requestDeserialize: deserialize_concordium_Empty,
    responseSerialize: serialize_concordium_BoolResponse,
    responseDeserialize: deserialize_concordium_BoolResponse,
  },
  // ! Query for the status of a transaction by its hash
getTransactionStatus: {
    path: '/concordium.P2P/GetTransactionStatus',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.TransactionHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_TransactionHash,
    requestDeserialize: deserialize_concordium_TransactionHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! Query for transactions in a block by its hash
getTransactionStatusInBlock: {
    path: '/concordium.P2P/GetTransactionStatusInBlock',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.GetTransactionStatusInBlockRequest,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_GetTransactionStatusInBlockRequest,
    requestDeserialize: deserialize_concordium_GetTransactionStatusInBlockRequest,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! Query for non-finalized transactions present on an account by the account address
getAccountNonFinalizedTransactions: {
    path: '/concordium.P2P/GetAccountNonFinalizedTransactions',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.AccountAddress,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_AccountAddress,
    requestDeserialize: deserialize_concordium_AccountAddress,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! Request a summary for a block by its hash
getBlockSummary: {
    path: '/concordium.P2P/GetBlockSummary',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.BlockHash,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_BlockHash,
    requestDeserialize: deserialize_concordium_BlockHash,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
  // ! Request next nonce information for an account
getNextAccountNonce: {
    path: '/concordium.P2P/GetNextAccountNonce',
    requestStream: false,
    responseStream: false,
    requestType: concordium_p2p_rpc_pb.AccountAddress,
    responseType: concordium_p2p_rpc_pb.JsonResponse,
    requestSerialize: serialize_concordium_AccountAddress,
    requestDeserialize: deserialize_concordium_AccountAddress,
    responseSerialize: serialize_concordium_JsonResponse,
    responseDeserialize: deserialize_concordium_JsonResponse,
  },
};

exports.P2PClient = grpc.makeGenericClientConstructor(P2PService);
