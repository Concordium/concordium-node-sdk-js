import { AccountAddress, AccountInfo, ConcordiumGRPCWebClient } from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import JSONPretty from 'react-json-pretty';
import { useLocation, useParams } from 'react-router-dom';

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

function TransferInput() {
    const [transferAmount, setTransferAmount] = useState<number>();

    function handleSubmit(event: any) {
        alert('A name was submitted: ' + transferAmount);
        event.preventDefault();
    }

    function handleChange(event: any) {
        setTransferAmount(event.target.value);
      }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Transfer
                <input type="text" value={transferAmount} onChange={handleChange} />
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

    if (accountInfo) {
        return (
            <>
            <DisplayAccount accountInfo={accountInfo} />
            <TransferInput />
        </>
        );
    }

    return null;
}
