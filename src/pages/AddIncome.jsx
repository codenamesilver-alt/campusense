import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, Loader2, FileCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AddIncome() {
  const [incomeHeads, setIncomeHeads] = useState([]);
  const [formData, setFormData] = useState({
    date_of_transaction: format(new Date(), 'yyyy-MM-dd'),
    income_head_id: '',
    amount: '',
    payer_name: '',
    payment_mode: 'cash',
    reference_no: '',
    description: '',
    receipt_url: '',
    manual_receipt_number: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadIncomeHeads();
  }, []);

  const loadIncomeHeads = async () => {
    try {
      const data = await base44.entities.IncomeHead.filter({ status: 'active' });
      setIncomeHeads(data);
    } catch (error) {
      console.error('Error loading income heads:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, receipt_url: file_url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed.');
      setUploadedFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  const generateReceiptNumber = async () => {
    try {
      const allIncomes = await fetchAll('Income', '-transaction_id');
      
      if (allIncomes.length === 0) {
        return 'SRCP00001';
      }
      
      const lastIncome = allIncomes[0].transaction_id;
      const match = lastIncome.match(/SRCP(\d+)/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        return `SRCP${nextNumber.toString().padStart(5, '0')}`;
      }
      
      return `SRCP${(allIncomes.length + 1).toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      const timestamp = Date.now().toString().slice(-5);
      return `SRCP${timestamp}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.income_head_id || !formData.amount) {
      alert('Income head and amount are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedHead = incomeHeads.find(h => h.id === formData.income_head_id);
      const transactionId = formData.manual_receipt_number.trim() || await generateReceiptNumber();
      
      const submissionData = {
        ...formData,
        transaction_id: transactionId,
        income_head_name: selectedHead?.name || 'N/A',
        amount: parseFloat(formData.amount)
      };

      await base44.entities.Income.create(submissionData);
      alert('Income added successfully!');
      resetForm();
    } catch (error) {
      console.error('Error adding income:', error);
      alert('Failed to add income.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date_of_transaction: format(new Date(), 'yyyy-MM-dd'),
      income_head_id: '',
      amount: '',
      payer_name: '',
      payment_mode: 'cash',
      reference_no: '',
      description: '',
      receipt_url: '',
      manual_receipt_number: ''
    });
    setUploadedFileName('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus /> Add New Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_transaction">Date of Transaction *</Label>
                <Input type="date" id="date_of_transaction" name="date_of_transaction" value={formData.date_of_transaction} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income_head_id">Income Head *</Label>
                <Select name="income_head_id" value={formData.income_head_id} onValueChange={(value) => setFormData(prev => ({...prev, income_head_id: value}))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income head" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeHeads.map(head => (
                      <SelectItem key={head.id} value={head.id}>{head.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual_receipt_number">Receipt Number (Optional)</Label>
              <Input 
                id="manual_receipt_number" 
                name="manual_receipt_number" 
                value={formData.manual_receipt_number} 
                onChange={handleInputChange}
                placeholder="Auto-generated as SRCP00001 if empty"
              />
              <p className="text-xs text-gray-500">Leave empty to auto-generate sequentially (SRCP00001, SRCP00002, etc.)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer_name">Payer Name</Label>
                <Input id="payer_name" name="payer_name" value={formData.payer_name} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <Select name="payment_mode" value={formData.payment_mode} onValueChange={(value) => setFormData(prev => ({...prev, payment_mode: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.payment_mode !== 'cash' && formData.payment_mode !== 'others' && (
                <div className="space-y-2">
                  <Label htmlFor="reference_no">Reference No.</Label>
                  <Input id="reference_no" name="reference_no" value={formData.reference_no} onChange={handleInputChange} />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description / Remarks</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_upload">Attach Receipt</Label>
              <div className="flex items-center gap-4">
                <Button asChild variant="outline" className="relative">
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? <Loader2 className="animate-spin" /> : 'Upload File'}
                    <Input type="file" id="receipt_upload" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  </>
                </Button>
                {uploadedFileName && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileCheck className="h-4 w-4" />
                    <span>{uploadedFileName}</span>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Income'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}