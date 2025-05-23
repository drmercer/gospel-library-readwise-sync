import { assembleHighlights, getContentUrisForAnnotation } from "./annotationprocessing.js";
import { LoginRequiredError, getAllAnnotations, getContents } from "./annotationsapi.js";
import { putHighlightsBatched } from "./readwise/api.js";
import { chunks } from "./utils/array.js";
import { runTests } from "./tests/runner.js";
import { cleanMd, makeReadwiseNote } from "./readwise/processing.js";

const [output] = document.querySelectorAll('pre');
const [sync, changeReadwiseToken, clearCache, resetLastSync, createTestCase, runTestsBtn] = document.querySelectorAll('button');

const ContentsCacheKey = 'CachedContents'
const ReadwiseTokenKey = 'ReadwiseToken'
const LastSyncTimeKey = 'LastSyncTime'

let annotations = [];
const contents = JSON.parse(localStorage.getItem(ContentsCacheKey) || '{}');
let highlights = [];

const rawLastSyncTime = localStorage.getItem(LastSyncTimeKey);
let lastSyncTime = rawLastSyncTime ? new Date(rawLastSyncTime) : undefined;

output.textContent = 'Hello, world!';
sync.onclick = async () => {
  output.textContent = '';
  try {
    println(`Downloading highlights...`);
    annotations = await getAllAnnotations();
    println(`Downloaded ${annotations.length} highlights.`);
    await fetchContents(annotations);
    highlights = assembleHighlights(annotations, contents);
    if (highlights.length < annotations.length) {
      println(`WARNING: ${annotations.length - highlights.length} highlights had errors and cannot be synced. (Sometimes this happens when content is moved in Gospel Library. 😢)`);
    }

    // Uncomment for debugging
    // if (window) return println(highlights);
  } catch (err) {
    if (err instanceof LoginRequiredError) {
      println('Please login to ChurchofJesusChrist.org first. (Click the "My Gospel Library Notes" link below.)');
    } else {
      console.error('Failed to download highlights', err);
      println('Failed to download highlights', String(err));
    }
    return;
  }
  if (!highlights.length) {
    println('No highlights found!');
    return;
  }
  try {
    const hs = highlights.filter(h => {
      return !lastSyncTime || h.updated > lastSyncTime;
    });
    if (!hs.length) {
      println(`No highlights have changed since last sync (${lastSyncTime.toLocaleString()})`);
      return;
    }
    println(`Syncing ${hs.length} highlights to readwise...`);
    const accessToken = getReadwiseAccessToken();

    /** @type {(import('./readwise/api.js').Highlight)[]} */
    const readwiseHighlights = hs.map(h => ({
      highlighted_at: h.created.toISOString(),
      highlight_url: 'https://www.churchofjesuschrist.org/notes?lang=eng&note=' + encodeURIComponent(h.id),
      text: cleanMd(h.highlightMd),
      source_url: h.source?.url,
      author: h.source?.author,
      title: h.source?.title,
      source_type: h.source?.type,
      note: makeReadwiseNote(h.noteMd, h.tags),
    }))

    // Uncomment for debugging
    // if (window) return println(readwiseHighlights);

    println(`Uploading ${readwiseHighlights.length} highlights to Readwise.`);
    const result = await putHighlightsBatched(accessToken, readwiseHighlights, println)
    println('Successfully uploaded! Click the "My Readwise Library" link below to check out your new highlights.')
    lastSyncTime = new Date();
    localStorage.setItem(LastSyncTimeKey, lastSyncTime.toISOString());

    // Uncomment for debugging
    // println('Response:', result);
  } catch (err) {
    console.error('Failed to upload highlights', err);
    println('Failed to upload highlights', String(err));
  }
}

// Configuration

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
resetLastSync.onclick = () => {
  output.textContent = '';
  localStorage.removeItem(LastSyncTimeKey);
  lastSyncTime = undefined;
  println(`Cleared last sync time`);
}

// Tests

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
