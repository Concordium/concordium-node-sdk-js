## Using the SDK with react native

To use the SDK in a react native context, the peer dependency [react-native-get-random-values](https://github.com/LinusU/react-native-get-random-values) is required
to be installed in the project alongside `@concordium/web-sdk`:

```bash
yarn add @concordium/web-sdk react-native-get-random-values # or npm install ...
npx pod-install
```

This ensures the native modules required by the SDK are present.

### Unsupported functionality

Due to current lack of support for web assembly in react native, some aspects of the SDK are not supported on the platform.
This is specifically scoped to the functionality exposed at the entrypoint `@concordium/web-sdk/wasm`. Everything else supported on web
platforms should also be supported on react native.
