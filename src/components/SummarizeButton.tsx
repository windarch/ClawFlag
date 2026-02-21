/**
 * SummarizeButton 组件 - 总结此会话按钮 (任务 3.4)
 * 在消息输入区添加菜单按钮，点击可总结会话
 */

import { useState } from 'react';
import './SummarizeButton.css';

interface SummarizeButtonProps {
  onSummarize: () => Promise<void> | void;
  disabled?: boolean;
}

export default function SummarizeButton({ onSummarize, disabled }: SummarizeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSummarize = async () => {
    setShowMenu(false);
    setLoading(true);
    try {
      await onSummarize();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summarize-wrapper">
      <button
        className="summarize-trigger"
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || loading}
        title="更多操作"
      >
        {loading ? '⏳' : '＋'}
      </button>

      {showMenu && (
        <>
          <div className="summarize-backdrop" onClick={() => setShowMenu(false)} />
          <div className="summarize-menu">
            <button className="summarize-option" onClick={handleSummarize}>
              <span className="summarize-option-icon">📝</span>
              <span className="summarize-option-text">总结此会话</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
