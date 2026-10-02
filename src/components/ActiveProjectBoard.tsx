import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Scan, 
  FileText, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  KanbanSquare,
  Search,
  LayoutGrid,
  Filter,
  Check,
  Lock
} from 'lucide-react';
import { Project, ItemType, getProjectItemTypes, TaskItem, CategoryInfo, TaskStatus, ProjectStatus } from '../types';

interface ActiveProjectBoardProps {
  project: Project;
  allProjects: Project[];
  tasks: TaskItem[];
  categories: CategoryInfo[];
  driveFolderName: string;
  driveFolderLink?: string;
  isDriveConnected: boolean;
  driveToken?: string | null;
  driveRootFolderId?: string | null;
  onGoogleSignIn?: () => void;
  onSelectProject: (projectId: string) => void;
  onNavigateToProjectDetails?: (projectId: string) => void;
  onUpdateProjectStatus?: (projectId: string, newStatus: ProjectStatus) => void;
  onOpenNewProjectModal: () => void;
  onOpenScanModal: (taskId?: string) => void;
  onOpenTaskDetail: (task: TaskItem) => void;
  onOpenEditTaskModal: (task: TaskItem) => void;
  onQuickAddTask: (title: string, category: string, uploadAfter?: boolean) => string;
  onUpdateTaskProgress: (taskId: string, newProgress: number) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onViewAllProjects: () => void;
  onSaveProject?: (projectData: Partial<Project>) => void;
  initialSubTab?: 'board' | 'tasks';
}

