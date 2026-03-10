import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Receipt, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { mockWallet, mockTransactions, formatCurrency, formatDate } from '@/services/mockData';

const WalletHome = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="px-4 py-6 safe-top">
      <h1 className="font-display text-xl font-bold text-foreground mb-6">Wallet</h1>

      {/* Balance */}
      <div className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-80">Available Balance</p>
          <button onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff className="h-4 w-4 opacity-80" /> : <Eye className="h-4 w-4 opacity-80" />}
          </button>
        </div>
        <p className="mt-1 text-3xl font-bold">
          {showBalance ? formatCurrency(mockWallet.available) : '••••••••'}
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Plus, label: 'Fund', path: '/wallet/fund' },
          { icon: ArrowUpRight, label: 'Transfer', path: '/wallet/transfer' },
          { icon: Receipt, label: 'Pay Bills', path: '/wallet/bills' },
        ].map((a, i) => (
          <Button key={i} variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate(a.path)}>
            <a.icon className="h-5 w-5" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>

      {/* Transactions */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-bold">Recent Transactions</h2>
        <button onClick={() => navigate('/wallet/history')} className="text-xs font-medium text-accent">See All</button>
      </div>
      <div className="space-y-2">
        {mockTransactions.slice(0, 8).map(tx => (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tx.type === 'credit' ? 'bg-success/10' : 'bg-muted'}`}>
              {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
              <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
            </div>
            <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-success' : 'text-foreground'}`}>
              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletHome;
