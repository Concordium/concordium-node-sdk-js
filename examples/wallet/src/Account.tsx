import {
    AccountAddress,
    AccountInfo,
    CcdAmount,
    TransactionHash,
} from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccount, sendTransferTransaction } from './util';
import {
    ccdscanBaseUrl,
    seedPhraseKey,
    selectedIdentityProviderKey,
} from './constants';

function DisplayAccount({ accountInfo }: { accountInfo: AccountInfo }) {
    return (
        <div>
            <h3>Your Concordium account</h3>
            <ul>
                <li>Address: {accountInfo.accountAddress.address}</li>
                <li>
                    Amount:{' '}
                    {accountInfo.accountAmount.microCcdAmount.toString()}
                </li>
            </ul>
        </div>
    );
}

function TransferInput({
    accountAddress,
    seedPhrase,
    identityProviderIdentity,
}: {
    accountAddress: AccountAddress.Type;
    seedPhrase: string;
    identityProviderIdentity: number;
}) {
    const [transferAmount, setTransferAmount] = useState<string>('0');
    const [recipient, setRecipient] = useState<string>();
    const [transactionHash, setTransactionHash] = useState<string>();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!recipient) {
            alert('Please provide a recipient account address');
            return;
        }

        let toAddress: AccountAddress.Type;
        try {
            toAddress = AccountAddress.fromBase58(recipient);
        } catch {
            alert('An invalid account address was provided');
            return;
        }

        let amount: CcdAmount.Type;
        try {
            amount = CcdAmount.fromMicroCcd(transferAmount);
        } catch {
            alert('An invalid micro CCD amount was provided');
            return;
        }

        const transactionHash = await sendTransferTransaction(
            amount,
            accountAddress,
            toAddress,
            seedPhrase,
            identityProviderIdentity
        );
        setTransactionHash(TransactionHash.toHexString(transactionHash));
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setTransferAmount(event.target.value);
    }

    function handleRecipientChange(event: React.ChangeEvent<HTMLInputElement>) {
        setRecipient(event.target.value);
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Transfer
                <input
                    type="text"
                    value={transferAmount}
                    onChange={handleChange}
                />
                Recipient
                <input
                    type="text"
                    value={recipient}
                    onChange={handleRecipientChange}
                />
            </label>
            <input type="submit" value="Send" />
            {transactionHash && (
                <div>
                    Latest transaction hash:{' '}
                    <a
                        href={`${ccdscanBaseUrl}/transactions?dcount=1&dentity=transaction&dhash=${transactionHash}`}
                    >
                        {transactionHash}
                    </a>
                </div>
            )}
        </form>
    );
}

export function Account() {
    const navigate = useNavigate();
    const { accountAddress } = useParams();
    const [accountInfo, setAccountInfo] = useState<AccountInfo>();
    const [error, setError] = useState<string>();
    const seedPhrase = useMemo(() => localStorage.getItem(seedPhraseKey), []);
    const selectedIdentityProviderIdentity = useMemo(
        () => localStorage.getItem(selectedIdentityProviderKey),
        []
    );
    const address = useMemo(
        () =>
            accountAddress
                ? AccountAddress.fromBase58(accountAddress)
                : undefined,
        [accountAddress]
    );

    useEffect(() => {
        if (address) {
            getAccount(address)
                .then(setAccountInfo)
                .catch(() => setError('Failed to retrieve account info.'));
        }
    }, [address]);

    if (seedPhrase === null || selectedIdentityProviderIdentity === null) {
        // Someone navigated directly to this page without first setting up the wallet.
        // Move them to the initial setup page.
        navigate('/');
        return;
    }

    if (!address) {
        return <div>Missing the account address.</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!accountInfo) {
        return <div>Waiting for account to be on chain.</div>;
    }

    return (
        <>
            <DisplayAccount accountInfo={accountInfo} />
            <TransferInput
                accountAddress={address}
                seedPhrase={seedPhrase}
                identityProviderIdentity={Number.parseInt(
                    selectedIdentityProviderIdentity
                )}
            />
        </>
    );
}
