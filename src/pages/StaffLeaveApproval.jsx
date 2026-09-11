import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { usePermissions } from '@/components/auth/PermissionProvider';

export default function StaffLeaveApproval() {
  const { user } = usePermissions();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [comments, setComments] = useState({});
  
  const [filters, setFilters] = useState({
    status: 'pending',
    department: 'all',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, leaves]);

  const loadData = async () => {
    try {
      const [leavesData, deptData] = await Promise.all([
        fetchAllFiltered('LeaveApplication', { applicant_type: 'staff' }, '-created_date'),
        base44.entities.Department.list()
      ]);

      // Enrich leave data with staff department info
      const enrichedLeaves = await Promise.all(
        leavesData.map(async (leave) => {
          const staffList = await base44.entities.Staff.filter({ id: leave.applicant_id });
          const staff = staffList[0];
          return {
            ...leave,
            department: staff?.department || 'N/A',
            designation: staff?.designation || 'N/A',
            staff_id: staff?.staff_id || 'N/A'
          };
        })
      );

      setLeaves(enrichedLeaves);
      setDepartments(deptData);
    } catch (error) {
      console.error('Error loading leave data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = leaves;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(leave => leave.status === filters.status);
    }

    // Department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(leave => leave.department === filters.department);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(leave =>
        leave.applicant_name.toLowerCase().includes(searchLower) ||
        leave.staff_id.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLeaves(filtered);
  };

  const LEAVE_BALANCE_FIELD = {
    sick_leave: 'sick_leave_balance',
    casual_leave: 'casual_leave_balance',
    earned_leave: 'paid_leave_balance',
    maternity_leave: 'maternity_leave_balance',
    paternity_leave: null,
    unpaid_leave: null,
    other: null
  };

  const handleApproval = async (leaveId, newStatus) => {
    try {
      await base44.entities.LeaveApplication.update(leaveId, {
        status: newStatus,
        approver_comments: comments[leaveId] || '',
        approver_id: user.email
      });

      // Deduct leave balance if approved
      if (newStatus === 'approved') {
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
          const balanceField = LEAVE_BALANCE_FIELD[leave.leave_type];
          if (balanceField) {
            const staffList = await base44.entities.Staff.filter({ id: leave.applicant_id });
            const staffMember = staffList[0];
            if (staffMember && staffMember.employment_type === 'permanent') {
              const days = differenceInDays(new Date(leave.end_date), new Date(leave.start_date)) + 1;
              const currentBalance = staffMember[balanceField] || 0;
              const newBalance = Math.max(0, currentBalance - days);
              await base44.entities.Staff.update(staffMember.id, { [balanceField]: newBalance });
            }
          }
        }
      }

      alert(`Leave ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setComments(prev => ({ ...prev, [leaveId]: '' }));
      loadData();
    } catch (error) {
      console.error('Error updating leave status:', error);
      alert('Failed to update leave status');
    }
  };

  const handleCommentChange = (leaveId, text) => {
    setComments(prev => ({ ...prev, [leaveId]: text }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      sick_leave: 'Sick Leave',
      casual_leave: 'Casual Leave',
      earned_leave: 'Earned Leave',
      maternity_leave: 'Maternity Leave',
      paternity_leave: 'Paternity Leave',
      unpaid_leave: 'Unpaid Leave',
      other: 'Other'
    };
    return types[type] || type;
  };

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Approvals</h1>
          <p className="text-gray-500">Review and approve staff leave applications</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={filters.department} onValueChange={(val) => setFilters({ ...filters, department: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or staff ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Applications */}
      <div className="space-y-4">
        {filteredLeaves.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">No leave applications found with current filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeaves.map((leave) => (
            <Card key={leave.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{leave.applicant_name}</h3>
                        {getStatusBadge(leave.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {leave.staff_id} • {leave.designation} • {leave.department}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {getLeaveTypeLabel(leave.leave_type)}
                    </Badge>
                  </div>

                  {/* Leave Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="font-medium">{format(new Date(leave.start_date), 'dd MMM, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">End Date</p>
                      <p className="font-medium">{format(new Date(leave.end_date), 'dd MMM, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">
                        {differenceInDays(new Date(leave.end_date), new Date(leave.start_date)) + 1} day(s)
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{leave.reason}</p>
                  </div>

                  {/* Comments & Actions for Pending */}
                  {leave.status === 'pending' && (
                    <>
                      <div className="space-y-2">
                        <Label>Manager's Comments (Optional)</Label>
                        <Textarea
                          placeholder="Add comments about this leave request..."
                          value={comments[leave.id] || ''}
                          onChange={(e) => handleCommentChange(leave.id, e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleApproval(leave.id, 'rejected')}
                          className="flex-1"
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApproval(leave.id, 'approved')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Existing Comments for Approved/Rejected */}
                  {leave.status !== 'pending' && leave.approver_comments && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Manager's Comment:</p>
                      <p className="text-sm text-blue-700">{leave.approver_comments}</p>
                      <p className="text-xs text-blue-600 mt-1">By: {leave.approver_id}</p>
                    </div>
                  )}

                  {/* Application Date */}
                  <p className="text-xs text-gray-400">
                    Applied on {format(new Date(leave.created_date), 'dd MMM, yyyy HH:mm')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}