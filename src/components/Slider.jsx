/**
 * Custom slider component with labels
 */
import { useMemo } from 'react';

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  description = null,
  disabled = false,
  showValue = true,
  valueFormatter = (v) => v,
  className = '',
}) {
  const percentage = useMemo(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-200">
          {label}
        </label>
        {showValue && (
          <span className="text-sm font-mono text-blue-400">
            {valueFormatter(value)}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #334155 ${percentage}%, #334155 100%)`,
          }}
        />
      </div>

      {description && (
        <p className="text-xs text-slate-400">{description}</p>
      )}

      <div className="flex justify-between text-xs text-slate-500">
        <span>{valueFormatter(min)}</span>
        <span>{valueFormatter(max)}</span>
      </div>
    </div>
  );
}

export function SliderGroup({ children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

export default Slider;
