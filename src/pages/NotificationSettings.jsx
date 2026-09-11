import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Student } from '@/entities/Student';
import { Staff } from '@/entities/Staff';
import { SendEmail } from '@/integrations/Core';
import { Send, Loader2, Users, Briefcase } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function NotificationSettings() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetGroups, setTargetGroups] = useState({ students: false, staff: false });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const handleGroupChange = (group) => {
    setTargetGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleSendNotification = async () => {
    if (!targetGroups.students && !targetGroups.staff) {
      alert("Please select at least one target group.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      alert("Subject and message body cannot be empty.");
      return;
    }

    setIsSending(true);
    setSendResult(null);
    let recipients = [];
    try {
      if (targetGroups.students) {
        const students = await Student.filter({ status: 'active' });
        recipients = recipients.concat(students.map(s => s.guardian_email).filter(Boolean));
      }
      if (targetGroups.staff) {
        const staff = await Staff.filter({ status: 'active' });
        recipients = recipients.concat(staff.map(s => s.email).filter(Boolean));
      }

      const uniqueRecipients = [...new Set(recipients)];

      if (uniqueRecipients.length === 0) {
        throw new Error("No recipients found with valid email addresses in the selected groups.");
      }

      // In a real app, this would be a single backend call.
      // Here, we simulate by sending one by one.
      for (const email of uniqueRecipients) {
        await SendEmail({ to: email, subject, body });
      }

      setSendResult({ success: true, count: uniqueRecipients.length });
      setSubject('');
      setBody('');
      
    } catch (error) {
      console.error("Failed to send notifications:", error);
      setSendResult({ success: false, message: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Broadcast Notifications</h1>
        <p className="text-gray-500">Send email notifications to large user groups like all students or staff.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose & Send</CardTitle>
          <CardDescription>Select your audience, write your message, and send.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Composer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <ReactQuill theme="snow" value={body} onChange={setBody} style={{ height: '250px', backgroundColor: 'white' }} />
            </div>
          </div>
          
          {/* Audience & Send */}
          <div className="lg:col-span-1 space-y-6 pt-14">
            <Card className="bg-gray-50 p-4">
              <CardTitle className="text-lg mb-4">Select Audience</CardTitle>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="students" checked={targetGroups.students} onCheckedChange={() => handleGroupChange('students')} />
                  <Label htmlFor="students" className="flex items-center gap-2"><Users className="h-4 w-4"/> All Students (Parents)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="staff" checked={targetGroups.staff} onCheckedChange={() => handleGroupChange('staff')} />
                  <Label htmlFor="staff" className="flex items-center gap-2"><Briefcase className="h-4 w-4"/> All Staff</Label>
                </div>
              </div>
            </Card>
            <Button onClick={handleSendNotification} disabled={isSending} className="w-full">
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSending ? 'Sending...' : 'Send Notification'}
            </Button>
            {sendResult && (
              <div className={`text-sm p-3 rounded-md ${sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {sendResult.success ? `Successfully sent to ${sendResult.count} recipients.` : `Error: ${sendResult.message}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}