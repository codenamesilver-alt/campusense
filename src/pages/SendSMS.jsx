import { useState, useEffect } from 'react';
import { SMSTemplate } from '@/entities/SMSTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


export default function SendSMSPage() {
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState([]);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    (async () => {
        setTemplates(await SMSTemplate.list());
    })();
  }, []);
  
  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if(template){
        setBody(template.body);
        setCharCount(template.body.length);
    }
  };

  const handleBodyChange = (e) => {
    setBody(e.target.value);
    setCharCount(e.target.value.length);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Send SMS</h1>
      
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          This is a UI mock-up for the SMS sending functionality. A backend integration with an SMS gateway (like Twilio) is required to make this functional. The "Send SMS" button is currently disabled.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Compose SMS</CardTitle>
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
            <Label htmlFor="to">To (comma-separated numbers)</Label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g., +919876543210" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" value={body} onChange={handleBodyChange} maxLength="160" />
            <p className="text-sm text-right text-gray-500">{charCount} / 160 characters</p>
          </div>
          <div>
            <Button disabled>
                Send SMS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}