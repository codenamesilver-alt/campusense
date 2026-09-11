import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save, Download, Search, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

function buildPayslipHTML(staffMember, payrollData, monthLabel) {
  const totalDeductions = (Number(payrollData.pf_deduction) + Number(payrollData.tax_deduction) + Number(payrollData.other_deduction));
  return `
    <html>
      <head>
        <title>Payslip - ${staffMember.staff_name || (staffMember.first_name + ' ' + staffMember.last_name)}</title>
        <style>
          @media print { @page { margin: 0.5cm; size: A4; } }
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; background-color: #f2f2f2; padding: 5px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .net-salary { font-size: 16px; font-weight: bold; text-align: center; padding: 15px; background-color: #e8f5e9; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALARY SLIP</h1>
          <p>For the month of ${monthLabel}</p>
        </div>
        <div class="section">
          <div class="section-title">Employee Details</div>
          <table>
            <tr>
              <td><strong>Name:</strong></td><td>${staffMember.staff_name || (staffMember.first_name + ' ' + staffMember.last_name)}</td>
              <td><strong>Staff ID:</strong></td><td>${staffMember.staff_code || staffMember.staff_id}</td>
            </tr>
            <tr>
              <td><strong>Designation:</strong></td><td>${staffMember.designation || 'N/A'}</td>
              <td><strong>Department:</strong></td><td>${staffMember.department || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>PAN:</strong></td><td>${staffMember.pan_number || 'N/A'}</td>
              <td><strong>PF Number:</strong></td><td>${staffMember.pf_number || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Bank Account:</strong></td><td>${staffMember.bank_account_number || 'N/A'}</td>
              <td><strong>Bank Name:</strong></td><td>${staffMember.bank_name || 'N/A'}</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Salary Components</div>
          <table>
            <tr>
              <th>Earnings</th><th style="text-align:right;">Amount (₹)</th>
              <th>Deductions</th><th style="text-align:right;">Amount (₹)</th>
            </tr>
            <tr>
              <td>Basic Salary</td><td style="text-align:right;">${Number(payrollData.basic_salary).toFixed(2)}</td>
              <td>PF Deduction</td><td style="text-align:right;">${Number(payrollData.pf_deduction).toFixed(2)}</td>
            </tr>
            <tr>
              <td>HRA</td><td style="text-align:right;">${Number(payrollData.hra).toFixed(2)}</td>
              <td>Tax Deduction (TDS)</td><td style="text-align:right;">${Number(payrollData.tax_deduction).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Transport Allowance</td><td style="text-align:right;">${Number(payrollData.transport_allowance).toFixed(2)}</td>
              <td>Other Deductions</td><td style="text-align:right;">${Number(payrollData.other_deduction).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Other Allowance</td><td style="text-align:right;">${Number(payrollData.other_allowance).toFixed(2)}</td>
              <td></td><td></td>
            </tr>
            <tr class="total-row">
              <td>Gross Salary</td><td style="text-align:right;">₹${Number(payrollData.gross_salary).toFixed(2)}</td>
              <td>Total Deductions</td><td style="text-align:right;">₹${totalDeductions.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <div class="net-salary">
          NET SALARY: ₹${Number(payrollData.net_salary).toFixed(2)}
          <br><small>(Rupees ${Math.floor(Number(payrollData.net_salary)).toLocaleString('en-IN')} only)</small>
        </div>
        <p style="margin-top:30px;font-size:10px;text-align:center;color:#666;">
          This is a computer-generated payslip and does not require a signature.
        </p>
        <script>window.print();</script>
      </body>
    </html>`;
}

