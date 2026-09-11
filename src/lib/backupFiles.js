// Frontend helpers for embedding uploaded files (photos, receipts, etc.) in backups.
// Used by the local download/restore flow so the browser handles file fetch/upload
// (avoids backend response size limits).

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const FILE_EXT_PATTERN = /\.(jpg|jpeg|png|gif|webp|svg|bmp|pdf|doc|docx|xls|xlsx|csv|mp4|mp3|wav|avi|mov|m4a|ogg|webm|flac)(\?|$)/i;

function isFileUrl(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v.startsWith("http")) return false;
  if (FILE_EXT_PATTERN.test(v)) return true;
  if (/base44/i.test(v)) return true;
  return false;
}

function scanObject(obj, urls) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "string") {
    if (isFileUrl(obj)) urls.add(obj);
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) scanObject(item, urls);
    return;
  }
  if (typeof obj === "object") {
    for (const value of Object.values(obj)) scanObject(value, urls);
  }
}

export function collectFileUrls(backup) {
  const urls = new Set();
  for (const key of Object.keys(backup)) {
    if (key === "_files") continue;
    const records = backup[key];
    if (Array.isArray(records)) {
      for (const record of records) scanObject(record, urls);
    }
  }
  return Array.from(urls);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export async function downloadFilesAsBase64(urls) {
  const files = {};
  let failed = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) { failed++; continue; }
      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_FILE_SIZE) { failed++; continue; }
      files[url] = { content_type: contentType, data_base64: arrayBufferToBase64(buffer) };
    } catch (e) {
      console.error(`backupFiles: failed to fetch ${url}:`, e.message);
      failed++;
    }
  }
  return { files, failed };
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function uploadFilesFromBase64(files) {
  const { base44 } = await import("@/api/base44Client");
  const mapping = {};
  let failed = 0;
  for (const [oldUrl, fileData] of Object.entries(files)) {
    try {
      const bytes = base64ToUint8Array(fileData.data_base64);
      const blob = new Blob([bytes], { type: fileData.content_type });
      const filename = (oldUrl.split("/").pop() || "restored_file").split("?")[0];
      const file = new File([blob], filename, { type: fileData.content_type });
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) mapping[oldUrl] = result.file_url;
      else failed++;
    } catch (e) {
      console.error(`backupFiles: failed to upload for ${oldUrl}:`, e.message);
      failed++;
    }
  }
  return { mapping, failed };
}

function remapObject(obj, mapping) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return mapping[obj] || obj;
  if (Array.isArray(obj)) return obj.map((item) => remapObject(item, mapping));
  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = remapObject(value, mapping);
    }
    return result;
  }
  return obj;
}

export function remapUrlsInRecords(backup, mapping) {
  const result = {};
  for (const key of Object.keys(backup)) {
    if (key === "_files") { result[key] = backup[key]; continue; }
    const records = backup[key];
    result[key] = Array.isArray(records) ? records.map((r) => remapObject(r, mapping)) : records;
  }
  return result;
}