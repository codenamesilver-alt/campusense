import { useState, useEffect } from 'react';
import { Staff } from '@/entities/Staff';
import { Department } from '@/entities/Department';
import { Designation } from '@/entities/Designation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadFile, ExtractDataFromUploadedFile } from '@/integrations/Core';
import { UploadCloud, FileText, UserPlus, CheckCircle, AlertTriangle, Download } from 'lucide-react';

export default function AddStaff() {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: `STF-${Date.now().toString().slice(-6)}`,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'teacher',
    department: '',
    designation: '',
    date_of_birth: '',
    joining_date: '',
    address: '',
    status: 'active',
    pan_number: '',
    pf_number: '',
    aadhaar_number: '',
    bank_account_number: '',
    ifsc_code: '',
    bank_name: '',
    basic_salary: '',
    hra: '',
    transport_allowance: '',
    other_allowance: '',
    gender: '',
    employment_type: 'probation',
    paid_leave_balance: 0,
    sick_leave_balance: 0,
    casual_leave_balance: 0,
    maternity_leave_balance: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptData, desigData] = await Promise.all([
          Department.list(),
          Designation.list()
        ]);
        setDepartments(deptData);
        setDesignations(desigData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateSalary = () => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const transport = parseFloat(formData.transport_allowance) || 0;
    const other = parseFloat(formData.other_allowance) || 0;
    
    return basic + hra + transport + other;
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const grossSalary = calculateSalary();
      const submissionData = {
        ...formData,
        gross_salary: grossSalary,
        salary: grossSalary, // For backward compatibility if 'salary' field is expected
        basic_salary: parseFloat(formData.basic_salary) || 0,
        hra: parseFloat(formData.hra) || 0,
        transport_allowance: parseFloat(formData.transport_allowance) || 0,
        other_allowance: parseFloat(formData.other_allowance) || 0
      };
      
      await Staff.create(submissionData);
      alert('Staff added successfully!');
      // Reset form
      setFormData({
        staff_id: `STF-${Date.now().toString().slice(-6)}`,
        first_name: '', last_name: '', email: '', phone: '', role: 'teacher',
        department: '', designation: '', date_of_birth: '', joining_date: '', address: '', status: 'active',
        pan_number: '', pf_number: '', aadhaar_number: '', bank_account_number: '', ifsc_code: '', bank_name: '',
        basic_salary: '', hra: '', transport_allowance: '', other_allowance: '',
        gender: '', employment_type: 'probation', paid_leave_balance: 0, sick_leave_balance: 0,
        casual_leave_balance: 0, maternity_leave_balance: 0
      });
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Error adding staff. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = 'staff_id,first_name,last_name,email,phone,role,department,designation,date_of_birth,gender,joining_date,address,pan_number,pf_number,aadhaar_number,bank_account_number,ifsc_code,bank_name,basic_salary,hra,transport_allowance,other_allowance';
    const sampleData = 'STF001,John,Doe,john.doe@school.edu,9876543210,teacher,Mathematics,Senior Teacher,15/05/1985,male,01/04/2020,"123 Teacher Colony, City",ABCDE1234F,PF1234567,123456789012,123456789012345,SBIN0001234,State Bank of India,30000,10000,2000,1000';
    const csvContent = [headers, sampleData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'staff_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for database storage
  const convertDateFormat = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null); // Clear previous result
    try {
      const { file_url } = await UploadFile({ file });
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "array", // Expecting an array of staff objects directly
          items: {
            type: "object",
            properties: {
              staff_id: { type: "string" },
              first_name: { type: "string" },
              last_name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              role: { type: "string" },
              department: { type: "string" },
              designation: { type: "string" },
              date_of_birth: { type: "string" },
              gender: { type: "string" },
              joining_date: { type: "string" },
              address: { type: "string" },
              pan_number: { type: "string" },
              pf_number: { type: "string" },
              aadhaar_number: { type: "string" },
              bank_account_number: { type: "string" },
              ifsc_code: { type: "string" },
              bank_name: { type: "string" },
              basic_salary: { type: "string" },
              hra: { type: "string" },
              transport_allowance: { type: "string" },
              other_allowance: { type: "string" }
            },
            // The template suggests these are all optional as not all are required in DB
            // "required": ["first_name", "last_name", "email"] // Removed as per template suggestion and flexible import
          }
        }
      });

      if (extractResult.status === 'success' && Array.isArray(extractResult.output)) {
        let successCount = 0;
        
        for (const staffData of extractResult.output) {
          try {
            const basic = parseFloat(staffData.basic_salary) || 0;
            const hra = parseFloat(staffData.hra) || 0;
            const transport = parseFloat(staffData.transport_allowance) || 0;
            const other = parseFloat(staffData.other_allowance) || 0;
            const grossSalary = basic + hra + transport + other;

            // Convert date formats and process other fields
            const processedData = {
              staff_id: staffData.staff_id || `STF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Generate if not provided
              first_name: staffData.first_name,
              last_name: staffData.last_name,
              email: staffData.email,
              phone: staffData.phone,
              role: staffData.role || 'teacher', // Default role
              department: staffData.department,
              designation: staffData.designation,
              date_of_birth: convertDateFormat(staffData.date_of_birth),
              gender: staffData.gender,
              joining_date: convertDateFormat(staffData.joining_date),
              address: staffData.address,
              status: 'active',
              pan_number: staffData.pan_number,
              pf_number: staffData.pf_number,
              aadhaar_number: staffData.aadhaar_number,
              bank_account_number: staffData.bank_account_number,
              ifsc_code: staffData.ifsc_code,
              bank_name: staffData.bank_name,
              basic_salary: basic,
              hra: hra,
              transport_allowance: transport,
              other_allowance: other,
              gross_salary: grossSalary,
              salary: grossSalary // For backward compatibility
            };
            
            await Staff.create(processedData);
            successCount++;
          } catch (error) {
            console.error('Error importing staff record:', staffData, error);
            // Optionally store failed records to show user
          }
        }
        
        setUploadResult({ success: true, count: successCount });
      } else {
        setUploadResult({ success: false, message: 'Failed to process CSV file or no staff data found.' });
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      setUploadResult({ success: false, message: error.message || 'An unexpected error occurred during upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add New Staff</h1>
        <p className="text-gray-500">Onboard a single staff member or import multiple staff records via CSV.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus /> Add Single Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select name="gender" onValueChange={(val) => handleSelectChange('gender', val)} value={formData.gender}>
                      <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select name="department" onValueChange={(val) => handleSelectChange('department', val)} value={formData.department}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Select name="designation" onValueChange={(val) => handleSelectChange('designation', val)} value={formData.designation}>
                        <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                        <SelectContent>{designations.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joining_date">Joining Date</Label>
                    <Input id="joining_date" type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Payroll & Identity Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Payroll & Identity Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input id="pan_number" name="pan_number" value={formData.pan_number} onChange={handleInputChange} placeholder="ABCDE1234F" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                    <Input id="aadhaar_number" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleInputChange} placeholder="1234 5678 9012" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf_number">PF Number</Label>
                    <Input id="pf_number" name="pf_number" value={formData.pf_number} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input id="bank_account_number" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc_code">IFSC Code</Label>
                    <Input id="ifsc_code" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>

              {/* Leave Entitlement */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Leave Entitlement</h3>
                <div className="space-y-4">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="employment_type"
                        value="probation"
                        checked={formData.employment_type === 'probation'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="font-medium">Probation</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="employment_type"
                        value="permanent"
                        checked={formData.employment_type === 'permanent'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="font-medium">Permanent</span>
                    </label>
                  </div>
                  {formData.employment_type === 'permanent' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="space-y-2">
                        <Label htmlFor="paid_leave_balance">Paid Leave (days)</Label>
                        <Input id="paid_leave_balance" name="paid_leave_balance" type="number" min={0} value={formData.paid_leave_balance} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sick_leave_balance">Sick Leave (days)</Label>
                        <Input id="sick_leave_balance" name="sick_leave_balance" type="number" min={0} value={formData.sick_leave_balance} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="casual_leave_balance">Casual Leave (days)</Label>
                        <Input id="casual_leave_balance" name="casual_leave_balance" type="number" min={0} value={formData.casual_leave_balance} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maternity_leave_balance">Maternity Leave (days)</Label>
                        <Input id="maternity_leave_balance" name="maternity_leave_balance" type="number" min={0} value={formData.maternity_leave_balance} onChange={handleInputChange} />
                      </div>
                    </div>
                  )}
                  {formData.employment_type === 'probation' && (
                    <p className="text-sm text-gray-500 italic">Probation staff do not have leave entitlements.</p>
                  )}
                </div>
              </div>

              {/* Salary Components */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Salary Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basic_salary">Basic Salary</Label>
                    <Input id="basic_salary" name="basic_salary" type="number" value={formData.basic_salary} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA</Label>
                    <Input id="hra" name="hra" type="number" value={formData.hra} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport_allowance">Transport Allowance</Label>
                    <Input id="transport_allowance" name="transport_allowance" type="number" value={formData.transport_allowance} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other_allowance">Other Allowance</Label>
                    <Input id="other_allowance" name="other_allowance" type="number" value={formData.other_allowance} onChange={handleInputChange} />
                  </div>
                  <div className="col-span-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Total Gross Salary: ₹{calculateSalary().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Adding...' : 'Add Staff Member'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText /> Import Bulk Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg mb-2">Upload a CSV File</p>
              <p className="text-sm text-gray-500 mb-4">
                Use DD/MM/YYYY format for dates (date_of_birth, joining_date).<br/>
                Required Headers: staff_id, first_name, last_name, email, phone, role, department, designation, date_of_birth, gender, joining_date, address, pan_number, pf_number, aadhaar_number, bank_account_number, ifsc_code, bank_name, basic_salary, hra, transport_allowance, other_allowance
              </p>
              <div className="flex justify-center gap-4">
                <Button type="button" variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" /> Download Template
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  ref={(el) => window._csvUploadRef = el}
                />
                <Button
                  type="button"
                  variant="default"
                  className="cursor-pointer"
                  disabled={isUploading}
                  onClick={() => document.getElementById('csv-upload').click()}
                >
                  {isUploading ? 'Processing...' : 'Choose CSV File'}
                </Button>
              </div>
            </div>
            
            {uploadResult && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${uploadResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {uploadResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                <p>{uploadResult.success ? `Successfully imported ${uploadResult.count} staff records.` : `Import failed: ${uploadResult.message}`}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}