import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Upload, Plus, Trash2, Image, GraduationCap, Settings, FileText } from 'lucide-react';

const DEFAULT_SCHOLASTIC_GRADES = [
  { grade: 'A1', min_percentage: 91, max_percentage: 100, remark: 'Outstanding' },
  { grade: 'A2', min_percentage: 81, max_percentage: 90, remark: 'Excellent' },
  { grade: 'B1', min_percentage: 71, max_percentage: 80, remark: 'Very Good' },
  { grade: 'B2', min_percentage: 61, max_percentage: 70, remark: 'Good' },
  { grade: 'C1', min_percentage: 51, max_percentage: 60, remark: 'Average' },
  { grade: 'C2', min_percentage: 41, max_percentage: 50, remark: 'Below Average' },
  { grade: 'D', min_percentage: 33, max_percentage: 40, remark: 'Needs Improvement' },
  { grade: 'E', min_percentage: 0, max_percentage: 32, remark: 'Fail' }
];

const DEFAULT_CO_SCHOLASTIC_GRADES = [
  { grade: 'A+', min_score: 9, max_score: 10, description: 'Consistently demonstrates the skill' },
  { grade: 'A', min_score: 7, max_score: 8, description: 'Regularly demonstrates the skill' },
  { grade: 'B', min_score: 5, max_score: 6, description: 'Occasionally demonstrates the skill' },
  { grade: 'C', min_score: 3, max_score: 4, description: 'Infrequently demonstrates the skill' },
  { grade: 'D', min_score: 1, max_score: 2, description: 'Needs Improvement' }
];

