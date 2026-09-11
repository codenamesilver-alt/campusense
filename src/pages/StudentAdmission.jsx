import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Student } from '@/entities/Student';
import { Staff } from '@/entities/Staff';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { UploadFile } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Upload, Save, FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StudentAdmission() {
  const [currentSession, setCurrentSession] = useState('2026-27');
  const [formData, setFormData] = useState({
    admission_number: '',
    roll_number: '',
    first_name: '',
    last_name: '',
    class: '',
    section: '',
    gender: '',
    date_of_birth: '',
    religion: '',
    guardian_phone: '',
    guardian_email: '',
    admission_date: new Date().toISOString().split('T')[0],
    photo_url: '',
    father_name: '',
    mother_name: '',
    guardian_name: '',
    address: '',
    blood_group: '',
    house: '',
    aadhaar_number: '',
    academic_year: '2026-27',
    is_new_admission: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    generateAdmissionNumber();
    loadDropdownData();
    // Load active session
    base44.entities.Session.filter({ is_current: true }).then(sessions => {
      if (sessions.length > 0) {
        const sessionName = sessions[0].name;
        setCurrentSession(sessionName);
        setFormData(prev => ({ ...prev, academic_year: sessionName }));
      }
    });
  }, []);

  const loadDropdownData = async () => {
    try {
      const classData = await Class.list('numeric_value'); // Assuming list method takes a sort key
      const sectionData = await Section.list('name');
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load classes or sections:', error);
    }
  };
  
  const generateAdmissionNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    setFormData(prev => ({
      ...prev,
      admission_number: `${year}${randomNum}`
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('photo_url', file_url);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.is_new_admission === null || formData.is_new_admission === undefined) {
      alert('Please select whether this is a New Admission (Yes/No) before submitting.');
      return;
    }
    setIsSubmitting(true);

    try {
      await Student.create(formData);
      
      // Reset form
      setFormData({
        admission_number: '',
        roll_number: '',
        first_name: '',
        last_name: '',
        class: '',
        section: '',
        gender: '',
        date_of_birth: '',
        religion: '',
        guardian_phone: '',
        guardian_email: '',
        admission_date: new Date().toISOString().split('T')[0],
        photo_url: '',
        father_name: '',
        mother_name: '',
        guardian_name: '',
        address: '',
        blood_group: '',
        house: '',
        aadhaar_number: '',
        academic_year: currentSession,
        is_new_admission: null
        });

        generateAdmissionNumber();
      alert('Student admitted successfully!');
      
    } catch (error) {
      console.error('Error admitting student:', error);
      alert('Error admitting student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Student Admission</h1>
          <p className="text-gray-500">Register a new student to the school</p>
        </div>
        <Link to={createPageUrl('ImportStudent')}>
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" />
            Bulk Import Students
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admission_number">Admission Number</Label>
                <Input
                  id="admission_number"
                  value={formData.admission_number}
                  onChange={(e) => handleInputChange('admission_number', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll Number</Label>
                <Input
                  id="roll_number"
                  value={formData.roll_number}
                  onChange={(e) => handleInputChange('roll_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                  <SelectTrigger>
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
                <Label htmlFor="section">Section *</Label>
                <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Phone</Label>
                <Input
                  id="guardian_phone"
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardian_email">Email</Label>
                <Input
                  id="guardian_email"
                  type="email"
                  value={formData.guardian_email}
                  onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admission_date">Date of Admission</Label>
                <Input
                  id="admission_date"
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => handleInputChange('admission_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                <Input
                  id="aadhaar_number"
                  value={formData.aadhaar_number}
                  onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                  placeholder="12 digit Aadhaar number"
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  New Admission? <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-6 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_new_admission"
                      value="yes"
                      checked={formData.is_new_admission === true}
                      onChange={() => handleInputChange('is_new_admission', true)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-green-700">Yes — New Student (Admission Fee applicable)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_new_admission"
                      value="no"
                      checked={formData.is_new_admission === false}
                      onChange={() => handleInputChange('is_new_admission', false)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-600">No — Existing Student (No Admission Fee)</span>
                  </label>
                </div>
                {formData.is_new_admission === null && (
                  <p className="text-xs text-red-500">This field is required</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Student Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="photo">Upload Photo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="photo"
                    type="file"
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    disabled={isUploading}
                  />
                  {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {formData.photo_url && (
                  <div className="mt-2">
                    <img src={formData.photo_url} alt="Student" className="w-20 h-20 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Family Information */}
          <Card>
            <CardHeader>
              <CardTitle>Family Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="father_name">Father Name</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mother_name">Mother Name</Label>
                <Input
                  id="mother_name"
                  value={formData.mother_name}
                  onChange={(e) => handleInputChange('mother_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardian_name">Guardian Name</Label>
                <Input
                  id="guardian_name"
                  value={formData.guardian_name}
                  onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Admitting Student...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Admit Student
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}