/**
 * @format
 */

// #region documentation-snippet
import { AppRegistry } from 'react-native';

// Polyfill must come before any reference to @concordium/web-sdk.
// In this case, that means before importing ./App.tsx
import './polyfill';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
// #endregion documentation-snippet
