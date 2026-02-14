import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description }: { title: string; description?: string }) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, description }]);
    
    // 3秒后自动移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);

    // 简单的 alert 作为 fallback
    alert(`${title}${description ? `\n${description}` : ""}`);
  }, []);

  return { toast, toasts };
}
