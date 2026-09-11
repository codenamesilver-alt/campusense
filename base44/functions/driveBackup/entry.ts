import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

// ── FILE BACKUP HELPERS ────────────────────────────────────────────────────
// Embeds uploaded files (photos, receipts, etc.) as base64 inside the backup
// and re-uploads them on restore, remapping old URLs to the new locations.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const FILE_EXT_PATTERN = /\.(jpg|jpeg|png|gif|webp|svg|bmp|pdf|doc|docx|xls|xlsx|csv|mp4|mp3|wav|avi|mov|m4a|ogg|webm|flac)(\?|$)/i;

function isFileUrl(value: any): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v.startsWith('http')) return false;
  if (FILE_EXT_PATTERN.test(v)) return true;
  if (/base44/i.test(v)) return true;
  return false;
}

function scanObject(obj: any, urls: Set<string>): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (isFileUrl(obj)) urls.add(obj);
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) scanObject(item, urls);
    return;
  }
  if (typeof obj === 'object') {
    for (const value of Object.values(obj)) scanObject(value, urls);
  }
}

function collectFileUrls(backup: Record<string, any>): string[] {
  const urls = new Set<string>();
  for (const key of Object.keys(backup)) {
    if (key === '_files') continue;
    const records = backup[key];
    if (Array.isArray(records)) {
      for (const record of records) scanObject(record, urls);
    }
  }
  return Array.from(urls);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

async function downloadFilesAsBase64(urls: string[]): Promise<Record<string, any>> {
  const files: Record<string, any> = {};
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_FILE_SIZE) continue;
      files[url] = { content_type: contentType, data_base64: arrayBufferToBase64(buffer) };
    } catch (e) {
      console.error(`fileBackup: failed to download ${url}:`, e.message);
    }
  }
  return files;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function uploadFilesFromBase64(base44: any, files: Record<string, any>): Promise<Record<string, string>> {
  const mapping: Record<string, string> = {};
  for (const [oldUrl, fileData] of Object.entries(files)) {
    try {
      const bytes = base64ToUint8Array(fileData.data_base64);
      const blob = new Blob([bytes], { type: fileData.content_type });
      const filename = (oldUrl.split('/').pop() || 'restored_file').split('?')[0];
      const file = new File([blob], filename, { type: fileData.content_type });
      const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      if (result?.file_url) mapping[oldUrl] = result.file_url;
    } catch (e) {
      console.error(`fileBackup: failed to upload for ${oldUrl}:`, e.message);
    }
  }
  return mapping;
}

function remapObject(obj: any, mapping: Record<string, string>): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return mapping[obj] || obj;
  if (Array.isArray(obj)) return obj.map((item) => remapObject(item, mapping));
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = remapObject(value, mapping);
    }
    return result;
  }
  return obj;
}

function remapUrlsInRecords(backup: Record<string, any>, mapping: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(backup)) {
    if (key === '_files') { result[key] = backup[key]; continue; }
    const records = backup[key];
    result[key] = Array.isArray(records) ? records.map((r) => remapObject(r, mapping)) : records;
  }
  return result;
}

// ── GOOGLE DRIVE CONNECTION ────────────────────────────────────────────────
async function getAccessToken(base44: any) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
  return accessToken;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // ── UPLOAD TO DRIVE ──────────────────────────────────────────────────────
    if (action === 'upload') {
      const backup: Record<string, any> = {};
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

      // Collect and embed uploaded files (photos, receipts, etc.)
      const fileUrls = collectFileUrls(backup);
      const files = await downloadFilesAsBase64(fileUrls);
      backup['_files'] = files;
      const total_files = Object.keys(files).length;

      const accessToken = await getAccessToken(base44);
      const fileName = `campusense_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify({ backup, exported_at: new Date().toISOString(), total_records, total_files }, null, 2);

      const boundary = '-------CampusenseBackup';
      const metadata = JSON.stringify({ name: fileName, mimeType: 'application/json' });
      const bodyParts = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        metadata,
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        fileContent,
        `--${boundary}--`
      ].join('\r\n');

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: bodyParts
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        return Response.json({ error: `Drive upload failed: ${err}` }, { status: 500 });
      }

      const file = await uploadRes.json();
      return Response.json({ success: true, file_name: fileName, file_id: file.id, total_records, total_files });

    // ── LIST DRIVE BACKUPS ───────────────────────────────────────────────────
    } else if (action === 'list') {
      const accessToken = await getAccessToken(base44);
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name+contains+'campusense_backup'&fields=files(id,name,createdTime,size)&orderBy=createdTime+desc`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!listRes.ok) {
        return Response.json({ error: 'Failed to list Drive files' }, { status: 500 });
      }

      const data = await listRes.json();
      return Response.json({ files: data.files || [] });

    // ── RESTORE FROM DRIVE ───────────────────────────────────────────────────
    } else if (action === 'restore') {
      const { file_id } = body;
      if (!file_id) return Response.json({ error: 'file_id is required' }, { status: 400 });

      const accessToken = await getAccessToken(base44);
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file_id}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!downloadRes.ok) {
        return Response.json({ error: 'Failed to download file from Drive' }, { status: 500 });
      }

      const parsed = await downloadRes.json();
      const backup = parsed.backup;
      if (!backup) return Response.json({ error: 'Invalid backup file format' }, { status: 400 });

      // Re-upload embedded files and remap URLs to new locations
      let urlMapping: Record<string, string> = {};
      let files_restored = 0;
      if (backup._files && Object.keys(backup._files).length > 0) {
        urlMapping = await uploadFilesFromBase64(base44, backup._files);
        files_restored = Object.keys(urlMapping).length;
      }
      const remappedBackup = remapUrlsInRecords(backup, urlMapping);

      let restored_records = 0;
      let entities_count = 0;

      for (const entity of ENTITIES) {
        const records = remappedBackup[entity];
        if (!Array.isArray(records) || records.length === 0) continue;
        try {
          const existing = await base44.asServiceRole.entities[entity].list();
          for (const rec of existing) {
            await base44.asServiceRole.entities[entity].delete(rec.id);
          }
          const toCreate = records.map(({ id, created_date, updated_date, created_by, ...rest }: any) => rest);
          if (toCreate.length > 0) {
            await base44.asServiceRole.entities[entity].bulkCreate(toCreate);
            restored_records += toCreate.length;
          }
          entities_count++;
        } catch (e) {
          console.error(`Failed to restore ${entity}:`, e.message);
        }
      }

      return Response.json({ success: true, restored_records, entities_count, files_restored });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});