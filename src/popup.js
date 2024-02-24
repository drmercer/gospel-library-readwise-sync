import { assembleHighlights } from "./annotationprocessing.js";
import { getAnnotations, getContents } from "./annotationsapi.js";

const [output] = document.querySelectorAll('pre');
const [check, sync, clearCache] = document.querySelectorAll('button');

const ContentsCacheKey = 'CachedContents'

output.textContent = 'Hello, world!';
check.onclick = async () => {
  output.textContent = '';
  try {
    println(`Loading annotations...`);
    const annotations = (await getAnnotations()).slice(100);
    // TODO fetch contents for any new annotations (store last updated time)
    if (!localStorage.getItem(ContentsCacheKey)) {
      const uris = getAllHighlightUris(annotations);
      println(`Loading contents for ${uris.length} URIs...`);
      const contents = await getContents(uris, println);
      localStorage.setItem(ContentsCacheKey, JSON.stringify(contents));
    } else {
      println(`Using cached contents data`);
    }
    const contents = JSON.parse(localStorage.getItem(ContentsCacheKey));
    println(`Assembling highlights...`);
    const highlights = assembleHighlights(annotations, contents);
    println(highlights);
  } catch (err) {
    console.error('Failed to check annotations', err);
    println('Failed to check annotations', String(err));
  }
}
sync.onclick = () => {
  output.textContent = '';
  println('TODO sync');
}
clearCache.onclick = () => {
  output.textContent = '';
  localStorage.removeItem(ContentsCacheKey);
  println(`Cleared cached contents data`);
}

function getAllHighlightUris(annotations) {
  return annotations
    .flatMap(a => a?.highlights ?? [])
    .map(h => h.uri);
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
