import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Save, 
  Printer, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Upload, 
  Scan, 
  Check, 
  Building2, 
  Link as LinkIcon, 
  FileText, 
  FolderSync, 
  FolderOpen,
  AlertCircle,
  ChevronDown,
  Search,
  Globe,
  X,
  Share2,
  Download,
  Copy,
  FileCode,
  ShieldCheck,
  FolderPlus,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Cloud,
  Loader2
} from 'lucide-react';
import { 
  Project, 
  ItemType,
  getProjectItemTypes,
  RelatedPackage, 
  ProjectDetailItem, 
  AttachedDocumentItem,
  AttachedDocSection,
  ProjectStatus 
} from '../types';
import { 
  ensureProjectHierarchicalFolder,
  uploadDocumentToDrive 
} from '../services/driveService';
import { 
  exportProjectToStandaloneHtml, 
  exportProjectToJson, 
  parseProjectFromJson 
} from '../utils/exportProjectHtml';

interface STTCellProps {
  stt: number;
  totalRows: number;
  onReorder: (newStt: number) => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

const STTCell: React.FC<STTCellProps> = ({
  stt,
  totalRows,
  onReorder,
  onDelete,
  canDelete = false
}) => {
  const [val, setVal] = useState<string>(String(stt));

  useEffect(() => {
    setVal(String(stt));
  }, [stt]);

  const commit = () => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num !== stt) {
      onReorder(num);
    } else {
      setVal(String(stt));
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 group/stt">
      <input
        type="number"
        min={1}
        max={Math.max(totalRows, 1)}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-10 h-7 text-center font-bold text-xs bg-slate-900/90 hover:bg-slate-800 focus:bg-slate-900 print:bg-transparent border border-slate-600 hover:border-amber-400 focus:border-amber-400 print:border-black rounded text-amber-300 print:text-black focus:outline-none focus:ring-1 focus:ring-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text transition-all shadow-xs"
        title="Nhập '1' lên đầu, '2' xếp thứ hai... Nhấn Enter hoặc bấm ra ngoài dòng sẽ tự sắp xếp"
      />
      {canDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/stt:opacity-100 transition-opacity print:hidden cursor-pointer p-0.5"
          title="Xóa dòng này"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

interface AutoResizingTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const AutoResizingTextarea: React.FC<AutoResizingTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 34
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.max(minHeight, scrollH)}px`;
  };

  useEffect(() => {
    adjustHeight();
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      placeholder={placeholder}
      rows={1}
      title={value || placeholder}
      className={`w-full text-slate-100 print:text-black text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-none overflow-hidden leading-relaxed break-words block transition-[height] duration-75 ${
        className ? className : 'bg-transparent border-0 px-2 py-1'
      }`}
    />
  );
};

export interface DuplicateWarning {
  isDuplicate: boolean;
  message: string;
  detail: string;
}

export const DuplicateWarningBadge: React.FC<{ warning: DuplicateWarning }> = ({ warning }) => {
  if (!warning.isDuplicate) return null;

  return (
    <div className="relative group/dup inline-flex items-center shrink-0">
      <span
        tabIndex={0}
        role="button"
        aria-label={warning.message || 'kiểm tra lại có trùng lặp'}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer shadow-sm shadow-rose-950 transition-all hover:scale-110 select-none animate-pulse shrink-0"
        title={`${warning.message}: ${warning.detail}`}
      >
        i
      </span>
      {/* Tooltip on hover/focus */}
      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/dup:flex group-focus/dup:flex flex-col items-end z-50 pointer-events-none min-w-[220px] max-w-xs shadow-2xl">
        <div className="bg-slate-950 text-rose-300 border border-rose-500 text-xs p-2.5 rounded-lg shadow-2xl font-semibold flex items-start gap-1.5 text-left">
          <span className="text-rose-400 font-bold text-sm leading-none shrink-0 mt-0.5">⚠️</span>
          <div>
            <div className="text-rose-400 font-bold text-xs">
              {warning.message}
            </div>
            {warning.detail && (
              <div className="text-[11px] text-slate-300 font-normal mt-1 leading-snug">
                {warning.detail}
              </div>
            )}
          </div>
        </div>
        <div className="w-2 h-2 bg-slate-950 border-r border-b border-rose-500 rotate-45 -mt-1 mr-1"></div>
      </div>
    </div>
  );
};

interface ProjectDetailSheetProps {
  project: Project;
  allProjects?: Project[];
  onSelectProject?: (projectId: string) => void;
  onSaveProject: (projectData: Partial<Project>) => void;
  onCreateProjectFromSection?: (newProject: Project, updatedCurrentProject: Project) => void;
  driveToken: string | null;
  driveRootFolderId: string | null;
  isDriveConnected: boolean;
  onGoogleSignIn: () => void;
  onOpenScanModal?: (targetInfo?: { type: 'detail' | 'attached'; id: string; sectionId?: string }) => void;
  onOpenBackupModal?: () => void;
}

export const ProjectDetailSheet: React.FC<ProjectDetailSheetProps> = ({
  project,
  allProjects = [],
  onSelectProject,
  onSaveProject,
  onCreateProjectFromSection,
  driveToken,
  driveRootFolderId,
  isDriveConnected,
  onGoogleSignIn,
  onOpenScanModal,
  onOpenBackupModal
}) => {
  const [itemTypes, setItemTypes] = useState<ItemType[]>(() => getProjectItemTypes(project));
  const itemType = itemTypes[0] || 'project';

  const handleToggleItemType = (type: ItemType) => {
    setItemTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length <= 1) {
          return prev; // Giữ lại ít nhất 1 mục đã chọn
        }
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const setItemType = (type: ItemType) => {
    handleToggleItemType(type);
  };
  const [code, setCode] = useState(project.code || 'DA-018');
  const [name, setName] = useState(project.name || '');
  const [driveFolderPath, setDriveFolderPath] = useState(
    project.driveFolderPath || `${project.startYear || '2026'}/${project.code || project.id}/`
  );
  const [driveFolderLink, setDriveFolderLink] = useState(project.driveFolderLink || '');
  const [showCustomDriveLink, setShowCustomDriveLink] = useState(false);

  const getResolvedDriveUrl = (): string => {
    const rawLink = (driveFolderLink || '').trim();
    if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) return rawLink;
    const rawPath = (driveFolderPath || '').trim();
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath;
    if (project.driveFolderId) return `https://drive.google.com/drive/folders/${project.driveFolderId}`;
    if (rawPath) {
      const parts = rawPath.split('/').map(p => p.trim()).filter(Boolean);
      const folderTarget = parts[parts.length - 1] || rawPath;
      return `https://drive.google.com/drive/search?q=${encodeURIComponent(folderTarget)}`;
    }
    if (name.trim()) return `https://drive.google.com/drive/search?q=${encodeURIComponent(name.trim())}`;
    return 'https://drive.google.com';
  };

  const [holdReason, setHoldReason] = useState(project.holdReason || '');
  const [detailStorageLocation, setDetailStorageLocation] = useState(
    project.detailStorageLocation || project.storageLocation || ''
  );
  const [manager, setManager] = useState(project.manager || '');
  const [startMonth, setStartMonth] = useState(project.startMonth || (project.startDate ? project.startDate.slice(5, 7) : '06'));
  const [startYear, setStartYear] = useState(project.startYear || (project.startDate ? project.startDate.slice(0, 4) : '2026'));
  const [parentProjectId, setParentProjectId] = useState(project.parentProjectId || '');
  const [parentProjectName, setParentProjectName] = useState(project.parentProject || '');

  const [relatedPackages, setRelatedPackages] = useState<RelatedPackage[]>(() => {
    if (project.relatedPackages && Array.isArray(project.relatedPackages)) return project.relatedPackages;
    return [];
  });

  const [projectKind, setProjectKind] = useState<'sub' | 'main'>(project.projectKind || 'main');
  const [nationalBidding, setNationalBidding] = useState<'yes' | 'no'>(project.nationalBidding || 'no');
  const [objectives, setObjectives] = useState(project.objectives || project.description || '');
  const [notes, setNotes] = useState(project.notes || '');

  const mapStatusToWireframe = (st: ProjectStatus): 'completed' | 'on_hold' | 'in_progress' => {
    if (st === 'completed') return 'completed';
    if (st === 'on_hold') return 'on_hold';
    return 'in_progress';
  };

  const [status, setStatus] = useState<'completed' | 'on_hold' | 'in_progress'>(mapStatusToWireframe(project.status));
  const [openLinkPickerId, setOpenLinkPickerId] = useState<string | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  const [detailTitle, setDetailTitle] = useState(project.detailTitle || 'Chi tiết');
  const [detailNote, setDetailNote] = useState(project.detailNote || '');

  const [detailItems, setDetailItems] = useState<ProjectDetailItem[]>(() => {
    let initialItems = project.detailItems && Array.isArray(project.detailItems) ? project.detailItems : [];
    if (project.parentProjectId && allProjects) {
      const parentProj = allProjects.find(p => p.id === project.parentProjectId);
      const matchingSec = parentProj?.attachedSections?.find(s => s.convertedToProjectId === project.id);
      if (matchingSec && matchingSec.items && matchingSec.items.length > 0) {
        initialItems = matchingSec.items.map((it, idx) => ({
          id: it.id || `det-${project.id}-${idx + 1}`,
          stt: it.stt || idx + 1,
          content: it.content || '',
          day: it.day || '',
          month: it.month || '',
          year: it.year || '',
          docNumber: it.docNumber || '',
          docText: it.docText || '',
          driveFileId: it.driveFileId,
          driveFileName: it.driveFileName,
          driveFileLink: it.driveFileLink,
          driveFilePath: it.driveFilePath,
          isStartDateSelected: idx === 0
        }));
      }
    }
    return initialItems;
  });

