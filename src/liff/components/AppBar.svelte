<script>
  import logo from '../assets/logo.svg';
</script>

<style>
  header {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    background: #fff;
    border-bottom: 2px solid var(--secondary50);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .logo {
    margin-right: auto;
  }
</style>

<header>
  <img class="logo" src={logo} alt="Cofacts 真的假的" />
  <slot />
</header>