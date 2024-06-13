import React from 'react';
import { useNavigate } from 'react-router-dom';

export function NewIdentity() {
    const navigate = useNavigate();
    return (
        <div>
            <h3>Your Concordium Identity</h3>
            <button onClick={() => navigate('/create')}>Create new identity</button>
            <button onClick={() => navigate('/recover')}>Recover existing identity</button>
        </div>
    );
}
