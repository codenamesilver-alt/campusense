import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Image as ImageIcon, Save, Plus, CheckCircle, Trash2 } from 'lucide-react';

export default function GeneralSettings() {
  const [settings, setSettings] = useState({ 
    id: null, 
    school_name: '', 
    address: '', 
    phone: '', 
    email: '', 
    logo_url: '', 
    header_image_url: '', 
    current_session_id: '',
    allow_backdated_receipt: false 
  });
  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState({ name: '', start_date: '', end_date: '' });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const settingsData = await base44.entities.SchoolSetting.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      } else {
        setSettings({ 
          id: null, 
          school_name: 'Your School Name', 
          address: '', 
          phone: '', 
          email: '', 
          logo_url: '', 
          header_image_url: '', 
          current_session_id: '',
          allow_backdated_receipt: false 
        });
      }
      const sessionData = await base44.entities.Session.list();
      setSessions(sessionData);
    } catch (error) {
      console.error("Failed to load settings data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    if (type === 'logo') setIsUploadingLogo(true);
    if (type === 'header') setIsUploadingHeader(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSettings(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'header_image_url']: file_url }));
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Error uploading ${type}. Please try again.`);
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      if (type === 'header') setIsUploadingHeader(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (settings.id) {
        await base44.entities.SchoolSetting.update(settings.id, settings);
      } else {
        const newSettings = await base44.entities.SchoolSetting.create(settings);
        setSettings(newSettings);
      }
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert('Error saving settings.');
    }
  };

  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    setNewSession(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSession = async () => {
    if (!newSession.name || !newSession.start_date || !newSession.end_date) {
      alert('Please fill all fields for the new session.');
      return;
    }
    try {
      await base44.entities.Session.create({ ...newSession, is_current: false });
      setNewSession({ name: '', start_date: '', end_date: '' });
      loadData();
      alert('New session added successfully!');
    } catch (error) {
      console.error("Failed to add session:", error);
      alert('Error adding session. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      if (sessionToDelete && sessionToDelete.is_current) {
        alert('Cannot delete the current active session. Please set another session as current first.');
        return;
      }

      if (settings.current_session_id === sessionId) {
        alert('Cannot delete this session as it is set as current in school settings. Please change the current session first.');
        return;
      }

      await base44.entities.Session.delete(sessionId);
      alert('Session deleted successfully!');
      await loadData();
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert('Error deleting session: ' + error.message);
    }
  };

  const handleSetCurrentSession = async (sessionId) => {
    try {
      for (const session of sessions) {
        await base44.entities.Session.update(session.id, { is_current: false });
      }
      
      await base44.entities.Session.update(sessionId, { is_current: true });
      
      if (settings.id) {
        await base44.entities.SchoolSetting.update(settings.id, { current_session_id: sessionId });
        setSettings(prev => ({ ...prev, current_session_id: sessionId }));
      }
      
      await loadData();
      
      alert('Current session updated successfully!');
    } catch (error) {
      console.error("Failed to set current session:", error);
      alert('Error setting current session: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">General Settings</h1>
        <p className="text-gray-500">Manage your school's core information, branding, and academic sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* School Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input id="school_name" name="school_name" value={settings.school_name} onChange={handleSettingsChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={settings.address} onChange={handleSettingsChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={settings.phone} onChange={handleSettingsChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" name="email" value={settings.email} onChange={handleSettingsChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Branding & Logos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>School Logo</Label>
              {settings.logo_url && <img src={settings.logo_url} alt="School Logo" className="h-16 w-auto p-2 border rounded-md" />}
              <Input id="logo-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'logo')} />
              <Button asChild variant="outline" className="w-full">
                <Label htmlFor="logo-upload" className="cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" /> {isUploadingLogo ? 'Uploading...' : 'Change Logo'}
                </Label>
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Printable Header Image</Label>
              {settings.header_image_url && <img src={settings.header_image_url} alt="Header" className="h-16 w-full object-contain p-2 border rounded-md" />}
              <Input id="header-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'header')} />
               <Button asChild variant="outline" className="w-full">
                <Label htmlFor="header-upload" className="cursor-pointer flex items-center justify-center gap-2">
                  <ImageIcon className="h-4 w-4" /> {isUploadingHeader ? 'Uploading...' : 'Change Header'}
                </Label>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Input Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Input Settings</CardTitle>
          <CardDescription>Configure how receipt dates can be entered in the fee collection system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="allow_backdated_receipt" className="text-base font-medium">
                Allow Backdated Receipt
              </Label>
              <p className="text-sm text-gray-500">
                When enabled, users can enter a custom receipt date in fee collection. When disabled, receipt date is automatically set to today.
              </p>
            </div>
            <Switch
              id="allow_backdated_receipt"
              checked={settings.allow_backdated_receipt || false}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_backdated_receipt: checked }))}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}><Save className="mr-2 h-4 w-4" /> Save All Settings</Button>
      </div>

      {/* Academic Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Session Management</CardTitle>
          <CardDescription>Define academic years and set the current active session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Create New Session</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label>Session Name (e.g., 2024-25)</Label>
                <Input name="name" value={newSession.name} onChange={handleSessionChange} placeholder="2024-25" />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" name="start_date" value={newSession.start_date} onChange={handleSessionChange} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" name="end_date" value={newSession.end_date} onChange={handleSessionChange} />
              </div>
              <Button onClick={handleAddSession}><Plus className="mr-2 h-4 w-4"/> Add Session</Button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Existing Sessions</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No sessions found. Create your first session above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map(session => {
                      const isCurrent = session.is_current || session.id === settings.current_session_id;
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.name}</TableCell>
                          <TableCell>{session.start_date}</TableCell>
                          <TableCell>{session.end_date}</TableCell>
                          <TableCell>
                            {isCurrent ? 
                              <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="h-4 w-4" /> Current</span> 
                              : <span className="text-gray-500">Inactive</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!isCurrent && (
                                <Button variant="outline" size="sm" onClick={() => handleSetCurrentSession(session.id)}>
                                  Set as Current
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteSession(session.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}