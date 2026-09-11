import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import ComplaintFormDialog from '../components/complaints/ComplaintFormDialog';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, showClosed]);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAll('Complaint', '-date');
      setComplaints(data);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    // Filter by closed status
    if (!showClosed) {
      filtered = filtered.filter(complaint => complaint.status !== 'resolved' && complaint.status !== 'closed');
    }

    setFilteredComplaints(filtered);
  };

  const handleComplaintSubmit = async (data) => {
    try {
      await base44.entities.Complaint.create(data);
      setShowDialog(false);
      loadComplaints();
    } catch (error) {
      console.error('Error creating complaint:', error);
    }
  };

  const handleStatusChange = async (complaint, newStatus) => {
    try {
      await base44.entities.Complaint.update(complaint.id, { status: newStatus });
      loadComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'fees': return 'bg-green-100 text-green-800';
      case 'teacher': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Complaints</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Log Complaint
        </Button>
      </div>

      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="rounded"
          />
          Show Resolved/Closed
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Complaints ({filteredComplaints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Complaint By</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attachment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading complaints...
                    </TableCell>
                  </TableRow>
                ) : filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No complaints found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <Badge className={getTypeColor(complaint.complaint_type)}>
                          {complaint.complaint_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{complaint.complaint_by}</TableCell>
                      <TableCell>{complaint.phone}</TableCell>
                      <TableCell>{format(new Date(complaint.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={complaint.description}>
                          {complaint.description}
                        </div>
                      </TableCell>
                      <TableCell>{complaint.assigned_to || '-'}</TableCell>
                      <TableCell>
                        <Select value={complaint.status} onValueChange={(value) => handleStatusChange(complaint, value)}>
                          <SelectTrigger className="w-36">
                            <SelectValue>
                              <Badge className={getStatusColor(complaint.status)}>
                                {complaint.status.replace('_', ' ')}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {complaint.attachment_url && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(complaint.attachment_url, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ComplaintFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={handleComplaintSubmit}
      />
    </div>
  );
}