// ─── Enter Payroll Tab ────────────────────────────────────────────────────────
function EnterPayroll({ staff }) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollData, setPayrollData] = useState({
    basic_salary: 0, hra: 0, transport_allowance: 0, other_allowance: 0,
    gross_salary: 0, pf_deduction: 0, tax_deduction: 0, other_deduction: 0, net_salary: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  useEffect(() => {
    if (selectedStaff) {
      const s = staff.find(m => m.id === selectedStaff);
      if (s) {
        setPayrollData({
          basic_salary: s.basic_salary || 0, hra: s.hra || 0,
          transport_allowance: s.transport_allowance || 0,
          other_allowance: s.other_allowance || 0,
          gross_salary: s.gross_salary || 0, pf_deduction: s.pf_deduction || 0,
          tax_deduction: s.tax_deduction || 0, other_deduction: s.other_deduction || 0,
          net_salary: s.net_salary || 0
        });
      }
    }
  }, [selectedStaff]);

  useEffect(() => {
    const gross = +payrollData.basic_salary + +payrollData.hra + +payrollData.transport_allowance + +payrollData.other_allowance;
    const deductions = +payrollData.pf_deduction + +payrollData.tax_deduction + +payrollData.other_deduction;
    setPayrollData(prev => ({ ...prev, gross_salary: gross, net_salary: gross - deductions }));
  }, [payrollData.basic_salary, payrollData.hra, payrollData.transport_allowance, payrollData.other_allowance, payrollData.pf_deduction, payrollData.tax_deduction, payrollData.other_deduction]);

  const handleInput = (field, value) => setPayrollData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));

  const staffMember = staff.find(s => s.id === selectedStaff);

  const filteredStaff = staff.filter(s =>
    `${s.first_name} ${s.last_name} ${s.staff_id}`.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedStaff || !month) return alert('Please select a staff member and month');
    setIsLoading(true);
    setSavedMsg('');
    try {
      const [year] = month.split('-');
      const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy');
      const totalDeductions = +payrollData.pf_deduction + +payrollData.tax_deduction + +payrollData.other_deduction;

      const existing = await base44.entities.PayrollRecord.filter({ staff_id: selectedStaff, payroll_month: month });
      const record = {
        staff_id: selectedStaff,
        staff_name: `${staffMember.first_name} ${staffMember.last_name}`,
        staff_code: staffMember.staff_id,
        designation: staffMember.designation || '',
        department: staffMember.department || '',
        pan_number: staffMember.pan_number || '',
        pf_number: staffMember.pf_number || '',
        bank_account_number: staffMember.bank_account_number || '',
        bank_name: staffMember.bank_name || '',
        payroll_month: month,
        payroll_year: year,
        payroll_month_label: monthLabel,
        ...payrollData,
        total_deductions: totalDeductions,
        status: 'generated'
      };

      if (existing.length > 0) {
        await base44.entities.PayrollRecord.update(existing[0].id, record);
      } else {
        await base44.entities.PayrollRecord.create(record);
      }
      setSavedMsg('Payroll saved successfully!');
    } catch (e) {
      alert('Failed to save payroll.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePayslip = () => {
    if (!selectedStaff) return alert('Please select a staff member');
    const w = window.open('', '_blank');
    const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy');
    w.document.write(buildPayslipHTML(staffMember, payrollData, monthLabel));
    w.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/>Select Staff</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Month</Label>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <Input
              placeholder="Search staff..."
              value={staffSearch}
              onChange={e => setStaffSearch(e.target.value)}
            />
          </div>
          <div className="border rounded-lg overflow-y-auto max-h-72 divide-y">
            {filteredStaff.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No staff found</p>
            )}
            {filteredStaff.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStaff(s.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${selectedStaff === s.id ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-700'}`}
              >
                <p className="font-medium">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-gray-500">{s.staff_id} · {s.designation || 'N/A'}</p>
              </button>
            ))}
          </div>
          {savedMsg && <p className="text-green-600 text-sm font-medium">{savedMsg}</p>}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5"/>Payroll Details</CardTitle></CardHeader>
        <CardContent>
          {!selectedStaff ? (
            <div className="text-center py-12 text-gray-500">Please select a staff member to enter payroll details</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-700">Earnings</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[['basic_salary','Basic Salary'],['hra','HRA'],['transport_allowance','Transport Allowance'],['other_allowance','Other Allowance']].map(([field, label]) => (
                    <div key={field}>
                      <Label>{label}</Label>
                      <Input type="number" value={payrollData[field]} onChange={e => handleInput(field, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-red-700">Deductions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[['pf_deduction','PF Deduction'],['tax_deduction','Tax Deduction (TDS)'],['other_deduction','Other Deductions']].map(([field, label]) => (
                    <div key={field}>
                      <Label>{label}</Label>
                      <Input type="number" value={payrollData[field]} onChange={e => handleInput(field, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4 grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Gross Salary</p>
                  <p className="text-2xl font-bold text-green-700">₹{Number(payrollData.gross_salary).toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-700">₹{(+payrollData.pf_deduction + +payrollData.tax_deduction + +payrollData.other_deduction).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Net Salary</p>
                  <p className="text-2xl font-bold text-blue-700">₹{Number(payrollData.net_salary).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  <Save className="mr-2 h-4 w-4"/>{isLoading ? 'Saving...' : 'Save Payroll'}
                </Button>
                <Button variant="outline" onClick={handleGeneratePayslip} className="flex-1">
                  <Download className="mr-2 h-4 w-4"/>Generate & Print Payslip
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── View Payroll Tab ─────────────────────────────────────────────────────────
function ViewPayroll({ staff }) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState('');
  const [record, setRecord] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

  const filteredStaff = staff.filter(s =>
    `${s.first_name} ${s.last_name} ${s.staff_id}`.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const handleSearch = async () => {
    if (!selectedStaff || !selectedYear || !selectedMonth) return alert('Please select staff, year and month');
    setIsSearching(true);
    setRecord(null);
    setNotFound(false);
    try {
      const monthKey = `${selectedYear}-${selectedMonth}`;
      const results = await base44.entities.PayrollRecord.filter({ staff_id: selectedStaff, payroll_month: monthKey });
      if (results.length > 0) {
        setRecord(results[0]);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleView = () => {
    if (!record) return;
    const w = window.open('', '_blank');
    w.document.write(buildPayslipHTML(record, record, record.payroll_month_label));
    w.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/>Select Staff</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search staff..."
              value={staffSearch}
              onChange={e => setStaffSearch(e.target.value)}
            />
            <div className="border rounded-lg overflow-y-auto max-h-72 divide-y">
              {filteredStaff.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No staff found</p>
              )}
              {filteredStaff.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s.id); setRecord(null); setNotFound(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${selectedStaff === s.id ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-700'}`}
                >
                  <p className="font-medium">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-gray-500">{s.staff_id} · {s.designation || 'N/A'}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/>Search Payroll Record</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={v => { setSelectedYear(v); setRecord(null); setNotFound(false); }}>
                  <SelectTrigger><SelectValue placeholder="Select year"/></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={v => { setSelectedMonth(v); setRecord(null); setNotFound(false); }}>
                  <SelectTrigger><SelectValue placeholder="Select month"/></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="mr-2 h-4 w-4"/>{isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {notFound && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300"/>
            <p className="font-medium">No salary slip found</p>
            <p className="text-sm">No payroll record found for the selected staff, year and month.</p>
          </CardContent>
        </Card>
      )}

      {record && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5"/>
              Salary Slip — {record.payroll_month_label}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant={record.status === 'paid' ? 'default' : 'secondary'} className="capitalize">{record.status}</Badge>
              <Button onClick={handleView}>
                <Download className="mr-2 h-4 w-4"/>View & Download
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><p className="text-gray-500">Name</p><p className="font-semibold">{record.staff_name}</p></div>
              <div><p className="text-gray-500">Staff ID</p><p className="font-semibold">{record.staff_code}</p></div>
              <div><p className="text-gray-500">Designation</p><p className="font-semibold">{record.designation || '—'}</p></div>
              <div><p className="text-gray-500">Department</p><p className="font-semibold">{record.department || '—'}</p></div>
              <div><p className="text-gray-500">PAN Number</p><p className="font-semibold">{record.pan_number || '—'}</p></div>
              <div><p className="text-gray-500">PF Account No.</p><p className="font-semibold">{record.pf_number || '—'}</p></div>
              <div><p className="text-gray-500">Bank Name</p><p className="font-semibold">{record.bank_name || '—'}</p></div>
              <div><p className="text-gray-500">Account Number</p><p className="font-semibold">{record.bank_account_number || '—'}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3 border-b pb-1">Earnings</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {[['Basic Salary', record.basic_salary], ['HRA', record.hra], ['Transport Allowance', record.transport_allowance], ['Other Allowance', record.other_allowance]].map(([label, val]) => (
                      <tr key={label} className="border-b last:border-0">
                        <td className="py-2 text-gray-600">{label}</td>
                        <td className="py-2 text-right font-medium">₹{Number(val || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-green-700">
                      <td className="py-2">Gross Salary</td>
                      <td className="py-2 text-right">₹{Number(record.gross_salary || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-3 border-b pb-1">Deductions</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {[['PF Deduction', record.pf_deduction], ['Tax Deduction (TDS)', record.tax_deduction], ['Other Deductions', record.other_deduction]].map(([label, val]) => (
                      <tr key={label} className="border-b last:border-0">
                        <td className="py-2 text-gray-600">{label}</td>
                        <td className="py-2 text-right font-medium">₹{Number(val || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-red-700">
                      <td className="py-2">Total Deductions</td>
                      <td className="py-2 text-right">₹{Number(record.total_deductions || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-600 text-sm font-medium mb-1">Net Salary</p>
              <p className="text-4xl font-bold text-blue-700">₹{Number(record.net_salary || 0).toLocaleString()}</p>
              <p className="text-blue-500 text-sm mt-1">Generated on: {record.payroll_month_label}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Payroll() {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    base44.entities.Staff.list('-created_date', 500).then(data =>
      setStaff(data.filter(s => s.status !== 'inactive' && s.status !== 'terminated'))
    );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll Management</h1>
        <p className="text-gray-500">Manage staff salary and generate payslips</p>
      </div>

      <Tabs defaultValue="enter">
        <TabsList>
          <TabsTrigger value="enter">Enter Payroll</TabsTrigger>
          <TabsTrigger value="view">View Payroll</TabsTrigger>
        </TabsList>
        <TabsContent value="enter" className="mt-6">
          <EnterPayroll staff={staff} />
        </TabsContent>
        <TabsContent value="view" className="mt-6">
          <ViewPayroll staff={staff} />
        </TabsContent>
      </Tabs>
    </div>
  );
}