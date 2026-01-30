
import { supabase } from '../utils/supabaseClient';

export interface OrderImages {
    cover: File;
    spreads: File[];
}

export interface UploadedImageUrls {
    cover: string;
    spreads: string[];
}

/**
 * Uploads cover and spread images to Supabase Storage.
 * Path: images/{orderNumber}/...
 */
export async function saveImagesForOrder(orderNumber: string, images: OrderImages): Promise<UploadedImageUrls> {
    const bucket = 'images';
    const folder = `${orderNumber}`;

    // Helper to upload a single file
    const uploadFile = async (file: File, name: string): Promise<string> => {
        const path = `${folder}/${name}`;
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true });

        if (error) {
            console.error(`Error uploading ${name}:`, error);
            throw error;
        }

        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicData.publicUrl;
    };

    // Upload Cover
    const coverUrl = await uploadFile(images.cover, 'cover.jpg');

    // Upload Spreads
    const spreadUrls = await Promise.all(
        images.spreads.map((file, index) => uploadFile(file, `spread_${index + 1}.jpg`))
    );

    return {
        cover: coverUrl,
        spreads: spreadUrls
    };
}

/**
 * Retrieves public URLs for an order's images.
 * Note: Since we are not browsing the bucket, we return the constructed URLs.
 * In a real scenario, these URLs should be stored in the 'orders' table.
 */
export async function getImagesForOrder(orderNumber: string): Promise<UploadedImageUrls | null> {
    // This function is less useful now because we save the URLs in the DB.
    // But for backward compatibility or direct bucket access:
    const bucket = 'images';
    const folder = `${orderNumber}`;

    // We can't easily "list" and download files as Blobs here without Auth if the bucket is private.
    // Assuming Public bucket for now given the previous checks.

    // For now, return null to force logic to rely on DB URLs if possible, 
    // or implement list logic if needed for the Zip download.

    // Actually, the Zip downloader needs Blobs.
    // So we might need a helper to download URLs as Blobs.
    return null;
}

export async function downloadImageAsBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
    return await response.blob();
}
