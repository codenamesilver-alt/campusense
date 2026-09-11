import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentEditDialog({ student, open, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        date_of_birth: student.date_of_birth || "",
        gender: student.gender || "",
        guardian_phone: student.guardian_phone || "",
        guardian_email: student.guardian_email || "",
        father_name: student.father_name || "",
        mother_name: student.mother_name || "",
        roll_number: student.roll_number || "",
        admission_number: student.admission_number || "",
        address: student.address || "",
        blood_group: student.blood_group || "",
        house: student.house || "",
        aadhaar_number: student.aadhaar_number || "",
      });
    }
  }, [student]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const setSelect = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Student.update(student.id, form);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student — {student?.first_name} {student?.last_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label>First Name *</Label>
            <Input value={form.first_name} onChange={set("first_name")} />
          </div>
          <div className="space-y-1">
            <Label>Last Name</Label>
            <Input value={form.last_name} onChange={set("last_name")} />
          </div>
          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={setSelect("gender")}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Admission Number</Label>
            <Input value={form.admission_number} onChange={set("admission_number")} />
          </div>
          <div className="space-y-1">
            <Label>Roll Number</Label>
            <Input value={form.roll_number} onChange={set("roll_number")} />
          </div>
          <div className="space-y-1">
            <Label>Father's Name</Label>
            <Input value={form.father_name} onChange={set("father_name")} />
          </div>
          <div className="space-y-1">
            <Label>Mother's Name</Label>
            <Input value={form.mother_name} onChange={set("mother_name")} />
          </div>
          <div className="space-y-1">
            <Label>Guardian Phone</Label>
            <Input value={form.guardian_phone} onChange={set("guardian_phone")} />
          </div>
          <div className="space-y-1">
            <Label>Guardian Email</Label>
            <Input type="email" value={form.guardian_email} onChange={set("guardian_email")} />
          </div>
          <div className="space-y-1">
            <Label>Blood Group</Label>
            <Select value={form.blood_group} onValueChange={setSelect("blood_group")}>
              <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>House</Label>
            <Input value={form.house} onChange={set("house")} />
          </div>
          <div className="space-y-1">
            <Label>Aadhaar Number</Label>
            <Input value={form.aadhaar_number} onChange={set("aadhaar_number")} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={set("address")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}