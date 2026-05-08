"use client";

import { AlertCircle, Check, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm border border-white/10 bg-[#111111] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-white/10 p-6">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isDangerous 
              ? "bg-red-500/10" 
              : "bg-amber-500/10"
          }`}>
            <AlertCircle className={`w-5 h-5 ${
              isDangerous 
                ? "text-red-500" 
                : "text-amber-500"
            }`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-white/60">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end p-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {confirmText}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
