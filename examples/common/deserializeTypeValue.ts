import meow from 'meow';
import { deserializeTypeValue } from '@concordium/node-sdk';
import { Buffer } from 'buffer/';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --value, -v hex encoded serialized value
    --schema -s base64 encoded shcema for the value's type

  Options
    --help,     Displays this message
`,
    {
        importMeta: import.meta,
        flags: {
            value: {
                type: 'string',
                alias: 'v',
                isRequired: true,
            },
            schema: {
                type: 'string',
                alias: 's',
                isRequired: true,
            },
        },
    }
);

/**
 * deserializeTypeValue
 */

// #region documentation-snippet
const deserializedValue = deserializeTypeValue(
    Buffer.from(cli.flags.value, 'hex'),
    Buffer.from(cli.flags.schema, 'base64'),
    true
);
console.dir(deserializedValue, { depth: null, colors: true });
// #endregion documentation-snippet
