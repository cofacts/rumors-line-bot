import 'normalize.css';
import './index.css';
import Redirect from './Redirect.svelte';

new Redirect({ target: document.body });
document.getElementById('loading').remove();
