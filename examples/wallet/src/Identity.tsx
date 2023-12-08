import { AttributeList, IdentityObjectV1 } from '@concordium/web-sdk';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { extractIdentityObjectUrl, fetchIdentity } from './util';
import { CreateAccount } from './CreateAccount';

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

export function Identity() {
    const location = useLocation();
    const [identity, setIdentity] = useState<IdentityObjectV1>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);

        // To be able to create an account the identity is required. In a production
        // wallet the identity should be persisted, and not only kept in memory as in this
        // example.
        fetchIdentity(identityObjectUrl).then(setIdentity).catch(setError);
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
            <h3>Your Concordium identity</h3>
            {identity && (
                <>
                    <DisplayIdentity attributes={identity.attributeList} />
                    <CreateAccount identity={identity} />
                </>
            )}
        </>
    );
}
