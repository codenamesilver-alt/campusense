import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Wallet, Key, AlertTriangle, Save } from 'lucide-react';

export default function PaymentSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Gateway Settings</h1>
        <p className="text-gray-500">Configure online payment gateways for fee collection.</p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security Warning</AlertTitle>
        <AlertDescription>
          This is a demonstration interface. Do not enter real API keys or sensitive credentials here. A secure backend is required to handle and store this information safely. The 'Save' buttons are disabled.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet /> Razorpay Integration</CardTitle>
          <CardDescription>Enter your Razorpay API credentials to enable online payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="razorpay-key-id">Key ID</Label>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-gray-400" />
              <Input id="razorpay-key-id" placeholder="rzp_live_..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="razorpay-key-secret">Key Secret</Label>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-gray-400" />
              <Input id="razorpay-key-secret" type="password" placeholder="••••••••••••••••" />
            </div>
          </div>
          <div className="pt-2">
            <Button disabled><Save className="mr-2 h-4 w-4" /> Save Razorpay Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}