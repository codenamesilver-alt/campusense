import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Route } from '@/entities/Route';
import { StudentTransport } from '@/entities/StudentTransport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX } from 'lucide-react';

export default function StudentTransportFees() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [transportMappings, setTransportMappings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    (async () => {
      const allStudents = await Student.list();
      const uniqueClasses = [...new Set(allStudents.map(s => s.class))];
      const uniqueSections = [...new Set(allStudents.map(s => s.section))];
      setClasses(uniqueClasses.sort());
      setSections(uniqueSections.sort());
      setRoutes(await Route.list());
      setTransportMappings(await StudentTransport.list());
    })();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      (async () => {
        setStudents(await Student.filter({ class: selectedClass, section: selectedSection, status: 'active' }));
      })();
    }
  }, [selectedClass, selectedSection]);

  const handleAssign = async (studentId, routeId, stopName) => {
    if (!routeId || !stopName) {
        alert("Please select both a route and a stop.");
        return;
    }
    const existing = transportMappings.find(m => m.student_id === studentId);
    if (existing) {
        await StudentTransport.update(existing.id, { route_id: routeId, stop_name: stopName, status: 'active' });
    } else {
        await StudentTransport.create({ student_id: studentId, route_id: routeId, stop_name: stopName, status: 'active' });
    }
    setTransportMappings(await StudentTransport.list());
  };

  const handleUnassign = async (studentId) => {
    const existing = transportMappings.find(m => m.student_id === studentId);
    if (existing) {
        await StudentTransport.delete(existing.id);
        setTransportMappings(await StudentTransport.list());
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assign Students to Transport</h1>
      
      <Card>
        <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <div className="flex gap-4">
                <Select onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select>
                <Select onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="Select Section"/></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent></Select>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assign Route</TableHead>
                <TableHead>Assign Stop</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => {
                const mapping = transportMappings.find(m => m.student_id === student.id);
                const route = mapping ? routes.find(r => r.id === mapping.route_id) : null;
                const selectedRouteId = mapping?.route_id || '';
                const selectedStop = mapping?.stop_name || '';

                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.first_name} {student.last_name}</TableCell>
                    <TableCell>
                      {mapping ? <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><UserCheck className="h-3 w-3"/>Assigned</Badge> : <Badge variant="secondary" className="flex items-center gap-1"><UserX className="h-3 w-3"/>Not Assigned</Badge>}
                    </TableCell>
                    <TableCell>
                      <Select value={selectedRouteId} onValueChange={(val) => handleAssign(student.id, val, selectedStop)}>
                          <SelectTrigger className="w-48"><SelectValue placeholder="Select Route"/></SelectTrigger>
                          <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {route && (
                        <Select value={selectedStop} onValueChange={(val) => handleAssign(student.id, selectedRouteId, val)}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Select Stop"/></SelectTrigger>
                            <SelectContent>{route.stops.map(stop => <SelectItem key={stop} value={stop}>{stop}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleUnassign(student.id)} disabled={!mapping}>Unassign</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}