'use client';

import React from 'react';
import { API_VERSION } from '../lib/api';
import V1FeedbackRenderer from '../v1/FeedbackRenderer';
import V2FeedbackRenderer from '../v2/FeedbackRenderer';

interface FeedbackDisplayProps {
  content: string;
}

export default function FeedbackDisplay({ content }: FeedbackDisplayProps) {
  // Version switch without visual badges/toggles
  if (API_VERSION === 'v2') {
    return <V2FeedbackRenderer content={content} />;
  }
  return <V1FeedbackRenderer content={content} />;
}
