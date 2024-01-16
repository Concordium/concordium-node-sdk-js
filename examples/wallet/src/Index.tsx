import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { Identity } from './Identity';
import { Account } from './Account';
import { CreateIdentity } from './CreateIdentity';
import { SetupSeedPhrase } from './Setup';
import { RecoverIdentity } from './RecoverIdentity';
import { ConfirmIdentity } from './ConfirmIdentity';
import { NewIdentity } from './NewIdentity';

const container = document.getElementById('root');

if (!container) {
    throw new Error('Expected container DOM node to be defined');
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <SetupSeedPhrase />,
    },
    {
        path: '/new',
        element: <NewIdentity />,
    },
    {
        path: '/create',
        element: <CreateIdentity />,
    },
    {
        path: '/confirm-identity',
        element: <ConfirmIdentity />,
    },
    {
        path: '/identity',
        element: <Identity />,
    },
    {
        path: '/recover',
        element: <RecoverIdentity />,
    },
    {
        path: '/account/:accountAddress',
        element: <Account />,
    },
]);

createRoot(container).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
