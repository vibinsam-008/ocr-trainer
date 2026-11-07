/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainingPair, EdrawOcrResult } from '../types/edraw';
import { INITIAL_TRAINING_PAIRS } from '../data/defaultPairs';

const DB_NAME = 'EdrawOCR_DB';
const DB_VERSION = 1;
const STORE_PAIRS = 'training_pairs';
const STORE_HISTORY = 'ocr_history';

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageName: string;
  imageUrl: string;
  result: EdrawOcrResult;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PAIRS)) {
        db.createObjectStore(STORE_PAIRS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredTrainingPairs(): Promise<TrainingPair[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAIRS, 'readonly');
      const store = tx.objectStore(STORE_PAIRS);
      const req = store.getAll();

      req.onsuccess = async () => {
        const pairs: TrainingPair[] = req.result || [];
        if (pairs.length === 0) {
          // Seed initial 14 pairs
          await saveAllTrainingPairs(INITIAL_TRAINING_PAIRS);
          resolve(INITIAL_TRAINING_PAIRS);
        } else {
          // Sort by ID
          pairs.sort((a, b) => a.id - b.id);
          resolve(pairs);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB failed, falling back to local memory dataset', err);
    return INITIAL_TRAINING_PAIRS;
  }
}

export async function saveTrainingPair(pair: TrainingPair): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAIRS, 'readwrite');
    const store = tx.objectStore(STORE_PAIRS);
    const req = store.put(pair);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllTrainingPairs(pairs: TrainingPair[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAIRS, 'readwrite');
    const store = tx.objectStore(STORE_PAIRS);
    for (const pair of pairs) {
      store.put(pair);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteTrainingPair(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAIRS, 'readwrite');
    const store = tx.objectStore(STORE_PAIRS);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function resetTrainingPairsToDefault(): Promise<TrainingPair[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAIRS, 'readwrite');
    const store = tx.objectStore(STORE_PAIRS);
    store.clear();
    for (const pair of INITIAL_TRAINING_PAIRS) {
      store.put(pair);
    }
    tx.oncomplete = () => resolve(INITIAL_TRAINING_PAIRS);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveOcrHistory(item: HistoryItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.put(item);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getOcrHistory(): Promise<HistoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: HistoryItem[] = req.result || [];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read OCR history', err);
    return [];
  }
}

export async function clearOcrHistory(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
