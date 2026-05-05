'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createBrowserClient } from '@supabase/ssr';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Créer le client Supabase directement avec les variables d'env
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const uploadFiles = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      try {
        // Compress before upload — target max 1 MB
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });

        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, compressed, {
            contentType: compressed.type || `image/${ext}`,
            upsert: false,
          });

        if (uploadErr) {
          console.error('Upload error:', uploadErr);
          setUploadError(`Erreur upload: ${uploadErr.message}`);
          continue;
        }

        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        if (publicData?.publicUrl) {
          uploaded.push(publicData.publicUrl);
        }
      } catch (e: any) {
        console.error('Compression/upload error:', e);
        setUploadError(`Erreur: ${e?.message || 'inconnue'}`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
      setUploadError(null);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
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
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-[var(--border-soft)] rounded-sm cursor-pointer hover:border-black hover:bg-[var(--bg-alt)] transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 size={18} className="animate-spin" />
            Compression &amp; upload en cours...
          </div>
        ) : (
          <>
            <ImagePlus size={24} className="text-[var(--text-muted)]" />
            <div className="text-center">
              <p className="text-sm font-medium">Cliquez pour ajouter des photos</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-widest">
                Photo · Galerie · Fichier
              </p>
              <p className="text-[9px] text-[var(--text-muted)] mt-1">
                Compression automatique — max 1 Mo par image
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error display */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{uploadError}</p>
        </div>
      )}

      {/* URL fallback */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Ou coller une URL d'image..."
          className="flex-1 px-4 py-2.5 text-sm bg-[var(--bg-alt)] border border-transparent focus:border-black rounded-sm outline-none"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="px-4 py-2.5 bg-black text-white text-xs uppercase tracking-widest rounded-sm disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-sm overflow-hidden border border-[var(--border-soft)] group">
              <Image src={img} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="120px" unoptimized />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-black text-white text-[8px] px-1.5 py-0.5 rounded-xs uppercase tracking-widest">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
