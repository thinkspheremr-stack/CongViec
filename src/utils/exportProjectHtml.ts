import { Project } from '../types';

/**
 * Tải xuống file HTML đẹp chứa toàn bộ nội dung chi tiết dự án.
 * Người nhận file chỉ cần nhấp đúp là mở ra xem được ngay trên mọi trình duyệt
 * (Chrome, Edge, Safari, Firefox, Cốc Cốc...) trên máy tính hoặc điện thoại mà không cần cài thêm phần mềm.
 */
export function exportProjectToStandaloneHtml(project: Project) {
  const sanitize = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatMultiline = (text?: string) => {
    if (!text) return '<span class="empty-text">Chưa ghi</span>';
    return sanitize(text).replace(/\n/g, '<br/>');
  };

  const projectCode = sanitize(project.code || 'DA');
  const projectName = sanitize(project.name || 'Dự án');
  const manager = sanitize(project.manager || 'Chưa phân công');
  const startMonth = sanitize(project.startMonth || '');
  const startYear = sanitize(project.startYear || '');
  const projectKindText = project.projectKind === 'main' ? 'Dự án chính' : 'Dự án thành phần';
  const nationalBiddingText = project.nationalBidding === 'yes' ? 'Có' : 'Không';
  const objectives = formatMultiline(project.objectives);
  const notes = formatMultiline(project.notes);
  const driveFolderPath = sanitize(project.driveFolderPath || '');
  const driveFolderLink = project.driveFolderLink || (driveFolderPath ? `https://drive.google.com` : '');
  const detailStorageLocation = formatMultiline(project.detailStorageLocation || project.storageLocation);

  // Rows for Table 1: Chi tiết
  const detailRows = (project.detailItems || []).map((item, idx) => {
    const isSelected = item.isStartDateSelected;
    const stt = item.stt || idx + 1;
    const content = formatMultiline(item.content);
    const day = sanitize(item.day || '');
    const month = sanitize(item.month || '');
    const year = sanitize(item.year || '');
    const docNumber = sanitize(item.docNumber || '');
    const docText = sanitize(item.docText || '');
    const driveLink = item.driveFileLink ? `<a href="${sanitize(item.driveFileLink)}" target="_blank" class="drive-link">🔗 ${sanitize(item.driveFileName || 'Xem tệp')}</a>` : (item.driveFileName ? `<span class="drive-file">📄 ${sanitize(item.driveFileName)}</span>` : '<span class="empty-text">-</span>');
    const radioCheck = isSelected ? '<div class="radio-checked" title="Mốc thời gian bắt đầu">✓</div>' : '<div class="radio-unchecked"></div>';

    return `
      <tr class="${isSelected ? 'selected-row' : ''}">
        <td class="text-center font-bold">${stt}</td>
        <td class="content-cell">${content}</td>
        <td class="text-center font-mono">${day}</td>
        <td class="text-center font-mono">${month}</td>
        <td class="text-center font-mono">${year}</td>
        <td class="text-center font-mono font-bold">${docNumber}</td>
        <td class="font-mono">${docText}</td>
        <td class="text-center">${driveLink}</td>
        <td class="text-center">${radioCheck}</td>
      </tr>
    `;
  }).join('');

  // Attached sections (Table 2...)
  const sectionsHtml = (project.attachedSections || []).map((sec, secIdx) => {
    const secTitle = sanitize(sec.title || `Tài liệu kèm theo ${secIdx + 1}`);
    const secNote = formatMultiline(sec.note);
    const secStorage = formatMultiline(sec.storageLocation);
    
    const itemRows = (sec.items || []).map((item, idx) => {
      const stt = item.stt || idx + 1;
      const content = formatMultiline(item.content);
      const day = sanitize(item.day || '');
      const month = sanitize(item.month || '');
      const year = sanitize(item.year || '');
      const docNumber = sanitize(item.docNumber || '');
      const docText = sanitize(item.docText || '');
      const driveLink = item.driveFileLink ? `<a href="${sanitize(item.driveFileLink)}" target="_blank" class="drive-link">🔗 ${sanitize(item.driveFileName || 'Xem tệp')}</a>` : (item.driveFileName ? `<span class="drive-file">📄 ${sanitize(item.driveFileName)}</span>` : '<span class="empty-text">-</span>');

      return `
        <tr>
          <td class="text-center font-bold">${stt}</td>
          <td class="content-cell">${content}</td>
          <td class="text-center font-mono">${day}</td>
          <td class="text-center font-mono">${month}</td>
          <td class="text-center font-mono">${year}</td>
          <td class="text-center font-mono font-bold">${docNumber}</td>
          <td class="font-mono">${docText}</td>
          <td class="text-center">${driveLink}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="section-block">
        <div class="section-header">
          <h3 class="section-title">${secTitle} :</h3>
        </div>
        ${sec.note ? `
          <div class="note-box">
            <strong>Ghi chú:</strong> ${secNote}
          </div>
        ` : ''}
        <table class="tech-table">
          <thead>
            <tr>
              <th rowspan="2" class="w-stt">STT</th>
              <th rowspan="2" class="w-content">Nội dung</th>
              <th colspan="3" class="text-center">Thời gian</th>
              <th colspan="2" class="text-center">Số văn bản</th>
              <th rowspan="2" class="w-drive text-center">Lưu Drive</th>
            </tr>
            <tr class="sub-head">
              <th class="w-date">Ngày</th>
              <th class="w-date">Tháng</th>
              <th class="w-year">Năm</th>
              <th class="w-number">Số</th>
              <th class="w-text">Text</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || '<tr><td colspan="8" class="text-center empty-text py-4">Chưa có dòng dữ liệu nào</td></tr>'}
          </tbody>
        </table>
        <div class="storage-box">
          <span class="storage-label">- Hộp lưu trữ:</span>
          <div class="storage-content">${secStorage}</div>
        </div>
      </div>
    `;
  }).join('');

  // Related Packages
  const relatedPackagesHtml = (project.relatedPackages || []).length > 0 ? `
    <div class="info-row">
      <div class="info-label">3.2. Dự án liên quan:</div>
      <div class="info-value">
        <ul class="packages-list">
          ${project.relatedPackages!.map(pkg => `
            <li>
              <strong>+ ${sanitize(pkg.name)}</strong>
              ${pkg.link ? ` - <a href="${sanitize(pkg.link)}" target="_blank" class="text-link">[ Liên kết ]</a>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  ` : '';

  const exportDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[${projectCode}] ${projectName} - Hồ sơ chi tiết dự án</title>
  <style>
    :root {
      --primary: #059669;
      --primary-dark: #065f46;
      --primary-light: #ecfdf5;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f1f5f9;
      padding: 24px 16px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    /* Action bar for viewer */
    .viewer-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #059669;
    }
    .viewer-title {
      font-size: 13px;
      font-weight: 600;
      color: #a7f3d0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #047857;
    }
    /* Document Sheet Header */
    .sheet-header {
      padding: 24px 32px 16px;
      border-bottom: 2px solid #e2e8f0;
      background: #fafafa;
    }
    .company-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      color: #047857;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .sheet-main-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .sheet-subtitle {
      font-size: 12px;
      color: #64748b;
    }
    /* Content body */
    .sheet-body {
      padding: 28px 32px;
    }
    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    @media (min-width: 640px) {
      .info-row {
        flex-direction: row;
        align-items: flex-start;
      }
    }
    .info-label {
      font-weight: 700;
      font-size: 14px;
      color: #0f172a;
      min-width: 220px;
      flex-shrink: 0;
    }
    .info-value {
      font-size: 14px;
      color: #334155;
      flex: 1;
      word-break: break-word;
    }
    .badge-code {
      display: inline-block;
      background: #065f46;
      color: #a7f3d0;
      font-family: monospace;
      font-weight: bold;
      font-size: 13px;
      padding: 2px 8px;
      border-radius: 6px;
      margin-right: 8px;
    }
    .packages-list {
      list-style: none;
      padding-left: 0;
      margin-top: 4px;
    }
    .packages-list li {
      padding: 4px 0;
      font-size: 13px;
    }
    /* Tables */
    .section-block {
      margin-top: 28px;
    }
    .section-header {
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .tech-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 12px;
      border: 1px solid #334155;
    }
    .tech-table th, .tech-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      vertical-align: top;
    }
    .tech-table thead tr:first-child th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
    }
    .tech-table thead tr.sub-head th {
      background: #1e293b;
      color: #cbd5e1;
      font-weight: 600;
      font-size: 11px;
    }
    .tech-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .tech-table tbody tr:hover {
      background: #f1f5f9;
    }
    .tech-table tr.selected-row {
      background-color: #e0f2fe;
    }
    .w-stt { width: 48px; text-align: center; }
    .w-content { min-width: 260px; }
    .w-date { width: 52px; text-align: center; }
    .w-year { width: 64px; text-align: center; }
    .w-number { width: 70px; text-align: center; }
    .w-text { width: 110px; }
    .w-drive { min-width: 130px; text-align: center; }
    .w-check { width: 50px; text-align: center; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .font-mono { font-family: monospace; }
    .content-cell {
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    .drive-link {
      color: #047857;
      font-weight: 600;
      text-decoration: none;
      font-size: 12px;
      word-break: break-all;
    }
    .drive-link:hover {
      text-decoration: underline;
    }
    .drive-file {
      font-size: 12px;
      color: #334155;
    }
    .radio-checked {
      width: 22px;
      height: 22px;
      background: #0284c7;
      color: #ffffff;
      border-radius: 4px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
    }
    .radio-unchecked {
      width: 18px;
      height: 18px;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      margin: 0 auto;
    }
    /* Hộp lưu trữ */
    .storage-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 8px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    @media (min-width: 640px) {
      .storage-box {
        flex-direction: row;
        align-items: flex-start;
      }
    }
    .storage-label {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      min-width: 140px;
      flex-shrink: 0;
    }
    .storage-content {
      font-size: 13px;
      color: #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      flex: 1;
    }
    .note-box {
      background: #fefce8;
      border: 1px solid #fef08a;
      color: #854d0e;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .empty-text {
      color: #94a3b8;
      font-style: italic;
    }
    /* Footer */
    .sheet-footer {
      padding: 16px 32px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    /* Print styles */
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border: none;
        max-width: 100%;
      }
      .viewer-bar {
        display: none !important;
      }
      .tech-table th, .tech-table td {
        border-color: #000000 !important;
      }
      .tech-table thead tr:first-child th {
        background: #f1f5f9 !important;
        color: #000000 !important;
      }
      .tech-table thead tr.sub-head th {
        background: #f8fafc !important;
        color: #000000 !important;
      }
      .btn-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Top viewer bar with direct print / PDF trigger -->
    <div class="viewer-bar">
      <div class="viewer-title">
        <span>📑 HỒ SƠ DỰ ÁN CHI TIẾT</span>
        <span>•</span>
        <span>Định dạng mở trực tiếp bằng mọi trình duyệt</span>
      </div>
      <div>
        <button class="btn-print" onclick="window.print()">
          🖨️ In / Xuất file PDF
        </button>
      </div>
    </div>

    <!-- Sheet Header -->
    <div class="sheet-header">
      <div class="company-title">Công ty CP Cảng Quốc tế Lào - Việt</div>
      <h1 class="sheet-main-title">
        <span class="badge-code">${projectCode}</span>
        ${projectName}
      </h1>
      <div class="sheet-subtitle">
        Biểu quản lý thông tin mốc dự án, tiến độ thi công &amp; lưu trữ hồ sơ
      </div>
    </div>

    <!-- Sheet Body -->
    <div class="sheet-body">
      <!-- Thông tin chung -->
      <div class="info-grid">
        <div class="info-row">
          <div class="info-label">Vị trí lưu trữ trên Google Drive:</div>
          <div class="info-value">
            <span class="font-mono font-bold" style="color:#059669">${driveFolderPath || '(Chưa chỉ định)'}</span>
            ${driveFolderLink ? ` &nbsp; &nbsp; <a href="${sanitize(driveFolderLink)}" target="_blank" class="drive-link">Mở thư mục Google Drive ↗</a>` : ''}
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">1. Quản lý chính:</div>
          <div class="info-value"><strong>${manager}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">2. Thời gian bắt đầu:</div>
          <div class="info-value">
            Tháng <strong>${startMonth || '--'}</strong> &nbsp;/&nbsp; Năm <strong>${startYear || '----'}</strong>
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">3. Phân loại dự án:</div>
          <div class="info-value">
            <strong>${projectKindText}</strong>
            ${project.parentProject ? ` (Thuộc: <em>${sanitize(project.parentProject)}</em>)` : ''}
          </div>
        </div>
        ${relatedPackagesHtml}
        <div class="info-row">
          <div class="info-label">4. Đấu thầu quốc gia:</div>
          <div class="info-value"><strong>${nationalBiddingText}</strong></div>
        </div>
        ${project.objectives ? `
          <div class="info-row">
            <div class="info-label">5. Mục tiêu:</div>
            <div class="info-value">${objectives}</div>
          </div>
        ` : ''}
        ${project.notes ? `
          <div class="info-row">
            <div class="info-label">6. Ghi chú (Note):</div>
            <div class="info-value">${notes}</div>
          </div>
        ` : ''}
      </div>

      <!-- BẢNG 1: CHI TIẾT -->
      <div class="section-block">
        <div class="section-header">
          <h2 class="section-title">${sanitize(project.detailTitle || 'Chi tiết')} :</h2>
        </div>
        ${project.detailNote ? `
          <div class="note-box">
            <strong>Ghi chú:</strong> ${formatMultiline(project.detailNote)}
          </div>
        ` : ''}
        <table class="tech-table">
          <thead>
            <tr>
              <th rowspan="2" class="w-stt">STT</th>
              <th rowspan="2" class="w-content">Nội dung</th>
              <th colspan="3" class="text-center">Thời gian</th>
              <th colspan="2" class="text-center">Số văn bản</th>
              <th rowspan="2" class="w-drive text-center">Lưu Drive</th>
              <th rowspan="2" class="w-check text-center">Chọn</th>
            </tr>
            <tr class="sub-head">
              <th class="w-date">Ngày</th>
              <th class="w-date">Tháng</th>
              <th class="w-year">Năm</th>
              <th class="w-number">Số</th>
              <th class="w-text">Text</th>
            </tr>
          </thead>
          <tbody>
            ${detailRows || '<tr><td colspan="9" class="text-center empty-text py-4">Chưa có dòng dữ liệu nào</td></tr>'}
          </tbody>
        </table>
        <!-- - Hộp lưu: -->
        <div class="storage-box">
          <span class="storage-label">- Hộp lưu :</span>
          <div class="storage-content">${detailStorageLocation}</div>
        </div>
      </div>

      <!-- BẢNG 2: TÀI LIỆU KÈM THEO (CÁC PHẦN) -->
      ${sectionsHtml}
    </div>

    <!-- Footer -->
    <div class="sheet-footer">
      <div>Công ty CP Cảng Quốc tế Lào - Việt • Hệ thống Quản Lý Dự Án</div>
      <div>Xuất lúc: ${exportDate}</div>
    </div>
  </div>
</body>
</html>`;

  // Trigger browser download
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFilename = `${projectCode}_${projectName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')}`.slice(0, 60);
  link.href = url;
  link.download = `Ho_so_${safeFilename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất dữ liệu JSON để sao lưu hoặc người khác nạp (Import) vào app
 */
export function exportProjectToJson(project: Project) {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFilename = `${project.code || 'DA'}_${(project.name || 'Du_an').replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')}`.slice(0, 60);
  link.href = url;
  link.download = `Du_lieu_du_an_${safeFilename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Đọc file JSON và chuyển đổi thành Project object
 */
export function parseProjectFromJson(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Định dạng file không hợp lệ.');
        }
        resolve(parsed as Project);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
    reader.readAsText(file);
  });
}
