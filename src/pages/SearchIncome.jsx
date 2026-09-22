import { useState, useEffect } from 'react';
import { Income } from '@/entities/Income';
import { IncomeHead } from '@/entities/IncomeHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';

export default function SearchIncome() {
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [incomeHeads, setIncomeHeads] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    incomeHead: '',
    amountMin: '',
    amountMax: '',
    payerName: '',
    paymentMode: '',
    keyword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [incomes, filters]);

  const loadData = async () => {
    try {
      const [incomeData, headData] = await Promise.all([
        Income.list('-created_date'),
        IncomeHead.list()
      ]);
      setIncomes(incomeData);
      setFilteredIncomes(incomeData);
      setIncomeHeads(headData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = incomes;

    if (filters.dateFrom) filtered = filtered.filter(i => new Date(i.date_of_transaction || i.date) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(i => new Date(i.date_of_transaction || i.date) <= new Date(filters.dateTo));
    if (filters.incomeHead) filtered = filtered.filter(i => (i.income_head_name || i.income_head) === filters.incomeHead);
    if (filters.amountMin) filtered = filtered.filter(i => Number(i.amount) >= parseFloat(filters.amountMin));
    if (filters.amountMax) filtered = filtered.filter(i => Number(i.amount) <= parseFloat(filters.amountMax));
    if (filters.payerName) filtered = filtered.filter(i => (i.payer_name || i.received_by || '').toLowerCase().includes(filters.payerName.toLowerCase()));
    if (filters.paymentMode) filtered = filtered.filter(i => (i.payment_mode || i.payment_method) === filters.paymentMode);
    if (filters.keyword) filtered = filtered.filter(i => (i.description || '').toLowerCase().includes(filters.keyword.toLowerCase()));

    setFilteredIncomes(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };
  
  const handleSelectFilterChange = (name, value) => {
    setFilters(prev => ({...prev, [name]: value}));
  };

  const exportData = (formatType) => {
    // Logic for exporting data to Excel or PDF
    alert(`Exporting data as ${formatType}`);
  };

  const printData = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Income</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
          <Input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
          <Select name="incomeHead" onValueChange={(v) => handleSelectFilterChange('incomeHead', v)}>
            <SelectTrigger><SelectValue placeholder="Select Income Head" /></SelectTrigger>
            <SelectContent>{incomeHeads.map(h => <SelectItem key={h.id} value={h.name}>{h.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select name="paymentMode" onValueChange={(v) => handleSelectFilterChange('paymentMode', v)}>
            <SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Min Amount" type="number" name="amountMin" value={filters.amountMin} onChange={handleFilterChange} />
          <Input placeholder="Max Amount" type="number" name="amountMax" value={filters.amountMax} onChange={handleFilterChange} />
          <Input placeholder="Payer Name" name="payerName" value={filters.payerName} onChange={handleFilterChange} />
          <Input placeholder="Keyword in Remarks" name="keyword" value={filters.keyword} onChange={handleFilterChange} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Income Records</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportData('Excel')}><Download className="mr-2 h-4 w-4" /> Excel</Button>
              <Button variant="outline" onClick={() => exportData('PDF')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
              <Button variant="outline" onClick={printData}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncomes.map(income => (
                <TableRow key={income.id}>
                  <TableCell>{format(new Date(income.date_of_transaction || income.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{income.income_head_name || income.income_head}</TableCell>
                  <TableCell>₹{(income.amount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell><Badge variant="secondary">{(income.payment_mode || income.payment_method || 'N/A').toUpperCase()}</Badge></TableCell>
                  <TableCell>{income.payer_name || income.received_by || 'N/A'}</TableCell>
                  <TableCell>{income.description}</TableCell>
                  <TableCell>
                    {(income.receipt_url || income.reference) && (
                      <a href={income.receipt_url || income.reference} target="_blank" rel="noopener noreferrer">
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