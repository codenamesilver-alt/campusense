import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Users } from 'lucide-react';

const DEFAULT_POLICY = {
  paid_leave_days: 12,
  sick_leave_days: 12,
  casual_leave_days: 12,
  maternity_leave_days: 180,
  paid_leave_accrual_mode: 'annual',
  sick_leave_accrual_mode: 'annual',
  casual_leave_accrual_mode: 'annual',
  paid_leave_monthly_credit: 1,
  sick_leave_monthly_credit: 1,
  casual_leave_monthly_credit: 1,
  carry_forward_paid_leave: false,
  carry_forward_sick_leave: false,
  carry_forward_casual_leave: false,
  notes: ''
};

const LEAVE_TYPE_CONFIGS = [
  { type: 'paid', daysField: 'paid_leave_days', carryField: 'carry_forward_paid_leave', idField: 'paidPolicyId' },
  { type: 'sick', daysField: 'sick_leave_days', carryField: 'carry_forward_sick_leave', idField: 'sickPolicyId' },
  { type: 'casual', daysField: 'casual_leave_days', carryField: 'carry_forward_casual_leave', idField: 'casualPolicyId' },
  { type: 'maternity', daysField: 'maternity_leave_days', carryField: null, idField: 'maternityPolicyId' },
];

export default function LeaveManagementSettings() {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreditingMonthly, setIsCreditingMonthly] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    const data = await base44.entities.LeaveManagementPolicy.list();
    const updates = { ...DEFAULT_POLICY };
    for (const cfg of LEAVE_TYPE_CONFIGS) {
      const row = data.find(r => r.leave_type === cfg.type);
      if (!row) continue;
      updates[cfg.daysField] = row.allowance_days ?? updates[cfg.daysField];
      if (cfg.carryField) updates[cfg.carryField] = !!row.carry_forward;
      updates[cfg.idField] = row.id;
      if (row.description) updates.notes = row.description;
    }
    setPolicy(updates);
  };

  const handleChange = (field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const cfg of LEAVE_TYPE_CONFIGS) {
        const payload = {
          name: `${cfg.type} policy`,
          leave_type: cfg.type,
          allowance_days: policy[cfg.daysField] || 0,
          carry_forward: cfg.carryField ? !!policy[cfg.carryField] : false,
          description: policy.notes || ''
        };
        if (policy[cfg.idField]) {
          await base44.entities.LeaveManagementPolicy.update(policy[cfg.idField], payload);
        } else {
          const created = await base44.entities.LeaveManagementPolicy.create(payload);
          setPolicy(prev => ({ ...prev, [cfg.idField]: created.id }));
        }
      }
      alert('Leave policy saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply annual lump-sum balances to all permanent staff
  const handleApplyToAll = async () => {
    if (!window.confirm('This will reset leave balances for ALL permanent staff to the current annual values. Continue?')) return;
    setIsApplying(true);
    setApplyMsg('');
    try {
      const allStaff = await base44.entities.Staff.list('-created_date', 500);
      const permanentStaff = allStaff.filter(s => s.employment_type === 'permanent' && s.status === 'active');
      for (const s of permanentStaff) {
        const isFemale = s.gender === 'female';
        await base44.entities.Staff.update(s.id, {
          paid_leave_balance: policy.paid_leave_accrual_mode === 'annual' ? policy.paid_leave_days : (s.paid_leave_balance || 0),
          sick_leave_balance: policy.sick_leave_accrual_mode === 'annual' ? policy.sick_leave_days : (s.sick_leave_balance || 0),
          casual_leave_balance: policy.casual_leave_accrual_mode === 'annual' ? policy.casual_leave_days : (s.casual_leave_balance || 0),
          maternity_leave_balance: isFemale ? policy.maternity_leave_days : 0
        });
      }
      setApplyMsg(`Annual leave balances applied to ${permanentStaff.length} permanent staff. Maternity leave applied to female staff only.`);
    } finally {
      setIsApplying(false);
    }
  };

  // Credit monthly accrual to all permanent staff
  const handleCreditMonthly = async () => {
    if (!window.confirm('This will credit monthly leave to ALL active permanent staff now. Continue?')) return;
    setIsCreditingMonthly(true);
    setApplyMsg('');
    try {
      const allStaff = await base44.entities.Staff.list('-created_date', 500);
      const permanentStaff = allStaff.filter(s => s.employment_type === 'permanent' && s.status === 'active');
      for (const s of permanentStaff) {
        const updates = {};
        if (policy.paid_leave_accrual_mode === 'monthly') {
          updates.paid_leave_balance = (s.paid_leave_balance || 0) + (policy.paid_leave_monthly_credit || 0);
        }
        if (policy.sick_leave_accrual_mode === 'monthly') {
          updates.sick_leave_balance = (s.sick_leave_balance || 0) + (policy.sick_leave_monthly_credit || 0);
        }
        if (policy.casual_leave_accrual_mode === 'monthly') {
          updates.casual_leave_balance = (s.casual_leave_balance || 0) + (policy.casual_leave_monthly_credit || 0);
        }
        if (Object.keys(updates).length > 0) {
          await base44.entities.Staff.update(s.id, updates);
        }
      }
      setApplyMsg(`Monthly leave credited to ${permanentStaff.length} permanent staff members.`);
    } finally {
      setIsCreditingMonthly(false);
    }
  };

  const hasMonthlyMode =
    policy.paid_leave_accrual_mode === 'monthly' ||
    policy.sick_leave_accrual_mode === 'monthly' ||
    policy.casual_leave_accrual_mode === 'monthly';

  const leaveTypes = [
    {
      label: 'Paid Leave',
      modeField: 'paid_leave_accrual_mode',
      annualField: 'paid_leave_days',
      monthlyField: 'paid_leave_monthly_credit',
      carryField: 'carry_forward_paid_leave',
      color: 'bg-green-50 border-green-200'
    },
    {
      label: 'Sick Leave',
      modeField: 'sick_leave_accrual_mode',
      annualField: 'sick_leave_days',
      monthlyField: 'sick_leave_monthly_credit',
      carryField: 'carry_forward_sick_leave',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      label: 'Casual Leave',
      modeField: 'casual_leave_accrual_mode',
      annualField: 'casual_leave_days',
      monthlyField: 'casual_leave_monthly_credit',
      carryField: 'carry_forward_casual_leave',
      color: 'bg-yellow-50 border-yellow-200'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Leave Management Policy</h2>
        <p className="text-gray-500 text-sm">Define how leave days are credited to permanent staff.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveTypes.map(({ label, modeField, annualField, monthlyField, carryField, color }) => {
          const isMonthly = policy[modeField] === 'monthly';
          return (
            <div key={modeField} className={`border rounded-xl p-5 ${color} space-y-4`}>
              <h3 className="font-semibold text-gray-800">{label}</h3>

              {/* Accrual Mode Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-300 bg-white text-sm">
                <button
                  type="button"
                  onClick={() => handleChange(modeField, 'annual')}
                  className={`flex-1 py-1.5 font-medium transition-colors ${!isMonthly ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Annual
                </button>
                <button
                  type="button"
                  onClick={() => handleChange(modeField, 'monthly')}
                  className={`flex-1 py-1.5 font-medium transition-colors ${isMonthly ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Monthly
                </button>
              </div>

              {/* Value input */}
              {!isMonthly ? (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Days per Year</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={policy[annualField]}
                    onChange={e => handleChange(annualField, parseFloat(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Days credited per Month</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={policy[monthlyField]}
                    onChange={e => handleChange(monthlyField, parseFloat(e.target.value) || 0)}
                    className="bg-white"
                    placeholder="e.g. 0.5, 1, 1.5"
                  />
                  <p className="text-xs text-gray-500">
                    = {((policy[monthlyField] || 0) * 12).toFixed(1)} days/year
                  </p>
                </div>
              )}

              {/* Carry Forward */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">Allow Carry Forward</Label>
                <Switch
                  checked={policy[carryField] || false}
                  onCheckedChange={val => handleChange(carryField, val)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Maternity Leave (always annual, female only) */}
      <div className="border rounded-xl p-5 bg-pink-50 border-pink-200 space-y-3 max-w-sm">
        <h3 className="font-semibold text-gray-800">Maternity Leave <span className="text-xs font-normal text-pink-600">(Female staff only)</span></h3>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Total Days</Label>
          <Input
            type="number"
            min={0}
            value={policy.maternity_leave_days}
            onChange={e => handleChange('maternity_leave_days', parseFloat(e.target.value) || 0)}
            className="bg-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Policy Notes</Label>
        <Input
          placeholder="Any additional notes about leave policy..."
          value={policy.notes || ''}
          onChange={e => handleChange('notes', e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving...' : 'Save Policy'}
        </Button>
        <Button variant="outline" onClick={handleApplyToAll} disabled={isApplying}>
          <Users className="mr-2 h-4 w-4" />{isApplying ? 'Applying...' : 'Apply Annual Balances to All Staff'}
        </Button>
        {hasMonthlyMode && (
          <Button variant="outline" onClick={handleCreditMonthly} disabled={isCreditingMonthly} className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <Users className="mr-2 h-4 w-4" />{isCreditingMonthly ? 'Crediting...' : 'Credit Monthly Leaves Now'}
          </Button>
        )}
        {applyMsg && <p className="text-green-600 text-sm font-medium">{applyMsg}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
          <CardDescription>
            <ul className="list-disc pl-4 space-y-1 text-sm mt-2">
              <li>Only <strong>Permanent</strong> staff get leave entitlements. Probation staff have no leave balance.</li>
              <li><strong>Annual mode:</strong> Full year's leaves are credited at once. Use "Apply Annual Balances" to set them.</li>
              <li><strong>Monthly mode:</strong> A fixed amount (e.g. 0.5, 1, 1.5 days) is credited each month. Use "Credit Monthly Leaves Now" on the 1st of each month, or set up a scheduled automation.</li>
              <li>When a leave is <strong>approved</strong>, the corresponding days are deducted from the staff balance.</li>
              <li><strong>Maternity leave</strong> is always credited as a lump sum and applies to female staff only.</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}