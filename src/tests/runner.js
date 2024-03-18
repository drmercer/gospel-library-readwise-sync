import { assembleHighlights } from '../annotationprocessing.js';
import { testCases } from './cases.js';

export function runTests(log, contents) {
  for (const [index, [input, expectedOutput]] of testCases.entries()) {
    const [actualOutput] = assembleHighlights([input], contents);
    if (JSON.stringify(actualOutput) != JSON.stringify(expectedOutput)) {
      log(`Test case #${index + 1} failed. Expected\n`, JSON.stringify(expectedOutput), '\nbut was\n', JSON.stringify(actualOutput));
    }
  }
  log(`Done running ${testCases.length} tests`);
}
