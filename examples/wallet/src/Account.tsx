import { AccountAddress, AccountInfo, AccountTransaction, AccountTransactionHeader, AccountTransactionType, CcdAmount, ConcordiumGRPCWebClient, ConcordiumHdWallet, SequenceNumber, SimpleTransferPayload, TransactionExpiry, buildBasicAccountSigner, signTransaction } from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import JSONPretty from 'react-json-pretty';
import { useLocation, useParams } from 'react-router-dom';
import { DEFAULT_TRANSACTION_EXPIRY, credNumber } from './Identity';
import { identityIndex, seedPhrase } from './Root';

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

function TransferInput({ accountAddress }: { accountAddress: AccountAddress.Type }) {
    const [transferAmount, setTransferAmount] = useState<string>('0');
    const [recipient, setRecipient] = useState<string>();

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


        const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
        const payload: SimpleTransferPayload = {
            amount,
            toAddress
        }

        const nonce = (await client.getNextAccountNonce(accountAddress)).nonce

        const header: AccountTransactionHeader = {
            expiry: TransactionExpiry.fromDate(new Date(Date.now() + DEFAULT_TRANSACTION_EXPIRY)),
            nonce,
            sender: accountAddress
        };

        const transaction: AccountTransaction = {
            type: AccountTransactionType.Transfer,
            payload,
            header
        }

        let wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, 'Testnet');
        const signingKey = wallet.getAccountSigningKey(0, identityIndex, credNumber).toString('hex');
        const signature = await signTransaction(transaction, buildBasicAccountSigner(signingKey));
        const transactionHash = await client.sendAccountTransaction(transaction, signature);

        console.log(transactionHash);
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
        </form>
    );
}

export function Account() {
    // TODO: We also need the correct indices to derive the correct keys.
    const { accountAddress } = useParams();
    const [accountInfo, setAccountInfo] = useState<AccountInfo>();

    useEffect(() => {
        if (accountAddress) {
            const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
            client.getAccountInfo(AccountAddress.fromBase58(accountAddress)).then(setAccountInfo);
        }
    }, [accountAddress]);

    if (!accountAddress) {
        return <div>Missing the account address.</div>
    }

    if (accountInfo) {
        return (
            <>
            <DisplayAccount accountInfo={accountInfo} />
            <TransferInput accountAddress={AccountAddress.fromBase58(accountAddress)} />
        </>
        );
    }

    return null;
}
