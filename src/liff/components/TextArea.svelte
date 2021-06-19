<style>
  textarea {
    border: 0;
    padding: 8px;
    background: var(--secondary50);
    color: var(--secondary500);
    transition: background-color 0.2s;
    font-size: inherit;
    border-radius: 8px;
  }

  textarea::placeholder {
    color: var(--secondary200);
  }

  textarea:focus {
    background: #fff;
    outline: 0;
  }
</style>

<textarea {...$$restProps} />
