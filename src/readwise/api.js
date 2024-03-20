/**
 * @module Functions for calling Readwise's API
 *
 * @see https://readwise.io/api_deets
 */

import { chunks } from '../utils/array.js';
import { debugRes } from '../utils/debug.js';

/**
 * A highlight object
 * @typedef {object} Highlight
 * @property {string} highlight_url
 * @property {string} text
 * @property {string} title
 * @property {string} author
 * @property {string} source_url
 * @property {'books'|'articles'|'tweets'|'podcasts'} source_type
 * @property {string} note
 * @property {number} location
 * @property {string} highlighted_at
 */

/**
 * Uploads the given highlights to Readwise
 * @param {Highlight[]} highlights
 */
export async function putHighlights(token, highlights) {
  const res = await fetch('https://readwise.io/api/v2/highlights/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      highlights,
    })
  });
  if (!res.ok) {
    throw new Error(`Unexpected error from "put highlights" request. ${await debugRes(res)}`);
  }
  return await res.json();
}


/**
 * Uploads the given highlights to Readwise
 * @param {Highlight[]} highlights
 */
export async function putHighlightsBatched(token, highlights, log) {
  const BatchSize = 100;
  const chunkCount = Math.ceil(highlights.length / BatchSize);
  let i = 1; // for logging
  let first = true;
  let results = [];
  for (const batch of chunks(highlights, BatchSize)) {
    if (!first) {
      // add a delay between requests to be a good citizen
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      first = false;
    }

    log?.(`Uploading highlights (batch ${i++}/${chunkCount})...`);
    const result = await putHighlights(token, batch);
    results.push(result);
  }
  return results;
}
