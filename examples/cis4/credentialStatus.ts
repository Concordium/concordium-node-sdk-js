import meow from 'meow';
import { credentials } from '@grpc/grpc-js';

import {
    CIS4,
    CIS4Contract,
    ContractAddress,
    createConcordiumClient,
} from '@concordium/node-sdk';
import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,            -i  The index of the smart contract
    --cred-id,          -c  A path to a wallet export file from a Concordium wallet

  Options
    --help,             -h  Displays this message
    --endpoint,         -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,             The subindex of the smart contract. Defaults to 0
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            index: {
                type: 'number',
                alias: 'i',
                isRequired: true,
            },
            subindex: {
                type: 'number',
                default: 0,
            },
            credId: {
                type: 'string',
                alias: 'c',
                isRequired: true,
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

(async () => {
    const contract = await CIS4Contract.create(
        client,
        ContractAddress.create(cli.flags.index, cli.flags.subindex)
    );

    const credentialStatus = await contract.credentialStatus(cli.flags.credId);

    let status: string;
    switch (credentialStatus) {
        case CIS4.CredentialStatus.Active: {
            status = 'Active';
            break;
        }
        case CIS4.CredentialStatus.Revoked: {
            status = 'Revoked';
            break;
        }
        case CIS4.CredentialStatus.Expired: {
            status = 'Expired';
            break;
        }
        case CIS4.CredentialStatus.NotActivated: {
            status = 'Not activated';
            break;
        }
    }
    console.log('Credential status:', status);
})();
