// simple-mpa/app/model/event-sourcing.js
import { fetchWithAuth } from "./auth.js";
async function loadChunks(use_rust) {
  const chunks = [await loadChunk()];
  const ts = localStorage.getItem("_ts") || 0;
  if (ts)
    chunks.push(await loadChunk(ts));
  localStorage.setItem("_ts", Date.now());
  return chunks;
}
async function loadChunk(ts) {
  const base = sessionStorage.rust ? "big-chunk" : "chunk";
  return await fetchWithAuth(ts ? `${base}-1.json?ts=${ts}` : `${base}-0.json`, true);
}
export {
  loadChunks
};
