/**
 * Adds all tags in a new line at the foot of the note, like
 *
 * ```
 * my note
 *
 * .gl .gl/tag1 .gl/tag2 .gl/tag3_with_words_separated_by_underscores
 * ```
 *
 * @param {string} noteMd
 * @param {string[]} tags
 * @returns {string}
 */
export function makeReadwiseNote(noteMd = '', tags = []) {
  return (
    tags.map(tag => {
      const cleanedTag = tag.replace(/\s+/g, '_').toLowerCase();
      return `.gl/${cleanedTag}`;
    }).concat(['.gl']).join(' ') + '\n\n' + noteMd
  ).trim();
}
