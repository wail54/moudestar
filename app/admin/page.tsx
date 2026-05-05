'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingBag,
  Trash2, Landmark, Store, Globe, AlertTriangle, ChevronDown, PenLine, X, Copy, ImagePlus
} from 'lucide-react';
import { Product, toFrontendProduct, ProductVariant, SizeType } from '@/store/useStore';
import { useToast } from '@/components/Toast';
import { CaisseSystem } from '@/components/CaisseSystem';

type Tab = 'orders' | 'products' | 'add' | 'caisse';
type OrderStatus = 'En attente' | 'Confirmée' | 'Expédiée' | 'Terminée';
const STATUS_OPTIONS: OrderStatus[] = ['En attente', 'Confirmée', 'Expédiée', 'Terminée'];

interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}
interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tva: number;
  total: number;
  status: string;
  source: string;
  shippingAddress?: string;
  profile?: { email: string; role: string };
}

const childFade = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = Array.from({length: 15}, (_, i) => (34 + i).toString());

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { showToast } = useToast();

  const [form, setForm] = useState<{
    name: string; description: string; price: string; images: string[]; category: string;
    featured: boolean; sizeType: SizeType; barcode: string; shortId: string; variants: Partial<ProductVariant>[];
  }>({
    name: '', description: '', price: '', images: [], category: 'Vêtements', featured: false,
    sizeType: 'NONE', barcode: '', shortId: '', variants: []
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  const loadProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
      setProducts((data as Product[]).map(toFrontendProduct));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
      setOrders(data as Order[]);
    }
  }, []);

  useEffect(() => { loadProducts(); loadOrders(); }, [loadProducts, loadOrders]);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setForm({ ...form, images: [...form.images, newImageUrl.trim()] });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleAddVariant = () => {
    setForm({ ...form, variants: [...form.variants, { color: '', size: '', stock: 0, barcode: '', shortId: '' }] });
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...form.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setForm({ ...form, variants: newVariants });
  };

  const handleRemoveVariant = (index: number) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

  const generateVariants = () => {
    if (form.sizeType === 'NONE') return;
    const sizes = form.sizeType === 'CLOTHING' ? CLOTHING_SIZES : SHOE_SIZES;
    const newVariants = sizes.map(size => ({ color: '', size, stock: 0, barcode: '', shortId: '' }));
    setForm({ ...form, variants: newVariants });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
      }),
    });
    if (res.ok) {
      await loadProducts();
      setForm({ name: '', description: '', price: '', images: [], category: 'Vêtements', featured: false, sizeType: 'NONE', barcode: '', shortId: '', variants: [] });
      showToast('Produit créé avec succès', 'success');
      setTab('products');
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Erreur lors de la création du produit', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const res = await fetch(`/api/products/${editingProduct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingProduct.name, price: editingProduct.price, description: editingProduct.description,
        images: editingProduct.images, variants: editingProduct.variants, sizeType: editingProduct.sizeType,
        barcode: editingProduct.barcode, shortId: editingProduct.shortId, category: editingProduct.category,
        featured: editingProduct.featured
      }),
    });
    if (res.ok) {
      await loadProducts();
      setEditingProduct(null);
      showToast('Produit mis à jour', 'success');
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) { await loadProducts(); showToast('Produit supprimé', 'success'); }
  };

  const handleDeleteOrder = async (id: string) => {
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    if (res.ok) { await loadOrders(); setDeleteId(null); showToast('Commande supprimée', 'success'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadOrders();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)]">

      {/* Modals */}
      <AnimatePresence>
        {deleteId && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-8 max-w-sm w-full mx-4 rounded-sm shadow-xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center gap-3 mb-5 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="font-cormorant text-2xl font-light text-black">Supprimer</h3>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-8">Voulez-vous vraiment supprimer cette commande ?</p>
              <div className="flex gap-4">
                <button onClick={() => handleDeleteOrder(deleteId)} className="flex-1 py-3 bg-red-600 text-white text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-red-700">Supprimer</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-[var(--bg-alt)] text-black text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-gray-200">Annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {editingProduct && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-6 md:p-8 w-full max-w-3xl rounded-sm shadow-xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cormorant text-2xl font-light">Modifier Produit</h3>
                <button onClick={() => setEditingProduct(null)} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Nom</label>
                    <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Prix (€)</label>
                    <input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)||0})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Images (URLs)</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" id="edit-new-image" placeholder="Ajouter une URL d'image" className="flex-1 px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                    <button type="button" onClick={() => {
                      const input = document.getElementById('edit-new-image') as HTMLInputElement;
                      if (input.value) {
                        setEditingProduct({...editingProduct, images: [...(editingProduct.images||[]), input.value]});
                        input.value = '';
                      }
                    }} className="px-4 py-3 bg-black text-white text-xs uppercase tracking-widest rounded-sm"><PlusCircle size={16}/></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingProduct.images?.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 border border-[var(--border-soft)] rounded-sm overflow-hidden group">
                        <Image src={img} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images.filter((_, i) => i !== idx)})} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)]">Variantes & Stock</label>
                    <button type="button" onClick={() => setEditingProduct({...editingProduct, variants: [...editingProduct.variants, { id: '', productId: editingProduct.id, color: '', size: '', stock: 0, barcode: '', shortId: '' }]})} className="text-[10px] uppercase tracking-widest font-medium text-black underline">Ajouter</button>
                  </div>
                  {editingProduct.variants.map((v, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <input type="text" placeholder="Taille" value={v.size || ''} onChange={e => {
                        const newV = [...editingProduct.variants]; newV[i].size = e.target.value; setEditingProduct({...editingProduct, variants: newV});
                      }} className="w-16 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" />
                      <input type="text" placeholder="Couleur" value={v.color || ''} onChange={e => {
                        const newV = [...editingProduct.variants]; newV[i].color = e.target.value; setEditingProduct({...editingProduct, variants: newV});
                      }} className="w-24 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" />
                      <input type="number" placeholder="Stock" value={v.stock} onChange={e => {
                        const newV = [...editingProduct.variants]; newV[i].stock = parseInt(e.target.value)||0; setEditingProduct({...editingProduct, variants: newV});
                      }} className="w-20 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" />
                      <input type="text" placeholder="Code-barres" value={v.barcode || ''} onChange={e => {
                        const newV = [...editingProduct.variants]; newV[i].barcode = e.target.value; setEditingProduct({...editingProduct, variants: newV});
                      }} className="flex-1 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" />
                      <button type="button" onClick={() => {
                        setEditingProduct({...editingProduct, variants: editingProduct.variants.filter((_, idx) => idx !== i)});
                      }} className="p-2 text-red-500 hover:bg-red-50 rounded-sm"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>

                <button type="submit" className="mt-4 w-full py-4 bg-black text-white text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-black/90">Sauvegarder</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col md:border-r border-b border-[var(--border-soft)] bg-white md:sticky md:top-0 md:h-screen z-40">
        <div className="px-6 md:px-8 py-6 md:py-8 border-b border-[var(--border-soft)] flex items-center justify-between">
          <div>
            <Link href="/" className="font-cormorant text-xl md:text-2xl font-light tracking-widest uppercase text-black hover:text-[var(--text-muted)] transition-colors">Moudestar</Link>
            <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] mt-1 font-medium">Panel Admin</p>
          </div>
          <Link href="/" className="md:hidden text-[10px] uppercase tracking-widest border border-[var(--border-soft)] px-3 py-1 rounded-sm text-black hover:bg-[var(--bg-alt)]">Retour</Link>
        </div>
        <nav className="flex-1 p-4 md:py-6 flex md:flex-col gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
          {[
            { id: 'orders', label: 'Commandes', icon: LayoutDashboard },
            { id: 'products', label: 'Produits', icon: Package },
            { id: 'add', label: 'Nouveau', icon: PlusCircle },
            { id: 'caisse', label: 'Caisse', icon: Landmark },
          ].map((item) => (
            <button key={item.id} onClick={() => setTab(item.id as Tab)}
              className={`flex items-center gap-3 px-4 py-3 md:py-4 text-[10px] md:text-[11px] font-medium tracking-widest uppercase rounded-sm transition-all ${
                tab === item.id ? 'bg-black text-white' : 'text-[var(--text-muted)] hover:text-black hover:bg-[var(--bg-alt)] border border-transparent hover:border-[var(--border-soft)]'
              }`}
            >
              <item.icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-x-hidden bg-[var(--bg-alt)]">
        <div className="max-w-6xl mx-auto p-4 md:p-10 lg:p-14">
          <AnimatePresence mode="wait">

            {tab === 'orders' && (
              <motion.div key="orders" variants={childFade} initial="hidden" animate="show">
                <div className="mb-10">
                  <h1 className="font-cormorant text-5xl font-light mb-2">Dashboard</h1>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium">Vue d&apos;ensemble des ventes</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[
                    { label: 'Commandes', val: orders.length },
                    { label: 'Produits Actifs', val: products.length },
                    { label: "Chiffre d'affaires", val: `${totalRevenue.toFixed(2)} €` }
                  ].map(stat => (
                    <div key={stat.label} className="bg-white p-8 rounded-sm shadow-sm border border-[var(--border-soft)]">
                      <p className="text-4xl font-cormorant font-light mb-2">{stat.val}</p>
                      <p className="text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {orders.length === 0 ? (
                  <div className="py-24 text-center bg-white rounded-sm border border-[var(--border-soft)]">
                    <ShoppingBag size={32} className="mx-auto mb-4 text-[var(--text-muted)]" strokeWidth={1} />
                    <p className="font-cormorant text-2xl font-light">Aucune commande pour le moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-sm shadow-sm border border-[var(--border-soft)] p-6">
                        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[var(--border-soft)] mb-6 gap-4">
                          <div>
                            <p className="font-mono text-xs font-medium mb-1">#{order.id.slice(-8)}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">{new Date(order.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                            {order.profile?.email && (
                              <p className="text-[10px] text-blue-600 uppercase tracking-widest">{order.profile.email}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase bg-[var(--bg-alt)] px-3 py-1.5 rounded-sm font-medium">
                              {order.source === 'caisse' ? <Store size={12}/> : <Globe size={12}/>}
                              {order.source}
                            </span>
                            <div className="relative">
                              <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className="appearance-none pl-4 pr-8 py-1.5 text-[10px] font-medium tracking-widest uppercase bg-white border border-[var(--border-soft)] rounded-sm outline-none cursor-pointer hover:border-black transition-colors"
                              >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
                            </div>
                            <button onClick={() => setDeleteId(order.id)} className="text-[var(--text-muted)] hover:text-red-600 transition-colors p-2 bg-[var(--bg-alt)] rounded-sm"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {order.shippingAddress && (
                          <div className="mb-6 p-4 bg-[var(--bg-alt)] rounded-sm border border-[var(--border-soft)]">
                            <p className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-2">Adresse de livraison</p>
                            <p className="text-sm">{order.shippingAddress}</p>
                          </div>
                        )}
                        <div className="flex flex-col gap-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                              {item.product?.image ? (
                                <div className="relative w-12 h-16 bg-[var(--bg-alt)] rounded-xs overflow-hidden flex-shrink-0">
                                  <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-12 h-16 bg-[var(--bg-alt)] border border-dashed border-[var(--border-soft)] rounded-xs flex items-center justify-center text-[8px] text-[var(--text-muted)] uppercase tracking-widest text-center flex-shrink-0">Sans<br/>Image</div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.product?.name ?? 'Produit'}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest mt-1">Qté: {item.quantity} {item.size && `• Taille: ${item.size}`}</p>
                              </div>
                              <p className="font-medium text-sm">{(item.price * item.quantity).toFixed(2)} €</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col items-end gap-1 pt-6 mt-6 border-t border-[var(--border-soft)]">
                          {order.discount > 0 && <p className="text-xs font-medium text-red-500 uppercase tracking-widest">Remise: -{order.discount.toFixed(2)} €</p>}
                          <p className="font-cormorant text-2xl font-medium mt-1">Total: {order.total.toFixed(2)} €</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'products' && (
              <motion.div key="products" variants={childFade} initial="hidden" animate="show">
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <h1 className="font-cormorant text-5xl font-light mb-2">Produits</h1>
                    <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium">Catalogue ({products.length})</p>
                  </div>
                  <button onClick={() => setTab('add')} className="btn-primary"><PlusCircle size={14} /> Nouveau</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => {
                    const totalStock = p.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
                    return (
                      <div key={p.id} className="bg-white p-5 rounded-sm shadow-sm border border-[var(--border-soft)] flex flex-col group">
                        <div className="relative h-48 mb-4 bg-[var(--bg-alt)] rounded-xs overflow-hidden flex items-center justify-center">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Sans Image</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-1">{p.category} • {p.sizeType}</p>
                          <p className="text-sm font-medium leading-snug line-clamp-1">{p.name}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-soft)]">
                          <div>
                            <p className="font-medium text-sm">{p.price.toFixed(2)} €</p>
                            <p className={`text-[10px] uppercase tracking-widest font-medium mt-1 ${totalStock === 0 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>Stock: {totalStock}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingProduct(p)} className="p-2 bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-black rounded-sm transition-colors"><PenLine size={14}/></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-red-600 rounded-sm transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {tab === 'add' && (
              <motion.div key="add" variants={childFade} initial="hidden" animate="show" className="max-w-3xl">
                <h1 className="font-cormorant text-5xl font-light mb-2">Nouveau</h1>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-10">Créer un produit</p>
                <form onSubmit={handleAdd} className="bg-white p-8 rounded-sm shadow-sm border border-[var(--border-soft)] flex flex-col gap-6">
                  
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Nom</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" required />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Description</label>
                      <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm resize-none border border-[var(--border-soft)] focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Prix (€)</label>
                      <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" required />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Catégorie</label>
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors">
                        {['Vêtements', 'Accessoires', 'Chaussures'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Type de taille</label>
                      <select value={form.sizeType} onChange={e => setForm({...form, sizeType: e.target.value as SizeType, variants: []})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors">
                        <option value="NONE">Taille Unique / Sans taille</option>
                        <option value="CLOTHING">Vêtements (XS, S, M...)</option>
                        <option value="SHOES">Chaussures (38, 39, 40...)</option>
                      </select>
                    </div>
                    <div className="flex items-center mt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 text-black focus:ring-black border-[var(--border-soft)] rounded-xs" />
                        <span className="text-[10px] tracking-widest uppercase font-medium text-black">Produit mis en avant</span>
                      </label>
                    </div>
                  </div>

                  {/* Identification Globale (Caisse) */}
                  <div className="pt-6 mt-2 border-t border-[var(--border-soft)]">
                    <h4 className="text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-4">Identification Caisse (Global - Optionnel)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase font-medium text-black mb-2">Code-barres (10 chif.)</label>
                        <input type="text" maxLength={10} value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-medium text-black mb-2">ID Court (4 chif.)</label>
                        <input type="text" maxLength={4} value={form.shortId} onChange={e => setForm({...form, shortId: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Galerie d'images */}
                  <div className="pt-6 border-t border-[var(--border-soft)]">
                    <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-4">Galerie d'images</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <input type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="https://exemple.com/image.jpg" className="flex-1 px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                        <button onClick={handleAddImage} className="px-6 py-3 bg-black text-white text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-black/90">Ajouter</button>
                      </div>
                      {form.images.length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-2">
                          {form.images.map((img, idx) => (
                            <div key={idx} className="relative w-24 h-24 border border-[var(--border-soft)] rounded-sm overflow-hidden group">
                              <Image src={img} alt={`Img ${idx}`} fill className="object-cover" />
                              <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variantes */}
                  <div className="pt-6 border-t border-[var(--border-soft)]">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)]">Variantes & Stocks</label>
                      <div className="flex gap-3">
                        {form.sizeType !== 'NONE' && form.variants.length === 0 && (
                          <button type="button" onClick={generateVariants} className="text-[10px] tracking-widest uppercase font-medium text-black border-b border-black pb-0.5">Générer Tailles</button>
                        )}
                        <button type="button" onClick={handleAddVariant} className="text-[10px] tracking-widest uppercase font-medium text-black border-b border-black pb-0.5">Ajouter Variante</button>
                      </div>
                    </div>
                    
                    {form.variants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--border-soft)]">
                              <th className="pb-2 text-[10px] uppercase font-medium text-[var(--text-muted)]">Taille</th>
                              <th className="pb-2 text-[10px] uppercase font-medium text-[var(--text-muted)]">Couleur</th>
                              <th className="pb-2 text-[10px] uppercase font-medium text-[var(--text-muted)]">Stock</th>
                              <th className="pb-2 text-[10px] uppercase font-medium text-[var(--text-muted)]">Code-barres</th>
                              <th className="pb-2 text-[10px] uppercase font-medium text-[var(--text-muted)]">ID Court</th>
                              <th className="pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.variants.map((v, i) => (
                              <tr key={i} className="border-b border-[var(--border-soft)] last:border-0">
                                <td className="py-2 pr-2">
                                  <input type="text" value={v.size || ''} onChange={e => handleUpdateVariant(i, 'size', e.target.value)} className="w-16 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" placeholder="-" />
                                </td>
                                <td className="py-2 pr-2">
                                  <input type="text" value={v.color || ''} onChange={e => handleUpdateVariant(i, 'color', e.target.value)} className="w-24 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" placeholder="-" />
                                </td>
                                <td className="py-2 pr-2">
                                  <input type="number" value={v.stock} onChange={e => handleUpdateVariant(i, 'stock', parseInt(e.target.value)||0)} className="w-16 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" min="0" />
                                </td>
                                <td className="py-2 pr-2">
                                  <input type="text" value={v.barcode || ''} onChange={e => handleUpdateVariant(i, 'barcode', e.target.value)} className="w-full px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" placeholder="10 chif." maxLength={10} />
                                </td>
                                <td className="py-2 pr-2">
                                  <input type="text" value={v.shortId || ''} onChange={e => handleUpdateVariant(i, 'shortId', e.target.value)} className="w-16 px-2 py-2 text-sm border border-[var(--border-soft)] rounded-sm" placeholder="4 chif." maxLength={4} />
                                </td>
                                <td className="py-2 text-right">
                                  <button type="button" onClick={() => handleRemoveVariant(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-sm"><Trash2 size={14}/></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)] italic">Aucune variante. Le produit sera considéré comme taille unique.</p>
                    )}
                  </div>

                  <button type="submit" className="btn-primary w-full mt-4">Créer le produit</button>
                </form>
              </motion.div>
            )}

            {tab === 'caisse' && (
              <motion.div key="caisse" variants={childFade} initial="hidden" animate="show">
                <div className="mb-10">
                  <h1 className="font-cormorant text-5xl font-light mb-2">Caisse</h1>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium">Point de Vente (POS)</p>
                </div>
                <CaisseSystem />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
