/**
 * Functions for calling the "Annotations" API used by Gospel Library.
 *
 * Requires host permissions on https://*.churchofjesuschrist.org
 *
 * @module
 */

/**
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
export async function getAnnotations() {
  const res = await fetch('https://www.churchofjesuschrist.org/notes/api/v3/annotationsWithMeta?setId=all&type=highlight&numberToReturn=1000', {
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
  } else {
    // TODO examine error codes and return a more descriptive error
    throw new Error(`Failed to load annotations. ${await debugRes(res)}`);
  }
}

/**
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
export async function getContents(uris, log) {
  const BatchSize = 20; // seems to max out at 155, strangely, but we use a smaller number to be a good citizen
  let remaining = [...new Set(uris)]; // filter out duplicates
  let i = 1;
  const result = {};
  while (remaining.length > 0) {
    const batch = remaining.splice(0, BatchSize); // remove [BatchSize] elements from the front of the array

    log?.(`Getting contents of batch ${i++}, size ${batch.length}...`);
    const batchResult = await getContentsInner(batch);
    Object.assign(result, batchResult);

    if (remaining.length > 0) {
      // add a delay between requests to be a good citizen
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return result;
}

async function getContentsInner(uris) {
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

async function debugRes(res) {
  let txt = `Status: ${res.status}`;
  try {
    txt += ` Text: ${await res.text()}`;
  } catch { }
  txt += ` URL: ${res.url}`
  return txt;
}
