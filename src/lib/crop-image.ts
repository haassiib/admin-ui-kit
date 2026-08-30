/* Origin: bonus-adjustment (96S2), verbatim. */
import type { Area } from 'react-easy-crop';

/**
 * Crop client-side and re-encode to PNG. Runs in the browser (canvas), so the
 * server only ever receives an already-square, already-small image — which is
 * what makes the 200KB upload cap realistic rather than an obstacle.
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = url;
  });

/** Cap the stored side length — a 4000px crop would blow the size limit. */
const MAX_SIDE = 512;

export async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser.');

  const side = Math.min(Math.max(crop.width, crop.height), MAX_SIDE);
  canvas.width = side;
  canvas.height = side;

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, side, side);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      'image/png',
    );
  });
}
