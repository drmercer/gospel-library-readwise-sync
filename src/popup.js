import { getAnnotations, getContents } from "./annotationsapi.js";
import { htmlToMarkdownWithPlaceholders, withoutPlaceholders } from "./turndownwrapper.js";

const [output] = document.querySelectorAll('pre');
const [check, sync, clearCache] = document.querySelectorAll('button');

let lastUpdatedTime = new Date("2023-01-01T00:00:00.000Z")

const CacheKey = 'Cache'

output.textContent = 'Hello, world!';
check.onclick = async () => {
  output.textContent = '';
  try {
    if (!localStorage.getItem(CacheKey)) {
      println(`Loading annotations...`);
      const annotations = await getAnnotations();
      const annotationsToSync = annotations.filter(a => {
        return new Date(a.lastUpdated) > lastUpdatedTime;
      })
      const uris = getAllHighlightUris(annotationsToSync);
      println(`Loading contents for ${uris.length} URIs...`);
      const contents = await getContents(uris, println);
      localStorage.setItem(CacheKey, JSON.stringify({
        annotationsToSync,
        contents,
      }));
    } else {
      println(`Using cached data`);
    }
    const {
      annotationsToSync,
      contents,
    } = JSON.parse(localStorage.getItem(CacheKey));
    println(`Assembling highlights...`);
    const highlights = assembleHighlights(annotationsToSync, contents);
    println(highlights);
  } catch (err) {
    println('Failed to check annotations', String(err));
  }
}
sync.onclick = () => {
  output.textContent = '';
  println('TODO sync');
}
clearCache.onclick = () => {
  output.textContent = '';
  localStorage.removeItem(CacheKey);
  println(`Cleared cache`);
}

function getAllHighlightUris(annotations) {
  return annotations
    .flatMap(a => a?.highlights ?? [])
    .map(h => h.uri);
}

// words can be split by spaces or dashes. The 🌌 is placed around links by htmlToMarkdownWithPlaceholders() to
// ensure they count as separate words.
// NOTE: the capturing group is important, it lets us split on this regex and keep the separators in the resulting array
// TODO if any other word separators are discovered, add them here
const SeparatorRegex = /([🌌\s—–-]+)/g;

function assembleHighlights(annotations, contents) {
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
    const highlightStart = highlights[0]?.startOffset;
    const highlightEnd = highlights[highlights.length - 1]?.endOffset;
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

function prettyPrint(x) {
  return JSON.stringify(x, null, 2);
}

function println(...xs) {
  for (const x of xs) {
    const val = typeof x === 'string' ? x : prettyPrint(x);
    output.textContent += val + ' ';
  }
  output.textContent += '\n';
}
