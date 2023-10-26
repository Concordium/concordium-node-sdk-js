import '@stardazed/streams-polyfill';
import '@azure/core-asynciterator-polyfill';

// @ts-ignore
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding'; // Requires peer dependency `text-encoding`
// @ts-ignore
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto'; // Requires peer dependency `react-native-get-random-values`

polyfillEncoding();
polyfillCrypto();
