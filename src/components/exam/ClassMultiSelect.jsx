import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';

export default function ClassMultiSelect({ classes = [], selected = [], onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (className) => {
    if (selected.includes(className)) {
      onChange(selected.filter(c => c !== className));
    } else {
      onChange([...selected, className]);
    }
  };

  const label = selected.length === 0
    ? 'Select Classes'
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} classes selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <div className="max-h-60 overflow-auto">
          {classes.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No classes found</p>
          )}
          {classes.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
              onClick={() => toggle(c.name)}
            >
              <Checkbox checked={selected.includes(c.name)} />
              <span className="text-sm">{c.name}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}