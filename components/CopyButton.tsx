'use client';
import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '13px',
        transition: 'all 0.2s',
        background: copied ? '#059669' : '#2563eb',
        color: 'white',
      }}
    >
      {copied ? '✅ Skopiowano!' : '📋 Kopiuj post'}
    </button>
  );
}