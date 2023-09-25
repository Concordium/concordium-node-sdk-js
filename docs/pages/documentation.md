This is the documentation for the Concordium Javascript SDK. Here we cover
the JS wrappers for interacting with the Concordium nodes.

Most functionality is provideded by the
[GRPC-Client](../classes/Common_GRPC_Client.ConcordiumGRPCClient.html)
however there exists additional helper functions, for example to help with
creating {@page transactions.md transactions}, or {@page identity-proofs.md
creating identity proof statements}, or {@page utility-functions.md general
utility functions}.

A good way to get started is to check out the {@page runnable-examples.md
runnable examples}.

To create a GRPC-Client in NodeJS-SDK:

```ts
    import { credentials } from '@grpc/grpc-js/';
    import { createConcordiumClient } from '@concordium/node-sdk';
    ...
    return createConcordiumClient(
        address,
        port,
        credentials.createSsl(),
        { timeout: 15000 }
    );
```

To create a GRPC-Client in the Web-SDK:

```ts
    import { createConcordiumClient } from '@concordium/web-sdk';
    ...
    return createConcordiumClient(
        address,
        port,
        { timeout: 15000 }
    );
```

## Compatibility

As of version 10 (node-sdk@10, web-sdk@7), the SDK's are compatible only with environments
respecting the `exports` field of a modules `package.json`, i.e. taking this into
account when resolving modules. This means

- NodeJS versions **16** and later.
- Bundlers resolving modules by `package.json` `exports`.

### Typescript

Typescript has support for resolving modules through `exports` of `package.json`
from versions

- NodeJS -> Typescript version **4.7** and later with
`compilerOptions.moduleResolution: "node16" // Or "nodenext"`.
- Bundlers -> Typescript version **5.0** and later with
`compilerOptions.moduleResolution: "bundler"`.

### NodeJS

The node-sdk is published as an ES module, and as such packages using it must
also be ES modules.

The easiest way to run your node application as an ES module, is by setting
the `type` field of `package.json` to be set to `"module"`:

```json
{
    ...
    "type": "module",
    ...
}
```

Alternatively, files names with the extension `mjs` (or `mts` for TypeScript)
are always handled as ES modules.
