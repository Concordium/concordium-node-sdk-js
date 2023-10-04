import { IdentityProvider, Versioned } from '../../types.js';

interface CredentialHolderInformation {
    idCredSecret: string;
}

interface AccountCredentialInformation {
    credentialHolderInformation: CredentialHolderInformation;
    prfKey: string;
}

interface PrivateIdObjectData {
    aci: AccountCredentialInformation;
    randomness: string;
}

export interface Identity {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accounts: any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    identityObject: any;
    identityProvider: IdentityProvider;

    name: string;
    nextAccountNumber: number;

    privateIdObjectData: PrivateIdObjectData;
}

interface Identities {
    identities: Identity[];
}

export interface MobileWalletExport extends Versioned<Identities> {
    type: 'concordium-mobile-wallet-data';
}
