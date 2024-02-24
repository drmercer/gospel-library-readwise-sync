import { turndown } from "./turndownwrapper.js";

// words can be split by spaces or dashes. The 🌌 is placed around links by htmlToMarkdownWithPlaceholders() to
// ensure they count as separate words.
// NOTE: the capturing group is important, it lets us split on this regex and keep the separators in the resulting array
// TODO if any other word separators are discovered, add them here
const SeparatorRegex = /([🌌\s—–-]+)/g;

export function assembleHighlights(annotations, contents) {
  return annotations.map(a => {
    try {
      const highlights = a?.highlights ?? [];
      const contentObjs = highlights.map(h => {
        const c = contents[h.uri];
        if (!c) {
          console.error(`Missing contents for URI '${h.uri}'`, contents);
          throw new Error(`Missing contents for URI '${h.uri}'`)
        }
        return c
      });
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
        const endIndex = wordOffsetToIndex(parts, endOffset);
        const highlightPart = parts.slice(startIndex, endIndex).join('');
        return highlightPart;
      })
        .map(withoutPlaceholders)
        .map(s => s.trim())
        .join('\n\n');
      const noteMd = a.note?.content ? noteToMarkdown(a.note.content) : undefined;
      return {
        locationUri,
        fullMd,
        highlightMd,
        noteMd,
      }
    } catch (err) {
      // possibly a missing URI, if content was moved. Not sure how to recover from that. (😢)
      const uri = a.uri ?? a.highlights?.[0]?.uri ?? 'unknown'
      console.error(`Failed to assemble highlight on ${uri}`, a, err);
      return undefined;
    }
  }).filter(h => !!h) // filter out errors
}

function wordOffsetToIndex(wordsAndSeparators, wordOffset) {
  let offset = 0;
  let index = 0;
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
    // for links, add fake word separators around them, because that's how word counting works.
    // also filter out footnote links
    'add-fake-word-separator-after-links': {
      filter: 'a',
      replacement: (content, node) => {
        const href = node.getAttribute('href');
        const isFootnote = href?.startsWith('#');
        const md = (isFootnote || !href) ? content : `[${content}](${href})`;
        return `🌌${md}🌌`;
      },
    }
  });
}

function withoutPlaceholders(md) {
  const cleaned = md
    .replaceAll('🦶', '')
    .replaceAll('🌌', '')
  return cleaned
}

function noteToMarkdown(noteHtml) {
  return turndown(noteHtml)
    .replace(/\n\s+\n/g, '\n\n') // remove extra blank lines
}
