import 'core-js';
import 'normalize.css';
import './index.css';
import { isDuringLiffRedirect } from './lib';
import App from './App.svelte';

liff.init({ liffId: LIFF_ID }).then(() => {
  // liff.init should have corrected the path now, don't initialize app and just wait...
  // Ref: https://www.facebook.com/groups/linebot/permalink/2380490388948200/?comment_id=2380868955577010
  if (isDuringLiffRedirect) return;

  document.getElementById('loading').remove(); // Cleanup loading

  // For devs (and users on LINE desktop, which is rare)
  if (!liff.isLoggedIn()) {
    liff.login({
      // https://github.com/line/line-liff-v2-starter/issues/4
      redirectUri: location.href,
    });
  } else {
    const userId = liff.getDecodedIDToken().sub;
    dataLayer.push({ userId });

    const params = new URLSearchParams(location.search);
    if (params.get('p') === 'mgp') {
      // Replace login with survey
      window.location.href = `https://www.surveycake.com/s/eqNpB?ssn0=${userId}&ssn58=cofacts&openExternalBrowser=1`;
      return;
    }

    // Kickstart app loading; fire assertions
    new App({ target: document.body });
  }
});
