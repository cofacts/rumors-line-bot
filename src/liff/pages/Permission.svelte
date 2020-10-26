<script>
  import { onMount } from 'svelte';
  import { assertInClient } from '../lib';

  onMount(async () => {
    assertInClient();
    liff.closeWindow();
  });
</script>