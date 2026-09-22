import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const Student = base44.entities.Student;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Archive } from "lucide-react";

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = String(dateStr).split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    default: return 'bg-red-100 text-red-800';
  }
};

export default function DisabledDeletedStudent() {
  const [disabledStudents, setDisabledStudents] = useState([]);
  const [disabledSearchTerm, setDisabledSearchTerm] = useState("");
  const [disabledFiltered, setDisabledFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDisabledStudents();
  }, []);

  useEffect(() => {
    const filtered = disabledStudents.filter(student =>
      `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase().includes(disabledSearchTerm.toLowerCase()) ||
      String(student.admission_number || '').toLowerCase().includes(disabledSearchTerm.toLowerCase()) ||
      String(student.guardian_phone || '').includes(disabledSearchTerm) ||
      String(student.status || '').toLowerCase().includes(disabledSearchTerm.toLowerCase())
    );
    setDisabledFiltered(filtered);
  }, [disabledStudents, disabledSearchTerm]);

  const loadDisabledStudents = async () => {
    try {
      setIsLoading(true);
      const all = await Student.list('-created_date', 5000);
      const excluded = all.filter(s => s.status === 'inactive' || s.status === 'deleted');
      const sorted = excluded.sort((a, b) => {
        const aStr = `${a.first_name || ''} ${a.last_name || ''}`;
        const bStr = `${b.first_name || ''} ${b.last_name || ''}`;
        return aStr.localeCompare(bStr);
      });
      setDisabledStudents(sorted);
      setDisabledFiltered(sorted);
    } catch (error) {
      console.error('Error loading disabled/deleted students:', error);
      alert('Error loading disabled/deleted students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disabled/Deleted Students</h1>
          <p className="text-gray-500">List of all students who have been disabled or deleted</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search disabled/deleted students..."
            value={disabledSearchTerm}
            onChange={(e) => setDisabledSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Disabled/Deleted Students ({disabledFiltered.length})
          </CardTitle>
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
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Guardian Name</TableHead>
                  <TableHead>Guardian Phone</TableHead>
                  <TableHead>Disable Reason</TableHead>
                  <TableHead>Disabled Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : disabledFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      {disabledStudents.length === 0 ? 'No disabled or deleted students found' : 'No students found matching your search'}
                    </TableCell>
                  </TableRow>
                ) : (
                  disabledFiltered.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium text-sm">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.date_of_birth && formatDateToDDMMYYYY(student.date_of_birth)}
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
                        <span className="font-medium">{student.section || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{student.roll_number || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{student.father_name || student.mother_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{student.guardian_phone || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{student.disable_reason || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{student.disabled_date ? formatDateToDDMMYYYY(student.disabled_date) : '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
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
  );
}