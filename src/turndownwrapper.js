/**
 * A module wrapping the (global) Turndown utilities. Requires deps/turndown.js to be loaded.
 *
 * @module
 */

// we include the spaces here so that each footnote will count as a separate word
// (lol one day this will show up in an actual highlight and this will break)
export const FootnotePlaceholder = ' 🦶 ';

export function htmlToMarkdownWithFootnotePlaceholders(html) {
  const td = new TurndownService();
  // filter out <sup> tags
  td.addRule('no-sups', {
    filter: 'sup',
    replacement: () => FootnotePlaceholder,
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

export function withoutFootnotePlaceholders(md) {
  // we have to be lenient here in case the footnote is at the beginning or end of a highlight,
  // in which case it will be missing its leading or trailing space respectively.
  // TODO this will cause problems if a footnote is like this<sup>1</sup>, with non-space characters
  // on both sides, because it'll get replaced with a space in the result: "like this ,". Fortunately,
  // most uses of footnotes don't seem to do that
  return md.replaceAll(/ *🦶 */g, ' ');
}
