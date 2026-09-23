import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { 
  Navbar, 
  AppViewMode 
} from './components/Navbar';
import { ActiveProjectBoard } from './components/ActiveProjectBoard';
import { ProjectDetailSheet } from './components/ProjectDetailSheet';
import { ProjectsOverviewBoard } from './components/ProjectsOverviewBoard';
import { DriveFolderExplorer } from './components/DriveFolderExplorer';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { 
  Project, 
  TaskItem, 
  CategoryInfo, 
  TaskStatus, 
  ProjectStatus, 
  ScannedDocument,
  ProjectDetailItem
} from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  WBS_CATEGORIES, 
  getStoredProjects, 
  setStoredProjects, 
  getStoredTasks, 
  setStoredTasks, 
  getMasterDrivePath, 
  setMasterDrivePath 
} from './services/taskStorage';
import { 
  signInWithGoogleDrive, 
  signOutGoogle, 
  getStoredDriveToken, 
  setStoredDriveToken, 
  auth 
} from './services/firebaseAuth';
import { 
  getOrCreateFolder, 
  ensureProjectHierarchicalFolder 
} from './services/driveService';

export const App: React.FC = () => {
  // 1. Dữ liệu chính
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = getStoredProjects();
    return saved && saved.length > 0 ? saved : INITIAL_PROJECTS;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = getStoredTasks();
    return saved && saved.length > 0 ? saved : INITIAL_TASKS;
  });

  const [categories] = useState<CategoryInfo[]>(WBS_CATEGORIES);
  const [masterDrivePath, setLocalMasterDrivePath] = useState<string>(() => {
    return getMasterDrivePath() || '01. QUẢN LÝ DỰ ÁN & HỒ SƠ CÔNG TRÌNH';
  });

  // Tên công ty lưu trong localStorage
  const companyName = localStorage.getItem('pm_company_name') || 'Công ty CP Cảng Quốc tế Lào - Việt';

  // 2. Dự án đang chọn
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const savedId = localStorage.getItem('pm_active_project_id');
    if (savedId && projects.some(p => p.id === savedId)) return savedId;
    return projects[0]?.id || 'proj-1';
  });

  // 3. Tab điều hướng
  const [currentView, setCurrentView] = useState<AppViewMode>('project_details');

  // 4. Google Drive & Firebase Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(() => getStoredDriveToken());
  const [driveRootFolderId, setDriveRootFolderId] = useState<string | null>(() => {
    return localStorage.getItem('pm_drive_root_folder_id') || null;
  });
  const [driveRootFolderLink, setDriveRootFolderLink] = useState<string>(() => {
    return localStorage.getItem('pm_drive_root_folder_link') || '';
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 5. Modals State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewingTaskDetail, setViewingTaskDetail] = useState<TaskItem | null>(null);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanTargetTaskId, setScanTargetTaskId] = useState<string | undefined>(undefined);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Đồng bộ LocalStorage
  useEffect(() => {
    setStoredProjects(projects);
  }, [projects]);

  useEffect(() => {
    setStoredTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setMasterDrivePath(masterDrivePath);
  }, [masterDrivePath]);

  useEffect(() => {
    localStorage.setItem('pm_active_project_id', activeProjectId);
  }, [activeProjectId]);

  // Tự động khôi phục và đồng bộ các dự án được tạo từ "Tài liệu kèm theo" nếu chưa có trong danh sách projects
  useEffect(() => {
    const existingIds = new Set(projects.map(p => p.id));
    const missingProjects: Project[] = [];
    const generatedTasks: TaskItem[] = [];

    projects.forEach(p => {
      if (p.attachedSections && p.attachedSections.length > 0) {
        p.attachedSections.forEach(sec => {
          if (sec.convertedToProjectId && !existingIds.has(sec.convertedToProjectId)) {
            existingIds.add(sec.convertedToProjectId);
            const newProjId = sec.convertedToProjectId;
            const newCode = sec.convertedToProjectCode || `DA-${String(projects.length + missingProjects.length + 1).padStart(3, '0')}`;
            const newName = sec.convertedToProjectName || sec.title || `Dự án ${newCode}`;

            const detailItems: ProjectDetailItem[] = (sec.items || []).map((item, idx) => ({
              id: `det-${newProjId}-${idx + 1}`,
              stt: item.stt || idx + 1,
              content: item.content || '',
              day: item.day,
              month: item.month,
              year: item.year,
              docNumber: item.docNumber,
              docText: item.docText,
              driveFileId: item.driveFileId,
              driveFileName: item.driveFileName,
              driveFileLink: item.driveFileLink,
              driveFilePath: item.driveFilePath,
              isStartDateSelected: idx === 0
            }));

            const startY = sec.items?.find(it => it.year)?.year || p.startYear || '2026';
            const startM = (sec.items?.find(it => it.month)?.month || p.startMonth || '06').padStart(2, '0');

            const restored: Project = {
              id: newProjId,
              code: newCode,
              name: newName,
              itemType: 'package',
              manager: p.manager || 'Ban QLDA',
              startMonth: startM,
              startYear: startY,
              startDate: `${startY}-${startM}-01`,
              targetDate: `${parseInt(startY, 10) + 1}-12-31`,
              status: 'in_progress',
              budget: '0 đ',
              driveFolderPath: `${startY}/${newCode}/`,
              projectKind: 'sub',
              parentProjectId: p.id,
              parentProject: `[${p.code}] ${p.name}`,
              nationalBidding: 'no',
              detailTitle: 'Chi tiết',
              detailNote: sec.note || '',
              detailStorageLocation: sec.storageLocation || '',
              storageLocation: sec.storageLocation || '',
              detailItems: detailItems,
              attachedSections: [
                {
                  id: `sec-${newProjId}-1`,
                  title: 'Tài liệu kèm theo',
                  note: '',
                  storageLocation: '',
                  items: []
                }
              ],
              createdAt: sec.convertedAt || new Date().toISOString()
            };

            missingProjects.push(restored);

            // Sinh các công việc (Task) tương ứng để xuất hiện trong Bảng công việc và Tiến độ
            (detailItems.length > 0 ? detailItems : [{ id: '1', content: newName } as any]).forEach((item, idx) => {
              generatedTasks.push({
                id: `task-${newProjId}-${idx + 1}`,
                projectId: newProjId,
                code: `${newCode}-CV${String(idx + 1).padStart(2, '0')}`,
                title: item.content || `Công việc ${idx + 1}`,
                description: `Hồ sơ chi tiết [${item.docNumber || ''}${item.docText || ''}] - ${newName}`,
                category: 'Triển khai & Thi công',
                status: 'in_progress',
                priority: 'medium',
                progress: 30,
                assignee: restored.manager,
                startDate: restored.startDate || '2026-06-01',
                dueDate: restored.targetDate || '2027-12-31',
                documents: item.driveFileName ? [
                  {
                    id: `doc-${newProjId}-${idx}`,
                    name: item.driveFileName,
                    type: 'contract',
                    projectId: newProjId,
                    category: 'Triển khai & Thi công',
                    driveFileId: item.driveFileId || '',
                    driveViewLink: item.driveFileLink || '',
                    mimeType: 'application/pdf',
                    uploadDate: new Date().toISOString()
                  }
                ] : [],
                updatedAt: new Date().toISOString()
              });
            });
          }
        });
      }
    });

    if (missingProjects.length > 0) {
      setProjects(prev => [...missingProjects, ...prev]);
      if (generatedTasks.length > 0) {
        setTasks(prev => {
          const prevIds = new Set(prev.map(t => t.id));
          const toAdd = generatedTasks.filter(t => !prevIds.has(t.id));
          return [...toAdd, ...prev];
        });
      }
    }
  }, [projects]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setDriveToken(null);
        setStoredDriveToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Khởi tạo thư mục gốc trên Google Drive khi có token
  useEffect(() => {
    if (driveToken && !driveRootFolderId) {
      getOrCreateFolder(driveToken, masterDrivePath)
        .then(folder => {
          setDriveRootFolderId(folder.id);
          localStorage.setItem('pm_drive_root_folder_id', folder.id);
          if (folder.webViewLink) {
            setDriveRootFolderLink(folder.webViewLink);
            localStorage.setItem('pm_drive_root_folder_link', folder.webViewLink);
          }
        })
        .catch(err => {
          console.warn('Không thể tự tạo thư mục gốc trên Drive:', err);
        });
    }
  }, [driveToken, masterDrivePath, driveRootFolderId]);

  // Đăng nhập Google
  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      const { token, user } = await signInWithGoogleDrive();
      setDriveToken(token);
      setStoredDriveToken(token);
      setCurrentUser(user);
    } catch (err: any) {
      alert('Đăng nhập Google thất bại: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Đăng xuất Google
  const handleGoogleLogout = async () => {
    await signOutGoogle();
    setDriveToken(null);
    setStoredDriveToken(null);
    setCurrentUser(null);
  };

  // Tìm dự án đang hoạt động
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // Lưu / Cập nhật dự án
  const handleSaveProject = (projectData: Partial<Project>) => {
    const targetId = projectData.id || editingProject?.id;
    if (targetId && projects.some(p => p.id === targetId)) {
      // Cập nhật dự án đã tồn tại (từ modal sửa hoặc auto-save từ biểu mẫu chi tiết)
      setProjects(prev => prev.map(p => p.id === targetId ? { ...p, ...projectData, id: targetId } : p));
      if (editingProject) {
        setEditingProject(null);
      }
    } else {
      // Thêm mới
      const newProjId = `proj-${Date.now()}`;
      const newCode = projectData.code || `DA-${String(projects.length + 1).padStart(3, '0')}`;
      const newProject: Project = {
        id: newProjId,
        name: projectData.name || 'Dự án mới',
        code: newCode,
        description: projectData.description || '',
        manager: projectData.manager || 'Ban QLDA',
        startDate: projectData.startDate || '2026-06-01',
        targetDate: projectData.targetDate || '2027-12-31',
        status: projectData.status || 'in_progress',
        budget: projectData.budget || '15.000.000.000 đ',
        driveFolderPath: projectData.driveFolderPath || `2026/${newCode}/`,
        itemType: projectData.itemType || 'project',
        projectKind: projectData.projectKind || 'main',
        nationalBidding: projectData.nationalBidding || 'no',
        detailTitle: 'Chi tiết',
        detailItems: [],
        attachedSections: [
          {
            id: 'sec-1',
            title: 'Tài liệu kèm theo',
            items: []
          }
        ],
        createdAt: projectData.createdAt || new Date().toISOString(),
        ...projectData
      };
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProjId);
      setIsNewProjectModalOpen(false);
    }
  };

  // Xử lý tạo dự án mới từ một phần tài liệu kèm theo
  const handleCreateProjectFromSection = (newProject: Project, updatedOldProject: Project) => {
    // 1. Cập nhật danh sách dự án
    setProjects(prev => {
      const updatedList = prev.map(p => p.id === updatedOldProject.id ? updatedOldProject : p);
      if (!updatedList.some(p => p.id === newProject.id)) {
        return [newProject, ...updatedList];
      }
      return updatedList.map(p => p.id === newProject.id ? newProject : p);
    });

    // 2. Tạo công việc cho dự án mới để hiển thị ngay trên Bảng công việc và Tiến độ
    const newTasks: TaskItem[] = (newProject.detailItems && newProject.detailItems.length > 0)
      ? newProject.detailItems.map((item, idx) => ({
          id: `task-${newProject.id}-${idx + 1}`,
          projectId: newProject.id,
          code: `${newProject.code}-CV${String(idx + 1).padStart(2, '0')}`,
          title: item.content || `Nội dung công việc ${idx + 1}`,
          description: `Chuyển đổi từ hồ sơ [${item.docNumber || ''}${item.docText || ''}] - ${newProject.name}`,
          category: 'Triển khai & Thi công',
          status: 'in_progress',
          priority: 'medium',
          progress: 25,
          assignee: newProject.manager || 'Ban Quản lý',
          startDate: newProject.startDate || '2026-06-01',
          dueDate: newProject.targetDate || '2027-12-31',
          documents: item.driveFileName ? [
            {
              id: `doc-${newProject.id}-${idx}`,
              name: item.driveFileName,
              type: 'contract',
              projectId: newProject.id,
              category: 'Triển khai & Thi công',
              driveFileId: item.driveFileId || '',
              driveViewLink: item.driveFileLink || '',
              mimeType: 'application/pdf',
              uploadDate: new Date().toISOString()
            }
          ] : [],
          notes: item.docNumber ? `Số văn bản: ${item.docNumber}${item.docText || ''}` : '',
          updatedAt: new Date().toISOString()
        }))
      : [{
          id: `task-${newProject.id}-1`,
          projectId: newProject.id,
          code: `${newProject.code}-CV01`,
          title: `Triển khai thực hiện ${newProject.name}`,
          description: `Khởi tạo công việc cho dự án mới ${newProject.code}`,
          category: 'Triển khai & Thi công',
          status: 'in_progress',
          priority: 'medium',
          progress: 20,
          assignee: newProject.manager || 'Ban Quản lý',
          startDate: newProject.startDate || '2026-06-01',
          dueDate: newProject.targetDate || '2027-12-31',
          documents: [],
          updatedAt: new Date().toISOString()
        }];

    setTasks(prev => {
      const prevIds = new Set(prev.map(t => t.id));
      const toAdd = newTasks.filter(t => !prevIds.has(t.id));
      return [...toAdd, ...prev];
    });

    // 3. Đặt dự án mới làm dự án hoạt động và chuyển hướng vào trang Chi tiết dự án
    setActiveProjectId(newProject.id);
    setCurrentView('project_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cập nhật trạng thái dự án
  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
  };

  // Xóa dự án
  const handleDeleteProject = (projectId: string) => {
    const target = projects.find(p => p.id === projectId);
    setConfirmDeleteState({
      isOpen: true,
      title: 'Xác nhận xóa dự án',
      message: `Bạn có chắc chắn muốn xóa dự án "${target?.name}" (${target?.code})? Tất cả công việc thuộc dự án này cũng sẽ bị xóa.`,
      onConfirm: () => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setTasks(prev => prev.filter(t => t.projectId !== projectId));
        if (activeProjectId === projectId) {
          const remaining = projects.filter(p => p.id !== projectId);
          if (remaining.length > 0) setActiveProjectId(remaining[0].id);
        }
        setConfirmDeleteState(s => ({ ...s, isOpen: false }));
      }
    });
  };

  // Lưu / Cập nhật công việc (Task)
  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { 
        ...t, 
        ...taskData,
        startDate: taskData.startDate || t.startDate || new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString()
      } : t));
      setEditingTask(null);
    } else {
      const newTaskCode = `PM-${String(tasks.length + 1).padStart(3, '0')}`;
      const nowStr = new Date().toISOString();
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        code: newTaskCode,
        title: taskData.title || 'Công việc mới',
        description: taskData.description || '',
        category: taskData.category || categories[0].name,
        progress: taskData.progress || 0,
        status: taskData.status || 'not_started',
        priority: taskData.priority || 'medium',
        startDate: taskData.startDate || nowStr.slice(0, 10),
        dueDate: taskData.dueDate || nowStr.slice(0, 10),
        assignee: taskData.assignee || 'Kỹ sư phụ trách',
        budget: taskData.budget,
        documents: taskData.documents || [],
        projectId: activeProjectId,
        updatedAt: nowStr,
        ...taskData
      };
      setTasks(prev => [newTask, ...prev]);
      setIsNewTaskModalOpen(false);
    }
  };

  // Thêm việc nhanh từ thanh input
  const handleQuickAddTask = (title: string, category: string, _uploadAfter?: boolean): string => {
    const newTaskCode = `PM-${String(tasks.length + 1).padStart(3, '0')}`;
    const newId = `task-${Date.now()}`;
    const nowStr = new Date().toISOString();
    const newTask: TaskItem = {
      id: newId,
      code: newTaskCode,
      title,
      description: `Hạng mục thuộc dự án ${activeProject?.name}`,
      category,
      progress: 0,
      status: 'in_progress',
      priority: 'medium',
      startDate: nowStr.slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      assignee: activeProject?.manager || 'Ban QLDA',
      projectId: activeProjectId,
      updatedAt: nowStr,
      documents: []
    };
    setTasks(prev => [newTask, ...prev]);
    return newId;
  };

  // Cập nhật tiến độ % công việc
  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let nextStatus: TaskStatus = t.status;
        if (newProgress === 100) nextStatus = 'completed';
        else if (newProgress > 0 && t.status === 'not_started') nextStatus = 'in_progress';
        return { ...t, progress: newProgress, status: nextStatus };
      }
      return t;
    }));
  };

  // Cập nhật trạng thái công việc
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let nextProgress = t.progress;
        if (newStatus === 'completed') nextProgress = 100;
        else if (newStatus === 'not_started') nextProgress = 0;
        return { ...t, status: newStatus, progress: nextProgress };
      }
      return t;
    }));
  };

  // Xóa công việc
  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    setConfirmDeleteState({
      isOpen: true,
      title: 'Xác nhận xóa công việc',
      message: `Bạn có chắc muốn xóa hạng mục "${target?.title}" (${target?.code})?`,
      onConfirm: () => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setConfirmDeleteState(s => ({ ...s, isOpen: false }));
      }
    });
  };

  // Khi scan hoặc tải tài liệu lên thành công
  const handleDocumentScanned = (doc: ScannedDocument, targetTaskId?: string) => {
    const taskIdToAttach = targetTaskId || scanTargetTaskId;
    if (taskIdToAttach) {
      setTasks(prev => prev.map(t => {
        if (t.id === taskIdToAttach) {
          const currentDocs = t.documents || [];
          return {
            ...t,
            documents: [doc, ...currentDocs]
          };
        }
        return t;
      }));
    } else {
      // Gán cho công việc đầu tiên của dự án hiện tại nếu có
      const firstProjectTask = tasks.find(t => t.projectId === activeProjectId);
      if (firstProjectTask) {
        setTasks(prev => prev.map(t => {
          if (t.id === firstProjectTask.id) {
            return {
              ...t,
              documents: [doc, ...(t.documents || [])]
            };
          }
          return t;
        }));
      }
    }
  };

  // Xóa tài liệu khỏi Task
  const handleDeleteTaskDocument = (taskId: string, documentId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          documents: (t.documents || []).filter(d => d.id !== documentId)
        };
      }
      return t;
    }));
    if (viewingTaskDetail && viewingTaskDetail.id === taskId) {
      setViewingTaskDetail(prev => prev ? {
        ...prev,
        documents: (prev.documents || []).filter(d => d.id !== documentId)
      } : null);
    }
  };

  // Xử lý Khôi phục Toàn bộ Dữ liệu từ Backup File (.json)
  const handleRestoreAllData = (restored: {
    projects: Project[];
    tasks: TaskItem[];
    masterDrivePath?: string;
    activeProjectId?: string;
  }) => {
    setProjects(restored.projects);
    setTasks(restored.tasks);
    if (restored.masterDrivePath) setLocalMasterDrivePath(restored.masterDrivePath);
    if (restored.activeProjectId && restored.projects.some(p => p.id === restored.activeProjectId)) {
      setActiveProjectId(restored.activeProjectId);
    } else if (restored.projects[0]) {
      setActiveProjectId(restored.projects[0].id);
    }
  };

  // Điều hướng đến Biểu Chi Tiết của một dự án
  const handleNavigateToProjectDetails = (projId: string) => {
    setActiveProjectId(projId);
    setCurrentView('project_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. Thanh điều hướng đầu trang */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        activeProject={activeProject}
        projects={projects}
        onSelectProject={setActiveProjectId}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onOpenScanModal={() => {
          setScanTargetTaskId(undefined);
          setIsScanModalOpen(true);
        }}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setIsNewTaskModalOpen(true);
        }}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        currentUser={currentUser}
        driveFolderName={masterDrivePath}
        driveFolderLink={driveRootFolderLink}
        isDriveConnected={!!driveToken}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleGoogleLogout}
        isAuthenticating={isAuthenticating}
      />

      {/* 2. Nội dung chính theo View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* VIEW 1: CHI TIẾT DỰ ÁN */}
        {currentView === 'project_details' && (
          <ProjectDetailSheet
            project={activeProject}
            allProjects={projects}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setCurrentView('project_details');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveProject={handleSaveProject}
            onCreateProjectFromSection={handleCreateProjectFromSection}
            driveToken={driveToken}
            driveRootFolderId={driveRootFolderId}
            isDriveConnected={!!driveToken}
            onGoogleSignIn={handleGoogleSignIn}
            onOpenScanModal={() => {
              setScanTargetTaskId(undefined);
              setIsScanModalOpen(true);
            }}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {/* VIEW 2: BẢNG CÔNG VIỆC */}
        {currentView === 'active_project' && (
          <ActiveProjectBoard
            project={activeProject}
            allProjects={projects}
            tasks={tasks}
            categories={categories}
            driveFolderName={masterDrivePath}
            driveFolderLink={driveRootFolderLink}
            isDriveConnected={!!driveToken}
            driveToken={driveToken}
            driveRootFolderId={driveRootFolderId}
            onGoogleSignIn={handleGoogleSignIn}
            onSelectProject={setActiveProjectId}
            onNavigateToProjectDetails={handleNavigateToProjectDetails}
            onUpdateProjectStatus={handleUpdateProjectStatus}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenScanModal={(taskId) => {
              setScanTargetTaskId(taskId);
              setIsScanModalOpen(true);
            }}
            onOpenTaskDetail={(task) => setViewingTaskDetail(task)}
            onOpenEditTaskModal={(task) => {
              setEditingTask(task);
              setIsNewTaskModalOpen(true);
            }}
            onQuickAddTask={handleQuickAddTask}
            onUpdateTaskProgress={handleUpdateTaskProgress}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onViewAllProjects={() => setCurrentView('projects_overview')}
            onSaveProject={handleSaveProject}
          />
        )}

        {/* VIEW 3: TIẾN ĐỘ TỔNG THỂ */}
        {currentView === 'projects_overview' && (
          <ProjectsOverviewBoard
            projects={projects}
            tasks={tasks}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setCurrentView('active_project');
            }}
            onNavigateToProjectDetails={handleNavigateToProjectDetails}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenEditProjectModal={(proj) => {
              setEditingProject(proj);
              setIsNewProjectModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {/* VIEW 4: HỒ SƠ GOOGLE DRIVE */}
        {currentView === 'drive' && (
          <DriveFolderExplorer
            tasks={tasks}
            categories={categories}
            driveFolderName={masterDrivePath}
            driveFolderLink={driveRootFolderLink}
            isDriveConnected={!!driveToken}
            onGoogleSignIn={handleGoogleSignIn}
            onOpenScanModal={(taskId) => {
              setScanTargetTaskId(taskId);
              setIsScanModalOpen(true);
            }}
            onDeleteDocument={(doc: ScannedDocument) => {
              setTasks(prev => prev.map(t => ({
                ...t,
                documents: (t.documents || []).filter(d => d.id !== doc.id)
              })));
            }}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{companyName}</span>
            <span>•</span>
            <span>Hệ Thống Quản Lý Dự Án &amp; Hồ Sơ Tài Liệu Công Trình</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Đồng bộ Google Drive API</span>
            <span>•</span>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Sao lưu dữ liệu (.json)
            </button>
          </div>
        </div>
      </footer>

      {/* 4. MODALS */}

      {/* Modal Quét / Tải tài liệu Scan Drive */}
      <DocumentScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        tasks={tasks.filter(t => t.projectId === activeProjectId)}
        projects={projects}
        activeProjectId={activeProjectId}
        defaultTaskId={scanTargetTaskId}
        driveToken={driveToken}
        driveRootFolderId={driveRootFolderId}
        onSaveDocument={handleDocumentScanned}
        onGoogleSignIn={handleGoogleSignIn}
      />

      {/* Modal Tạo / Sửa Công việc */}
      <TaskFormModal
        isOpen={isNewTaskModalOpen}
        onClose={() => {
          setIsNewTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSaveTask={handleSaveTask}
        categories={categories}
        projects={projects}
        defaultProjectId={activeProjectId}
        existingTask={editingTask}
      />

      {/* Modal Chi Tiết Công việc & Quản lý File Scan */}
      <TaskDetailModal
        isOpen={!!viewingTaskDetail}
        onClose={() => setViewingTaskDetail(null)}
        task={viewingTaskDetail}
        onOpenScanModal={(taskId) => {
          setScanTargetTaskId(taskId);
          setIsScanModalOpen(true);
        }}
        onUpdateProgress={handleUpdateTaskProgress}
        onUpdateStatus={handleUpdateTaskStatus}
        onDeleteDocument={(doc: ScannedDocument) => {
          if (viewingTaskDetail) {
            handleDeleteTaskDocument(viewingTaskDetail.id, doc.id);
          }
        }}
      />

      {/* Modal Tạo / Sửa Dự án */}
      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        onClose={() => {
          setIsNewProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSaveProject={handleSaveProject}
        existingProject={editingProject}
      />

      {/* Modal Sao Lưu & Khôi Phục Toàn Bộ */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        projects={projects}
        tasks={tasks}
        categories={categories}
        masterDrivePath={masterDrivePath}
        activeProjectId={activeProjectId}
        companyName={companyName}
        isDriveConnected={!!driveToken}
        driveToken={driveToken}
        driveRootFolderId={driveRootFolderId}
        onRestoreAll={handleRestoreAllData}
      />

      {/* Modal Xác nhận Xóa */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteState.isOpen}
        title={confirmDeleteState.title}
        message={confirmDeleteState.message}
        onConfirm={confirmDeleteState.onConfirm}
        onCancel={() => setConfirmDeleteState(s => ({ ...s, isOpen: false }))}
      />
    </div>
  );
};

export default App;
