import * as fs from 'fs';
import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/client';
import { IdentityInput } from '@concordium/common-sdk';
import { decryptMobileWalletExport, EncryptedData } from '../src/wallet/crypto';
import { MobileWalletExport } from '../src/wallet/types';

export { getModuleBuffer } from '../src/util';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = '127.0.0.1',
    port = 10000
): ConcordiumNodeClient {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new ConcordiumNodeClient(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        15000
    );
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
