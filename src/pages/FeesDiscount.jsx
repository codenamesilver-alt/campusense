import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeesDiscount } from '@/entities/FeesDiscount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Percent, DollarSign, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function FeesDiscountPage() {
  const [students, setStudents] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    discount_code: '',
    discount_type: 'percentage',
    percentage: '',
    amount: '',
    duration_type: 'onetime'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const data = await FeesDiscount.list('-created_date');
      setDiscounts(data);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };

  const searchStudents = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter search term');
      return;
    }

    try {
      const data = await Student.list();
      const filtered = data.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_phone?.includes(searchTerm)
      );
      setStudents(filtered);
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearchTerm('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    if (!formData.discount_code.trim()) {
      alert('Please enter discount code');
      return;
    }

    if (formData.discount_type === 'percentage' && (!formData.percentage || formData.percentage <= 0)) {
      alert('Please enter valid percentage');
      return;
    }

    if (formData.discount_type === 'fixed_amount' && (!formData.amount || formData.amount <= 0)) {
      alert('Please enter valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      const submitData = {
        student_id: selectedStudent.id,
        discount_code: formData.discount_code,
        discount_type: formData.discount_type,
        percentage: formData.discount_type === 'percentage' ? parseFloat(formData.percentage) : null,
        amount: formData.discount_type === 'fixed_amount' ? parseFloat(formData.amount) : null,
        duration_type: formData.duration_type,
        applied_date: new Date().toISOString().split('T')[0]
      };
      
      await FeesDiscount.create(submitData);
      alert('Discount applied successfully!');
      
      setSelectedStudent(null);
      setFormData({
        discount_code: '',
        discount_type: 'percentage',
        percentage: '',
        amount: '',
        duration_type: 'onetime'
      });
      loadDiscounts();
    } catch (error) {
      console.error('Error applying discount:', error);
      alert('Error applying discount. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fees Discount</h1>
          <p className="text-gray-500">Apply discounts to student fees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Search and Discount Form */}
        <div className="space-y-6">
          {/* Student Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, admission number, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchStudents}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {selectedStudent && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Selected Student</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</div>
                      <div><strong>Admission No:</strong> {selectedStudent.admission_number}</div>
                      <div><strong>Class:</strong> {selectedStudent.class}-{selectedStudent.section}</div>
                      <div><strong>Phone:</strong> {selectedStudent.guardian_phone}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setSelectedStudent(null)}
                    >
                      Change Student
                    </Button>
                  </div>
                )}

                {students.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {students.map(student => (
                      <div 
                        key={student.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectStudent(student)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-gray-500">
                              {student.admission_number} • Class {student.class}-{student.section}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            {student.guardian_phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discount Form */}
          {selectedStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Apply Discount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_code">Discount Code *</Label>
                    <Input
                      id="discount_code"
                      placeholder="Enter discount code"
                      value={formData.discount_code}
                      onChange={(e) => handleInputChange('discount_code', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Discount Type *</Label>
                    <RadioGroup
                      value={formData.discount_type}
                      onValueChange={(value) => handleInputChange('discount_type', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage">Percentage</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed_amount" id="fixed_amount" />
                        <Label htmlFor="fixed_amount">Fixed Amount</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div className="space-y-2">
                      <Label htmlFor="percentage">Percentage (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        placeholder="Enter percentage"
                        value={formData.percentage}
                        onChange={(e) => handleInputChange('percentage', e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>
                  )}

                  {formData.discount_type === 'fixed_amount' && (
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Duration *</Label>
                    <RadioGroup
                      value={formData.duration_type}
                      onValueChange={(value) => handleInputChange('duration_type', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="onetime" id="onetime" />
                        <Label htmlFor="onetime">One-time Discount</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="permanent" id="permanent" />
                        <Label htmlFor="permanent">Permanent Discount</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Applying...' : 'Apply Discount'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Applied Discounts List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Applied Discounts ({discounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Discount Code</TableHead>
                      <TableHead>Type & Value</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No discounts applied yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      discounts.map((discount) => (
                        <TableRow key={discount.id}>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">Student ID: {discount.student_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{discount.discount_code}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {discount.discount_type === 'percentage' ? (
                                <span className="flex items-center gap-1">
                                  <Percent className="h-3 w-3" />
                                  {discount.percentage}%
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${discount.amount}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={discount.duration_type === 'permanent' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {discount.duration_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(discount.applied_date), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}