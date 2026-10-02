export type TaskStatus = 'not_started' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';

export type DocumentType = 
  | 'contract'      // Hợp đồng & Phụ lục
  | 'acceptance'    // Biên bản nghiệm thu
  | 'drawing'       // Bản vẽ & Thiết kế
  | 'invoice'       // Hóa đơn & Chứng từ
  | 'report'        // Báo cáo tiến độ
  | 'minutes'       // Biên bản họp
  | 'other';        // Tài liệu khác

export interface ScannedDocument {
  id: string;
  name: string;
  type: DocumentType;
  projectId?: string;
  taskId?: string;
  category: string;
  driveFileId: string;
  driveViewLink: string;
  driveDownloadLink?: string;
  fileSize?: number;
  mimeType: string;
  uploadDate: string;
  scannedViaCamera?: boolean;
  thumbnailUrl?: string;
  description?: string;
}

export interface RelatedPackage {
  id: string;
  name: string;
  link: string;
  linkedProjectId?: string;
}

export interface ProjectDetailItem {
  id: string;
  stt: number;
  content: string;            // Nội dung
  day?: string;               // Ngày
  month?: string;             // Tháng
  year?: string;              // Năm
  docNumber?: string;         // Số (e.g. 128, 45)
  docText?: string;           // Text (e.g. /QĐ-BQLDA, /TB-KC)
  driveFileId?: string;       // ID file trên Drive
  driveFileName?: string;     // Tên file đính kèm
  driveFileLink?: string;     // Đường link xem trên Google Drive
  driveFilePath?: string;     // Đường dẫn Drive: ví dụ 2026/11111111/Chi tiết/tệp ABC.pdf
  isStartDateSelected?: boolean; // Tích chọn thời gian bắt đầu
}

export interface AttachedDocumentItem {
  id: string;
  stt: number;
  content: string;            // Nội dung
  day?: string;               // Ngày
  month?: string;             // Tháng
  year?: string;              // Năm
  docNumber?: string;         // Số
  docText?: string;           // Text
  driveFileId?: string;
  driveFileName?: string;
  driveFileLink?: string;
  driveFilePath?: string;     // Đường dẫn Drive: ví dụ 2026/11111111/Tài liệu kèm theo/tệp ABC.pdf
}

export interface AttachedDocSection {
  id: string;
  title: string;                              // Tiêu đề phần, vd: "Tài liệu kèm theo", "Tài liệu kèm theo 2"...
  note?: string;                              // 1 ô text (cần ghi lưu ý)
  storageLocation?: string;                   // - Hộp lưu trữ:
  items: AttachedDocumentItem[];              // Các dòng tài liệu kèm theo trong phần này
  convertedToProjectId?: string;              // ID dự án mới được tạo từ phần này
  convertedToProjectName?: string;            // Tên dự án mới
  convertedToProjectCode?: string;            // Mã dự án mới
  convertedAt?: string;                       // Thời gian chuyển đổi
}

export type ItemType = 'project' | 'package' | 'item';

export function getProjectItemTypes(project?: { itemTypes?: ItemType[]; itemType?: ItemType } | null): ItemType[] {
  if (!project) return ['project'];
  if (Array.isArray(project.itemTypes) && project.itemTypes.length > 0) {
    return project.itemTypes;
  }
  if (project.itemType) {
    return [project.itemType];
  }
  return ['project'];
}

export interface Project {
  id: string;
  code: string;            // e.g. "DA-01"
  name: string;            // Tên dự án / gói thầu / hạng mục
  itemType?: ItemType; // Dự án / Gói thầu / Hạng mục (fallback)
  itemTypes?: ItemType[]; // Chọn Dự án, Gói thầu, Hạng mục: có thể chọn 1, 2, hoặc cả 3 mục
  manager: string;         // 1. Quản lý chính (Phòng / ban quản lý)
  startMonth?: string;     // 2. Thời gian bắt đầu: Tháng
  startYear?: string;      // 2. Thời gian bắt đầu: Năm
  parentProjectId?: string; // ID dự án liên kết
  parentProject?: string;  // 3. Dự án thành phần thuộc dự án chính
  relatedPackages?: RelatedPackage[]; // 4. Dự án liên quan: + gói thầu : 1 ... link
  projectKind?: 'sub' | 'main'; // 3. Dự án này là: Dự án thành phần / Dự án chính
  nationalBidding?: 'yes' | 'no'; // 4. Đấu thầu quốc gia không: Có / Không
  objectives?: string;     // 5. Mục tiêu
  notes?: string;          // 6. Note :
  detailTitle?: string;                      // Tiêu đề phần Chi tiết (có thể sửa, mặc định: "Chi tiết")
  detailNote?: string;                       // Ghi chú nhanh cho phần Chi tiết (giống phần Tài liệu kèm theo)
  detailItems?: ProjectDetailItem[];         // Chi tiết các mốc
  detailStorageLocation?: string;            // - Hộp lưu: (cho mục Chi tiết)
  storageLocation?: string;                  // - Hộp lưu: (tổng thể)
  attachedDocuments?: AttachedDocumentItem[]; // Tài liệu kèm theo (phần 1 / legacy fallback)
  attachedDocsNote?: string;                  // Ghi chú / text ở tài liệu kèm theo (phần 1)
  attachedSections?: AttachedDocSection[];    // Danh sách các phần tài liệu kèm theo
  description?: string;
  budget?: string;
  status: ProjectStatus;
  holdReason?: string;                        // Lý do dừng thực hiện (khi trạng thái on_hold / Dừng thực hiện)
  startDate: string;
  targetDate: string;
  color?: string;
  driveFolderPath?: string; // Đường dẫn thư mục Drive: ví dụ "2026/11111111/"
  driveFolderId?: string;
  driveFolderLink?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  projectId: string;       // ID dự án
  code: string;           // e.g. "PM-01"
  title: string;
  description: string;
  category: string;       // e.g. "Khảo sát & Kế hoạch"
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;       // 0 to 100
  assignee: string;
  startDate: string;
  dueDate: string;
  documents: ScannedDocument[];
  budget?: string;
  notes?: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  driveFolderId?: string;
}

export interface DriveConfig {
  rootFolderId: string | null;
  rootFolderName: string;
  isConnected: boolean;
  userEmail: string | null;
  userDisplayName: string | null;
  userPhotoUrl: string | null;
  lastSynced: string | null;
}
