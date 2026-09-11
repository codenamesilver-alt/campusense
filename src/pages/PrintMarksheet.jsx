
import PlaceholderContent from '../components/PlaceholderContent';

export default function PrintMarksheet() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Generate & Print Marksheets</h1>
      <PlaceholderContent
        title="Generate and Print Marksheets"
        functionality="Generate final marksheet for students for a specific term based on the designed template and entered results."
        features={[
          "Select an exam group and class.",
          "Select a previously designed marksheet template.",
          "Generate marksheet for all students in the class.",
          "Preview the generated marksheet with all marks, grades, and totals.",
          "Print marksheets in bulk or for individual students."
        ]}
      />
    </div>
  );
}
