'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import {
  Loader2, Package, RotateCcw, LogOut, Ticket,
  Truck, CheckCircle2, Clock, AlertCircle, Copy
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
  refunded: boolean;
  product: { id: string; name: string; images: string[] };
  variant?: { size: string | null; color: string | null } | null;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  tva: number;
  paymentMethod?: string;
  shippingAddress?: string;
  trackingNumber?: string | null;
  refundStatus?: string | null;
  creditCode?: string | null;
  creditUsed?: number | null;
  source: string;
  items: OrderItem[];
}

interface StoreCredit {
  id: string;
  code: string;
  amount: number;
  remaining: number;
  isActive: boolean;
  expiresAt: string | null;
  reason: string;
}

interface RefundRequest {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  createdAt: string;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'En attente': { bg: 'bg-amber-100 text-amber-700', text: 'En attente', icon: <Clock size={12} /> },
    'Confirmée':  { bg: 'bg-blue-100 text-blue-700',  text: 'Confirmée',  icon: <CheckCircle2 size={12} /> },
    'Expédiée':   { bg: 'bg-purple-100 text-purple-700', text: 'Expédiée', icon: <Truck size={12} /> },
    'Terminée':   { bg: 'bg-green-100 text-green-700', text: 'Terminée',  icon: <CheckCircle2 size={12} /> },
  };
  const s = map[status] || { bg: 'bg-[var(--bg-alt)] text-[var(--text-muted)]', text: status, icon: null };
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-xs ${s.bg}`}>
      {s.icon}{s.text}
    </span>
  );
}

function RefundBadge({ refundStatus }: { refundStatus?: string | null }) {
  if (!refundStatus) return null;
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-xs bg-orange-100 text-orange-700">
      <RotateCcw size={12} />
      {refundStatus === 'full' ? 'Remboursé' : 'Remb. partiel'}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'credits'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login?redirect=/account'); return; }
      setUser(session.user);
      try {
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [oRes, cRes, rRes] = await Promise.all([
          fetch('/api/account/orders', { headers }),
          fetch('/api/account/credits', { headers }),
          fetch('/api/account/refunds', { headers }),
        ]);
        if (oRes.ok) setOrders(await oRes.json());
        if (cRes.ok) setCredits(await cRes.json());
        if (rRes.ok) setRefunds(await rRes.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [router, supabase.auth]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copié !', 'success');
  };

  const submitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderId || !refundReason) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ orderId: refundOrderId, reason: refundReason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Demande de retour envoyée avec succès', 'success');
        setRefunds([data, ...refunds]);
        setRefundOrderId(null);
        setRefundReason('');
      } else {
        showToast(data.error || 'Erreur lors de la demande', 'error');
      }
    } catch { showToast('Erreur réseau', 'error'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[var(--bg-main)]">
      <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row gap-10">

        {/* ── Sidebar ── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-[var(--border-soft)] mb-6 sticky top-28">
            <h2 className="font-cormorant text-2xl font-medium mb-1">Mon Compte</h2>
            <p className="text-xs text-[var(--text-muted)] truncate mb-6">{user?.email}</p>
            <nav className="flex flex-col gap-2">
              <button onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors text-left ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-[var(--bg-alt)]'}`}>
                <Package size={16} /> Mes Commandes
                {orders.length > 0 && <span className="ml-auto text-[10px] font-bold">{orders.length}</span>}
              </button>
              <button onClick={() => setActiveTab('credits')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors text-left ${activeTab === 'credits' ? 'bg-black text-white' : 'hover:bg-[var(--bg-alt)]'}`}>
                <Ticket size={16} /> Mes Avoirs
                {credits.filter(c => c.isActive).length > 0 && (
                  <span className="ml-auto text-[10px] font-bold">{credits.filter(c => c.isActive).length}</span>
                )}
              </button>
            </nav>
            <div className="mt-8 pt-6 border-t border-[var(--border-soft)]">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-sm transition-colors w-full text-left">
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">

          {/* ═══ TAB: COMMANDES ═══ */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h1 className="font-cormorant text-4xl font-light mb-8">Historique des commandes</h1>

              {orders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-sm border border-[var(--border-soft)]">
                  <Package size={32} className="mx-auto mb-4 text-[var(--text-muted)]" strokeWidth={1} />
                  <p className="text-[var(--text-muted)]">Vous n&apos;avez passé aucune commande.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const refundReq = refunds.find(r => r.orderId === order.id);
                    const isExpanded = expandedOrder === order.id;
                    const hasTracking = !!order.trackingNumber;

                    return (
                      <div key={order.id} className="bg-white rounded-sm shadow-sm border border-[var(--border-soft)] overflow-hidden">

                        {/* ─ Header cliquable ─ */}
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="w-full flex flex-wrap items-center justify-between p-6 gap-4 text-left hover:bg-[var(--bg-alt)] transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <p className="font-mono text-xs font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                              {new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={order.status} />
                            <RefundBadge refundStatus={order.refundStatus} />
                            {hasTracking && (
                              <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-xs bg-green-100 text-green-700">
                                <Truck size={12} /> Suivi disponible
                              </span>
                            )}
                            <span className="font-medium text-sm">{order.total.toFixed(2)} €</span>
                          </div>
                        </button>

                        {/* ─ Détails dépliables ─ */}
                        {isExpanded && (
                          <div className="border-t border-[var(--border-soft)] p-6 space-y-6">

                            {/* Numéro de suivi */}
                            {hasTracking && (
                              <div className="p-4 bg-green-50 border border-green-200 rounded-sm flex items-start gap-4">
                                <Truck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-[10px] uppercase tracking-widest font-medium text-green-700 mb-1">Numéro de suivi</p>
                                  <p className="font-mono text-sm font-medium text-green-800">{order.trackingNumber}</p>
                                  <button
                                    onClick={() => copyToClipboard(order.trackingNumber!)}
                                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium text-green-600 hover:text-green-800 mt-2 transition-colors"
                                  >
                                    <Copy size={10} /> Copier
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Adresse de livraison */}
                            {order.shippingAddress && (
                              <div className="p-4 bg-[var(--bg-alt)] rounded-sm border border-[var(--border-soft)]">
                                <p className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-1">Adresse de livraison</p>
                                <p className="text-sm">{order.shippingAddress}</p>
                              </div>
                            )}

                            {/* Mode de paiement & avoir utilisé */}
                            <div className="flex flex-wrap gap-3">
                              {order.paymentMethod && (
                                <div className="px-3 py-2 bg-[var(--bg-alt)] rounded-xs border border-[var(--border-soft)]">
                                  <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Paiement</p>
                                  <p className="text-xs font-medium capitalize">{order.paymentMethod.toLowerCase()}</p>
                                </div>
                              )}
                              {order.creditCode && order.creditUsed && order.creditUsed > 0 && (
                                <div className="px-3 py-2 bg-purple-50 rounded-xs border border-purple-200">
                                  <p className="text-[9px] uppercase tracking-widest text-purple-600 mb-0.5">Avoir utilisé</p>
                                  <p className="text-xs font-medium text-purple-800 font-mono">{order.creditCode} (-{order.creditUsed.toFixed(2)} €)</p>
                                </div>
                              )}
                              {order.refundStatus && (
                                <div className="px-3 py-2 bg-orange-50 rounded-xs border border-orange-200">
                                  <p className="text-[9px] uppercase tracking-widest text-orange-600 mb-0.5">Remboursement</p>
                                  <p className="text-xs font-medium text-orange-800">
                                    {order.refundStatus === 'full' ? 'Commande entièrement remboursée' : 'Remboursement partiel'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Articles */}
                            <div>
                              <p className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-3">Articles commandés</p>
                              <div className="flex flex-col gap-3">
                                {order.items.map(item => {
                                  const imageUrl = item.product.images?.[0];
                                  const size = item.variant?.size || item.size;
                                  const color = item.variant?.color || item.color;
                                  return (
                                    <div key={item.id} className={`flex gap-4 items-center p-3 rounded-sm border ${item.refunded ? 'opacity-50 bg-[var(--bg-alt)] border-[var(--border-soft)]' : 'border-transparent hover:bg-[var(--bg-alt)]'}`}>
                                      <div className="w-12 h-16 relative flex-shrink-0 bg-[var(--bg-alt)] rounded-xs overflow-hidden">
                                        {imageUrl ? (
                                          <Image src={imageUrl} alt={item.product.name} fill className="object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[7px] text-[var(--text-muted)] uppercase tracking-widest text-center">Sans image</div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
                                          Qté: {item.quantity}
                                          {size && ` • Taille: ${size}`}
                                          {color && ` • Couleur: ${color}`}
                                          {item.refunded && ' • Remboursé'}
                                        </p>
                                      </div>
                                      <p className="text-sm font-medium flex-shrink-0">{(item.price * item.quantity).toFixed(2)} €</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Totaux */}
                            <div className="pt-4 border-t border-[var(--border-soft)] space-y-1.5">
                              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                                <span>Sous-total</span><span>{order.subtotal.toFixed(2)} €</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-xs text-red-500 font-medium">
                                  <span>Remise / Avoir</span><span>-{order.discount.toFixed(2)} €</span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium text-base pt-2 border-t border-[var(--border-soft)]">
                                <span>Total</span><span>{order.total.toFixed(2)} €</span>
                              </div>
                            </div>

                            {/* SAV / Demande de retour */}
                            <div className="pt-4 border-t border-[var(--border-soft)]">
                              {refundReq ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-orange-600">
                                  <AlertCircle size={14} />
                                  Demande SAV envoyée — Statut : <span className="font-bold capitalize">{refundReq.status}</span>
                                </div>
                              ) : order.status !== 'En attente' && order.refundStatus !== 'full' ? (
                                <button
                                  onClick={() => setRefundOrderId(refundOrderId === order.id ? null : order.id)}
                                  className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] hover:text-black transition-colors underline"
                                >
                                  Demander un retour / SAV
                                </button>
                              ) : null}

                              {refundOrderId === order.id && (
                                <form onSubmit={submitRefundRequest} className="mt-4 p-4 bg-[var(--bg-alt)] rounded-sm space-y-3">
                                  <h4 className="text-sm font-medium">Motif du retour</h4>
                                  <textarea
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    placeholder="Décrivez la raison de votre demande..."
                                    className="w-full px-4 py-3 text-sm bg-white rounded-sm outline-none border border-[var(--border-soft)] focus:border-black resize-none"
                                    rows={3}
                                    required
                                  />
                                  <div className="flex gap-3">
                                    <button type="submit" className="px-6 py-2 bg-black text-white text-xs font-medium uppercase tracking-widest rounded-sm">Envoyer</button>
                                    <button type="button" onClick={() => setRefundOrderId(null)} className="px-6 py-2 bg-white text-black text-xs font-medium uppercase tracking-widest border border-[var(--border-soft)] rounded-sm">Annuler</button>
                                  </div>
                                </form>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: AVOIRS ═══ */}
          {activeTab === 'credits' && (
            <div className="space-y-6">
              <h1 className="font-cormorant text-4xl font-light mb-8">Mes Avoirs</h1>

              {credits.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-sm border border-[var(--border-soft)]">
                  <Ticket size={32} className="mx-auto mb-4 text-[var(--text-muted)]" strokeWidth={1} />
                  <p className="text-[var(--text-muted)]">Vous n&apos;avez aucun avoir ou bon d&apos;achat en cours.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {credits.map(credit => (
                    <div key={credit.id} className="bg-white p-6 rounded-sm shadow-sm border border-[var(--border-soft)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Ticket size={100} />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <div>
                          <h3 className="text-3xl font-cormorant font-medium">{credit.remaining.toFixed(2)} €</h3>
                          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1">
                            Montant initial: {credit.amount.toFixed(2)} €
                            {credit.reason === 'refund' ? ' · Remboursement' : ' · Rendu de monnaie'}
                          </p>
                        </div>

                        <div className="bg-[var(--bg-alt)] p-3 rounded-sm border border-[var(--border-soft)] flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Code à utiliser au checkout</p>
                            <p className="font-mono text-sm font-medium">{credit.code}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(credit.code)}
                            className="p-2 text-[var(--text-muted)] hover:text-black rounded-sm hover:bg-white transition-colors flex-shrink-0"
                            title="Copier le code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-medium tracking-widest uppercase px-2 py-1 rounded-xs ${credit.isActive && credit.remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {credit.isActive && credit.remaining > 0 ? 'Actif' : 'Épuisé'}
                          </span>
                          {credit.expiresAt && (
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                              Expire le {new Date(credit.expiresAt).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
