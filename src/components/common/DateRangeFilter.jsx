import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

export default function DateRangeFilter({ dateRange, setDateRange }) {
  const handleFromDateChange = (e) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setDateRange(prev => ({ ...prev, from: date }));
  };

  const handleToDateChange = (e) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setDateRange(prev => ({ ...prev, to: date }));
  };

  const clearFilter = () => {
    setDateRange({ from: null, to: null });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="from-date" className="text-sm font-medium">From:</Label>
        <Input
          id="from-date"
          type="date"
          value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
          onChange={handleFromDateChange}
          className="w-36"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Label htmlFor="to-date" className="text-sm font-medium">To:</Label>
        <Input
          id="to-date"
          type="date"
          value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
          onChange={handleToDateChange}
          className="w-36"
        />
      </div>
      
      {(dateRange.from || dateRange.to) && (
        <Button variant="outline" size="sm" onClick={clearFilter}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}