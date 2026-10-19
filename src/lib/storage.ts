type StoreName = "habits" | "todos";
let connection: Promise<IDBDatabase> | undefined;

function database(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(
          new Error(
            "IndexedDB is unavailable. Please allow browser storage to use Bit Tracker.",
          ),
        );
        return;
      }
      const request = indexedDB.open("bit-tracker", 2);
      let blocked = false;
      request.onupgradeneeded = () => {
        for (const name of ["habits", "todos"]) {
          if (!request.result.objectStoreNames.contains(name)) {
            request.result.createObjectStore(name, { keyPath: "id" });
          }
        }
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        blocked = true;
        reject(new Error("Close other Bit Tracker tabs, then try again."));
      };
      request.onsuccess = () => {
        const db = request.result;
        if (blocked) {
          db.close();
          return;
        }
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
    }).catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

/** Resolve only after a transaction commits; shared connection owns schema upgrades. */
export async function storageTransaction<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  action: (
    store: IDBObjectStore,
    result: (value: T) => void,
    fail: (error: Error) => void,
  ) => void,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode);
    let value: T;
    tx.oncomplete = () => resolve(value);
    tx.onerror = () =>
      reject(tx.error ?? new Error("Unable to save your changes."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("The storage operation was interrupted."));
    const fail = (error: Error) => {
      reject(error);
      tx.abort();
    };
    try {
      action(
        tx.objectStore(name),
        (next) => {
          value = next;
        },
        fail,
      );
    } catch (error) {
      reject(error);
      tx.abort();
    }
  });
}
