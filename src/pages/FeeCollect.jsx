import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeeDue } from '@/entities/FeeDue';
import { FeeTransaction } from '@/entities/FeeTransaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, User, IndianRupee, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function FeeCollect() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeDues, setFeeDues] = useState([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);
  
  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [fine, setFine] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [referenceNo, setReferenceNo] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const selectedDues = feeDues.filter(due => selectedFeeIds.includes(due.id));
    const newSubTotal = selectedDues.reduce((sum, due) => sum + (due.balance_amount || 0), 0);
    setSubTotal(newSubTotal);
  }, [selectedFeeIds, feeDues]);

  useEffect(() => {
    const finalAmount = subTotal - discount + fine;
    setTotalAmount(finalAmount > 0 ? finalAmount : 0);
  }, [subTotal, discount, fine]);

  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const students = await Student.list();
    const filtered = students.filter(s => 
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admission_number.includes(searchQuery) ||
      s.guardian_phone.includes(searchQuery)
    );
    setSearchResults(filtered);
  };

  const handleStudentSelect = async (student) => {
    setIsLoading(true);
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
    
    try {
      const dues = await FeeDue.filter({ student_id: student.id });
      setFeeDues(dues);
    } catch (error) {
      console.error("Error fetching fee dues:", error);
      setFeeDues([]);
    } finally {
      setIsLoading(false);
      // Reset selections and amounts
      setSelectedFeeIds([]);
      setDiscount(0);
      setFine(0);
    }
  };

  const handleFeeSelect = (feeId, checked) => {
    setSelectedFeeIds(prev => 
      checked ? [...prev, feeId] : prev.filter(id => id !== feeId)
    );
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partially_paid: 'bg-blue-100 text-blue-800'
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>{status.replace('_', ' ')}</Badge>;
  };
  
  const handlePayment = async () => {
    if (totalAmount <= 0) {
      alert("Please select fees to pay.");
      return;
    }
    
    setIsLoading(true);
    try {
      const receiptNumber = `RCPT-${Date.now()}`;
      
      const transaction = await FeeTransaction.create({
        student_id: selectedStudent.id,
        receipt_number: receiptNumber,
        transaction_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        total_amount: subTotal,
        discount_amount: discount,
        late_fine: fine,
        net_amount: totalAmount,
        fee_details: JSON.stringify(feeDues.filter(due => selectedFeeIds.includes(due.id))),
        payment_reference: referenceNo,
        collected_by: 'Admin', // Replace with actual logged in user
        academic_year: '2024-25', // Should be dynamic
        status: 'completed'
      });
      
      for (const feeId of selectedFeeIds) {
        const due = feeDues.find(d => d.id === feeId);
        await FeeDue.update(feeId, {
          status: 'paid',
          paid_amount: due.amount,
          balance_amount: 0,
        });
      }
      
      alert(`Payment successful! Receipt No: ${receiptNumber}`);
      // Refresh fee dues
      handleStudentSelect(selectedStudent);

    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search /> Search Student</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Search by Name, Admission No, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 border rounded-md max-h-60 overflow-y-auto">
              {searchResults.map(student => (
                <div 
                  key={student.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                  onClick={() => handleStudentSelect(student)}
                >
                  <p className="font-medium">{student.first_name} {student.last_name}</p>
                  <p className="text-sm text-gray-500">Adm No: {student.admission_number} | Class: {student.class}-{student.section}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User/> Student Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</div>
                  <div><strong>Class:</strong> {selectedStudent.class}-{selectedStudent.section}</div>
                  <div><strong>Admission No:</strong> {selectedStudent.admission_number}</div>
                  <div><strong>Guardian Phone:</strong> {selectedStudent.guardian_phone}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fee Payment Selection</CardTitle></CardHeader>
              <CardContent>
                {isLoading && <p>Loading fees...</p>}
                {!isLoading && feeDues.length === 0 && <p className="text-center text-gray-500 py-4">No pending fee found for this student.</p>}
                {!isLoading && feeDues.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Fee Head</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeDues.map(due => (
                        <TableRow key={due.id}>
                          <TableCell>
                            <Checkbox 
                              id={`fee-${due.id}`}
                              checked={selectedFeeIds.includes(due.id)}
                              disabled={due.status === 'paid'}
                              onCheckedChange={(checked) => handleFeeSelect(due.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{due.fee_type || due.fee_head_name || 'Fee'}</TableCell>
                          <TableCell>{formatDate(due.due_date)}</TableCell>
                          <TableCell>{getStatusBadge(due.status)}</TableCell>
                          <TableCell className="text-right">₹{due.balance_amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt/> Payment Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sub Total</span>
                  <span className="font-medium">₹{subTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="discount" className="w-24">Discount (-)</Label>
                  <Input id="discount" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="fine" className="w-24">Fine (+)</Label>
                  <Input id="fine" type="number" value={fine} onChange={e => setFine(Number(e.target.value))} />
                </div>
                <hr/>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_mode">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_no">Reference No. (Optional)</Label>
                  <Input id="reference_no" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handlePayment} 
                  disabled={isLoading || selectedFeeIds.length === 0}
                >
                  <IndianRupee className="mr-2 h-4 w-4"/>
                  Collect Fee
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}