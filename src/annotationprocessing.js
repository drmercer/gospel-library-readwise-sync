import { turndown } from "./turndownwrapper.js";

// words can be split by spaces or dashes. The 🌌 is placed around links by htmlToMarkdownWithPlaceholders() to
// ensure they count as separate words.
// NOTE: the capturing group is important, it lets us split on this regex and keep the separators in the resulting array
// TODO if any other word separators are discovered, add them here
const SeparatorRegex = /([🌌\s—–-]+)/g;

export function assembleHighlights(annotations, contents) {
  return annotations.map(a => {
    const highlights = a?.highlights ?? [];
    const contentObjs = highlights.map(h => contents[h.uri]);
    const locationUri = contentObjs[0] ? 'https://www.churchofjesuschrist.org/study' + contentObjs[0].referenceURI : undefined;
    const mdParts = contentObjs
      .flatMap(c => c.content)
      .map(c => c.markup)
      .map(htmlToMarkdownWithPlaceholders);
    const fullMd = mdParts
      .map(withoutPlaceholders)
      .join('\n\n');
    const highlightMd = mdParts.map((part, i) => {
      const h = highlights[i];
      // highlights are stored as word offsets in the passage (or -1 for the start or end)
      const startOffset = Math.max(h.startOffset - 1, 0); // h.startOffset is 1-indexed
      const endOffset = h.endOffset == -1 ? Number.POSITIVE_INFINITY : h.endOffset;
      // split by words (keeping the separators because of the capturing group)
      const parts = part.split(SeparatorRegex);
      const startIndex = wordOffsetToIndex(parts, startOffset);
      const endIndex = wordOffsetToIndex(parts, endOffset, startIndex, startOffset);
      const highlightPart = parts.slice(startIndex, endIndex).join('');
      return highlightPart;
    })
      .map(withoutPlaceholders)
      .map(s => s.trim())
      .join('\n\n');
    return {
      locationUri,
      fullMd,
      highlightMd,
    }
  })
}

function wordOffsetToIndex(wordsAndSeparators, wordOffset, initialIndex = 0, initialOffset = 0) {
  let offset = initialOffset;
  let index = initialIndex;
  let inLink = false;
  while (offset < wordOffset && index < wordsAndSeparators.length) {
    const p = wordsAndSeparators[index++];
    if (!inLink && p.match(SeparatorRegex)?.[0] !== p) {
      // only count it if it's not a separator
      offset++;
    }
    // don't count link URLs as multiple words
    if (p.includes('](')) {
      inLink = true;
    }
    if (inLink && p.includes(')')) {
      inLink = false;
    }
  }
  return index;
}

function htmlToMarkdownWithPlaceholders(html) {
  return turndown(html, {
    // filter out <sup> tags
    // we include a 🦶 placeholder here (filtered out later) with separators around it so that
    // each footnote will count as a separate word
    // (lol one day this will show up in an actual highlight and this will break)
    'no-sups': {
      filter: 'sup',
      replacement: () => '🌌🦶🌌',
    },
    // filter out footnote links
    'no-footnote-links': {
      filter: (node) => {
        return (
          node.nodeName === 'A' &&
          node.getAttribute('href')?.startsWith('#')
        )
      },
      replacement: (content) => content,
    },
    // for other links, add a fake word separator at the end because that's how word counting works
    'add-fake-word-separator-after-links': {
      filter: (node) => {
        return (
          node.nodeName === 'A' &&
          !!node.getAttribute('href') &&
          !node.getAttribute('href')?.startsWith('#')
        )
      },
      replacement: (content, node) => `🌌[${content}](${node.getAttribute('href')})🌌`,
    }
  });
}

function withoutPlaceholders(md) {
  const cleaned = md
    .replaceAll('🦶', '')
    .replaceAll('🌌', '')
  return cleaned
}
