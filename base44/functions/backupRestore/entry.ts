import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// All entity names to backup/restore
const ENTITIES = [
  "Student", "Staff", "Fee", "Attendance", "Examination", "Notice",
  "AdmissionEnquiry", "Complaint", "StudentHouse", "FeesType", "FeesGroup",
  "FeesMaster", "FeesDiscount", "FeesPayment", "FeeHead", "ClassFeeStructure",
  "StudentFeeMapping", "StudentDiscount", "FeeTransaction", "FeeDue",
  "IncomeHead", "Income", "ExpenseHead", "Expense", "ExamGroup", "ExamSchedule",
  "ExamResult", "GradeConfiguration", "DivisionConfiguration", "Holiday",
  "LeaveApplication", "Class", "Section", "Subject", "SubjectGroup",
  "ClassTeacherAssignment", "Timetable", "Department", "Designation",
  "StaffAttendance", "EmailTemplate", "SMSTemplate", "Book", "BookIssue",
  "InventoryItem", "ItemCategory", "ItemSupplier", "ItemIssue", "Route",
  "Vehicle", "StudentTransport", "SchoolSetting", "Session", "RolePermission",
  "StudentResult", "ReportCardSettings", "PayrollRecord", "LeaveManagementPolicy",
  "AdmitCardTemplate", "MarksheetTemplate"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'export') {
      const backup = {};
      let total_records = 0;

      for (const entity of ENTITIES) {
        try {
          const records = await base44.asServiceRole.entities[entity].list();
          backup[entity] = records;
          total_records += records.length;
        } catch (e) {
          backup[entity] = [];
        }
      }

      return Response.json({
        backup,
        total_records,
        entities_count: ENTITIES.length,
        exported_at: new Date().toISOString()
      });

    } else if (action === 'import') {
      const { backup } = body;
      if (!backup || typeof backup !== 'object') {
        return Response.json({ error: 'Invalid backup data' }, { status: 400 });
      }

      let restored_records = 0;
      let entities_count = 0;

      for (const entity of ENTITIES) {
        const records = backup[entity];
        if (!Array.isArray(records) || records.length === 0) continue;

        try {
          // Delete all existing records first
          const existing = await base44.asServiceRole.entities[entity].list();
          for (const rec of existing) {
            await base44.asServiceRole.entities[entity].delete(rec.id);
          }

          // Strip built-in fields and re-create
          const toCreate = records.map(r => {
            const { id, created_date, updated_date, created_by, ...rest } = r;
            return rest;
          });

          if (toCreate.length > 0) {
            await base44.asServiceRole.entities[entity].bulkCreate(toCreate);
            restored_records += toCreate.length;
          }
          entities_count++;
        } catch (e) {
          console.error(`Failed to restore entity ${entity}:`, e.message);
        }
      }

      return Response.json({ restored_records, entities_count, restored_at: new Date().toISOString() });

    } else {
      return Response.json({ error: 'Invalid action. Use "export" or "import".' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});