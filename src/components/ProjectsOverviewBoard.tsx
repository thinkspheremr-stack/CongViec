import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  FolderSync,
  Edit3,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { Project, TaskItem, ProjectStatus } from '../types';

interface ProjectsOverviewBoardProps {
  projects: Project[];
  tasks: TaskItem[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNavigateToProjectDetails: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenEditProjectModal: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectsOverviewBoard: React.FC<ProjectsOverviewBoardProps> = ({
  projects,
  tasks,
  activeProjectId,
  onSelectProject,
  onNavigateToProjectDetails,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
  onDeleteProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.manager.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md">
            <CheckCircle className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3" /> Dừng thực hiện
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3" /> Đang triển khai
          </span>
        );
    }
  };

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
  const onHoldProjects = projects.filter(p => p.status === 'on_hold').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Theo Dõi Tổng Thể
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Tiến Độ Các Dự Án &amp; Gói Thầu
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Bức tranh tổng thể tất cả các dự án, tiến độ WBS và liên kết hồ sơ Google Drive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm dự án mới</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium">Tổng số dự án</span>
            <div className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5">{totalProjects}</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-blue-400 font-medium">Đang triển khai</span>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">{inProgressProjects}</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-emerald-400 font-medium">Đã hoàn thành</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{completedProjects}</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-rose-400 font-medium">Dừng thực hiện</span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 mt-0.5">{onHoldProjects}</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên dự án, mã..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="on_hold">Dừng thực hiện</option>
          </select>
        </div>
      </div>

      {/* Grid of project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-semibold">Không tìm thấy dự án nào phù hợp</p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const projectTasks = tasks.filter(t => t.projectId === p.id);
            const totalT = projectTasks.length;
            const completedT = projectTasks.filter(t => t.status === 'completed').length;
            const avgProgress = totalT > 0
              ? Math.round(projectTasks.reduce((s, t) => s + t.progress, 0) / totalT)
              : 0;
            const totalDocs = projectTasks.reduce((s, t) => s + (t.documents?.length || 0), 0);
            const isActive = p.id === activeProjectId;

            return (
              <div
                key={p.id}
                className={`bg-slate-900 rounded-2xl border transition-all flex flex-col justify-between p-5 space-y-4 shadow-sm hover:border-slate-700 ${
                  isActive ? 'border-emerald-500/80 ring-1 ring-emerald-500/30' : 'border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {p.code}
                    </span>
                    {getStatusBadge(p.status)}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-100 hover:text-emerald-400 cursor-pointer transition-colors line-clamp-2"
                      onClick={() => onNavigateToProjectDetails(p.id)}
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {p.description || p.objectives || 'Chưa có mô tả mục tiêu'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Tiến độ WBS</span>
                      <span className="font-bold text-emerald-400">{avgProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Quản lý:</span>
                      <strong className="text-slate-300">{p.manager}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hồ sơ Google Drive:</span>
                      <span className="text-emerald-400 font-medium">{totalDocs} tệp đính kèm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Khởi đầu:</span>
                      <strong className="text-slate-300">
                        {p.startMonth && p.startYear ? `${p.startMonth}/${p.startYear}` : (p.startDate || '2026')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEditProjectModal(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Sửa thông tin cơ bản"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa dự án"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectProject(p.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Bảng việc
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToProjectDetails(p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Xem chi tiết</span>
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
