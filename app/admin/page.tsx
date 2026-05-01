'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Package, PlusCircle, LogOut,
  ShoppingBag, TrendingUp, Boxes, Trash2, ChevronDown,
} from 'lucide-react';
import { useStore, Order } from '@/store/useStore';
import { useToast } from '@/components/Toast';

type Tab = 'orders' | 'products' | 'add';

const STATUS_OPTIONS: Order['status'][] = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];

const STATUS_STYLE: Record<Order['status'], string> = {
  'En attente': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Confirmée':  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Expédiée':   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Livrée':     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const removeProduct = useStore((s) => s.removeProduct);
  const addProduct = useStore((s) => s.addProduct);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const { showToast } = useToast();

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { label: 'Commandes', value: orders.length, icon: ShoppingBag },
    { label: 'Produits', value: products.length, icon: Boxes },
    { label: 'CA Simulé', value: `${totalRevenue.toFixed(0)} €`, icon: TrendingUp },
  ];

  // Add form state
  const [form, setForm] = useState({
    name: '', description: '', price: '', image: '', category: 'Vêtements', featured: false,
  });
  const [formSuccess, setFormSuccess] = useState(false);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price) return;
    addProduct({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      image: form.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80&auto=format&fit=crop',
      category: form.category,
      featured: form.featured,
    });
    setForm({ name: '', description: '', price: '', image: '', category: 'Vêtements', featured: false });
    setFormSuccess(true);
    showToast('Produit créé et visible dans la boutique !', 'success');
    setTimeout(() => { setFormSuccess(false); setTab('products'); }, 1800);
  };

  const navItems = [
    { id: 'orders' as Tab, label: 'Commandes', icon: LayoutDashboard },
    { id: 'products' as Tab, label: 'Produits', icon: Package },
    { id: 'add' as Tab, label: 'Ajouter', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen pt-16 flex bg-[var(--dark)]">
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-16 left-0 bottom-0 z-30 w-64
          bg-[var(--dark-2)] border-r border-white/5
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-white/5">
          <p className="font-cormorant text-xl font-light text-white">Moudestar</p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--gold)] mt-0.5">Panel Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-all ${
                tab === id
                  ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20'
                  : 'text-[var(--gray-3)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              <span className="tracking-wide">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--gray-3)] hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Retour au site
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-[var(--dark-2)]">
          <button onClick={() => setSidebarOpen(true)} className="text-[var(--gray-3)] hover:text-white">
            <LayoutDashboard size={20} />
          </button>
          <span className="text-sm text-[var(--gray-3)]">{navItems.find((n) => n.id === tab)?.label}</span>
        </div>

        <div className="p-4 md:p-8 max-w-6xl">
          {/* ORDERS */}
          {tab === 'orders' && (
            <div className="animate-fade-in">
              <h1 className="font-cormorant text-4xl font-light text-white mb-2">Dashboard</h1>
              <p className="text-sm text-[var(--gray-3)] mb-8">Vue d&apos;ensemble des commandes simulées</p>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-[var(--dark-2)] border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
                      <Icon size={18} className="text-[var(--gold)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-light text-white">{value}</p>
                      <p className="text-xs text-[var(--gray-3)] tracking-widest uppercase">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Orders table */}
              {orders.length === 0 ? (
                <div className="text-center py-20 text-[var(--gray-3)] border border-white/5 rounded-xl bg-[var(--dark-2)]">
                  <ShoppingBag size={40} strokeWidth={1} className="mx-auto mb-3 opacity-50" />
                  <p className="font-cormorant text-2xl mb-1">Aucune commande</p>
                  <p className="text-sm">Les commandes passées depuis la boutique apparaîtront ici.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-[var(--dark-3)]">
                        {['#', 'Date', 'Articles', 'Total', 'Statut'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[var(--gray-3)]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-white/5 bg-[var(--dark-2)] hover:bg-[var(--dark-3)] transition-colors">
                          <td className="px-4 py-4 text-xs text-[var(--gray-3)] font-mono">{order.id}</td>
                          <td className="px-4 py-4 text-[var(--gray-4)] whitespace-nowrap">{order.date}</td>
                          <td className="px-4 py-4 text-[var(--light)] max-w-xs">
                            {order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}
                          </td>
                          <td className="px-4 py-4 text-[var(--gold)] font-medium whitespace-nowrap">
                            {order.total.toFixed(2)} €
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                                className={`appearance-none pl-2 pr-6 py-1 text-xs rounded border ${STATUS_STYLE[order.status]} bg-transparent cursor-pointer outline-none`}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s} className="bg-[var(--dark-3)] text-white">
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS LIST */}
          {tab === 'products' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-cormorant text-4xl font-light text-white mb-1">Produits</h1>
                  <p className="text-sm text-[var(--gray-3)]">{products.length} produit(s) dans le catalogue</p>
                </div>
                <button
                  onClick={() => setTab('add')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs font-semibold tracking-widest uppercase rounded transition-colors"
                >
                  <PlusCircle size={14} />
                  Ajouter
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-[var(--dark-2)] border border-white/5 rounded-xl overflow-hidden group">
                    <div className="relative h-40 bg-[var(--dark-3)]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0 mr-2">
                        <p className="text-[10px] tracking-widest uppercase text-[var(--gray-3)] mb-0.5">{product.category}</p>
                        <p className="text-sm text-[var(--light)] truncate">{product.name}</p>
                        <p className="text-[var(--gold)] text-sm mt-0.5">{product.price.toFixed(2)} €</p>
                      </div>
                      <button
                        onClick={() => {
                          removeProduct(product.id);
                          showToast('Produit supprimé', 'error');
                        }}
                        className="flex-shrink-0 p-2 text-[var(--gray-2)] hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADD PRODUCT FORM */}
          {tab === 'add' && (
            <div className="animate-fade-in max-w-xl">
              <h1 className="font-cormorant text-4xl font-light text-white mb-2">Nouveau Produit</h1>
              <p className="text-sm text-[var(--gray-3)] mb-8">Le produit sera immédiatement visible dans la boutique.</p>

              <form onSubmit={handleAddProduct} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[var(--gray-3)] mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Veste en cuir premium"
                    className="w-full px-4 py-3 bg-[var(--dark-2)] border border-[var(--gray-1)] focus:border-[var(--gold)] text-[var(--light)] text-sm rounded outline-none transition-colors placeholder:text-[var(--gray-2)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[var(--gray-3)] mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez le produit..."
                    className="w-full px-4 py-3 bg-[var(--dark-2)] border border-[var(--gray-1)] focus:border-[var(--gold)] text-[var(--light)] text-sm rounded outline-none transition-colors placeholder:text-[var(--gray-2)] resize-none"
                  />
                </div>

                {/* Price + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[var(--gray-3)] mb-2">
                      Prix (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="99.00"
                      className="w-full px-4 py-3 bg-[var(--dark-2)] border border-[var(--gray-1)] focus:border-[var(--gold)] text-[var(--light)] text-sm rounded outline-none transition-colors placeholder:text-[var(--gray-2)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[var(--gray-3)] mb-2">
                      Catégorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--dark-2)] border border-[var(--gray-1)] focus:border-[var(--gold)] text-[var(--light)] text-sm rounded outline-none transition-colors"
                    >
                      <option>Vêtements</option>
                      <option>Accessoires</option>
                      <option>Chaussures</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[var(--gray-3)] mb-2">
                    URL Image
                  </label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 bg-[var(--dark-2)] border border-[var(--gray-1)] focus:border-[var(--gold)] text-[var(--light)] text-sm rounded outline-none transition-colors placeholder:text-[var(--gray-2)]"
                  />
                  <p className="text-xs text-[var(--gray-2)] mt-1">Laissez vide pour une image par défaut</p>
                </div>

                {/* Featured */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, featured: !form.featured })}
                    className={`w-10 h-5 rounded-full transition-colors ${form.featured ? 'bg-[var(--gold)]' : 'bg-[var(--gray-1)]'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-[var(--gray-4)]">Afficher en produit phare</span>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={formSuccess}
                    className="flex-1 py-3.5 bg-[var(--gold)] hover:bg-[var(--gold-light)] disabled:opacity-70 text-[var(--dark)] text-sm font-semibold tracking-widest uppercase rounded transition-colors"
                  >
                    {formSuccess ? '✓ Créé !' : 'Créer le produit'}
                  </button>
                  <button
                    type="reset"
                    onClick={() => setForm({ name: '', description: '', price: '', image: '', category: 'Vêtements', featured: false })}
                    className="px-6 py-3.5 border border-[var(--gray-1)] text-[var(--gray-3)] hover:text-white hover:border-white text-sm rounded transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
