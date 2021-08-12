<script>
  import { Meta, Story } from "@storybook/addon-svelte-csf";
  import FullpagePrompt from "./FullpagePrompt.svelte";
</script>

<Meta
  title="FullpagePrompt"
  component={FullpagePrompt}
  args={{
    children: "Texts here are centered at page",
  }}
/>

<Story name="Default" let:args>
  <!-- Simulates <body>, which is a column flexbox -->
  <div style="display: flex; flex-flow: column; height: 100vh">
    <FullpagePrompt>{args.children}</FullpagePrompt>
  </div>
</Story>
