import { useEffect, useState } from "react";

type NoticeToastProps = {
  message: string | null;
};

const NoticeToast = ({ message }: NoticeToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 10000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!message || !isVisible) return null;

  return (
    <div className="admin-notice">
      <div className="admin-notice-card" role="status" aria-live="polite">
        <span>{message}</span>
      </div>
    </div>
  );
};

export default NoticeToast;