export default function ReportCardSettings() {
  const [settings, setSettings] = useState({
    school_logo_url: '',
    header_image_url: '',
    school_name: 'TAHA SCHOOL',
    school_address: 'Girdharilal Mathur Road, Musahibganj, Lucknow',
    school_phone: '0522-252118, 6392442920',
    school_website: 'www.tahaschool.com',
    academic_session: '2025-2026',
    scholastic_grades: DEFAULT_SCHOLASTIC_GRADES,
    co_scholastic_grades: DEFAULT_CO_SCHOLASTIC_GRADES,
    enable_principal_remarks: true,
    enable_teacher_remarks: true,
    principal_signature_label: 'Signature of Principal',
    teacher_signature_label: 'Signature of Class Teacher',
    parent_signature_label: 'Signature of Parent/Guardian'
  });
  
  const [existingSettingsId, setExistingSettingsId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const existingSettings = await base44.entities.ReportCardSettings.list();
      if (existingSettings.length > 0) {
        const row = existingSettings[0];
        const parseArr = (value, fallback) => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string' && value.trim()) {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) return parsed;
            } catch (e) { /* keep fallback */ }
          }
          return fallback;
        };
        setSettings(prev => ({
          ...prev,
          ...row,
          scholastic_grades: parseArr(row.scholastic_grades, DEFAULT_SCHOLASTIC_GRADES),
          co_scholastic_grades: parseArr(row.co_scholastic_grades, DEFAULT_CO_SCHOLASTIC_GRADES),
          enable_principal_remarks: row.enable_principal_remarks ?? true,
          enable_teacher_remarks: row.enable_teacher_remarks ?? true
        }));
        setExistingSettingsId(row.id);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSettings(prev => ({ ...prev, school_logo_url: file_url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleHeaderUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSettings(prev => ({ ...prev, header_image_url: file_url }));
    } catch (error) {
      console.error('Error uploading header:', error);
      alert('Error uploading header. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleScholasticGradeChange = (index, field, value) => {
    setSettings(prev => {
      const updated = [...prev.scholastic_grades];
      updated[index] = { ...updated[index], [field]: field.includes('percentage') ? parseFloat(value) || 0 : value };
      return { ...prev, scholastic_grades: updated };
    });
  };

  const handleCoScholasticGradeChange = (index, field, value) => {
    setSettings(prev => {
      const updated = [...prev.co_scholastic_grades];
      updated[index] = { ...updated[index], [field]: field.includes('score') ? parseFloat(value) || 0 : value };
      return { ...prev, co_scholastic_grades: updated };
    });
  };

  const addScholasticGrade = () => {
    setSettings(prev => ({
      ...prev,
      scholastic_grades: [...prev.scholastic_grades, { grade: '', min_percentage: 0, max_percentage: 0, remark: '' }]
    }));
  };

  const removeScholasticGrade = (index) => {
    setSettings(prev => ({
      ...prev,
      scholastic_grades: prev.scholastic_grades.filter((_, i) => i !== index)
    }));
  };

  const addCoScholasticGrade = () => {
    setSettings(prev => ({
      ...prev,
      co_scholastic_grades: [...prev.co_scholastic_grades, { grade: '', min_score: 0, max_score: 0, description: '' }]
    }));
  };

  const removeCoScholasticGrade = (index) => {
    setSettings(prev => ({
      ...prev,
      co_scholastic_grades: prev.co_scholastic_grades.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        scholastic_grades: JSON.stringify(settings.scholastic_grades || []),
        co_scholastic_grades: JSON.stringify(settings.co_scholastic_grades || []),
        enable_principal_remarks: !!settings.enable_principal_remarks,
        enable_teacher_remarks: !!settings.enable_teacher_remarks
      };
      if (existingSettingsId) {
        await base44.entities.ReportCardSettings.update(existingSettingsId, payload);
      } else {
        const created = await base44.entities.ReportCardSettings.create(payload);
        setExistingSettingsId(created.id);
      }
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(prev => ({
        ...prev,
        scholastic_grades: DEFAULT_SCHOLASTIC_GRADES,
        co_scholastic_grades: DEFAULT_CO_SCHOLASTIC_GRADES
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Report Card Customization
          </h1>
          <p className="text-gray-500">Configure report card appearance and grading scales</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
          {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
        </Button>
      </div>

      <Tabs defaultValue="school" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="school"><Image className="mr-2 h-4 w-4" /> School Info</TabsTrigger>
          <TabsTrigger value="scholastic"><GraduationCap className="mr-2 h-4 w-4" /> Scholastic Grades</TabsTrigger>
          <TabsTrigger value="coscholastic"><FileText className="mr-2 h-4 w-4" /> Co-Scholastic Grades</TabsTrigger>
          <TabsTrigger value="options"><Settings className="mr-2 h-4 w-4" /> Options</TabsTrigger>
        </TabsList>

        {/* School Info Tab */}
        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle>School Information & Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>School Logo (for Admit Cards)</Label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {settings.school_logo_url ? (
                      <img src={settings.school_logo_url} alt="School Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500">
                      {isUploading ? 'Uploading...' : 'Upload a logo (PNG, JPG). Recommended size: 200x200px'}
                    </p>
                    {settings.school_logo_url && (
                      <Button variant="outline" size="sm" onClick={() => handleInputChange('school_logo_url', '')}>
                        Remove Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Image Upload for Report Card */}
              <div className="space-y-3">
                <Label>Report Card Header Image</Label>
                <div className="flex items-start gap-4">
                  <div className="w-full max-w-md h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {settings.header_image_url ? (
                      <img src={settings.header_image_url} alt="Header" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleHeaderUpload}
                      disabled={isUploading}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500">
                      {isUploading ? 'Uploading...' : 'Upload header image for report card. This will be used instead of text header.'}
                    </p>
                    {settings.header_image_url && (
                      <Button variant="outline" size="sm" onClick={() => handleInputChange('header_image_url', '')}>
                        Remove Header
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input
                    value={settings.school_name}
                    onChange={(e) => handleInputChange('school_name', e.target.value)}
                    placeholder="Enter school name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Academic Session</Label>
                  <Input
                    value={settings.academic_session}
                    onChange={(e) => handleInputChange('academic_session', e.target.value)}
                    placeholder="e.g., 2025-2026"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>School Address</Label>
                  <Input
                    value={settings.school_address}
                    onChange={(e) => handleInputChange('school_address', e.target.value)}
                    placeholder="Enter school address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Numbers</Label>
                  <Input
                    value={settings.school_phone}
                    onChange={(e) => handleInputChange('school_phone', e.target.value)}
                    placeholder="Enter phone numbers"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={settings.school_website}
                    onChange={(e) => handleInputChange('school_website', e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scholastic Grades Tab */}
        <TabsContent value="scholastic">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scholastic Grading Scale</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>Reset to Defaults</Button>
                <Button size="sm" onClick={addScholasticGrade}><Plus className="mr-1 h-4 w-4" /> Add Grade</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Grade</TableHead>
                    <TableHead className="w-32">Min %</TableHead>
                    <TableHead className="w-32">Max %</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.scholastic_grades.map((grade, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={grade.grade}
                          onChange={(e) => handleScholasticGradeChange(index, 'grade', e.target.value)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={grade.min_percentage}
                          onChange={(e) => handleScholasticGradeChange(index, 'min_percentage', e.target.value)}
                          min="0"
                          max="100"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={grade.max_percentage}
                          onChange={(e) => handleScholasticGradeChange(index, 'max_percentage', e.target.value)}
                          min="0"
                          max="100"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={grade.remark}
                          onChange={(e) => handleScholasticGradeChange(index, 'remark', e.target.value)}
                          placeholder="e.g., Excellent"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeScholasticGrade(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-gray-500 mt-4">
                Define grade ranges from highest to lowest. Grades are assigned based on percentage score.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Co-Scholastic Grades Tab */}
        <TabsContent value="coscholastic">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Co-Scholastic Grading Scale</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>Reset to Defaults</Button>
                <Button size="sm" onClick={addCoScholasticGrade}><Plus className="mr-1 h-4 w-4" /> Add Grade</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Grade</TableHead>
                    <TableHead className="w-28">Min Score</TableHead>
                    <TableHead className="w-28">Max Score</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.co_scholastic_grades.map((grade, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={grade.grade}
                          onChange={(e) => handleCoScholasticGradeChange(index, 'grade', e.target.value)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={grade.min_score}
                          onChange={(e) => handleCoScholasticGradeChange(index, 'min_score', e.target.value)}
                          min="0"
                          max="10"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={grade.max_score}
                          onChange={(e) => handleCoScholasticGradeChange(index, 'max_score', e.target.value)}
                          min="0"
                          max="10"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={grade.description}
                          onChange={(e) => handleCoScholasticGradeChange(index, 'description', e.target.value)}
                          placeholder="e.g., Consistently demonstrates"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeCoScholasticGrade(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-gray-500 mt-4">
                Co-scholastic grades are typically on a 1-10 scale. Define grades from highest to lowest.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Report Card Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Remarks Toggles */}
              <div className="space-y-4">
                <h4 className="font-medium">Remarks Settings</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Enable Class Teacher Remarks</Label>
                    <p className="text-sm text-gray-500">Show teacher remarks section on report card</p>
                  </div>
                  <Switch
                    checked={settings.enable_teacher_remarks}
                    onCheckedChange={(checked) => handleInputChange('enable_teacher_remarks', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Enable Principal Remarks</Label>
                    <p className="text-sm text-gray-500">Show principal remarks section on report card</p>
                  </div>
                  <Switch
                    checked={settings.enable_principal_remarks}
                    onCheckedChange={(checked) => handleInputChange('enable_principal_remarks', checked)}
                  />
                </div>
              </div>

              {/* Signature Labels */}
              <div className="space-y-4">
                <h4 className="font-medium">Signature Labels</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Class Teacher Signature Label</Label>
                    <Input
                      value={settings.teacher_signature_label}
                      onChange={(e) => handleInputChange('teacher_signature_label', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Principal Signature Label</Label>
                    <Input
                      value={settings.principal_signature_label}
                      onChange={(e) => handleInputChange('principal_signature_label', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Signature Label</Label>
                    <Input
                      value={settings.parent_signature_label}
                      onChange={(e) => handleInputChange('parent_signature_label', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}