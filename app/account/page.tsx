'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { Loader2, Package, RotateCcw, LogOut, Ticket } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
  product: { name: string; image: string; images: string[] };
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
}

interface StoreCredit {
  id: string;
  code: string;
  amount: number;
  remaining: number;
  isActive: boolean;
  expiresAt: string | null;
}

interface RefundRequest {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  createdAt: string;
}

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

  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/account');
        return;
      }
      setUser(session.user);

      try {
        const [ordersRes, creditsRes, refundsRes] = await Promise.all([
          fetch('/api/account/orders', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('/api/account/credits', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('/api/account/refunds', { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);

        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (creditsRes.ok) setCredits(await creditsRes.json());
        if (refundsRes.ok) setRefunds(await refundsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const submitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderId || !refundReason) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ orderId: refundOrderId, reason: refundReason })
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
    } catch (err) {
      showToast('Erreur réseau', 'error');
    }
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
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-[var(--border-soft)] mb-6">
            <h2 className="font-cormorant text-2xl font-medium mb-1">Mon Compte</h2>
            <p className="text-xs text-[var(--text-muted)] truncate mb-6">{user?.email}</p>
            
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors text-left ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-[var(--bg-alt)]'}`}
              >
                <Package size={16} /> Mes Commandes
              </button>
              <button 
                onClick={() => setActiveTab('credits')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors text-left ${activeTab === 'credits' ? 'bg-black text-white' : 'hover:bg-[var(--bg-alt)]'}`}
              >
                <Ticket size={16} /> Mes Avoirs
              </button>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-[var(--border-soft)]">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-sm transition-colors w-full text-left">
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h1 className="font-cormorant text-4xl font-light mb-8">Historique des commandes</h1>
              
              {orders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-sm border border-[var(--border-soft)]">
                  <p className="text-[var(--text-muted)]">Vous n'avez passé aucune commande.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => {
                    const refundReq = refunds.find(r => r.orderId === order.id);
                    return (
                      <div key={order.id} className="bg-white p-6 rounded-sm shadow-sm border border-[var(--border-soft)]">
                        <div className="flex flex-wrap justify-between items-center pb-4 border-b border-[var(--border-soft)] mb-6 gap-4">
                          <div>
                            <p className="font-mono text-xs font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1">
                              {new Date(order.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 bg-[var(--bg-alt)] rounded-xs">
                              {order.status}
                            </span>
                            <span className="font-medium">{order.total.toFixed(2)} €</span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          {order.items.map(item => (
                            <div key={item.id} className="flex gap-4 items-center">
                              <div className="w-12 h-16 bg-[var(--bg-alt)] rounded-xs overflow-hidden text-center flex items-center justify-center text-[8px] text-[var(--text-muted)]">
                                {item.product.images?.[0] || item.product.image ? 'Image' : 'Sans Image'}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.product.name}</p>
                                <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                  Qté: {item.quantity} {item.size && `• Taille: ${item.size}`} {item.color && `• Couleur: ${item.color}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-[var(--border-soft)] flex justify-between items-center">
                          {refundReq ? (
                            <span className="text-xs font-medium text-orange-600 flex items-center gap-2">
                              <RotateCcw size={14} /> SAV demandé ({refundReq.status})
                            </span>
                          ) : (
                            order.status !== 'En attente' && (
                              <button onClick={() => setRefundOrderId(order.id)} className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] hover:text-black transition-colors underline">
                                Demander un retour
                              </button>
                            )
                          )}
                        </div>

                        {/* Refund Form */}
                        {refundOrderId === order.id && (
                          <form onSubmit={submitRefundRequest} className="mt-6 p-4 bg-[var(--bg-alt)] rounded-sm">
                            <h4 className="text-sm font-medium mb-3">Motif du retour / SAV</h4>
                            <textarea 
                              value={refundReason}
                              onChange={e => setRefundReason(e.target.value)}
                              placeholder="Veuillez décrire la raison de votre demande..."
                              className="w-full px-4 py-3 text-sm rounded-sm outline-none border border-transparent focus:border-[var(--border-soft)] resize-none mb-3"
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <h1 className="font-cormorant text-4xl font-light mb-8">Mes Avoirs</h1>
              
              {credits.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-sm border border-[var(--border-soft)]">
                  <p className="text-[var(--text-muted)]">Vous n'avez aucun avoir ou bon d'achat en cours.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {credits.map(credit => (
                    <div key={credit.id} className="bg-white p-6 rounded-sm shadow-sm border border-[var(--border-soft)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Ticket size={100} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-cormorant font-medium mb-1">{credit.remaining.toFixed(2)} €</h3>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-6">Montant initial: {credit.amount.toFixed(2)} €</p>
                        
                        <div className="bg-[var(--bg-alt)] p-3 rounded-sm mb-4 border border-[var(--border-soft)]">
                          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Code promo</p>
                          <p className="font-mono text-sm font-medium">{credit.code}</p>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <span className={`text-[10px] font-medium tracking-widest uppercase px-2 py-1 rounded-xs ${credit.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {credit.isActive ? 'Actif' : 'Inactif'}
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
