import { useState } from 'react';
import './EmergencyStop.css';

interface EmergencyStopProps {
  onStop?: () => void;
  visible?: boolean;
}

export default function EmergencyStop({ onStop, visible = true }: EmergencyStopProps) {
  const [confirming, setConfirming] = useState(false);
  const [stopped, setStopped] = useState(false);

  if (!visible) return null;

  const handleClick = () => {
    if (stopped) return;
    if (!confirming) {
      setConfirming(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    // Second click = confirm
    setStopped(true);
    onStop?.();
    setTimeout(() => {
      setStopped(false);
      setConfirming(false);
    }, 5000);
  };

  const label = stopped
    ? '⏹ 已停止'
    : confirming
      ? '⚠️ 再按一次确认停止'
      : '🛑 紧急停止';

  const className = [
    'emergency-stop-btn',
    confirming && !stopped ? 'confirming' : '',
    stopped ? 'stopped' : '',
  ].filter(Boolean).join(' ');

  return (
    <button className={className} onClick={handleClick} disabled={stopped}>
      {label}
    </button>
  );
}
