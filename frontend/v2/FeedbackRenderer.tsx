import React from 'react';

interface FeedbackRendererProps {
  content: string;
}

// V2 Implementation: Security-hardened safe text rendering
// Strictly treats user input as plain text without parsing as HTML/script
export default function V2FeedbackRenderer({ content }: FeedbackRendererProps) {
  return (
    <div className="text-sm text-slate-800 break-words whitespace-pre-wrap">
      {content}
    </div>
  );
}
