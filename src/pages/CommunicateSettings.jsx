import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Mail, MessageSquare, Smartphone } from "lucide-react";

export default function CommunicateSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Communication Settings</h1>
        <p className="text-gray-500">Configure gateways for Email, SMS, and WhatsApp messaging.</p>
      </div>

      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          These settings are for demonstration purposes. A secure backend is required to store and use these credentials. Do not enter real API keys or passwords.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SMTP Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail /> SMTP Relay Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" placeholder="smtp.example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Port</Label>
              <Input id="smtp-port" placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">Username</Label>
              <Input id="smtp-user" placeholder="your-email@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-pass">Password</Label>
              <Input id="smtp-pass" type="password" placeholder="••••••••" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="smtp-from">From Email</Label>
              <Input id="smtp-from" placeholder="noreply@example.com" />
            </div>
            <Button disabled>Save SMTP Settings</Button>
          </CardContent>
        </Card>

        {/* SMS Gateway Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare /> SMS Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-provider">SMS Provider</Label>
              <Input id="sms-provider" placeholder="e.g., Twilio, Vonage" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="sms-key">API Key / Auth Token</Label>
              <Input id="sms-key" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-secret">API Secret</Label>
              <Input id="sms-secret" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-sender">Sender ID</Label>
              <Input id="sms-sender" placeholder="e.g., CAMPUS" />
            </div>
            <Button disabled>Save SMS Settings</Button>
          </CardContent>
        </Card>
        
        {/* WhatsApp Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone /> WhatsApp API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wa-provider">API Provider</Label>
              <Input id="wa-provider" placeholder="e.g., Meta Business, WATI" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-token">Access Token</Label>
              <Input id="wa-token" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-phone-id">Phone Number ID</Label>
              <Input id="wa-phone-id" placeholder="10xxxxxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-business-id">Business Account ID</Label>
              <Input id="wa-business-id" placeholder="10xxxxxxxxxxxxx" />
            </div>
            <Button disabled>Save WhatsApp Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}