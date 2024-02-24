import { assembleHighlights } from "./annotationprocessing.js";
import { getAnnotations, getContents } from "./annotationsapi.js";
import { chunks } from "./utils/array.js";

const [output] = document.querySelectorAll('pre');
const [check, sync, clearCache] = document.querySelectorAll('button');

const ContentsCacheKey = 'CachedContents'

output.textContent = 'Hello, world!';
check.onclick = async () => {
  output.textContent = '';
  try {
    println(`Loading annotations...`);
    const annotations = (await getAnnotations()).slice(100);
    const contents = await fetchContents(annotations);
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

async function fetchContents(annotations) {
  // first, load any cached contents
  const contents = JSON.parse(localStorage.getItem(ContentsCacheKey) || '{}');
  const newUris = annotations
    .flatMap(a => a?.highlights ?? [])
    .map(h => h.uri)
    .filter(uri => !contents[uri]);
  const urisToFetch = [...new Set(newUris)]; // filter out duplicates

  // load the contents in batches, updating the cache in localStorage after each batch
  // (in case something goes wrong before finishing all the batches)

  const BatchSize = 50; // seems to max out at 155, strangely, but we use a smaller number to be a good citizen
  let i = 1; // for logging
  let first = true;
  // use new Set(...) to filter out duplicates
  for (const batch of chunks(urisToFetch, BatchSize)) {
    if (!first) {
      // add a delay between requests to be a good citizen
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      first = false;
    }

    println(`Getting contents of batch ${i++}, size ${batch.length}...`);
    const batchResult = await getContents(batch);
    // update object and cache
    Object.assign(contents, batchResult);
    localStorage.setItem(ContentsCacheKey, JSON.stringify(contents));
  }

  return contents;
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
