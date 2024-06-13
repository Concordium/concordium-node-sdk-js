import { AttributeList, IdentityObjectV1 } from '@concordium/web-sdk';
import React, { useMemo, useState } from 'react';

import { CreateAccount } from './CreateAccount';
import { identityObjectKey } from './constants';

function DisplayIdentity({ attributes }: { attributes: AttributeList }) {
    return (
        <ul>
            <li>
                Name: {attributes.chosenAttributes.firstName} {attributes.chosenAttributes.lastName}
            </li>
            <li>Nationality: {attributes.chosenAttributes.nationality}</li>
        </ul>
    );
}

export function Identity() {
    const [missingIdentity, setMissingIdentity] = useState<boolean>(false);
    const identity = useMemo<IdentityObjectV1>(() => {
        const identityObjectJson = localStorage.getItem(identityObjectKey);
        if (identityObjectJson) {
            return JSON.parse(identityObjectJson);
        } else {
            setMissingIdentity(true);
        }
    }, []);

    return (
        <>
            <h3>Your Concordium identity</h3>
            {missingIdentity && <h3>Missing identity in storage</h3>}
            {identity && (
                <>
                    <DisplayIdentity attributes={identity.attributeList} />
                    <CreateAccount identity={identity} />
                </>
            )}
        </>
    );
}
