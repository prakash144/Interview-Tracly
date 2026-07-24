"use client";

const DB_NAME = "interviewtracly-csv-cache";
const STORE_NAME = "csv-responses";
const TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  url: string;
  text: string;
  cachedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "url" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getFromCache(url: string): Promise<CacheEntry | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => {
        resolve(req.result ?? null);
        db.close();
      };
      req.onerror = () => {
        reject(req.error);
        db.close();
      };
    });
  } catch {
    return null;
  }
}

async function setCache(url: string, text: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ url, text, cachedAt: Date.now() });
      tx.oncomplete = () => { resolve(); db.close(); };
      tx.onerror = () => { reject(tx.error); db.close(); };
    });
  } catch {
    // silently fail — cache is optional
  }
}

export async function cachedFetchCSV(url: string): Promise<string> {
  const cached = await getFromCache(url);
  const now = Date.now();

  if (cached && now - cached.cachedAt < TTL_MS) {
    return cached.text;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load CSV: ${response.status} ${response.statusText} — ${url}`);
  }
  const text = await response.text();

  setCache(url, text);

  return text;
}

export async function cachedFetchCSVWithStale(url: string): Promise<string> {
  const cached = await getFromCache(url);
  const now = Date.now();

  if (cached) {
    if (now - cached.cachedAt < TTL_MS) {
      return cached.text;
    }
    fetch(url).then((r) => {
      if (r.ok) { r.text().then((t) => { setCache(url, t); }); }
    }).catch(() => {});
    return cached.text;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load CSV: ${response.status} ${response.statusText} — ${url}`);
  }
  const text = await response.text();
  setCache(url, text);
  return text;
}
