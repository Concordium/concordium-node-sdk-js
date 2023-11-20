import { AccountAddress, AccountInfo, CcdAmount, TransactionHash, buildBasicAccountSigner, signTransaction } from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { client, createSimpleTransferTransaction, getAccount, getAccountSigningKey } from './util';

function DisplayAccount({ accountInfo }: { accountInfo: AccountInfo }) {
    return (
        <div>
            <h3>Your Concordium account</h3>
            <ul>
                <li>Address: {accountInfo.accountAddress.address}</li>
                <li>Amount: {accountInfo.accountAmount.microCcdAmount.toString()}</li>
            </ul>
        </div>
    );
}

function TransferInput({ accountAddress, seedPhrase }: { accountAddress: AccountAddress.Type, seedPhrase: string }) {
    const [transferAmount, setTransferAmount] = useState<string>('0');
    const [recipient, setRecipient] = useState<string>();
    const [transactionHash, setTransactionHash] = useState<string>();

    async function handleSubmit(event: any) {
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

        const simpleTransfer = await createSimpleTransferTransaction(amount, accountAddress, toAddress);

        // TODO This doesn't work if we select another IDP than 0.
        const signingKey = getAccountSigningKey(seedPhrase, 0, 0, 0);

        const signature = await signTransaction(simpleTransfer, buildBasicAccountSigner(signingKey));
        const transactionHash = await client.sendAccountTransaction(simpleTransfer, signature);
        setTransactionHash(TransactionHash.toHexString(transactionHash));
    }

    function handleChange(event: any) {
        setTransferAmount(event.target.value);
    }

    function handleRecipientChange(event: any) {
        setRecipient(event.target.value);
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Transfer
                <input type="text" value={transferAmount} onChange={handleChange} />
                Recipient
                <input type="text" value={recipient} onChange={handleRecipientChange} />
            </label>
            <input type="submit" value="Send" />
            {transactionHash && (<div>Latest transaction hash: <a href={`https://testnet.ccdscan.io/transactions?dcount=1&dentity=transaction&dhash=${transactionHash}`}>{transactionHash}</a></div>)}
        </form>
    );
}

export function Account() {

    // TODO We also need to get the IDP index as a value here.

    const { accountAddress } = useParams();
    const [accountInfo, setAccountInfo] = useState<AccountInfo>();
    const [error, setError] = useState<string>();
    const [cookies] = useCookies(['seed-phrase-cookie']);
    const seedPhrase = useMemo(() => cookies['seed-phrase-cookie'] as string, [cookies]);
    const address = useMemo(() => accountAddress ? AccountAddress.fromBase58(accountAddress) : undefined, [accountAddress]);

    useEffect(() => {
        if (address) {
            getAccount(address).then(setAccountInfo).catch(() => setError('Failed to retrieve account info.'));
        }
    }, [address]);

    if (!address) {
        return <div>Missing the account address.</div>
    }

    if (error) {
        return (<div>{error}</div>);
    }

    if (!accountInfo) {
        return (<div>Waiting for account to be on chain.</div>);
    }

    return (
        <>
            <DisplayAccount accountInfo={accountInfo} />
            <TransferInput accountAddress={address} seedPhrase={seedPhrase} />
        </>
    );
}
