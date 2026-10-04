import React from 'react';

interface FeedbackRendererProps {
  content: string;
}

// V1 Implementation: Insecurely renders unsanitized HTML markup
// Allows Stored Cross-Site Scripting (XSS) payloads to execute in laboratory testing
export default function V1FeedbackRenderer({ content }: FeedbackRendererProps) {
  return (
    <div
      className="prose prose-sm max-w-none text-slate-800 break-words"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
