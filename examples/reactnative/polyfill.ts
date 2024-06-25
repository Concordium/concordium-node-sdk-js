// #region documentation-snippet
// Requires peer dependency `text-encoding`
import '@azure/core-asynciterator-polyfill';
import '@stardazed/streams-polyfill';
// @ts-ignore
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto';
// @ts-ignore
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';

// Requires peer dependency `react-native-get-random-values`

polyfillEncoding();
polyfillCrypto();
// #endregion documentation-snippet
