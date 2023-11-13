import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { Network } from '@concordium/react-components';
import { AccountAddress, AccountInfo, ConcordiumGRPCClient } from '@concordium/web-sdk';
import { errorString } from './util';

interface Props {
    network: Network;
    rpc: ConcordiumGRPCClient | undefined;
    account: string | undefined;
}

function ccdScanUrl(network: Network, activeConnectedAccount: string | undefined) {
    return `${network.ccdScanBaseUrl}/?dcount=1&dentity=account&daddress=${activeConnectedAccount}`;
}

export function ConnectedAccount({ network, rpc, account }: Props) {
    const [info, setInfo] = useState<AccountInfo>();
    const [infoError, setInfoError] = useState('');
    useEffect(() => {
        if (rpc && account) {
            setInfo(undefined);
            rpc.getAccountInfo(AccountAddress.fromBase58(account))
                .then((res) => {
                    setInfo(res);
                    setInfoError('');
                })
                .catch((err) => {
                    setInfo(undefined);
                    setInfoError(errorString(err));
                });
        }
    }, [rpc, account]);
    return (
        <>
            {infoError && <Alert variant="danger">Error querying account info: {infoError}</Alert>}
            {account && (
                <>
                    Connected to account{' '}
                    <a target="_blank" rel="noreferrer" href={ccdScanUrl(network, account)}>
                        <code>{account}</code>
                    </a>{' '}
                    on <b>{network.name}</b>.{info && <Details account={info} />}
                </>
            )}
        </>
    );
}

function Details({ account }: { account: AccountInfo }) {
    return (
        <Alert variant="info">
            <ul className="mb-0">
                <li>Address: {account.accountAddress.address}</li>
                <li>Nonce: {account.accountNonce.toString()}</li>
                <li>Balance: {account.accountAmount.toString()}</li>
                <li>Index: {account.accountIndex.toString()}</li>
            </ul>
        </Alert>
    );
}
