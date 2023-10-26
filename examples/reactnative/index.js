/**
 * @format
 */

// #region documentation-snippet
import { AppRegistry } from 'react-native';

import './polyfill';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
// #endregion documentation-snippet
