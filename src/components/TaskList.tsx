import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Scan, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Edit3,
  Trash2,
  FileText
} from 'lucide-react';
import { TaskItem, CategoryInfo, TaskStatus, TaskPriority } from '../types';

interface TaskListProps {
  tasks: TaskItem[];
  categories: CategoryInfo[];
  selectedCategoryFilter: string;
  onSelectCategoryFilter: (category: string) => void;
  onOpenScanModal: (taskId?: string) => void;
  onOpenNewTaskModal: () => void;
  onOpenEditTaskModal: (task: TaskItem) => void;
  onOpenTaskDetail: (task: TaskItem) => void;
  onUpdateTaskProgress: (taskId: string, newProgress: number) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  categories,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onOpenScanModal,
  onOpenNewTaskModal,
  onOpenEditTaskModal,
  onOpenTaskDetail,
  onUpdateTaskProgress,
  onUpdateTaskStatus,
  onDeleteTask
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedCategoryFilter !== 'all' && task.category !== selectedCategoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCode = task.code.toLowerCase().includes(q);
      const matchAssignee = task.assignee.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchAssignee && !matchDesc) return false;
    }
    return true;
  });

  const categoriesList = selectedCategoryFilter === 'all' 
    ? categories 
    : categories.filter(c => c.name === selectedCategoryFilter);

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Khẩn cấp</span>;
      case 'high':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full">Cao</span>;
      case 'medium':
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-medium px-2 py-0.5 rounded-full">Trung bình</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">Thấp</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
            <CheckCircle className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3" /> Đang triển khai
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3 h-3" /> Chờ duyệt nghiệm thu
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
            Tạm hoãn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
            Chưa làm
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã PM, tên công việc, nhân sự..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Category filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => onSelectCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả danh mục WBS</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.code} - {c.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="in_progress">Đang triển khai</option>
            <option value="review">Chờ nghiệm thu</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="not_started">Chưa bắt đầu</option>
            <option value="on_hold">Tạm hoãn</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Mức ưu tiên</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          {/* Add Task Button */}
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm việc mới</span>
          </button>
        </div>
      </div>

      {/* Main Task List grouped by Categories */}
      <div className="space-y-6">
        {categoriesList.map(cat => {
          const categoryTasks = filteredTasks.filter(t => t.category === cat.name);
          const isCollapsed = collapsedCategories[cat.name];
          const completedCount = categoryTasks.filter(t => t.status === 'completed').length;
          const totalCatCount = categoryTasks.length;
          const avgProgress = totalCatCount > 0 
            ? Math.round(categoryTasks.reduce((s, t) => s + t.progress, 0) / totalCatCount)
            : 0;

          if (selectedCategoryFilter !== 'all' && categoryTasks.length === 0) {
            return null;
          }

          return (
            <div 
              key={cat.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Category Header */}
              <div 
                onClick={() => toggleCategoryCollapse(cat.name)}
                className="px-5 py-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-950 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-slate-200 p-0.5">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        {cat.code}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100">
                        {cat.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                        ({completedCount}/{totalCatCount} hoàn tất)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 min-w-[32px] text-right">
                      {avgProgress}%
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenScanModal();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Scan tài liệu cho danh mục"
                  >
                    <Scan className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tasks under this category */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-800/60">
                  {categoryTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Chưa có công việc nào trong danh mục này phù hợp
                    </div>
                  ) : (
                    categoryTasks.map(task => {
                      return (
                        <div 
                          key={task.id}
                          className="p-4 sm:p-5 hover:bg-slate-850/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          {/* Task Info Column */}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                {task.code}
                              </span>
                              <h4 
                                onClick={() => onOpenTaskDetail(task)}
                                className="text-sm sm:text-base font-semibold text-slate-100 hover:text-emerald-400 cursor-pointer transition-colors"
                              >
                                {task.title}
                              </h4>
                              {getPriorityBadge(task.priority)}
                              {getStatusBadge(task.status)}
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                              {task.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                              <span>Phụ trách: <strong className="text-slate-300">{task.assignee}</strong></span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                Hạn: <strong className="text-slate-300">{task.dueDate}</strong>
                              </span>
                              {task.budget && (
                                <>
                                  <span>•</span>
                                  <span>Ngân sách: <strong className="text-slate-300">{task.budget}</strong></span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Progress & Document Attachments Column */}
                          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 flex-shrink-0">
                            {/* Interactive Progress Slider */}
                            <div className="w-full sm:w-48 space-y-1">
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
                              <div className="flex justify-between gap-1 pt-0.5">
                                {[0, 25, 50, 75, 100].map(pct => (
                                  <button
                                    key={pct}
                                    onClick={() => onUpdateTaskProgress(task.id, pct)}
                                    className={`text-[9px] px-1 py-0.2 rounded font-semibold transition-all cursor-pointer ${
                                      task.progress === pct
                                        ? 'bg-emerald-500 text-slate-950 font-bold'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Scanned Docs Tag / Button */}
                            <div className="flex items-center gap-2">
                              {task.documents && task.documents.length > 0 ? (
                                <button
                                  onClick={() => onOpenTaskDetail(task)}
                                  className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                                  title="Xem danh sách tài liệu scan Google Drive"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{task.documents.length} tài liệu Drive</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onOpenScanModal(task.id)}
                                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                                  title="Chụp & scan tài liệu cho công việc"
                                >
                                  <Scan className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Scan tài liệu</span>
                                </button>
                              )}

                              {/* More action menu */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onOpenEditTaskModal(task)}
                                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Chỉnh sửa công việc"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteTask(task.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa công việc"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
