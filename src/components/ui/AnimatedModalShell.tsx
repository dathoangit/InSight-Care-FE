import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const CLOSE_ANIMATION_MS = 300;

export type AnimatedModalRenderProps = {
  requestClose: () => void;
  isClosing: boolean;
  hasEntered: boolean;
};

type AnimatedModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  panelClassName: string;
  /** Use sheet slide-down on desktop too (better for tall modals). */
  closeAsSheet?: boolean;
  children: (props: AnimatedModalRenderProps) => ReactNode;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AnimatedModalShell({
  isOpen,
  onClose,
  labelledBy,
  panelClassName,
  closeAsSheet = false,
  children,
}: AnimatedModalShellProps) {
  const [portalMounted, setPortalMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const closeFinishedRef = useRef(false);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      closeFinishedRef.current = false;

      if (prefersReducedMotion()) {
        setHasEntered(true);
      } else {
        setHasEntered(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const finishClose = useCallback(() => {
    if (closeFinishedRef.current) {
      return;
    }

    closeFinishedRef.current = true;
    setIsClosing(false);
    setHasEntered(false);
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (isClosing || closeFinishedRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    setIsClosing(true);
  }, [finishClose, isClosing]);

  useEffect(() => {
    if (!isClosing) {
      return;
    }

    const timeoutId = window.setTimeout(finishClose, CLOSE_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [finishClose, isClosing]);

  const handlePanelAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (isClosing) {
      finishClose();
      return;
    }

    setHasEntered(true);
  };

  if (!portalMounted || !isOpen) {
    return null;
  }

  const backdropAnimation = isClosing
    ? 'animate-modal-backdrop-out'
    : 'animate-modal-backdrop-in';

  const enterAnimation =
    'animate-modal-sheet-in sm:animate-modal-dialog-in';

  const exitAnimation = closeAsSheet
    ? 'animate-modal-sheet-out'
    : 'animate-modal-sheet-out sm:animate-modal-dialog-out';

  const motionAnimation = isClosing ? exitAnimation : enterAnimation;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 motion-reduce:animate-none sm:items-center sm:p-4 ${backdropAnimation}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={requestClose}>
      <div
        className={`${panelClassName} transform-gpu [backface-visibility:hidden] motion-reduce:animate-none ${motionAnimation} ${
          isClosing ? 'pointer-events-none' : ''
        }`}
        onClick={(event) => event.stopPropagation()}
        onAnimationEnd={handlePanelAnimationEnd}>
        {children({ requestClose, isClosing, hasEntered })}
      </div>
    </div>,
    document.body,
  );
}
