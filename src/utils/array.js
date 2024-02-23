export function* chunks(array, maxChunkSize) {
  for (let i = 0; i < array.length; i += maxChunkSize) {
    yield array.slice(i, i + maxChunkSize);
  }
}
