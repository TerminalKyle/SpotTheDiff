import React, { useState, useCallback, useEffect } from 'react';
import { FileText, X, Download, Copy, Settings, GitCompare, FileCode, FileImage, FileArchive, Minus, Square, X as CloseIcon } from 'lucide-react';
import * as diff from 'diff';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from './components/ui/file-upload';
import { AuroraBackground } from './components/ui/aurora-background';
import { Compare } from './components/ui/compare';
import { SideBySideDiff } from './components/ui/side-by-side-diff';
import CoverDemo from './components/cover-demo';
import FloatingDockDemo from './components/floating-dock-demo';
import { getCurrentWindow } from '@tauri-apps/api/window';


interface FileData {
  name: string;
  content: string;
  size: string;
  type: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

function App() {
  const [files, setFiles] = useState<{ left?: FileData; right?: FileData }>({});
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'diff' | 'visual'>('upload');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<'unified' | 'side-by-side'>('unified');


  const minimizeWindow = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const maximizeWindow = async () => {
    try {
      await getCurrentWindow().toggleMaximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const closeWindow = async () => {
    try {
      await getCurrentWindow().close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
      case 'md':
        return <FileCode className="w-5 h-5" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FileImage className="w-5 h-5" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileArchive className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const readFile = (file: File): Promise<FileData> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve({
          name: file.name,
          content,
          size: formatFileSize(file.size),
          type: file.type || 'text/plain'
        });
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = useCallback(async (uploadedFiles: File[], side: 'left' | 'right') => {
    if (uploadedFiles.length > 0) {
      const fileData = await readFile(uploadedFiles[0]);
      setFiles(prev => ({ ...prev, [side]: fileData }));
    }
  }, []);

  const generateDiff = useCallback(() => {
    if (!files.left?.content || !files.right?.content) return;

    const diffOptions = {
      ignoreWhitespace,
      ignoreCase: false,
      context: 3
    };

    const diffResult = diff.diffLines(
      files.left.content,
      files.right.content,
      diffOptions
    );

    const processedDiff: DiffLine[] = [];
    let lineNumber = 1;

    diffResult.forEach((part) => {
      if (part.added) {
        part.value.split('\n').forEach((line) => {
          if (line !== '') {
            processedDiff.push({
              type: 'added',
              content: line,
              lineNumber: lineNumber++
            });
          }
        });
      } else if (part.removed) {
        part.value.split('\n').forEach((line) => {
          if (line !== '') {
            processedDiff.push({
              type: 'removed',
              content: line,
              lineNumber: lineNumber++
            });
          }
        });
      } else {
        part.value.split('\n').forEach((line) => {
          if (line !== '') {
            processedDiff.push({
              type: 'unchanged',
              content: line,
              lineNumber: lineNumber++
            });
          }
        });
      }
    });

    setDiffResult(processedDiff);
  }, [files.left?.content, files.right?.content, ignoreWhitespace]);

  const clearFiles = (side?: 'left' | 'right') => {
    if (side) {
      setFiles(prev => ({ ...prev, [side]: undefined }));
    } else {
      setFiles({});
      setDiffResult([]);
    }
  };

  const copyDiffToClipboard = () => {
    const diffText = diffResult
      .map(line => {
        const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
        return `${prefix} ${line.content}`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(diffText);
  };

  const downloadDiff = () => {
    const diffText = diffResult
      .map(line => {
        const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
        return `${prefix} ${line.content}`;
      })
      .join('\n');
    
    const blob = new Blob([diffText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff-result.diff';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (files.left && files.right) {
      generateDiff();
      setActiveTab('diff');
    }
  }, [files.left, files.right, generateDiff]);

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full">

        <div className="fixed top-0 right-0 z-50 flex items-center space-x-1 p-2">
          <button
            onClick={minimizeWindow}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm text-white"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={maximizeWindow}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm text-white"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={closeWindow}
            className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-200 border border-red-500/30 backdrop-blur-sm text-red-400 hover:text-red-300"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>


        <div className="fixed top-4 left-4 z-50">
          <h1 className="text-xl font-bold text-white">
             SpotTheDiff
          </h1>
        </div>

        <div className="container mx-auto px-6 pt-20 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-1 bg-white/10 rounded-xl p-1 backdrop-blur-sm border border-white/20">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'upload' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Upload Files
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'diff' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                View Diff
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'visual' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Visual Compare
              </button>

            </div>
            
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-2 px-4 py-3 text-sm bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm text-white"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>


          <AnimatePresence>
            {showSettingsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setShowSettingsModal(false)}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Settings</h2>
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLineNumbers}
                        onChange={(e) => setShowLineNumbers(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Show line numbers</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ignoreWhitespace}
                        onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Ignore whitespace</span>
                    </label>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >

                <div className="text-center">
                  <CoverDemo />
                  <p className="text-gray-300 mt-2">Upload two files to compare their differences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg"></div>
                        <span>Original File</span>
                      </h2>
                      {files.left && (
                        <button
                          onClick={() => clearFiles('left')}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
                      <FileUpload onChange={(files) => handleFileUpload(files, 'left')} side="left" />
                    </div>
                    
                    {files.left && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(files.left.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{files.left.name}</p>
                            <p className="text-xs text-gray-300">{files.left.size} • {files.left.type}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>


                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
                        <span>Modified File</span>
                      </h2>
                      {files.right && (
                        <button
                          onClick={() => clearFiles('right')}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
                      <FileUpload onChange={(files) => handleFileUpload(files, 'right')} side="right" />
                    </div>
                    
                    {files.right && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(files.right.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{files.right.name}</p>
                            <p className="text-xs text-gray-300">{files.right.size} • {files.right.type}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>


                {!files.left && !files.right && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm">
                      <GitCompare className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ready to compare?</h3>
                    <p className="text-gray-300 max-w-md mx-auto text-sm">
                      Upload two files to see their differences. Perfect for code reviews, document comparisons, and more.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'diff' && (
              <motion.div
                key="diff"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >

                {files.left && files.right && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg"></div>
                        <h3 className="text-lg font-semibold text-white">Original File</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(files.left.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{files.left.name}</p>
                            <p className="text-xs text-gray-300">{files.left.size} • {files.left.type}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          <p>Lines: {files.left.content.split('\n').length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
                        <h3 className="text-lg font-semibold text-white">Modified File</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(files.right.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{files.right.name}</p>
                            <p className="text-xs text-gray-300">{files.right.size} • {files.right.type}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          <p>Lines: {files.right.content.split('\n').length}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {diffResult.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-semibold text-white">Differences Found</h2>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md">
                            {diffResult.filter(line => line.type === 'removed').length} removed
                          </span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md">
                            {diffResult.filter(line => line.type === 'added').length} added
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1 border border-white/20">
                          <button
                            onClick={() => setDiffViewMode('unified')}
                            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                              diffViewMode === 'unified'
                                ? 'bg-white/20 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Unified
                          </button>
                          <button
                            onClick={() => setDiffViewMode('side-by-side')}
                            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                              diffViewMode === 'side-by-side'
                                ? 'bg-white/20 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Side by Side
                          </button>
                        </div>
                        <button
                          onClick={copyDiffToClipboard}
                          className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={downloadDiff}
                          className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {diffViewMode === 'unified' ? (
                      <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
                        <div className="max-h-96 overflow-y-auto">
                          <div className="font-mono text-sm">
                            {diffResult.map((line, index) => (
                              <div
                                key={index}
                                className={`flex items-start px-4 py-1 hover:bg-white/5 transition-colors border-l-4 ${
                                  line.type === 'added' ? 'diff-added border-l-green-500' :
                                  line.type === 'removed' ? 'diff-removed border-l-red-500' : 
                                  'border-l-transparent'
                                }`}
                              >
                                {showLineNumbers && (
                                  <div className="w-12 text-right pr-4 line-number">
                                    {line.lineNumber}
                                  </div>
                                )}
                                <div className="flex-1 line-content">
                                  <span className={`inline-block w-4 text-center font-bold ${
                                    line.type === 'added' ? 'text-green-400' : 
                                    line.type === 'removed' ? 'text-red-400' : 'text-gray-300'
                                  }`}>
                                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                  </span>
                                  <span className={line.type === 'added' ? 'text-green-300' : 
                                                  line.type === 'removed' ? 'text-red-300' : 'text-gray-300'}>
                                    {line.content}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <SideBySideDiff
                        originalContent={files.left?.content || ''}
                        modifiedContent={files.right?.content || ''}
                        showLineNumbers={showLineNumbers}
                      />
                    )}
                  </motion.div>
                ) : files.left && files.right ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No differences found</h3>
                    <p className="text-gray-300">The files appear to be identical.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GitCompare className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Upload files to compare</h3>
                    <p className="text-gray-300">Switch to the upload tab to get started.</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'visual' && (
              <motion.div
                key="visual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Visual Comparison</h2>
                  <p className="text-sm text-gray-300">Hover or drag to compare text</p>
                </div>

                <div className="flex justify-center">
                  <div className="w-full max-w-6xl">
                    {files.left && files.right ? (
                      <Compare
                        firstContent={files.left.content}
                        secondContent={files.right.content}
                        className="w-full"
                      />
                    ) : (
                      <div className="p-8 border rounded-3xl dark:bg-neutral-900/50 bg-neutral-100/50 border-neutral-200 dark:border-neutral-800 backdrop-blur-sm text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <GitCompare className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Upload files to compare</h3>
                        <p className="text-gray-300">Switch to the upload tab and upload two files to see the visual comparison.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-300 text-sm">
                    This visual comparison tool allows you to see differences between two text files side by side.
                    <br />
                    Hover over the content to reveal the comparison slider, or use drag mode for more control.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <FloatingDockDemo />
    </AuroraBackground>
  );
}

export default App;
