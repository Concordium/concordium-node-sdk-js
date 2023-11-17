import { AccountAddress, AccountInfo, AccountTransaction, AccountTransactionHeader, AccountTransactionType, CcdAmount, ConcordiumGRPCWebClient, ConcordiumHdWallet, SimpleTransferPayload, TransactionExpiry, TransactionHash, buildBasicAccountSigner, signTransaction } from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { credNumber, identityIndex } from './Index';
import { DEFAULT_TRANSACTION_EXPIRY } from './util';

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
        console.log(TransactionHash.toHexString(transactionHash));
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

async function getAccount(accountAddress: AccountAddress.Type): Promise<AccountInfo> {
    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
    const maxRetries = 20;
    const timeoutMs = 1000;
    return new Promise(async (resolve, reject) => {
        let escapeCounter = 0;
        setTimeout(async function waitForAccount() {
            try {
                const accountInfo = await client.getAccountInfo(accountAddress);
                return resolve(accountInfo);
            } catch {
                if (escapeCounter > maxRetries) {
                    return reject();
                } else {
                    escapeCounter += 1;
                    setTimeout(waitForAccount, timeoutMs);
                }
            }
        }, timeoutMs);
    });
}

export function Account() {
    // TODO: We also need the correct indices to derive the correct keys.
    const { accountAddress } = useParams();
    const [accountInfo, setAccountInfo] = useState<AccountInfo>();
    const [error, setError] = useState<string>();
    const [cookies] = useCookies(['seed-phrase-cookie']);
    const address = useMemo(() => accountAddress ? AccountAddress.fromBase58(accountAddress) : undefined, [accountAddress]);

    useEffect(() => {
        if (address) {
            // TODO Needs abort controller to abort in cleanup function.
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
            <TransferInput accountAddress={address} seedPhrase={cookies['seed-phrase-cookie']} />
        </>
    );
}
