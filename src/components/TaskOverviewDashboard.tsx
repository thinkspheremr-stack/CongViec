import React from 'react';
import { 
  FolderSync, 
  Layers, 
  TrendingUp, 
  FileText,
  Calendar,
  ExternalLink,
  ChevronRight,
  Scan,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { TaskItem, CategoryInfo } from '../types';

interface TaskOverviewDashboardProps {
  tasks: TaskItem[];
  categories: CategoryInfo[];
  driveFolderName: string;
  driveFolderLink?: string;
  isDriveConnected: boolean;
  onOpenScanModal: (taskId?: string) => void;
  onSelectCategory: (catName: string) => void;
  onOpenTaskDetail: (task: TaskItem) => void;
}

export const TaskOverviewDashboard: React.FC<TaskOverviewDashboardProps> = ({
  tasks,
  categories,
  driveFolderName,
  driveFolderLink,
  isDriveConnected,
  onOpenScanModal,
  onSelectCategory,
  onOpenTaskDetail
}) => {
  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'review').length;
  const notStartedTasks = tasks.filter(t => t.status === 'not_started').length;
  const overallProgress = totalTasks > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
    : 0;
  const totalDocuments = tasks.reduce((sum, t) => sum + (t.documents?.length || 0), 0);

  // Check overdue or upcoming within 7 days
  const now = new Date();
  const upcomingTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const due = new Date(t.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      {/* Top Welcome / PM Headline Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Hệ Thống Giám Sát &amp; Quản Trị
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Bảng Tiến Độ &amp; Hồ Sơ
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Theo dõi phân rã công việc (WBS), kiểm soát % hoàn thành và đồng bộ tự động lên Google Drive.
            </p>
          </div>

          {/* Drive status banner */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDriveConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/40' : 'bg-slate-800 text-slate-400'
            }`}>
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-200">
                  Folder Google Drive
                </span>
                {isDriveConnected && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                    Đã đồng bộ
                  </span>
                )}
              </div>
              {driveFolderLink ? (
                <a
                  href={driveFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate max-w-[160px]">{driveFolderName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 truncate block max-w-[160px]">
                  {driveFolderName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Tiến độ hoàn thành dự án tổng thể
            </span>
            <span className="font-bold text-emerald-400 text-base">
              {overallProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
            <span>Khởi đầu (0%)</span>
            <span>Mốc 50%</span>
            <span>Bàn giao (100%)</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng công việc</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100">
            {totalTasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">{completedTasks} xong</span>
            <span>•</span>
            <span className="text-blue-400 font-medium">{inProgressTasks} đang làm</span>
          </div>
        </div>

        {/* In Progress & Review */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Đang triển khai</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400">
            {inProgressTasks + reviewTasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span>{reviewTasks} chờ duyệt</span>
            <span>•</span>
            <span>{notStartedTasks} chưa làm</span>
          </div>
        </div>

        {/* Scanned Docs on Drive */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Hồ sơ scan</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
            {totalDocuments}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Lưu trữ trực tiếp trên Google Drive
          </div>
        </div>

        {/* Urgent / Approaching Deadlines */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Hạn chót 7 ngày</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400">
            {upcomingTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cần giám sát chặt tiến độ
          </div>
        </div>
      </div>

      {/* Main Breakdown: Progress by WBS Category & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Tiến Độ Theo Danh Mục (WBS)
              </h2>
              <p className="text-xs text-slate-400">
                Phân loại tài liệu scan theo từng giai đoạn
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {categories.map(cat => {
              const catTasks = tasks.filter(t => t.category === cat.name);
              const catCount = catTasks.length;
              const catCompleted = catTasks.filter(t => t.status === 'completed').length;
              const catProgress = catCount > 0
                ? Math.round(catTasks.reduce((s, t) => s + t.progress, 0) / catCount)
                : 0;
              const catDocsCount = catTasks.reduce((sum, t) => sum + (t.documents?.length || 0), 0);

              return (
                <div 
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.name)}
                  className="group p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {cat.code}
                      </span>
                      <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">
                        {catCompleted}/{catCount} xong
                      </span>
                      <span className="font-bold text-emerald-400">
                        {catProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${catProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="truncate max-w-[280px]">{cat.description}</span>
                    <span className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      {catDocsCount} tài liệu
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks & Quick Scan (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Quick Scan Action Box */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-600/30 rounded-2xl p-5 shadow-sm text-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Scan className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                  Scan Tài Liệu
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Chụp biên bản hiện trường, hợp đồng bằng camera và đẩy thẳng lên Google Drive.
                </p>
                <button
                  onClick={() => onOpenScanModal()}
                  className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Bắt đầu Scan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Công việc gần hạn chót
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {upcomingTasks.length} công việc
              </span>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Không có công việc nào nguy cơ trễ hạn trong 7 ngày
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {upcomingTasks.slice(0, 5).map(task => {
                  const due = new Date(task.dueDate);
                  const isOverdue = due.getTime() < now.getTime();
                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskDetail(task)}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2 cursor-pointer transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                            {task.code}
                          </span>
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                            Hạn: {task.dueDate}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 truncate max-w-[120px]">
                            {task.assignee}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-300 block">
                          {task.progress}%
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                          Chi tiết <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
