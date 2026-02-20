/**
 * ChatInput 组件
 * 可伸缩的聊天输入框，支持发送消息和加载状态
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import type { ChatInputProps } from '../types/chat';
import './ChatInput.css';

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = '输入消息...',
  disabled = false,
  maxLength = 10000,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 重置高度以正确计算 scrollHeight
      textarea.style.height = 'auto';
      // 设置新高度，最大 150px
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);
  
  // 监听文本变化，调整高度
  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);
  
  // 处理输入变化
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setText(value);
    }
  }, [maxLength]);
  
  // 发送消息
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed);
      setText('');
      // 重置高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [text, isLoading, disabled, onSend]);
  
  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  // 计算字符计数状态
  const charCount = text.length;
  const charCountClass = charCount > maxLength * 0.9 
    ? 'char-count--error' 
    : charCount > maxLength * 0.75 
      ? 'char-count--warning' 
      : '';
  
  // 判断是否可以发送
  const canSend = text.trim().length > 0 && !isLoading && !disabled;
  
  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          aria-label="消息输入框"
        />
        <button
          className={`chat-send-button ${isLoading ? 'chat-send-button--loading' : ''}`}
          onClick={handleSend}
          disabled={!canSend}
          aria-label={isLoading ? '发送中...' : '发送消息'}
        >
          <span className="send-icon">
            {isLoading ? '' : '➤'}
          </span>
        </button>
      </div>
      
      {/* 字符计数 */}
      {charCount > 0 && (
        <div className="chat-input-footer">
          <span className={`char-count ${charCountClass}`}>
            {charCount} / {maxLength}
          </span>
        </div>
      )}
    </div>
  );
}

export default ChatInput;
