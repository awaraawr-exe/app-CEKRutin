import React from 'react';
import {AlertOctagon, AlertTriangle, CheckCircle2} from 'lucide-react';
import {HbmStatus} from '../types/health';
import {getStatusLabel} from '../lib/hbmEvaluator';

interface StatusIndicatorProps {
  status: HbmStatus;
  compact?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({status, compact = false}) => {
  const label = getStatusLabel(status);

  if (status === 'normal') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg ${
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  if (status === 'waspada') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg ${
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold text-red-900 bg-red-50 border border-red-200 rounded-lg ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
