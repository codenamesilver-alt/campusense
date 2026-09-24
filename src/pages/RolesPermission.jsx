import { useState, useEffect } from 'react';
import { RolePermission } from '@/entities/RolePermission';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, Shield } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ALL_PERMISSIONS = {
  "Student Information": [
    { id: "student:read", label: "View Student Details" },
    { id: "student:create", label: "Add New Students" },
    { id: "student:update", label: "Edit Student Information" },
    { id: "student:delete", label: "Disable/Delete Students" },
  ],
  "Fees Management": [
    { id: "fees:read", label: "View Fee Structures & Dues" },
    { id: "fees:collect", label: "Collect Fees" },
    { id: "fees:setup", label: "Configure Fee Heads & Discounts" },
    { id: "fees:reports", label: "Access Fee Reports" },
  ],
  "Academics": [
    { id: "academics:timetable", label: "Manage Timetables" },
    { id: "academics:promote", label: "Promote Students" },
    { id: "academics:subjects", label: "Manage Subjects & Classes" },
  ],
  "Examination": [
    { id: "exam:schedule", label: "Create & Manage Exam Schedules" },
    { id: "exam:results", label: "Enter & Publish Exam Results" },
    { id: "exam:design", label: "Design Admit Cards & Marksheets" },
  ],
  "Human Resources": [
    { id: "hr:read", label: "View Staff Directory" },
    { id: "hr:create", label: "Add New Staff" },
    { id: "hr:attendance", label: "Manage Staff Attendance" },
    { id: "hr:setup", label: "Manage Departments & Designations" },
  ],
  "Communicate": [
    { id: "communicate:send", label: "Send Email/SMS to Groups" },
    { id: "communicate:noticeboard", label: "Manage Notice Board" },
  ],
  "Settings": [
    { id: "settings:general", label: "Manage General Settings" },
    { id: "settings:roles", label: "Manage Roles & Permissions" },
  ]
};

const ROLES = ["admin", "user", "teacher", "accountant", "receptionist", "student", "parent", "principal"];

function parsePermissions(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [value];
    }
  }
  return [];
}

export default function RolesPermission() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [currentPermissionDocId, setCurrentPermissionDocId] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await RolePermission.list();
      setAllPermissions(data);
    })();
  }, []);

  useEffect(() => {
    const roleData = allPermissions.find(p => p.role === selectedRole);
    if (roleData) {
      setPermissions(parsePermissions(roleData.permissions));
      setCurrentPermissionDocId(roleData.id);
    } else {
      setPermissions([]);
      setCurrentPermissionDocId(null);
    }
  }, [selectedRole, allPermissions]);

  const handlePermissionChange = (permissionId, checked) => {
    if (checked) {
      setPermissions(prev => [...prev, permissionId]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const data = { role: selectedRole, permissions: JSON.stringify(Array.isArray(permissions) ? permissions : []) };
      if (currentPermissionDocId) {
        await RolePermission.update(currentPermissionDocId, data);
      } else {
        await RolePermission.create(data);
      }
      // Refresh local state
      const updatedData = await RolePermission.list();
      setAllPermissions(updatedData);
      alert(`Permissions for role '${selectedRole}' saved successfully!`);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      alert("Error saving permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
        <p className="text-gray-500">Define what each user role can see and do within the application.</p>
      </div>

      <Alert variant="info" style={{ background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.25)' }}>
        <Shield className="h-4 w-4" style={{ color: '#00f5ff' }} />
        <AlertTitle style={{ color: '#00f5ff' }}>How It Works</AlertTitle>
        <AlertDescription style={{ color: 'rgba(255,255,255,0.7)' }}>
          Select a role to manage its access rights. Changes will apply to all users with that role. An "admin" role typically has all permissions and cannot be changed. Note: Applying these permissions to the UI requires a page reload for users.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Label htmlFor="role-select" className="text-lg">Editing permissions for role:</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-select" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(ALL_PERMISSIONS).map(([moduleName, modulePermissions]) => (
            <div key={moduleName}>
              <h3 className="text-md font-semibold border-b pb-2 mb-4">{moduleName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {modulePermissions.map(perm => (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={perm.id}
                      checked={(Array.isArray(permissions) && permissions.includes(perm.id)) || selectedRole === 'admin'}
                      onCheckedChange={(checked) => handlePermissionChange(perm.id, checked)}
                      disabled={selectedRole === 'admin'}
                    />
                    <Label htmlFor={perm.id} className="font-normal">{perm.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isLoading || selectedRole === 'admin'}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Permissions for {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}