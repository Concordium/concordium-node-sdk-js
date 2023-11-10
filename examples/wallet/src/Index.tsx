import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
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

const container = document.getElementById('root');

if (!container) {
    throw new Error('Expected container DOM node to be defined');
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
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
// TODO Get rid of the seed phrase atom when the web-sdk can create identity requests without
// providing the seed phase as input.
export const seedPhraseAtom = atom<string | undefined>(undefined);
export const networkAtom = atom<'Testnet' | 'Mainnet'>('Testnet');
export const client = atom<ConcordiumGRPCClient | undefined>(undefined);

createRoot(container).render(<React.StrictMode>
    <RouterProvider router={router} />
</React.StrictMode>);
