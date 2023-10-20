/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'fs';
import { credentials } from '@grpc/grpc-js';
import {
    IdentityInput,
    ConcordiumGRPCClient,
    ConcordiumGRPCWebClient,
} from '../../src/index.js';
import {
    decryptMobileWalletExport,
    EncryptedData,
    MobileWalletExport,
} from '../../src/nodejs/index.js';

import { ConcordiumGRPCNodeClient } from '../../src/nodejs/grpc.js';

const TESTNET_NODE = 'node.testnet.concordium.com';
const GRPCV2_PORT = 20000;

/**
 * Creates a gRPC v2 client (for nodeJS) to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientV2(
    address = TESTNET_NODE,
    port = GRPCV2_PORT
): ConcordiumGRPCClient {
    return new ConcordiumGRPCNodeClient(
        address,
        port,
        credentials.createInsecure(),
        {
            timeout: 15000,
        }
    );
}

// TODO find nice way to move this to web/common
/**
 * Creates a gRPC v2 client (for web) to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientWeb(
    address = 'http://node.testnet.concordium.com',
    port = GRPCV2_PORT
): ConcordiumGRPCClient {
    return new ConcordiumGRPCWebClient(address, port, { timeout: 15000 });
}

export function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

export function getIdentityInput(): IdentityInput {
    const rawData = fs.readFileSync(
        './test/client/resources/mobileWalletExport.json',
        'utf8'
    );
    const mobileWalletExport: EncryptedData = JSON.parse(rawData);
    const decrypted: MobileWalletExport = decryptMobileWalletExport(
        mobileWalletExport,
        '123123'
    );
    const identity = decrypted.value.identities[0];
    const identityInput: IdentityInput = {
        identityProvider: identity.identityProvider,
        identityObject: identity.identityObject,
        idCredSecret:
            identity.privateIdObjectData.aci.credentialHolderInformation
                .idCredSecret,
        prfKey: identity.privateIdObjectData.aci.prfKey,
        randomness: identity.privateIdObjectData.randomness,
    };
    return identityInput;
}
