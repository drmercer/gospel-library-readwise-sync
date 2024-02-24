
/**
 * @param {Response} res
 * @returns {Promise<string>}
 */
export async function debugRes(res) {
  let txt = `Status: ${res.status}`;
  try {
    txt += ` Text: ${await res.text()}`;
  } catch { }
  txt += ` URL: ${res.url}`
  return txt;
}
