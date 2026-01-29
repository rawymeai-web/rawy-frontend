/**
 * Takes an image data URL, target dimensions, and performs a "center-crop" (aspect fill).
 * It creates a canvas of the target size, calculates the best portion of the source image
 * to draw to fill that canvas without distortion, and returns the result as a new data URL.
 * @param dataUrl The source image as a data URL.
 * @param targetWidth The desired width of the output image in pixels.
 * @param targetHeight The desired height of the output image in pixels.
 * @returns A Promise that resolves with the data URL of the cropped image.
 */
export function cropImageToSize(dataUrl: string, targetWidth: number, targetHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous'; // In case of CORS issues with data URLs (unlikely but safe)
        image.onload = () => {
            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            const targetAspectRatio = targetWidth / targetHeight;
            const sourceAspectRatio = sourceWidth / sourceHeight;

            let sx = 0, sy = 0, sWidth = sourceWidth, sHeight = sourceHeight;

            // Calculate the source crop area (sx, sy, sWidth, sHeight)
            if (sourceAspectRatio > targetAspectRatio) {
                // Source is wider than target -> crop the sides
                sWidth = sourceHeight * targetAspectRatio;
                sx = (sourceWidth - sWidth) / 2;
            } else {
                // Source is taller than target -> crop the top/bottom
                sHeight = sourceWidth / targetAspectRatio;
                sy = (sourceHeight - sHeight) / 2;
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // Draw the calculated portion of the source image onto the canvas
            ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
            
            // Return the new image as a high-quality JPEG data URL
            resolve(canvas.toDataURL('image/jpeg', 1.0));
        };
        image.onerror = (error) => {
            reject(new Error('Failed to load image for cropping.'));
        };
        image.src = dataUrl;
    });
}
