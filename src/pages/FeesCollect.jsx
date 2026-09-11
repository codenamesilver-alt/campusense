import PlaceholderContent from '../components/PlaceholderContent';

export default function FeesCollect() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Collect Fees</h1>
      <PlaceholderContent
        title="Fee Collection Counter"
        functionality="The main interface for the accounts department to collect fees from students. Search for a student, view their due fees, and record the payment."
        features={[
          "Search for a student by admission number, name, or class.",
          "Display all pending fee installments for the selected student.",
          "Select which fees to pay (partial or full payment).",
          "Apply discounts or waivers if applicable.",
          "Record payment details (mode, date) and generate a printed receipt."
        ]}
      />
    </div>
  );
}