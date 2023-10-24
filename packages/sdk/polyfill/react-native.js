/* eslint-disable import/no-extraneous-dependencies */
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

import '@stardazed/streams-polyfill';
import crypto from 'isomorphic-webcrypto';
import '@azure/core-asynciterator-polyfill';

// import { polyfill as polyfillBase64 } from 'react-native-polyfill-globals/src/base64.js';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding.js';
// import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream.js';
// import { polyfill as polyfillURL } from 'react-native-polyfill-globals/src/url.js';
// import { polyfill as polyfillFetch } from 'react-native-polyfill-globals/src/fetch.js';
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto.js';

// polyfillBase64();
polyfillEncoding();
// polyfillReadableStream();
// polyfillURL();
// polyfillFetch();
polyfillCrypto();

await crypto.ensureSecure();
polyfillGlobal('crypto', () => crypto);
