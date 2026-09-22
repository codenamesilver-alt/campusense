import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EnquiryFormDialog({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    student_name: '',
    phone: '',
    email: '',
    enquiry_for_class: '',
    date_of_enquiry: new Date().toISOString().split('T')[0],
    current_school: '',
    message: '',
    next_followup_date: '',
    assigned_to_staff: ''
  });
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadStaff();
      loadClasses();
    }
  }, [open]);

  const loadStaff = async () => {
    try {
      const staffData = await base44.entities.Staff.list();
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const classData = await base44.entities.Class.list('numeric_value');
      setClasses(classData);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setFormData({
        student_name: '',
        phone: '',
        email: '',
        enquiry_for_class: '',
        date_of_enquiry: new Date().toISOString().split('T')[0],
        current_school: '',
        message: '',
        next_followup_date: '',
        assigned_to_staff: ''
      });
    } catch (error) {
      console.error('Error submitting enquiry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Admission Enquiry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_name">Student Name *</Label>
              <Input
                id="student_name"
                value={formData.student_name}
                onChange={(e) => handleInputChange('student_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="enquiry_for_class">Enquiry for Class *</Label>
              <Select value={formData.enquiry_for_class} onValueChange={(value) => handleInputChange('enquiry_for_class', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_of_enquiry">Date of Enquiry *</Label>
              <Input
                id="date_of_enquiry"
                type="date"
                value={formData.date_of_enquiry}
                onChange={(e) => handleInputChange('date_of_enquiry', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_school">Current School</Label>
              <Input
                id="current_school"
                value={formData.current_school}
                onChange={(e) => handleInputChange('current_school', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="next_followup_date">Next Follow-up Date</Label>
              <Input
                id="next_followup_date"
                type="date"
                value={formData.next_followup_date}
                onChange={(e) => handleInputChange('next_followup_date', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assigned_to_staff">Assigned to Staff</Label>
              <Select value={formData.assigned_to_staff} onValueChange={(value) => handleInputChange('assigned_to_staff', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={`${member.first_name} ${member.last_name}`}>
                      {member.first_name} {member.last_name} - {member.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Description</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}