import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Code, Strikethrough, Link, List, ListOrdered, Quote, Code2, AtSign, Hash } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "텍스트를 입력하세요",
  rows = 12,
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 초기값을 히스토리에 저장
  useEffect(() => {
    if (history.length === 0) {
      setHistory([value]);
      setHistoryIndex(0);
    }
  }, []);

  // 히스토리에 상태 저장
  const saveToHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 실행 취소
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // 다시 실행
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // 텍스트 선택 상태 업데이트
  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      setSelectedText(selected);
    }
  };

  // 마크다운 적용 함수
  const applyMarkdown = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    if (selectedText) {
      // 텍스트가 선택된 경우
      newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      const newCursorPos = start + before.length + selectedText.length + after.length;
      
      // 커서 위치 설정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // 텍스트가 선택되지 않은 경우, 커서 위치에 마크다운 삽입
      newText = value.substring(0, start) + before + after + value.substring(end);
      const newCursorPos = start + before.length;
      
      // 커서 위치 설정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    
    saveToHistory(newText);
    onChange(newText);
  };

  // 마크다운 버튼들
  const markdownButtons = [
    {
      icon: Bold,
      label: '볼드체',
      action: () => applyMarkdown('*', '*'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      label: '기울임체',
      action: () => applyMarkdown('_', '_'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: Code,
      label: '인라인 코드',
      action: () => applyMarkdown('`', '`'),
      shortcut: 'Ctrl+`'
    },
    {
      icon: Code2,
      label: '코드 블록',
      action: () => applyMarkdown('```\n', '\n```'),
      shortcut: 'Ctrl+Shift+`'
    },
    {
      icon: Quote,
      label: '인용문',
      action: () => applyMarkdown('> ', ''),
      shortcut: 'Ctrl+Q'
    },
    {
      icon: Strikethrough,
      label: '취소선',
      action: () => applyMarkdown('~', '~'),
      shortcut: 'Ctrl+S'
    },
    {
      icon: Link,
      label: '링크',
      action: () => applyMarkdown('<URL 삽입|', '>'),
      shortcut: 'Ctrl+K'
    },
    {
      icon: List,
      label: '순서없는 목록',
      action: () => applyMarkdown('• ', ''),
      shortcut: 'Ctrl+U'
    },
    {
      icon: AtSign,
      label: '멤버 태그',
      action: () => applyMarkdown('<@', '>'),
      shortcut: 'Ctrl+@'
    },
    {
      icon: Hash,
      label: '채널 태그',
      action: () => applyMarkdown('<!channel>', ''),
      shortcut: 'Ctrl+Shift+C'
    }
  ];

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // 실행 취소/다시 실행 처리
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo(); // Ctrl+Shift+Z: 다시 실행
        } else {
          undo(); // Ctrl+Z: 실행 취소
        }
        return;
      }
      
      let shortcut = `ctrl+${e.key.toLowerCase()}`;
      
      // Shift 키가 함께 눌린 경우
      if (e.shiftKey) {
        shortcut = `ctrl+shift+${e.key.toLowerCase()}`;
      }
      
      const button = markdownButtons.find(btn => 
        btn.shortcut.toLowerCase() === shortcut
      );
      
      if (button) {
        e.preventDefault();
        button.action();
      }
    }
  };

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
        {markdownButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action}
            title={`${button.label} (${button.shortcut})`}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          >
            <button.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* 선택된 텍스트 표시 - 고정 높이 */}
      <div className="h-8 px-3 py-1 bg-blue-50 border-b border-blue-200 text-xs text-blue-700 flex items-center">
        {selectedText ? (
          <>
            <span className="font-medium">선택됨:</span> 
            <span className="ml-1 truncate">
              "{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
            </span>
          </>
        ) : (
          <span className="text-gray-400">텍스트를 선택하면 여기에 표시됩니다</span>
        )}
      </div>

      {/* 텍스트 에리어 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleTextSelection}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none"
        style={{ minHeight: `${rows * 1.5}rem` }}
      />

      {/* 마크다운 가이드 */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 rounded-b-md">
        <p className="text-xs text-gray-500 mb-1">Slack 마크다운 가이드</p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span><code>*볼드체*</code></span>
          <span><code>_기울임체_</code></span>
          <span><code>`인라인코드`</code></span>
          <span><code>```코드블록```</code></span>
          <span><code>&gt; 인용문</code></span>
          <span><code>~취소선~</code></span>
          <span><code>&lt;링크|텍스트&gt;</code></span>
          <span><code>• 목록</code></span>
          <span><code>&lt;@멤버아이디&gt;</code></span>
          <span><code>&lt;!channel&gt;</code></span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
