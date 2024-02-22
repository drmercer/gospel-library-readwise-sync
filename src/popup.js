import { getAnnotations, getContents } from "./annotationsapi.js";
import { htmlToMarkdown } from "./turndownwrapper.js";

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

// words can be split by spaces or dashes
// TODO if any other word separators are discovered, add them here
const SeparatorRegex = /(\s+|—|-)/g;

function assembleHighlights(annotations, contents) {
  return annotations.map(a => {
    const highlights = a?.highlights ?? [];
    const contentObjs = highlights.map(h => contents[h.uri]);
    const locationUri = contentObjs[0] ? 'https://www.churchofjesuschrist.org/study' + contentObjs[0].referenceURI : undefined;
    const mdParts = contentObjs
      .flatMap(c => c.content)
      .map(c => c.markup)
      .map(htmlToMarkdown);
    const fullMd = mdParts
      .join('\n\n');
    const highlightStart = highlights[0]?.startOffset;
    const highlightEnd = highlights[highlights.length - 1]?.endOffset;
    const highlightMd = mdParts.map((part, i) => {
      const h = highlights[i];
      // highlights are stored as word offsets in the passage (or -1 for the start or end)
      // TODO the offsets count footnotes as words... but we filter out the footnotes before this point... how to fix
      const startOffset = Math.max(h.startOffset - 1, 0); // h.startOffset is 1-indexed
      const endOffset = h.endOffset == -1 ? Number.POSITIVE_INFINITY : h.endOffset;
      // split by words (keeping the separators because of the capturing group)
      const parts = part.split(SeparatorRegex);
      let offset = 0;
      let j = 0;
      while (offset < startOffset) {
        const p = parts[j++];
        if (p.match(SeparatorRegex)?.[0] !== p) {
          // only count it if it's not a separator
          offset++;
        }
      }
      const startIndex = j;
      while (offset < endOffset && j < parts.length) {
        const p = parts[j++];
        if (p.match(SeparatorRegex)?.[0] !== p) {
          // only count it if it's not a separator
          offset++;
        }
      }
      const endIndex = j;
      const highlightPart = parts.slice(startIndex, endIndex).join('').trim();
      return highlightPart;
    }).join('\n\n');
    return {
      locationUri,
      highlightStart,
      highlightEnd,
      fullMd,
      highlightMd,
    }
  })
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
