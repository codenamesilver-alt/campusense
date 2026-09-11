import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from 'lucide-react';

export default function PlaceholderContent({ title, functionality, features }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Functionality Overview"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{functionality}</p>
        {features && (
          <>
            <h3 className="font-semibold text-gray-800 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {features.map((feature, index) => <li key={index}>{feature}</li>)}
            </ul>
          </>
        )}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-800">Under Development</h4>
            <p className="text-sm text-blue-700">
              This is a placeholder page. The full functionality will be implemented based on your requirements.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}