import { Project, TaskItem, CategoryInfo } from '../types';

export interface FullBackupPayload {
  app: string;
  company: string;
  backupTime: string;             // ISO string
  backupTimeFormatted: string;    // Human-readable: "21/09/2026 17:05:30"
  version: string;
  totalProjects: number;
  totalTasks: number;
  projects: Project[];
  tasks: TaskItem[];
  categories?: CategoryInfo[];
  masterDrivePath?: string;
  activeProjectId?: string;
}

/**
 * Tạo dữ liệu backup hoàn chỉnh với mốc thời gian chi tiết
 */
export function generateBackupPayload(
  projects: Project[],
  tasks: TaskItem[],
  categories: CategoryInfo[],
  masterDrivePath: string,
  activeProjectId: string,
  companyName: string
): FullBackupPayload {
  const now = new Date();
  const backupTimeFormatted = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    app: 'ProjectManagementSystem_LaoViet',
    company: companyName || 'Công ty CP Cảng Quốc tế Lào - Việt',
    backupTime: now.toISOString(),
    backupTimeFormatted,
    version: '1.0',
    totalProjects: projects.length,
    totalTasks: tasks.length,
    projects,
    tasks,
    categories,
    masterDrivePath,
    activeProjectId
  };
}

/**
 * Tải file sao lưu JSON về máy tính của người dùng
 */
export function downloadBackupFile(payload: FullBackupPayload) {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Tên file ghi rõ ngày giờ: Sao_luu_toan_bo_du_an_2026-09-21_17h05.json
  const now = new Date(payload.backupTime);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const fileName = `Sao_luu_toan_bo_du_an_${year}-${month}-${date}_${hours}h${minutes}.json`;

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Lưu mốc thời gian sao lưu gần nhất vào localStorage
  localStorage.setItem('pm_last_backup_time', payload.backupTimeFormatted);
}

/**
 * Kiểm tra tính hợp lệ của file backup JSON
 */
export function parseBackupFile(file: File): Promise<FullBackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Tệp không đúng cấu trúc JSON.');
        }

        // Kiểm tra xem là file backup toàn bộ (FullBackupPayload)
        // hay file dữ liệu 1 dự án riêng lẻ
        if (Array.isArray(parsed.projects)) {
          // Đúng chuẩn FullBackupPayload
          resolve(parsed as FullBackupPayload);
        } else if (parsed.code && parsed.name && (parsed.detailItems || parsed.manager)) {
          // Là file backup của 1 dự án -> bọc lại thành payload
          const singleProject = parsed as Project;
          resolve({
            app: 'SingleProjectImport',
            company: 'Công ty CP Cảng Quốc tế Lào - Việt',
            backupTime: new Date().toISOString(),
            backupTimeFormatted: 'Bản sao 1 dự án',
            version: '1.0',
            totalProjects: 1,
            totalTasks: 0,
            projects: [singleProject],
            tasks: [],
            activeProjectId: singleProject.id
          });
        } else {
          throw new Error('Tệp không chứa dữ liệu dự án hợp lệ.');
        }
      } catch (err: any) {
        reject(new Error(err.message || 'Lỗi khi phân tích file sao lưu.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file từ máy tính.'));
    reader.readAsText(file);
  });
}
