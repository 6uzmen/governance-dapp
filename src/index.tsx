/**
 * index.tsx
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */

import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as serviceWorker from 'serviceWorker';
import 'styles/tailwind.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/src/blueprint.scss';
import '@blueprintjs/select/lib/css/blueprint-select.css';
import '@sovryn/react-wallet/index.css';
import './styles/sass/_genesis-sale.scss';
import './styles/sass/_custom-styles.scss';
import './styles/fonts/styles.css';
// Import root app
import { App } from 'app';

import { HelmetProvider } from 'react-helmet-async';

import { store } from 'store/store';

// Initialize languages
import './locales/i18n';
// import './styles/sass/styles.scss';

const MOUNT_NODE = document.getElementById('root') as HTMLElement;

interface Props {
  Component: typeof App;
}
const ConnectedApp = ({ Component }: Props) => (
  <Provider store={store}>
    <HelmetProvider>
      <Component />
    </HelmetProvider>
  </Provider>
);
const render = (Component: typeof App) => {
  ReactDOM.render(<ConnectedApp Component={Component} />, MOUNT_NODE);
};

if (module.hot) {
  module.hot.accept(['./app', './locales/i18n'], () => {
    ReactDOM.unmountComponentAtNode(MOUNT_NODE);
    const App = require('./app').App;
    render(App);
  });
}

render(App);

serviceWorker.unregister();
