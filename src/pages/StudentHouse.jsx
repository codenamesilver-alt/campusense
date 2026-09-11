
import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { StudentHouse as StudentHouseEntity } from '@/entities/StudentHouse'; // Renamed import to avoid conflict
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Home, Save, Users } from 'lucide-react';
import HouseManagementCard from '../components/house/HouseManagementCard';
import { motion } from "framer-motion";

export default function StudentHouse() {
  const [students, setStudents] = useState([]);
  const [houses, setHouses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentHouseAssignments, setStudentHouseAssignments] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    loadHouses();
    console.log('Loading dropdown data for student house...');
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log(`Loading students for house assignment - Class: ${selectedClass}, Section: ${selectedSection}`);
      loadStudents();
    } else {
      setStudents([]);
      setStudentHouseAssignments({});
    }
  }, [selectedClass, selectedSection, houses]); // Added 'houses' to dependencies to re-load students if houses change

  const loadDropdownData = async () => {
    try {
      console.log('Fetching classes and sections for student house...');
      const classData = await Class.list('numeric_value');
      const sectionData = await Section.list('name');
      console.log('Student House - Classes loaded:', classData.length);
      console.log('Student House - Sections loaded:', sectionData.length);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load classes or sections for student house:', error);
    }
  };

  const loadHouses = async () => {
    try {
      const houseData = await StudentHouseEntity.list(); // Use the aliased entity
      setHouses(houseData);
    } catch (error) {
      console.error('Error loading houses:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading students for house assignment: class=${selectedClass}, section=${selectedSection}`);
      
      const filteredData = await Student.filter({
        class: selectedClass,
        section: selectedSection,
        status: 'active'
      });
      
      console.log('Filtered students for house assignment:', filteredData.length);
      setStudents(filteredData);

      // Initialize house assignments with current student houses
      const assignments = {};
      filteredData.forEach(student => {
        if (student.house) {
          assignments[student.id] = student.house;
        }
      });
      setStudentHouseAssignments(assignments);
    } catch (error) {
      console.error('Error loading students for house assignment:', error);
      alert('Error loading students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHouseAssignment = (studentId, houseName) => {
    setStudentHouseAssignments(prev => ({
      ...prev,
      [studentId]: houseName
    }));
  };

  const handleSaveAssignments = async () => {
    try {
      setIsSaving(true);
      let updatedCount = 0;

      // Update each student's house assignment
      for (const [studentId, houseName] of Object.entries(studentHouseAssignments)) {
        await Student.update(studentId, { house: houseName });
        updatedCount++;
      }

      alert(`House assignments updated for ${updatedCount} student(s).`);
      loadStudents(); // Refresh the data
    } catch (error) {
      console.error('Error saving house assignments:', error);
      alert('Error saving house assignments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // New function to generate house badge with dynamic styling
  const getHouseBadge = (houseName) => {
    const house = houses.find(h => h.house_name === houseName);
    if (!house) return <Badge variant="secondary">Not Assigned</Badge>;
    return (
      <Badge style={{ backgroundColor: `${house.house_color}20`, color: house.house_color, border: `1px solid ${house.house_color}50` }}>
        {house.house_name}
      </Badge>
    );
  };

  const getHouseStats = () => {
    const stats = {};
    houses.forEach(house => {
      stats[house.house_name] = 0;
    });

    Object.values(studentHouseAssignments).forEach(houseName => {
      if (stats.hasOwnProperty(houseName)) {
        stats[houseName]++;
      }
    });

    return stats;
  };

  const houseStats = getHouseStats();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <HouseManagementCard houses={houses} onHousesUpdate={loadHouses} />
      </motion.div>

      {/* House Statistics */}
      {houses.length > 0 && students.length > 0 && ( // Only show stats if houses are loaded and students are present
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {houses.map((house) => (
            <motion.div key={house.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 * houses.indexOf(house) }}>
              <Card className="bg-[hsl(var(--card)/0.8)] border-[hsl(var(--border)/0.5)] border-l-4" style={{borderLeftColor: house.house_color}}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">{house.house_name}</p>
                      <p className="text-2xl font-bold" style={{color: house.house_color}}>
                        {houseStats[house.house_name] || 0}
                      </p>
                    </div>
                    <Home className="h-8 w-8" style={{color: house.house_color}} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Class and Section Selection */}
      <Card className="bg-[hsl(var(--card)/0.8)] border-[hsl(var(--border)/0.5)]">
        <CardHeader>
          <CardTitle>Select Class & Section to Assign Houses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {selectedClass && selectedSection && (
        <Card className="bg-[hsl(var(--card)/0.8)] border-[hsl(var(--border)/0.5)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Students - Class {selectedClass} Section {selectedSection} ({students.length})
            </CardTitle>
             {Object.keys(studentHouseAssignments).length > 0 && (
              <Button onClick={handleSaveAssignments} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Assignments
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-[hsl(var(--border)/0.5)]">
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Current House</TableHead>
                    <TableHead>Assign House</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No active students found in this class and section
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id} className="border-b-[hsl(var(--border)/0.5)]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
                              <span className="text-white font-medium text-sm">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-200">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {student.father_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-gray-400">{student.admission_number}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.roll_number || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {getHouseBadge(student.house)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={studentHouseAssignments[student.id] || ''}
                            onValueChange={(value) => handleHouseAssignment(student.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select house" />
                            </SelectTrigger>
                            <SelectContent>
                              {houses.map((house) => (
                                <SelectItem key={house.id} value={house.house_name}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{backgroundColor: house.house_color}}
                                    ></div>
                                    {house.house_name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {(!selectedClass || !selectedSection) && houses.length > 0 && ( // Only show placeholder if houses are loaded
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select both class and section to assign houses</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