export const ActiveProjectBoard: React.FC<ActiveProjectBoardProps> = ({
  project,
  allProjects,
  tasks,
  categories,
  onSelectProject,
  onNavigateToProjectDetails,
  onOpenNewProjectModal,
  onOpenScanModal,
  onOpenTaskDetail,
  onOpenEditTaskModal,
  onQuickAddTask,
  onUpdateTaskProgress,
  onDeleteTask,
  initialSubTab = 'board'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'board' | 'tasks'>(initialSubTab);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedItemTypeFilter, setSelectedItemTypeFilter] = useState<'all' | ItemType>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState(categories[0]?.name || 'Triển khai & Thi công');
  const inputRef = useRef<HTMLInputElement>(null);

  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  const getProjectStartDate = (proj: Project): { display: string; year: string } => {
    const selectedDetail = proj.detailItems?.find(d => d.isStartDateSelected);
    if (selectedDetail && (selectedDetail.year || selectedDetail.month || selectedDetail.day)) {
      const parts = [];
      if (selectedDetail.day) parts.push(`Ngày ${selectedDetail.day}`);
      if (selectedDetail.month) parts.push(`Tháng ${selectedDetail.month}`);
      if (selectedDetail.year) parts.push(`Năm ${selectedDetail.year}`);
      return {
        display: parts.join(' ') || `${selectedDetail.month || ''}/${selectedDetail.year || ''}`,
        year: selectedDetail.year || proj.startYear || '2026'
      };
    }
    if (proj.startMonth || proj.startYear) {
      const parts = [];
      if (proj.startMonth) parts.push(`Tháng ${proj.startMonth}`);
      if (proj.startYear) parts.push(`Năm ${proj.startYear}`);
      return {
        display: parts.join(' '),
        year: proj.startYear || '2026'
      };
    }
    if (proj.startDate) {
      const y = proj.startDate.slice(0, 4);
      const m = proj.startDate.slice(5, 7);
      const d = proj.startDate.slice(8, 10);
      return {
        display: `Ngày ${d} Tháng ${m} Năm ${y}`,
        year: y
      };
    }
    return {
      display: 'Chưa thiết lập',
      year: '2026'
    };
  };

  const availableYears = Array.from(
    new Set(
      allProjects.map(p => getProjectStartDate(p).year).filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  const countProject = allProjects.filter(p => getProjectItemTypes(p).includes('project')).length;
  const countPackage = allProjects.filter(p => getProjectItemTypes(p).includes('package')).length;
  const countItem = allProjects.filter(p => getProjectItemTypes(p).includes('item')).length;

  const filteredProjects = allProjects.filter(proj => {
    // 1. Lọc theo năm
    if (selectedYear !== 'all') {
      const projYear = getProjectStartDate(proj).year;
      if (projYear !== selectedYear) return false;
    }
    // 2. Lọc nhanh theo Loại mục Chi tiết (Dự án, Gói thầu, Hạng mục)
    if (selectedItemTypeFilter !== 'all') {
      const pTypes = getProjectItemTypes(proj);
      if (!pTypes.includes(selectedItemTypeFilter)) return false;
    }
    // 3. Lọc theo từ khóa tên hoặc mã
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      const matchName = proj.name.toLowerCase().includes(q);
      const matchCode = proj.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const getWireframeStatus = (st: ProjectStatus) => {
    if (st === 'completed') {
      return {
        key: 'completed',
        label: 'ĐÃ HOÀN THÀNH',
        bgClass: 'bg-[#166534]',
        textColor: 'text-white'
      };
    }
    if (st === 'on_hold') {
      return {
        key: 'on_hold',
        label: 'DỪNG THỰC HIỆN',
        bgClass: 'bg-black',
        textColor: 'text-white'
      };
    }
    return {
      key: 'in_progress',
      label: 'ĐANG THỰC HIỆN',
      bgClass: 'bg-[#dc2626]',
      textColor: 'text-white'
    };
  };

  const handleViewDetail = (projId: string) => {
    if (onNavigateToProjectDetails) {
      onNavigateToProjectDetails(projId);
    } else {
      onSelectProject(projId);
    }
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length;
  const totalDocuments = projectTasks.reduce((sum, t) => sum + (t.documents?.length || 0), 0);
  const overallProgress = totalTasks > 0 
    ? Math.round(projectTasks.reduce((s, t) => s + t.progress, 0) / totalTasks) 
    : 0;

  const filteredTasks = projectTasks.filter(task => {
    if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false;
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.code.toLowerCase().includes(q) ||
        task.assignee.toLowerCase().includes(q) ||
        task.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickAdd = (withUpload = false) => {
    if (!quickTitle.trim()) {
      inputRef.current?.focus();
      return;
    }
    const createdId = onQuickAddTask(quickTitle.trim(), quickCategory, withUpload);
    setQuickTitle('');
    if (withUpload && createdId) {
      onOpenScanModal(createdId);
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAdd(false);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md">
            <CheckCircle className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3" /> Đang làm
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3 h-3" /> Nghiệm thu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
            Chưa làm
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* THANH ĐIỀU HƯỚNG PHỤ TRONG BẢNG CÔNG VIỆC */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-btn-project-board"
            onClick={() => setActiveSubTab('board')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'board'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Bảng Dự án / Hạng mục / Gói thầu</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-slate-900/80 text-emerald-300 font-mono">
              {allProjects.length}
            </span>
          </button>
          <button
            type="button"
            id="tab-btn-project-tasks"
            onClick={() => setActiveSubTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'tasks'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            <span>Danh mục công việc &amp; Scan Drive</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-slate-900/80 text-slate-300 font-mono">
              {totalTasks}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: BẢNG DỰ ÁN (THEO HÌNH VẼ ĐÃ CHỈ ĐỊNH) */}
      {activeSubTab === 'board' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
                <span className="text-emerald-400">#</span>
                <span>Bảng Dự án / Hạng mục / Gói thầu</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Lọc theo năm hoặc tên. Bấm <strong>XEM CHI TIẾT</strong> để xem hồ sơ Chi tiết tương ứng.
              </p>
            </div>
            <div className="text-xs text-slate-400 self-start sm:self-auto">
              Tổng số: <strong className="text-emerald-400 font-bold">{allProjects.length}</strong> dự án / hạng mục / gói thầu
            </div>
          </div>

          {/* KHUNG LỌC (VIỀN XANH LÁ ĐẬM THEO BẢN VẼ) */}
          <div className="bg-slate-900/90 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs sm:text-sm font-bold text-emerald-300 whitespace-nowrap flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lọc: Theo Năm:</span>
                </label>
                <div className="relative">
                  <select
                    id="filter-select-year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full sm:w-56 bg-slate-950 border border-emerald-600/80 hover:border-emerald-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner"
                  >
                    <option value="all">Tất cả các năm ({allProjects.length} dự án / hạng mục / gói thầu)</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>
                        Năm {yr} ({allProjects.filter(p => getProjectStartDate(p).year === yr).length} mục)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs sm:text-sm font-bold text-emerald-300 whitespace-nowrap flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Theo tên:</span>
                </label>
                <div className="relative flex-1">
                  <input
                    id="filter-input-name"
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="gõ ... tìm kiếm theo từ khoá..."
                    className="w-full bg-slate-950 border border-emerald-600/80 hover:border-emerald-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  />
                  {searchKeyword && (
                    <button
                      type="button"
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* HÀNG TÌM KIẾM NHANH THEO MỤC CHI TIẾT (DỰ ÁN / GÓI THẦU / HẠNG MỤC) */}
            <div className="pt-2 border-t border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tìm kiếm nhanh:</span>
                </span>

                <div className="inline-flex items-center bg-slate-950 border border-emerald-600/70 rounded-xl p-1 gap-1 shadow-inner">
                  {/* Tất cả */}
                  <button
                    type="button"
                    onClick={() => setSelectedItemTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedItemTypeFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedItemTypeFilter === 'all' ? 'bg-emerald-800 text-white' : 'bg-slate-900 text-emerald-400'
                    }`}>
                      {allProjects.length}
                    </span>
                  </button>

                  {/* Dự án */}
                  <button
                    type="button"
                    onClick={() => setSelectedItemTypeFilter(selectedItemTypeFilter === 'project' ? 'all' : 'project')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedItemTypeFilter === 'project'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span>Dự án</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedItemTypeFilter === 'project' ? 'bg-emerald-800 text-white' : 'bg-slate-900 text-emerald-400'
                    }`}>
                      {countProject}
                    </span>
                  </button>

                  {/* Gói thầu */}
                  <button
                    type="button"
                    onClick={() => setSelectedItemTypeFilter(selectedItemTypeFilter === 'package' ? 'all' : 'package')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedItemTypeFilter === 'package'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span>Gói thầu</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedItemTypeFilter === 'package' ? 'bg-emerald-800 text-white' : 'bg-slate-900 text-emerald-400'
                    }`}>
                      {countPackage}
                    </span>
                  </button>

                  {/* Hạng mục */}
                  <button
                    type="button"
                    onClick={() => setSelectedItemTypeFilter(selectedItemTypeFilter === 'item' ? 'all' : 'item')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedItemTypeFilter === 'item'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span>Hạng mục</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedItemTypeFilter === 'item' ? 'bg-emerald-800 text-white' : 'bg-slate-900 text-emerald-400'
                    }`}>
                      {countItem}
                    </span>
                  </button>
                </div>
              </div>

              {selectedItemTypeFilter !== 'all' && (
                <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 px-2.5 py-1 rounded-lg">
                  <span>Đang xem: <strong>{selectedItemTypeFilter === 'project' ? 'Dự án' : selectedItemTypeFilter === 'package' ? 'Gói thầu' : 'Hạng mục'}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedItemTypeFilter('all')}
                    className="text-slate-400 hover:text-white ml-1 font-bold cursor-pointer"
                    title="Bỏ lọc, hiện tất cả"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-300/80 pt-2 border-t border-emerald-800/40">
              <span className="italic font-medium">
                (nếu ko lọc thì tự hiện theo thứ tự)
              </span>
              <span className="font-semibold text-slate-300">
                Hiển thị: <strong className="text-emerald-400">{filteredProjects.length}</strong> / {allProjects.length} dự án
              </span>
            </div>
          </div>

          {/* DANH SÁCH CARD DỰ ÁN THEO ĐÚNG BẢN VẼ */}
          <div className="space-y-5">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-base text-slate-300 font-bold">Không tìm thấy dự án nào phù hợp</p>
                <button
                  type="button"
                  onClick={() => { setSelectedYear('all'); setSelectedItemTypeFilter('all'); setSearchKeyword(''); }}
                  className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
                >
                  Xoá lọc &amp; Hiện tất cả theo thứ tự
                </button>
              </div>
            ) : (
              filteredProjects.map((proj, idx) => {
                const stt = idx + 1;
                const startDateInfo = getProjectStartDate(proj);
                const isSub = proj.projectKind === 'sub';
                const kindLabel = isSub ? 'Thành phần' : 'Chính';

                let relationshipElement: React.ReactNode = null;
                if (isSub) {
                  const parentProj = allProjects.find(p => p.id === proj.parentProjectId);
                  const parentName = parentProj?.name || proj.parentProject || 'Chưa liên kết dự án chính';
                  relationshipElement = (
                    <div className="text-xs sm:text-sm text-slate-100 flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-slate-200">Thành phần: </span>
                      <span>thành phần thuộc vào: </span>
                      <strong className="text-amber-300 font-bold underline decoration-amber-400/60 underline-offset-2">
                        {parentName}
                      </strong>
                    </div>
                  );
                } else {
                  const subProjects = allProjects.filter(p => 
                    p.id !== proj.id && (p.parentProjectId === proj.id || (p.projectKind === 'sub' && p.parentProject === proj.name))
                  );
                  relationshipElement = (
                    <div className="text-xs sm:text-sm text-slate-100">
                      <span className="font-bold text-slate-200">nếu Chính thì hiện thành phần : </span>
                      {subProjects.length > 0 ? (
                        <div className="inline-flex flex-wrap gap-1.5 ml-1 mt-1">
                          {subProjects.map(sp => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => handleViewDetail(sp.id)}
                              className="bg-sky-950/90 hover:bg-sky-900 text-sky-200 border border-sky-600/70 hover:border-amber-400 px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {sp.code}: {sp.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-slate-300 ml-1">Chưa có dự án thành phần liên kết</span>
                      )}
                    </div>
                  );
                }

                const statusWire = getWireframeStatus(proj.status);

                return (
                  <div
                    key={proj.id}
                    id={`project-card-${proj.id}`}
                    className="rounded-2xl border-2 border-slate-900 overflow-hidden shadow-2xl transition-all flex flex-col md:flex-row bg-[#1c5d80] hover:shadow-cyan-900/30 group"
                  >
                    {/* CỘT BÊN TRÁI */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between gap-4 text-white min-w-0">
                      <div className="space-y-3">
                        <div className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white flex items-start gap-2">
                          <span className="font-extrabold text-amber-300 whitespace-nowrap text-lg sm:text-xl">
                            {stt}.
                          </span>
                          <div className="leading-snug">
                            <span className="text-slate-200 font-bold">Tên : </span>
                            <span className="font-black text-white text-lg sm:text-xl underline decoration-sky-300/40">
                              {proj.name}
                            </span>
                            <span className="ml-2.5 font-mono text-xs px-2 py-0.5 rounded bg-sky-950/80 text-sky-200 border border-sky-600/60 font-semibold align-middle">
                              {proj.code}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-100 flex flex-wrap items-center gap-1.5 pl-4 sm:pl-6">
                          <span className="font-semibold text-slate-200">- Thời gian bắt đầu: </span>
                          <strong className="text-white font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-600/60">
                            {startDateInfo.display}
                          </strong>
                          <span className="text-[11px] text-sky-200/70 italic">(lấy mục 2)</span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-100 flex flex-wrap items-center gap-1.5 pl-4 sm:pl-6">
                          <span className="font-semibold text-slate-200">Dự án này là : </span>
                          <span className="font-extrabold text-amber-300 bg-sky-950/90 px-2.5 py-0.5 rounded border border-amber-400/50">
                            {kindLabel}
                          </span>
                          <span className="text-[11px] text-sky-200/70 italic">(lấy mục 5)</span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-100 flex flex-wrap items-center gap-1.5 pl-4 sm:pl-6">
                          <span className="font-semibold text-slate-200">Mục chi tiết: </span>
                          <div className="inline-flex flex-wrap items-center gap-1.5">
                            {getProjectItemTypes(proj).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemTypeFilter(t);
                                }}
                                title={`Lọc nhanh: chỉ hiện các dự án chọn ${t === 'project' ? 'Dự án' : t === 'package' ? 'Gói thầu' : 'Hạng mục'}`}
                                className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/60 shadow-xs cursor-pointer transition-colors"
                              >
                                {t === 'project' ? 'Dự án' : t === 'package' ? 'Gói thầu' : 'Hạng mục'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pl-4 sm:pl-6 pt-0.5">
                          {relationshipElement}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-sky-700/60 mt-2">
                        <div className="text-xs text-sky-200/90 flex flex-wrap items-center gap-3">
                          <span>Quản lý: <strong className="text-white font-bold">{proj.manager || 'Ban QLDA'}</strong></span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(proj.id);
                              setActiveSubTab('tasks');
                            }}
                            className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2 font-semibold cursor-pointer"
                          >
                            Xem {tasks.filter(t => t.projectId === proj.id).length} công việc
                          </button>
                        </div>

                        <button
                          type="button"
                          id={`btn-xem-chi-tiet-${proj.id}`}
                          onClick={() => handleViewDetail(proj.id)}
                          className="self-end sm:self-auto bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-lg hover:shadow-purple-700/40 border border-purple-400/60 transition-all cursor-pointer tracking-wider flex items-center gap-2 group/btn"
                        >
                          <span>XEM CHI TIẾT</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* CỘT BÊN PHẢI (DẢI TRẠNG THÁI MÀU SẮC) */}
                    <div 
                      className={`w-full md:w-48 lg:w-56 flex flex-col items-center justify-between p-4 sm:p-5 text-center text-white border-t-2 md:border-t-0 md:border-l-2 border-slate-900 select-none transition-colors ${statusWire.bgClass}`}
                    >
                      <div className="w-full flex flex-col items-center justify-center flex-1 py-2">
                        <div className="text-[11px] font-semibold text-white/80 tracking-wider uppercase mb-1">
                          Trạng thái
                        </div>
                        <div className="uppercase font-black text-center text-base sm:text-lg lg:text-xl leading-tight drop-shadow-md">
                          {statusWire.label}
                        </div>
                      </div>

                      <div className="w-full pt-3 border-t border-white/20 space-y-2">
                        <div className="grid grid-cols-1 gap-1.5 text-[11px] font-bold">
                          <div
                            className={`w-full py-1.5 px-2.5 rounded-lg select-none flex items-center justify-between ${
                              statusWire.key === 'in_progress'
                                ? 'bg-white text-red-700 font-black shadow-md ring-2 ring-white'
                                : 'bg-black/20 text-white/50 opacity-60'
                            }`}
                          >
                            <span>Đang thực hiện</span>
                            {statusWire.key === 'in_progress' && <Check className="w-3.5 h-3.5 text-red-700" />}
                          </div>

                          <div
                            className={`w-full py-1.5 px-2.5 rounded-lg select-none flex items-center justify-between ${
                              statusWire.key === 'completed'
                                ? 'bg-white text-emerald-800 font-black shadow-md ring-2 ring-white'
                                : 'bg-black/20 text-white/50 opacity-60'
                            }`}
                          >
                            <span>Đã hoàn thành</span>
                            {statusWire.key === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-800" />}
                          </div>

                          <div
                            className={`w-full py-1.5 px-2.5 rounded-lg select-none flex items-center justify-between ${
                              statusWire.key === 'on_hold'
                                ? 'bg-white text-zinc-900 font-black shadow-md ring-2 ring-white'
                                : 'bg-black/20 text-white/50 opacity-60'
                            }`}
                          >
                            <span>Dừng thực hiện</span>
                            {statusWire.key === 'on_hold' && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                          </div>

                          {statusWire.key === 'on_hold' && proj.holdReason && (
                            <div className="mt-1 text-[10px] text-amber-200/95 bg-black/60 rounded px-2 py-1 line-clamp-2 text-left" title={`Lý do dừng: ${proj.holdReason}`}>
                              <span className="font-semibold text-rose-300">Lý do:</span> {proj.holdReason}
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-white/80 italic text-center pt-1 space-y-1">
                          <div className="flex items-center justify-center gap-1 text-amber-300 font-semibold not-italic">
                            <Lock className="w-3 h-3 text-amber-300 flex-shrink-0" />
                            <span>Đồng bộ mục 7</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleViewDetail(proj.id)}
                            className="text-[10px] text-sky-200 hover:text-white underline underline-offset-2 cursor-pointer transition-colors block mx-auto"
                          >
                            Đổi trạng thái ở Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: QUẢN LÝ CÔNG VIỆC & SCAN DRIVE */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                    {project.code}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Dự Án Đang Làm Việc
                  </span>

                  <div className="relative inline-block">
                    <select
                      value={project.id}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          onOpenNewProjectModal();
                        } else {
                          onSelectProject(e.target.value);
                        }
                      }}
                      className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <optgroup label="Chọn dự án đang làm:">
                        {allProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <option value="__new__">+ Tạo dự án mới...</option>
                    </select>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
                  <span>{project.name}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
                  <span>Quản lý: <strong className="text-slate-200">{project.manager}</strong></span>
                  <span>•</span>
                  <span>Hạn mục tiêu: <strong className="text-slate-200">{project.targetDate}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">
                    {totalDocuments} tài liệu Drive
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[260px] justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Tiến độ tổng thể</span>
                    <span className="font-extrabold text-base text-emerald-400">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{completedTasks}/{totalTasks} việc xong</span>
                    <span>{inProgressTasks} đang làm</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleViewDetail(project.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenScanModal()}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Drive</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                placeholder="Tìm công việc trong dự án này..."
                className="w-full sm:w-72 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Mọi trạng thái ({projectTasks.length})</option>
                <option value="in_progress">Đang làm ({inProgressTasks})</option>
                <option value="completed">Đã xong ({completedTasks})</option>
                <option value="review">Nghiệm thu</option>
                <option value="not_started">Chưa làm</option>
              </select>
            </div>
            <div className="text-xs text-slate-400 font-medium self-end md:self-center">
              Dự án <strong className="text-slate-200 font-mono">[{project.code}]</strong> ({filteredTasks.length} hạng mục)
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  Danh sách công việc dự án {project.name}
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-medium hidden sm:inline">
                Nhấn [+] bên dưới để thêm và up/scan tài liệu trực tiếp
              </span>
            </div>

            <div className="divide-y divide-slate-800/70">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-slate-400 space-y-2">
                  <p>Dự án này chưa có công việc nào hoặc không phù hợp bộ lọc.</p>
                  <p className="text-slate-500 text-xs">
                    Hãy nhập công việc ở thanh bên dưới ngay!
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const docCount = task.documents?.length || 0;
                  return (
                    <div 
                      key={task.id}
                      className="p-4 sm:p-5 hover:bg-slate-850/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {task.code}
                          </span>
                          <h4 
                            onClick={() => onOpenTaskDetail(task)}
                            className="text-sm sm:text-base font-semibold text-slate-100 hover:text-emerald-400 cursor-pointer transition-colors"
                          >
                            {task.title}
                          </h4>
                          {getStatusBadge(task.status)}
                          <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {task.category}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-1 max-w-3xl">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span>Phụ trách: <strong className="text-slate-300">{task.assignee}</strong></span>
                          <span>•</span>
                          <span>Hạn: <strong className="text-slate-300">{task.dueDate}</strong></span>
                          {task.budget && (
                            <>
                              <span>•</span>
                              <span>Ngân sách: <strong className="text-slate-300">{task.budget}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
                        <div className="w-full sm:w-44 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Tiến độ</span>
                            <span className="font-bold text-emerald-400">{task.progress}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={task.progress}
                            onChange={(e) => onUpdateTaskProgress(task.id, parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => onOpenScanModal(task.id)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all border border-emerald-500/50 cursor-pointer"
                          >
                            <Plus className="w-4 h-4 text-emerald-100" />
                            <Upload className="w-3.5 h-3.5 text-emerald-100" />
                            <span>Up tài liệu</span>
                          </button>

                          {docCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => onOpenTaskDetail(task)}
                              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-800/60 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{docCount} tệp Drive</span>
                            </button>
                          ) : (
                            <span className="hidden sm:inline text-[11px] text-slate-500 italic px-1">
                              Chưa có file
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenEditTaskModal(task)}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DÒNG THÊM CÔNG VIỆC NHANH */}
            <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Thêm công việc nhanh vào WBS
                </span>
                <span className="text-[11px] text-slate-500">
                  Nhấn Enter để lưu hoặc dùng nút [+] để đính kèm tài liệu ngay
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tên công việc mới... (vd: Nghiệm thu cốt thép dầm sàn tầng 2)"
                    className="w-full bg-slate-900 border border-slate-700/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="w-full md:w-56">
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/90 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(false)}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu việc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(true)}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all border border-emerald-500 cursor-pointer"
                    title="Tạo việc và mở ngay bảng Scan / Up tài liệu lên Google Drive"
                  >
                    <Plus className="w-4 h-4 text-emerald-200" />
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Up tài liệu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
