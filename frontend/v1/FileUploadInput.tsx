'use client';

import React from 'react';

interface FileUploadInputProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function V1FileUploadInput({ onFileSelect, selectedFile }: FileUploadInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Assignment File
      </label>
      <input
        type="file"
        onChange={(e) => onFileSelect(e.target.files ? e.target.files[0] : null)}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {selectedFile && (
        <p className="text-xs text-slate-500">
          Selected: <span className="font-medium text-slate-700">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
}
