<script>
  import { Meta, Story } from "@storybook/addon-svelte-csf";
  import Terms from "./Terms.svelte";
</script>

<Meta
  title="Terms"
  component={Terms}
/>

<Story name="Default" let:args>
  <Terms  />
</Story>
