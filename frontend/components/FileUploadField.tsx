'use client';

import React from 'react';
import { API_VERSION } from '../lib/api';
import V1FileUploadInput from '../v1/FileUploadInput';
import V2FileUploadInput from '../v2/FileUploadInput';

interface FileUploadFieldProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function FileUploadField({ onFileSelect, selectedFile }: FileUploadFieldProps) {
  if (API_VERSION === 'v2') {
    return <V2FileUploadInput onFileSelect={onFileSelect} selectedFile={selectedFile} />;
  }
  return <V1FileUploadInput onFileSelect={onFileSelect} selectedFile={selectedFile} />;
}
