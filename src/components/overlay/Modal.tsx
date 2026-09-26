'use client';

/* Origin: marketing-stats (96S1). Restyled onto the kit's surface and portalled. */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import { ResizeMark, useDragResize } from '@/lib/use-drag-resize';

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const;

export type ModalSize = keyof typeof SIZE;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  /**
   * Close on a click outside the dialog. Off by default: a dialog usually
   * holds a form, and one stray click beside it should not throw away what was
   * typed. Escape and the close button always close it.
   */
  closeOnBackdrop?: boolean;
  /** Drag it by the title bar; double-click the bar to put it back. Default on. */
  draggable?: boolean;
  /** Resize it from any edge or corner. Default on. */
  resizable?: boolean;
}

const NOOP = () => {};

/**
 * A centred dialog over a dimmed backdrop. Escape and the close button dismiss
 * it; a click on the backdrop does only with `closeOnBackdrop`. Drag the title
 * bar to move it and any edge or corner to resize it — once given a height,
 * the body scrolls. Both reset when it closes, so it
 * opens centred every time.
 *
 * PORTALLED to <body>, like Drawer, and for the same reason: `fixed` is
 * resolved against the nearest ancestor with a transform, filter or
 * backdrop-filter — and `.panel` has one. Rendered in place inside a card, the
 * backdrop covered the card rather than the page and the dialog centred itself
 * in the wrong box. Escaping the tree is the fix; hunting the ancestor is not.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = false,
  draggable = true,
  resizable = true,
}: ModalProps) {
  const drag = useDragResize({ draggable, resizable });
  const { reset } = drag;

  // Anything outside the dialog is the backdrop, so click-outside IS the
  // backdrop click; one hook covers it and Escape both. `ignoreOverlays`: a
  // portalled surface opened from inside the dialog (a ConfirmPopover, a
  // column menu) is not the backdrop, so a click in it must not close us.
  // Escape, like Drawer's, is left to a popover or picker open inside the
  // dialog — one key closes one thing.
  useDismiss(
    drag.ref,
    isOpen,
    closeOnBackdrop ? onClose : NOOP,
    () => {
      if (document.querySelector('[data-overlay="popover"], [data-overlay="picker"]')) return;
      onClose();
    },
    true,
  );

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={drag.ref}
        style={drag.style}
        className={cn(
          'relative flex w-full flex-col panel panel-solid text-left animate-scale-in',
          SIZE[size],
        )}
      >
        {drag.grips}
        {/* The whole bar is the drag handle, padding included, so it is easy to catch. */}
        <div {...drag.handleProps} className={cn('shrink-0 px-5 pt-5', drag.handleProps.className)}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* A scroller only once a height was dragged in: until then the body grows,
            and an in-flow dropdown inside it is never clipped by its own dialog. */}
        <div className={cn('min-h-0 flex-1 px-5 pb-5 pt-4', drag.size.h !== undefined && 'overflow-y-auto')}>{children}</div>
        {resizable && <ResizeMark />}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
