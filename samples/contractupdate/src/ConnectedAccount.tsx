import { Network, WalletConnection, withJsonRpcClient } from '@concordium/react-components';
import { useEffect, useState } from 'react';
import { AccountInfo } from '@concordium/web-sdk';
import { Alert } from 'react-bootstrap';

interface Props {
    network: Network;
    activeConnection: WalletConnection | undefined;
    activeConnectedAccount: string | undefined;
}

function ccdScanUrl(network: Network, activeConnectedAccount: string | undefined) {
    return `${network.ccdScanBaseUrl}/?dcount=1&dentity=account&daddress=${activeConnectedAccount}`;
}

export function ConnectedAccount({ activeConnection, activeConnectedAccount, network }: Props) {
    const [info, setInfo] = useState<AccountInfo>();
    const [infoError, setInfoError] = useState('');
    useEffect(() => {
        if (activeConnection && activeConnectedAccount) {
            setInfo(undefined);
            withJsonRpcClient(activeConnection, (rpc) => rpc.getAccountInfo(activeConnectedAccount))
                .then((res) => {
                    setInfo(res);
                    setInfoError('');
                })
                .catch((err) => {
                    setInfo(undefined);
                    setInfoError(err);
                });
        }
    }, [activeConnection, activeConnectedAccount]);
    return (
        <>
            {infoError && <Alert variant="danger">Error querying account info: {infoError}</Alert>}
            {activeConnectedAccount && (
                <>
                    Connected to account{' '}
                    <a target="_blank" rel="noreferrer" href={ccdScanUrl(network, activeConnectedAccount)}>
                        <code>{activeConnectedAccount}</code>
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
                <li>Address: {account.accountAddress}</li>
                <li>Nonce: {account.accountNonce.toString()}</li>
                <li>Balance: {account.accountAmount.toString()}</li>
                <li>Index: {account.accountIndex.toString()}</li>
            </ul>
        </Alert>
    );
}
