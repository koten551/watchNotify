/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import {
  appService,
  backgroundTask,
  notificationListener,
  registerChannel,
} from './src/configs/index.ts';
import App from './src/screens/index';

registerChannel();

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerHeadlessTask('backgroundTask', () => backgroundTask);

appService();
