import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImportStudent() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [currentSession, setCurrentSession] = useState('2026-27');
  const [admissionType, setAdmissionType] = useState(''); // 'new' or 'existing'

  useEffect(() => {
    base44.entities.Session.filter({ is_current: true }).then(sessions => {
      if (sessions.length > 0) setCurrentSession(sessions[0].name);
    });
  }, []);

  const downloadTemplate = () => {
    const headers = ['admission_number','roll_number','first_name','last_name','class','section','gender','date_of_birth','guardian_phone','guardian_email','admission_date','father_name','mother_name','address','blood_group','house'];
    const sampleData = [
      '202412001,1,John,Doe,5,A,male,15/05/2010,9876543210,john.parent@email.com,01/04/2024,Rajesh Doe,Priya Doe,"123 Main St, City",A+,Red House',
    ];
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
  const convertDateFormat = (dateString) => {
    if (!dateString) return '';
    const str = String(dateString).trim();
    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = str.split(/[-\/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    return str;
  };

  // Parse CSV manually (handles quoted fields)
  const parseCSV = (text) => {
    // Normalize Windows (\r\n) and old Mac (\r) line endings, strip BOM
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    if (lines.length < 2) return [];

    // Strip BOM from first header if present and clean headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty lines or lines that are just commas (all empty fields)
      if (!line || line.replace(/,/g, '').trim() === '') continue;

      // Handle quoted commas
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') {
          inQuotes = !inQuotes;
        } else if (line[c] === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += line[c];
        }
      }
      values.push(current.trim());

      // Skip rows where all values are empty
      if (values.every(v => !v)) continue;

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] !== undefined ? values[idx] : '';
      });

      // Only include row if it has at least first_name or admission_number
      if (row.first_name || row.admission_number) {
        rows.push(row);
      }
    }
    return rows;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    // Reset input so re-selecting the same filename triggers onChange again
    event.target.value = '';

    if (!admissionType) {
      alert('Please select whether these are New Admissions or Existing Students before uploading.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file only.');
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setPreviewData([]);  // clear old data immediately
    setImportResults(null);

    try {
      // Read CSV directly in the browser
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setErrors(['No data found in file. Please check the file format.']);
        return;
      }

      console.log(`CSV parsed: ${rows.length} data rows found`);
      setPreviewData(rows);
    } catch (error) {
      console.error('Error reading file:', error);
      setErrors(['Error reading file: ' + (error.message || 'Unknown error')]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      alert('No data to import. Please upload a CSV file first.');
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    let successCount = 0;
    let failureCount = 0;
    const importErrors = [];

    // Small delay helper to avoid API rate limits
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const [index, row] of previewData.entries()) {
      // admission_number and first_name are required; last_name can be empty
      if (!row.first_name) {
        importErrors.push(`Row ${index + 1}: Missing required field (first_name)`);
        failureCount++;
        continue;
      }

      try {
        const studentData = {
          admission_number: row.admission_number ? String(row.admission_number).trim() : '',
          roll_number: row.roll_number ? String(row.roll_number).trim() : '',
          first_name: String(row.first_name).trim(),
          last_name: row.last_name ? String(row.last_name).trim() : '',
          class: String(row.class).trim(),
          section: String(row.section).trim(),
          gender: row.gender ? String(row.gender).trim().toLowerCase() : '',
          date_of_birth: row.date_of_birth ? convertDateFormat(row.date_of_birth) : '',
          father_name: row.father_name ? String(row.father_name).trim() : '',
          mother_name: row.mother_name ? String(row.mother_name).trim() : '',
          guardian_phone: row.guardian_phone ? String(row.guardian_phone).trim().replace(/^-/, '') : '',
          guardian_email: row.guardian_email ? String(row.guardian_email).trim() : '',
          admission_date: row.admission_date ? convertDateFormat(row.admission_date) : '',
          address: row.address ? String(row.address).trim() : '',
          blood_group: row.blood_group ? String(row.blood_group).trim() : '',
          house: row.house ? String(row.house).trim() : '',
          status: 'active',
          academic_year: currentSession,
          is_new_admission: admissionType === 'new',
        };

        // Remove empty string fields to avoid validation issues
        Object.keys(studentData).forEach(key => {
          if (studentData[key] === '') delete studentData[key];
        });

        await base44.entities.Student.create(studentData);
        successCount++;
        // Throttle: wait 400ms every request, extra pause every 10 records
        await delay(400);
        if ((index + 1) % 10 === 0) await delay(1000);
      } catch (error) {
        failureCount++;
        importErrors.push(`Row ${index + 1} (${row.first_name}): ${error.message || 'Failed to import'}`);
      }
    }

    setImportResults({ total: previewData.length, success: successCount, failure: failureCount });
    if (importErrors.length > 0) setErrors(importErrors);
    if (successCount > 0) {
      setPreviewData([]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Import Students</h1>
          <p className="text-gray-500">Import student data in bulk using CSV file</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Required fields:</strong> first_name (all other fields are optional)</p>
            <p><strong>Date format:</strong> DD/MM/YYYY or DD-MM-YYYY (e.g., 15/01/2024 or 15-01-2024)</p>
            <p><strong>Note:</strong> last_name can be left empty if the full name is in first_name</p>
          </div>
        </CardContent>
      </Card>

      {/* Admission Type Selection */}
      <Card className={`border-2 ${admissionType === 'new' ? 'border-green-400 bg-green-50' : admissionType === 'existing' ? 'border-blue-400 bg-blue-50' : 'border-orange-300 bg-orange-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Step 1: Select Student Type <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">This determines whether Admission Fee will be applicable for these students.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setAdmissionType('new')}
              className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${admissionType === 'new' ? 'border-green-500 bg-green-100' : 'border-gray-200 bg-white hover:border-green-300'}`}
            >
              <div className="font-semibold text-green-700">🆕 New Admissions</div>
              <div className="text-sm text-gray-600 mt-1">Students joining the school for the first time. <strong>Admission Fee will be charged.</strong></div>
            </button>
            <button
              onClick={() => setAdmissionType('existing')}
              className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${admissionType === 'existing' ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <div className="font-semibold text-blue-700">📋 Existing Students</div>
              <div className="text-sm text-gray-600 mt-1">Students already enrolled (data migration/re-import). <strong>Admission Fee will NOT be charged.</strong></div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              onChange={handleFileUpload}
              accept=".csv"
              disabled={isUploading}
            />
            {isUploading && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Upload className="h-4 w-4 animate-spin" />
                Reading file...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {importResults && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Import Completed!</strong><br />
            Total: {importResults.total} | Success: {importResults.success} | Failed: {importResults.failure}
          </AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Errors ({errors.length}):</strong>
            <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {previewData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Preview ({previewData.length} students)
              {admissionType === 'new' && <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">New Admissions — Admission Fee applicable</span>}
              {admissionType === 'existing' && <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Existing Students — No Admission Fee</span>}
            </CardTitle>
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? (
                <><Upload className="mr-2 h-4 w-4 animate-spin" />Importing...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Import {previewData.length} Students</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adm. No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>DOB</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 15).map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{student.admission_number}</TableCell>
                      <TableCell>{student.first_name} {student.last_name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell>{student.father_name || '-'}</TableCell>
                      <TableCell>{String(student.guardian_phone || '-').replace(/^-/, '')}</TableCell>
                      <TableCell>{student.date_of_birth || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.length > 15 && (
                <p className="text-center py-3 text-gray-500 text-sm">
                  ... and {previewData.length - 15} more students
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}