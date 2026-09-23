import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileJson,
  Check,
  ShieldCheck,
  CloudUpload
} from 'lucide-react';
import { Project, TaskItem, CategoryInfo } from '../types';
import { 
  FullBackupPayload, 
  generateBackupPayload, 
  downloadBackupFile, 
  parseBackupFile 
} from '../utils/backupRestore';
import { uploadDocumentToDrive } from '../services/driveService';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: TaskItem[];
  categories: CategoryInfo[];
  masterDrivePath: string;
  activeProjectId: string;
  companyName: string;
  isDriveConnected?: boolean;
  driveToken?: string | null;
  driveRootFolderId?: string | null;
  onRestoreAll: (restoredData: {
    projects: Project[];
    tasks: TaskItem[];
    masterDrivePath?: string;
    activeProjectId?: string;
  }) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  categories,
  masterDrivePath,
  activeProjectId,
  companyName,
  isDriveConnected,
  driveToken,
  driveRootFolderId,
  onRestoreAll
}) => {
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem('pm_last_backup_time') || '';
  });
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string>('');

  // Pending file to restore
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewPayload, setPreviewPayload] = useState<FullBackupPayload | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [driveUploadNotice, setDriveUploadNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Thực hiện tải file backup toàn bộ
  const handleDownloadBackup = () => {
    try {
      const payload = generateBackupPayload(
        projects,
        tasks,
        categories,
        masterDrivePath,
        activeProjectId,
        companyName
      );
      downloadBackupFile(payload);
      setLastBackupTime(payload.backupTimeFormatted);
      setDownloadSuccessNotice(`Tải bản sao lưu thành công lúc ${payload.backupTimeFormatted}!`);
      setTimeout(() => setDownloadSuccessNotice(''), 4000);
    } catch (err: any) {
      alert('Không thể tạo file sao lưu: ' + err.message);
    }
  };

  // Lưu bản backup trực tiếp lên Google Drive
  const handleSaveToDrive = async () => {
    if (!isDriveConnected || !driveToken || !driveRootFolderId) {
      alert('Chưa kết nối Google Drive hoặc chưa cấu hình thư mục.');
      return;
    }

    try {
      setIsProcessing(true);
      setDriveUploadNotice('Đang tải bản sao lưu lên Google Drive...');
      
      const payload = generateBackupPayload(
        projects,
        tasks,
        categories,
        masterDrivePath,
        activeProjectId,
        companyName
      );
      const jsonStr = JSON.stringify(payload, null, 2);
      const now = new Date();
      const fileName = `Sao_luu_PM_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}.json`;
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const file = new File([blob], fileName, { type: 'application/json' });

      await uploadDocumentToDrive(
        driveToken,
        file,
        fileName,
        'application/json',
        driveRootFolderId
      );

      setLastBackupTime(payload.backupTimeFormatted);
      localStorage.setItem('pm_last_backup_time', payload.backupTimeFormatted);
      setDriveUploadNotice(`Đã lưu bản sao lưu an toàn lên Google Drive: ${fileName}`);
      setTimeout(() => setDriveUploadNotice(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi lưu lên Google Drive: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Khi người dùng chọn file backup từ máy
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const payload = await parseBackupFile(file);
      setPreviewPayload(payload);
    } catch (err: any) {
      setErrorMessage(err.message || 'File không hợp lệ');
      setSelectedFile(null);
      setPreviewPayload(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Xác nhận khôi phục
  const handleConfirmRestore = () => {
    if (!previewPayload) return;

    try {
      let finalProjects: Project[];
      let finalTasks: TaskItem[];

      if (restoreMode === 'replace') {
        finalProjects = previewPayload.projects;
        finalTasks = previewPayload.tasks || [];
      } else {
        // Merge mode: giữ lại hoặc thêm mới
        const existingMap = new Map(projects.map(p => [p.id, p]));
        previewPayload.projects.forEach(p => {
          existingMap.set(p.id, p);
        });
        finalProjects = Array.from(existingMap.values());

        const existingTaskMap = new Map(tasks.map(t => [t.id, t]));
        (previewPayload.tasks || []).forEach(t => {
          existingTaskMap.set(t.id, t);
        });
        finalTasks = Array.from(existingTaskMap.values());
      }

      onRestoreAll({
        projects: finalProjects,
        tasks: finalTasks,
        masterDrivePath: previewPayload.masterDrivePath,
        activeProjectId: previewPayload.activeProjectId || finalProjects[0]?.id
      });

      alert(`Khôi phục thành công toàn bộ từ bản sao lưu ngày ${previewPayload.backupTimeFormatted}! Đã nạp ${finalProjects.length} dự án.`);
      
      // Reset
      setSelectedFile(null);
      setPreviewPayload(null);
      onClose();
    } catch (err: any) {
      alert('Lỗi khi đồng bộ bản sao lưu: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Sao lưu &amp; Khôi phục toàn bộ</span>
              </h3>
              <p className="text-xs text-slate-400">
                Bảo vệ an toàn 100% dữ liệu khi thay máy tính, đổi trình duyệt hoặc chia sẻ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json,application/json"
          className="hidden"
        />

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Thông tin hiện trạng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Tổng số dự án</div>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                {projects.length} <span className="text-xs text-slate-400 font-normal">dự án</span>
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Tổng công việc &amp; tài liệu</div>
              <div className="text-lg font-extrabold text-teal-400 mt-0.5">
                {tasks.length} <span className="text-xs text-slate-400 font-normal">hạng mục</span>
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Sao lưu gần nhất</span>
              </div>
              <div className="text-xs font-bold text-amber-300 mt-1 truncate" title={lastBackupTime || 'Chưa sao lưu'}>
                {lastBackupTime || 'Chưa có bản sao lưu'}
              </div>
            </div>
          </div>

          {/* Thông báo tải thành công nếu có */}
          {downloadSuccessNotice && (
            <div className="bg-emerald-950/80 border border-emerald-600/70 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{downloadSuccessNotice}</span>
            </div>
          )}

          {driveUploadNotice && (
            <div className="bg-blue-950/80 border border-blue-600/70 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-blue-200 animate-fade-in">
              <CloudUpload className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span>{driveUploadNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-700 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* KHỐI 1: SAO LƯU (TẠO BẢN BACKUP) */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    1. Tạo &amp; Tải bản sao lưu toàn bộ (.json)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Hệ thống sẽ gom toàn bộ danh sách dự án, biểu chi tiết, tài liệu đính kèm, nơi lưu trữ, công việc thành 1 tệp tin duy nhất <strong>ghi rõ ngày, giờ sao lưu</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-700/60">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tên file tự động gắn ngày giờ: <span className="font-mono text-emerald-400">Sao_luu_toan_bo_du_an_[YYYY-MM-DD_HH-mm].json</span></span>
              </div>
              <div className="flex items-center gap-2">
                {isDriveConnected && (
                  <button
                    type="button"
                    onClick={handleSaveToDrive}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-700/60 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    title="Lưu bản sao lưu này thẳng lên Google Drive"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-teal-400" />
                    <span>Lưu lên Google Drive</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải bản sao lưu này</span>
                </button>
              </div>
            </div>
          </div>

          {/* KHỐI 2: KHÔI PHỤC (NẠP BẢN BACKUP) */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    2. Khôi phục lại toàn bộ từ bản sao lưu
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Khi bạn chuyển sang máy tính mới, cài lại máy hoặc muốn hồi phục dữ liệu, hãy chọn tệp backup <span className="font-mono text-blue-400">.json</span> đã lưu trước đó.
                  </p>
                </div>
              </div>
            </div>

            {/* Chưa chọn file -> Hiện nút chọn file */}
            {!previewPayload && (
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                <div className="text-[11px] text-slate-400">
                  Hệ thống sẽ hiển thị chi tiết thời gian sao lưu trước khi bạn quyết định nạp
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn file sao lưu (.json) để phục hồi</span>
                </button>
              </div>
            )}

            {/* Đã chọn file -> Hiện bảng xem trước & xác nhận */}
            {previewPayload && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950/90 border border-blue-500/60 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Tệp sao lưu: <span className="text-blue-300 font-mono">{selectedFile?.name}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewPayload(null);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer"
                  >
                    Chọn file khác
                  </button>
                </div>

                {/* Chi tiết nội dung file backup */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Thời gian tạo bản sao lưu:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {previewPayload.backupTimeFormatted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Đơn vị:</span>
                    <span className="font-semibold text-slate-200">
                      {previewPayload.company || companyName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Số lượng dự án trong bản lưu:</span>
                    <span className="font-bold text-teal-300">
                      {previewPayload.projects.length} dự án
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Số lượng công việc:</span>
                    <span className="font-bold text-slate-200">
                      {(previewPayload.tasks || []).length} công việc
                    </span>
                  </div>
                </div>

                {/* Danh sách tóm tắt */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Danh sách dự án trong bản lưu:
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {previewPayload.projects.map((p, idx) => (
                      <div key={p.id || idx} className="flex items-center gap-2 text-xs bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                        <span className="font-mono font-bold text-emerald-400">[{p.code || 'DA'}]</span>
                        <span className="text-slate-200 truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-500 ml-auto whitespace-nowrap">
                          {p.detailItems?.length || 0} dòng chi tiết
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lựa chọn cách khôi phục */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Chọn chế độ phục hồi:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      restoreMode === 'replace'
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-100">Ghi đè (Khuyên dùng)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Thay thế 100% dữ liệu hiện tại bằng dữ liệu bản sao lưu này.</div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      restoreMode === 'merge'
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-100">Gộp thêm (Merge)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Giữ dự án hiện tại và bổ sung thêm từ file backup.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Nút xác nhận phục hồi */}
                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewPayload(null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Xác nhận nạp bản sao lưu này</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Mẹo: Hãy lưu file backup vào Google Drive, USB hoặc gửi vào Email của bạn để không bao giờ bị mất dữ liệu.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
