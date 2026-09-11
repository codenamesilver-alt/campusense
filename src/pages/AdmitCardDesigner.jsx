import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Printer, Mail, Eye, FileDown } from 'lucide-react';
import { format } from 'date-fns';

export default function AdmitCardDesigner() {
  const [examGroups, setExamGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [schoolSettings, setSchoolSettings] = useState(null);
  
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [templateOptions, setTemplateOptions] = useState({
    showPhoto: true,
    showSignature: true,
    showSchedule: true,
    customInstructions: '1. Reach the examination hall 30 minutes before the commencement of the exam.\n2. No electronic devices are allowed inside the examination hall.'
  });

  useEffect(() => {
    (async () => {
      const [examGroupData, scheduleData, classData, sectionData, reportSettingsData, schoolSettingsData] = await Promise.all([
        base44.entities.ExamGroup.list(),
        base44.entities.ExamSchedule.list(),
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name'),
        base44.entities.ReportCardSettings.list(),
        base44.entities.SchoolSetting.list()
      ]);
      setExamGroups(examGroupData);
      setSchedules(scheduleData);
      setClasses(classData);
      setSections(sectionData);
      // Merge settings - prefer SchoolSetting for logo, fallback to ReportCardSettings
      const mergedSettings = {};
      if (schoolSettingsData.length > 0) {
        mergedSettings.school_logo_url = schoolSettingsData[0].logo_url;
        mergedSettings.school_name = schoolSettingsData[0].school_name;
      }
      if (reportSettingsData.length > 0) {
        if (!mergedSettings.school_logo_url) {
          mergedSettings.school_logo_url = reportSettingsData[0].school_logo_url;
        }
        if (!mergedSettings.school_name) {
          mergedSettings.school_name = reportSettingsData[0].school_name;
        }
      }
      setSchoolSettings(mergedSettings);
    })();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      (async () => {
        const studentData = await fetchAllFiltered('Student', { class: selectedClass, section: selectedSection, status: 'active' });
        setStudents(studentData);
      })();
    }
  }, [selectedClass, selectedSection]);

  const getSchoolLogo = () => schoolSettings?.school_logo_url || '';
  const getSchoolName = () => schoolSettings?.school_name || 'School Name';

  const buildAdmitCardHTML = (title, autoPrint = false) => {
    const examGroupName = examGroups.find(g => g.id === selectedGroup)?.name || 'Examination';
    const classSchedules = schedules.filter(s => 
      s.exam_group_id === selectedGroup && 
      s.class === selectedClass && 
      (s.section === selectedSection || s.section === 'All Sections')
    );
    const schoolLogo = getSchoolLogo();
    const schoolName = getSchoolName();

    // Group students in triplets for 3-per-page layout
    const studentPairs = [];
    for (let i = 0; i < students.length; i += 3) {
      studentPairs.push(students.slice(i, i + 3));
    }

    const cardStyle = `
      border: 2px solid #333;
      padding: 8px 12px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: 31%;
      page-break-inside: avoid;
      font-size: 10px;
    `;

    const renderCard = (student) => `
      <div style="${cardStyle}">
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #333; padding-bottom:8px; margin-bottom:8px;">
          ${templateOptions.showSignature && schoolLogo
            ? `<img src="${schoolLogo}" alt="logo" style="height:40px; object-fit:contain;" onerror="this.style.display='none'"/>`
            : '<div style="width:40px;"></div>'}
          <div style="text-align:center; flex:1; padding: 0 8px;">
            <div style="font-size:14px; font-weight:bold;">${schoolName}</div>
            <div style="font-size:11px; font-weight:600; margin-top:3px;">ADMIT CARD — ${examGroupName}</div>
          </div>
          ${templateOptions.showPhoto
            ? (student.photo_url
                ? `<img src="${student.photo_url}" alt="photo" style="width:45px;height:55px;object-fit:cover;border:1px solid #999;" onerror="this.outerHTML='<div style=\\'width:45px;height:55px;border:1px solid #999;display:flex;align-items:center;justify-content:center;font-size:9px;background:#f5f5f5;\\'>No Photo</div>'"/>`
                : `<div style="width:45px;height:55px;border:1px solid #999;display:flex;align-items:center;justify-content:center;font-size:9px;background:#f5f5f5;">No Photo</div>`)
            : '<div style="width:45px;"></div>'}
        </div>

        <div style="display:flex; gap:20px; margin-bottom:6px;">
          <div style="flex:1;"><span style="font-weight:bold;">Name:</span> ${student.first_name} ${student.last_name}</div>
          <div><span style="font-weight:bold;">Roll No:</span> ${student.roll_number || '-'}</div>
          <div><span style="font-weight:bold;">Adm No:</span> ${student.admission_number}</div>
          <div><span style="font-weight:bold;">Class:</span> ${student.class}-${student.section}</div>
        </div>

        ${templateOptions.showSchedule && classSchedules.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:10px;flex:1;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="border:1px solid #999;padding:4px 6px;text-align:left;">Date</th>
                <th style="border:1px solid #999;padding:4px 6px;text-align:left;">Subject</th>
                <th style="border:1px solid #999;padding:4px 6px;text-align:left;">Time</th>
                <th style="border:1px solid #999;padding:4px 6px;text-align:left;">Room</th>
              </tr>
            </thead>
            <tbody>
              ${classSchedules.map(sch => `
                <tr>
                  <td style="border:1px solid #999;padding:3px 6px;">${format(new Date(sch.exam_date), 'dd/MM/yyyy')}</td>
                  <td style="border:1px solid #999;padding:3px 6px;">${sch.subject_name}</td>
                  <td style="border:1px solid #999;padding:3px 6px;">${sch.start_time} - ${sch.end_time}</td>
                  <td style="border:1px solid #999;padding:3px 6px;">${sch.room_no || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div style="flex:1;"></div>'}

        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:6px; padding-top:6px; border-top:1px solid #ccc;">
          <div style="font-size:9px; max-width:70%;">
            <strong>Instructions:</strong>
            <span style="white-space:pre-wrap;">${templateOptions.customInstructions}</span>
          </div>
          ${templateOptions.showSignature
            ? `<div style="text-align:center;"><div style="border-top:1px solid #000;width:120px;padding-top:3px;font-size:9px;">Principal's Signature</div></div>`
            : ''}
        </div>
      </div>
    `;

    const pageStyle = `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { page-break-after: always; }
      }
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .page { 
        width: 100%; 
        height: 277mm; 
        display: flex; 
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        padding: 2mm;
        gap: 3mm;
      }
    `;

    const blankCard = `<div style="height:31%;border:2px dashed #ccc;box-sizing:border-box;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;">— Blank —</div>`;
    const pagesHTML = studentPairs.map((group) => `
      <div class="page">
        ${renderCard(group[0])}
        ${group[1] ? renderCard(group[1]) : blankCard}
        ${group[2] ? renderCard(group[2]) : blankCard}
      </div>
    `).join('');

    return `
      <html>
        <head>
          <title>${title}</title>
          <style>${pageStyle}</style>
        </head>
        <body>
          ${pagesHTML}
          ${autoPrint ? '<script>window.onload = function(){ window.print(); }<\/script>' : ''}
        </body>
      </html>
    `;
  };

  const handleGenerateAdmitCards = () => {
    if (students.length === 0) {
      alert('No students found for the selected class.');
      return;
    }
    const examGroupName = examGroups.find(g => g.id === selectedGroup)?.name || 'Examination';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(buildAdmitCardHTML(`Admit Cards - ${examGroupName} - Class ${selectedClass} ${selectedSection}`, true));
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (students.length === 0) {
      alert('No students found for the selected class.');
      return;
    }
    const examGroupName = examGroups.find(g => g.id === selectedGroup)?.name || 'Examination';
    const pdfWindow = window.open('', '_blank');
    const html = buildAdmitCardHTML(`Admit Cards - ${examGroupName} - Class ${selectedClass} ${selectedSection}`, false);
    // Inject script to trigger "Save as PDF" via print dialog
    const htmlWithSave = html.replace('</body>', `
      <script>
        window.onload = function() {
          document.title = 'AdmitCards_${examGroupName}_Class${selectedClass}${selectedSection}';
          setTimeout(function(){ window.print(); }, 500);
        };
      <\/script>
      </body>
    `);
    pdfWindow.document.write(htmlWithSave);
    pdfWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader><CardTitle>1. Select Class</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setSelectedGroup}><SelectTrigger><SelectValue placeholder="Select Exam Group" /></SelectTrigger><SelectContent>{examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>2. Design Template</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="showPhoto" checked={templateOptions.showPhoto} onCheckedChange={(c) => setTemplateOptions(p => ({...p, showPhoto: c}))} />
              <Label htmlFor="showPhoto">Show Student Photo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="showSignature" checked={templateOptions.showSignature} onCheckedChange={(c) => setTemplateOptions(p => ({...p, showSignature: c}))} />
              <Label htmlFor="showSignature">Show School Logo & Principal's Signature</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="showSchedule" checked={templateOptions.showSchedule} onCheckedChange={(c) => setTemplateOptions(p => ({...p, showSchedule: c}))} />
              <Label htmlFor="showSchedule">Show Exam Schedule</Label>
            </div>
            <div>
              <Label htmlFor="customInstructions">Custom Instructions</Label>
              <Textarea id="customInstructions" value={templateOptions.customInstructions} onChange={(e) => setTemplateOptions(p => ({...p, customInstructions: e.target.value}))} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>3. Generate & Export</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">Generate admit cards for all {students.length} students in the selected class.</p>
            <Button onClick={handleGenerateAdmitCards} className="w-full" disabled={!selectedGroup || !selectedClass || !selectedSection || students.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Generate & Print
            </Button>
            <Button variant="outline" className="w-full" onClick={handleDownloadPDF} disabled={!selectedGroup || !selectedClass || !selectedSection || students.length === 0}>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <Mail className="mr-2 h-4 w-4" /> Email to All (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Eye/>Admit Card Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="p-4 border-2 border-dashed rounded-lg">
              <div className="border-2 border-black p-4 bg-white text-black">
                <div className="text-center border-b pb-2 mb-2 flex items-center justify-between">
                  {templateOptions.showSignature && getSchoolLogo() && <img src={getSchoolLogo()} alt="logo" className="h-16 object-contain"/>}
                  {templateOptions.showSignature && !getSchoolLogo() && <div className="h-16 w-16 bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Logo</div>}
                  <div>
                    <h2 className="text-xl font-bold">{getSchoolName()}</h2>
                    <h3 className="text-lg">Admit Card - {examGroups.find(g => g.id === selectedGroup)?.name || 'Examination'}</h3>
                  </div>
                  {templateOptions.showPhoto && (students[0]?.photo_url ? 
                    <img src={students[0].photo_url} alt="Student" className="w-24 h-32 object-cover border"/> : 
                    <div className="border w-24 h-32 flex items-center justify-center text-xs bg-gray-50">Student Photo</div>
                  )}
                </div>
                <div className="flex justify-between mb-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {students[0]?.first_name || 'John'} {students[0]?.last_name || 'Doe'}</p>
                    <p><strong>Class:</strong> {students[0]?.class || '10'} - {students[0]?.section || 'A'}</p>
                  </div>
                  <div>
                    <p><strong>Roll No:</strong> {students[0]?.roll_number || '01'}</p>
                    <p><strong>Admission No:</strong> {students[0]?.admission_number || 'ADM-001'}</p>
                  </div>
                </div>

                {templateOptions.showSchedule && (
                  <table className="w-full border-collapse text-xs">
                    <thead><tr className="bg-gray-100"><th className="border p-1 text-left">Date</th><th className="border p-1 text-left">Subject</th><th className="border p-1 text-left">Time</th></tr></thead>
                    <tbody>
                      <tr><td className="border p-1">15/03/2025</td><td className="border p-1">Mathematics</td><td className="border p-1">09:00 - 12:00</td></tr>
                      <tr><td className="border p-1">17/03/2025</td><td className="border p-1">Science</td><td className="border p-1">09:00 - 12:00</td></tr>
                    </tbody>
                  </table>
                )}

                <div className="mt-auto pt-4 flex justify-between items-end">
                  <div>
                    <h4 className="font-bold text-sm">Instructions:</h4>
                    <pre className="text-xs whitespace-pre-wrap font-sans">{templateOptions.customInstructions}</pre>
                  </div>
                  {templateOptions.showSignature && <div className="text-center"><div className="border-t border-black w-32 mt-8 pt-1 text-xs">Principal's Signature</div></div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}