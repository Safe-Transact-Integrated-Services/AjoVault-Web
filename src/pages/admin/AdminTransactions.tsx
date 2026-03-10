import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, MoreHorizontal, Eye, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockAdminTransactions, type AdminTransaction } from '@/services/adminMockData';
import { toast } from 'sonner';

const AdminTransactions = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);

  const filtered = mockAdminTransactions.filter(tx => {
    const matchesSearch = `${tx.senderName} ${tx.recipientName} ${tx.reference} ${tx.senderPhone}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusColor: Record<string, string> = {
    completed: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    failed: 'bg-destructive/10 text-destructive',
    reversed: 'bg-muted text-muted-foreground',
  };

  const channelColor: Record<string, string> = {
    app: 'bg-accent/10 text-accent',
    ussd: 'bg-primary/10 text-primary',
    agent: 'bg-warning/10 text-warning',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Transaction Monitoring</h1>
        <p className="text-sm text-muted-foreground">All platform transactions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or reference..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter === 'all' ? 'Status' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['all', 'completed', 'pending', 'failed', 'reversed'].map(s => (
                <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="capitalize">{s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {typeFilter === 'all' ? 'Type' : typeFilter.replace('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['all', 'transfer', 'fund', 'withdrawal', 'bill_payment', 'cash_in', 'cash_out'].map(t => (
                <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)} className="capitalize">{t.replace('_', ' ')}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground">Reference</th>
                  <th className="p-4 font-medium text-muted-foreground">Type</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Sender</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Recipient</th>
                  <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Channel</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-foreground">{tx.reference}</td>
                    <td className="p-4 capitalize text-muted-foreground">{tx.type.replace('_', ' ')}</td>
                    <td className="p-4 text-foreground hidden md:table-cell">{tx.senderName}</td>
                    <td className="p-4 text-foreground hidden md:table-cell">{tx.recipientName}</td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge variant="outline" className={`border-0 text-[10px] ${channelColor[tx.channel]}`}>{tx.channel}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium text-foreground">{tx.currency}{tx.amount.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[tx.status]}`}>{tx.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedTx(tx)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                          {tx.status === 'completed' && (
                            <DropdownMenuItem onClick={() => toast.success(`Transaction ${tx.reference} reversed`)} className="text-destructive"><RotateCcw className="mr-2 h-4 w-4" />Reverse</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-3">
              {[
                ['Reference', selectedTx.reference],
                ['Type', selectedTx.type.replace('_', ' ')],
                ['Sender', `${selectedTx.senderName} (${selectedTx.senderPhone})`],
                ['Recipient', `${selectedTx.recipientName} (${selectedTx.recipientPhone})`],
                ['Amount', `${selectedTx.currency}${selectedTx.amount.toLocaleString()}`],
                ['Channel', selectedTx.channel],
                ['Status', selectedTx.status],
                ['Date', new Date(selectedTx.date).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground capitalize">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactions;
