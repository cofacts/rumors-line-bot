import 'core-js';
import 'normalize.css';
import './index.scss';
import App from './App.svelte';

const params = new URLSearchParams(location.search);
const target = document.body;
target.innerHTML = ''; // Cleanup loading

const app = new App({
  target,
  props: {
    landing: params.get('p'),
    token: params.get('token'),
  },
});

window.app = app;

export default app;
