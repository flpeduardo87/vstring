/**
 * Clear Firestore IndexedDB cache to free up space
 * Call this function if you get FILE_ERROR_NO_SPACE errors
 */
export async function clearFirestoreCache() {
  try {
    // Get all databases
    const dbs = await indexedDB.databases();
    
    // Delete Firestore-related databases
    for (const db of dbs) {
      if (db.name && db.name.includes('firestore') || db.name.includes('firebase')) {
        indexedDB.deleteDatabase(db.name);
        console.log(`Deleted database: ${db.name}`);
      }
    }
    
    // Also clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('Cache cleared. Please refresh the page.');
    window.location.reload();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Auto-clear cache if we detect NO_SPACE errors
export function setupCacheErrorHandler() {
  // Listen for storage errors
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('NO_SPACE') || event.reason?.message?.includes('FILE_ERROR_NO_SPACE')) {
        console.warn('Storage full, clearing cache...');
        clearFirestoreCache();
      }
    });
  }
}
