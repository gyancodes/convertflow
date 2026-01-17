import React, { useState, useCallback } from "react";
import {
  convertImageToSvg,
  downloadSvg,
  validateImageFile,
  ConversionOptions,
} from "../utils/converter";
import {
  Upload,
  X,
  Download,
  Settings,
  Image as ImageIcon,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PreviewComparison } from "../components/preview/PreviewComparison";
import { motion, AnimatePresence } from "framer-motion";

interface ConversionFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  svgContent?: string;
  error?: string;
  originalSize: number;
  compressedSize?: number;
}

interface ConversionSettings {
  mode: "wrapper" | "vectorize";
  engine: "potrace" | "imagetracer";
  preset: string;
  numberOfColors: number;
  scale: number;
  strokeWidth: number;
  ltres: number;
  qtres: number;
  threshold: number;
  turdSize: number;
  optCurve: boolean;
  optTolerance: number;
}

export const ConverterPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>({
    mode: "vectorize",
    engine: "imagetracer",
    preset: "default",
    numberOfColors: 16,
    scale: 1,
    strokeWidth: 1,
    ltres: 1,
    qtres: 1,
    threshold: 128,
    turdSize: 2,
    optCurve: true,
    optTolerance: 0.2,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<ConversionFile | null>(null);

  // --- Logic Helpers ---
  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: ConversionFile[] = [];
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    Array.from(fileList).forEach((file) => {
      const error = validateImageFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}: File exceeds 50MB`);
        return;
      }
      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending",
        progress: 0,
        originalSize: file.size,
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const convertFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const conversionOptions: ConversionOptions = {
      mode: settings.mode,
      engine: settings.engine,
      threshold: settings.threshold,
      turdSize: settings.turdSize,
      optCurve: settings.optCurve,
      optTolerance: settings.optTolerance,
      numberOfColors: settings.numberOfColors,
      scale: settings.scale,
      strokeWidth: settings.strokeWidth,
      ltres: settings.ltres,
      qtres: settings.qtres,
      preset: settings.preset,
    };

    for (const fileData of files) {
      if (fileData.status === "completed") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: "processing", progress: 0 }
            : f,
        ),
      );

      try {
        const svgContent = await convertImageToSvg(
          fileData.file,
          conversionOptions,
        );
        const compressedSize = new Blob([svgContent]).size;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  svgContent,
                  compressedSize,
                }
              : f,
          ),
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: error instanceof Error ? error.message : "Failed",
                }
              : f,
          ),
        );
      }
    }
    setIsProcessing(false);
  };

  const downloadFile = (file: ConversionFile) => {
    if (file.svgContent) {
      downloadSvg(file.svgContent, file.file.name);
    }
  };

  const handlePreview = (file: ConversionFile) => {
    if (file.status === "completed" && file.svgContent) {
      setPreviewFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Settings Header Block */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg text-gray-900">Studio</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">
              Professional Converter
            </span>
          </div>
          <div>
            <a
              href="https://github.com/gyancodes/convertflow"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Panel: Settings */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-28">
                <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                  <Settings className="w-5 h-5 text-red-600" /> Control Panel
                </div>

                {/* Engine Selector */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Engine
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() =>
                          setSettings((s) => ({ ...s, engine: "imagetracer" }))
                        }
                        className={`flex items-center justify-between px-4 py-3 text-sm rounded-xl border-2 transition-all ${settings.engine === "imagetracer" ? "bg-red-50 border-red-500 text-red-700" : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"}`}
                      >
                        <span className="font-medium">ImageTracer</span>
                        {settings.engine === "imagetracer" && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setSettings((s) => ({ ...s, engine: "potrace" }))
                        }
                        className={`flex items-center justify-between px-4 py-3 text-sm rounded-xl border-2 transition-all ${settings.engine === "potrace" ? "bg-gray-900 border-gray-900 text-white" : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"}`}
                      >
                        <span className="font-medium">Potrace (B&W)</span>
                        {settings.engine === "potrace" && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mode Specific Settings */}
                  {settings.engine === "imagetracer" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Details
                        </label>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Colors</span>
                          <span>{settings.numberOfColors}</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="64"
                          value={settings.numberOfColors}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              numberOfColors: parseInt(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                      </div>
                    </div>
                  )}

                  {settings.engine === "potrace" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Threshold
                        </label>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Level</span>
                          <span>{settings.threshold}</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={settings.threshold}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              threshold: parseInt(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Upload & Preview */}
            <div className="lg:col-span-8 space-y-6">
              {/* Upload Area */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 p-12 text-center transition-all hover:border-red-400 hover:bg-red-50/10 group cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-red-50 group-hover:text-red-500 transition-all duration-300">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Drag & Drop Images
                </h3>
                <p className="text-gray-500">
                  Supports PNG, JPG, BMP up to 50MB
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      Queue{" "}
                      <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {files.length}
                      </span>
                    </h3>
                    <button
                      onClick={convertFiles}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${isProcessing ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"}`}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {isProcessing ? "Processing..." : "Convert Batch"}
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {files.map((file) => (
                        <motion.div
                          key={file.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="p-5 flex items-center gap-5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-400 relative overflow-hidden">
                            <ImageIcon className="w-7 h-7" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-bold text-gray-900 truncate">
                                {file.file.name}
                              </p>
                              <div className="flex items-center gap-2">
                                {file.status === "completed" && (
                                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Done
                                  </span>
                                )}
                                {file.status === "error" && (
                                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" /> Failed
                                  </span>
                                )}
                                {file.status === "pending" && (
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Ready
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className={`h-full ${file.status === "completed" ? "bg-green-500" : file.status === "error" ? "bg-red-500" : "bg-blue-500"}`}
                                initial={{ width: 0 }}
                                animate={{
                                  width:
                                    file.status === "completed"
                                      ? "100%"
                                      : `${file.progress}%`,
                                }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                            {file.status === "completed" && (
                              <>
                                <button
                                  onClick={() => handlePreview(file)}
                                  className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => downloadFile(file)}
                                  className="p-2.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                  title="Download SVG"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && previewFile.svgContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <PreviewComparison
              originalFile={previewFile.file}
              svgContent={previewFile.svgContent}
              filename={previewFile.file.name}
              onDownload={() => downloadFile(previewFile)}
              onClose={() => setPreviewFile(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
