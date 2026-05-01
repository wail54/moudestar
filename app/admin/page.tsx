'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingBag, 
  Trash2, Landmark, Store, Globe, AlertTriangle, ChevronDown, PenLine, X
} from 'lucide-react';
import { useStore, OrderStatus, Product } from '@/store/useStore';
import { useToast } from '@/components/Toast';
import { CaisseSystem } from '@/components/CaisseSystem';

type Tab = 'orders' | 'products' | 'add' | 'caisse';
const STATUS_OPTIONS: OrderStatus[] = ['En attente', 'Confirmée', 'Expédiée', 'Terminée'];

const childFade = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const removeProduct = useStore((s) => s.removeProduct);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const { showToast } = useToast();

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const [form, setForm] = useState({ 
    name: '', description: '', price: '', image: '', category: 'Vêtements', featured: false,
    stockS: '0', stockM: '0', stockL: '0', stockXL: '0'
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    addProduct({
      name: form.name, description: form.description,
      price: parseFloat(form.price),
      image: form.image || '',
      category: form.category, featured: form.featured,
      stock: {
        S: parseInt(form.stockS) || 0,
        M: parseInt(form.stockM) || 0,
        L: parseInt(form.stockL) || 0,
        XL: parseInt(form.stockXL) || 0
      }
    });
    setForm({ name: '', description: '', price: '', image: '', category: 'Vêtements', featured: false, stockS: '0', stockM: '0', stockL: '0', stockXL: '0' });
    showToast('Produit créé avec succès', 'success');
    setTab('products');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      price: editingProduct.price,
      stock: editingProduct.stock,
      image: editingProduct.image
    });
    setEditingProduct(null);
    showToast('Produit mis à jour', 'success');
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)]">
      
      {/* ── Modals ── */}
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
                <button onClick={() => { deleteOrder(deleteId); setDeleteId(null); showToast('Commande supprimée', 'success'); }} className="flex-1 py-3 bg-red-600 text-white text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-red-700">Supprimer</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-[var(--bg-alt)] text-black text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-gray-200">Annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingProduct && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-8 max-w-md w-full mx-4 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cormorant text-2xl font-light">Modifier Produit</h3>
                <button onClick={() => setEditingProduct(null)} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Nom</label>
                  <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Prix (€)</label>
                  <input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">URL Image (laisser vide pour cacher)</label>
                  <input type="text" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-3">Stocks par taille</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['S', 'M', 'L', 'XL'].map(sz => (
                      <div key={sz}>
                        <label className="block text-xs font-medium mb-1 text-center">{sz}</label>
                        <input type="number" min="0" value={editingProduct.stock ? editingProduct.stock[sz as keyof typeof editingProduct.stock] : 0} 
                          onChange={e => setEditingProduct({
                            ...editingProduct, 
                            stock: { ...editingProduct.stock, [sz]: parseInt(e.target.value) || 0 } as NonNullable<Product['stock']>
                          })} 
                          className="w-full px-2 py-2 bg-[var(--bg-alt)] outline-none rounded-sm text-sm text-center border border-transparent focus:border-[var(--text-main)]" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="mt-4 w-full py-4 bg-black text-white text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-black/90">Sauvegarder</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex flex-col border-r border-[var(--border-soft)] bg-white sticky top-0 h-screen">
        <div className="px-8 py-8 border-b border-[var(--border-soft)]">
          <Link href="/" className="font-cormorant text-2xl font-light tracking-widest uppercase text-black hover:text-[var(--text-muted)] transition-colors">
            Moudestar
          </Link>
          <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] mt-2 font-medium">Panel Admin</p>
        </div>

        <nav className="flex-1 py-6 flex flex-col px-4 gap-1">
          {[
            { id: 'orders', label: 'Commandes', icon: LayoutDashboard },
            { id: 'products', label: 'Produits', icon: Package },
            { id: 'add', label: 'Nouveau Produit', icon: PlusCircle },
            { id: 'caisse', label: 'Caisse POS', icon: Landmark },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-4 py-4 text-[11px] font-medium tracking-widest uppercase rounded-sm transition-all ${
                tab === item.id ? 'bg-black text-white' : 'text-[var(--text-muted)] hover:text-black hover:bg-[var(--bg-alt)]'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto bg-[var(--bg-alt)]">
        <div className="max-w-6xl mx-auto p-10 md:p-14">
          <AnimatePresence mode="wait">
            
            {/* ORDERS */}
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
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{order.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase bg-[var(--bg-alt)] px-3 py-1.5 rounded-sm font-medium">
                              {order.source === 'caisse' ? <Store size={12}/> : <Globe size={12}/>}
                              {order.source}
                            </span>
                            <div className="relative">
                              <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className="appearance-none pl-4 pr-8 py-1.5 text-[10px] font-medium tracking-widest uppercase bg-white border border-[var(--border-soft)] rounded-sm outline-none cursor-pointer hover:border-black transition-colors"
                              >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
                            </div>
                            <button onClick={() => setDeleteId(order.id)} className="text-[var(--text-muted)] hover:text-red-600 transition-colors p-2 bg-[var(--bg-alt)] rounded-sm"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                              {item.product.image ? (
                                <div className="relative w-12 h-16 bg-[var(--bg-alt)] rounded-xs overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-12 h-16 bg-[var(--bg-alt)] border border-[var(--border-soft)] border-dashed rounded-xs flex items-center justify-center text-[8px] text-[var(--text-muted)] uppercase tracking-widest text-center flex-shrink-0">
                                  Sans<br/>Image
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.product.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest mt-1">Qté: {item.quantity} {item.size && `• Taille: ${item.size}`}</p>
                              </div>
                              <p className="font-medium text-sm">{(item.product.price * item.quantity).toFixed(2)} €</p>
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

            {/* PRODUCTS */}
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
                    const totalStock = p.stock ? Object.values(p.stock).reduce((a, b) => a + b, 0) : null;
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
                          <p className="text-[9px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-1">{p.category}</p>
                          <p className="text-sm font-medium leading-snug line-clamp-1">{p.name}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-soft)]">
                          <div>
                            <p className="font-medium text-sm">{p.price.toFixed(2)} €</p>
                            {totalStock !== null && <p className={`text-[10px] uppercase tracking-widest font-medium mt-1 ${totalStock === 0 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>Stock: {totalStock}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingProduct(p)} className="p-2 bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-black rounded-sm transition-colors"><PenLine size={14}/></button>
                            <button onClick={() => removeProduct(p.id)} className="p-2 bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-red-600 rounded-sm transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ADD PRODUCT */}
            {tab === 'add' && (
              <motion.div key="add" variants={childFade} initial="hidden" animate="show" className="max-w-2xl">
                <h1 className="font-cormorant text-5xl font-light mb-2">Nouveau</h1>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-10">Créer un produit</p>
                
                <form onSubmit={handleAdd} className="bg-white p-8 rounded-sm shadow-sm border border-[var(--border-soft)] flex flex-col gap-6">
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
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">URL Image</label>
                      <input type="url" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full px-4 py-3 bg-white outline-none rounded-sm text-sm border border-[var(--border-soft)] focus:border-black transition-colors" />
                    </div>
                  </div>

                  <div className="pt-6 mt-2 border-t border-[var(--border-soft)]">
                    <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-4">Stocks par taille</label>
                    <div className="grid grid-cols-4 gap-4">
                      {['S', 'M', 'L', 'XL'].map(sz => (
                        <div key={sz}>
                          <label className="block text-xs font-medium text-center mb-2">{sz}</label>
                          <input type="number" min="0" value={(form as any)[`stock${sz}`]} onChange={e => setForm({...form, [`stock${sz}`]: e.target.value})} className="w-full px-2 py-2 bg-white outline-none rounded-sm text-sm text-center border border-[var(--border-soft)] focus:border-black transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full mt-4">Créer le produit</button>
                </form>
              </motion.div>
            )}

            {/* CAISSE */}
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
