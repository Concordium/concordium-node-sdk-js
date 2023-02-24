import * as fs from 'fs';
import { credentials, Metadata } from '@grpc/grpc-js/';
import { IdentityInput } from '@concordium/common-sdk';
import { decryptMobileWalletExport, EncryptedData } from '../src/wallet/crypto';
import { MobileWalletExport } from '../src/wallet/types';
import { createConcordiumClient } from '../src/clientV2';
import ConcordiumNodeClientV2 from '@concordium/common-sdk/lib/GRPCClient';

export { getModuleBuffer } from '../src/util';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = 'node.testnet.concordium.com',
    port = 20000
): ConcordiumNodeClientV2 {
    return createConcordiumClient(address, port, credentials.createInsecure(), {
        timeout: 15000,
    });
}

export function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

export function getIdentityInput(): IdentityInput {
    const rawData = fs.readFileSync(
        './test/resources/mobileWalletExport.json',
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
