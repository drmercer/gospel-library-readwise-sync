import { assembleHighlights, getContentUrisForAnnotation } from "./annotationprocessing.js";
import { getAnnotations, getContents } from "./annotationsapi.js";
import { putHighlights } from "./readwise/api.js";
import { chunks } from "./utils/array.js";
import { runTests } from "./tests/runner.js";

const [output] = document.querySelectorAll('pre');
const [download, upload, changeReadwiseToken, clearCache, createTestCase, runTestsBtn] = document.querySelectorAll('button');

const ContentsCacheKey = 'CachedContents'
const ReadwiseTokenKey = 'ReadwiseToken'

let annotations = [];
const contents = JSON.parse(localStorage.getItem(ContentsCacheKey) || '{}');
let highlights = [];

output.textContent = 'Hello, world!';
download.onclick = async () => {
  output.textContent = '';
  try {
    println(`Downloading highlights...`);
    annotations = (await getAnnotations()).slice(100);
    await fetchContents(annotations);
    println(`Assembling highlights...`);
    highlights = assembleHighlights(annotations, contents);
    println(highlights);
  } catch (err) {
    console.error('Failed to download highlights', err);
    println('Failed to download highlights', String(err));
  }
}
upload.onclick = async () => {
  output.textContent = '';
  try {
    const hs = highlights.slice(0, 10);
    if (!hs.length) {
      println('No highlights to upload!');
      return;
    }
    println(`Syncing ${hs.length} highlights to readwise...`);
    const accessToken = getReadwiseAccessToken();
    const result = await putHighlights(accessToken, hs.map(h => ({
      highlight_url: 'https://glsync.danmercer.net/annotation/' + encodeURIComponent(h.id), // this lets us dedupe by annotation ID
      text: h.highlightMd,
      source_url: h.source?.url,
      author: h.source?.author,
      title: h.source?.title,
      note: h.noteMd,
    })))
    println('Successfully uploaded! See https://readwise.io/library')
    println('Response:', result);
  } catch (err) {
    console.error('Failed to upload highlights', err);
    println('Failed to upload highlights', String(err));
  }
}
changeReadwiseToken.onclick = () => {
  promptForReadwiseToken();
}
clearCache.onclick = () => {
  output.textContent = '';
  if (!confirm('Are you sure? This is only needed if the contents object is corrupted.')) {
    println('Nothing doing!');
    return;
  }
  localStorage.removeItem(ContentsCacheKey);
  println(`Cleared cached contents data`);
}
createTestCase.onclick = () => {
  output.textContent = '';
  println('Creating test case...');
  const search = prompt('Annotation query:');
  if (!search) {
    println('Canceled');
  } else {
    try {
      const a = annotations.find(a => {
        return !!getContentUrisForAnnotation(a).find(uri => uri.includes(search));
      });
      if (!a) {
        debugger;
        throw new Error(`No annotation found with URI containing ${search}`);
      }
      const [h] = assembleHighlights([a], contents);
      const testCase = [a, h];
      println(testCase);
    } catch (err) {
      console.error('Failed to create test case', err);
      println('Failed to create test case', String(err));
    }
  }
}
runTestsBtn.onclick = () => {
  output.textContent = '';
  try {
    runTests(println, contents);
  } catch (err) {
    console.error('Failed to run tests', err);
    println('Failed to run tests', String(err));
  }
}

async function fetchContents(annotations) {
  // first, load any cached contents
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

    println(`Getting source texts (batch ${i++}, size ${batch.length})...`);
    const batchResult = await getContents(batch);
    // update object and cache
    Object.assign(contents, batchResult);
    localStorage.setItem(ContentsCacheKey, JSON.stringify(contents));
  }
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

function getReadwiseAccessToken() {
  if (!localStorage.getItem(ReadwiseTokenKey)) {
    promptForReadwiseToken();
  }
  return localStorage.getItem(ReadwiseTokenKey);
}

function promptForReadwiseToken() {
  const token = prompt('Enter your Readwise access token');
  localStorage.setItem(ReadwiseTokenKey, token);
}
