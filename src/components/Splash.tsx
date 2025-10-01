import { useEffect } from "react";

type Props = {
  onFinish?: () => void;
  duration?: number;
};

export default function Splash({ onFinish, duration = 1200 }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onFinish?.(), duration);
    return () => clearTimeout(t);
  }, [onFinish, duration]);

  return (
    <div className="splash">
      <img src="/icons/icon-192.png" alt="logo" className="splash-logo" />
      <h1>My PWA. EPIFANIA</h1>
    </div>
  );
}
