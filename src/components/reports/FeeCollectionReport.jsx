import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { format } from 'date-fns';

const paymentModeLabel = {
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
  card: 'Card'
};

const paymentModeBadge = {
  cash: 'bg-green-100 text-green-800',
  cheque: 'bg-yellow-100 text-yellow-800',
  bank_transfer: 'bg-blue-100 text-blue-800',
  online: 'bg-purple-100 text-purple-800',
  card: 'bg-orange-100 text-orange-800'
};

export default function FeeCollectionReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both From and To dates.');
      return;
    }
    setLoading(true);
    setSearched(true);

    // Fetch all transactions and students in parallel
    const [transactions, students] = await Promise.all([
      fetchAll('FeeTransaction', '-transaction_date'),
      fetchAll('Student', 'first_name')
    ]);

    // Filter by date range
    const filtered = transactions.filter(t => {
      const d = t.transaction_date;
      return d >= fromDate && d <= toDate && t.status === 'completed';
    });

    // Build student map
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    // Build rows
    const result = filtered.map(t => {
      const student = studentMap[t.student_id] || {};
      let feeDetails = [];
      try {
        feeDetails = JSON.parse(t.fee_details || '[]');
      } catch {}
      const feesCollected = feeDetails.map(f => f.fee_head_name).filter(Boolean).join(', ') || '—';

      return {
        id: t.id,
        studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || '—',
        class: student.class || '—',
        section: student.section || '—',
        amount: t.net_amount,
        date: t.transaction_date,
        paymentMode: t.payment_mode,
        receiptNumber: t.receipt_number,
        feesCollected
      };
    });

    setRows(result);
    setLoading(false);
  };

  const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  const handleExport = () => {
    const headers = ['Student Name', 'Class', 'Section', 'Amount (₹)', 'Date', 'Payment Mode', 'Receipt No.', 'Fees Collected'];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.studentName}"`,
        r.class,
        r.section,
        r.amount.toFixed(2),
        r.date,
        paymentModeLabel[r.paymentMode] || r.paymentMode,
        r.receiptNumber,
        `"${r.feesCollected}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_collection_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Collection Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
            {rows.length > 0 && (
              <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {rows.length} Transaction{rows.length !== 1 ? 's' : ''} Found
              </CardTitle>
              {rows.length > 0 && (
                <div className="text-lg font-bold text-green-700">
                  Total Collected: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No fee collection records found for the selected date range.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Fees Collected</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-medium">{r.receiptNumber}</TableCell>
                        <TableCell>{format(new Date(r.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{r.studentName}</TableCell>
                        <TableCell>{r.class}</TableCell>
                        <TableCell>{r.section}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={r.feesCollected}>{r.feesCollected}</TableCell>
                        <TableCell>
                          <Badge className={paymentModeBadge[r.paymentMode] || 'bg-gray-100 text-gray-800'}>
                            {paymentModeLabel[r.paymentMode] || r.paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}