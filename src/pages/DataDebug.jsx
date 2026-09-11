import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DataDebug() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [studentData, classData, sectionData] = await Promise.all([
          Student.list('-created_date', 100), // get latest 100 students
          Class.list(),
          Section.list()
        ]);
        setStudents(studentData);
        setClasses(classData);
        setSections(sectionData);
      } catch (e) {
        console.error("Failed to fetch debug data:", e);
        setError('Failed to load data. Check console for details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <p>Loading debug data...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Data Debug Tool</h1>
      <p className="text-gray-600">This page shows raw, unfiltered data from the database to help diagnose issues.</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Students (Total: {students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Class (Raw Value)</TableHead>
                <TableHead>Section (Raw Value)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? students.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.first_name} {s.last_name}</TableCell>
                  <TableCell>"{s.class}"</TableCell>
                  <TableCell>"{s.section}"</TableCell>
                  <TableCell>{s.status}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan="4" className="text-center">No student data found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Classes (Total: {classes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Numeric Value</TableHead></TableRow></TableHeader>
              <TableBody>
                {classes.length > 0 ? classes.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>"{c.name}"</TableCell>
                    <TableCell>{c.numeric_value}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan="2" className="text-center">No class data found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections (Total: {sections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
              <TableBody>
                {sections.length > 0 ? sections.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>"{s.name}"</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell className="text-center">No section data found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}