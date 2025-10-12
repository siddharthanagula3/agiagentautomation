import { useRef, useEffect, useState, useCallback } from 'react';

interface UseAutoScrollOptions {
  smooth?: boolean;
  content?: React.ReactNode;
}

export function useAutoScroll({
  smooth = false,
  content,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [smooth]);

  const disableAutoScroll = useCallback(() => {
    setAutoScrollEnabled(false);
  }, []);

  const enableAutoScroll = useCallback(() => {
    setAutoScrollEnabled(true);
  }, []);

  const checkIfAtBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const threshold = 10;
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(atBottom);
    }
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      checkIfAtBottom();
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  useEffect(() => {
    if (autoScrollEnabled && content) {
      scrollToBottom();
    }
  }, [content, autoScrollEnabled, scrollToBottom]);

  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll,
    enableAutoScroll,
  };
}
