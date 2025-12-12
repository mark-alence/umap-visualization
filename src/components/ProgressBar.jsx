/**
 * Progress bar component for UMAP computation
 */
export function ProgressBar({
  progress = 0,
  label = null,
  showPercentage = true,
  className = '',
  barClassName = '',
  animated = true,
}) {
  const percentage = Math.round(progress * 100);

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-slate-400">{label}</span>}
          {showPercentage && (
            <span className="font-mono text-blue-400">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200
                      ${animated && progress > 0 && progress < 1 ? 'animate-pulse' : ''} ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function EpochCounter({
  current,
  total,
  label = 'Epoch',
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-slate-400">{label}:</span>
      <span className="font-mono text-blue-400">
        {current} / {total}
      </span>
    </div>
  );
}

export default ProgressBar;
