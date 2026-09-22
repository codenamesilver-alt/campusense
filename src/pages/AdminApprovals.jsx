import React, { useState, useEffect } from 'react';
import { base44, apiClient } from '@/api/base44Client';
import { usePermissions } from '@/components/auth/PermissionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fetchAll } from '@/lib/fetchAll';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  pending: <Clock className="h-3.5 w-3.5 mr-1" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
  rejected: <XCircle className="h-3.5 w-3.5 mr-1" />
};

export default function AdminApprovals() {
  const { isAdmin, loading: permissionLoading } = usePermissions();
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionRequest, setActionRequest] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [requestsData, studentsData, transactionsData] = await Promise.all([
        fetchAll('ApprovalRequest'),
        fetchAll('Student'),
        fetchAll('FeeTransaction')
      ]);
      setRequests(requestsData);
      setStudents(studentsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading approval requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const getTransaction = (request) =>
    transactions.find(t => t.id === request.transaction_id);

  const getStudentName = (request) => {
    const tx = getTransaction(request);
    if (!tx) return 'Unknown';
    const student = students.find(s => s.id === tx.student_id);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  const getChanges = (request) => {
    let changes = request.changes;
    if (typeof changes === 'string') {
      try { changes = JSON.parse(changes); } catch { changes = []; }
    }
    return Array.isArray(changes) ? changes : [];
  };

  const formatValue = (change) => {
    if (change.field === 'payment_mode') return String(change.new_value ?? '').toUpperCase();
    if (change.field === 'transaction_date') return change.new_value ? format(new Date(change.new_value), 'MMM dd, yyyy') : '';
    return `₹${Number(change.new_value).toLocaleString('en-IN')}`;
  };

  const openAction = (request, type) => {
    setActionRequest(request);
    setActionType(type);
    setAdminComment('');
  };

  const performAction = async () => {
    if (!actionRequest) return;
    setProcessing(true);
    try {
      const payload = adminComment.trim() ? { comment: adminComment.trim() } : {};
      await apiClient.post(`/approvals/${actionRequest.id}/${actionType}`, payload);
      setActionRequest(null);
      setActionType(null);
      setAdminComment('');
      await loadData();
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      alert(error.response?.data?.error || `Failed to ${actionType} request.`);
    } finally {
      setProcessing(false);
    }
  };

  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {STATUS_ICONS[status] || STATUS_ICONS.pending}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  if (permissionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-4 text-center">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-semibold text-gray-800">Admin Access Required</h2>
        <p className="text-gray-500">Only administrators can approve or reject fee change requests.</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const resolvedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Approvals</h1>
        <p className="text-gray-500">Review and approve or reject fee change requests submitted by staff.</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="resolved">History ({resolvedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pending requests</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => {
                        const tx = getTransaction(request);
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.requested_by_name}</TableCell>
                            <TableCell>{getStudentName(request)}</TableCell>
                            <TableCell>{tx ? tx.receipt_number : request.transaction_id}</TableCell>
                            <TableCell>
                              <ul className="space-y-1 text-sm">
                                {getChanges(request).map((c, i) => (
                                  <li key={i} className="text-gray-700">
                                    <span className="font-medium">{c.label}:</span>{' '}
                                    <span className="text-red-600 line-through">{String(c.old_value ?? '')}</span>
                                    {' → '}
                                    <span className="text-green-600">{formatValue(c)}</span>
                                  </li>
                                ))}
                              </ul>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="text-sm text-gray-700">{request.reason}</p>
                            </TableCell>
                            <TableCell>{format(new Date(request.created_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openAction(request, 'approve')}>
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openAction(request, 'reject')}>
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading history...</div>
              ) : resolvedRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No resolved requests yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Reviewed By / Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolvedRequests.map((request) => {
                        const tx = getTransaction(request);
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.requested_by_name}</TableCell>
                            <TableCell>{getStudentName(request)}</TableCell>
                            <TableCell>{tx ? tx.receipt_number : request.transaction_id}</TableCell>
                            <TableCell>
                              <ul className="space-y-1 text-sm">
                                {getChanges(request).map((c, i) => (
                                  <li key={i} className="text-gray-700">
                                    <span className="font-medium">{c.label}:</span>{' '}
                                    <span className="line-through">{String(c.old_value ?? '')}</span>
                                    {' → '}
                                    {formatValue(c)}
                                  </li>
                                ))}
                              </ul>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="text-sm text-gray-700">{request.reason}</p>
                            </TableCell>
                            <TableCell><StatusBadge status={request.status} /></TableCell>
                            <TableCell>
                              <p className="text-sm">{request.approved_by_name || '-'}</p>
                              {request.admin_comment && (
                                <p className="text-xs text-gray-500 mt-1">"{request.admin_comment}"</p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionRequest && !!actionType} onOpenChange={(open) => { if (!open) { setActionRequest(null); setActionType(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Change Request' : 'Reject Change Request'}
            </DialogTitle>
          </DialogHeader>
          {actionRequest && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Requested by:</strong> {actionRequest.requested_by_name}</p>
                <p><strong>Student:</strong> {getStudentName(actionRequest)}</p>
              </div>
              <ul className="space-y-1 text-sm bg-gray-50 rounded-lg p-3">
                {getChanges(actionRequest).map((c, i) => (
                  <li key={i} className="text-gray-700">
                    <span className="font-medium">{c.label}:</span>{' '}
                    <span className="line-through text-red-600">{String(c.old_value ?? '')}</span>
                    {' → '}
                    <span className="text-green-600">{formatValue(c)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Label>Comment (optional)</Label>
                <Textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={actionType === 'reject' ? 'Reason for rejection (optional)' : 'Add a note (optional)'}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setActionRequest(null); setActionType(null); }}>Cancel</Button>
                <Button
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  onClick={performAction}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : actionType === 'approve' ? 'Approve & Update' : 'Reject'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}