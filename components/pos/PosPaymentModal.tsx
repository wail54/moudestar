'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

export type PaymentMethod = 'card' | 'cash' | 'avoir' | 'voucher';

interface Props {
  total: number;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, meta: PaymentMeta) => Promise<void>;
}

export interface PaymentMeta {
  cashGiven?: number;
  creditCode?: string;
  creditDiscount?: number;
  voucherAmount?: number;
  changeCredit?: { code: string; amount: number } | null;
  remainingAfterCredits?: number;
  finalMethod?: 'card' | 'cash';
}

export function PosPaymentModal({ total, onClose, onConfirm }: Props) {
  const { showToast } = useToast();
  const [step, setStep] = useState<'hybrid' | 'final'>('hybrid');

  // Hybrid inputs
  const [creditCode, setCreditCode] = useState('');
  const [creditDiscount, setCreditDiscount] = useState(0);
  const [creditValidated, setCreditValidated] = useState(false);
  const [voucherAmount, setVoucherAmount] = useState('');
  const [changeCredit, setChangeCredit] = useState<{ code: string; amount: number } | null>(null);
  const [hybridLoading, setHybridLoading] = useState(false);

  // Final payment
  const [finalMethod, setFinalMethod] = useState<'card' | 'cash'>('card');
  const [cashGiven, setCashGiven] = useState('');
  const [confirming, setConfirming] = useState(false);

  const voucher = parseFloat(voucherAmount) || 0;
  const remaining = Math.max(0, total - creditDiscount - voucher);
  const cashBack = Math.max(0, (parseFloat(cashGiven) || 0) - remaining);

  const validateCredit = async () => {
    if (!creditCode.trim()) return;
    setHybridLoading(true);
    try {
      const res = await fetch('/api/store-credits/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: creditCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        const disc = Math.min(total, data.remaining);
        setCreditDiscount(disc);
        setCreditValidated(true);
        showToast(`Avoir valide : -${disc.toFixed(2)} €`, 'success');
      } else {
        showToast(data.error || 'Code avoir invalide', 'error');
      }
    } finally {
      setHybridLoading(false);
    }
  };

  const applyHybrid = async () => {
    // If voucher > remaining after credit, generate change credit
    const afterCredit = total - creditDiscount;
    if (voucher > afterCredit && afterCredit >= 0) {
      setHybridLoading(true);
      try {
        const res = await fetch('/api/store-credits/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: creditValidated ? creditCode : undefined,
            voucherAmount: voucher,
            orderTotal: total,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.changeCredit) {
            setChangeCredit(data.changeCredit);
            showToast(`Avoir de monnaie généré : ${data.changeCredit.code}`, 'success');
          }
        }
      } finally {
        setHybridLoading(false);
      }
    }

    if (remaining <= 0) {
      // Fully paid by credits/voucher
      setConfirming(true);
      await onConfirm('avoir', {
        creditCode: creditValidated ? creditCode : undefined,
        creditDiscount,
        voucherAmount: voucher,
        changeCredit,
        remainingAfterCredits: 0,
      });
      setConfirming(false);
    } else {
      setStep('final');
    }
  };

  const handleFinalConfirm = async () => {
    if (finalMethod === 'cash' && (parseFloat(cashGiven) || 0) < remaining) return;
    setConfirming(true);
    await onConfirm(finalMethod, {
      cashGiven: finalMethod === 'cash' ? parseFloat(cashGiven) : undefined,
      creditCode: creditValidated ? creditCode : undefined,
      creditDiscount,
      voucherAmount: voucher,
      changeCredit,
      remainingAfterCredits: remaining,
      finalMethod,
    });
    setConfirming(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--border-soft)]">
          <h3 className="font-cormorant text-2xl font-light">
            {step === 'hybrid' ? 'Paiement' : 'Règlement final'}
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── STEP 1: Hybride ── */}
          {step === 'hybrid' && (
            <>
              {/* Total */}
              <div className="flex justify-between items-center py-3 border-b border-[var(--border-soft)]">
                <span className="text-sm font-medium text-[var(--text-muted)]">Total à régler</span>
                <span className="text-xl font-medium">{total.toFixed(2)} €</span>
              </div>

              {/* Code Avoir */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-2">
                  Code Avoir (optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={creditCode}
                    onChange={e => { setCreditCode(e.target.value.toUpperCase()); setCreditValidated(false); setCreditDiscount(0); }}
                    placeholder="AVOIR-XXXXXX"
                    disabled={creditValidated}
                    className="flex-1 px-3 py-2.5 text-sm bg-[var(--bg-alt)] border border-transparent focus:border-black rounded-sm outline-none uppercase disabled:opacity-50"
                  />
                  {!creditValidated ? (
                    <button
                      onClick={validateCredit}
                      disabled={!creditCode || hybridLoading}
                      className="px-4 py-2.5 bg-black text-white text-[10px] uppercase tracking-widest rounded-sm disabled:opacity-40"
                    >
                      Valider
                    </button>
                  ) : (
                    <div className="px-3 py-2.5 bg-green-50 rounded-sm border border-green-200 flex items-center gap-1.5 text-green-700 text-[10px] font-medium">
                      <CheckCircle2 size={14} /> -{creditDiscount.toFixed(2)} €
                    </div>
                  )}
                </div>
              </div>

              {/* Bon / Client en compte */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-2">
                  Bon / Client en compte (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={voucherAmount}
                  onChange={e => setVoucherAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 text-sm bg-[var(--bg-alt)] border border-transparent focus:border-black rounded-sm outline-none"
                />
                {voucher > 0 && voucher > (total - creditDiscount) && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1.5">
                    ⚠ Le bon excède le total. Un avoir de {(voucher - (total - creditDiscount)).toFixed(2)} € sera généré.
                  </p>
                )}
              </div>

              {/* Résumé */}
              {(creditDiscount > 0 || voucher > 0) && (
                <div className="p-3 bg-[var(--bg-alt)] rounded-sm space-y-1.5 text-xs">
                  {creditDiscount > 0 && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Avoir déduit</span><span>-{creditDiscount.toFixed(2)} €</span>
                    </div>
                  )}
                  {voucher > 0 && (
                    <div className="flex justify-between text-purple-700 font-medium">
                      <span>Bon</span><span>-{Math.min(voucher, total - creditDiscount).toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-sm pt-1 border-t border-[var(--border-soft)]">
                    <span>Reste à payer</span>
                    <span className={remaining <= 0 ? 'text-green-600' : ''}>{remaining.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <button
                onClick={applyHybrid}
                disabled={hybridLoading}
                className="btn-primary w-full py-4 rounded-sm disabled:opacity-50"
              >
                {hybridLoading ? 'Calcul...' : remaining <= 0 ? 'Valider (soldé)' : `Continuer → Payer ${remaining.toFixed(2)} €`}
              </button>
            </>
          )}

          {/* ── STEP 2: Règlement final ── */}
          {step === 'final' && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border-soft)]">
                <span className="text-sm font-medium text-[var(--text-muted)]">Reste à régler</span>
                <span className="text-xl font-medium">{remaining.toFixed(2)} €</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setFinalMethod('card')}
                  className={`flex-1 py-3 text-sm font-medium rounded-sm border transition-colors ${finalMethod === 'card' ? 'bg-black text-white border-black' : 'bg-white border-[var(--border-soft)] hover:border-black'}`}
                >
                  Carte (CB)
                </button>
                <button
                  onClick={() => setFinalMethod('cash')}
                  className={`flex-1 py-3 text-sm font-medium rounded-sm border transition-colors ${finalMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-[var(--border-soft)] hover:border-black'}`}
                >
                  Espèces
                </button>
              </div>

              {finalMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-2">
                      Montant remis (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value)}
                      placeholder={remaining.toFixed(2)}
                      className="w-full px-3 py-2.5 text-sm bg-[var(--bg-alt)] border border-transparent focus:border-black rounded-sm outline-none"
                    />
                  </div>
                  {(parseFloat(cashGiven) || 0) >= remaining && cashGiven && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-sm">
                      <p className="text-[10px] uppercase tracking-widest text-green-600 font-medium mb-1">Monnaie à rendre</p>
                      <p className="text-2xl font-medium text-green-800">{cashBack.toFixed(2)} €</p>
                    </div>
                  )}
                  {(parseFloat(cashGiven) || 0) > 0 && (parseFloat(cashGiven) || 0) < remaining && (
                    <p className="text-sm text-red-500 font-medium">Montant insuffisant</p>
                  )}
                </div>
              )}

              {changeCredit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs">
                  <p className="text-amber-700 font-medium uppercase tracking-widest text-[10px] mb-1">Avoir de monnaie généré</p>
                  <p className="font-mono font-medium">{changeCredit.code} — {changeCredit.amount.toFixed(2)} €</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('hybrid')}
                  className="px-4 py-3 text-sm border border-[var(--border-soft)] rounded-sm hover:bg-[var(--bg-alt)]"
                >
                  Retour
                </button>
                <button
                  onClick={handleFinalConfirm}
                  disabled={confirming || (finalMethod === 'cash' && (parseFloat(cashGiven) || 0) < remaining)}
                  className="flex-1 py-3 bg-black text-white text-sm font-medium rounded-sm disabled:opacity-40"
                >
                  {confirming ? 'Validation...' : 'Valider la vente'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
