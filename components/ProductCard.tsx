'use client';

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { Product, useStore } from '@/store/useStore';
import { useToast } from '@/components/Toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useStore((s) => s.addToCart);
  const { showToast } = useToast();

  const handleAdd = () => {
    addToCart(product);
    showToast(`"${product.name}" ajouté au panier`, 'success');
  };

  return (
    <div className="group relative flex flex-col bg-[var(--dark-2)] rounded-lg overflow-hidden border border-white/5 hover:border-[var(--gold)]/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--dark-3)]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick add on hover */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 rounded transition-colors"
          >
            <ShoppingBag size={13} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--gray-3)] mb-1">{product.category}</p>
          <h3 className="text-sm font-medium text-[var(--light)] leading-snug line-clamp-2">{product.name}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-cormorant text-xl font-light text-[var(--gold)]">{product.price.toFixed(2)} €</span>
          {/* Mobile add button */}
          <button
            onClick={handleAdd}
            className="md:hidden p-2 bg-[var(--gold)]/10 hover:bg-[var(--gold)] text-[var(--gold)] hover:text-[var(--dark)] border border-[var(--gold)]/30 rounded transition-all duration-200"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
