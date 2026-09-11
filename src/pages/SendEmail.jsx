import { useState, useEffect } from 'react';
import { SendEmail as SendEmailIntegration } from '@/integrations/Core';
import { EmailTemplate } from '@/entities/EmailTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function SendEmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    (async () => {
        setTemplates(await EmailTemplate.list());
    })();
  }, []);
  
  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if(template){
        setSubject(template.subject);
        setBody(template.body);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
        await SendEmailIntegration({
            to: to,
            subject: subject,
            body: body
        });
        alert('Email sent successfully!');
        setTo('');
        setSubject('');
        setBody('');
    } catch(error){
        console.error("Failed to send email:", error);
        alert('Error sending email. Please check the recipient address.');
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Send Email</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Compose Email</CardTitle>
            <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="Load from Template" /></SelectTrigger>
                <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To (comma-separated emails)</Label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g., student@example.com, staff@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
             <ReactQuill theme="snow" value={body} onChange={setBody} style={{ height: '300px' }} />
          </div>
          <div className="pt-14">
            <Button onClick={handleSend} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}