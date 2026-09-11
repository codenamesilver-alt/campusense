import { useState, useEffect } from 'react';
import { StudentDiscount } from '@/entities/StudentDiscount';
import { Student } from '@/entities/Student';
import { FeeHead } from '@/entities/FeeHead';
import { Staff } from '@/entities/Staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Percent, DollarSign, Award } from 'lucide-react';
import { format } from 'date-fns';

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    discount_type: 'permanent',
    discount_mode: 'percentage',
    percentage: '',
    fixed_amount: '',
    reason: '',
    approved_by: '',
    applicable_fee_heads: [],
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadData = async () => {
    try {
      const [discountsData, studentsData, feeHeadsData, staffData] = await Promise.all([
        StudentDiscount.list('-created_date'),
        Student.list(),
        FeeHead.list(),
        Staff.list()
      ]);
      
      setDiscounts(discountsData);
      setStudents(studentsData);
      setFeeHeads(feeHeadsData);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents([]);
      return;
    }
    
    const filtered = students.filter(student =>
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.guardian_phone?.includes(searchTerm)
    );
    setFilteredStudents(filtered);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.first_name} ${student.last_name} (${student.admission_number})`);
    setFilteredStudents([]);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeeHeadChange = (feeHeadId, checked) => {
    setFormData(prev => ({
      ...prev,
      applicable_fee_heads: checked 
        ? [...prev.applicable_fee_heads, feeHeadId]
        : prev.applicable_fee_heads.filter(id => id !== feeHeadId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please provide a reason for the discount');
      return;
    }

    if (formData.discount_mode === 'percentage' && (!formData.percentage || formData.percentage <= 0 || formData.percentage > 100)) {
      alert('Please enter a valid percentage (1-100)');
      return;
    }

    if (formData.discount_mode === 'fixed_amount' && (!formData.fixed_amount || formData.fixed_amount <= 0)) {
      alert('Please enter a valid fixed amount');
      return;
    }

    try {
      setIsLoading(true);
      
      const discountData = {
        student_id: selectedStudent.id,
        discount_type: formData.discount_type,
        discount_mode: formData.discount_mode,
        percentage: formData.discount_mode === 'percentage' ? parseFloat(formData.percentage) : null,
        fixed_amount: formData.discount_mode === 'fixed_amount' ? parseFloat(formData.fixed_amount) : null,
        reason: formData.reason,
        approved_by: formData.approved_by,
        applicable_fee_heads: formData.applicable_fee_heads.join(','),
        valid_from: formData.valid_from,
        valid_to: formData.discount_type === 'one_time' ? formData.valid_to : null,
        approval_date: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      
      await StudentDiscount.create(discountData);
      
      alert('Discount created successfully!');
      
      // Reset form
      setFormData({
        discount_type: 'permanent',
        discount_mode: 'percentage',
        percentage: '',
        fixed_amount: '',
        reason: '',
        approved_by: '',
        applicable_fee_heads: [],
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: ''
      });
      setSelectedStudent(null);
      setSearchTerm('');
      
      loadData();
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Error creating discount. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDiscount = async (discountId) => {
    if (window.confirm('Are you sure you want to revoke this discount?')) {
      try {
        await StudentDiscount.update(discountId, { status: 'revoked' });
        alert('Discount revoked successfully!');
        loadData();
      } catch (error) {
        console.error('Error revoking discount:', error);
        alert('Error revoking discount. Please try again.');
      }
    }
  };

  const getDiscountValue = (discount) => {
    if (discount.discount_mode === 'percentage') {
      return `${discount.percentage}%`;
    } else {
      return `₹${discount.fixed_amount}`;
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getStudentDetails = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student;
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'expired': 'bg-gray-100 text-gray-800',
      'revoked': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type) => {
    return type === 'permanent' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Discount Management</h1>
          <p className="text-gray-500">Manage permanent and one-time student discounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Discount Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Create Discount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student Search */}
                <div className="space-y-2">
                  <Label>Search Student *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Name, admission number, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {filteredStudents.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-40 overflow-y-auto">
                        {filteredStudents.map(student => (
                          <div
                            key={student.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
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
                    )}
                  </div>
                  {selectedStudent && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {selectedStudent.admission_number} • Class {selectedStudent.class}-{selectedStudent.section}
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount Type */}
                <div className="space-y-3">
                  <Label>Discount Duration *</Label>
                  <RadioGroup 
                    value={formData.discount_type} 
                    onValueChange={(value) => handleInputChange('discount_type', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="permanent" id="permanent" />
                      <Label htmlFor="permanent">Permanent Discount</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one_time" id="one_time" />
                      <Label htmlFor="one_time">One-Time Discount</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Discount Mode */}
                <div className="space-y-3">
                  <Label>Discount Type *</Label>
                  <RadioGroup 
                    value={formData.discount_mode} 
                    onValueChange={(value) => handleInputChange('discount_mode', value)}
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

                {/* Discount Value */}
                {formData.discount_mode === 'percentage' ? (
                  <div className="space-y-2">
                    <Label>Percentage *</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={formData.percentage}
                        onChange={(e) => handleInputChange('percentage', e.target.value)}
                        className="pl-10"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Fixed Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="e.g., 500"
                        value={formData.fixed_amount}
                        onChange={(e) => handleInputChange('fixed_amount', e.target.value)}
                        className="pl-10"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}

                {/* Applicable Fee Heads */}
                <div className="space-y-2">
                  <Label>Applicable Fee Heads</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {feeHeads.map(feeHead => (
                      <div key={feeHead.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={feeHead.id}
                          checked={formData.applicable_fee_heads.includes(feeHead.id)}
                          onCheckedChange={(checked) => handleFeeHeadChange(feeHead.id, checked)}
                        />
                        <Label htmlFor={feeHead.id} className="text-sm">
                          {feeHead.fee_head_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Leave empty to apply to all fee heads</p>
                </div>

                {/* Validity Period for One-Time */}
                {formData.discount_type === 'one_time' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Valid From</Label>
                      <Input
                        type="date"
                        value={formData.valid_from}
                        onChange={(e) => handleInputChange('valid_from', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid To *</Label>
                      <Input
                        type="date"
                        value={formData.valid_to}
                        onChange={(e) => handleInputChange('valid_to', e.target.value)}
                        required={formData.discount_type === 'one_time'}
                      />
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea
                    placeholder="e.g., Sibling discount, Financial hardship, Merit scholarship..."
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Approved By */}
                <div className="space-y-2">
                  <Label>Approved By</Label>
                  <Select value={formData.approved_by} onValueChange={(value) => handleInputChange('approved_by', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approving staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.filter(s => s.role === 'admin' || s.role === 'principal').map(staffMember => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.first_name} {staffMember.last_name} ({staffMember.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create Discount'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Discounts List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Discounts ({discounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No discounts found. Create your first discount to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      discounts.map((discount) => {
                        const student = getStudentDetails(discount.student_id);
                        return (
                          <TableRow key={discount.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{getStudentName(discount.student_id)}</div>
                                {student && (
                                  <div className="text-sm text-gray-500">
                                    {student.admission_number} • Class {student.class}-{student.section}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{getDiscountValue(discount)}</div>
                              <div className="text-sm text-gray-500 capitalize">
                                {discount.discount_mode.replace('_', ' ')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getTypeBadge(discount.discount_type)}>
                                {discount.discount_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={discount.reason}>
                                {discount.reason}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>From: {format(new Date(discount.valid_from), 'MMM dd, yyyy')}</div>
                                {discount.valid_to && (
                                  <div>To: {format(new Date(discount.valid_to), 'MMM dd, yyyy')}</div>
                                )}
                                {discount.discount_type === 'permanent' && (
                                  <div className="text-blue-600">Permanent</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(discount.status)}>
                                {discount.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {discount.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => revokeDiscount(discount.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Revoke
                                </Button>
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

          {/* Summary Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Discount Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total Discounts</div>
                  <div className="text-2xl font-bold text-blue-900">{discounts.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Active</div>
                  <div className="text-2xl font-bold text-green-900">
                    {discounts.filter(d => d.status === 'active').length}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Permanent</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {discounts.filter(d => d.discount_type === 'permanent').length}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">One-Time</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {discounts.filter(d => d.discount_type === 'one_time').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}