import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderGit2, Sparkles, Check } from 'lucide-react';
import { Project, ItemType, getProjectItemTypes } from '../types';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (projectData: Partial<Project>) => void;
  existingProject?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  existingProject
}) => {
  // 1. Tên hạng mục/ gói thầu: bắt buộc
  const [name, setName] = useState('');

  // 1.1 Loại mục: Dự án / Gói thầu / Hạng mục (có thể chọn 1, 2, hoặc 3 mục)
  const [itemTypes, setItemTypes] = useState<ItemType[]>(['project']);

  const handleToggleItemType = (type: ItemType) => {
    setItemTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length <= 1) return prev;
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // 2. Thời gian: (Năm & Tháng)
  const currentYearStr = new Date().getFullYear().toString();
  const [year, setYear] = useState(currentYearStr);
  const [month, setMonth] = useState('01');
  const [customTime, setCustomTime] = useState('');

  // 3. Phòng/ ban quản lý:
  const [manager, setManager] = useState('');

  // 4. Mã dự án (nếu phát sinh)
  const [code, setCode] = useState('');

  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || '');
      setCode(existingProject.code || '');
      setManager(existingProject.manager || '');
      const pYear = existingProject.startYear || (existingProject.startDate ? existingProject.startDate.slice(0, 4) : currentYearStr);
      const pMonth = existingProject.startMonth || (existingProject.startDate ? existingProject.startDate.slice(5, 7) : '01');
      setYear(pYear);
      setMonth(pMonth);
      setCustomTime(existingProject.startDate || '');
      setItemTypes(getProjectItemTypes(existingProject));
    } else {
      setName('');
      setCode(`DA-0${Math.floor(Math.random() * 90 + 10)}`);
      setManager('');
      setYear(currentYearStr);
      setMonth('01');
      setCustomTime('');
      setItemTypes(['project']);
    }
  }, [existingProject, isOpen, currentYearStr]);

  // Tính toán đường dẫn Drive: Năm (đã chọn ở trên)/ Tên dự án/
  // Ví dụ: 2026/11111111/
  const cleanYear = year.trim() || currentYearStr;
  const cleanName = name.trim();
  const driveFolderPath = useMemo(() => {
    const projSegment = cleanName ? cleanName.replace(/[/\\?%*:|"<>]/g, '_') : 'Ten_du_an';
    return `${cleanYear}/${projSegment}/`;
  }, [cleanYear, cleanName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName) {
      alert('Vui lòng nhập tên hạng mục/ gói thầu');
      return;
    }

    const finalDrivePath = `${cleanYear}/${cleanName.replace(/[/\\?%*:|"<>]/g, '_')}/`;
    const startDateStr = `${cleanYear}-${month.padStart(2, '0')}-01`;
    const targetDateStr = `${cleanYear}-12-31`;

    onSaveProject({
      code: code.trim() || `DA-0${Math.floor(Math.random() * 90 + 10)}`,
      name: cleanName,
      manager: manager.trim() || 'Ban QLDA',
      startYear: cleanYear,
      startMonth: month,
      startDate: startDateStr,
      targetDate: targetDateStr,
      driveFolderPath: finalDrivePath,
      status: existingProject?.status || 'in_progress',
      itemType: itemTypes[0] || 'project',
      itemTypes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-slate-900 border-2 border-slate-400/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {existingProject ? 'Chỉnh sửa dự án' : 'Thêm dự án'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {/* 1. Tên hạng mục/ gói thầu: bắt buộc */}
          <div className="space-y-1.5">
            <label className="block text-sm sm:text-base font-semibold text-slate-900">
              Tên hạng mục/ gói thầu: <span className="text-rose-600 font-medium text-xs sm:text-sm">bắt buộc</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: 11111111 hoặc Thi công Xây dựng Khối nhà A..."
              autoFocus
              required
              className="w-full bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Phân loại mục Chi tiết: Dự án / Gói thầu / Hạng mục */}
          <div className="space-y-1.5">
            <label className="block text-sm sm:text-base font-semibold text-slate-900">
              Phân loại mục Chi tiết: <span className="text-xs text-slate-500 font-normal italic">(chọn 1 mục, 2 mục hoặc cả 3 mục)</span>
            </label>
            <div className="inline-flex flex-wrap items-center bg-slate-100 border-2 border-slate-300 rounded-xl p-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleToggleItemType('project')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  itemTypes.includes('project')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {itemTypes.includes('project') && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>Dự án</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleItemType('package')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  itemTypes.includes('package')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {itemTypes.includes('package') && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>Gói thầu</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleItemType('item')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  itemTypes.includes('item')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {itemTypes.includes('item') && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>Hạng mục</span>
              </button>
            </div>
          </div>

          {/* 2. Thời gian: */}
          <div className="space-y-1.5">
            <label className="block text-sm sm:text-base font-semibold text-slate-900">
              Thời gian:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Chọn Năm (Quy định tên thư mục Drive) */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Năm (tạo thư mục Drive):
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="2024">Năm 2024</option>
                  <option value="2025">Năm 2025</option>
                  <option value="2026">Năm 2026</option>
                  <option value="2027">Năm 2027</option>
                  <option value="2028">Năm 2028</option>
                  <option value="2029">Năm 2029</option>
                  <option value="2030">Năm 2030</option>
                </select>
              </div>

              {/* Chọn Tháng */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tháng bắt đầu
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    return <option key={m} value={m}>Tháng {m}</option>;
                  })}
                </select>
              </div>

              {/* Hoặc nhập năm khác */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hoặc nhập năm khác
                </label>
                <input
                  type="text"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    const match = e.target.value.match(/\b(20\d{2})\b/);
                    if (match) {
                      setYear(match[1]);
                    }
                  }}
                  placeholder="VD: 2026..."
                  maxLength={10}
                  className="w-full bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Phòng/ ban quản lý: */}
          <div className="space-y-1.5">
            <label className="block text-sm sm:text-base font-semibold text-slate-900">
              Phòng/ ban quản lý:
            </label>
            <input
              type="text"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="VD: Ban QLDA 1, Phòng Kỹ thuật, KS. Nguyễn Văn A..."
              className="w-full bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* 4. Tên Drive: Năm (đã chọn ở trên)/ Tên dự án/ */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-sm sm:text-base font-semibold text-slate-900">
              Tên Drive: Năm (đã chọn ở trên)/ Tên dự án/
            </label>
            
            {/* Box displaying the calculated Drive path */}
            <div className="bg-slate-100 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-blue-900 min-w-0">
                <FolderGit2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span className="truncate select-all">{driveFolderPath}</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-300 flex-shrink-0">
                Tự động
              </span>
            </div>

            {/* Subfolder structure preview */}
            <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3 text-xs text-amber-950 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quy tắc lưu trữ tài liệu tự động vào Google Drive:</span>
              </div>
              <p className="pl-2">
                • <strong>Mục Chi tiết:</strong> lưu tại <code className="bg-white/80 px-1.5 py-0.5 rounded border border-amber-300 font-mono text-blue-900">{cleanYear}/{cleanName || '11111111'}/Chi tiết/[tệp.pdf]</code>
              </p>
              <p className="pl-2">
                • <strong>Mục Tài liệu kèm theo:</strong> lưu tại <code className="bg-white/80 px-1.5 py-0.5 rounded border border-amber-300 font-mono text-blue-900">{cleanYear}/{cleanName || '11111111'}/Tài liệu kèm theo/[tệp.pdf]</code>
              </p>
            </div>
          </div>

          {/* Action Buttons: HỦY and LƯU with matching style */}
          <div className="pt-6 pb-2 flex items-center justify-center gap-6 sm:gap-10">
            {/* Button HỦY: Dark Teal Background with Dark Border */}
            <button
              type="button"
              id="btn-cancel-project"
              onClick={onClose}
              className="w-36 sm:w-44 py-3 rounded-md bg-[#135270] hover:bg-[#0f445e] active:bg-[#0b354a] text-white font-bold text-base sm:text-lg tracking-wide border-2 border-slate-900 shadow-md transition-all active:scale-95 cursor-pointer text-center select-none"
            >
              HỦY
            </button>
            {/* Button LƯU: Orange Background with Dark Border */}
            <button
              type="submit"
              id="btn-save-project"
              className="w-36 sm:w-44 py-3 rounded-md bg-[#e26928] hover:bg-[#d25c1d] active:bg-[#bd4f15] text-white font-bold text-base sm:text-lg tracking-wide border-2 border-slate-900 shadow-md transition-all active:scale-95 cursor-pointer text-center select-none"
            >
              LƯU
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
