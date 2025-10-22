import {
    ArInfo,
    ConcordiumHdWallet,
    CredentialStatementBuilder,
    IdentityObjectV1,
    IdentityProvider,
    PrivateVerificationAuditRecord,
    SpecifiedIdentityCredentialStatement,
    VerifiablePresentationRequestV1,
    VerifiablePresentationV1,
    createIdentityCommitmentInputWithHdWallet,
    createIdentityDID,
    isIdentityCredentialStatement,
    sha256,
    streamToList,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import meow from 'meow';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { parseEndpoint, parseKeysFile, validateNetwork } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> <list-name> <action> [options]

  Required
    --token-id,     -t  The unique id of the token to transfer
    --address,      -a  The account address to add to the allow list (in base58 format)

  Options
    --help,         -h  Displays this message
    --endpoint,     -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --secure,       -s  Whether to use tls or not. Defaults to false.
    --wallet-file,  -w  A path to a wallet export file from a Concordium wallet. This is required for governance operations.
`,
    {
        importMeta: import.meta,
        flags: {
            walletFile: {
                type: 'string',
                alias: 'w',
                isRequired: true,
            },
            seedPhraseHex: {
                type: 'string',
                alias: 'p',
                isRequired: true,
                default:
                    'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860',
            },
            idObject: {
                type: 'string',
                alias: 'o',
                isRequired: true,
                default: './proofs/resources/id-object.json',
            },
            identityProviderIndex: {
                type: 'number',
                alias: 'idp',
                isRequired: true,
                default: 0,
            },
            identityIndex: {
                type: 'number',
                alias: 'id',
                isRequired: true,
                default: 0,
            },

            // optional
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            network: {
                type: 'string',
                alias: 'n',
                default: 'Testnet',
                choices: ['Testnet', 'Mainnet'],
            },
            secure: {
                type: 'boolean',
                alias: 's',
                default: false,
            },
        },
    }
);

const {
    seedPhraseHex,
    network,
    secure,
    idObject: idObjectFile,
    identityIndex,
    identityProviderIndex,
    walletFile,
    endpoint,
} = cli.flags;

if (!validateNetwork(network)) throw new Error('Invalid netowrk');

const [addr, port] = parseEndpoint(endpoint);
const grpc = new ConcordiumGRPCNodeClient(
    addr,
    Number(port),
    secure ? credentials.createSsl() : credentials.createInsecure()
);

const [sender, signer] = parseKeysFile(walletFile);

// First we generate the presentation request
const context = VerifiablePresentationRequestV1.createSimpleContext(
    sha256([Buffer.from(Date.now().toString())]),
    randomUUID(),
    'Example VP'
);
const statements = new CredentialStatementBuilder()
    .forIdentityCredentials([identityProviderIndex], (b) => {
        b.addEUResidency();
        b.addMinimumAge(18);
    })
    .getStatements();
const presentationRequest = await VerifiablePresentationRequestV1.createAndAchor(
    grpc,
    sender,
    signer,
    context,
    statements,
    { info: 'Example VP anchor' }
);

console.log('PRESENTATION REQUEST: \n', JSON.stringify(presentationRequest, null, 2), '\n');

// Then we create the presentation.
//
// This will normally happen in an application that holds the user credentials. In this example, the information
// normally held by said application, i.e. the credential used, the idp index, and the id index, is passed as program
// input.

// First, we get an interface to retrieve the cryptographic values required by the VP protocol
const wallet = ConcordiumHdWallet.fromHex(seedPhraseHex, network);
// Get the ID object - this will normally be stored inside the application constructing the proof
const idObject: IdentityObjectV1 = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), idObjectFile)).toString());
// The `IdentityProvider` information is normally stored alongside the ID object
const ipInfo = (await streamToList(grpc.getIdentityProviders()))[identityProviderIndex];
const ars = await streamToList(grpc.getAnonymityRevokers());
const arsInfos: Record<number, ArInfo> = ars.reduce((acc, ar) => {
    if (idObject.preIdentityObject.choiceArData.arIdentities.includes(ar.arIdentity)) {
        return { ...acc, [ar.arIdentity]: ar };
    }
    return acc;
}, {});
const idp: IdentityProvider = { ipInfo, arsInfos };

// At this point, we have all the values held inside the application.
// From the above, we retreive the secret input which is at the core of creating the verifiable presentation (proof)
const credentialInput = createIdentityCommitmentInputWithHdWallet(idObject, idp, identityIndex, wallet);

// we select the identity to prove the statement for
const selectedIdentity = createIdentityDID(network, identityProviderIndex, identityIndex);
// we unwrap here, as we know the statement exists (we created it just above)
const idStatement = presentationRequest.credentialStatements.find(isIdentityCredentialStatement)!;
const specifiedStatement: SpecifiedIdentityCredentialStatement = {
    id: selectedIdentity,
    statement: idStatement.statement,
};

console.log('Waiting for anchor transaction to finalize:', presentationRequest.transactionRef.toString());

// wait for the anchor transaction to finalize
await grpc.waitForTransactionFinalization(presentationRequest.transactionRef);

const presentation = await VerifiablePresentationV1.createFromAnchor(
    grpc,
    presentationRequest,
    [specifiedStatement],
    [credentialInput],
    [{ label: 'ResourceID', context: 'Example VP use-case' }]
);

console.log('PRESENTATION:\n', JSON.stringify(presentation, null, 2), '\n');

if (!(await VerifiablePresentationV1.verifyWithNode(presentation, presentationRequest, grpc, network)))
    throw new Error('Failed to verify the presentation');

// Finally, the entity requesting the proof stores the audit report and registers a pulic version on chain
const report = PrivateVerificationAuditRecord.create(randomUUID(), presentationRequest, presentation);
const { publicRecord, transactionHash: auditTransaction } = await PrivateVerificationAuditRecord.registerPublicRecord(
    report,
    grpc,
    sender,
    signer,
    'Some public info'
);

console.log('AUDIT REPORT:\n', JSON.stringify(publicRecord, null, 2), '\n');

console.log('Waiting for audit report registration to finalize:', auditTransaction.toString());
await grpc.waitForTransactionFinalization(auditTransaction);
console.log('Audit report successfully registered.');
