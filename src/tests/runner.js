import { assembleHighlights } from '../annotationprocessing.js';
import { testCases } from './cases.js';

export function runTests(log, contents) {
  let failures = 0;
  for (const [index, [input, expectedOutput]] of testCases.entries()) {
    const [actualOutput] = assembleHighlights([input], contents);
    const actualStr = JSON.stringify(actualOutput);
    const expectedStr = JSON.stringify(expectedOutput);
    if (actualStr != expectedStr) {
      failures++;
      log(`Test case #${index + 1} failed. Expected\n`, expectedStr, '\nbut was\n', actualStr);
      log(`Diff: ${diff(actualStr, expectedStr)}`);
    }
  }
  log(`Done running ${testCases.length} tests. ${failures} failures.`);
}

/**
 * Returns a human-readable diff between two strings. Shows both strings with [] around the spans that are different.
 */
function diff(strA, strB) {
  const diff = [];
  let i = 0;
  while (i < strA.length || i < strB.length) {
    if (strA[i] != strB[i]) {
      debugger;
      diff.push(`[${strA[i]}]`);
    } else {
      diff.push(strA[i]);
    }
    i++;
  }
  return diff.join('');
}
