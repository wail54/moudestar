'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ImagePlus, Trash2, Loader2, AlertCircle, Link } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

// Utiliser createClient standard (pas createBrowserClient qui peut avoir des comportements différents)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

export function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    setUploading(true);
    setUploadError(null);

    const supabase = getSupabaseClient();
    const uploaded: string[] = [];

    for (const file of fileArray) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setUploadError(`"${file.name}" n'est pas une image valide.`);
          continue;
        }

        // Compress before upload — target max 1 MB
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });

        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `products/${safeName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, compressed, {
            contentType: compressed.type || `image/${ext}`,
            upsert: false,
          });

        if (uploadErr) {
          console.error('[ImageUploader] Upload error:', uploadErr);
          setUploadError(`Erreur upload "${file.name}": ${uploadErr.message}`);
          continue;
        }

        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        if (publicData?.publicUrl) {
          uploaded.push(publicData.publicUrl);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'inconnue';
        console.error('[ImageUploader] Error:', e);
        setUploadError(`Erreur lors du traitement de "${file.name}": ${msg}`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
      setUploadError(null);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [images, onChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setUploadError("URL invalide. Veuillez entrer une URL complète (ex: https://...)");
      return;
    }
    onChange([...images, url]);
    setUrlInput('');
    setUploadError(null);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* File upload zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-sm transition-all cursor-pointer ${
          dragOver
            ? 'border-black bg-black/5 scale-[1.01]'
            : 'border-[var(--border-soft)] hover:border-black hover:bg-[var(--bg-alt)]'
        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={22} className="animate-spin text-black" />
            <p className="text-sm text-[var(--text-muted)]">Compression & upload en cours...</p>
          </div>
        ) : (
          <>
            <div className={`p-3 rounded-full transition-colors ${dragOver ? 'bg-black text-white' : 'bg-[var(--bg-alt)] text-[var(--text-muted)]'}`}>
              <ImagePlus size={22} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {dragOver ? 'Déposez ici' : 'Cliquez ou glissez-déposez vos photos'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-widest">
                JPG · PNG · WEBP · GIF
              </p>
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                Compression automatique · Max 5 Mo par image
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error display */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-red-600 font-medium">{uploadError}</p>
            <p className="text-[10px] text-red-400 mt-0.5">Vérifiez que le fichier est bien une image (JPG, PNG, WEBP, GIF)</p>
          </div>
        </div>
      )}

      {/* URL fallback */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Ou coller une URL d'image (https://...)"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-alt)] border border-transparent focus:border-black rounded-sm outline-none"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="px-4 py-2.5 bg-black text-white text-xs uppercase tracking-widest rounded-sm disabled:opacity-40 hover:bg-black/80 transition-colors"
        >
          Ajouter
        </button>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-2">
            {images.length} image{images.length > 1 ? 's' : ''} · La première est la couverture
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div key={`${img}-${idx}`} className="relative aspect-square rounded-sm overflow-hidden border border-[var(--border-soft)] group">
                <Image
                  src={img}
                  alt={`Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized
                />
                {/* Overlay with delete button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                >
                  <Trash2 size={16} />
                  <span className="text-[9px] uppercase tracking-widest">Supprimer</span>
                </button>
                {/* Cover badge */}
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-black text-white text-[8px] px-1.5 py-0.5 rounded-xs uppercase tracking-widest pointer-events-none">
                    Cover
                  </span>
                )}
                {/* Index badge */}
                {idx > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded-xs pointer-events-none">
                    {idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
