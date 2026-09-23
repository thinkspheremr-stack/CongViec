import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  RefreshCw, 
  RotateCw, 
  Check, 
  FolderSync, 
  AlertCircle,
  FileText,
  FileCheck2,
  Image as ImageIcon,
  ExternalLink,
  Layers,
  Sparkles,
  Building2
} from 'lucide-react';
import { TaskItem, DocumentType, ScannedDocument, Project } from '../types';
import { ensureCategorySubfolder, ensureProjectSubfolder, uploadDocumentToDrive } from '../services/driveService';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  projects?: Project[];
  activeProjectId?: string;
  defaultTaskId?: string;
  driveToken: string | null;
  driveRootFolderId: string | null;
  onSaveDocument: (doc: ScannedDocument, taskId?: string) => void;
  onGoogleSignIn: () => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  projects = [],
  activeProjectId,
  defaultTaskId,
  driveToken,
  driveRootFolderId,
  onSaveDocument,
  onGoogleSignIn
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || projects[0]?.id || '');

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Filter & enhancement
  const [filterMode, setFilterMode] = useState<'original' | 'document_bw' | 'enhanced'>('enhanced');
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);

  // Upload file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Document metadata form
  const [selectedTaskId, setSelectedTaskId] = useState<string>(defaultTaskId || '');
  const [documentName, setDocumentName] = useState<string>('');
  const [docType, setDocType] = useState<DocumentType>('acceptance');
  const [docNotes, setDocNotes] = useState<string>('');

  // Processing and upload status
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [uploadSuccessResult, setUploadSuccessResult] = useState<{
    link: string;
    docName: string;
    driveId: string;
  } | null>(null);

  // Set default task or name when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultTaskId) {
        setSelectedTaskId(defaultTaskId);
        const task = tasks.find(t => t.id === defaultTaskId);
        if (task) {
          if (task.projectId) {
            setSelectedProjectId(task.projectId);
          }
          setDocumentName(`Tai_Lieu_${task.code}_${new Date().toISOString().slice(0, 10)}`);
        }
      } else {
        if (activeProjectId) {
          setSelectedProjectId(activeProjectId);
        } else if (projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projects[0].id);
        }
        if (!documentName) {
          setDocumentName(`Scan_Ho_So_PM_${new Date().toISOString().slice(0, 10)}`);
        }
      }
      setUploadSuccessResult(null);
    }
  }, [isOpen, defaultTaskId, tasks, activeProjectId, projects]);

  // Start Camera when tab is camera
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Lỗi mở camera:', err);
      setCameraError(
        'Không thể mở camera. Vui lòng cho phép quyền truy cập máy ảnh hoặc chuyển sang tính năng chọn/tải tệp ảnh.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setRotationDegrees(0);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRotationDegrees(0);
    startCamera();
  };

  const handleRotate = () => {
    setRotationDegrees(prev => (prev + 90) % 360);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    if (!documentName) {
      setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Convert canvas/image with applied filters and rotation to Blob
  const processImageToBlob = async (dataUrl: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Handle rotation dimensions
        const isRotated = rotationDegrees % 180 !== 0;
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationDegrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Apply document filter
        if (filterMode !== 'original') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          if (filterMode === 'document_bw') {
            for (let i = 0; i < d.length; i += 4) {
              const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const val = gray > 140 ? 255 : gray * 0.7;
              d[i] = val;
              d[i + 1] = val;
              d[i + 2] = val;
            }
          } else if (filterMode === 'enhanced') {
            for (let i = 0; i < d.length; i += 4) {
              d[i] = Math.min(255, Math.max(0, (d[i] - 128) * 1.25 + 128));
              d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * 1.25 + 128));
              d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * 1.25 + 128));
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        canvas.toBlob(
          (blob) => {
            resolve(blob || new Blob([], { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.90
        );
      };
      img.src = dataUrl;
    });
  };

  const handleSaveAndUpload = async () => {
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const category = selectedTask ? selectedTask.category : 'Hồ sơ chung';
    const finalDocName = documentName.trim() || `Tai_Lieu_${Date.now()}`;
    
    setIsUploading(true);
    setUploadProgressText('Đang xử lý tài liệu...');

    try {
      let fileBlob: Blob;
      let mimeType = 'image/jpeg';
      let fileName = finalDocName.endsWith('.jpg') || finalDocName.endsWith('.pdf') 
        ? finalDocName 
        : `${finalDocName}.jpg`;

      if (activeTab === 'camera' && capturedImage) {
        fileBlob = await processImageToBlob(capturedImage);
        mimeType = 'image/jpeg';
      } else if (uploadedFile) {
        fileBlob = uploadedFile;
        mimeType = uploadedFile.type || 'application/octet-stream';
        fileName = finalDocName.includes('.') ? finalDocName : `${finalDocName}_${uploadedFile.name}`;
      } else {
        throw new Error('Vui lòng chụp ảnh tài liệu hoặc chọn file từ thiết bị.');
      }

      let driveFileId = `local-${Date.now()}`;
      let driveViewLink = '';
      let driveDownloadLink = '';

      // Upload to Google Drive if token and root folder exist
      if (driveToken && driveRootFolderId) {
        setUploadProgressText('Đang kết nối thư mục trên Google Drive...');
        
        let destinationFolderId = driveRootFolderId;

        // If a project is selected, ensure project subfolder exists
        const currentProject = projects.find(p => p.id === selectedProjectId);
        if (currentProject) {
          setUploadProgressText(`Đang kết nối thư mục dự án [${currentProject.code}]...`);
          const projectFolder = await ensureProjectSubfolder(
            driveToken,
            driveRootFolderId,
            currentProject.code,
            currentProject.name
          );
          destinationFolderId = projectFolder.id;
        }

        // Find or create category folder inside target project folder
        const categoryFolder = await ensureCategorySubfolder(
          driveToken,
          destinationFolderId,
          category
        );

        setUploadProgressText(`Đang tải file lên thư mục Google Drive (${categoryFolder.name})...`);
        const uploadResult = await uploadDocumentToDrive(
          driveToken,
          fileBlob,
          fileName,
          mimeType,
          categoryFolder.id
        );

        driveFileId = uploadResult.id;
        driveViewLink = uploadResult.webViewLink;
        driveDownloadLink = uploadResult.webContentLink || uploadResult.webViewLink;
      }

      // Create ScannedDocument model
      const newDoc: ScannedDocument = {
        id: `doc-${Date.now()}`,
        name: fileName,
        type: docType,
        projectId: selectedProjectId || undefined,
        taskId: selectedTaskId || undefined,
        category,
        driveFileId,
        driveViewLink: driveViewLink || 'https://drive.google.com',
        driveDownloadLink,
        fileSize: fileBlob.size,
        mimeType,
        uploadDate: new Date().toISOString().slice(0, 10),
        scannedViaCamera: activeTab === 'camera',
        description: docNotes
      };

      onSaveDocument(newDoc, selectedTaskId || undefined);

      setUploadSuccessResult({
        link: driveViewLink,
        docName: fileName,
        driveId: driveFileId
      });
    } catch (err: any) {
      console.error('Lỗi lưu/upload tài liệu:', err);
      alert(`Lỗi: ${err.message || 'Không thể tải tài liệu'}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setCapturedImage(null);
    setUploadedFile(null);
    setFilePreview(null);
    setUploadSuccessResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Scan &amp; Tải Tài Liệu Lên Google Drive
              </h2>
              <p className="text-xs text-slate-400">
                Lưu trữ hợp đồng, bản vẽ, biên bản nghiệm thu trực tiếp vào thư mục
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View Screen */}
        {uploadSuccessResult ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-xl font-bold text-slate-100">
                Lưu Tài Liệu Thành Công
              </h3>
              <p className="text-sm text-slate-300 font-medium">
                {uploadSuccessResult.docName}
              </p>
              <p className="text-xs text-slate-400">
                {driveToken 
                  ? 'Tài liệu đã được lưu an toàn trong thư mục dự án trên Google Drive.'
                  : 'Tài liệu đã được lưu trong ứng dụng quản lý công việc dự án.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {uploadSuccessResult.link && (
                <a
                  href={uploadSuccessResult.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở trên Google Drive</span>
                </a>
              )}
              <button
                onClick={() => {
                  setUploadSuccessResult(null);
                  setCapturedImage(null);
                  setUploadedFile(null);
                  setFilePreview(null);
                  if (activeTab === 'camera') startCamera();
                }}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Scan tiếp tài liệu khác</span>
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          </div>
        ) : (
          /* Main Scan/Upload Layout */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Camera View or File Picker (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              
              {/* Method Switcher Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    setCapturedImage(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'camera'
                      ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Máy ảnh Scan (Camera)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    stopCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải từ thiết bị</span>
                </button>
              </div>

              {/* Viewport for Camera */}
              {activeTab === 'camera' && (
                <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner">
                  {!capturedImage ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Document Guideline Overlay */}
                      <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-emerald-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1"></div>
                          <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1"></div>
                        </div>
                        <div className="text-center">
                          <span className="bg-slate-900/80 text-emerald-300 text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xs">
                            Đặt tài liệu vào giữa khung ngắm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1"></div>
                          <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1"></div>
                        </div>
                      </div>

                      {/* Camera Controls Overlay */}
                      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between px-4">
                        <button
                          type="button"
                          onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')}
                          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-xs transition-colors cursor-pointer"
                          title="Đổi camera trước/sau"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          id="btn-trigger-capture"
                          type="button"
                          onClick={handleCapture}
                          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 border-4 border-white/80 shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                          title="Chụp scan tài liệu"
                        >
                          <div className="w-6 h-6 rounded-full bg-white"></div>
                        </button>
                        <div className="w-10"></div>
                      </div>

                      {cameraError && (
                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                          <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-4">
                            {cameraError}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium cursor-pointer"
                          >
                            Chuyển sang chọn file từ máy
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Captured Image Preview with Filters */
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
                      <img
                        src={capturedImage}
                        alt="Scanned Document"
                        style={{
                          transform: `rotate(${rotationDegrees}deg)`,
                          filter: 
                            filterMode === 'document_bw' 
                              ? 'grayscale(100%) contrast(160%) brightness(105%)' 
                              : filterMode === 'enhanced'
                              ? 'contrast(125%) saturate(115%)'
                              : 'none'
                        }}
                        className="max-h-full max-w-full object-contain rounded-md shadow-md transition-all duration-200"
                      />

                      {/* Captured Actions Bar */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Chụp lại</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleRotate}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title="Xoay 90°"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Viewport for File Upload */}
              {activeTab === 'upload' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-950 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {filePreview ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-52 object-contain rounded-lg border border-slate-800 mb-2"
                      />
                      <span className="text-xs text-emerald-400 font-medium truncate max-w-xs">
                        {uploadedFile?.name} ({(uploadedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">Nhấn để chọn file khác</span>
                    </div>
                  ) : uploadedFile ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                        <FileText className="w-7 h-7" />
                      </div>
                      <span className="text-sm font-semibold text-slate-200">
                        {uploadedFile.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Tài liệu PDF
                      </span>
                      <button
                        type="button"
                        className="text-xs text-emerald-400 hover:underline pt-1 cursor-pointer"
                      >
                        Đổi file khác
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-200">
                          Kéo thả hoặc nhấn để chọn tài liệu
                        </p>
                        <p className="text-xs text-slate-400">
                          Hình scan (JPG, PNG, WEBP) và file hồ sơ PDF (tối đa 25MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filter controls if captured */}
              {capturedImage && activeTab === 'camera' && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Chế độ ảnh
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterMode('enhanced')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        filterMode === 'enhanced'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Sắc nét (Khuyên dùng)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('document_bw')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        filterMode === 'document_bw'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Đen trắng (Scan rõ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('original')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        filterMode === 'original'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Gốc
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Metadata & Destination Folder (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                
                {/* Google Drive Status Notification */}
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  driveToken 
                    ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200' 
                    : 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                }`}>
                  <FolderSync className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {driveToken ? (
                      <div>
                        <span className="font-semibold text-emerald-300 block">
                          Sẵn sàng lưu trên Google Drive
                        </span>
                        <span className="text-[11px] text-emerald-400/80">
                          Tài liệu tự động phân loại vào folder dự án theo WBS.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-amber-300 block">
                          Chưa kết nối Google Drive
                        </span>
                        <p className="text-[11px] text-amber-300/80">
                          Đăng nhập Google để tài liệu scan đẩy thẳng lên Drive của bạn.
                        </p>
                        <button
                          type="button"
                          onClick={onGoogleSignIn}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Kết nối Google Drive ngay
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form: Document Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Tên tài liệu / Hồ sơ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="VD: Bien_ban_nghiem_thu_dot_1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Form: Associated Project */}
                {projects.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Thuộc dự án trên Google Drive</span>
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedTaskId('');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Form: Document Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Phân loại
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="acceptance">Biên bản Nghiệm thu &amp; Bàn giao</option>
                    <option value="contract">Hợp đồng &amp; Phụ lục</option>
                    <option value="drawing">Bản vẽ thiết kế &amp; Kỹ thuật</option>
                    <option value="report">Báo cáo tiến độ &amp; Khảo sát</option>
                    <option value="invoice">Hóa đơn &amp; Chứng từ tài chính</option>
                    <option value="minutes">Biên bản họp &amp; Chỉ đạo</option>
                    <option value="other">Tài liệu khác</option>
                  </select>
                </div>

                {/* Form: Associated Task */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Gắn vào công việc (WBS)
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Tài liệu chung dự án (Không gắn task) --</option>
                    {(selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : tasks).map(task => (
                      <option key={task.id} value={task.id}>
                        [{task.code}] {task.title} ({task.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form: Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Ghi chú nội dung
                  </label>
                  <textarea
                    rows={2}
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="VD: Biên bản nghiệm thu có chữ ký của bên A và bên B..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  id="btn-upload-to-drive-confirm"
                  type="button"
                  disabled={isUploading || (!capturedImage && !uploadedFile)}
                  onClick={handleSaveAndUpload}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{uploadProgressText || 'Đang tải lên...'}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>
                        {driveToken ? 'Lưu & Tải lên Google Drive' : 'Lưu vào ứng dụng'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  {!capturedImage && !uploadedFile 
                    ? 'Chụp ảnh hoặc chọn file trước khi lưu'
                    : 'Tài liệu sẽ được lưu và có đường dẫn truy cập trực tiếp'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
