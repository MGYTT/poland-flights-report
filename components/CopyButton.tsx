'use client';
import { useState } from 'react';

export default function CopyButton({ text, color = '#3b82f6' }: { text: string; color?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
      style={{
        width: '100%',
        padding: '11px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '13px',
        transition: 'all 0.2s',
        background: copied ? '#059669' : color,
        color: 'white',
        letterSpacing: '0.02em',
      }}
    >
      {copied ? '✅ Skopiowano!' : '📋 Kopiuj post'}
    </button>
  );
}