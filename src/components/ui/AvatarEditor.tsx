'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedBlob } from '@/lib/crop-image';
import { InfoTooltip } from '@/components/overlay/Tooltip';

/**
 * Pick a file, crop it square, hand back a PNG blob. Cropping happens in the
 * browser so the upload is already the final image — see cropImage.ts.
 */
export default function AvatarEditor({
  onSave,
  onCancel,
  busy = false,
}: {
  onSave: (blob: Blob) => void | Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.addEventListener('load', () => setImageSrc(reader.result as string));
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const handleSave = async () => {
    if (!imageSrc || !area) return;
    try {
      await onSave(await getCroppedBlob(imageSrc, area));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process that image.');
    }
  };

  if (!imageSrc) {
    return (
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5">
          <label htmlFor="avatar-file" className="btn-primary cursor-pointer">
            Choose an image
          </label>
          <InfoTooltip
            label="Accepted image formats"
            content="PNG, JPG or WEBP. It will be cropped square and stored at up to 512px."
          />
        </span>
        <input
          id="avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-56 w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div>
        <label htmlFor="avatar-zoom" className="field-label">Zoom</label>
        <input
          id="avatar-zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </div>

      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost" disabled={busy}>
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save photo'}
        </button>
      </div>
    </div>
  );
}
