/**
 * Code block component for displaying Python code snippets
 */
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CodeBlock({
  code,
  language = 'python',
  title = null,
  showCopy = true,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`relative rounded-lg overflow-hidden bg-slate-950 ${className}`}>
      {(title || showCopy) && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
          {title && (
            <span className="text-xs font-medium text-slate-400">{title}</span>
          )}
          {showCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-slate-300 leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}

export function InlineCode({ children }) {
  return (
    <code className="px-1.5 py-0.5 bg-slate-800 rounded text-sm font-mono text-blue-300">
      {children}
    </code>
  );
}

export default CodeBlock;
