import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from '../animations';


const ConfirmDialog = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    busyLabel,
    tone = 'danger', // 'danger' | 'default'
    busy = false,
    error = '',
    onConfirm,
    onClose,
}) => {
    const confirmRef = useRef(null);

    // Focus lands on Cancel's neighbour, not Cancel itself: the confirm button
    // is the one being asked about. Escape cancels, but never mid-request.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        confirmRef.current?.focus();

        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !busy) onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [onClose, busy]);

    const danger = tone === 'danger';

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !busy && onClose()}
            >
                <motion.div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    aria-describedby="confirm-message"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
                >
                    <div className="flex items-start gap-4">
                        <div
                            aria-hidden="true"
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                danger ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-[#41B985]'
                            }`}
                        >
                            <AlertTriangle size={22} />
                        </div>
                        <div className="min-w-0">
                            <h2 id="confirm-title" className="text-xl font-bold text-[#0A0A0A]">
                                {title}
                            </h2>
                            <p id="confirm-message" className="text-sm text-[#4A5565] mt-1.5 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="mt-5 text-sm font-semibold text-rose-600">
                            {error}
                        </p>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-7">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="px-6 py-3 rounded-2xl font-bold text-[#4A5565] hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            ref={confirmRef}
                            type="button"
                            onClick={onConfirm}
                            disabled={busy}
                            className={`px-6 py-3 rounded-2xl font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                                danger
                                    ? 'bg-rose-500 hover:bg-rose-600 focus-visible:ring-rose-500'
                                    : 'bg-[#41B985] hover:bg-[#35a37b] focus-visible:ring-[#41B985]'
                            }`}
                        >
                            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                            {busy ? busyLabel || `${confirmLabel}…` : confirmLabel}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConfirmDialog;
