import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw, Search, IndianRupee, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentFeeMappingPage() {
  const [students, setStudents] = useState([]);
  const [feeMappings, setFeeMappings] = useState([]);
  const [classStructures, setClassStructures] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    const initialize = async () => {
      console.log('🔄 Initializing StudentFeeMapping page...');
      await initializeSession();
      await loadData();
    };
    initialize();
  }, []);

  const getCurrentSessionFromDB = async () => {
    try {
      console.log('🔍 Getting current session from database...');
      
      const sessions = await base44.entities.Session.list();
      console.log('📚 All sessions:', sessions);
      
      if (!sessions || sessions.length === 0) {
        console.warn('⚠️ No sessions found in database');
        return '2025-26';
      }
      
      const settings = await base44.entities.SchoolSetting.list();
      console.log('📋 SchoolSetting:', settings);
      
      if (settings && settings.length > 0 && settings[0].current_session_id) {
        const currentSession = sessions.find(s => s.id === settings[0].current_session_id);
        if (currentSession) {
          console.log('✅ Current session from settings:', currentSession.name);
          return currentSession.name;
        }
      }
      
      const currentSession = sessions.find(s => s.is_current === true);
      if (currentSession) {
        console.log('✅ Current session with is_current flag:', currentSession.name);
        return currentSession.name;
      }
      
      console.log('⚠️ Using first session as default:', sessions[0].name);
      return sessions[0].name;
    } catch (error) {
      console.error('❌ Error getting current session:', error);
      return '2025-26';
    }
  };

  const initializeSession = async () => {
    try {
      console.log('📅 Loading sessions for StudentFeeMapping...');
      const sessions = await base44.entities.Session.list();
      console.log('✅ Loaded sessions:', sessions);
      console.log('Session count:', sessions ? sessions.length : 0);
      
      const currentSession = await getCurrentSessionFromDB();
      console.log('✅ Current session:', currentSession);
      
      setAvailableSessions(sessions || []);
      setAcademicYear(currentSession);
      
      if (!sessions || sessions.length === 0) {
        console.error('⚠️ No sessions found! User needs to create sessions in General Settings');
      }
    } catch (error) {
      console.error('❌ Error initializing session:', error);
      console.error('Error details:', error.message);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudentsForClass();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadData = async () => {
    try {
      const [mappingsData, structuresData, classData, sectionData, feeHeadsData] = await Promise.all([
        base44.entities.StudentFeeMapping.list('-created_date'),
        base44.entities.ClassFeeStructure.list(),
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name'),
        base44.entities.FeeHead.list()
      ]);
      
      setFeeMappings(mappingsData);
      setClassStructures(structuresData);
      setClasses(classData);
      setSections(sectionData);
      setFeeHeads(feeHeadsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadStudentsForClass = async () => {
    try {
      setIsLoading(true);
      const allStudents = await fetchAll('Student');
      
      let studentsData;
      if (selectedSection === 'all') {
        // Load students from all sections of the selected class
        studentsData = allStudents.filter(student => 
          student.class === selectedClass && 
          student.status === 'active'
        );
        console.log(`📚 Loaded ${studentsData.length} students from all sections of class ${selectedClass}`);
      } else {
        // Load students from specific section
        studentsData = allStudents.filter(student => 
          student.class === selectedClass && 
          student.section === selectedSection &&
          student.status === 'active'
        );
        console.log(`📚 Loaded ${studentsData.length} students from class ${selectedClass} section ${selectedSection}`);
      }
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_phone?.includes(searchTerm)
      );
    }
    setFilteredStudents(filtered);
  };

  // Helper function to add delay between batch operations
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const autoAssignFeeStructure = async () => {
    if (!selectedClass || !selectedSection) {
      alert('Please select class and section first');
      return;
    }

    if (filteredStudents.length === 0) {
      alert('No students found for the selected class and section');
      return;
    }

    try {
      setIsLoading(true);
      setProgressMessage('🔍 Finding applicable fee structures...');
      
      // Get applicable fee structures for the selected class
      const selectedClassId = classes.find(c => c.name === selectedClass)?.id;
      const selectedSectionId = selectedSection === 'all' ? null : sections.find(sec => sec.name === selectedSection)?.id;
      const applicableStructures = classStructures.filter(s => {
        const classMatches = s.class_id === selectedClassId;
        const sectionMatches = selectedSection === 'all' 
          ? true  // If "All Sections" is selected, include all fee structures for this class
          : (s.section_id === selectedSectionId || !s.section_id); // Specific section or no section specified
        const isEnabled = s.enabled !== false;
        const yearMatches = s.academic_year === academicYear;
        
        return classMatches && sectionMatches && isEnabled && yearMatches;
      });

      if (applicableStructures.length === 0) {
        alert('No fee structures found for this class/section. Please create fee structures first in "Class Fee Structure" page.');
        setProgressMessage('');
        return;
      }

      console.log(`✅ Found ${applicableStructures.length} applicable fee structures`);
      console.log(`👥 Processing ${filteredStudents.length} students`);

      // Prepare all mappings and dues in bulk arrays
      const allMappingsToCreate = [];
      const allDuesToCreate = [];
      let skippedCount = 0;

      setProgressMessage(`📝 Preparing fee mappings for ${filteredStudents.length} students...`);

      for (const student of filteredStudents) {
        for (const structure of applicableStructures) {
          // Skip Admission Fee for existing students (is_new_admission is false, null, or undefined)
          const feeHeadForCheck = feeHeads.find(h => h.id === structure.fee_head_id);
          const isAdmissionFee = ((feeHeadForCheck?.fee_head_name || feeHeadForCheck?.name) || '').toLowerCase().includes('admission');
          if (isAdmissionFee && !student.is_new_admission) {
            skippedCount++;
            continue;
          }

          // Check if mapping already exists for this student, fee head, and academic year
          const existingMapping = feeMappings.find(m => 
            m.student_id === student.id && 
            m.fee_head_id === structure.fee_head_id &&
            m.academic_year === academicYear
          );

          if (!existingMapping) {
            const feeHead = feeHeads.find(h => h.id === structure.fee_head_id);
            const frequency = feeHead?.frequency || 'one_time';

            // Parse due_date: could be a day number ("20") or full date ("2026-04-20")
            const firstYear = academicYear ? parseInt(academicYear.split('-')[0]) : 2026;
            const dayOfMonth = structure.due_date && structure.due_date.match(/^\d{1,2}$/)
              ? parseInt(structure.due_date)
              : 20;

            // Build list of due dates
            const dueDates = [];
            if (frequency === 'monthly') {
              // April (month 3) of firstYear to March (month 2) of firstYear+1
              for (let i = 0; i < 12; i++) {
                const monthIndex = (3 + i) % 12; // 3=Apr, 4=May, ..., 11=Dec, 0=Jan, 1=Feb, 2=Mar
                const year = (3 + i) <= 11 ? firstYear : firstYear + 1;
                dueDates.push(new Date(year, monthIndex, dayOfMonth));
              }
            } else if (structure.due_date && structure.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dueDates.push(new Date(structure.due_date));
            } else {
              dueDates.push(new Date(firstYear, 3, dayOfMonth)); // April of firstYear
            }

            for (const dueDate of dueDates) {
              const dueDateStr = format(dueDate, 'yyyy-MM-dd');
              const mapping = {
                student_id: student.id,
                fee_head_id: structure.fee_head_id,
                amount: structure.amount,
                due_date: dueDateStr,
                academic_year: academicYear,
                status: 'active'
              };
              allMappingsToCreate.push(mapping);

              const feeDue = {
                student_id: student.id,
                fee_type: (feeHead?.fee_head_name || feeHead?.name || 'Fee').slice(0, 50),
                amount: structure.amount,
                paid_amount: 0,
                balance_amount: structure.amount,
                due_date: dueDateStr,
                academic_year: academicYear,
                status: 'pending'
              };
              allDuesToCreate.push(feeDue);
            }
          } else {
            skippedCount++;
          }
        }
      }

      if (allMappingsToCreate.length === 0) {
        alert('✅ All students already have fee mappings assigned for the selected criteria!');
        setProgressMessage('');
        return;
      }

      console.log(`📦 Total mappings to create: ${allMappingsToCreate.length}`);
      console.log(`📦 Total dues to create: ${allDuesToCreate.length}`);
      console.log(`⏭️ Skipped existing mappings: ${skippedCount}`);

      // Process in batches to avoid rate limits
      const BATCH_SIZE = 20; // Create 20 records at a time
      const DELAY_BETWEEN_BATCHES = 2000; // 2s delay between batches

      // Create fee mappings in batches
      setProgressMessage(`💾 Creating fee mappings (${allMappingsToCreate.length} records)...`);
      for (let i = 0; i < allMappingsToCreate.length; i += BATCH_SIZE) {
        const batch = allMappingsToCreate.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Creating mapping batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allMappingsToCreate.length / BATCH_SIZE)}`);
        
        await base44.entities.StudentFeeMapping.bulkCreate(batch);
        
        // Update progress
        const progress = Math.min(i + BATCH_SIZE, allMappingsToCreate.length);
        setProgressMessage(`💾 Creating fee mappings (${progress}/${allMappingsToCreate.length})...`);
        
        // Delay between batches to respect rate limits
        if (i + BATCH_SIZE < allMappingsToCreate.length) {
          await delay(DELAY_BETWEEN_BATCHES);
        }
      }

      console.log('✅ All fee mappings created successfully');

      // Create fee dues in batches
      setProgressMessage(`💾 Creating fee dues (${allDuesToCreate.length} records)...`);
      for (let i = 0; i < allDuesToCreate.length; i += BATCH_SIZE) {
        const batch = allDuesToCreate.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Creating dues batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allDuesToCreate.length / BATCH_SIZE)}`);
        
        await base44.entities.FeeDue.bulkCreate(batch);
        
        // Update progress
        const progress = Math.min(i + BATCH_SIZE, allDuesToCreate.length);
        setProgressMessage(`💾 Creating fee dues (${progress}/${allDuesToCreate.length})...`);
        
        // Delay between batches to respect rate limits
        if (i + BATCH_SIZE < allDuesToCreate.length) {
          await delay(DELAY_BETWEEN_BATCHES);
        }
      }

      console.log('✅ All fee dues created successfully');

      setProgressMessage('✅ Success! Refreshing data...');
      await loadData(); // Reload data to show newly created mappings
      
      setProgressMessage('');
      alert(`✅ Success!\n\nCreated:\n- ${allMappingsToCreate.length} fee mappings\n- ${allDuesToCreate.length} fee dues\n${skippedCount > 0 ? `\nSkipped ${skippedCount} existing fee items` : ''}\n\nFor ${filteredStudents.length} students.\n\nYou can now collect fees from the "Fee Collection" page.`);
      
    } catch (error) {
      console.error('❌ Error auto-assigning fee structure:', error);
      setProgressMessage('');
      alert('❌ Error: ' + error.message + '\n\nPlease try again or check the console for details.');
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  };

  const getStudentFeeMappings = (studentId) => {
    return feeMappings.filter(m => 
      m.student_id === studentId && 
      m.academic_year === academicYear &&
      m.status === 'active'
    );
  };

  const getFeeHeadName = (feeHeadId) => {
    const feeHead = feeHeads.find(h => h.id === feeHeadId);
    return feeHead?.fee_head_name || feeHead?.name || 'Fee';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Student Fee Mapping & Due Generation</h1>
          <p className="text-gray-500">Map fee structures to students and generate fee dues</p>
        </div>
      </div>

      {availableSessions.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Academic Sessions Found</AlertTitle>
          <AlertDescription>
            Please create academic sessions in Settings → General Settings → Academic Session Management before mapping fees.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How Fee Assignment Works</AlertTitle>
        <AlertDescription>
          1. First, create Fee Heads in "Fee Head Definition"<br/>
          2. Then, assign them to classes in "Class Fee Structure"<br/>
          3. Finally, click "Auto-Assign" here to create fee dues for students<br/>
          4. After assignment, go to "Fee Collection" to collect payments
        </AlertDescription>
      </Alert>

      {progressMessage && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle className="text-blue-800">Processing...</AlertTitle>
          <AlertDescription>{progressMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Class Selection & Auto-Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Academic Year *</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableSessions.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No sessions available</div>
                  ) : (
                    availableSessions.map(session => (
                      <SelectItem key={session.id} value={session.name}>
                        {session.name} {session.is_current ? '(Current)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-32">
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
              <Label className="text-sm font-medium">Section *</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, admission number, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              onClick={autoAssignFeeStructure} 
              disabled={isLoading || !selectedClass || !selectedSection || !academicYear}
              className="h-10"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Auto-Assign & Generate Dues
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students - Class {selectedClass} {selectedSection === 'all' ? '(All Sections)' : `Section ${selectedSection}`} ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Details</TableHead>
                    <TableHead>Assigned Fees</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Due Dates</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No students found for the selected class and section
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const studentMappings = getStudentFeeMappings(student.id);
                      const totalAmount = studentMappings.reduce((sum, mapping) => sum + Number(mapping.amount || 0), 0);
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {student.first_name?.[0]}{student.last_name?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{student.first_name} {student.last_name}</p>
                                <p className="text-sm text-gray-500">{student.admission_number}</p>
                                <p className="text-sm text-gray-500">{student.class}-{student.section} • {student.guardian_phone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {studentMappings.length === 0 ? (
                                <span className="text-gray-400 text-sm">No fees assigned</span>
                              ) : (
                                studentMappings.map((mapping, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {getFeeHeadName(mapping.fee_head_id)}
                                    </Badge>
                                    <span className="text-sm">₹{mapping.amount.toLocaleString('en-IN')}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold">{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {studentMappings.map((mapping, index) => (
                                <div key={index} className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span>{format(new Date(mapping.due_date), 'MMM dd')}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={studentMappings.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {studentMappings.length > 0 ? 'Mapped' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Mapping Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Students</div>
              <div className="text-2xl font-bold text-blue-900">{filteredStudents.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Mapped Students</div>
              <div className="text-2xl font-bold text-green-900">
                {filteredStudents.filter(s => getStudentFeeMappings(s.id).length > 0).length}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Pending Students</div>
              <div className="text-2xl font-bold text-yellow-900">
                {filteredStudents.filter(s => getStudentFeeMappings(s.id).length === 0).length}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Total Mappings</div>
              <div className="text-2xl font-bold text-purple-900">
                {feeMappings.filter(m => m.academic_year === academicYear).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}