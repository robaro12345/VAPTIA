'use client';

import React, { useState } from 'react';

interface FileUploadInputProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function V2FileUploadInput({ onFileSelect, selectedFile }: FileUploadInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files ? e.target.files[0] : null;

    if (!file) {
      onFileSelect(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      setError('Invalid file type. Only PDF (.pdf), Word (.docx), and Text (.txt) files are allowed.');
      onFileSelect(null);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds the 5MB limit.');
      onFileSelect(null);
      e.target.value = '';
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Assignment File <span className="text-xs text-slate-500 font-normal">(.pdf, .docx, .txt - Max 5MB)</span>
      </label>
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {error && (
        <p className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {selectedFile && !error && (
        <p className="text-xs text-emerald-600">
          Selected: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
}
