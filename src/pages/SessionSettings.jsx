import { useState, useEffect } from 'react';
import { Session } from '@/entities/Session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function SessionSettings() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setSessions(await Session.list('-name'));
  };

  const handleSave = async () => {
    if (currentSession.id) {
      await Session.update(currentSession.id, currentSession);
    } else {
      await Session.create(currentSession);
    }
    await handleSetCurrent(currentSession.id, currentSession.is_current);
    fetchData();
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      await Session.delete(id);
      fetchData();
    }
  };
  
  const handleSetCurrent = async (sessionId, isCurrent) => {
    if (isCurrent) {
        // Unset all others first
        const allSessions = await Session.list();
        for (const session of allSessions) {
            if(session.id !== sessionId && session.is_current) {
                await Session.update(session.id, { is_current: false });
            }
        }
    }
    await Session.update(sessionId, { is_current: isCurrent });
    fetchData();
  };

  const openDialog = (session = null) => {
    setCurrentSession(session || {
      name: '', start_date: '', end_date: '', is_current: false
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => setIsDialogOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Academic Session Settings</h1>
        <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" /> Add Session</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Session List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Is Current Session?</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>{format(new Date(session.start_date), 'dd MMM, yyyy')}</TableCell>
                  <TableCell>{format(new Date(session.end_date), 'dd MMM, yyyy')}</TableCell>
                  <TableCell>
                    <Switch
                        checked={session.is_current}
                        onCheckedChange={(val) => handleSetCurrent(session.id, val)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(session)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(session.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentSession?.id ? 'Edit' : 'Add'} Session</DialogTitle></DialogHeader>
          {currentSession && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Session Name (e.g., 2024-2025)</Label>
                <Input value={currentSession.name} onChange={(e) => setCurrentSession({ ...currentSession, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={currentSession.start_date} onChange={(e) => setCurrentSession({ ...currentSession, start_date: e.target.value })} />
              </div>
               <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={currentSession.end_date} onChange={(e) => setCurrentSession({ ...currentSession, end_date: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is-current" checked={currentSession.is_current} onCheckedChange={(val) => setCurrentSession({...currentSession, is_current: val})} />
                <Label htmlFor="is-current">Set as Current Academic Session</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}