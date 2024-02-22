/**
 * A module wrapping the (global) Turndown utilities. Requires deps/turndown.js to be loaded.
 *
 * @module
 */

export function turndown(html, rules) {
  const td = new TurndownService();
  for (const [ruleName, rule] of Object.entries(rules)) {
    td.addRule(ruleName, rule);
  }
  return td.turndown(html);
}
