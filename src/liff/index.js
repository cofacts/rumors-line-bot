import 'core-js';
import 'normalize.css';
import './index.scss';
import App from './App.svelte';

const target = document.body;
target.innerHTML = ''; // Cleanup loading

const app = new App({ target });

export default app;
