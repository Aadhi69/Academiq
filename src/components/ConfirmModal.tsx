'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, Check, FolderOpen } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customDriveUrl?: string) => void;
  title: string;
  message: string;
  driveUrl?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  driveUrl = '',
  confirmLabel = 'Submit & Complete Work',
  isSubmitting = false,
}: ConfirmModalProps) {
  const [url, setUrl] = useState(driveUrl);

  useEffect(() => {
    setUrl(driveUrl || '');
  }, [driveUrl, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0 border border-blue-100">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Google Drive Link Input */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-700">
            Google Drive Submission Link
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400">
            Provide the Google Drive folder or document link containing your finished deliverable.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(url)}
            disabled={isSubmitting || !url.trim()}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

