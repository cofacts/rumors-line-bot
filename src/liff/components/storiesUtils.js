/**
 * In storybooks, it converts args to style string to demonstrate customizable styles
 * for this component.
 *
 * @param {object} args - args in storybook
 * @returns {string} a HTML style attribute string
 */
export function argsToStyle(args) {
  return Object.entries(args)
    .map(([key, value]) => value && `${key}: ${value};`)
    .filter(s => s)
    .join('');
}
