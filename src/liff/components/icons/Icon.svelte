<svg
  viewBox={`0 0 ${viewBoxDimensions[0]} ${viewBoxDimensions[1]}`}
  width={width || viewBoxDimensions[0]}
  height={height || viewBoxDimensions[1]}
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  {...$$restProps}
>
  <slot />
</svg>

<style>
  svg {
    /* https://github.com/mui-org/material-ui/blob/next/packages/material-ui/src/SvgIcon/SvgIcon.js */
    flex-shrink: 0;
    user-select: none;
  }
</style>

<script>
  /** viewbox width and height, also sets default width and height */
  export let viewBoxDimensions = [24, 24];
  export let width;
  export let height;
</script>