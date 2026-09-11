import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll, fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Receipt, Calculator, CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FeeCollection() {
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDues, setStudentDues] = useState([]);
  const [studentDiscounts, setStudentDiscounts] = useState([]);
  const [selectedDues, setSelectedDues] = useState([]);
  const [partialAmounts, setPartialAmounts] = useState({}); // dueId -> amount being paid
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [allowBackdatedReceipt, setAllowBackdatedReceipt] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState(null); // Added schoolSettings state
  const [paymentData, setPaymentData] = useState({
    payment_mode: 'cash',
    payment_reference: '',
    remarks: '',
    one_time_discount: 0,
    one_time_discount_reason: '',
    manual_receipt_number: '',
    receipt_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  useEffect(() => {
    loadStudents();
    loadDropdownData();
    loadSchoolSettings();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [allStudents, searchTerm, selectedClass, selectedSection]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentDues();
      loadStudentDiscounts();
    }
  }, [selectedStudent]);

  const loadSchoolSettings = async () => {
    try {
      const settingsData = await base44.entities.SchoolSetting.list();
      if (settingsData.length > 0) {
        setSchoolSettings(settingsData[0]); // Set schoolSettings
        setAllowBackdatedReceipt(settingsData[0].allow_backdated_receipt || false);
      }
    } catch (error) {
      console.error('Error loading school settings:', error);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [classesData, sectionsData] = await Promise.all([
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name')
      ]);
      setClasses(classesData);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await fetchAllFiltered('Student', { status: 'active' });
      setAllStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const filterStudents = () => {
    let filtered = allStudents;

    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => student.class === selectedClass);
    }

    if (selectedSection !== 'all') {
      filtered = filtered.filter(student => student.section === selectedSection);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_phone?.includes(searchTerm)
      );
    }

    setFilteredStudents(filtered);
  };

  const loadStudentDues = async () => {
    try {
      const allDues = await fetchAllFiltered('FeeDue', { student_id: selectedStudent.id });
      // Show ALL dues including paid — sort by due_date ascending
      allDues.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setStudentDues(allDues);
    } catch (error) {
      console.error('Error loading student dues:', error);
      setStudentDues([]);
    }
  };

  const loadStudentDiscounts = async () => {
    try {
      const discounts = await fetchAllFiltered('StudentDiscount', {
        student_id: selectedStudent.id,
        status: 'active'
      });
      setStudentDiscounts(discounts);
    } catch (error) {
      console.error('Error loading student discounts:', error);
      setStudentDiscounts([]);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.first_name} ${student.last_name} (${student.admission_number})`);
    setFilteredStudents([]);
    setSelectedDues([]);
    setPaymentData(prev => ({
      ...prev,
      receipt_date: format(new Date(), 'yyyy-MM-dd')
    }));
  };

  const handleDueSelection = (due, checked) => {
    if (checked) {
      setSelectedDues(prev => [...prev, due]);
      setPartialAmounts(prev => ({ ...prev, [due.id]: due.balance_amount }));
    } else {
      setSelectedDues(prev => prev.filter(d => d.id !== due.id));
      setPartialAmounts(prev => { const n = { ...prev }; delete n[due.id]; return n; });
    }
  };

  const handlePartialAmountChange = (dueId, value, maxBalance) => {
    const parsed = parseFloat(value) || 0;
    const clamped = Math.min(Math.max(0, parsed), maxBalance);
    setPartialAmounts(prev => ({ ...prev, [dueId]: clamped }));
  };

  const calculateTotalAmount = () => {
    const subtotal = selectedDues.reduce((sum, due) => sum + (partialAmounts[due.id] ?? due.balance_amount), 0);
    const permanentDiscount = calculatePermanentDiscount(subtotal);
    const oneTimeDiscount = parseFloat(paymentData.one_time_discount) || 0;
    
    return Math.max(0, subtotal - permanentDiscount - oneTimeDiscount);
  };

  const calculatePermanentDiscount = (amount) => {
    let totalDiscount = 0;
    
    studentDiscounts.forEach(discount => {
      if (discount.discount_type === 'permanent' && discount.status === 'active') {
        if (discount.discount_mode === 'percentage') {
          totalDiscount += (amount * discount.percentage) / 100;
        } else {
          totalDiscount += discount.fixed_amount;
        }
      }
    });
    
    return totalDiscount;
  };

  // calculateLateFine function removed

  const generateReceiptNumber = async () => {
    try {
      // Get all transactions ordered by receipt number descending
      const allTransactions = await fetchAll('FeeTransaction', '-receipt_number');
      
      if (allTransactions.length === 0) {
        // First receipt ever
        return 'T00001';
      }
      
      // Get the last receipt number
      const lastReceipt = allTransactions[0].receipt_number;
      
      // Extract number from receipt (format T00001, T00002, etc.)
      const match = lastReceipt.match(/T(\d+)/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        return `T${nextNumber.toString().padStart(5, '0')}`;
      }
      
      // Fallback if format doesn't match
      return `T${(allTransactions.length + 1).toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback to timestamp-based if error
      const timestamp = Date.now().toString().slice(-5);
      return `T${timestamp}`;
    }
  };

  const handlePayment = async () => {
    if (selectedDues.length === 0) {
      alert('Please select at least one fee to pay');
      return;
    }

    if (!paymentData.payment_mode) {
      alert('Please select a payment mode');
      return;
    }

    try {
      setIsLoading(true);
      
      const receiptNumber = paymentData.manual_receipt_number.trim() || await generateReceiptNumber();
      
      // Use partial amounts for each due
      const duesWithPayment = selectedDues.map(due => ({
        ...due,
        paying_now: partialAmounts[due.id] ?? due.balance_amount
      }));

      const subtotal = duesWithPayment.reduce((sum, due) => sum + due.paying_now, 0);
      const permanentDiscount = calculatePermanentDiscount(subtotal);
      const oneTimeDiscount = parseFloat(paymentData.one_time_discount) || 0;
      const totalAmount = calculateTotalAmount();

      const transaction = {
        student_id: selectedStudent.id,
        receipt_number: receiptNumber,
        transaction_date: paymentData.receipt_date,
        payment_mode: paymentData.payment_mode,
        total_amount: subtotal,
        discount_amount: permanentDiscount + oneTimeDiscount,
        late_fine: 0,
        net_amount: totalAmount,
        fee_details: JSON.stringify(duesWithPayment.map(due => ({
          fee_head_name: due.fee_head_name,
          amount: due.paying_now,
          due_date: due.due_date,
          is_partial: due.paying_now < due.balance_amount
        }))),
        payment_reference: paymentData.payment_reference,
        collected_by: 'current_user',
        remarks: paymentData.remarks,
        academic_year: '2025-26',
        status: 'completed'
      };

      await base44.entities.FeeTransaction.create(transaction);

      for (const due of duesWithPayment) {
        const newPaidAmount = (due.paid_amount || 0) + due.paying_now;
        const newBalance = due.balance_amount - due.paying_now;
        const isFullyPaid = newBalance <= 0;
        await base44.entities.FeeDue.update(due.id, {
          paid_amount: newPaidAmount,
          balance_amount: Math.max(0, newBalance),
          status: isFullyPaid ? 'paid' : 'partially_paid'
        });
      }

      if (oneTimeDiscount > 0) {
        const discountRecord = {
          student_id: selectedStudent.id,
          discount_type: 'one_time',
          discount_mode: 'fixed_amount',
          fixed_amount: oneTimeDiscount,
          reason: paymentData.one_time_discount_reason,
          approved_by: 'current_user', // TODO: Make dynamic
          applicable_fee_heads: selectedDues.map(d => d.fee_head_id).join(','),
          valid_from: paymentData.receipt_date,
          valid_to: paymentData.receipt_date,
          approval_date: paymentData.receipt_date,
          status: 'active'
        };
        
        await base44.entities.StudentDiscount.create(discountRecord);
      }

      const receiptData = {
        ...transaction,
        student: selectedStudent,
        fees_paid: duesWithPayment,
        permanent_discount: permanentDiscount,
        one_time_discount: oneTimeDiscount
      };

      setLastReceipt(receiptData);
      setSelectedDues([]);
      setPartialAmounts({});
      setPaymentData({
        payment_mode: 'cash',
        payment_reference: '',
        remarks: '',
        one_time_discount: 0,
        one_time_discount_reason: '',
        manual_receipt_number: '',
        receipt_date: format(new Date(), 'yyyy-MM-dd')
      });

      // Reload all dues including paid ones
      const refreshedDues = await fetchAllFiltered('FeeDue', { student_id: selectedStudent.id });
      refreshedDues.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setStudentDues(refreshedDues);

      setShowReceiptDialog(true);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const printReceipt = () => {
    if (!lastReceipt) return;

    const printWindow = window.open('', '_blank');
    const receiptHtml = `
      <html>
        <head>
          <title>Fee Receipt - ${lastReceipt.receipt_number}</title>
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
            FEE RECEIPT - ${lastReceipt.receipt_number}
          </div>
          
          <div class="receipt-details">
            <p><strong>Date:</strong> ${format(new Date(lastReceipt.transaction_date), 'dd/MM/yyyy')}</p>
            <p><strong>Student Name:</strong> ${lastReceipt.student.first_name} ${lastReceipt.student.last_name}</p>
            <p><strong>Admission No:</strong> ${lastReceipt.student.admission_number}</p>
            <p><strong>Class:</strong> ${lastReceipt.student.class}-${lastReceipt.student.section}</p>
            <p><strong>Payment Mode:</strong> ${lastReceipt.payment_mode.toUpperCase()}</p>
            ${lastReceipt.payment_reference ? `<p><strong>Reference:</strong> ${lastReceipt.payment_reference}</p>` : ''}
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
              ${lastReceipt.fees_paid.map(fee => `
                <tr>
                  <td>${fee.fee_head_name}${fee.is_partial ? ' (Partial)' : ''}</td>
                  <td>${format(new Date(fee.due_date), 'dd/MM/yyyy')}</td>
                  <td style="text-align: right;">${(fee.paying_now ?? fee.balance_amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <p><strong>Subtotal:</strong> ₹${lastReceipt.total_amount.toFixed(2)}</p>
            ${lastReceipt.discount_amount > 0 ? `<p><strong>Total Discount:</strong> -₹${lastReceipt.discount_amount.toFixed(2)}</p>` : ''}
            <p style="font-size: 13px; font-weight: bold;"><strong>Total Amount Paid:</strong> ₹${lastReceipt.net_amount.toFixed(2)}</p>
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

  const subtotal = selectedDues.reduce((sum, due) => sum + (partialAmounts[due.id] ?? due.balance_amount), 0);
  const permanentDiscount = calculatePermanentDiscount(subtotal);
  const oneTimeDiscount = parseFloat(paymentData.one_time_discount) || 0;
  // Removed lateFine
  const totalAmount = calculateTotalAmount();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fee Collection & Payment</h1>
          <p className="text-gray-500">Collect fees from students with discount management</p>
        </div>
      </div>

      {/* Student Search with Class and Section Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Student
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <Select value={selectedSection} onValueChange={setSelectedSection}>
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
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, admission number, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="font-medium">{student.first_name} {student.last_name}</div>
                  <div className="text-sm text-gray-500">
                    {student.admission_number} • Class {student.class}-{student.section}
                  </div>
                  <div className="text-sm text-gray-500">{student.guardian_phone}</div>
                </div>
              ))}
            </div>
          ) : ( searchTerm || selectedClass !== 'all' || selectedSection !== 'all' ) && (
            <div className="p-3 text-gray-500 text-center">No students found matching your criteria.</div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Details & Due Fees */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle>Selected Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <p className="text-gray-600">{selectedStudent.admission_number}</p>
                    <p className="text-gray-600">Class {selectedStudent.class}-{selectedStudent.section}</p>
                    <p className="text-gray-600">{selectedStudent.guardian_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Due Fees */}
            <Card>
              <CardHeader>
                <CardTitle>All Fees — Select to Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pay</TableHead>
                        <TableHead>Fee Description</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Total Due</TableHead>
                        <TableHead>Paying Now</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentDues.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No fees found for this student
                          </TableCell>
                        </TableRow>
                      ) : (
                        studentDues.map((due) => {
                          const isPaid = due.status === 'paid' || due.status === 'waived';
                          const isPartial = due.status === 'partially_paid';
                          const dueDate = new Date(due.due_date);
                          dueDate.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isOverdue = dueDate < today;
                          const isDueToday = dueDate.getTime() === today.getTime();
                          const isNotYetDue = dueDate > today;
                          const isSelected = selectedDues.some(d => d.id === due.id);
                          const payingNow = partialAmounts[due.id] ?? due.balance_amount;

                          return (
                            <TableRow
                              key={due.id}
                              className={
                                isPaid
                                  ? 'bg-green-50 opacity-70'
                                  : isOverdue
                                  ? 'bg-red-50'
                                  : isNotYetDue
                                  ? 'bg-gray-50'
                                  : ''
                              }
                            >
                              <TableCell>
                                {isPaid ? (
                                  <span className="text-green-500 text-lg">✓</span>
                                ) : (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleDueSelection(due, checked)}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <div className={`font-medium ${isPaid ? 'line-through text-gray-400' : ''}`}>{due.fee_head_name}</div>
                                {due.due_month && <div className="text-xs text-gray-400">{due.due_month} {due.due_year}</div>}
                                {isPartial && <div className="text-xs text-orange-500">Partially paid — ₹{(due.due_amount - due.balance_amount).toLocaleString('en-IN')} received so far</div>}
                                {isPaid && due.status === 'waived' && <div className="text-xs text-purple-500">Waived</div>}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{format(new Date(due.due_date), 'MMM dd, yyyy')}</div>
                              </TableCell>
                              <TableCell>
                                <div className={`font-medium ${isPaid ? 'text-gray-400' : ''}`}>
                                  ₹{due.due_amount?.toLocaleString('en-IN') ?? due.balance_amount.toLocaleString('en-IN')}
                                </div>
                                {isPaid && <div className="text-xs text-green-600">Paid: ₹{(due.paid_amount || 0).toLocaleString('en-IN')}</div>}
                              </TableCell>
                              <TableCell>
                                {isPaid ? (
                                  <span className="text-gray-400 text-sm">—</span>
                                ) : isSelected ? (
                                  <Input
                                    type="number"
                                    value={payingNow}
                                    onChange={(e) => handlePartialAmountChange(due.id, e.target.value, due.balance_amount)}
                                    className="w-28 h-8 text-right"
                                    min="1"
                                    max={due.balance_amount}
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isPaid && due.status === 'waived' && (
                                  <Badge className="bg-purple-100 text-purple-800">Waived</Badge>
                                )}
                                {isPaid && due.status === 'paid' && (
                                  <Badge className="bg-green-100 text-green-800">✓ Paid</Badge>
                                )}
                                {!isPaid && isPartial && (
                                  <Badge className="bg-orange-100 text-orange-800">Partial</Badge>
                                )}
                                {!isPaid && !isPartial && isOverdue && (
                                  <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                                )}
                                {!isPaid && !isPartial && isDueToday && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Due Today</Badge>
                                )}
                                {!isPaid && !isPartial && isNotYetDue && (
                                  <Badge className="bg-blue-100 text-blue-800">Not Yet Due</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Panel */}
          <div className="space-y-6">
            {/* Payment Calculation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Payment Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {permanentDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Permanent Discount:</span>
                      <span>-₹{permanentDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span>One-time Discount:</span>
                    <div className="flex items-center gap-2">
                      <span>-₹</span>
                      <Input
                        type="number"
                        value={paymentData.one_time_discount}
                        onChange={(e) => setPaymentData(prev => ({...prev, one_time_discount: e.target.value}))}
                        className="w-20 h-8 text-right"
                        min="0"
                        max={subtotal.toFixed(2)} // Max is subtotal to prevent negative amount
                      />
                    </div>
                  </div>
                  
                  {oneTimeDiscount > 0 && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Reason for discount"
                        value={paymentData.one_time_discount_reason}
                        onChange={(e) => setPaymentData(prev => ({...prev, one_time_discount_reason: e.target.value}))}
                        className="text-xs"
                      />
                    </div>
                  )}
                  
                  {/* Late Fine section removed */}
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Receipt Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={paymentData.receipt_date}
                      onChange={(e) => setPaymentData(prev => ({...prev, receipt_date: e.target.value}))}
                      disabled={!allowBackdatedReceipt}
                      className="pl-10"
                    />
                  </div>
                  {!allowBackdatedReceipt && (
                    <p className="text-xs text-gray-500">
                      Receipt date is locked to today. Enable "Allow Backdated Receipt" in Settings to change.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Receipt Number (Optional)</Label>
                  <Input
                    placeholder="Auto-generated sequentially if empty"
                    value={paymentData.manual_receipt_number}
                    onChange={(e) => setPaymentData(prev => ({...prev, manual_receipt_number: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode *</Label>
                  <Select 
                    value={paymentData.payment_mode} 
                    onValueChange={(value) => setPaymentData(prev => ({...prev, payment_mode: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="card">Card Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentData.payment_mode !== 'cash' && (
                  <div className="space-y-2">
                    <Label>Payment Reference</Label>
                    <Input
                      placeholder="Cheque no, Transaction ID, etc."
                      value={paymentData.payment_reference}
                      onChange={(e) => setPaymentData(prev => ({...prev, payment_reference: e.target.value}))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Input
                    placeholder="Additional notes..."
                    value={paymentData.remarks}
                    onChange={(e) => setPaymentData(prev => ({...prev, remarks: e.target.value}))}
                  />
                </div>

                <Button 
                  onClick={handlePayment} 
                  disabled={isLoading || selectedDues.length === 0}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : `Collect Payment ₹${totalAmount.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>

            {/* Applied Discounts Info */}
            {studentDiscounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Applied Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {studentDiscounts.map((discount, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{discount.reason}</div>
                        <div className="text-gray-500">
                          {discount.discount_mode === 'percentage' 
                            ? `${discount.percentage}%` 
                            : `₹${discount.fixed_amount}`} 
                          ({discount.discount_type})
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Successful
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold">Receipt #{lastReceipt?.receipt_number}</div>
              <div className="text-gray-500">Amount Paid: ₹{lastReceipt?.net_amount.toFixed(2)}</div>
              {lastReceipt?.fees_paid?.some(f => f.paying_now < f.balance_amount) && (
                <div className="mt-2 text-sm text-orange-600 font-medium bg-orange-50 rounded px-3 py-1">
                  ⚠ Partial payment recorded. Outstanding balance remains for some fees.
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={printReceipt} className="flex-1">
                Print Receipt
              </Button>
              <Button variant="outline" onClick={() => setShowReceiptDialog(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}