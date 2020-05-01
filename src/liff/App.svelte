<script>
	import Button from '@smui/button';
	import Textfield from '@smui/textfield';
	import { t } from 'ttag';

  export let moreUrl = 'http://ttag.js.org';
	export let translated = t`world`;
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1 title={t`This is title`}>{t`Hello ${translated} !`}</h1>
<p>{@html t`Click <a href=${moreUrl}>here</a> for more info.`}</p>
<Button>Primary</Button>
<Button color="secondary">Secondary</Button>
<Button variant="raised">Primary</Button>
<Button color="secondary" variant="raised">Secondary</Button>
