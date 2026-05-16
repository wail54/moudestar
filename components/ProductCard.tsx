'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/store/useStore';

export function ProductCard({ product }: { product: Product }) {
  const totalStock = product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const isOos = product.sizeType !== 'NONE' && product.variants?.length > 0 && totalStock === 0;
  const imageUrl = product.images?.[0] || product.image;
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  const displayPrice = hasPromo ? product.promoPrice! : product.price;

  return (
    <Link href={`/boutique/${product.id}`} className="block group w-full">
      <div className={`flex flex-col gap-4 ${isOos ? 'opacity-60' : ''}`}>
        <div className="relative aspect-[3/4] bg-white border border-[var(--border-soft)] overflow-hidden rounded-sm flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl} alt={product.name} fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Aperçu indisponible</span>
          )}
          {isOos && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <span className="text-[10px] tracking-widest uppercase font-medium bg-white px-4 py-2 rounded-xs shadow-sm">Épuisé</span>
            </div>
          )}
          {hasPromo && !isOos && (
            <div className="absolute top-3 left-3">
              <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm">
                Promo -{Math.round((1 - displayPrice / product.price) * 100)}%
              </span>
            </div>
          )}
          {!isOos && (
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="bg-white/90 backdrop-blur-md text-black text-[10px] tracking-widest uppercase font-medium py-3 text-center rounded-xs shadow-lg">
                Voir l&apos;article
              </div>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] mb-1">{product.category}</p>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
            <div className="flex flex-col items-end flex-shrink-0">
              {hasPromo && (
                <span className="text-[10px] line-through text-[var(--text-muted)]">{product.price.toFixed(2)} €</span>
              )}
              <span className={`text-sm font-medium ${hasPromo ? 'text-red-600' : ''}`}>
                {displayPrice.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
