import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { identityObjectKey } from './constants';
import { extractIdentityObjectUrl, fetchIdentity } from './util';

export function ConfirmIdentity() {
    const location = useLocation();
    const [error, setError] = useState<string>();
    const navigate = useNavigate();

    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);
        fetchIdentity(identityObjectUrl)
            .then((raw) => {
                localStorage.setItem(identityObjectKey, JSON.stringify(raw));
                navigate('/identity');
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
            <h3>Identity is not ready yet. Please wait.</h3>
        </>
    );
}
