'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useStore, Size, Product, toFrontendProduct } from '@/store/useStore';
import { useToast } from '@/components/Toast';

const SIZES: Size[] = ['S', 'M', 'L', 'XL'];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addToCart = useStore((s) => s.addToCart);
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.id === resolvedParams.id);
        setProduct(found ? toFrontendProduct(found) : null);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  if (loading) return <div className="min-h-screen bg-[var(--bg-main)]" />;

  if (!product) return (
    <div className="min-h-screen pt-32 pb-32 flex flex-col items-center text-center">
      <h1 className="font-cormorant text-4xl mb-4">Produit introuvable</h1>
      <Link href="/boutique" className="btn-outline">Retour à la boutique</Link>
    </div>
  );

  const hasSizes = product.stock
    ? Object.values(product.stock).some((v) => v > 0)
    : false;
  const stockForSize = (size: Size): number => product.stock ? product.stock[size] : 0;
  const hasStockField = !!product.stock;
  
  const isAvailable = hasStockField ? selectedSize !== null && stockForSize(selectedSize) > 0 : true;
  const totalStock = product.stock ? Object.values(product.stock).reduce((a, b) => a + b, 0) : null;
  const isOutOfStock = totalStock !== null && totalStock === 0;

  const handleAdd = () => {
    if (!isAvailable || isOutOfStock) return;
    addToCart(product, selectedSize ?? undefined);
    showToast(`Produit ajouté au panier`, 'success');
  };

  return (
    <div className="min-h-screen pt-24 pb-32">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10">
        
        <Link href="/boutique" className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] hover:text-black transition-colors mb-10">
          <ArrowLeft size={14} /> Retour à la boutique
        </Link>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          {/* IMAGE */}
          <motion.div 
            className="w-full md:w-1/2 relative aspect-[3/4] bg-white border border-[var(--border-soft)] rounded-sm overflow-hidden flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            {product.image ? (
              <Image src={product.image} alt={product.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest">Aperçu indisponible</span>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="font-medium tracking-widest uppercase px-6 py-3 bg-white shadow-lg text-sm rounded-xs">Épuisé</span>
              </div>
            )}
          </motion.div>

          {/* DETAILS */}
          <motion.div 
            className="w-full md:w-1/2 flex flex-col py-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-4">{product.category}</p>
            <h1 className="font-cormorant text-5xl md:text-6xl font-light mb-6 leading-tight">{product.name}</h1>
            <p className="text-2xl font-medium mb-10">{product.price.toFixed(2)} €</p>
            
            <div className="prose prose-sm text-[var(--text-muted)] mb-10 leading-relaxed border-t border-[var(--border-soft)] pt-8">
              {product.description}
            </div>

            {hasStockField && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium uppercase tracking-widest">Tailles</p>
                  {selectedSize && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{selectedSize} sélectionné</p>}
                </div>
                <div className="flex gap-3">
                  {SIZES.map((sz) => {
                    const qty = stockForSize(sz);
                    const isOos = qty === 0;
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        disabled={isOos}
                        onClick={() => setSelectedSize(sz)}
                        className={`relative w-14 h-14 flex items-center justify-center text-sm font-medium transition-all rounded-sm ${
                          isSelected ? 'bg-black text-white border border-black' : isOos ? 'bg-[var(--bg-alt)] text-[var(--text-muted)] border border-transparent cursor-not-allowed' : 'bg-white border border-[var(--border-soft)] hover:border-black text-black'
                        }`}
                      >
                        {sz}
                        {isOos && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-px bg-[var(--text-muted)] rotate-45 scale-110" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {hasStockField && !selectedSize && !isOutOfStock && hasSizes && (
                  <p className="text-[10px] text-red-500 uppercase tracking-widest mt-4">Veuillez choisir une taille</p>
                )}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock || (hasStockField && !selectedSize)}
              className="btn-primary w-full py-5 text-sm rounded-sm mt-auto"
            >
              <ShoppingBag size={16} />
              {isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
