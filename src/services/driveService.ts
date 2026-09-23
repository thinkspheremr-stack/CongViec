export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveUploadedFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
  mimeType: string;
  createdTime: string;
  thumbnailLink?: string;
}

const DEFAULT_ROOT_FOLDER_NAME = '📁 Ho_So_Tai_Lieu_Du_An_PM';

/**
 * Tìm hoặc tạo thư mục gốc cho tài liệu dự án trên Google Drive
 */
export async function ensureProjectRootFolder(
  token: string,
  customFolderName?: string
): Promise<DriveFolder> {
  const folderName = customFolderName || DEFAULT_ROOT_FOLDER_NAME;
  try {
    // 1. Tìm thư mục theo tên và mimeType folder
    const query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    // 2. Nếu chưa có thì tạo mới thư mục
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Thư mục lưu trữ tài liệu scan dự án quản lý',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Không thể tạo thư mục trên Google Drive: ${errText}`);
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink,
    };
  } catch (error) {
    console.error('Lỗi khởi tạo thư mục Google Drive:', error);
    throw error;
  }
}

/**
 * Tìm hoặc tạo thư mục riêng cho từng Dự án trên Google Drive
 */
export async function ensureProjectSubfolder(
  token: string,
  rootFolderId: string,
  projectCode: string,
  projectName: string
): Promise<DriveFolder> {
  const safeName = `📁 [${projectCode}] ${projectName}`;
  const query = `'${rootFolderId}' in parents and name = '${safeName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    // Tạo nếu chưa có
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
        description: `Thư mục lưu trữ dự án ${projectName}`,
      }),
    });

    if (!createRes.ok) {
      return { id: rootFolderId, name: safeName };
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink,
    };
  } catch {
    return { id: rootFolderId, name: safeName };
  }
}

/**
 * Tìm hoặc tạo thư mục con theo danh mục công việc (Category)
 */
export async function ensureCategorySubfolder(
  token: string,
  parentId: string,
  categoryName: string
): Promise<DriveFolder> {
  const safeName = `📁 ${categoryName}`;
  const query = `'${parentId}' in parents and name = '${safeName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    // Tạo nếu chưa có
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });

    if (!createRes.ok) {
      return { id: parentId, name: categoryName };
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink,
    };
  } catch {
    return { id: parentId, name: categoryName };
  }
}

/**
 * Tìm hoặc tạo thư mục theo tên chính xác trong thư mục cha trên Google Drive
 */
export async function ensureFolderByName(
  token: string,
  parentId: string,
  folderName: string,
  description?: string
): Promise<DriveFolder> {
  const cleanName = folderName.trim();
  const query = `'${parentId}' in parents and name = '${cleanName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
        description: description || `Thư mục ${cleanName}`,
      }),
    });

    if (!createRes.ok) {
      return { id: parentId, name: cleanName };
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink,
    };
  } catch {
    return { id: parentId, name: cleanName };
  }
}

/**
 * Tạo hoặc lấy thư mục phân cấp theo cấu trúc chuẩn:
 * [Năm] / [Tên dự án] / [Chi tiết | Các tài liệu kèm theo]
 * Ví dụ: 2026/11111111/Chi tiết/
 */
export async function ensureProjectHierarchicalFolder(
  token: string,
  rootFolderId: string,
  year: string,
  projectName: string,
  subFolderType: string
): Promise<{ folder: DriveFolder; pathString: string }> {
  const cleanYear = (year || new Date().getFullYear().toString()).trim();
  const cleanProjName = (projectName || 'Dự án').trim();

  // 1. Thư mục Năm (VD: 2026)
  const yearFolder = await ensureFolderByName(token, rootFolderId, cleanYear, `Thư mục năm ${cleanYear}`);

  // 2. Thư mục Dự án trong Năm (VD: 11111111)
  const projFolder = await ensureFolderByName(token, yearFolder.id, cleanProjName, `Dự án ${cleanProjName}`);

  // 3. Thư mục con bên trong Dự án (Chi tiết hoặc Tài liệu kèm theo)
  const subFolder = await ensureFolderByName(token, projFolder.id, subFolderType, `Mục ${subFolderType} của ${cleanProjName}`);

  const pathString = `${cleanYear}/${cleanProjName}/${subFolderType}/`;

  return {
    folder: subFolder,
    pathString,
  };
}

/**
 * Tải file/tài liệu scan trực tiếp lên Google Drive trong thư mục chỉ định
 */
export async function uploadDocumentToDrive(
  token: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<DriveUploadedFile> {
  const metadata = {
    name: fileName,
    mimeType: mimeType || fileBlob.type || 'image/jpeg',
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = '-------pm_drive_upload_boundary_' + Date.now();
  const multipartBody = new Blob([
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${mimeType || fileBlob.type || 'application/octet-stream'}\r\n\r\n`,
    fileBlob,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,mimeType,createdTime,thumbnailLink';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Tải lên Google Drive thất bại (${res.status}): ${errorBody}`);
  }

  const result = await res.json();
  return {
    id: result.id,
    name: result.name,
    webViewLink: result.webViewLink,
    webContentLink: result.webContentLink,
    size: result.size,
    mimeType: result.mimeType,
    createdTime: result.createdTime || new Date().toISOString(),
    thumbnailLink: result.thumbnailLink,
  };
}

/**
 * Liệt kê danh sách các tài liệu trong thư mục Google Drive
 */
export async function listDriveDocuments(
  token: string,
  folderId: string
): Promise<DriveUploadedFile[]> {
  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,webContentLink,size,mimeType,createdTime,thumbnailLink)&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Không thể tải danh sách tài liệu từ Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Lỗi lấy danh sách từ Drive:', error);
    return [];
  }
}

/**
 * Xóa file trên Google Drive (Lưu ý: Phải sau khi có xác nhận người dùng)
 */
export async function deleteDriveFile(
  token: string,
  fileId: string
): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Xóa file thất bại: ${err}`);
  }

  return true;
}

// Compatibility alias
export const getOrCreateFolder = ensureProjectRootFolder;
