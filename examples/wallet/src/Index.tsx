import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

import './index.css';
import { Identity } from './Identity';
import { Account } from './Account';
import { atom } from 'jotai';
import { ConcordiumGRPCClient, ConcordiumHdWallet } from '@concordium/web-sdk';
import { CreateIdentity } from './CreateIdentity';
import { SetupSeedPhrase } from './Root';

const container = document.getElementById('root');

if (!container) {
    throw new Error('Expected container DOM node to be defined');
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <SetupSeedPhrase />,
    },
    {
        path: "/create",
        element: <CreateIdentity />,
    },
    {
        path: "/identity",
        element: <Identity />,
    },
    {
        path: "/account/:accountAddress",
        element: <Account />,
    }
]);

// Global state definitions.
export const network = 'Testnet';

// The index of the identity to create. This index is part of the key derivation path used
// for generating the keys for the identity and any account created from it.
export const identityIndex = 0;
export const client = atom<ConcordiumGRPCClient | undefined>(undefined);
export const seedPhraseCookie = 'seed-phrase-cookie';

createRoot(container).render(<React.StrictMode>
    <RouterProvider router={router} />
</React.StrictMode>);
