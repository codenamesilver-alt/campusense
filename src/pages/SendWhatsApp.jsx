import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function SendWhatsAppPage() {
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Send WhatsApp Message</h1>
      
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Feature Not Available</AlertTitle>
        <AlertDescription>
          This is a UI mock-up for the WhatsApp sending functionality. A backend integration with a WhatsApp Business API provider (like Meta, Twilio) is required to make this functional. The "Send Message" button is currently disabled.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To (comma-separated numbers with country code)</Label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g., +919876543210" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message (Only approved templates are allowed by WhatsApp)</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="text-xs text-gray-500">Note: WhatsApp Business API has strict rules about message content and templates.</p>
          </div>
          <div>
            <Button disabled>
                Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}