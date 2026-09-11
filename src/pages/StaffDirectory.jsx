import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Mail, Phone, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function StaffDirectory() {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    designation: 'all',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = staffList;
    
    if (filters.search) {
      result = result.filter(staff =>
        `${staff.first_name} ${staff.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        staff.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        staff.staff_id.includes(filters.search)
      );
    }

    if (filters.department !== 'all') {
      result = result.filter(staff => staff.department === filters.department);
    }
    
    if (filters.designation !== 'all') {
      result = result.filter(staff => staff.designation === filters.designation);
    }

    setFilteredStaff(result);
  }, [filters, staffList]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffData, deptData, desigData] = await Promise.all([
        base44.entities.Staff.list('-created_date'),
        base44.entities.Department.list(),
        base44.entities.Designation.list(),
      ]);
      setStaffList(staffData);
      setFilteredStaff(staffData);
      setDepartments(deptData);
      setDesignations(desigData);
    } catch (error) {
      console.error("Failed to fetch staff data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleViewProfile = (staff) => {
    setSelectedStaff(staff);
    setShowProfileDialog(true);
  };

  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setEditFormData(staff);
    setShowEditDialog(true);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      await base44.entities.Staff.update(selectedStaff.id, editFormData);
      alert('Staff details updated successfully!');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Failed to update staff details.');
    }
  };

  const handleDeactivate = async (staff) => {
    const confirmMessage = `⚠️ WARNING: You are about to deactivate ${staff.first_name} ${staff.last_name}.\n\nThis will:\n- Set their status to INACTIVE\n- Remove them from active staff lists\n- Prevent them from being assigned to classes/subjects\n\nAre you sure you want to proceed?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await base44.entities.Staff.update(staff.id, { status: 'inactive' });
        alert('Staff member deactivated successfully.');
        fetchData();
      } catch (error) {
        console.error('Error deactivating staff:', error);
        alert('Failed to deactivate staff member.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'inactive': return <Badge variant="destructive">Inactive</Badge>;
      case 'terminated': return <Badge variant="outline">Terminated</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Staff Directory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.department} onValueChange={(val) => handleFilterChange('department', val)}>
              <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.designation} onValueChange={(val) => handleFilterChange('designation', val)}>
              <SelectTrigger><SelectValue placeholder="Filter by Designation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designations.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan="5" className="text-center">Loading staff...</TableCell></TableRow>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map(staff => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={staff.photo_url} />
                          <AvatarFallback>{staff.first_name[0]}{staff.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.first_name} {staff.last_name}</p>
                          <p className="text-sm text-gray-500">ID: {staff.staff_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gray-400"/> {staff.email}</span>
                          <span className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-gray-400"/> {staff.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <p className="font-medium">{staff.designation}</p>
                        <p className="text-sm text-gray-500">{staff.department}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(staff.status)}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent>
                           <DropdownMenuItem onClick={() => handleViewProfile(staff)}>View Profile</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEdit(staff)}>Edit</DropdownMenuItem>
                           <DropdownMenuItem className="text-red-500" onClick={() => handleDeactivate(staff)}>Deactivate</DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan="5" className="text-center">No staff members found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Profile</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedStaff.photo_url} />
                  <AvatarFallback className="text-2xl">{selectedStaff.first_name[0]}{selectedStaff.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStaff.first_name} {selectedStaff.last_name}</h2>
                  <p className="text-gray-500">{selectedStaff.designation} • {selectedStaff.department}</p>
                  {getStatusBadge(selectedStaff.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Staff ID</Label>
                  <p className="font-medium">{selectedStaff.staff_id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="font-medium">{selectedStaff.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Role</Label>
                  <p className="font-medium capitalize">{selectedStaff.role}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Date of Birth</Label>
                  <p className="font-medium">{formatDate(selectedStaff.date_of_birth)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Gender</Label>
                  <p className="font-medium capitalize">{selectedStaff.gender}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Joining Date</Label>
                  <p className="font-medium">{formatDate(selectedStaff.joining_date)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Monthly Salary</Label>
                  <p className="font-medium">₹{selectedStaff.salary?.toLocaleString() || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">Address</Label>
                  <p className="font-medium">{selectedStaff.address || 'N/A'}</p>
                </div>
              </div>

              {/* Payroll Information */}
              {(selectedStaff.pan_number || selectedStaff.aadhaar_number || selectedStaff.bank_account_number) && (
                <>
                  <hr />
                  <h3 className="text-lg font-semibold">Payroll Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStaff.pan_number && (
                      <div>
                        <Label className="text-gray-500">PAN Number</Label>
                        <p className="font-medium">{selectedStaff.pan_number}</p>
                      </div>
                    )}
                    {selectedStaff.pf_number && (
                      <div>
                        <Label className="text-gray-500">PF Number</Label>
                        <p className="font-medium">{selectedStaff.pf_number}</p>
                      </div>
                    )}
                    {selectedStaff.aadhaar_number && (
                      <div>
                        <Label className="text-gray-500">Aadhaar Number</Label>
                        <p className="font-medium">{selectedStaff.aadhaar_number}</p>
                      </div>
                    )}
                    {selectedStaff.bank_name && (
                      <div>
                        <Label className="text-gray-500">Bank Name</Label>
                        <p className="font-medium">{selectedStaff.bank_name}</p>
                      </div>
                    )}
                    {selectedStaff.bank_account_number && (
                      <div>
                        <Label className="text-gray-500">Account Number</Label>
                        <p className="font-medium">{selectedStaff.bank_account_number}</p>
                      </div>
                    )}
                    {selectedStaff.ifsc_code && (
                      <div>
                        <Label className="text-gray-500">IFSC Code</Label>
                        <p className="font-medium">{selectedStaff.ifsc_code}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={editFormData.first_name} onChange={(e) => handleEditInputChange('first_name', e.target.value)} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={editFormData.last_name} onChange={(e) => handleEditInputChange('last_name', e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={editFormData.email} onChange={(e) => handleEditInputChange('email', e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editFormData.phone} onChange={(e) => handleEditInputChange('phone', e.target.value)} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={editFormData.department} onValueChange={(val) => handleEditInputChange('department', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Designation</Label>
                  <Select value={editFormData.designation} onValueChange={(val) => handleEditInputChange('designation', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {designations.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Salary</Label>
                  <Input type="number" value={editFormData.salary} onChange={(e) => handleEditInputChange('salary', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editFormData.status} onValueChange={(val) => handleEditInputChange('status', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Textarea value={editFormData.address} onChange={(e) => handleEditInputChange('address', e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}