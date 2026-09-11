import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, BarChart3, TrendingUp, IndianRupee, Users, Search, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { fetchAll } from '@/lib/fetchAll';

export default function FeeReports() {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [dues, setDues] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [searchedReceipt, setSearchedReceipt] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    class: 'all',
    section: 'all',
    paymentMode: 'all',
    academicYear: 'all'
  });
  const [reportData, setReportData] = useState({
    totalCollection: 0,
    totalDiscounts: 0,
    totalPending: 0,
    classWiseCollection: [],
    monthlyTrends: [],
    paymentModeBreakdown: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [updatingMode, setUpdatingMode] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    generateReportData();
  }, [transactions, students, discounts, dues, filters]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, studentsData, discountsData, duesData, classesData, sectionsData, sessionsData, settingsData] = await Promise.all([
        fetchAll('FeeTransaction', '-transaction_date'),
        fetchAll('Student'),
        fetchAll('StudentDiscount'),
        fetchAll('FeeDue'),
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name'),
        base44.entities.Session.list(),
        base44.entities.SchoolSetting.list()
      ]);
      
      setTransactions(transactionsData);
      setStudents(studentsData);
      setDiscounts(discountsData);
      setDues(duesData);
      setClasses(classesData);
      setSections(sectionsData);
      setSessions(sessionsData);
      setSchoolSettings(settingsData.length > 0 ? settingsData[0] : null);

      // Keep academicYear as 'all' by default so all transactions are visible
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReportData = () => {
    const filteredTransactions = filterTransactions();
    
    // Calculate totals
    const totalCollection = filteredTransactions.reduce((sum, t) => sum + t.net_amount, 0);
    const totalDiscounts = filteredTransactions.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
    const totalPending = dues.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.balance_amount, 0);

    // Class-wise collection
    const classWiseData = {};
    filteredTransactions.forEach(transaction => {
      const student = students.find(s => s.id === transaction.student_id);
      if (student) {
        const classKey = `Class ${student.class}`;
        classWiseData[classKey] = (classWiseData[classKey] || 0) + transaction.net_amount;
      }
    });

    const classWiseCollection = Object.entries(classWiseData).map(([class_name, amount]) => ({
      class: class_name,
      amount
    }));

    // Monthly trends
    const monthlyData = {};
    filteredTransactions.forEach(transaction => {
      const month = format(new Date(transaction.transaction_date), 'MMM yyyy');
      monthlyData[month] = (monthlyData[month] || 0) + transaction.net_amount;
    });

    const monthlyTrends = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));

    // Payment mode breakdown
    const paymentModeData = {};
    filteredTransactions.forEach(transaction => {
      const mode = transaction.payment_mode || 'Unknown';
      paymentModeData[mode] = (paymentModeData[mode] || 0) + transaction.net_amount;
    });

    const paymentModeBreakdown = Object.entries(paymentModeData).map(([mode, amount]) => ({
      mode: mode.charAt(0).toUpperCase() + mode.slice(1),
      amount,
      percentage: totalCollection > 0 ? ((amount / totalCollection) * 100).toFixed(1) : 0
    }));

    setReportData({
      totalCollection,
      totalDiscounts,
      totalPending,
      classWiseCollection,
      monthlyTrends,
      paymentModeBreakdown
    });
  };

  const filterTransactions = () => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transaction_date);
      const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;
      
      if (dateFrom && transactionDate < dateFrom) return false;
      if (dateTo && transactionDate > dateTo) return false;
      if (filters.paymentMode !== 'all' && transaction.payment_mode !== filters.paymentMode) return false;
      if (filters.academicYear && filters.academicYear !== 'all' && transaction.academic_year !== filters.academicYear) return false;
      
      if (filters.class !== 'all' || filters.section !== 'all') {
        const student = students.find(s => s.id === transaction.student_id);
        if (!student) return false;
        if (filters.class !== 'all' && student.class !== filters.class) return false;
        if (filters.section !== 'all' && student.section !== filters.section) return false;
      }
      
      return true;
    });
  };

  const handlePaymentModeChange = async (transaction, newMode) => {
    if (newMode === transaction.payment_mode) return;
    setUpdatingMode(transaction.id);
    try {
      await base44.entities.FeeTransaction.update(transaction.id, { payment_mode: newMode });
      setTransactions(prev =>
        prev.map(t => (t.id === transaction.id ? { ...t, payment_mode: newMode } : t))
      );
    } catch (error) {
      console.error('Error updating payment mode:', error);
      alert('Failed to update payment mode. Please try again.');
    } finally {
      setUpdatingMode(null);
    }
  };

  const searchReceipt = async () => {
    if (!receiptSearch.trim()) {
      alert('Please enter a receipt number');
      return;
    }

    try {
      const results = await base44.entities.FeeTransaction.filter({ receipt_number: receiptSearch.trim() });
      if (results.length > 0) {
        const transaction = results[0];
        const student = students.find(s => s.id === transaction.student_id);
        
        // Parse fee details
        let feesPaid = [];
        try {
          // Ensure fee_details is treated as an array, even if it's a stringified JSON array
          feesPaid = typeof transaction.fee_details === 'string' ? JSON.parse(transaction.fee_details) : transaction.fee_details;
        } catch (e) {
          console.error('Error parsing fee details:', e);
          feesPaid = [];
        }

        setSearchedReceipt({
          ...transaction,
          student,
          fees_paid: feesPaid
        });
      } else {
        alert('Receipt not found');
        setSearchedReceipt(null);
      }
    } catch (error) {
      console.error('Error searching receipt:', error);
      alert('Error searching for receipt');
    }
  };

  const printSearchedReceipt = () => {
    if (!searchedReceipt) return;

    const printWindow = window.open('', '_blank');
    const receiptHtml = `
      <html>
        <head>
          <title>Fee Receipt - ${searchedReceipt.receipt_number}</title>
          <style>
            @media print {
              @page { margin: 0.5cm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 15px;
              font-size: 11px;
            }
            .header-image { 
              text-align: center; 
              margin-bottom: 10px;
            }
            .header-image img {
              max-width: 100%;
              height: auto;
              max-height: 120px;
              display: block;
              margin: 0 auto;
            }
            .receipt-number {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 15px;
              padding: 5px;
              border: 1px solid #000;
            }
            .receipt-details { 
              margin-bottom: 15px;
              line-height: 1.4;
            }
            .receipt-details p {
              margin: 3px 0;
            }
            .fee-breakdown { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px;
              font-size: 10px;
            }
            .fee-breakdown th, .fee-breakdown td { 
              border: 1px solid #333; 
              padding: 5px; 
              text-align: left; 
            }
            .fee-breakdown th { 
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .total-section { 
              border-top: 2px solid #000; 
              padding-top: 8px;
              margin-top: 10px;
            }
            .total-section p {
              margin: 3px 0;
            }
            .system-note {
              margin-top: 20px;
              text-align: center;
              font-size: 9px;
              font-style: italic;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${schoolSettings?.header_image_url ? `
            <div class="header-image">
              <img src="${schoolSettings.header_image_url}" alt="School Header" onload="window.print();" />
            </div>
          ` : `
            <div style="text-align: center; margin-bottom: 15px;">
              <h2 style="margin: 5px 0;">${schoolSettings?.school_name || 'SCHOOL NAME'}</h2>
              <p style="margin: 3px 0; font-size: 10px;">${schoolSettings?.address || ''}</p>
              <p style="margin: 3px 0; font-size: 10px;">Phone: ${schoolSettings?.phone || ''} | Email: ${schoolSettings?.email || ''}</p>
            </div>
            <script>window.print();</script>
          `}
          
          <div class="receipt-number">
            FEE RECEIPT - ${searchedReceipt.receipt_number}
          </div>
          
          <div class="receipt-details">
            <p><strong>Date:</strong> ${format(new Date(searchedReceipt.transaction_date), 'dd/MM/yyyy')}</p>
            <p><strong>Student Name:</strong> ${searchedReceipt.student?.first_name || ''} ${searchedReceipt.student?.last_name || ''}</p>
            <p><strong>Admission No:</strong> ${searchedReceipt.student?.admission_number || ''}</p>
            <p><strong>Class:</strong> ${searchedReceipt.student?.class || ''}-${searchedReceipt.student?.section || ''}</p>
            <p><strong>Payment Mode:</strong> ${searchedReceipt.payment_mode.toUpperCase()}</p>
            ${searchedReceipt.payment_reference ? `<p><strong>Reference:</strong> ${searchedReceipt.payment_reference}</p>` : ''}
          </div>

          <table class="fee-breakdown">
            <thead>
              <tr>
                <th>Fee Description</th>
                <th>Due Date</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${searchedReceipt.fees_paid.map(fee => `
                <tr>
                  <td>${fee.fee_head_name}</td>
                  <td>${format(new Date(fee.due_date), 'dd/MM/yyyy')}</td>
                  <td style="text-align: right;">${fee.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <p><strong>Subtotal:</strong> ₹${searchedReceipt.total_amount.toFixed(2)}</p>
            ${searchedReceipt.discount_amount > 0 ? `<p><strong>Total Discount:</strong> -₹${searchedReceipt.discount_amount.toFixed(2)}</p>` : ''}
            <p style="font-size: 13px; font-weight: bold;"><strong>Total Amount Paid:</strong> ₹${searchedReceipt.net_amount.toFixed(2)}</p>
          </div>

          <div class="system-note">
            This is a system generated document and does not require any signature or stamp.
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const exportReport = (format) => {
    const filteredTransactions = filterTransactions();
    
    if (format === 'csv') {
      const csvData = filteredTransactions.map(transaction => {
        const student = students.find(s => s.id === transaction.student_id);
        return {
          'Receipt Number': transaction.receipt_number,
          'Date': transaction.transaction_date,
          'Student Name': student ? `${student.first_name} ${student.last_name}` : 'Unknown',
          'Class': student ? `${student.class}-${student.section}` : 'Unknown',
          'Payment Mode': transaction.payment_mode,
          'Total Amount': transaction.total_amount,
          'Discount': transaction.discount_amount || 0,
          'Net Amount': transaction.net_amount
        };
      });

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fee_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      const htmlContent = `
        <html>
          <head>
            <title>Fee Collection Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
              .summary-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Fee Collection Report</h1>
            <p>Report Period: ${filters.dateFrom || 'All Time'} to ${filters.dateTo || 'Present'}</p>
            
            <div class="summary">
              <div class="summary-card">
                <h3>Total Collection</h3>
                <h2>₹${reportData.totalCollection.toLocaleString('en-IN')}</h2>
              </div>
              <div class="summary-card">
                <h3>Total Discounts</h3>
                <h2>₹${reportData.totalDiscounts.toLocaleString('en-IN')}</h2>
              </div>
              <div class="summary-card">
                <h3>Pending Amount</h3>
                <h2>₹${reportData.totalPending.toLocaleString('en-IN')}</h2>
              </div>
            </div>

            <h2>Transaction Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Mode</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions.map(transaction => {
                  const student = students.find(s => s.id === transaction.student_id);
                  return `
                    <tr>
                      <td>${transaction.receipt_number}</td>
                      <td>${format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</td>
                      <td>${student ? `${student.first_name} ${student.last_name}` : 'Unknown'}</td>
                      <td>${student ? `${student.class}-${student.section}` : 'Unknown'}</td>
                      <td>${transaction.payment_mode ? transaction.payment_mode.toUpperCase() : 'N/A'}</td>
                      <td>₹${transaction.net_amount}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent + '<script>window.onload = function(){ window.print(); }<\/script>');
      printWindow.document.close();
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fee Reports & Analytics</h1>
          <p className="text-gray-500">Comprehensive fee collection reports and analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Receipt Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Reprint Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter receipt number (e.g., RCP00001)"
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchReceipt()}
              />
            </div>
            <Button onClick={searchReceipt}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>

          {searchedReceipt && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Receipt #{searchedReceipt.receipt_number}</h3>
                  <p className="text-sm text-gray-600">Date: {format(new Date(searchedReceipt.transaction_date), 'dd/MM/yyyy')}</p>
                  <p className="text-sm text-gray-600">
                    Student: ${searchedReceipt.student?.first_name} ${searchedReceipt.student?.last_name} (${searchedReceipt.student?.admission_number})
                  </p>
                  <p className="text-sm text-gray-600">Class: ${searchedReceipt.student?.class}-${searchedReceipt.student?.section}</p>
                  <p className="text-sm font-semibold mt-2">Amount: ₹{searchedReceipt.net_amount.toFixed(2)}</p>
                </div>
                <Button onClick={printSearchedReceipt}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={filters.class} onValueChange={(value) => setFilters(prev => ({...prev, class: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={filters.section} onValueChange={(value) => setFilters(prev => ({...prev, section: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={filters.paymentMode} onValueChange={(value) => setFilters(prev => ({...prev, paymentMode: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={filters.academicYear} onValueChange={(value) => setFilters(prev => ({...prev, academicYear: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.name}>
                      {session.name} {session.is_current ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <IndianRupee className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Collection</p>
                <p className="text-2xl font-bold text-green-600">₹{reportData.totalCollection.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Discounts</p>
                <p className="text-2xl font-bold text-blue-600">₹{reportData.totalDiscounts.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">₹{reportData.totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">{filterTransactions().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="class-wise">Class-wise</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Mode Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.paymentModeBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({mode, percentage}) => `${mode} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {reportData.paymentModeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="class-wise">
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Fee Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.classWiseCollection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount Collected</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.classWiseCollection.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.class}</TableCell>
                      <TableCell>₹{item.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {reportData.totalCollection > 0 ? 
                          ((item.amount / reportData.totalCollection) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Collection Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTransactions().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No transactions found for the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterTransactions().map((transaction) => {
                        const student = students.find(s => s.id === transaction.student_id);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.receipt_number}</TableCell>
                            <TableCell>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {student ? `${student.class}-${student.section}` : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={transaction.payment_mode}
                                disabled={updatingMode === transaction.id}
                                onValueChange={(value) => handlePaymentModeChange(transaction, value)}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="online">Online</SelectItem>
                                  <SelectItem value="cheque">Cheque</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="card">Card</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>₹{transaction.total_amount}</TableCell>
                            <TableCell className="text-green-600">₹{transaction.discount_amount || 0}</TableCell>
                            <TableCell className="font-medium">₹{transaction.net_amount}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}