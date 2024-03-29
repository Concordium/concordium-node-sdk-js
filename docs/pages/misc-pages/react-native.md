## Using the SDK with react native

To use the SDK in a react native context, it is required to include some polyfills for functionality used in the SDK.
The list of polyfills to be installed in the project alongside `@concordium/web-sdk` include:

```json
{
    ...
    "dependencies": {
        "@azure/core-asynciterator-polyfill": "...",
        "@stardazed/streams-polyfill": "...",
        "react-native-get-random-values": "...",
        "react-native-polyfill-globals": "...",
        "text-encoding": "..."
}
}
```

### Installation

```bash
yarn add @concordium/web-sdk react-native-polyfill-globals react-native-get-random-values text-encoding @azure/core-asynciterator-polyfill @stardazed/streams-polyfill # or npm install
npx pod-install # if building for ios, adds native modules from dependencies to project.
```

### Adding polyfill to app

{@codeblock ~~:reactnative/polyfill.ts#documentation-snippet}

{@codeblock ~~:reactnative/index.js#documentation-snippet}

This ensures the native modules required by the SDK are present.

### Unsupported functionality

Due to current lack of support for web assembly in react native, some aspects of the SDK are not supported on the platform.
This is specifically scoped to the functionality exposed at the entrypoint `@concordium/web-sdk/wasm`. Everything else supported on web
platforms should also be supported on react native.
