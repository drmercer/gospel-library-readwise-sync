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

function assembleHighlights(annotations, contents) {
  return annotations.map(a => {
    const highlights = a?.highlights ?? [];
    const contentObjs = highlights.map(h => contents[h.uri]);
    const locationUri = contentObjs[0] ? 'https://www.churchofjesuschrist.org/study' + contentObjs[0].referenceURI : undefined;
    const contentsText = contentObjs
      .flatMap(c => c.content)
      .map(c => c.markup)
      .map(htmlToMarkdown)
      .join('\n\n');
    const highlightStart = highlights[0]?.startOffset;
    const highlightEnd = highlights[highlights.length - 1]?.endOffset;
    return {
      locationUri,
      contentsText,
      highlightStart,
      highlightEnd,
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
