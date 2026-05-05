'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore, Product, ProductVariant } from '@/store/useStore';
import { useToast } from '@/components/Toast';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addToCart = useStore((s) => s.addToCart);
  const { showToast } = useToast();
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.id === resolvedParams.id);
        if (found) {
          // Utilise le type du state store/useStore
          setProduct(found);
          // Pré-sélection
          if (found.variants && found.variants.length > 0) {
            const availableVariants = found.variants.filter(v => v.stock > 0);
            const initialVariant = availableVariants[0] || found.variants[0];
            setSelectedColor(initialVariant.color);
            setSelectedSize(initialVariant.size);
            setSelectedVariant(initialVariant);
          }
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  useEffect(() => {
    if (product?.variants) {
      const v = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
      setSelectedVariant(v || null);
    }
  }, [selectedColor, selectedSize, product]);

  if (loading) return <div className="min-h-screen bg-[var(--bg-main)]" />;

  if (!product) return (
    <div className="min-h-screen pt-32 pb-32 flex flex-col items-center text-center bg-[var(--bg-main)]">
      <h1 className="font-cormorant text-4xl mb-4">Produit introuvable</h1>
      <Link href="/boutique" className="btn-outline">Retour à la boutique</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : (product.image ? [product.image] : []);
  const totalStock = product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const isOutOfStock = product.sizeType !== 'NONE' && totalStock === 0;

  // Extraire couleurs et tailles uniques
  const colors = Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean))) as string[];
  const sizesForColor = product.variants?.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size).filter(Boolean) as string[];

  const handleAdd = () => {
    if (isOutOfStock) return;
    
    if (product.sizeType !== 'NONE' && !selectedVariant) {
      showToast('Veuillez sélectionner une option valide', 'error');
      return;
    }
    
    if (selectedVariant && selectedVariant.stock <= 0) {
      showToast('Cette variante est en rupture de stock', 'error');
      return;
    }

    addToCart(product, selectedVariant?.id, selectedVariant?.size || undefined, selectedVariant?.color || undefined);
    showToast(`Produit ajouté au panier`, 'success');
  };

  return (
    <div className="min-h-screen pt-24 pb-32 bg-[var(--bg-main)]">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10">
        
        <Link href="/boutique" className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] hover:text-black transition-colors mb-10">
          <ArrowLeft size={14} /> Retour à la boutique
        </Link>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          {/* IMAGE GALLERY */}
          <motion.div 
            className="w-full md:w-1/2 flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="relative aspect-[3/4] bg-white border border-[var(--border-soft)] rounded-sm overflow-hidden flex items-center justify-center">
              {images.length > 0 ? (
                <>
                  <Image src={images[currentImageIndex]} alt={product.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                  
                  {images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 hover:opacity-100 transition-opacity">
                      <button onClick={() => setCurrentImageIndex((p) => p === 0 ? images.length - 1 : p - 1)} className="p-2 bg-white/80 rounded-full hover:bg-white text-black"><ChevronLeft size={20}/></button>
                      <button onClick={() => setCurrentImageIndex((p) => p === images.length - 1 ? 0 : p + 1)} className="p-2 bg-white/80 rounded-full hover:bg-white text-black"><ChevronRight size={20}/></button>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest">Aperçu indisponible</span>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="font-medium tracking-widest uppercase px-6 py-3 bg-white shadow-lg text-sm rounded-xs">Épuisé</span>
                </div>
              )}
            </div>
            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative w-20 h-24 flex-shrink-0 rounded-sm overflow-hidden border transition-colors ${currentImageIndex === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
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

            {product.sizeType !== 'NONE' && (
              <div className="mb-10 flex flex-col gap-6">
                
                {/* COULEURS */}
                {colors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium uppercase tracking-widest">Couleur</p>
                      {selectedColor && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{selectedColor}</p>}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 text-xs font-medium transition-all rounded-sm border ${
                            selectedColor === color ? 'bg-black text-white border-black' : 'bg-white border-[var(--border-soft)] hover:border-black text-black'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAILLES */}
                {sizesForColor.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium uppercase tracking-widest">Taille</p>
                      {selectedSize && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{selectedSize} sélectionné</p>}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {sizesForColor.map((sz) => {
                        const variant = product.variants.find(v => v.size === sz && (!selectedColor || v.color === selectedColor));
                        const isOos = !variant || variant.stock === 0;
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            disabled={isOos}
                            onClick={() => setSelectedSize(sz)}
                            className={`relative w-14 h-14 flex items-center justify-center text-sm font-medium transition-all rounded-sm ${
                              isSelected ? 'bg-black text-white border-black' : isOos ? 'bg-[var(--bg-alt)] text-[var(--text-muted)] border-transparent cursor-not-allowed' : 'bg-white border-[var(--border-soft)] hover:border-black text-black border'
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
                  </div>
                )}
                
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock || (product.sizeType !== 'NONE' && !selectedVariant) || (selectedVariant && selectedVariant.stock === 0)}
              className="btn-primary w-full py-5 text-sm rounded-sm mt-auto"
            >
              <ShoppingBag size={16} />
              {isOutOfStock ? 'Rupture de stock' : (!selectedVariant && product.sizeType !== 'NONE') ? 'Sélectionner une option' : selectedVariant?.stock === 0 ? 'Variante épuisée' : 'Ajouter au panier'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
