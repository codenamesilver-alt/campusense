import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';

export default function SearchExpense() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    expenseHead: '',
    amountMin: '',
    amountMax: '',
    payeeName: '',
    paymentMode: '',
    keyword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, filters]);

  const loadData = async () => {
    try {
      const [expenseData, headData] = await Promise.all([
        fetchAll('Expense', '-created_date'),
        base44.entities.ExpenseHead.list()
      ]);
      setExpenses(expenseData);
      setFilteredExpenses(expenseData);
      setExpenseHeads(headData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = expenses;

    if (filters.dateFrom) filtered = filtered.filter(e => new Date(e.date_of_expense || e.date) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(e => new Date(e.date_of_expense || e.date) <= new Date(filters.dateTo));
    if (filters.expenseHead) filtered = filtered.filter(e => (e.expense_head_name || e.expense_head) === filters.expenseHead);
    if (filters.amountMin) filtered = filtered.filter(e => Number(e.amount) >= parseFloat(filters.amountMin));
    if (filters.amountMax) filtered = filtered.filter(e => Number(e.amount) <= parseFloat(filters.amountMax));
    if (filters.payeeName) filtered = filtered.filter(e => (e.paid_by_name || e.paid_by || '').toLowerCase().includes(filters.payeeName.toLowerCase()));
    if (filters.paymentMode) filtered = filtered.filter(e => (e.payment_mode || e.payment_method) === filters.paymentMode);
    if (filters.keyword) filtered = filtered.filter(e => (e.description || '').toLowerCase().includes(filters.keyword.toLowerCase()));

    setFilteredExpenses(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };
  
  const handleSelectFilterChange = (name, value) => {
    setFilters(prev => ({...prev, [name]: value}));
  };

  const exportData = (formatType) => {
    if (formatType === 'csv') {
      const csvData = filteredExpenses.map(expense => ({
        'Receipt No': expense.reference || expense.id,
        'Date': format(new Date(expense.date_of_expense || expense.date), 'dd/MM/yyyy'),
        'Expense Head': expense.expense_head_name || expense.expense_head,
        'Amount': expense.amount,
        'Payment Mode': expense.payment_mode || expense.payment_method,
        'Payee/Vendor': expense.paid_by_name || expense.paid_by,
        'Description': expense.description
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (formatType === 'pdf') {
      const printWindow = window.open('', '_blank');
      const htmlContent = `
        <html>
          <head>
            <title>Expense Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>Expense Report</h1>
            <p>Generated on: ${format(new Date(), 'dd/MM/yyyy')}</p>
            <table>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Expense Head</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Payee/Vendor</th>
                </tr>
              </thead>
              <tbody>
                ${filteredExpenses.map(expense => `
                  <tr>
                    <td>${expense.reference || expense.id}</td>
                    <td>${format(new Date(expense.date_of_expense || expense.date), 'dd/MM/yyyy')}</td>
                    <td>${expense.expense_head_name || expense.expense_head}</td>
                    <td>₹${(expense.amount || 0).toLocaleString('en-IN')}</td>
                    <td>${(expense.payment_mode || expense.payment_method || 'N/A').toUpperCase()}</td>
                    <td>${expense.paid_by_name || expense.paid_by}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="margin-top: 20px;"><strong>Total: ₹${filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('en-IN')}</strong></p>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printData = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Expenses</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} placeholder="From Date" />
          <Input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} placeholder="To Date" />
          <Select name="expenseHead" onValueChange={(v) => handleSelectFilterChange('expenseHead', v)}>
            <SelectTrigger><SelectValue placeholder="Select Expense Head" /></SelectTrigger>
            <SelectContent>{expenseHeads.map(h => <SelectItem key={h.id} value={h.name}>{h.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select name="paymentMode" onValueChange={(v) => handleSelectFilterChange('paymentMode', v)}>
            <SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Min Amount" type="number" name="amountMin" value={filters.amountMin} onChange={handleFilterChange} />
          <Input placeholder="Max Amount" type="number" name="amountMax" value={filters.amountMax} onChange={handleFilterChange} />
          <Input placeholder="Payee/Vendor Name" name="payeeName" value={filters.payeeName} onChange={handleFilterChange} />
          <Input placeholder="Keyword in Remarks" name="keyword" value={filters.keyword} onChange={handleFilterChange} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expense Records</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportData('csv')}><FileText className="mr-2 h-4 w-4" /> Excel</Button>
              <Button variant="outline" onClick={() => exportData('pdf')}><Download className="mr-2 h-4 w-4" /> PDF</Button>
              <Button variant="outline" onClick={printData}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Payee/Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Bill/Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.reference || expense.id}</TableCell>
                  <TableCell>{format(new Date(expense.date_of_expense || expense.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{expense.expense_head_name || expense.expense_head}</TableCell>
                  <TableCell>₹{(expense.amount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell><Badge variant="secondary">{(expense.payment_mode || expense.payment_method || 'N/A').toUpperCase()}</Badge></TableCell>
                  <TableCell>{expense.paid_by_name || expense.paid_by || 'N/A'}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    {(expense.receipt_url || expense.attachment_url || expense.reference) && (
                      <a href={expense.receipt_url || expense.attachment_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="link" size="sm">View</Button>
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}