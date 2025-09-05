import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { UploadResponse } from '../types';
import toast from 'react-hot-toast';

interface FileUploadProps {
  sessionId: number;
  userId: number;
  onUploadSuccess: (fileName: string) => void;
  isUploaded: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  sessionId,
  userId,
  onUploadSuccess,
  isUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const response: UploadResponse = await chatAPI.uploadPDF(sessionId, userId, file);
      
      if (response.error_status === 'success') {
        toast.success('PDF uploaded successfully!');
        onUploadSuccess(file.name);
        setFile(null);
      } else {
        toast.error(response.error_status || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (isUploaded) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-green-800 font-medium">PDF uploaded successfully</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!file ? (
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload your PDF document
              </p>
              <p className="text-gray-500 mt-1">
                Drag and drop your PDF here, or{' '}
                <button
                  onClick={openFileDialog}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  browse files
                </button>
              </p>
            </div>
            <p className="text-sm text-gray-400">
              Maximum file size: 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
              <File className="w-8 h-8 text-red-500" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload PDF'
              )}
            </button>
          </div>
        )}
      </div>

      {file && file.size > 10 * 1024 * 1024 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 text-sm">
            File size exceeds 10MB limit
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
