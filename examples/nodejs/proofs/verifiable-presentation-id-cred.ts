import {
    ArInfo,
    ConcordiumHdWallet,
    IdentityObjectV1,
    IdentityProvider,
    IdentityProviderDID,
    VerifiablePresentationV1,
    VerificationAuditRecordV1,
    VerificationRequestV1,
    createIdentityCommitmentInputWithHdWallet,
    sha256,
    streamToList,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import _JB from 'json-bigint';
import meow from 'meow';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { parseEndpoint, parseKeysFile, validateNetwork } from '../shared/util.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> <required> [options]

  Required
    --wallet-file,              -w      A path to a wallet export file from a Concordium wallet, used to register anchor and audit report.
    --seed-phrase-hex,          -p      Hex representation of a seed phrase to use to retrieve identity secrets.
    --id-object,                -o      A path to a JSON file holding an identity object. Defaults to './proofs/resources/id-object.json'.
    --identity-provider-index,  -idp    The index of the identity provider used for the id-object. Defaults to 0.
    --identity-index,           -id     The index of the identity. Defaults to 0.

  Options
    --help,                     -h  Displays this message
    --endpoint,                 -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --network,                  -n  The network corresponding to the node ('Testnet' or 'Mainnet'). Defaults to 'Testnet'.
    --secure,                   -s  Whether to use tls or not. Defaults to false.
`,
    {
        importMeta: import.meta,
        flags: {
            walletFile: {
                type: 'string',
                alias: 'w',
                isRequired: true,
            },
            seedPhrase: {
                type: 'string',
                alias: 'p',
                isRequired: true,
                default:
                    'smooth fortune retreat gesture crunch junk stay define embrace curtain treat grape reunion eye term stool cube main suggest tourist favorite radar couch pair',
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
    seedPhrase,
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

// First we generate the verification request.
//
// This will normally happen server-side.
const requestContext = VerificationRequestV1.createSimpleContext(
    sha256([Buffer.from(Date.now().toString())]),
    randomUUID(),
    'Example VP'
);
const requestClaims = VerificationRequestV1.claimsBuilder()
    .addAccountOrIdentityClaims([new IdentityProviderDID(network, identityProviderIndex)], (b) => {
        b.addEUResidency();
        b.addMinimumAge(18);
        b.revealAttribute('firstName');
    })
    .getClaims();
const verificationRequest = await VerificationRequestV1.createAndAnchor(
    grpc,
    { sender, signer },
    requestContext,
    requestClaims,
    {
        info: 'Example VP anchor',
    }
);

// simulate sending a response to the client requesting the verification request
const requestJson = JSONBig.stringify(verificationRequest);

// Then we create the verifiable presentation.
//
// This will normally happen in an application that holds the user credentials. In this example, the information
// normally held by said application, i.e. the credential used, the idp index, and the id index, is passed as program
// input.

// First, we get an interface to retrieve the cryptographic values required by the VP protocol
const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, network);
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

// simulate receiving verification request
const requestParsed = VerificationRequestV1.fromJSON(JSONBig.parse(requestJson));
// At this point, we have all the values held inside the application.
// From the above, we retreive the secret input which is at the core of creating the verifiable presentation (proof)
const proofInput = createIdentityCommitmentInputWithHdWallet(idObject, idp, identityIndex, wallet);

// we select the identity to prove the claims for
const idClaims = requestParsed.subjectClaims.find(
    (s) => s.type === 'identity'
)! as VerificationRequestV1.IdentityClaims; // we unwrap here, as we know the claims exists (we created it just above)
const proofClaims = VerifiablePresentationV1.createIdentityClaims(network, idp.ipInfo.ipIdentity, idClaims.statements);

console.log(
    'Waiting for verification request anchor transaction to finalize:',
    requestParsed.transactionRef.toString()
);

// wait for the anchor transaction to finalize
await grpc.waitForTransactionFinalization(requestParsed.transactionRef);
console.log('Verification request anchor successfully registered.');

const presentation = await VerifiablePresentationV1.createFromAnchor(
    grpc,
    requestParsed,
    [proofClaims],
    [proofInput],
    [{ label: 'ResourceID', context: 'Example VP use-case' }]
);

// simulate sending a response from the application to the client requesting the presentation
const presentationJson = JSONBig.stringify(presentation);

// simulate receiving presentation to be verified
const presentationParsed = VerifiablePresentationV1.fromJSON(JSONBig.parse(presentationJson));

// Finally, the entity requesting the proof stores the audit report and registers a pulic version on chain
const result = await VerificationAuditRecordV1.createChecked(
    randomUUID(),
    verificationRequest,
    presentationParsed,
    grpc,
    network
);

if (result.type === 'failed') throw new Error(`Failed to verify presentation: ${result.error}`);
const auditTransaction = await VerificationAuditRecordV1.registerAnchor(
    result.result,
    grpc,
    { sender, signer },
    {
        info: 'Some public info',
    }
);

console.log('Waiting for verification audit report registration to finalize:', auditTransaction.toString());
await grpc.waitForTransactionFinalization(auditTransaction);
console.log('Verification audit anchor successfully registered.');
