import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { usePermissions } from '@/components/auth/PermissionProvider';

export default function StaffLeaveApplication() {
  const { user } = usePermissions();
  const [myLeaves, setMyLeaves] = useState([]);
  const [staff, setStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveOptions, setLeaveOptions] = useState([]);
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    leave_type: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [staffList, policyList] = await Promise.all([
        base44.entities.Staff.filter({ email: user.email }),
        base44.entities.LeaveManagementPolicy.list()
      ]);

      // Build leave options from policy (always show defaults even if no policy saved)
      const defaultOptions = [
        { value: 'paid_leave', label: 'Paid Leave', balanceField: 'paid_leave_balance' },
        { value: 'sick_leave', label: 'Sick Leave', balanceField: 'sick_leave_balance' },
        { value: 'casual_leave', label: 'Casual Leave', balanceField: 'casual_leave_balance' },
        { value: 'maternity_leave', label: 'Maternity Leave', balanceField: 'maternity_leave_balance' },
        { value: 'unpaid_leave', label: 'Unpaid Leave', balanceField: null },
      ];
      setLeaveOptions(defaultOptions);
      setFormData(prev => ({ ...prev, leave_type: defaultOptions[0].value }));

      if (staffList.length > 0) {
        const currentStaff = staffList[0];
        setStaff(currentStaff);
        const leaves = await fetchAllFiltered('LeaveApplication', {
          applicant_id: currentStaff.id,
          applicant_type: 'staff'
        }, '-created_date');
        setMyLeaves(leaves);
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!staff) {
      alert('Staff profile not found');
      return;
    }

    if (!formData.start_date || !formData.end_date || !formData.reason) {
      alert('Please fill all required fields');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.LeaveApplication.create({
        applicant_id: staff.id,
        applicant_type: 'staff',
        applicant_name: `${staff.first_name} ${staff.last_name}`,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        leave_type: formData.leave_type,
        status: 'pending'
      });

      alert('Leave application submitted successfully!');
      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
        leave_type: leaveOptions[0]?.value || ''
      });
      loadData();
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Failed to submit leave application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysCount = () => {
    if (formData.start_date && formData.end_date) {
      const days = differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type) => {
    const found = leaveOptions.find(o => o.value === type);
    if (found) return found.label;
    // fallback for old records
    return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || type;
  };

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Apply for Leave</h1>
        <p className="text-gray-500">Submit and manage your leave applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Leave Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {leaveOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date || format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Total Days: {getDaysCount()} day(s)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Reason for Leave</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a detailed reason for your leave..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Leave Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Leave Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myLeaves.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No leave applications yet</p>
              ) : (
                myLeaves.map((leave) => (
                  <div key={leave.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{getLeaveTypeLabel(leave.leave_type)}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(leave.start_date), 'dd MMM, yyyy')} - {format(new Date(leave.end_date), 'dd MMM, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {differenceInDays(new Date(leave.end_date), new Date(leave.start_date)) + 1} day(s)
                        </p>
                      </div>
                      {getStatusBadge(leave.status)}
                    </div>
                    <p className="text-sm">{leave.reason}</p>
                    {leave.approver_comments && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">Manager's Comment:</p>
                        <p className="text-gray-700">{leave.approver_comments}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Applied on {format(new Date(leave.created_date), 'dd MMM, yyyy')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance */}
      {staff?.employment_type === 'permanent' && (
        <Card>
          <CardHeader><CardTitle>Leave Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Paid Leave', field: 'paid_leave_balance', color: 'bg-green-50', text: 'text-green-700' },
                { label: 'Sick Leave', field: 'sick_leave_balance', color: 'bg-blue-50', text: 'text-blue-700' },
                { label: 'Casual Leave', field: 'casual_leave_balance', color: 'bg-yellow-50', text: 'text-yellow-700' },
                { label: 'Maternity Leave', field: 'maternity_leave_balance', color: 'bg-pink-50', text: 'text-pink-700' },
              ].map(({ label, field, color, text }) => (
                <div key={field} className={`p-4 ${color} rounded-lg`}>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className={`text-2xl font-bold ${text}`}>{staff[field] ?? 0} days</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {staff?.employment_type === 'probation' && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 italic text-center">You are on probation. Leave balance is not applicable.</p>
          </CardContent>
        </Card>
      )}

      {/* Leave Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {myLeaves.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-700">
                {myLeaves.filter(l => l.status === 'approved').length}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-700">
                {myLeaves.filter(l => l.status === 'rejected').length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Applied</p>
              <p className="text-2xl font-bold text-blue-700">
                {myLeaves.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}