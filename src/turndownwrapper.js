/**
 * A module wrapping the (global) Turndown utilities. Requires deps/turndown.js to be loaded.
 *
 * @module
 */

// we include the spaces here so that each footnote will count as a separate word
// (lol one day this will show up in an actual highlight and this will break)
export const FootnotePlaceholder = ' 🦶 ';

export function htmlToMarkdownWithPlaceholders(html) {
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
  // for other links, add a fake word separator at the end because that's how word counting works
  td.addRule('add-fake-word-separator-after-links', {
    filter: (node) => {
      return (
        node.nodeName === 'A' &&
        !!node.getAttribute('href') &&
        !node.getAttribute('href')?.startsWith('#')
      )
    },
    replacement: (content, node) => `🌌[${content}](${node.getAttribute('href')})🌌`,
  })
  return td.turndown(html);
}

export function withoutPlaceholders(md) {
  // we have to be lenient here in case the footnote is at the beginning or end of a highlight,
  // in which case it will be missing its leading or trailing space respectively.
  // TODO this will cause problems if a footnote is like this<sup>1</sup>, with non-space characters
  // on both sides, because it'll get replaced with a space in the result: "like this ,". Fortunately,
  // most uses of footnotes don't seem to do that
  const cleaned = md
    .replaceAll(/ *🦶 */g, ' ')
    .replaceAll('🌌',)
  return cleaned
}
