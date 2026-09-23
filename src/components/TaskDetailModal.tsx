import React from 'react';
import { 
  X, 
  Scan, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Camera,
  FolderOpen
} from 'lucide-react';
import { TaskItem, ScannedDocument, TaskStatus, TaskPriority } from '../types';

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScanModal: (taskId: string) => void;
  onUpdateProgress: (taskId: string, progress: number) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteDocument: (doc: ScannedDocument) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onOpenScanModal,
  onUpdateProgress,
  onUpdateStatus,
  onDeleteDocument
}) => {
  if (!isOpen || !task) return null;

  const getPriorityText = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return 'Khẩn cấp (P1)';
      case 'high': return 'Cao (P2)';
      case 'medium': return 'Trung bình (P3)';
      default: return 'Thấp (P4)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {task.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {task.category}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-100">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Progress & Status Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Trạng thái:</span>
                <select
                  value={task.status}
                  onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                  className="bg-slate-900 border border-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="not_started">Chưa bắt đầu</option>
                  <option value="in_progress">Đang triển khai</option>
                  <option value="review">Chờ nghiệm thu</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="on_hold">Tạm hoãn</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Ưu tiên:</span>
                <span className="text-xs font-semibold text-slate-200">
                  {getPriorityText(task.priority)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tiến độ thực hiện:</span>
                <span className="font-bold text-emerald-400">{task.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={task.progress}
                onChange={(e) => onUpdateProgress(task.id, parseInt(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Description & Key Details */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Mô tả chi tiết
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                {task.description || 'Chưa có mô tả chi tiết cho công việc này.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Phụ trách</span>
                <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">
                  {task.assignee}
                </span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Ngày bắt đầu</span>
                <span className="text-xs font-semibold text-slate-200 block mt-0.5">
                  {task.startDate || 'Chưa đặt'}
                </span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Hạn hoàn thành</span>
                <span className="text-xs font-semibold text-amber-400 block mt-0.5">
                  {task.dueDate || 'Chưa đặt'}
                </span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Dự toán ngân sách</span>
                <span className="text-xs font-semibold text-emerald-400 block mt-0.5 truncate">
                  {task.budget || 'Chưa định mức'}
                </span>
              </div>
            </div>

            {task.notes && (
              <div className="text-xs text-slate-400 bg-amber-950/20 border border-amber-800/30 p-2.5 rounded-xl">
                <strong className="text-amber-300">Ghi chú quan trọng: </strong>
                {task.notes}
              </div>
            )}
          </div>

          {/* Scanned Documents Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Hồ sơ &amp; Tài Liệu Scan Trên Google Drive ({task.documents?.length || 0})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Các tài liệu biên bản, bản vẽ kỹ thuật, chứng từ scan lưu trữ
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenScanModal(task.id);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>+ Scan tài liệu</span>
              </button>
            </div>

            {!task.documents || task.documents.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800 border-dashed rounded-xl p-6 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Chưa có tài liệu đính kèm cho công việc này
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenScanModal(task.id);
                  }}
                  className="text-xs text-emerald-400 hover:underline font-medium cursor-pointer"
                >
                  Chụp ảnh scan từ camera hoặc tải tệp lên ngay
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {task.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        {doc.scannedViaCamera ? <Camera className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate block">
                          {doc.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Ngày tải: {doc.uploadDate}</span>
                          {doc.scannedViaCamera && (
                            <span className="text-emerald-400 font-medium">Scan bằng Camera</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.driveViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                        title="Xem tài liệu trên Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Drive</span>
                      </a>
                      <button
                        onClick={() => onDeleteDocument(doc)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Xóa tài liệu khỏi công việc và Google Drive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
