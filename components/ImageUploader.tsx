'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFiles = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      try {
        // Compress before upload — target max 1 MB
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });

        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, compressed, { contentType: compressed.type, upsert: false });

        if (error) { console.error('Upload error:', error.message); continue; }

        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        if (publicData?.publicUrl) {
          uploaded.push(publicData.publicUrl);
        }
      } catch (e) {
        console.error('Compression/upload error:', e);
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput('');
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* File upload — captures camera on mobile */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-[var(--border-soft)] rounded-sm cursor-pointer hover:border-black hover:bg-[var(--bg-alt)] transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture={undefined}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 size={18} className="animate-spin" />
            Compression & upload en cours...
          </div>
        ) : (
          <>
            <ImagePlus size={24} className="text-[var(--text-muted)]" />
            <div className="text-center">
              <p className="text-sm font-medium">Cliquez pour ajouter des photos</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-widest">
                Photo depuis l&apos;appareil photo · Galerie · Fichier
              </p>
              <p className="text-[9px] text-[var(--text-muted)] mt-1">
                Compression automatique — max 1 Mo par image
              </p>
            </div>
          </>
        )}
      </div>

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
              <Image src={img} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="120px" />
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
