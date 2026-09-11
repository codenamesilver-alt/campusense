import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Search, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function ReEnableStudent() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reEnableStudent, setReEnableStudent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDisabledStudents();
  }, []);

  const loadDisabledStudents = async () => {
    try {
      setIsLoading(true);
      const data = await Student.filter({ status: 'inactive' });
      // Sort client-side by disabled_date desc (most recent first)
      data.sort((a, b) => (b.disabled_date || '').localeCompare(a.disabled_date || ''));
      setStudents(data);
    } catch (error) {
      console.error('Error loading disabled students:', error);
      toast({ title: 'Error', description: 'Failed to load disabled students.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReEnable = (student) => {
    setReEnableStudent(student);
    setShowDialog(true);
  };

  const handleReEnable = async () => {
    if (!reEnableStudent) return;
    try {
      await Student.update(reEnableStudent.id, {
        status: 'active',
        disable_reason: '',
        disabled_date: null,
      });
      toast({
        title: 'Student Re-Enabled',
        description: `${reEnableStudent.first_name} ${reEnableStudent.last_name} has been reinstated to Class ${reEnableStudent.class} - Section ${reEnableStudent.section}.`,
      });
      setShowDialog(false);
      setReEnableStudent(null);
      loadDisabledStudents();
    } catch (error) {
      console.error('Error re-enabling student:', error);
      toast({ title: 'Error', description: 'Failed to re-enable student.', variant: 'destructive' });
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (s.admission_number || '').toLowerCase().includes(term) ||
      (s.class || '').toLowerCase().includes(term) ||
      (s.section || '').toLowerCase().includes(term) ||
      (s.guardian_phone || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Re-Enable Student</h1>
        <p className="text-gray-500">Reinstate disabled students back to their class</p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Disabled Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disabled Students List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Disabled Students List ({filteredStudents.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, class, adm no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Guardian Contact</TableHead>
                  <TableHead>Disabled Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading disabled students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>{searchTerm ? 'No disabled students match your search.' : 'No disabled students found. All students are currently active.'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.father_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{student.admission_number || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{student.class || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span>{student.section || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{student.guardian_phone || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(student.disabled_date)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{student.disable_reason || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">Inactive</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => confirmReEnable(student)}
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" />
                          Re-Enable
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-Enable Student</DialogTitle>
          </DialogHeader>
          {reEnableStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">
                  You are about to reinstate <strong>{reEnableStudent.first_name} {reEnableStudent.last_name}</strong> back to <strong>Class {reEnableStudent.class} - Section {reEnableStudent.section}</strong>. The student will reappear in all active lists.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Admission No.</p>
                  <p className="font-medium">{reEnableStudent.admission_number || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Disabled Date</p>
                  <p className="font-medium">{formatDate(reEnableStudent.disabled_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reason Disabled</p>
                  <p className="font-medium capitalize">{reEnableStudent.disable_reason || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReEnable}>
              <UserCheck className="mr-2 h-4 w-4" />
              Confirm Re-Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}