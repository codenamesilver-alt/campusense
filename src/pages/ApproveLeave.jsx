
import { useState, useEffect } from 'react';
import { LeaveApplication } from '@/entities/LeaveApplication';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';

export default function ApproveLeave() {
  const [leaveApps, setLeaveApps] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [historyApps, setHistoryApps] = useState([]);
  const [comments, setComments] = useState({});

  useEffect(() => {
    loadLeaveApps();
  }, []);

  useEffect(() => {
    setPendingApps(leaveApps.filter(app => app.status === 'pending'));
    setHistoryApps(leaveApps.filter(app => app.status !== 'pending'));
  }, [leaveApps]);

  const loadLeaveApps = async () => {
    const data = await LeaveApplication.list('-created_date');
    setLeaveApps(data);
  };

  const handleApproval = async (appId, newStatus) => {
    try {
      await LeaveApplication.update(appId, { 
        status: newStatus, 
        approver_comments: comments[appId] || '',
        approver_id: 'admin' // Assuming admin approval
      });
      loadLeaveApps();
      // Here you would also trigger an update to attendance records for the approved dates.
    } catch (error) {
      console.error('Failed to update leave status:', error);
    }
  };

  const handleCommentChange = (appId, text) => {
    setComments(prev => ({ ...prev, [appId]: text }));
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return <Badge className="bg-green-500">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {pendingApps.length > 0 ? pendingApps.map(app => (
            <Card key={app.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">{app.applicant_name} <Badge variant="outline" className="ml-2">{app.applicant_type}</Badge></p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(app.start_date), 'PPP')} to {format(new Date(app.end_date), 'PPP')}
                  </p>
                  <p className="mt-2">{app.reason}</p>
                </div>
                {getStatusBadge(app.status)}
              </div>
              <div className="mt-4">
                <Textarea 
                  placeholder="Add approver comments (optional)..."
                  value={comments[app.id] || ''}
                  onChange={(e) => handleCommentChange(app.id, e.target.value)}
                />
              </div>
              <CardFooter className="flex justify-end gap-2 p-0 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleApproval(app.id, 'rejected')}>
                  <ThumbsDown className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button size="sm" onClick={() => handleApproval(app.id, 'approved')}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Approve
                </Button>
              </CardFooter>
            </Card>
          )) : <p>No pending leave requests.</p>}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Leave History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Dates</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {historyApps.map(app => (
                <TableRow key={app.id}>
                  <TableCell>{app.applicant_name} ({app.applicant_type})</TableCell>
                  <TableCell>{format(new Date(app.start_date), 'dd/MM/yy')} - {format(new Date(app.end_date), 'dd/MM/yy')}</TableCell>
                  <TableCell>{app.reason}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