  const [attachedSections, setAttachedSections] = useState<AttachedDocSection[]>(() => {
    let sections: AttachedDocSection[] = [];
    if (project.attachedSections && Array.isArray(project.attachedSections) && project.attachedSections.length > 0) {
      sections = project.attachedSections;
    } else if (project.attachedDocuments && project.attachedDocuments.length > 0) {
      sections = [{
        id: 'sec-1',
        title: 'Tài liệu kèm theo',
        note: project.attachedDocsNote || '',
        storageLocation: project.storageLocation || '',
        items: project.attachedDocuments
      }];
    } else {
      sections = [{
        id: 'sec-1',
        title: 'Tài liệu kèm theo',
        note: project.attachedDocsNote || '',
        storageLocation: '',
        items: []
      }];
    }

    if (allProjects) {
      sections = sections.map(sec => {
        if (sec.convertedToProjectId) {
          const subProj = allProjects.find(p => p.id === sec.convertedToProjectId);
          if (subProj && subProj.detailItems) {
            return {
              ...sec,
              title: sec.title && sec.title !== 'Tài liệu kèm theo' ? sec.title : `Dự án con: [${subProj.code}] ${subProj.name}`,
              convertedToProjectName: subProj.name,
              convertedToProjectCode: subProj.code,
              note: subProj.detailNote !== undefined ? subProj.detailNote : sec.note,
              storageLocation: subProj.detailStorageLocation || subProj.storageLocation || sec.storageLocation,
              items: subProj.detailItems.map((it, idx) => ({
                id: it.id || `att-${sec.id}-${idx + 1}`,
                stt: it.stt || idx + 1,
                content: it.content || '',
                day: it.day || '',
                month: it.month || '',
                year: it.year || '',
                docNumber: it.docNumber || '',
                docText: it.docText || '',
                driveFileId: it.driveFileId,
                driveFileName: it.driveFileName,
                driveFileLink: it.driveFileLink,
                driveFilePath: it.driveFilePath
              }))
            };
          }
        }
        return sec;
      });
    }

    return sections;
  });

  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'detail' | 'attached'; id: string; sectionId?: string } | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chuyển phần tài liệu kèm theo thành dự án mới
  const [convertModalSection, setConvertModalSection] = useState<AttachedDocSection | null>(null);
  const [newProjectNameInput, setNewProjectNameInput] = useState('');
  const [newProjectCodeInput, setNewProjectCodeInput] = useState('');
  const [newProjectItemType, setNewProjectItemType] = useState<'project' | 'package' | 'item'>('package');
  const [newProjectManagerInput, setNewProjectManagerInput] = useState('');
  const [newProjectStartYearInput, setNewProjectStartYearInput] = useState('2026');
  const [newProjectStartMonthInput, setNewProjectStartMonthInput] = useState('06');
  const [convertSuccessPrompt, setConvertSuccessPrompt] = useState<{
    createdProject: Project;
    show: boolean;
  } | null>(null);

  // ===================== TỰ ĐỘNG LƯU (AUTO-SAVE) =====================
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('pm_auto_save_detail');
    return stored === null ? true : stored === 'true';
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const isInitializedRef = useRef<boolean>(false);
  const lastSavedJsonRef = useRef<string>('');
  const autoSaveTimeoutRef = useRef<any>(null);
  const currentProjectDataRef = useRef<Partial<Project>>({});

  useEffect(() => {
    localStorage.setItem('pm_auto_save_detail', String(isAutoSaveEnabled));
  }, [isAutoSaveEnabled]);

  const getCurrentProjectData = useCallback((): Partial<Project> => {
    const mm = (startMonth || '01').padStart(2, '0');
    const yyyy = startYear || '2026';
    const computedStartDate = `${yyyy}-${mm}-01`;
    return {
      id: project.id,
      code: code.trim() || project.code,
      itemType: itemTypes[0] || 'project',
      itemTypes,
      name: name.trim() || project.name,
      driveFolderPath: driveFolderPath.trim(),
      driveFolderLink: driveFolderLink.trim() || undefined,
      holdReason: status === 'on_hold' ? holdReason.trim() : (project.holdReason || ''),
      manager: manager.trim() || project.manager,
      startMonth,
      startYear,
      parentProjectId,
      parentProject: parentProjectName.trim(),
      projectKind,
      nationalBidding,
      relatedPackages,
      objectives,
      notes,
      detailTitle: detailTitle.trim() || 'Chi tiết',
      detailNote: detailNote.trim() || undefined,
      status,
      detailItems,
      detailStorageLocation: detailStorageLocation.trim() || undefined,
      storageLocation: detailStorageLocation.trim() || undefined,
      attachedSections,
      attachedDocuments: attachedSections[0]?.items || [],
      attachedDocsNote: attachedSections[0]?.note || '',
      startDate: computedStartDate
    };
  }, [
    project.id, project.code, project.name, project.holdReason, project.manager,
    code, itemType, itemTypes, name, driveFolderPath, driveFolderLink, holdReason, manager,
    startMonth, startYear, parentProjectId, parentProjectName, projectKind,
    nationalBidding, relatedPackages, objectives, notes, detailTitle, detailNote,
    status, detailItems, detailStorageLocation, attachedSections
  ]);

  // Giữ ref currentProjectData luôn mới nhất
  useEffect(() => {
    currentProjectDataRef.current = getCurrentProjectData();
  }, [getCurrentProjectData]);

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    isInitializedRef.current = false;
    setAutoSaveStatus('idle');

    setCode(project.code || 'DA-018');
    setItemTypes(getProjectItemTypes(project));
    setName(project.name || '');
    setDriveFolderPath(project.driveFolderPath || `${project.startYear || '2026'}/${project.code || project.id}/`);
    setDriveFolderLink(project.driveFolderLink || '');
    setHoldReason(project.holdReason || '');
    setManager(project.manager || '');
    setStartMonth(project.startMonth || (project.startDate ? project.startDate.slice(5, 7) : '06'));
    setStartYear(project.startYear || (project.startDate ? project.startDate.slice(0, 4) : '2026'));
    setParentProjectId(project.parentProjectId || '');
    setParentProjectName(project.parentProject || '');
    setProjectKind(project.projectKind || 'main');
    setNationalBidding(project.nationalBidding || 'no');
    setObjectives(project.objectives || project.description || '');
    setNotes(project.notes || '');
    setDetailTitle(project.detailTitle || 'Chi tiết');
    setDetailNote(project.detailNote || '');
    setStatus(mapStatusToWireframe(project.status));
    setDetailStorageLocation(project.detailStorageLocation || project.storageLocation || '');
    
    setRelatedPackages(project.relatedPackages || []);

    // 1. Đồng bộ Detail Items (nếu là Dự án con B):
    let loadedDetailItems = project.detailItems && Array.isArray(project.detailItems) ? project.detailItems : [];
    if (project.parentProjectId && allProjects) {
      const parentProj = allProjects.find(p => p.id === project.parentProjectId);
      const matchingSec = parentProj?.attachedSections?.find(s => s.convertedToProjectId === project.id);
      if (matchingSec && matchingSec.items && matchingSec.items.length > 0) {
        loadedDetailItems = matchingSec.items.map((it, idx) => ({
          id: it.id || `det-${project.id}-${idx + 1}`,
          stt: it.stt || idx + 1,
          content: it.content || '',
          day: it.day || '',
          month: it.month || '',
          year: it.year || '',
          docNumber: it.docNumber || '',
          docText: it.docText || '',
          driveFileId: it.driveFileId,
          driveFileName: it.driveFileName,
          driveFileLink: it.driveFileLink,
          driveFilePath: it.driveFilePath,
          isStartDateSelected: idx === 0
        }));
      }
    }
    setDetailItems(loadedDetailItems);

    // 2. Đồng bộ Attached Sections (nếu là Dự án cha A):
    let loadedSections: AttachedDocSection[] = [];
    if (project.attachedSections && project.attachedSections.length > 0) {
      loadedSections = project.attachedSections;
    } else if (project.attachedDocuments && project.attachedDocuments.length > 0) {
      loadedSections = [{
        id: 'sec-1',
        title: 'Tài liệu kèm theo',
        note: project.attachedDocsNote || '',
        storageLocation: project.storageLocation || '',
        items: project.attachedDocuments
      }];
    } else {
      loadedSections = [{
        id: 'sec-1',
        title: 'Tài liệu kèm theo',
        note: '',
        storageLocation: '',
        items: []
      }];
    }

    if (allProjects) {
      loadedSections = loadedSections.map(sec => {
        if (sec.convertedToProjectId) {
          const subProj = allProjects.find(p => p.id === sec.convertedToProjectId);
          if (subProj && subProj.detailItems) {
            return {
              ...sec,
              title: sec.title && sec.title !== 'Tài liệu kèm theo' ? sec.title : `Dự án con: [${subProj.code}] ${subProj.name}`,
              convertedToProjectName: subProj.name,
              convertedToProjectCode: subProj.code,
              note: subProj.detailNote !== undefined ? subProj.detailNote : sec.note,
              storageLocation: subProj.detailStorageLocation || subProj.storageLocation || sec.storageLocation,
              items: subProj.detailItems.map((it, idx) => ({
                id: it.id || `att-${sec.id}-${idx + 1}`,
                stt: it.stt || idx + 1,
                content: it.content || '',
                day: it.day || '',
                month: it.month || '',
                year: it.year || '',
                docNumber: it.docNumber || '',
                docText: it.docText || '',
                driveFileId: it.driveFileId,
                driveFileName: it.driveFileName,
                driveFileLink: it.driveFileLink,
                driveFilePath: it.driveFilePath
              }))
            };
          }
        }
        return sec;
      });
    }

    setAttachedSections(loadedSections);
  }, [project.id, allProjects]);

  // Bộ lắng nghe Tự động lưu với cơ chế Debounce
  useEffect(() => {
    const data = getCurrentProjectData();
    const json = JSON.stringify(data);

    // Lần render đầu tiên sau khi nạp / chuyển dự án
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastSavedJsonRef.current = json;
      return;
    }

    // Không có thay đổi so với bản đã lưu gần nhất
    if (json === lastSavedJsonRef.current) {
      return;
    }

    // Có thay đổi nhưng người dùng tắt tự động lưu
    if (!isAutoSaveEnabled) {
      setAutoSaveStatus('unsaved');
      return;
    }

    setAutoSaveStatus('unsaved');
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus('saving');
      onSaveProject(data);
      lastSavedJsonRef.current = json;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSavedTime(timeStr);
      setAutoSaveStatus('saved');
    }, 1000); // Tự động lưu sau 1 giây ngừng thao tác

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [getCurrentProjectData, isAutoSaveEnabled, onSaveProject]);

  // Đảm bảo lưu dữ liệu khi unmount hoặc trước khi đóng tab/chuyển trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentJson = JSON.stringify(currentProjectDataRef.current);
      if (lastSavedJsonRef.current && currentJson !== lastSavedJsonRef.current) {
        onSaveProject(currentProjectDataRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      const currentJson = JSON.stringify(currentProjectDataRef.current);
      if (lastSavedJsonRef.current && currentJson !== lastSavedJsonRef.current) {
        onSaveProject(currentProjectDataRef.current);
      }
    };
  }, [onSaveProject]);

  const handleSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    const data = getCurrentProjectData();
    onSaveProject(data);
    lastSavedJsonRef.current = JSON.stringify(data);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setLastSavedTime(timeStr);
    setAutoSaveStatus('saved');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const getCurrentFullProject = (): Project => {
    return {
      ...project,
      ...getCurrentProjectData()
    };
  };

  const handleExportHtml = () => {
    handleSave();
    exportProjectToStandaloneHtml(getCurrentFullProject());
  };

  const handleExportJson = () => {
    handleSave();
    exportProjectToJson(getCurrentFullProject());
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseProjectFromJson(file);
      if (imported.code) setCode(imported.code);
      if (imported.name) setName(imported.name);
      if (imported.manager) setManager(imported.manager);
      if (imported.detailItems) setDetailItems(imported.detailItems);
      if (imported.attachedSections) setAttachedSections(imported.attachedSections);
      onSaveProject(imported);
      alert(`Đã nạp thành công dự án: [${imported.code || 'DA'}] ${imported.name || ''}`);
      setIsExportModalOpen(false);
    } catch {
      alert('Không thể đọc file dữ liệu. Vui lòng kiểm tra lại định dạng JSON.');
    } finally {
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2500);
    });
  };

  const handleAddRelatedPackage = () => {
    const nextIdx = relatedPackages.length + 1;
    setRelatedPackages(prev => [...prev, { id: `pkg-${Date.now()}-${nextIdx}`, name: `gói thầu : ${nextIdx} `, link: '' }]);
  };

  const findMatchingProject = (linkedId?: string, text?: string): Project | undefined => {
    if (linkedId) {
      const found = allProjects?.find(p => p.id === linkedId);
      if (found) return found;
    }
    if (!text) return undefined;
    const cleanText = text.trim();
    if (!cleanText) return undefined;

    // 1. Tìm theo mã dự án trong ngoặc vuông [DA-xxx] hoặc chuỗi DA-xxx
    const codeInBrackets = cleanText.match(/\[([A-Za-z0-9_-]+)\]/);
    if (codeInBrackets && codeInBrackets[1]) {
      const targetCode = codeInBrackets[1].trim().toUpperCase();
      const foundByCode = allProjects?.find(p => p.code?.toUpperCase() === targetCode);
      if (foundByCode) return foundByCode;
    }

    const directCodeMatch = cleanText.match(/\b([A-Za-z]{2,}-\d{2,})\b/i);
    if (directCodeMatch && directCodeMatch[1]) {
      const targetCode = directCodeMatch[1].trim().toUpperCase();
      const foundByCode = allProjects?.find(p => p.code?.toUpperCase() === targetCode);
      if (foundByCode) return foundByCode;
    }

    // 2. Tìm theo tên dự án tương ứng
    const foundByName = allProjects?.find(p => {
      if (!p.name) return false;
      const pName = p.name.trim().toLowerCase();
      const tName = cleanText.toLowerCase();
      return (pName.length >= 3 && tName.includes(pName)) || (tName.length >= 4 && pName.includes(tName));
    });
    if (foundByName) return foundByName;

    return undefined;
  };

  const handleJumpToProject = (targetProjectId: string) => {
    if (!targetProjectId) return;
    handleSave();
    if (onSelectProject) {
      onSelectProject(targetProjectId);
    }
  };

  const handleUpdateRelatedPackage = (id: string, field: 'name' | 'link' | 'linkedProjectId', value: string) => {
    setRelatedPackages(prev => prev.map(p => {
      if (p.id === id) {
        if (field === 'linkedProjectId') {
          const selectedProj = allProjects.find(proj => proj.id === value);
          return {
            ...p,
            linkedProjectId: value,
            name: selectedProj ? `gói thầu : [${selectedProj.code}] ${selectedProj.name}` : p.name,
            link: selectedProj?.driveFolderLink || p.link
          };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleDeleteRelatedPackage = (id: string) => {
    setRelatedPackages(prev => prev.filter(p => p.id !== id));
  };

  const handleAddDetailItem = () => {
    const nextStt = detailItems.length + 1;
    setDetailItems(prev => [...prev, {
      id: `det-${Date.now()}-${nextStt}`,
      stt: nextStt,
      content: '',
      day: '',
      month: '',
      year: '',
      docNumber: '',
      docText: '/',
      isStartDateSelected: false
    }]);
  };

  const handleUpdateDetailItem = (id: string, field: keyof ProjectDetailItem, value: any) => {
    let finalValue = value;
    if (field === 'docText' && typeof value === 'string') {
      if (value.trim() !== '' && !value.startsWith('/')) {
        finalValue = '/' + value;
      }
    }
    setDetailItems(prev => prev.map(item => item.id === id ? { ...item, [field]: finalValue } : item));
  };

  const handleReorderDetailItem = (itemId: string, newStt: number) => {
    setDetailItems(prev => {
      const currentIndex = prev.findIndex(item => item.id === itemId);
      if (currentIndex === -1) return prev;
      const targetIndex = Math.max(0, Math.min(newStt - 1, prev.length - 1));
      if (targetIndex === currentIndex) return prev;
      const itemToMove = prev[currentIndex];
      const updated = [...prev];
      updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, itemToMove);
      return updated.map((it, idx) => ({ ...it, stt: idx + 1 }));
    });
  };

  const handleSelectStartTimeRow = (selectedId: string) => {
    setDetailItems(prev => prev.map(item => {
      const isSelected = item.id === selectedId;
      if (isSelected) {
        if (item.month) setStartMonth(item.month);
        if (item.year) setStartYear(item.year);
      }
      return { ...item, isStartDateSelected: isSelected };
    }));
  };

  const handleDeleteDetailItem = (id: string) => {
    setDetailItems(prev => prev.filter(item => item.id !== id).map((it, idx) => ({ ...it, stt: idx + 1 })));
  };

  const handleAddAttachedSection = () => {
    const nextSecNum = attachedSections.length + 1;
    setAttachedSections(prev => [...prev, {
      id: `sec-${Date.now()}-${nextSecNum}`,
      title: `Tài liệu kèm theo ${nextSecNum}`,
      note: '',
      storageLocation: '',
      items: [{ id: `att-${Date.now()}-1`, stt: 1, content: '', day: '', month: '', year: '', docNumber: '', docText: '/' }]
    }]);
  };

  const handleDeleteAttachedSection = (sectionId: string) => {
    if (attachedSections.length <= 1) {
      alert('Cần giữ ít nhất 1 phần tài liệu kèm theo.');
      return;
    }
    setAttachedSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleUpdateAttachedSectionTitle = (sectionId: string, newTitle: string) => {
    setAttachedSections(prev => prev.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
  };

  const handleUpdateAttachedSectionNote = (sectionId: string, newNote: string) => {
    setAttachedSections(prev => prev.map(s => s.id === sectionId ? { ...s, note: newNote } : s));
  };

  const handleUpdateAttachedSectionStorageLocation = (sectionId: string, newLocation: string) => {
    setAttachedSections(prev => prev.map(s => s.id === sectionId ? { ...s, storageLocation: newLocation } : s));
  };

  const handleAddAttachedDoc = (sectionId: string) => {
    setAttachedSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const nextStt = sec.items.length + 1;
      return {
        ...sec,
        items: [...sec.items, { id: `att-${Date.now()}-${nextStt}`, stt: nextStt, content: '', day: '', month: '', year: '', docNumber: '', docText: '/' }]
      };
    }));
  };

  const handleUpdateAttachedDoc = (sectionId: string, itemId: string, field: keyof AttachedDocumentItem, value: any) => {
    let finalValue = value;
    if (field === 'docText' && typeof value === 'string') {
      if (value.trim() !== '' && !value.startsWith('/')) {
        finalValue = '/' + value;
      }
    }
    setAttachedSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => item.id === itemId ? { ...item, [field]: finalValue } : item)
      };
    }));
  };

  const handleDeleteAttachedDoc = (sectionId: string, itemId: string) => {
    setAttachedSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.filter(item => item.id !== itemId).map((it, idx) => ({ ...it, stt: idx + 1 }))
      };
    }));
  };

  const handleReorderAttachedDoc = (sectionId: string, itemId: string, newStt: number) => {
    setAttachedSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const currentIndex = sec.items.findIndex(item => item.id === itemId);
      if (currentIndex === -1) return sec;
      const targetIndex = Math.max(0, Math.min(newStt - 1, sec.items.length - 1));
      if (targetIndex === currentIndex) return sec;
      const itemToMove = sec.items[currentIndex];
      const updatedItems = [...sec.items];
      updatedItems.splice(currentIndex, 1);
      updatedItems.splice(targetIndex, 0, itemToMove);
      return { ...sec, items: updatedItems.map((it, idx) => ({ ...it, stt: idx + 1 })) };
    }));
  };

  // Mở modal Chuyển thành dự án mới từ một phần tài liệu kèm theo
  const handleOpenConvertModal = (section: AttachedDocSection) => {
    setConvertModalSection(section);
    // Gợi ý tên dự án mới từ tên mục hoặc nội dung tài liệu
    const firstItemContent = section.items?.[0]?.content?.trim() || '';
    const suggestedName = section.title && section.title !== 'Tài liệu kèm theo'
      ? section.title
      : (firstItemContent ? `${firstItemContent}` : `Dự án mới - ${project.code}`);
    setNewProjectNameInput(suggestedName);

    // Tự sinh mã dự án mới
    const count = (allProjects || []).length + 1;
    const generatedCode = `DA-${String(count).padStart(3, '0')}`;
    setNewProjectCodeInput(generatedCode);
    setNewProjectItemType('package');
    setNewProjectManagerInput(manager || project.manager || 'Ban QLDA');

    // Gợi ý năm và tháng từ tài liệu
    const firstYear = section.items?.find(it => it.year)?.year || startYear || '2026';
    const firstMonth = section.items?.find(it => it.month)?.month || startMonth || '06';
    setNewProjectStartYearInput(firstYear);
    setNewProjectStartMonthInput(firstMonth);
  };

  // Xác nhận tạo dự án mới từ phần tài liệu kèm theo
  const handleConfirmConvertSectionToProject = () => {
    if (!convertModalSection) return;
    const trimmedName = newProjectNameInput.trim();
    if (!trimmedName) {
      alert('Vui lòng nhập tên cho dự án mới.');
      return;
    }

    const newProjId = `proj-${Date.now()}`;
    const newProjCode = newProjectCodeInput.trim() || `DA-${Date.now().toString().slice(-4)}`;
    const yyyy = newProjectStartYearInput || '2026';
    const mm = (newProjectStartMonthInput || '06').padStart(2, '0');
    const computedStartDate = `${yyyy}-${mm}-01`;

    // 1. Chuyển các dòng từ section.items thành detailItems của dự án mới (giữ nguyên tệp đính kèm Drive, ngày tháng, số văn bản)
    const convertedDetailItems: ProjectDetailItem[] = (convertModalSection.items || []).map((item, idx) => ({
      id: `det-${Date.now()}-${idx + 1}`,
      stt: item.stt || idx + 1,
      content: item.content || '',
      day: item.day || '',
      month: item.month || '',
      year: item.year || '',
      docNumber: item.docNumber || '',
      docText: item.docText || '',
      driveFileId: item.driveFileId,
      driveFileName: item.driveFileName,
      driveFileLink: item.driveFileLink,
      driveFilePath: item.driveFilePath,
      isStartDateSelected: idx === 0
    }));

    // 2. Tạo đối tượng dự án mới:
    // "Đồng thời tại dự án mới tạo cũng sẽ thiết lập Dự án thành phần liên kết với dự án chính"
    const newCreatedProject: Project = {
      id: newProjId,
      code: newProjCode,
      name: trimmedName,
      itemType: newProjectItemType,
      itemTypes: [newProjectItemType],
      manager: newProjectManagerInput.trim() || manager || project.manager,
      startMonth: mm,
      startYear: yyyy,
      startDate: computedStartDate,
      targetDate: `${parseInt(yyyy, 10) + 1}-12-31`,
      status: 'in_progress',
      budget: '0 đ',
      driveFolderPath: `${yyyy}/${newProjCode}/`,
      projectKind: 'sub', // Thiết lập là Dự án thành phần
      parentProjectId: project.id, // Liên kết với dự án chính
      parentProject: `[${code || project.code}] ${name || project.name}`,
      nationalBidding: 'no',
      detailTitle: 'Chi tiết',
      detailNote: convertModalSection.note || '',
      detailStorageLocation: convertModalSection.storageLocation || '',
      storageLocation: convertModalSection.storageLocation || '',
      detailItems: convertedDetailItems,
      attachedSections: [
        {
          id: `sec-${Date.now()}-1`,
          title: 'Tài liệu kèm theo',
          note: '',
          storageLocation: '',
          items: []
        }
      ],
      createdAt: new Date().toISOString()
    };

    // 3. Cập nhật dự án cũ:
    // "ở dự án cũ thì vẫn giữ nguyên các dữ liệu --> tuy nhiên tại nút 'Chuyển thành dự án mới' sẽ note lên đã tạo dự án mới.
    // Đồng thời tại mục 3: Dự án này là: dự án chính --> thì tự động đính kèm luôn dự án mới tạo."
    
    // Ghi nhận trên section là đã tạo dự án mới
    const updatedAttachedSections = attachedSections.map(s => {
      if (s.id === convertModalSection.id) {
        return {
          ...s,
          title: s.title && s.title !== 'Tài liệu kèm theo' ? s.title : `Dự án con: [${newCreatedProject.code}] ${newCreatedProject.name}`,
          convertedToProjectId: newCreatedProject.id,
          convertedToProjectName: newCreatedProject.name,
          convertedToProjectCode: newCreatedProject.code,
          convertedAt: new Date().toISOString()
        };
      }
      return s;
    });
    setAttachedSections(updatedAttachedSections);

    // Đặt mục 3 dự án này là: Dự án chính
    setProjectKind('main');

    // Tự động đính kèm luôn dự án mới tạo vào Mục 3.2 Dự án liên quan
    const newPackageItem: RelatedPackage = {
      id: `pkg-${Date.now()}`,
      name: `gói thầu / dự án : [${newCreatedProject.code}] ${newCreatedProject.name}`,
      link: newCreatedProject.driveFolderLink || '#',
      linkedProjectId: newCreatedProject.id
    };

    let updatedRelatedPackages = [...relatedPackages];
    if (!updatedRelatedPackages.some(pkg => pkg.linkedProjectId === newCreatedProject.id)) {
      updatedRelatedPackages.push(newPackageItem);
      setRelatedPackages(updatedRelatedPackages);
    }

    // Tạo bản snapshot dự án cũ hoàn chỉnh để lưu
    const fullOldProject = getCurrentFullProject();
    const updatedOldProject: Project = {
      ...fullOldProject,
      projectKind: 'main',
      relatedPackages: updatedRelatedPackages,
      attachedSections: updatedAttachedSections
    };

    // Lưu vào hệ thống
    if (onCreateProjectFromSection) {
      onCreateProjectFromSection(newCreatedProject, updatedOldProject);
    } else {
      onSaveProject(updatedOldProject);
    }

    setConvertModalSection(null);
    setConvertSuccessPrompt({
      createdProject: newCreatedProject,
      show: true
    });
  };

  const triggerUploadFor = (type: 'detail' | 'attached', id: string, sectionId?: string) => {
    setUploadTarget({ type, id, sectionId });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    const projectYear = project.startYear || startYear || (project.startDate ? project.startDate.slice(0, 4) : '2026');
    const projectName = project.name || name || 'Dự án';
    const targetSection = attachedSections.find(s => s.id === uploadTarget.sectionId) || attachedSections[0];
    const subFolderType = uploadTarget.type === 'detail' ? 'Chi tiết' : (targetSection?.title || 'Tài liệu kèm theo');
    
    let fullFilePath = `${projectYear}/${projectName}/${subFolderType}/${file.name}`;
    let driveFileId = `local-${Date.now()}`;
    let driveFileLink = '';

    if (isDriveConnected && driveToken && driveRootFolderId) {
      try {
        setIsUploading(true);
        setUploadStatusText(`Đang tải lên Google Drive: ${fullFilePath}...`);
        const { folder, pathString } = await ensureProjectHierarchicalFolder(
          driveToken,
          driveRootFolderId,
          projectYear,
          projectName,
          subFolderType
        );
        const uploadedDoc = await uploadDocumentToDrive(
          driveToken,
          file,
          file.name,
          file.type,
          folder.id
        );
        driveFileId = uploadedDoc.id;
        driveFileLink = uploadedDoc.webViewLink;
        fullFilePath = `${pathString}${file.name}`;
        setUploadStatusText(`Đã lưu thành công vào Google Drive: ${fullFilePath}`);
      } catch {
        alert(`Không thể tải lên Google Drive. Tệp được ghi nhận đường dẫn: ${fullFilePath}`);
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadStatusText('');
        }, 1500);
      }
    } else {
      setIsUploading(true);
      setUploadStatusText(`Đã ghi nhận đường dẫn Drive: ${fullFilePath}`);
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatusText('');
      }, 1200);
    }

    if (uploadTarget.type === 'detail') {
      handleUpdateDetailItem(uploadTarget.id, 'driveFileId', driveFileId);
      handleUpdateDetailItem(uploadTarget.id, 'driveFileName', file.name);
      handleUpdateDetailItem(uploadTarget.id, 'driveFileLink', driveFileLink);
      handleUpdateDetailItem(uploadTarget.id, 'driveFilePath', fullFilePath);
    } else {
      const sId = uploadTarget.sectionId || attachedSections[0]?.id;
      if (sId) {
        handleUpdateAttachedDoc(sId, uploadTarget.id, 'driveFileId', driveFileId);
        handleUpdateAttachedDoc(sId, uploadTarget.id, 'driveFileName', file.name);
        handleUpdateAttachedDoc(sId, uploadTarget.id, 'driveFileLink', driveFileLink);
        handleUpdateAttachedDoc(sId, uploadTarget.id, 'driveFilePath', fullFilePath);
      }
    }

    setUploadTarget(null);
  };

  const getStatusLabel = (st: 'completed' | 'on_hold' | 'in_progress') => {
    switch (st) {
      case 'completed': return 'Hoàn thành';
      case 'on_hold': return 'Dừng thực hiện';
      default: return 'Đang thực hiện';
    }
  };

  const eligibleParentProjects = allProjects.filter(p => p.id !== project.id);

  // ===================== LOGIC CẢNH BÁO TRÙNG LẶP TRONG DỰ ÁN =====================
  // 1. Điền ô Số và năm cùng số và năm trước đó -> có dấu (i) đỏ cảnh báo "kiểm tra lại có trùng lặp" trong dự án
  // 2. Nếu phần số không có thì kiểm tra ngày tháng năm -> nếu trùng thì cảnh báo
  interface UnifiedDocItem {
    id: string;
    sectionType: 'detail' | 'attached';
    sectionTitle: string;
    stt: number;
    day?: string;
    month?: string;
    year?: string;
    docNumber?: string;
    docText?: string;
    content?: string;
  }

  const allUnifiedItems = useMemo<UnifiedDocItem[]>(() => {
    const list: UnifiedDocItem[] = [];

    // 1. Bảng Chi tiết
    detailItems.forEach((it, idx) => {
      list.push({
        id: it.id,
        sectionType: 'detail',
        sectionTitle: detailTitle || 'Chi tiết',
        stt: it.stt || idx + 1,
        day: it.day,
        month: it.month,
        year: it.year,
        docNumber: it.docNumber,
        docText: it.docText,
        content: it.content
      });
    });

    // 2. Bảng Tài liệu kèm theo
    attachedSections.forEach((sec) => {
      sec.items.forEach((it, idx) => {
        list.push({
          id: it.id,
          sectionType: 'attached',
          sectionTitle: sec.title || 'Tài liệu kèm theo',
          stt: it.stt || idx + 1,
          day: it.day,
          month: it.month,
          year: it.year,
          docNumber: it.docNumber,
          docText: it.docText,
          content: it.content
        });
      });
    });

    return list;
  }, [detailItems, attachedSections, detailTitle]);

  const checkItemDuplicate = useCallback((item: { id: string; day?: string; month?: string; year?: string; docNumber?: string; docText?: string }): DuplicateWarning => {
    const num = item.docNumber?.trim() || '';
    const yr = item.year?.trim() || '';
    const dayStr = item.day?.trim() || '';
    const monthStr = item.month?.trim() || '';

    const normalizeYear = (y: string) => {
      if (!y) return '';
      const clean = y.trim();
      if (clean.length === 2) return `20${clean}`;
      return clean;
    };

    const normalizeText = (t?: string) => {
      if (!t) return '';
      let clean = t.trim().toLowerCase();
      clean = clean.replace(/\s+/g, '');
      if (clean === '/' || clean === '') return '';
      if (!clean.startsWith('/')) {
        clean = '/' + clean;
      }
      return clean;
    };

    const normYr = normalizeYear(yr);
    const normText = normalizeText(item.docText);
    const parsedDay = dayStr ? parseInt(dayStr, 10) : NaN;
    const parsedMonth = monthStr ? parseInt(monthStr, 10) : NaN;

    // RULE 1: Điền ô Số và Năm (+ Text ở Số văn bản) -> trùng khi cùng Số, Năm và Text trong dự án
    if (num && normYr) {
      const numLower = num.toLowerCase().trim();
      const isNumOnly = /^\d+$/.test(numLower);
      const parsedNum = isNumOnly ? parseInt(numLower, 10) : NaN;

      const duplicates = allUnifiedItems.filter(other => {
        if (other.id === item.id) return false;
        const otherNum = other.docNumber?.trim() || '';
        const otherYr = normalizeYear(other.year?.trim() || '');
        if (!otherNum || !otherYr) return false;

        // 1. So sánh năm
        if (otherYr !== normYr) return false;

        // 2. So sánh số: nếu cả 2 là số thì so sánh giá trị số (ví dụ: "05" trùng "5")
        const otherNumLower = otherNum.toLowerCase().trim();
        const numMatches = (isNumOnly && /^\d+$/.test(otherNumLower))
          ? parseInt(otherNumLower, 10) === parsedNum
          : otherNumLower === numLower;
        if (!numMatches) return false;

        // 3. So sánh Text (ở Số văn bản)
        const otherNormText = normalizeText(other.docText);
        if (normText !== otherNormText) return false;

        return true;
      });

      if (duplicates.length > 0) {
        const locations = duplicates.map(d => `${d.sectionTitle} (STT ${d.stt})`).join(', ');
        const fullDocName = item.docText && item.docText.trim() !== '/'
          ? `${num}${item.docText.trim().startsWith('/') ? item.docText.trim() : '/' + item.docText.trim()}`
          : `Số ${num}`;
        return {
          isDuplicate: true,
          message: 'kiểm tra lại có trùng lặp',
          detail: `Trùng Số văn bản "${fullDocName}" và Năm "${normYr}" với: ${locations}`
        };
      }
    }

    // RULE 2: Phần Số không có (hoặc để trống) -> kiểm tra ngày tháng năm
    if (!num && !isNaN(parsedDay) && !isNaN(parsedMonth) && normYr && normYr.length >= 4) {
      const duplicates = allUnifiedItems.filter(other => {
        if (other.id === item.id) return false;
        const otherDay = other.day?.trim() ? parseInt(other.day.trim(), 10) : NaN;
        const otherMonth = other.month?.trim() ? parseInt(other.month.trim(), 10) : NaN;
        const otherYr = normalizeYear(other.year?.trim() || '');

        // Trùng Ngày, Tháng, Năm
        if (otherDay === parsedDay && otherMonth === parsedMonth && otherYr === normYr) {
          return true;
        }
        return false;
      });

      if (duplicates.length > 0) {
        const locations = duplicates.map(d => `${d.sectionTitle} (STT ${d.stt}${d.docNumber ? ` - Số ${d.docNumber}` : ''})`).join(', ');
        const dateFormatted = `${String(parsedDay).padStart(2, '0')}/${String(parsedMonth).padStart(2, '0')}/${normYr}`;
        return {
          isDuplicate: true,
          message: 'kiểm tra lại có trùng lặp',
          detail: `Trùng ngày tháng năm (${dateFormatted}) với: ${locations}`
        };
      }
    }

    return { isDuplicate: false, message: '', detail: '' };
  }, [allUnifiedItems]);

  const totalDuplicatesCount = useMemo(() => {
    return allUnifiedItems.filter(it => checkItemDuplicate(it).isDuplicate).length;
  }, [allUnifiedItems, checkItemDuplicate]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Action Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {project.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Biểu Mẫu Chi Tiết Hồ Sơ
              </span>
              {isDriveConnected ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                  <FolderSync className="w-2.5 h-2.5" /> Drive sẵn sàng
                </span>
              ) : (
                <button
                  onClick={onGoogleSignIn}
                  className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800 hover:bg-amber-900/80 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                >
                  <AlertCircle className="w-2.5 h-2.5" /> Chưa kết nối Drive
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Định dạng chuẩn biểu mẫu quản lý gói thầu, tiến độ văn bản &amp; tài liệu Drive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allProjects.length > 1 && onSelectProject && (
            <select
              value={project.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {allProjects.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="In hoặc xuất PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In biểu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Xuất file / Gửi xem</span>
          </button>

          {/* Tự động lưu & Trạng thái */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-2.5 py-1 text-xs transition-colors">
            <button
              type="button"
              onClick={() => setIsAutoSaveEnabled(prev => !prev)}
              className={`flex items-center gap-1.5 font-medium cursor-pointer transition-colors ${
                isAutoSaveEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-400 hover:text-slate-300'
              }`}
              title={isAutoSaveEnabled ? 'Đang bật tự động lưu (Nhấn để tắt)' : 'Đang tắt tự động lưu (Nhấn để bật)'}
            >
              <Cloud className={`w-3.5 h-3.5 ${isAutoSaveEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Tự động lưu:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isAutoSaveEnabled 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/70' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isAutoSaveEnabled ? 'Bật' : 'Tắt'}
              </span>
            </button>

            {isAutoSaveEnabled && (
              <div className="flex items-center pl-1.5 border-l border-slate-700/80 text-[11px]">
                {autoSaveStatus === 'saving' ? (
                  <span className="flex items-center gap-1 text-amber-300 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                    <span className="hidden md:inline">Đang lưu...</span>
                  </span>
                ) : autoSaveStatus === 'unsaved' ? (
                  <span className="flex items-center gap-1 text-amber-200/90 font-medium" title="Có thay đổi mới, chuẩn bị tự động lưu...">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="hidden md:inline">Đang gõ...</span>
                  </span>
                ) : autoSaveStatus === 'saved' ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium" title={`Lần lưu gần nhất: ${lastSavedTime || 'vừa xong'}`}>
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="hidden md:inline">{lastSavedTime ? `Đã lưu ${lastSavedTime}` : 'Đã lưu'}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 hidden md:inline">Sẵn sàng</span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            title="Nhấn để lưu thủ công ngay lập tức"
          >
            {isSavedNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Đã lưu!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thông tin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="bg-emerald-950/90 border-b border-emerald-700 px-4 py-2 text-xs text-emerald-300 flex items-center justify-center gap-2 animate-pulse">
          <Upload className="w-3.5 h-3.5 animate-bounce" />
          <span>{uploadStatusText}</span>
        </div>
      )}

      {/* MAIN DOCUMENT SHEET */}
      <div className="p-6 sm:p-8 lg:p-10 space-y-6 text-slate-100 print:text-black print:p-2 font-sans">
        {/* HEADER: Chi tiết Dự án / Gói thầu / Hạng mục : */}
        <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-slate-800 print:border-black">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-100 print:text-black">
            Chi tiết
          </span>

          <div className="inline-flex items-center bg-slate-950/90 print:bg-white border border-slate-700/80 print:border-black rounded-lg p-0.5 text-xs sm:text-sm font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => handleToggleItemType('project')}
              title="Nhấp để chọn / bỏ chọn Dự án (có thể chọn 1, 2 hoặc cả 3 mục)"
              className={`px-3 sm:px-3.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                itemTypes.includes('project')
                  ? 'bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400 print:bg-transparent print:ring-0 print:font-black print:text-black print:underline'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 print:text-slate-400'
              }`}
            >
              {itemTypes.includes('project') && (
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5] print:hidden" />
              )}
              <span>Dự án</span>
            </button>
            <span className="text-slate-600 print:text-slate-400 px-0.5 select-none font-normal">/</span>
            <button
              type="button"
              onClick={() => handleToggleItemType('package')}
              title="Nhấp để chọn / bỏ chọn Gói thầu (có thể chọn 1, 2 hoặc cả 3 mục)"
              className={`px-3 sm:px-3.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                itemTypes.includes('package')
                  ? 'bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400 print:bg-transparent print:ring-0 print:font-black print:text-black print:underline'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 print:text-slate-400'
              }`}
            >
              {itemTypes.includes('package') && (
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5] print:hidden" />
              )}
              <span>Gói thầu</span>
            </button>
            <span className="text-slate-600 print:text-slate-400 px-0.5 select-none font-normal">/</span>
            <button
              type="button"
              onClick={() => handleToggleItemType('item')}
              title="Nhấp để chọn / bỏ chọn Hạng mục (có thể chọn 1, 2 hoặc cả 3 mục)"
              className={`px-3 sm:px-3.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                itemTypes.includes('item')
                  ? 'bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400 print:bg-transparent print:ring-0 print:font-black print:text-black print:underline'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 print:text-slate-400'
              }`}
            >
              {itemTypes.includes('item') && (
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5] print:hidden" />
              )}
              <span>Hạng mục</span>
            </button>
          </div>

          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-100 print:text-black">
            :
          </span>

          <span className="text-xs text-slate-400 print:hidden hidden sm:inline-block italic">
            (Có thể chọn 1, 2 hoặc cả 3 mục)
          </span>
        </div>

        {/* SECTION I & NUMBERED ITEMS 1 -> 8 */}
        <div className="space-y-4 pt-1">
          {/* Mã dự án */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-base sm:text-lg font-bold text-slate-200 print:text-black min-w-[140px] flex items-center gap-1.5">
              <span>Mã</span>
              <span className="text-xs font-normal text-amber-400 print:text-black">(ví dụ: DA-018)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DA-018"
                className="w-48 bg-slate-950 print:bg-transparent border border-amber-500/80 print:border-black rounded-lg px-3.5 py-1.5 font-mono text-sm sm:text-base font-bold text-amber-300 print:text-black focus:outline-none focus:border-amber-400 uppercase tracking-wider"
              />
              <span className="text-xs text-slate-400 italic">
                (Mã hiển thị ở bảng công việc và danh sách)
              </span>
            </div>
          </div>

          {/* I : Tên (bắt buộc) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-base sm:text-lg font-bold text-slate-200 print:text-black min-w-[140px] flex items-center gap-1.5">
              <span>I : Tên</span>
              <span className="text-xs font-normal text-rose-400 print:text-black">(bắt buộc)</span>
            </label>
            <div className="flex-1">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên dự án / gói thầu / hạng mục..."
                className="w-full bg-slate-950 print:bg-transparent border border-slate-700 print:border-black rounded-lg px-3.5 py-2 text-sm sm:text-base font-semibold text-slate-100 print:text-black focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Đường dẫn Google Drive */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[140px] flex items-center gap-1.5 sm:pt-1.5">
              <FolderSync className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Lưu Drive:</span>
            </label>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={driveFolderPath}
                  onChange={(e) => setDriveFolderPath(e.target.value)}
                  placeholder="2026/11111111/"
                  className="w-full sm:w-80 bg-slate-950 print:bg-transparent border border-emerald-700/80 print:border-black rounded-lg px-3.5 py-1.5 font-mono text-xs sm:text-sm font-semibold text-emerald-300 print:text-black focus:outline-none focus:border-emerald-400 shadow-inner"
                />
                <a
                  href={getResolvedDriveUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <FolderOpen className="w-4 h-4 text-emerald-100" />
                  <span>Đến Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowCustomDriveLink(!showCustomDriveLink)}
                  className="text-xs text-slate-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer py-1"
                >
                  {showCustomDriveLink ? 'Ẩn URL' : 'Tùy chỉnh link URL'}
                </button>
              </div>

              {showCustomDriveLink && (
                <div className="flex items-center gap-2 max-w-xl pt-1">
                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">URL Drive trực tiếp:</span>
                  <input
                    type="url"
                    value={driveFolderLink}
                    onChange={(e) => setDriveFolderLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 bg-slate-950 border border-emerald-800 rounded-lg px-2.5 py-1 text-xs text-emerald-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 1. Quản lý chính */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[160px]">
              1. Quản lý chính:
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="Họ tên người quản lý / Ban QLDA..."
                className="w-full bg-slate-950 print:bg-transparent border border-slate-700 print:border-black rounded-lg px-3.5 py-1.5 text-sm text-slate-100 print:text-black focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 2. Thời gian bắt đầu: [Tháng] [Năm] */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[160px]">
              2. Thời gian bắt đầu:
            </label>
            <div className="inline-flex items-center gap-1 bg-slate-950 print:bg-transparent border border-slate-700 print:border-black rounded-lg px-2.5 py-1">
              <span className="text-xs text-slate-400 font-medium print:text-black">Tháng</span>
              <input
                type="text"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                maxLength={2}
                placeholder="06"
                className="w-10 text-center bg-transparent border-0 font-mono font-bold text-sm text-slate-100 print:text-black focus:outline-none"
              />
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-950 print:bg-transparent border border-slate-700 print:border-black rounded-lg px-2.5 py-1">
              <span className="text-xs text-slate-400 font-medium print:text-black">Năm</span>
              <input
                type="text"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                maxLength={4}
                placeholder="2026"
                className="w-14 text-center bg-transparent border-0 font-mono font-bold text-sm text-slate-100 print:text-black focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Dự án này là: [Dự án thành phần / Dự án chính] */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[160px]">
              3. Dự án này là:
            </label>
            <div className="inline-flex items-center bg-[#0e3b52] border-2 border-[#196b94] rounded-xl p-1.5 shadow-md">
              <button
                type="button"
                id="btn-project-kind-sub"
                onClick={() => setProjectKind('sub')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  projectKind === 'sub'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Dự án thành phần
              </button>
              <span className="text-cyan-300 font-bold px-2 select-none">/</span>
              <button
                type="button"
                id="btn-project-kind-main"
                onClick={() => setProjectKind('main')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  projectKind === 'main'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Dự án chính
              </button>
            </div>
          </div>

          {/* 3.1. Dự án thành phần thuộc vào (nếu là sub) */}
          {projectKind === 'sub' && (() => {
            const matchedParent = findMatchingProject(parentProjectId, parentProjectName);
            return (
              <div className="space-y-2 pt-1 border-l-2 border-emerald-500/50 pl-3 sm:pl-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[240px]">
                    3.1. Dự án thành phần thuộc vào:
                  </label>
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenLinkPickerId(openLinkPickerId === 'item3' ? null : 'item3');
                        setLinkSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold bg-slate-900 text-slate-300 border-slate-700 hover:border-blue-500 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>[ Liên kết ]</span>
                      <ChevronDown className={`w-3 h-3 ${openLinkPickerId === 'item3' ? 'rotate-180' : ''}`} />
                    </button>

                    {matchedParent ? (
                      <div className="inline-flex items-center gap-2 bg-slate-900 border border-emerald-500/70 hover:border-emerald-400 rounded-lg px-2.5 py-1 text-xs shadow-sm transition-all">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          {matchedParent.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleJumpToProject(matchedParent.id)}
                          className="font-medium text-slate-100 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/40 cursor-pointer flex items-center gap-1 text-left"
                          title={`Nhảy luôn sang dự án [${matchedParent.code}] ${matchedParent.name}`}
                        >
                          <span>{matchedParent.name || parentProjectName}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToProject(matchedParent.id)}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-2 py-0.5 rounded text-[11px] shadow cursor-pointer transition-all ml-1"
                          title={`Nhảy luôn sang dự án [${matchedParent.code}]`}
                        >
                          <span>Xem dự án</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setParentProjectId('');
                            setParentProjectName('');
                          }}
                          className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer ml-0.5"
                          title="Hủy liên kết"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : parentProjectName ? (
                      <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                        <span>{parentProjectName}</span>
                        <button
                          type="button"
                          onClick={() => setParentProjectName('')}
                          className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        (Bấm [ Liên kết ] để chọn dự án chính)
                      </span>
                    )}
                  </div>
                </div>

                {openLinkPickerId === 'item3' && (
                  <div className="bg-slate-900 border border-blue-500/80 rounded-2xl p-4 shadow-2xl space-y-3 print:hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs sm:text-sm font-bold text-slate-100">
                        Chọn dự án chính liên kết
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenLinkPickerId(null)}
                        className="text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1.5">
                      {eligibleParentProjects.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setParentProjectId(p.id);
                            setParentProjectName(`[${p.code}] ${p.name}`);
                            setOpenLinkPickerId(null);
                          }}
                          className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-xs font-semibold">[{p.code}] {p.name}</span>
                          <span className="text-xs text-blue-400">Chọn</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3.2. Dự án liên quan (nếu là main) */}
          {projectKind === 'main' && (
            <div className="space-y-2 pt-1 border-l-2 border-blue-500/50 pl-3 sm:pl-4 transition-all">
              <div className="flex items-center justify-between">
                <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black">
                  3.2. Dự án liên quan:
                </label>
                <span className="text-xs text-slate-400 italic">
                  (Ấn &quot;Xem dự án ↗&quot; để nhảy ngay sang dự án đó)
                </span>
              </div>
              <div className="pl-3 sm:pl-6 space-y-3">
                {relatedPackages.map((pkg, idx) => {
                  const matchedProj = findMatchingProject(pkg.linkedProjectId, pkg.name);
                  const isPickerOpen = openLinkPickerId === `pkg-${pkg.id}`;

                  return (
                    <div key={pkg.id} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="text-slate-400 font-bold font-mono">+</span>

                        {/* Nút liên kết dự án */}
                        <button
                          type="button"
                          onClick={() => setOpenLinkPickerId(isPickerOpen ? null : `pkg-${pkg.id}`)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                            matchedProj
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/70'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-blue-500 hover:text-slate-200'
                          }`}
                          title="Chọn liên kết dự án từ danh sách"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>{matchedProj ? `[${matchedProj.code}]` : '[ Liên kết ]'}</span>
                          <ChevronDown className={`w-2.5 h-2.5 ${isPickerOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <div className="flex-1 min-w-[220px]">
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handleUpdateRelatedPackage(pkg.id, 'name', e.target.value)}
                            placeholder={`gói thầu : ${idx + 1} .....`}
                            className={`w-full bg-slate-950 print:bg-transparent border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 print:text-black focus:outline-none transition-colors ${
                              matchedProj
                                ? 'border-emerald-600/70 focus:border-emerald-400 font-medium'
                                : 'border-slate-700 focus:border-emerald-500'
                            }`}
                          />
                        </div>

                        {/* Nút NHẢY SANG DỰ ÁN */}
                        {matchedProj && (
                          <button
                            type="button"
                            onClick={() => handleJumpToProject(matchedProj.id)}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md cursor-pointer transition-all whitespace-nowrap"
                            title={`Nhảy luôn sang dự án [${matchedProj.code}] ${matchedProj.name}`}
                          >
                            <span>Xem dự án</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteRelatedPackage(pkg.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer print:hidden"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown danh sách dự án để liên kết */}
                      {isPickerOpen && (
                        <div className="bg-slate-900 border border-emerald-500/80 rounded-xl p-3 shadow-2xl space-y-2 ml-4 max-w-lg print:hidden z-20">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <span className="text-xs font-bold text-slate-200">
                              Chọn dự án để liên kết vào dòng này:
                            </span>
                            <button
                              type="button"
                              onClick={() => setOpenLinkPickerId(null)}
                              className="text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {allProjects.filter(p => p.id !== project.id).map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  handleUpdateRelatedPackage(pkg.id, 'linkedProjectId', p.id);
                                  setOpenLinkPickerId(null);
                                }}
                                className="p-2 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className="font-mono text-xs font-bold text-emerald-400">[{p.code}]</span>
                                  <span className="text-xs text-slate-200 truncate">{p.name}</span>
                                </div>
                                <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">Chọn</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {relatedPackages.length === 0 && (
                  <div className="text-xs text-slate-400 italic py-1 print:hidden">
                    Chưa có gói thầu / dự án liên quan. Bấm &quot;+ Thêm&quot; để thêm khi cần.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddRelatedPackage}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 px-3 py-1.5 rounded-lg cursor-pointer print:hidden transition-colors"
                  title="Thêm gói thầu / dự án liên quan"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Đấu thầu quốc gia không */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-2">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[280px]">
              4. Đấu thầu quốc gia không :
            </label>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNationalBidding('yes')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 border-2 ${
                  nationalBidding === 'yes'
                    ? 'bg-emerald-600 text-white border-white shadow-lg'
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                }`}
              >
                {nationalBidding === 'yes' && <Check className="w-4 h-4" />}
                <span>Có</span>
              </button>
              <button
                type="button"
                onClick={() => setNationalBidding('no')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 border-2 ${
                  nationalBidding === 'no'
                    ? 'bg-rose-600 text-white border-white shadow-lg'
                    : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                }`}
              >
                {nationalBidding === 'no' && <Check className="w-4 h-4" />}
                <span>Không</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Đính kèm web :</span>
              <a
                href="https://muasamcong.mpi.gov.vn/web/guest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600/80 text-sky-200 text-xs font-semibold"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono underline">https://muasamcong.mpi.gov.vn/web/guest</span>
                <ExternalLink className="w-3 h-3 text-sky-400" />
              </a>
            </div>
          </div>

          {/* 5. Mục tiêu */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-1">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[160px] pt-1">
              5. Mục tiêu:
            </label>
            <div className="flex-1">
              <textarea
                rows={2}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Nhập mục tiêu chính..."
                className="w-full bg-slate-950 print:bg-transparent border border-slate-700 print:border-black rounded-lg px-3.5 py-2 text-sm text-slate-100 print:text-black focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* 6. Note */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-1">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[160px] pt-1">
              6. Note :
            </label>
            <div className="flex-1">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú quan trọng..."
                className="w-full bg-slate-950 print:bg-transparent border border-slate-700 print:border-black rounded-lg px-3.5 py-2 text-sm text-slate-100 print:text-black focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* 7. Trạng thái */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <label className="text-sm sm:text-base font-semibold text-slate-200 print:text-black min-w-[160px]">
              7. Trạng thái:
            </label>
            <div className="inline-flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border ${
                status === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : status === 'on_hold'
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : 'bg-blue-950 text-blue-300 border-blue-700'
              }`}>
                {getStatusLabel(status)}
              </span>
            </div>
          </div>

          {status === 'on_hold' && (
            <div className="p-4 bg-rose-950/40 border-2 border-rose-600 rounded-xl space-y-2">
              <label className="text-xs sm:text-sm font-extrabold text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Lý do dừng thực hiện :</span>
              </label>
              <textarea
                rows={2}
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Nhập chi tiết lý do..."
                className="w-full bg-slate-950 border border-rose-600 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          )}
        </div>

        {/* SECTION: Chi tiết */}
        <div className="pt-6 space-y-3">
          {/* Thông báo đồng bộ 2 chiều với dự án chính nếu là dự án con */}
          {parentProjectId && (() => {
            const parentProj = allProjects?.find(p => p.id === parentProjectId);
            return (
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-emerald-950/70 border border-emerald-500/80 p-3 rounded-xl text-xs text-emerald-200 print:hidden shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-white">Đồng bộ 2 chiều với Dự án chính:</span>
                  <span className="bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded font-mono font-bold border border-emerald-700">
                    [{parentProj?.code || 'DA'}] {parentProj?.name || parentProjectName}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-300 italic">
                  (Mọi nội dung thêm / sửa / xóa tại bảng Chi tiết này tự động đồng bộ sang mục Dự án con trong [{parentProj?.code || 'DA'}])
                </div>
                {parentProj && onSelectProject && (
                  <button
                    type="button"
                    onClick={() => handleJumpToProject(parentProj.id)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow transition-all ml-auto"
                    title={`Chuyển sang xem Dự án chính [${parentProj.code}] ${parentProj.name}`}
                  >
                    <span>Về Dự án chính</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })()}

          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
              <input
                type="text"
                value={detailTitle}
                onChange={(e) => setDetailTitle(e.target.value)}
                className="text-base sm:text-lg font-bold text-slate-100 print:text-black bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none px-1 rounded transition-colors min-w-[120px]"
              />
              <span className="text-base sm:text-lg font-bold text-slate-400">:</span>
            </div>

            <div className="flex-1 lg:max-w-xl xl:max-w-2xl">
              <input
                type="text"
                value={detailNote}
                onChange={(e) => setDetailNote(e.target.value)}
                placeholder="Ghi chú nhanh / nội dung chi tiết..."
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="text-right text-xs font-semibold text-slate-200 print:text-black pr-1 flex flex-col items-end shrink-0">
              <span className="text-[11px] text-slate-400">Tích chọn</span>
              <span className="text-emerald-400 print:text-black font-bold text-xs">
                thời gian bắt đầu (chỉ chọn 1 cái)
              </span>
            </div>
          </div>

          {/* CẢNH BÁO TRÙNG LẶP NẾU CÓ */}
          {totalDuplicatesCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-950/50 border border-rose-600/80 rounded-xl text-xs text-rose-200 print:hidden animate-in fade-in duration-150 shadow-md">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white text-[11px] font-black shrink-0 shadow-sm animate-pulse">
                i
              </span>
              <div className="flex-1">
                <span className="font-bold text-rose-300">Cảnh báo trùng lặp: </span>
                <span>Phát hiện <strong className="text-white underline">{totalDuplicatesCount}</strong> dòng văn bản có thông tin trùng lặp trong dự án. Vui lòng kiểm tra lại các dòng có dấu </span>
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[10px] font-black mx-1">i</span>
                <span className="text-rose-400 font-semibold">đỏ</span>.
              </div>
            </div>
          )}

          {/* TABLE 1: Chi tiết */}
          <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-black bg-slate-950/60 print:bg-white">
            <table className="w-full text-left border-collapse border border-slate-700 print:border-black text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 print:bg-slate-100 border-b border-slate-700 print:border-black text-slate-200 print:text-black font-bold">
                  <th rowSpan={2} className="border border-slate-700 print:border-black px-2 py-2 w-14 text-center">
                    <div>STT</div>
                  </th>
                  <th rowSpan={2} className="border border-slate-700 print:border-black px-4 py-2 min-w-[280px] sm:min-w-[360px]">
                    Nội dung
                  </th>
                  <th colSpan={3} className="border border-slate-700 print:border-black px-3 py-1.5 text-center bg-slate-850">
                    Thời gian
                  </th>
                  <th colSpan={2} className="border border-slate-700 print:border-black px-3 py-1.5 text-center bg-slate-850">
                    Số văn bản
                  </th>
                  <th rowSpan={2} className="border border-slate-700 print:border-black px-3 py-2 min-w-[150px] text-center">
                    Lưu Driver
                  </th>
                  <th rowSpan={2} className="border border-slate-700 print:border-black px-3 py-2 w-16 text-center">
                    <div className="w-5 h-5 mx-auto rounded-xs bg-[#196b94] border border-[#3ca2d9]" />
                  </th>
                </tr>
                <tr className="bg-slate-900/90 print:bg-slate-50 border-b border-slate-700 print:border-black text-slate-300 print:text-black font-semibold text-[11px] text-center">
                  <th className="border border-slate-700 print:border-black px-2 py-1 w-14">Ngày</th>
                  <th className="border border-slate-700 print:border-black px-2 py-1 w-14">Tháng</th>
                  <th className="border border-slate-700 print:border-black px-2 py-1 w-16">Năm</th>
                  <th className="border border-slate-700 print:border-black px-2 py-1 w-20">Số</th>
                  <th className="border border-slate-700 print:border-black px-2 py-1 min-w-[110px]">Text</th>
                </tr>
              </thead>
              <tbody>
                {detailItems.map((item, idx) => {
                  const dupWarning = checkItemDuplicate(item);
                  return (
                  <tr 
                    key={item.id} 
                    className={`border-b border-slate-700/80 print:border-black ${
                      item.isStartDateSelected 
                        ? 'bg-[#0e3b52]/40' 
                        : dupWarning.isDuplicate 
                        ? 'bg-rose-950/20 hover:bg-rose-950/30' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="border border-slate-700 print:border-black px-1.5 py-2 text-center font-bold align-top">
                      <STTCell
                        stt={item.stt || idx + 1}
                        totalRows={detailItems.length}
                        onReorder={(newStt) => handleReorderDetailItem(item.id, newStt)}
                        onDelete={() => handleDeleteDetailItem(item.id)}
                        canDelete={detailItems.length > 1}
                      />
                    </td>
                    <td className="border border-slate-700 print:border-black p-1.5 align-top">
                      <AutoResizingTextarea
                        value={item.content}
                        onChange={(val) => handleUpdateDetailItem(item.id, 'content', val)}
                        placeholder="Nội dung công việc..."
                      />
                    </td>
                    <td className={`border border-slate-700 print:border-black p-1 align-top ${
                      dupWarning.isDuplicate ? 'bg-rose-950/25' : ''
                    }`}>
                      <input
                        type="text"
                        maxLength={2}
                        value={item.day || ''}
                        onChange={(e) => handleUpdateDetailItem(item.id, 'day', e.target.value)}
                        placeholder="--"
                        className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 print:text-black focus:outline-none ${
                          dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                        }`}
                      />
                    </td>
                    <td className={`border border-slate-700 print:border-black p-1 align-top ${
                      dupWarning.isDuplicate ? 'bg-rose-950/25' : ''
                    }`}>
                      <input
                        type="text"
                        maxLength={2}
                        value={item.month || ''}
                        onChange={(e) => handleUpdateDetailItem(item.id, 'month', e.target.value)}
                        placeholder="--"
                        className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 print:text-black focus:outline-none ${
                          dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                        }`}
                      />
                    </td>
                    <td className={`border border-slate-700 print:border-black p-1 align-top ${
                      dupWarning.isDuplicate ? 'bg-rose-950/25' : ''
                    }`}>
                      <input
                        type="text"
                        maxLength={4}
                        value={item.year || ''}
                        onChange={(e) => handleUpdateDetailItem(item.id, 'year', e.target.value)}
                        placeholder="----"
                        className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 print:text-black focus:outline-none ${
                          dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                        }`}
                      />
                    </td>
                    <td className={`border border-slate-700 print:border-black p-1 align-top relative ${
                      dupWarning.isDuplicate ? 'bg-rose-950/30' : ''
                    }`}>
                      <div className="flex items-center justify-between gap-1 w-full h-full min-h-[26px]">
                        <input
                          type="text"
                          value={item.docNumber || ''}
                          onChange={(e) => handleUpdateDetailItem(item.id, 'docNumber', e.target.value)}
                          placeholder={dupWarning.isDuplicate && !item.docNumber ? '(trống)' : ''}
                          className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 print:text-black focus:outline-none ${
                            dupWarning.isDuplicate ? 'text-rose-300 font-bold placeholder-rose-400/60' : ''
                          }`}
                        />
                        {dupWarning.isDuplicate && (
                          <div className="pr-1 shrink-0 print:hidden">
                            <DuplicateWarningBadge warning={dupWarning} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`border border-slate-700 print:border-black p-1 align-top ${
                      dupWarning.isDuplicate ? 'bg-rose-950/20' : ''
                    }`}>
                      <input
                        type="text"
                        placeholder="/"
                        value={item.docText !== undefined ? item.docText : '/'}
                        onFocus={() => {
                          if (!item.docText) {
                            handleUpdateDetailItem(item.id, 'docText', '/');
                          }
                        }}
                        onChange={(e) => handleUpdateDetailItem(item.id, 'docText', e.target.value)}
                        className={`w-full bg-transparent border-0 px-1.5 py-1 font-mono text-xs text-slate-200 print:text-black focus:outline-none ${
                          dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                        }`}
                      />
                    </td>
                    <td className="border border-slate-700 print:border-black p-2 text-center align-top">
                      {item.driveFileName ? (
                        <div className="flex flex-col items-center justify-center gap-1 bg-emerald-950/70 border border-emerald-700/60 rounded px-2 py-1">
                          <a
                            href={item.driveFileLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-300 hover:underline max-w-[130px] truncate font-medium flex items-center gap-1"
                            title={item.driveFileName}
                          >
                            <span className="truncate">{item.driveFileName}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                          <button
                            type="button"
                            onClick={() => triggerUploadFor('detail', item.id)}
                            className="text-[10px] text-slate-400 hover:text-emerald-300 underline cursor-pointer print:hidden"
                            title="Tải lại / thay thế tệp khác"
                          >
                            Đổi tệp
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerUploadFor('detail', item.id)}
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-700/70 hover:bg-emerald-900/60 px-2.5 py-1 rounded cursor-pointer transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>+ Up lên drive</span>
                        </button>
                      )}
                    </td>
                    <td className="border border-slate-700 print:border-black p-2 text-center align-top">
                      <button
                        type="button"
                        onClick={() => handleSelectStartTimeRow(item.id)}
                        className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-all cursor-pointer ${
                          item.isStartDateSelected
                            ? 'bg-[#196b94] border-2 border-[#54bdf5] text-white shadow-md'
                            : 'bg-slate-900 border-2 border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>
                  </tr>
                ); })}
                <tr className="bg-slate-900/60 print:hidden border-t border-slate-700">
                  <td colSpan={9} className="px-3 py-2">
                    <button
                      type="button"
                      onClick={handleAddDetailItem}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </td>
                </tr>
                <tr className="bg-slate-900/90 border-t border-slate-700 print:border-black">
                  <td colSpan={9} className="px-3.5 py-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-200 print:text-black whitespace-nowrap pt-2">
                        - Hộp lưu :
                      </span>
                      <div className="flex-1 w-full">
                        <AutoResizingTextarea
                          value={detailStorageLocation}
                          onChange={(val) => setDetailStorageLocation(val)}
                          placeholder="Nhập nơi lưu trữ (nhấn Enter để xuống dòng theo từng mục)..."
                          minHeight={40}
                          className="w-full bg-slate-950/90 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CÁC PHẦN: TÀI LIỆU KÈM THEO */}
        <div className="pt-6 space-y-8">
          {attachedSections.map((section) => (
            <div key={section.id} className="space-y-3 bg-slate-900/30 p-4 sm:p-5 rounded-2xl border border-slate-800/80 shadow-md">
              <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleUpdateAttachedSectionTitle(section.id, e.target.value)}
                      className="text-base sm:text-lg font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-600 focus:outline-none px-1"
                    />
                    {attachedSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachedSection(section.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa phần này</span>
                      </button>
                    )}
                  </div>

                  {/* Nút / Note: Chuyển thành dự án mới */}
                  <div className="flex items-center gap-2 print:hidden self-start sm:self-auto">
                    {section.convertedToProjectId ? (
                      <div className="flex flex-wrap items-center gap-2 bg-emerald-950/90 border-2 border-emerald-500/80 rounded-xl px-3 py-1.5 shadow-md">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-emerald-200">Dự án con:</span>
                          <span className="font-bold text-white max-w-[180px] sm:max-w-[260px] truncate" title={section.convertedToProjectName}>
                            [{section.convertedToProjectCode}] {section.convertedToProjectName}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/80 border border-emerald-700/80 px-2 py-0.5 rounded-full" title="Tự động đồng bộ 2 chiều: Mọi thay đổi ở bảng này và phần Chi tiết của Dự án con luôn cập nhật cùng nhau">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Đồng bộ 2 chiều
                        </span>
                        {onSelectProject && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!section.convertedToProjectId) return;
                              const targetId = section.convertedToProjectId;
                              const exists = allProjects?.some(p => p.id === targetId);
                              if (!exists && onCreateProjectFromSection) {
                                // Tự động phục hồi dự án từ thông tin section và lưu ngay lập tức
                                const yyyy = section.items?.find(it => it.year)?.year || startYear || '2026';
                                const mm = (section.items?.find(it => it.month)?.month || startMonth || '06').padStart(2, '0');
                                const recoveredProject: Project = {
                                  id: targetId,
                                  code: section.convertedToProjectCode || `DA-005`,
                                  name: section.convertedToProjectName || section.title || 'Dự án mới',
                                  itemType: 'package',
                                  itemTypes: ['package'],
                                  manager: manager || project.manager || 'Ban QLDA',
                                  startMonth: mm,
                                  startYear: yyyy,
                                  startDate: `${yyyy}-${mm}-01`,
                                  targetDate: `${parseInt(yyyy, 10) + 1}-12-31`,
                                  status: 'in_progress',
                                  budget: '0 đ',
                                  driveFolderPath: `${yyyy}/${section.convertedToProjectCode || 'DA-005'}/`,
                                  projectKind: 'sub',
                                  parentProjectId: project.id,
                                  parentProject: `[${code || project.code}] ${name || project.name}`,
                                  nationalBidding: 'no',
                                  detailTitle: 'Chi tiết',
                                  detailNote: section.note || '',
                                  detailStorageLocation: section.storageLocation || '',
                                  storageLocation: section.storageLocation || '',
                                  detailItems: (section.items || []).map((item, idx) => ({
                                    id: `det-${targetId}-${idx + 1}`,
                                    stt: item.stt || idx + 1,
                                    content: item.content || '',
                                    day: item.day || '',
                                    month: item.month || '',
                                    year: item.year || '',
                                    docNumber: item.docNumber || '',
                                    docText: item.docText || '',
                                    driveFileId: item.driveFileId,
                                    driveFileName: item.driveFileName,
                                    driveFileLink: item.driveFileLink,
                                    driveFilePath: item.driveFilePath,
                                    isStartDateSelected: idx === 0
                                  })),
                                  attachedSections: [
                                    {
                                      id: `sec-${Date.now()}-1`,
                                      title: 'Tài liệu kèm theo',
                                      items: []
                                    }
                                  ],
                                  createdAt: section.convertedAt || new Date().toISOString()
                                };
                                const fullOld = getCurrentFullProject();
                                onCreateProjectFromSection(recoveredProject, fullOld);
                              }
                              handleJumpToProject(targetId);
                            }}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow transition-all cursor-pointer"
                            title="Mở biểu chi tiết của dự án con này"
                          >
                            <span>Xem dự án</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenConvertModal(section)}
                          className="text-slate-400 hover:text-amber-300 p-1 cursor-pointer transition-colors"
                          title="Tạo thêm dự án mới khác từ phần này"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id={`btn-convert-section-${section.id}`}
                        onClick={() => handleOpenConvertModal(section)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-950/40 hover:bg-rose-900/60 border-2 border-rose-500 text-rose-200 hover:text-white shadow-md hover:shadow-rose-950/50 transition-all cursor-pointer group"
                        title="Chuyển toàn bộ các dòng tài liệu kèm theo này thành phần Chi tiết của một Dự án mới"
                      >
                        <FolderPlus className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                        <span>Chuyển thành dự án mới</span>
                      </button>
                    )}
                  </div>
                </div>

                {section.convertedToProjectId && (
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-xs text-emerald-200 print:hidden">
                    <span className="font-bold text-emerald-300 shrink-0">💡 Toàn bộ nội dung Dự án con:</span>
                    <span>Nội dung của <strong>[{section.convertedToProjectCode}] {section.convertedToProjectName}</strong> được hiển thị và đồng bộ trực tiếp tại bảng dưới đây. Bạn có thể theo dõi và chỉnh sửa đầy đủ mà không cần chuyển sang Dự án con.</span>
                  </div>
                )}

                <div className="w-full">
                  <input
                    type="text"
                    value={section.note || ''}
                    onChange={(e) => handleUpdateAttachedSectionNote(section.id, e.target.value)}
                    placeholder="Ghi chú nhanh / nội dung tài liệu kèm theo nếu cần ghi luôn vào đây..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-black bg-slate-950/60 print:bg-white">
                <table className="w-full text-left border-collapse border border-slate-700 print:border-black text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-900 print:bg-slate-100 border-b border-slate-700 text-slate-200 font-bold">
                      <th rowSpan={2} className="border border-slate-700 px-2 py-2 w-14 text-center">STT</th>
                      <th rowSpan={2} className="border border-slate-700 px-4 py-2 min-w-[280px]">Nội dung</th>
                      <th colSpan={3} className="border border-slate-700 px-3 py-1.5 text-center bg-slate-850">Thời gian</th>
                      <th colSpan={2} className="border border-slate-700 px-3 py-1.5 text-center bg-slate-850">Số văn bản</th>
                      <th rowSpan={2} className="border border-slate-700 px-3 py-2 min-w-[150px] text-center">Lưu Driver</th>
                    </tr>
                    <tr className="bg-slate-900/90 border-b border-slate-700 text-slate-300 font-semibold text-[11px] text-center">
                      <th className="border border-slate-700 px-2 py-1 w-14">Ngày</th>
                      <th className="border border-slate-700 px-2 py-1 w-14">Tháng</th>
                      <th className="border border-slate-700 px-2 py-1 w-16">Năm</th>
                      <th className="border border-slate-700 px-2 py-1 w-20">Số</th>
                      <th className="border border-slate-700 px-2 py-1 min-w-[110px]">Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, idx) => {
                      const dupWarning = checkItemDuplicate(item);
                      return (
                      <tr 
                        key={item.id} 
                        className={`border-b border-slate-700/80 ${
                          dupWarning.isDuplicate ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="border border-slate-700 px-1.5 py-2 text-center font-bold align-top">
                          <STTCell
                            stt={item.stt || idx + 1}
                            totalRows={section.items.length}
                            onReorder={(newStt) => handleReorderAttachedDoc(section.id, item.id, newStt)}
                            onDelete={() => handleDeleteAttachedDoc(section.id, item.id)}
                            canDelete={section.items.length > 1}
                          />
                        </td>
                        <td className="border border-slate-700 p-1.5 align-top">
                          <AutoResizingTextarea
                            value={item.content}
                            onChange={(val) => handleUpdateAttachedDoc(section.id, item.id, 'content', val)}
                            placeholder="Tên / pháp lý..."
                          />
                        </td>
                        <td className={`border border-slate-700 p-1 align-top ${
                          dupWarning.isDuplicate ? 'bg-rose-950/25' : ''
                        }`}>
                          <input
                            type="text"
                            maxLength={2}
                            value={item.day || ''}
                            onChange={(e) => handleUpdateAttachedDoc(section.id, item.id, 'day', e.target.value)}
                            placeholder="--"
                            className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 ${
                              dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                            }`}
                          />
                        </td>
                        <td className={`border border-slate-700 p-1 align-top ${
                          dupWarning.isDuplicate ? 'bg-rose-950/25' : ''
                        }`}>
                          <input
                            type="text"
                            maxLength={2}
                            value={item.month || ''}
                            onChange={(e) => handleUpdateAttachedDoc(section.id, item.id, 'month', e.target.value)}
                            placeholder="--"
                            className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 ${
                              dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                            }`}
                          />
                        </td>
                        <td className={`border border-slate-700 p-1 align-top ${
                          dupWarning.isDuplicate ? 'bg-rose-950/25' : ''
                        }`}>
                          <input
                            type="text"
                            maxLength={4}
                            value={item.year || ''}
                            onChange={(e) => handleUpdateAttachedDoc(section.id, item.id, 'year', e.target.value)}
                            placeholder="----"
                            className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 ${
                              dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                            }`}
                          />
                        </td>
                        <td className={`border border-slate-700 p-1 align-top relative ${
                          dupWarning.isDuplicate ? 'bg-rose-950/30' : ''
                        }`}>
                          <div className="flex items-center justify-between gap-1 w-full h-full min-h-[26px]">
                            <input
                              type="text"
                              value={item.docNumber || ''}
                              onChange={(e) => handleUpdateAttachedDoc(section.id, item.id, 'docNumber', e.target.value)}
                              placeholder={dupWarning.isDuplicate && !item.docNumber ? '(trống)' : ''}
                              className={`w-full text-center bg-transparent border-0 px-1 py-1 font-mono text-xs text-slate-200 ${
                                dupWarning.isDuplicate ? 'text-rose-300 font-bold placeholder-rose-400/60' : ''
                              }`}
                            />
                            {dupWarning.isDuplicate && (
                              <div className="pr-1 shrink-0 print:hidden">
                                <DuplicateWarningBadge warning={dupWarning} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`border border-slate-700 p-1 align-top ${
                          dupWarning.isDuplicate ? 'bg-rose-950/20' : ''
                        }`}>
                          <input
                            type="text"
                            placeholder="/"
                            value={item.docText !== undefined ? item.docText : '/'}
                            onFocus={() => {
                              if (!item.docText) {
                                handleUpdateAttachedDoc(section.id, item.id, 'docText', '/');
                              }
                            }}
                            onChange={(e) => handleUpdateAttachedDoc(section.id, item.id, 'docText', e.target.value)}
                            className={`w-full bg-transparent border-0 px-1.5 py-1 font-mono text-xs text-slate-200 focus:outline-none ${
                              dupWarning.isDuplicate ? 'text-rose-300 font-semibold' : ''
                            }`}
                          />
                        </td>
                        <td className="border border-slate-700 p-2 text-center align-top">
                          {item.driveFileName ? (
                            <div className="flex flex-col items-center justify-center gap-1 bg-emerald-950/70 border border-emerald-700/60 rounded px-2 py-1">
                              <a
                                href={item.driveFileLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-300 hover:underline max-w-[130px] truncate font-medium flex items-center gap-1"
                                title={item.driveFileName}
                              >
                                <span className="truncate">{item.driveFileName}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                              <button
                                type="button"
                                onClick={() => triggerUploadFor('attached', item.id, section.id)}
                                className="text-[10px] text-slate-400 hover:text-emerald-300 underline cursor-pointer print:hidden"
                                title="Tải lại / thay thế tệp khác"
                              >
                                Đổi tệp
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => triggerUploadFor('attached', item.id, section.id)}
                              className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-700/70 hover:bg-emerald-900/60 px-2.5 py-1 rounded cursor-pointer transition-colors"
                            >
                              <Upload className="w-3 h-3" />
                              <span>+ Up lên drive</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ); })}
                    <tr className="bg-slate-900/60 print:hidden border-t border-slate-700">
                      <td colSpan={8} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleAddAttachedDoc(section.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm dòng trong phần này</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="bg-slate-900/90 border-t border-slate-700 print:border-black">
                      <td colSpan={8} className="px-3.5 py-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-200 whitespace-nowrap pt-2">
                            - Hộp lưu :
                          </span>
                          <div className="flex-1 w-full">
                            <AutoResizingTextarea
                              value={section.storageLocation || ''}
                              onChange={(val) => handleUpdateAttachedSectionStorageLocation(section.id, val)}
                              placeholder="Nhập nơi lưu trữ..."
                              minHeight={40}
                              className="w-full bg-slate-950/90 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="pt-2 print:hidden">
            <button
              type="button"
              id="btn-add-large-attached-section"
              onClick={handleAddAttachedSection}
              className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-emerald-500/80 hover:border-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-white font-bold flex items-center justify-center gap-3.5 cursor-pointer shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl">
                +
              </div>
              <div className="text-left">
                <div className="tracking-wide font-bold text-sm sm:text-base">
                  Thêm phần tài liệu kèm theo mới
                </div>
                <div className="text-xs text-emerald-400/80 font-normal">
                  Thêm một phần có tiêu đề, ô ghi chú nhanh và bảng tài liệu hoàn chỉnh
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: TRẠNG THÁI DỰ ÁN */}
        <div className="pt-6 pb-2 flex flex-wrap items-center gap-4 justify-start">
          <div className="border-2 border-emerald-500 rounded-xl px-5 py-3 bg-emerald-950/30 text-slate-100 font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
            <span>Trạng thái dự án</span>
          </div>

          <div className="bg-[#0e3b52] border-2 border-[#196b94] rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => setStatus('completed')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                status === 'completed'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Hoàn thành
            </button>
            <span className="hidden sm:inline text-cyan-300 font-bold px-1 select-none">/</span>
            <button
              type="button"
              onClick={() => setStatus('on_hold')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                status === 'on_hold'
                  ? 'bg-rose-500 text-white font-extrabold shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Dừng thực hiện
            </button>
            <span className="hidden sm:inline text-cyan-300 font-bold px-1 select-none">/</span>
            <button
              type="button"
              onClick={() => setStatus('in_progress')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                status === 'in_progress'
                  ? 'bg-cyan-400 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Đang thực hiện
            </button>
          </div>

          {status === 'on_hold' && (
            <div className="w-full mt-1 p-3 bg-rose-950/50 border border-rose-600/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs font-bold text-rose-300 whitespace-nowrap flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                Lý do dừng thực hiện:
              </span>
              <input
                type="text"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Nhập lý do..."
                className="flex-1 w-full bg-slate-950 border border-rose-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          )}

          <div className="ml-auto print:hidden">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              {isSavedNotice ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu biểu chi tiết</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        ref={jsonFileInputRef} 
        onChange={handleImportJson} 
        accept=".json,application/json" 
        className="hidden" 
      />

      {/* Modal Xuất file / Chia sẻ */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Lưu &amp; Xuất file gửi cho người khác xem
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dự án: <span className="font-mono text-emerald-400 font-bold">[{code}]</span> {name || 'Chưa đặt tên'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-600/50">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-100">1. Tải file HTML độc lập</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Tạo 1 file .html duy nhất gửi qua Zalo/Email, người nhận chỉ cần mở ra xem được ngay.
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExportHtml}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file .HTML về</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Printer className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-bold text-slate-100">2. Xuất file PDF / In</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Mở hộp thoại in, chọn "Lưu dạng PDF" (Save as PDF).
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      setTimeout(() => window.print(), 200);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Mở hộp thoại In / Lưu PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-100">3. Sao lưu &amp; Nạp dữ liệu (.json)</h4>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-amber-300 text-xs font-semibold rounded-xl border border-amber-600/40 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập file (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file (.json)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">
                      4. Gửi đường link xem trực tuyến
                    </span>
                  </div>
                  {copyLinkSuccess && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đã sao chép!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </button>
                </div>
              </div>

              {onOpenBackupModal && (
                <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-600/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-teal-200">
                        Sao lưu toàn bộ hệ thống
                      </div>
                      <div className="text-[11px] text-teal-300/80">
                        Đảm bảo an toàn 100% dữ liệu khi bạn thay máy tính
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      onOpenBackupModal();
                    }}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Mở bảng Sao lưu
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHUYỂN PHẦN TÀI LIỆU KÈM THEO THÀNH DỰ ÁN MỚI */}
      {convertModalSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-rose-300 flex items-center justify-center font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Chuyển thành dự án mới</span>
                    <span className="text-xs font-normal text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800">
                      từ "{convertModalSection.title}"
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Toàn bộ {convertModalSection.items.length} dòng tài liệu kèm theo sẽ được chuyển thành "Phần chi tiết" của dự án mới
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalSection(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4.5 text-xs sm:text-sm">
              {/* Điền lại tên dự án mới */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 uppercase tracking-wide">
                  1. Tên dự án / gói thầu mới <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newProjectNameInput}
                  onChange={(e) => setNewProjectNameInput(e.target.value)}
                  placeholder="Nhập tên dự án / gói thầu mới..."
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Gợi ý: Điền tên dự án/gói thầu độc lập. Dữ liệu này sẽ tạo thành 1 dự án riêng biệt trong danh sách.
                </p>
              </div>

              {/* Mã & Phân loại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mã dự án / gói thầu:
                  </label>
                  <input
                    type="text"
                    value={newProjectCodeInput}
                    onChange={(e) => setNewProjectCodeInput(e.target.value)}
                    placeholder="DA-019"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phân loại đối tượng:
                  </label>
                  <select
                    value={newProjectItemType}
                    onChange={(e) => setNewProjectItemType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="package">Gói thầu</option>
                    <option value="project">Dự án</option>
                    <option value="item">Hạng mục</option>
                  </select>
                </div>
              </div>

              {/* Quản lý & Thời gian bắt đầu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Đơn vị / Ban quản lý chính:
                  </label>
                  <input
                    type="text"
                    value={newProjectManagerInput}
                    onChange={(e) => setNewProjectManagerInput(e.target.value)}
                    placeholder="Ban Quản lý..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Thời gian bắt đầu (Tháng / Năm):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={2}
                      value={newProjectStartMonthInput}
                      onChange={(e) => setNewProjectStartMonthInput(e.target.value)}
                      placeholder="Tháng"
                      className="w-16 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-center text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-500 font-bold">/</span>
                    <input
                      type="text"
                      maxLength={4}
                      value={newProjectStartYearInput}
                      onChange={(e) => setNewProjectStartYearInput(e.target.value)}
                      placeholder="Năm"
                      className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-center text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hộp giải thích cấu hình liên kết tự động */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cơ chế liên kết tự động giữa 2 dự án:</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>
                    <strong className="text-emerald-400">Dự án mới tạo:</strong> Sẽ được thiết lập là <em>Dự án thành phần</em>, tự động liên kết với dự án chính <strong>[{code}] {name}</strong>.
                  </li>
                  <li>
                    <strong className="text-amber-400">Dự án hiện tại ({code}):</strong> Dữ liệu được giữ nguyên. Hệ thống tự động thiết lập là <em>Dự án chính</em> (Mục 3) và đính kèm dự án mới này vào danh sách <em>3.2 Dự án liên quan</em>.
                  </li>
                </ul>
              </div>

              {/* Danh sách các dòng sẽ chuyển đổi thành Phần chi tiết */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">
                    Nội dung sẽ chuyển thành Phần chi tiết ({convertModalSection.items.length} dòng):
                  </span>
                  <span className="text-[11px] text-emerald-400">
                    Giữ nguyên tệp Drive &amp; số văn bản
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2 space-y-1.5">
                  {convertModalSection.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {item.stt || idx + 1}
                        </span>
                        <span className="text-slate-200 truncate font-medium">
                          {item.content || '(Chưa nhập nội dung)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        {(item.day || item.month || item.year) && (
                          <span className="font-mono text-slate-400">
                            {[item.day, item.month, item.year].filter(Boolean).join('/')}
                          </span>
                        )}
                        {item.docNumber && (
                          <span className="text-cyan-300 font-mono">
                            {item.docNumber}{item.docText}
                          </span>
                        )}
                        {item.driveFileName && (
                          <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                            {item.driveFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConvertModalSection(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="btn-confirm-convert-project"
                onClick={handleConfirmConvertSectionToProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg hover:shadow-emerald-900/50 cursor-pointer transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Tạo và Lưu Dự Án Mới</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG THÔNG BÁO TẠO THÀNH CÔNG */}
      {convertSuccessPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-900 border border-emerald-500/80 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Đã chuyển thành dự án mới thành công!
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Dự án mới: <strong className="text-emerald-300">[{convertSuccessPrompt.createdProject.code}] {convertSuccessPrompt.createdProject.name}</strong>
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Nội dung đã chuyển thành Phần chi tiết</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Dự án này đã chuyển thành Dự án chính (Mục 3)</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Dự án mới đã được đính kèm vào Dự án liên quan</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConvertSuccessPrompt(null)}
                className="w-full sm:w-1/2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Ở lại dự án này
              </button>
              {onSelectProject && (
                <button
                  type="button"
                  id="btn-goto-new-created-project"
                  onClick={() => {
                    const newId = convertSuccessPrompt.createdProject.id;
                    setConvertSuccessPrompt(null);
                    onSelectProject(newId);
                  }}
                  className="w-full sm:w-1/2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <span>Xem ngay dự án mới</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
