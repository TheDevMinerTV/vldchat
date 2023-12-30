/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';
import './index.css';
import './lib/veilid';

const root = document.getElementById('root');

render(() => <App />, root!);
