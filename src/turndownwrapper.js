/**
 * A module wrapping the (global) Turndown utilities. Requires deps/turndown.js to be loaded.
 *
 * @module
 */

export function htmlToMarkdown(html) {
  const td = new TurndownService();
  // filter out <sup> tags
  td.addRule('no-sups', {
    filter: 'sup',
    replacement: () => '',
  })
  // filter out footnote links
  td.addRule('no-sups', {
    filter: (node) => {
      return (
        node.nodeName === 'A' &&
        node.getAttribute('href')?.startsWith('#')
      )
    },
    replacement: (content) => content,
  })
  return td.turndown(html);
}
