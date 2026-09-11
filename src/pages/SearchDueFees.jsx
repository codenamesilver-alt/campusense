import PlaceholderContent from '../components/PlaceholderContent';

export default function SearchDueFees() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Search Due Fees</h1>
      <PlaceholderContent
        title="Find Students with Due Fees"
        functionality="This module helps in identifying students who have outstanding fee payments. It's crucial for managing revenue and sending reminders."
        features={[
          "Filter students with due fees by class, section, or fee type.",
          "View a list of students with the amount due and due date.",
          "Calculate and display fine amounts for overdue fees.",
          "Send bulk email/SMS reminders to parents of students with due fees.",
          "Generate reports of outstanding fees."
        ]}
      />
    </div>
  );
}