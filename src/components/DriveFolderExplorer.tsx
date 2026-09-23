import React, { useState } from 'react';
import { 
  FolderSync, 
  ExternalLink, 
  Search, 
  Filter, 
  FileText, 
  Camera, 
  Download, 
  Trash2, 
  Eye, 
  Scan, 
  Layers, 
  Check, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { ScannedDocument, TaskItem, CategoryInfo, DocumentType } from '../types';

interface DriveFolderExplorerProps {
  tasks: TaskItem[];
  categories: CategoryInfo[];
  driveFolderName: string;
  driveFolderLink?: string;
  isDriveConnected: boolean;
  onGoogleSignIn: () => void;
  onOpenScanModal: (taskId?: string) => void;
  onDeleteDocument: (doc: ScannedDocument) => void;
}

export const DriveFolderExplorer: React.FC<DriveFolderExplorerProps> = ({
  tasks,
  categories,
  driveFolderName,
  driveFolderLink,
  isDriveConnected,
  onGoogleSignIn,
  onOpenScanModal,
  onDeleteDocument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Collect all documents across all tasks and orphaned docs
  const allDocuments: ScannedDocument[] = [];
  tasks.forEach(task => {
    if (task.documents && task.documents.length > 0) {
      task.documents.forEach(doc => {
        allDocuments.push(doc);
      });
    }
  });

  // Filter documents
  const filteredDocuments = allDocuments.filter(doc => {
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const getDocTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'contract': return { label: 'Hợp đồng & Phụ lục', color: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'acceptance': return { label: 'Biên bản nghiệm thu', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'drawing': return { label: 'Bản vẽ & Thiết kế', color: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 'invoice': return { label: 'Hóa đơn chứng từ', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'report': return { label: 'Báo cáo tiến độ', color: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'minutes': return { label: 'Biên bản họp', color: 'bg-teal-950 text-teal-300 border-teal-800' };
      default: return { label: 'Tài liệu khác', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Drive Folder Connection Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Thư Mục Lưu Trữ Trên Google Drive
                </h2>
                {isDriveConnected ? (
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-medium">
                    Đã đồng bộ
                  </span>
                ) : (
                  <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full font-medium">
                    Chưa kết nối
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Tài liệu, biên bản nghiệm thu, bản vẽ thiết kế được scan từ máy ảnh hoặc tải lên sẽ tự động phân loại lưu trữ an toàn trong một folder riêng biệt trên Google Drive.
              </p>
              
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-emerald-400">
                <span className="text-slate-400 font-sans">Đường dẫn thư mục:</span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Google Drive / {driveFolderName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isDriveConnected ? (
              <>
                {driveFolderLink && (
                  <a
                    href={driveFolderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mở folder trên Drive</span>
                  </a>
                )}
                <button
                  onClick={() => onOpenScanModal()}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan tài liệu mới</span>
                </button>
              </>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <FolderSync className="w-4 h-4" />
                <span>Đăng nhập Google để đồng bộ Drive</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tài liệu scan..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Mọi loại tài liệu</option>
            <option value="acceptance">Biên bản nghiệm thu</option>
            <option value="contract">Hợp đồng &amp; Phụ lục</option>
            <option value="drawing">Bản vẽ thiết kế</option>
            <option value="report">Báo cáo tiến độ</option>
            <option value="invoice">Hóa đơn chứng từ</option>
            <option value="minutes">Biên bản họp</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Mọi danh mục WBS</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                Chưa có tài liệu scan nào
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sử dụng tính năng "Scan Tài liệu" để chụp biên bản, hợp đồng từ camera và lưu thẳng lên Google Drive.
              </p>
            </div>
            <button
              onClick={() => onOpenScanModal()}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>Bắt đầu Scan ngay</span>
            </button>
          </div>
        ) : (
          filteredDocuments.map(doc => {
            const badge = getDocTypeLabel(doc.type);
            const parentTask = tasks.find(t => t.id === doc.taskId);

            return (
              <div 
                key={doc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {doc.scannedViaCamera && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                        <Camera className="w-2.5 h-2.5" /> Scan Camera
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 hover:text-emerald-400 line-clamp-2 transition-colors">
                    {doc.name}
                  </h3>

                  {parentTask && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span className="font-mono text-slate-500 font-bold">[{parentTask.code}]</span>
                      <span className="truncate">{parentTask.title}</span>
                    </div>
                  )}

                  {doc.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>Ngày: {doc.uploadDate}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={doc.driveViewLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 py-1.5 px-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      title="Xem tài liệu trên Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem trên Drive</span>
                    </a>
                    <button
                      onClick={() => onDeleteDocument(doc)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa tài liệu khỏi Google Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
