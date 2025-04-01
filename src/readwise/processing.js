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

export function cleanMd(md) {
  return (
    md
      // Readwise incorrectly handles links like ([this](foo)) - it thinks the paren is part of the link. So we fix it by adding a space before the second paren.
      .replace(/\)\)/g, ') )')
      // It also doesn't handle escapes like \[ or \], so we just remove the backslashes
      .replace(/\\\]\(/g, '] (')
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
  );
}
