/**
 * A module wrapping the (global) Turndown utilities. Requires deps/turndown.js to be loaded.
 *
 * @module
 */

export function turndown(html, rules = {}, options = {}) {
  const td = new TurndownService(options);
  for (const [ruleName, rule] of Object.entries(rules)) {
    td.addRule(ruleName, rule);
  }
  return td.turndown(html);
}
