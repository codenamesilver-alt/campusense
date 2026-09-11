import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Upload, Database, AlertTriangle, CheckCircle, Loader2, ShieldAlert, CloudUpload, CloudDownload, RefreshCw, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { collectFileUrls, downloadFilesAsBase64, uploadFilesFromBase64, remapUrlsInRecords } from "@/lib/backupFiles";

function StatusMessage({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-xl flex items-center gap-3"
      style={{
        background: message.type === "success" ? "rgba(0,255,136,0.08)" : "rgba(255,107,53,0.08)",
        border: `1px solid ${message.type === "success" ? "rgba(0,255,136,0.3)" : "rgba(255,107,53,0.3)"}`,
      }}
    >
      {message.type === "success"
        ? <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#00ff88" }} />
        : <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "#ff6b35" }} />}
      <p className="text-sm font-mono" style={{ color: message.type === "success" ? "#00ff88" : "#ff6b35" }}>{message.text}</p>
    </motion.div>
  );
}

export default function BackupAndRestore() {
  // Local backup state
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Drive backup state
  const [driveUploadLoading, setDriveUploadLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveFilesLoading, setDriveFilesLoading] = useState(false);
  const [driveRestoreLoading, setDriveRestoreLoading] = useState(null); // file_id being restored
  const [driveMessage, setDriveMessage] = useState(null);

  useEffect(() => {
    loadDriveFiles();
  }, []);

  // ── LOCAL BACKUP ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloadLoading(true);
    setLocalMessage(null);
    try {
      const response = await base44.functions.invoke("backupRestore", { action: "export" });
      const data = response.data;
      const backup = data.backup;
      // Collect and embed uploaded files (photos, receipts, etc.)
      const fileUrls = collectFileUrls(backup);
      let fileCount = 0;
      let filesSkipped = 0;
      if (fileUrls.length > 0) {
        const { files, failed } = await downloadFilesAsBase64(fileUrls);
        backup._files = files;
        fileCount = Object.keys(files).length;
        filesSkipped = failed;
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campusense_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      let msg = `Backup downloaded! (${data.total_records} records across ${data.entities_count} entities`;
      if (fileCount > 0) msg += `, ${fileCount} files`;
      if (filesSkipped > 0) msg += `, ${filesSkipped} files skipped`;
      msg += ")";
      setLocalMessage({ type: "success", text: msg });
    } catch (err) {
      setLocalMessage({ type: "error", text: "Failed to generate backup. Please try again." });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
      setLocalMessage(null);
    } else {
      setLocalMessage({ type: "error", text: "Please select a valid JSON backup file." });
      setSelectedFile(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    if (!window.confirm("⚠️ WARNING: This will OVERWRITE all existing data with the backup. This cannot be undone. Continue?")) return;
    setRestoreLoading(true);
    setLocalMessage(null);
    try {
      const text = await selectedFile.text();
      const backup = JSON.parse(text);
      // Re-upload embedded files and remap their URLs to new locations
      let fileCount = 0;
      let filesFailed = 0;
      let backupToRestore = backup;
      if (backup._files && Object.keys(backup._files).length > 0) {
        const { mapping, failed } = await uploadFilesFromBase64(backup._files);
        fileCount = Object.keys(mapping).length;
        filesFailed = failed;
        backupToRestore = remapUrlsInRecords(backup, mapping);
      }
      const { _files, ...entityBackup } = backupToRestore;
      const response = await base44.functions.invoke("backupRestore", { action: "import", backup: entityBackup });
      const data = response.data;
      let msg = `Restore completed! ${data.restored_records} records restored`;
      if (fileCount > 0) msg += `, ${fileCount} files re-uploaded`;
      if (filesFailed > 0) msg += `, ${filesFailed} files failed`;
      setLocalMessage({ type: "success", text: msg + "." });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setLocalMessage({ type: "error", text: "Failed to restore backup. Ensure the file is a valid Campusense backup." });
    } finally {
      setRestoreLoading(false);
    }
  };

  // ── GOOGLE DRIVE BACKUP ───────────────────────────────────────────────────
  const loadDriveFiles = async () => {
    setDriveFilesLoading(true);
    try {
      const response = await base44.functions.invoke("driveBackup", { action: "list" });
      setDriveFiles(response.data.files || []);
    } catch (err) {
      setDriveMessage({ type: "error", text: "Failed to load Drive backups." });
    } finally {
      setDriveFilesLoading(false);
    }
  };

  const handleDriveUpload = async () => {
    setDriveUploadLoading(true);
    setDriveMessage(null);
    try {
      const response = await base44.functions.invoke("driveBackup", { action: "upload" });
      const data = response.data;
      const fileNote = data.total_files ? `, ${data.total_files} files` : "";
      setDriveMessage({ type: "success", text: `Backup uploaded to Google Drive! (${data.total_records} records${fileNote} saved as "${data.file_name}")` });
      loadDriveFiles();
    } catch (err) {
      setDriveMessage({ type: "error", text: "Failed to upload backup to Google Drive." });
    } finally {
      setDriveUploadLoading(false);
    }
  };

  const handleDriveRestore = async (fileId, fileName) => {
    if (!window.confirm(`⚠️ WARNING: Restoring "${fileName}" will OVERWRITE all current data. This cannot be undone. Continue?`)) return;
    setDriveRestoreLoading(fileId);
    setDriveMessage(null);
    try {
      const response = await base44.functions.invoke("driveBackup", { action: "restore", file_id: fileId });
      const data = response.data;
      const fileNote = data.files_restored ? `, ${data.files_restored} files restored` : "";
      setDriveMessage({ type: "success", text: `Restore from Drive complete! ${data.restored_records} records restored${fileNote}.` });
    } catch (err) {
      setDriveMessage({ type: "error", text: "Failed to restore from Google Drive." });
    } finally {
      setDriveRestoreLoading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a0e1a 100%)" }}>
      {/* Header */}
      <motion.div
        className="rounded-2xl mb-6 p-6"
        style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.08) 0%, rgba(168,85,247,0.1) 100%)", border: "1px solid rgba(0,245,255,0.2)", backdropFilter: "blur(20px)" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)" }}>
            <Database className="h-7 w-7" style={{ color: "#00f5ff" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black font-mono" style={{ color: "#00f5ff", textShadow: "0 0 16px rgba(0,245,255,0.5)" }}>BACKUP & RESTORE</h1>
            <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>Download locally or sync with Google Drive</p>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION 1: Local Backup ── */}
      <div className="mb-2">
        <p className="text-xs font-mono tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>// LOCAL BACKUP</p>
        <StatusMessage message={localMessage} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download */}
          <motion.div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,136,0.2)", backdropFilter: "blur(16px)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)" }}>
                <Download className="h-5 w-5" style={{ color: "#00ff88" }} />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono" style={{ color: "#00ff88" }}>DOWNLOAD BACKUP</h2>
                <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>Export full database as JSON</p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>Downloads a complete snapshot of all school data as a single JSON file to your computer.</p>
            <Button onClick={handleDownload} disabled={downloadLoading} className="w-full font-mono" style={{ background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88" }}>
              {downloadLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />GENERATING...</> : <><Download className="h-4 w-4 mr-2" />DOWNLOAD BACKUP</>}
            </Button>
          </motion.div>

          {/* Restore */}
          <motion.div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,107,53,0.2)", backdropFilter: "blur(16px)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)" }}>
                <Upload className="h-5 w-5" style={{ color: "#ff6b35" }} />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono" style={{ color: "#ff6b35" }}>RESTORE BACKUP</h2>
                <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>Import from a local backup file</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.2)" }}>
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#ff6b35" }} />
              <p className="text-xs font-mono" style={{ color: "rgba(255,107,53,0.85)" }}>Warning: Restoring will overwrite all current data. This action cannot be undone.</p>
            </div>
            <div className="mb-4 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer" style={{ border: "2px dashed rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.04)", minHeight: "80px" }} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-6 w-6 mb-1" style={{ color: "rgba(255,107,53,0.6)" }} />
              <p className="text-xs font-mono text-center" style={{ color: selectedFile ? "#ff6b35" : "rgba(255,255,255,0.35)" }}>{selectedFile ? selectedFile.name : "Click to select backup file (.json)"}</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
            <Button onClick={handleRestore} disabled={restoreLoading || !selectedFile} className="w-full font-mono" style={{ background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.4)", color: "#ff6b35" }}>
              {restoreLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />RESTORING...</> : <><Upload className="h-4 w-4 mr-2" />RESTORE BACKUP</>}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ── SECTION 2: Google Drive Backup ── */}
      <div className="mt-8">
        <p className="text-xs font-mono tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>// GOOGLE DRIVE BACKUP</p>
        <StatusMessage message={driveMessage} />

        <motion.div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(66,133,244,0.3)", backdropFilter: "blur(16px)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {/* Drive Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.3)" }}>
                <HardDrive className="h-5 w-5" style={{ color: "#4285f4" }} />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono" style={{ color: "#4285f4" }}>GOOGLE DRIVE</h2>
                <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>Connected — backups stored in your Drive</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadDriveFiles} disabled={driveFilesLoading} variant="ghost" size="icon" style={{ color: "#4285f4", border: "1px solid rgba(66,133,244,0.2)" }}>
                <RefreshCw className={`h-4 w-4 ${driveFilesLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={handleDriveUpload} disabled={driveUploadLoading} className="font-mono" style={{ background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.4)", color: "#4285f4" }}>
                {driveUploadLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />UPLOADING...</> : <><CloudUpload className="h-4 w-4 mr-2" />BACKUP TO DRIVE</>}
              </Button>
            </div>
          </div>

          {/* Drive Files List */}
          <div>
            <p className="text-xs font-mono mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>SAVED BACKUPS ON DRIVE</p>
            {driveFilesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4285f4" }} />
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{ border: "1px dashed rgba(66,133,244,0.2)", background: "rgba(66,133,244,0.03)" }}>
                <HardDrive className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(66,133,244,0.3)" }} />
                <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>No Drive backups found. Click "Backup to Drive" to create one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {driveFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.15)" }}>
                    <div>
                      <p className="text-sm font-mono font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{file.name}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {new Date(file.createdTime).toLocaleString()} {file.size ? `· ${(parseInt(file.size) / 1024).toFixed(1)} KB` : ""}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDriveRestore(file.id, file.name)}
                      disabled={driveRestoreLoading === file.id}
                      size="sm"
                      className="font-mono"
                      style={{ background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.3)", color: "#ff6b35" }}
                    >
                      {driveRestoreLoading === file.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CloudDownload className="h-3 w-3 mr-1" />RESTORE</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}