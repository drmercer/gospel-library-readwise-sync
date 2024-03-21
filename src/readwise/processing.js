/**
 * Adds all tags in a new line at the foot of the note, like
 *
 * ```
 * my note
 *
 * .gl .gl_tag1 .gl_tag2 .gl_tag3_with_words_separated_by_underscores
 * ```
 *
 * @param {string} noteMd
 * @param {string[]} tags
 * @returns {string}
 */
export function makeReadwiseNote(noteMd = '', tags = []) {
  return (
    tags.map(cleanTag).concat(['.gl']).join(' ') + '\n\n' + noteMd
  ).trim();
}

export function cleanTag(tag) {
  const cleanedTag = tag.replace(/[\s.]+/g, '_').toLowerCase();
  return `.gl_${cleanedTag}`;
}
