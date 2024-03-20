/**
 * Functions for calling the "Annotations" API used by Gospel Library.
 *
 * Requires host permissions on https://*.churchofjesuschrist.org
 *
 * @module
 */

import { debugRes } from './utils/debug.js';

const DownloadBatchSize = 1000;

export class LoginRequiredError extends Error {
  constructor() {
    super('You need to log into churchofjesuschrist.org');
  }
}

/**
 * @param {number} startAt The index of the first annotation to return.
 * @returns A promise resolving with a list of the user's Gospel Library annotations.
 *
 * Here is a redacted example annotation object:
 *
 * ```json
{
  "locale": "eng",
  "personId": "0000000000000000",
  "contentVersion": 6,
  "docId": "000000000",
  "note": {
    "content": "Note contents here (HTML)"
  },
  "source": "Android Gospel Library | App: 6.7.3-(673028.1335960) | OS: 31",
  "device": "android",
  "created": "2024-02-19T17:09:04.311Z",
  "annotationId": "00000000-0000-0000-0000-000000000000",
  "folders": [],
  "highlights": [
    {
      "uri": "/scriptures/dc-testament/dc/84.p103",
      "pid": "128371593",
      "color": "yellow",
      "startOffset": 25,
      "endOffset": -1
    },
    {
      "uri": "/scriptures/dc-testament/dc/84.p104",
      "pid": "128371594",
      "color": "yellow",
      "startOffset": -1,
      "endOffset": -1
    }
  ],
  "tags": [],
  "type": "highlight",
  "uri": "/scriptures/dc-testament/dc/84",
  "lastUpdated": "2024-02-19T17:10:56.681Z"
}
 * ```
 */
export async function getAnnotations(startAt = 1) {
  const res = await fetch(`https://www.churchofjesuschrist.org/notes/api/v3/annotationsWithMeta?setId=all&type=highlight&numberToReturn=${DownloadBatchSize}&start=${startAt}`, {
    headers: {
      accept: 'application/json',
    },
  });
  if (res.ok) {
    const result = await res.json();
    if ('annotations' in result) {
      return result['annotations'];
    } else {
      throw new Error(`Malformed annotations object. Keys: ${Object.keys(result)}`);
    }
  } else if (res.status === 401) {
    throw new LoginRequiredError();
  } else {
    throw new Error(`Failed to load annotations. ${await debugRes(res)}`);
  }
}

export async function getAllAnnotations() {
  let annotations = [];
  let startAt = 1;
  while (true) {
    const newAnnotations = await getAnnotations(startAt);
    if (newAnnotations.length === 0) {
      break;
    }
    annotations = annotations.concat(newAnnotations);
    startAt += newAnnotations.length;
  }
  return annotations;
}

/**
 * IMPORTANT: callers should batch the list of URIs before calling this function.
 * The API returns errors more often on bigger list sizes, and maxes out entirely at 155 or so.
 *
 * @param {string[]} uris A list of URIs to load the contents of.
 * @returns A promise resolving to the loaded contents - an object keyed by URI.
 *
 * Here is an example of a contents value:
 * ```json
{
  "content": [
    {
      "id": "p109",
      "markup": "<p class=\"verse\" data-aid=\"128371599\" id=\"p109\"><span class=\"verse-number\">109 </span>Therefore, let every man stand in his own <a class=\"study-note-ref\" href=\"#note109a\"><sup class=\"marker\">a</sup>office</a>, and <a class=\"study-note-ref\" href=\"#note109b\"><sup class=\"marker\">b</sup>labor</a> in his own calling; and let not the <a class=\"study-note-ref\" href=\"#note109c\"><sup class=\"marker\">c</sup>head</a> say unto the feet it hath no need of the feet; for without the feet how shall the body be able to stand?</p>",
      "displayId": "109"
    }
  ],
  "headline": "Doctrine and Covenants 84",
  "publication": "Doctrine and Covenants",
  "referenceURIDisplayText": "Doctrine and Covenants 84:109",
  "referenceURI": "/scriptures/dc-testament/dc/84?id=p109&lang=eng#p109",
  "type": "chapter",
  "uri": "/scriptures/dc-testament/dc/84.p109",
  "image": {},
  "idNotationUri": "/scriptures/dc-testament/dc/84?id=p109"
}
 * ```
 */
export async function getContents(uris) {
  const url = new URL('https://www.churchofjesuschrist.org/content/api/v3?lang=eng');
  for (const uri of uris) {
    url.searchParams.append('uris', uri);
  }
  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
    },
  });
  if (res.ok) {
    return await res.json();
  } else {
    // TODO examine error codes and return a more descriptive error
    throw new Error(`Failed to load contents. ${await debugRes(res)}`);
  }
}
