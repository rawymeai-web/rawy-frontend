// services/imageStore.ts
const DB_NAME = 'AlbumiiImageStore';
const STORE_NAME = 'orderImages';
const DB_VERSION = 1;

export interface OrderImages {
    cover: File;
    spreads: File[];
}

function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject('Error opening IndexedDB.');
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

export async function saveImagesForOrder(orderNumber: string, images: OrderImages): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(images, orderNumber);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Transaction error while saving images.');
    });
}

export async function getImagesForOrder(orderNumber: string): Promise<OrderImages | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(orderNumber);

        request.onsuccess = () => {
            resolve(request.result ? (request.result as OrderImages) : null);
        };
        request.onerror = () => reject('Error fetching images from IndexedDB.');
    });
}
