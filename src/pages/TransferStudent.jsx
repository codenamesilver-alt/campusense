import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fetchAllFiltered } from "@/lib/fetchAll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowRight, CheckCircle, Users } from "lucide-react";

export default function TransferStudent() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [fromClass, setFromClass] = useState("");
  const [fromSection, setFromSection] = useState("");
  const [toClass, setToClass] = useState("");
  const [toSection, setToSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (fromClass && fromSection) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [fromClass, fromSection]);

  const loadDropdownData = async () => {
    const [classData, sectionData] = await Promise.all([
      base44.entities.Class.list("numeric_value"),
      base44.entities.Section.list("name"),
    ]);
    setClasses(classData);
    setSections(sectionData);
  };

  const loadStudents = async () => {
    setIsLoading(true);
    setSelectedStudents([]);
    setSuccessMessage("");
    const data = await fetchAllFiltered('Student', { class: fromClass, section: fromSection });
    setStudents(data.filter(s => s.status !== "deleted"));
    setIsLoading(false);
  };

  const filteredStudents = students.filter(s =>
    !searchTerm ||
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleTransfer = async () => {
    if (!toClass || !toSection) {
      alert("Please select the destination class and section.");
      return;
    }
    if (selectedStudents.length === 0) {
      alert("Please select at least one student to transfer.");
      return;
    }
    if (toClass === fromClass && toSection === fromSection) {
      alert("Source and destination class/section are the same.");
      return;
    }

    setIsTransferring(true);
    setSuccessMessage("");

    for (const studentId of selectedStudents) {
      await base44.entities.Student.update(studentId, { class: toClass, section: toSection });
    }

    setSuccessMessage(`${selectedStudents.length} student(s) successfully transferred to Class ${toClass} - Section ${toSection}.`);
    setIsTransferring(false);
    // Reload the source list
    await loadStudents();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Student</h1>
        <p className="text-gray-500">Move students from one class/section to another</p>
      </div>

      {/* Source and Destination Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Source & Destination</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* From */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">From Class</label>
              <Select value={fromClass} onValueChange={setFromClass}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">From Section</label>
              <Select value={fromSection} onValueChange={setFromSection}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center pb-1">
              <ArrowRight className="h-6 w-6 text-gray-400 mx-2" />
            </div>

            {/* To */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">To Class</label>
              <Select value={toClass} onValueChange={setToClass}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">To Section</label>
              <Select value={toSection} onValueChange={setToSection}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Students Table */}
      {fromClass && fromSection && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students in Class {fromClass} - Section {fromSection}
                {!isLoading && <Badge variant="secondary">{filteredStudents.length}</Badge>}
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 w-56"
                  />
                </div>
                <Button
                  onClick={handleTransfer}
                  disabled={selectedStudents.length === 0 || !toClass || !toSection || isTransferring}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isTransferring ? "Transferring..." : `Transfer (${selectedStudents.length})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Father Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading students...</TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No students found</TableCell>
                    </TableRow>
                  ) : filteredStudents.map(student => (
                    <TableRow
                      key={student.id}
                      className={`cursor-pointer ${selectedStudents.includes(student.id) ? "bg-blue-50" : ""}`}
                      onClick={() => toggleSelect(student.id)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </div>
                          <span className="font-medium">{student.first_name} {student.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.admission_number}</TableCell>
                      <TableCell>{student.roll_number || "-"}</TableCell>
                      <TableCell className="capitalize">{student.gender || "-"}</TableCell>
                      <TableCell>{student.father_name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={student.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!fromClass || !fromSection ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <ArrowRight className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a source class and section to view students for transfer</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}