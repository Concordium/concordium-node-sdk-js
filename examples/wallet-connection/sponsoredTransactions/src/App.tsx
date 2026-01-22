import {
    STAGENET,
    SendSponsoredTransactionPayload,
    WalletConnectionProps,
    WithWalletConnector,
    useConnect,
    useConnection,
} from '@concordium/react-components';
import {
    AccountAddress,
    AccountTransactionType,
    Cbor,
    CborAccountAddress,
    CborMemo,
    CcdAmount,
    SequenceNumber,
    TokenAmount,
    TokenId,
    TokenOperationType,
    Transaction,
    TransactionExpiry,
    buildBasicAccountSigner,
} from '@concordium/web-sdk';
import { useCallback, useState } from 'react';
import { Alert, Button, Col, Container, Row, Spinner } from 'react-bootstrap';

import { WalletConnectorButton } from './WalletConnectorButton';
import { BROWSER_WALLET, WALLET_CONNECT } from './config';

export default function App() {
    return (
        <Container>
            <h1>Sponsored Transactions</h1>
            <WithWalletConnector network={STAGENET}>{(props) => <Main {...props} />}</WithWalletConnector>
        </Container>
    );
}

function Main(props: WalletConnectionProps) {
    const { activeConnectorType, activeConnector, activeConnectorError, connectedAccounts, genesisHashes } = props;
    const { connection, setConnection, account } = useConnection(connectedAccounts, genesisHashes);
    const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);

    const [recipientInput, setRecipientInput] = useState('3tWfFAfNsyYtPRgDTpGJuqhQy92rAfLZum7HRyPkezE7PcT3KB');
    const [sponsorInput, setSponsorInput] = useState('3tWfFAfNsyYtPRgDTpGJuqhQy92rAfLZum7HRyPkezE7PcT3KB');
    const [privateKeyInput, setPrivateKeyInput] = useState(
        'c2cf7fab89b86612dc5f07cd049703156d5548b43c36e1c220545bb103bba871'
    );
    const [senderNonceInput, setSenderNonceInput] = useState<number>(6);

    const handleRecipientInput = useCallback((e: any) => setRecipientInput(e.target.value), []);
    const handleSponsorInput = useCallback((e: any) => setSponsorInput(e.target.value), []);
    const handlePrivateKeyInput = useCallback((e: any) => setPrivateKeyInput(e.target.value), []);
    const handleSenderNonceInput = useCallback((e: any) => setSenderNonceInput(e.target.value), []);

    const expiry = TransactionExpiry.futureMinutes(5);

    async function submitPayloadToSponsor(sender: AccountAddress.Type, transaction: any) {
        const builder = Transaction.builderFromJSON(transaction);
        const sponsorSigner = buildBasicAccountSigner(privateKeyInput);
        const sponsorSignerAccount = AccountAddress.fromBase58(sponsorInput);

        const senderNonce = SequenceNumber.create(senderNonceInput);
        const sponsorableTransaction = builder
            .addMetadata({ sender, nonce: senderNonce, expiry })
            .addSponsor(sponsorSignerAccount)
            .build();

        return await Transaction.sponsor(sponsorableTransaction, sponsorSigner);
    }

    async function submitSponsoredPLT_Transfer() {
        if (connection && account) {
            const ops = [
                {
                    [TokenOperationType.Transfer]: {
                        amount: TokenAmount.fromJSON({
                            value: '100',
                            decimals: 2,
                        }),
                        recipient: CborAccountAddress.fromAccountAddress(AccountAddress.fromBase58(recipientInput)),
                        memo: CborMemo.fromString('Some text for memo'),
                    },
                },
            ];

            console.log(JSON.stringify(ops));

            const payload = {
                tokenId: TokenId.fromString('PLTLEVEL'),
                operations: Cbor.encode(ops),
            };

            const transaction = Transaction.tokenUpdate(payload);

            console.log(JSON.stringify(payload));

            const sponsorResponse = await submitPayloadToSponsor(
                AccountAddress.fromBase58(account),
                Transaction.toJSON(transaction)
            );

            const sponsored = Transaction.signableFromJSON(Transaction.toJSON(sponsorResponse));

            console.log('sponsoredTransaction', sponsored);

            if (sponsored.version == 1) {
                if (sponsored.signatures.sponsor != undefined) {
                    const sponsorSignature = sponsored.signatures.sponsor;
                    const payloadWithType: SendSponsoredTransactionPayload = {
                        type: AccountTransactionType.TokenUpdate,
                        tokenId: payload.tokenId,
                        operations: payload.operations,
                    };

                    return connection
                        .signAndSendSponsoredTransaction(
                            AccountAddress.fromBase58(account),
                            SequenceNumber.create(senderNonceInput),
                            AccountAddress.fromBase58(sponsorInput),
                            sponsorSignature,
                            payloadWithType,
                            expiry
                        )
                        .then((txHash) => alert('TxHash:' + JSON.stringify(txHash)))
                        .catch(alert);
                } else {
                    throw new Error('expect at least one sponsor siganture');
                }
            } else {
                throw new Error('expect version 1');
            }
        } else {
            throw new Error('Connect wallet');
        }
    }

    async function submitSponsoredCCD_Transfer() {
        if (connection && account) {
            const payload = {
                amount: CcdAmount.fromCcd(1),
                toAddress: AccountAddress.fromBase58(recipientInput),
            };

            const transaction = Transaction.transfer(payload);

            console.log(JSON.stringify(payload));

            const sponsorResponse = await submitPayloadToSponsor(
                AccountAddress.fromBase58(account),
                Transaction.toJSON(transaction)
            );

            const sponsored = Transaction.signableFromJSON(Transaction.toJSON(sponsorResponse));

            console.log('sponsoredTransaction', sponsored);

            if (sponsored.version == 1) {
                if (sponsored.signatures.sponsor != undefined) {
                    const sponsorSignature = sponsored.signatures.sponsor;
                    const payloadWithType: SendSponsoredTransactionPayload = {
                        type: AccountTransactionType.Transfer,
                        amount: payload.amount,
                        toAddress: payload.toAddress,
                    };

                    return connection
                        .signAndSendSponsoredTransaction(
                            AccountAddress.fromBase58(account),
                            SequenceNumber.create(senderNonceInput),
                            AccountAddress.fromBase58(sponsorInput),
                            sponsorSignature,
                            payloadWithType,
                            expiry
                        )
                        .then((txHash) => alert('TxHash:' + JSON.stringify(txHash)))
                        .catch(alert);
                } else {
                    throw new Error('expect at least one sponsor siganture');
                }
            } else {
                throw new Error('expect version 1');
            }
        } else {
            throw new Error('Connect wallet');
        }
    }
    return (
        <>
            <Row className="mt-3 mb-3">
                <Col>
                    <WalletConnectorButton
                        connectorType={BROWSER_WALLET}
                        connectorName="Browser Wallet"
                        connection={connection}
                        {...props}
                    />
                </Col>
                <Col>
                    <WalletConnectorButton
                        connectorType={WALLET_CONNECT}
                        connectorName="WalletConnect"
                        connection={connection}
                        {...props}
                    />
                </Col>
            </Row>
            <Row className="mt-3 mb-3">
                <Col>
                    {activeConnectorError && <Alert variant="danger">Connector error: {activeConnectorError}.</Alert>}
                    {!activeConnectorError && activeConnectorType && !activeConnector && <Spinner />}
                    {connectError && <Alert variant="danger">Connection error: {connectError}.</Alert>}
                    {connect && !account && (
                        <Button type="button" onClick={connect} disabled={isConnecting}>
                            {isConnecting && 'Connecting...'}
                            {!isConnecting && activeConnectorType === BROWSER_WALLET && 'Connect Browser Wallet'}
                            {!isConnecting && activeConnectorType === WALLET_CONNECT && 'Connect Mobile Wallet'}
                        </Button>
                    )}
                </Col>
            </Row>
            {account && (
                <Row className="mt-3 mb-3">
                    <Col>
                        Connected to account <code>{account}</code>.
                    </Col>
                </Row>
            )}
            <br />
            <br />
            Sponsor Account:
            <input onChange={handleSponsorInput} type="text" id="sponsorAccount" value={sponsorInput} />
            <br />
            <br />
            Sponsor Private Key:
            <input onChange={handlePrivateKeyInput} type="text" id="privateKey" value={privateKeyInput} />
            <br />
            <br />
            Recipient Address:
            <input onChange={handleRecipientInput} type="text" id="recipient" value={recipientInput} />
            <br />
            <br />
            Sender Account Nonce:
            <input onChange={handleSenderNonceInput} type="text" id="senderNonce" value={senderNonceInput} />
            <br />
            <br />
            <Button variant="primary" onClick={submitSponsoredPLT_Transfer}>
                Sign And Submit Sponsored PLT Transfer Transaction
            </Button>
            <br />
            <br />
            <Button variant="primary" onClick={submitSponsoredCCD_Transfer}>
                Sign And Submit Simple CCD Transfer Transaction
            </Button>
        </>
    );
}
