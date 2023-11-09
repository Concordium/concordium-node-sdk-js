import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

import './index.css';
import { Identity } from './Identity';
import { Account } from './Account';

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
        path: "/identity",
        element: <Identity />,
    },
    { 
        path: "/account/:accountAddress",
        element: <Account />,
    }
]);

createRoot(container).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
