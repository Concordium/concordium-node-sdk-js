import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedPhraseKey } from './constants';

/**
 * Allow the user to input their seed phrase. The seed phrase will be stored
 * in a cookie which is not safe, so only use this with a seed phrase generated
 * specifically for testing.
 */
export function SetupSeedPhrase() {
    const [seedPhraseWords, setSeedPhraseWords] = useState<string>();
    const navigate = useNavigate();

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!seedPhraseWords) {
            alert('Please input a seed phrase');
            return;
        }

        try {
            localStorage.setItem(seedPhraseKey, seedPhraseWords);
            navigate('/create');
        } catch {
            alert('An invalid seed phrase was provided');
            return;
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Enter your seed phrase
                <input type="text" value={seedPhraseWords} onChange={(event) => setSeedPhraseWords(event.target.value)} />
            </label>
            <input type="submit" value="Submit" />
        </form>
    );
}
