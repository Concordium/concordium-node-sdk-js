This is the documentation for the Concordium Javascript SDK. Here we cover
the JS wrappers for interacting with the Concordium nodes.

Most functionality is provideded by the {@page grpc.md GRPC-Client} however
there exists additional helper functions, for example to help with creating
{@page transactions.md transactions}, or {@page identity-proofs.md creating
identity proof statements}, or {@page utility-functions.md general utility
functions}.

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
