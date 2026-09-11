import PlaceholderContent from '../components/PlaceholderContent';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function DesignMarksheet() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Design Marksheet</h1>
        <Button>
          <Save className="mr-2 h-4 w-4" /> Save Template
        </Button>
      </div>
      <PlaceholderContent
        title="Customize Marksheet Templates"
        functionality="Design the layout and content of the student marksheet or report card."
        features={[
          "A visual editor to design the marksheet template.",
          "Add school logo, header, and footer.",
          "Include fields for grades, attendance, and teacher remarks.",
          "Customize the grading system display.",
          "Save multiple templates for different terms or exam types."
        ]}
      />
    </div>
  );
}