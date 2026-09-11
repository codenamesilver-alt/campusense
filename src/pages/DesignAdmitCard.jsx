import PlaceholderContent from '../components/PlaceholderContent';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function DesignAdmitCard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Design Admit Card</h1>
        <Button>
          <Save className="mr-2 h-4 w-4" /> Save Template
        </Button>
      </div>
      <PlaceholderContent
        title="Customize Admit Card Templates"
        functionality="Design the layout and content of the admit cards that students will use for examinations."
        features={[
          "A visual editor to design the admit card template.",
          "Add school logo, header, and footer.",
          "Select which student fields to display (e.g., photo, name, class, roll number).",
          "Add custom text and instructions for the exam.",
          "Save multiple templates for different types of exams."
        ]}
      />
    </div>
  );
}