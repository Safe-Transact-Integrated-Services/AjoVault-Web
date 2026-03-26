import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  adminTransactionsKeys,
  getAdminTransactions,
  type AdminTransactionListItem,
} from '@/services/adminTransactionsApi';
import { Eye, Filter, LoaderCircle, MoreHorizontal, Search } from 'lucide-react';

const statusColor: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  failed: 'bg-destructive/10 text-destructive',
  reversed: 'bg-muted text-muted-foreground',
};

const channelColor: Record<string, string> = {
  app: 'bg-accent/10 text-accent',
  agent: 'bg-warning/10 text-warning',
};

const formatLabel = (value: string) => value.replaceAll('_', ' ');

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const displayContact = (value?: string | null) => value?.trim() || 'N/A';

const AdminTransactions = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<AdminTransactionListItem | null>(null);

  const transactionsQuery = useQuery({
    queryKey: adminTransactionsKeys.list(),
    queryFn: () => getAdminTransactions(),
  });

  const transactions = transactionsQuery.data?.items ?? [];

  const availableTypes = useMemo(
    () => ['all', ...Array.from(new Set(transactions.map(tx => tx.type))).sort()],
    [transactions],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return transactions.filter(tx => {
      const matchesSearch = !term || [
        tx.senderName,
        tx.senderPhone ?? '',
        tx.recipientName,
        tx.recipientPhone ?? '',
        tx.reference,
        tx.description,
      ].join(' ').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, transactions, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Transaction Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          {transactionsQuery.data?.totalCount ?? 0} platform transactions
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by sender, recipient, contact, reference, or description..."
            className="pl-9"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter === 'all' ? 'Status' : formatLabel(statusFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['all', 'completed', 'pending', 'failed', 'reversed'].map(status => (
                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)} className="capitalize">
                  {formatLabel(status)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {typeFilter === 'all' ? 'Type' : formatLabel(typeFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableTypes.map(type => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)} className="capitalize">
                  {formatLabel(type)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {transactionsQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading transactions...
          </CardContent>
        </Card>
      ) : null}

      {transactionsQuery.isError ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {getApiErrorMessage(transactionsQuery.error, 'Unable to load platform transactions.')}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && !transactionsQuery.isLoading ? (
            <div className="p-4">
              <EmptyTableState
                title="No transactions to show"
                description="There is no transaction data for the current filters yet. Adjust the filters or check back after activity starts."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 font-medium text-muted-foreground">Reference</th>
                    <th className="p-4 font-medium text-muted-foreground">Type</th>
                    <th className="hidden p-4 font-medium text-muted-foreground md:table-cell">Sender</th>
                    <th className="hidden p-4 font-medium text-muted-foreground md:table-cell">Recipient</th>
                    <th className="hidden p-4 font-medium text-muted-foreground lg:table-cell">Channel</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tx => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-foreground">{tx.reference}</td>
                      <td className="p-4 capitalize text-muted-foreground">{formatLabel(tx.type)}</td>
                      <td className="hidden p-4 md:table-cell">
                        <p className="text-foreground">{tx.senderName}</p>
                        <p className="text-xs text-muted-foreground">{displayContact(tx.senderPhone)}</p>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <p className="text-foreground">{tx.recipientName}</p>
                        <p className="text-xs text-muted-foreground">{displayContact(tx.recipientPhone)}</p>
                      </td>
                      <td className="hidden p-4 lg:table-cell">
                        <Badge variant="outline" className={`border-0 text-[10px] ${channelColor[tx.channel] ?? channelColor.app}`}>
                          {tx.channel}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium text-foreground">
                        {tx.currency}{tx.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[tx.status] ?? statusColor.pending}`}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTx(tx)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx ? (
            <div className="space-y-3">
              {[
                ['Reference', selectedTx.reference],
                ['Type', formatLabel(selectedTx.type)],
                ['Sender', `${selectedTx.senderName} (${displayContact(selectedTx.senderPhone)})`],
                ['Recipient', `${selectedTx.recipientName} (${displayContact(selectedTx.recipientPhone)})`],
                ['Amount', `${selectedTx.currency}${selectedTx.amount.toLocaleString()}`],
                ['Channel', selectedTx.channel],
                ['Status', selectedTx.status],
                ['Description', selectedTx.description],
                ['Date', dateFormatter.format(new Date(selectedTx.date))],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-right text-sm font-medium text-foreground capitalize">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactions;
