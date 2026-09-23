import React, { useState } from 'react';
import { 
  FolderSync, 
  Scan, 
  LogOut, 
  ExternalLink,
  KanbanSquare,
  BarChart3,
  Files,
  FileSpreadsheet,
  Pencil,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';
import { type User } from 'firebase/auth';
import { Project } from '../types';

export type AppViewMode = 'project_details' | 'active_project' | 'projects_overview' | 'drive';

interface NavbarProps {
  currentView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  activeProject?: Project;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
  onOpenNewProjectModal?: () => void;
  onOpenScanModal: () => void;
  onOpenNewTaskModal: () => void;
  onOpenBackupModal?: () => void;
  currentUser: User | null;
  driveFolderName: string;
  driveFolderLink?: string;
  isDriveConnected: boolean;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  isAuthenticating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  activeProject,
  projects = [],
  onOpenScanModal,
  onOpenBackupModal,
  currentUser,
  driveFolderName,
  driveFolderLink,
  isDriveConnected,
  onGoogleSignIn,
  onLogout,
  isAuthenticating
}) => {
  // Tên công ty / Đơn vị: Công ty CP Cảng Quốc tế Lào - Việt
  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem('pm_company_name') || 'Công ty CP Cảng Quốc tế Lào - Việt';
  });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyInput, setCompanyInput] = useState(companyName);

  const handleSaveCompany = () => {
    const nextVal = companyInput.trim() || 'Công ty CP Cảng Quốc tế Lào - Việt';
    setCompanyName(nextVal);
    localStorage.setItem('pm_company_name', nextVal);
    setIsEditingCompany(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-inner border border-emerald-400/30 flex-shrink-0">
              <FolderSync className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingCompany ? (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <input
                      type="text"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCompany();
                        if (e.key === 'Escape') {
                          setCompanyInput(companyName);
                          setIsEditingCompany(false);
                        }
                      }}
                      autoFocus
                      className="bg-slate-950 border border-emerald-500 rounded-md px-2 py-0.5 text-xs sm:text-sm font-bold text-white focus:outline-none w-56 sm:w-80"
                      placeholder="Nhập tên công ty / đơn vị..."
                    />
                    <button
                      type="button"
                      onClick={handleSaveCompany}
                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      title="Lưu tên công ty"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyInput(companyName);
                        setIsEditingCompany(false);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Hủy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span 
                      className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-slate-100 max-w-[200px] sm:max-w-xs md:max-w-md truncate cursor-pointer hover:text-emerald-300 transition-colors"
                      title={`${companyName} (Nhấn để chỉnh sửa)`}
                      onClick={() => {
                        setCompanyInput(companyName);
                        setIsEditingCompany(true);
                      }}
                    >
                      {companyName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyInput(companyName);
                        setIsEditingCompany(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
                      title="Chỉnh sửa tên công ty"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-sm">
                Quản lý Dự án, Tiến độ &amp; Lưu trữ Tài liệu Scan Google Drive
              </p>
            </div>
          </div>

          {/* Navigation Views */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {/* View 1: Chi tiết */}
            <button
              id="nav-btn-project-details"
              onClick={() => onSelectView('project_details')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                currentView === 'project_details'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Xem và chỉnh sửa Biểu Chi tiết"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Chi tiết</span>
              {activeProject && (
                <span className="text-[10px] bg-slate-900 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">
                  {activeProject.code}
                </span>
              )}
            </button>

            {/* View 2: Bảng công việc */}
            <button
              id="nav-btn-active-project"
              onClick={() => onSelectView('active_project')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                currentView === 'active_project'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <KanbanSquare className="w-4 h-4 text-teal-400" />
              <span>Bảng công việc</span>
            </button>

            {/* View 3: Tiến độ */}
            <button
              id="nav-btn-projects-overview"
              onClick={() => onSelectView('projects_overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                currentView === 'projects_overview'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Tiến độ</span>
              <span className="text-[10px] bg-slate-900 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                {projects.length}
              </span>
            </button>

            {/* View 4: Hồ sơ Google Drive */}
            <button
              id="nav-btn-drive"
              onClick={() => onSelectView('drive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                currentView === 'drive'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Files className="w-4 h-4 text-amber-400" />
              <span>Hồ sơ Drive</span>
            </button>
          </nav>

          {/* Actions & Drive Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Backup & Restore Button */}
            {onOpenBackupModal && (
              <button
                id="btn-backup-restore-header"
                onClick={onOpenBackupModal}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-700/60 hover:border-teal-500 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Sao lưu toàn bộ dữ liệu khi thay máy tính hoặc chia sẻ"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Sao lưu &amp; Phục hồi</span>
                <span className="sm:hidden">Sao lưu</span>
              </button>
            )}

            {/* Primary Action Button: Scan Tài liệu */}
            <button
              id="btn-scan-document-header"
              onClick={onOpenScanModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Quét tài liệu bằng máy ảnh hoặc tải file lên Google Drive"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Tài liệu</span>
            </button>

            {/* Google Drive Status / Login */}
            {isDriveConnected && currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700/80">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  {driveFolderLink ? (
                    <a
                      href={driveFolderLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline flex items-center justify-end gap-1 cursor-pointer"
                    >
                      <span className="truncate max-w-[100px]">{driveFolderName}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                      {driveFolderName}
                    </span>
                  )}
                </div>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-8 h-8 rounded-full border border-emerald-500/50 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center text-xs font-bold border border-emerald-500/40">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'G'}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Đăng xuất khỏi Google Drive"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pl-1 sm:pl-2">
                <button
                  id="btn-google-drive-login"
                  onClick={onGoogleSignIn}
                  disabled={isAuthenticating}
                  className="gsi-material-button inline-flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 font-medium px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                  title="Kết nối tài khoản Google Drive để đồng bộ tài liệu scan"
                >
                  <div className="w-4 h-4 flex-shrink-0">
                    <svg viewBox="0 0 48 48" className="w-4 h-4">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">
                    {isAuthenticating ? 'Đang kết nối...' : 'Kết nối Google Drive'}
                  </span>
                  <span className="sm:hidden">Drive</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View Switcher Tab */}
        <div className="flex md:hidden border-t border-slate-800 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => onSelectView('project_details')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center whitespace-nowrap cursor-pointer ${
              currentView === 'project_details' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Chi tiết
          </button>
          <button
            onClick={() => onSelectView('active_project')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center whitespace-nowrap cursor-pointer ${
              currentView === 'active_project' ? 'bg-slate-800 text-teal-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Bảng việc
          </button>
          <button
            onClick={() => onSelectView('projects_overview')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center whitespace-nowrap cursor-pointer ${
              currentView === 'projects_overview' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Tiến độ
          </button>
          <button
            onClick={() => onSelectView('drive')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center whitespace-nowrap cursor-pointer ${
              currentView === 'drive' ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Google Drive
          </button>
        </div>
      </div>
    </header>
  );
};
