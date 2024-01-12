import { AttributeList, IdentityObjectV1 } from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractIdentityObjectUrl, fetchIdentity } from './util';
import { CreateAccount } from './CreateAccount';
import { identityObjectKey } from './constants';

function DisplayIdentity({ attributes }: { attributes: AttributeList }) {
    return (
        <ul>
            <li>
                Name: {attributes.chosenAttributes.firstName}{' '}
                {attributes.chosenAttributes.lastName}
            </li>
            <li>Nationality: {attributes.chosenAttributes.nationality}</li>
        </ul>
    );
}

export function ConfirmIdentity() {
    const location = useLocation();
    const [error, setError] = useState<string>();
    const identity = useMemo<IdentityObjectV1>(
        () => {
            const raw = localStorage.getItem(identityObjectKey)
            if (raw) {
                return JSON.parse(raw)
            }
        },
        []
    );
    const navigate = useNavigate();
    
    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);
        fetchIdentity(identityObjectUrl)
        .then((raw) => {
            localStorage.setItem(identityObjectKey, JSON.stringify(raw))
            navigate("/identity")
        })
        .catch(setError);
    }, [location.hash]);

    if (error) {
        return (
            <div>
                <h3>Identity creation failed</h3>
                <div>{error}</div>
            </div>
        );
    }

    return (
        <>
            <h3>Identity is not ready yet</h3>
        </>
    );
}
