import React, {useMemo, useState} from 'react';
import {HealthCheckRecord} from '../types/health';
import {Activity} from 'lucide-react';

export type ChartMetric = 'bp' | 'glucose' | 'cholesterol' | 'bmi';

interface HealthTrendChartProps {
  records: HealthCheckRecord[];
  metric: ChartMetric;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short'});
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({records, metric}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sorted = useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    [records],
  );

  if (sorted.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Activity className="w-7 h-7 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">Belum ada riwayat pemeriksaan</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Catat hasil pemeriksaan pertama di formulir sebelah untuk melihat grafik tren kesehatan.
        </p>
      </div>
    );
  }

  const width = 640;
  const height = 250;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 38;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const config = (() => {
    switch (metric) {
      case 'bp':
        return {
          minY: 50,
          maxY: 180,
          unit: 'mmHg',
          normalMax: 120,
          warnMax: 140,
          title: 'Tren Tekanan Darah (Sistolik / Diastolik)',
        };
      case 'glucose':
        return {
          minY: 60,
          maxY: 240,
          unit: 'mg/dL',
          normalMax: 140,
          warnMax: 200,
          title: 'Tren Gula Darah',
        };
      case 'cholesterol':
        return {
          minY: 120,
          maxY: 280,
          unit: 'mg/dL',
          normalMax: 200,
          warnMax: 240,
          title: 'Tren Kolesterol Total',
        };
      case 'bmi':
        return {
          minY: 14,
          maxY: 34,
          unit: 'kg/m²',
          normalMax: 25,
          warnMax: 27,
          title: 'Tren Indeks Massa Tubuh (IMT)',
        };
    }
  })();

  const getY = (val: number) => {
    const clamped = Math.max(config.minY, Math.min(config.maxY, val));
    const ratio = (clamped - config.minY) / (config.maxY - config.minY);
    return padTop + chartH - ratio * chartH;
  };

  const getX = (idx: number) => {
    if (sorted.length === 1) return padLeft + chartW / 2;
    return padLeft + (idx / (sorted.length - 1)) * chartW;
  };

  const primaryPoints = sorted.map((r, i) => {
    const val =
      metric === 'bp'
        ? r.systolic
        : metric === 'glucose'
          ? r.glucose
          : metric === 'cholesterol'
            ? r.cholesterol
            : r.bmi;
    return {x: getX(i), y: getY(val), val, record: r};
  });

  const secondaryPoints =
    metric === 'bp'
      ? sorted.map((r, i) => ({
          x: getX(i),
          y: getY(r.diastolic),
          val: r.diastolic,
          record: r,
        }))
      : [];

  const toPolyline = (pts: Array<{x: number; y: number}>) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const yTicks = 4;
  const tickValues = Array.from({length: yTicks + 1}, (_, i) =>
    Math.round(config.minY + ((config.maxY - config.minY) * i) / yTicks),
  );

  const yNormalTop = getY(config.normalMax);
  const yWarnTop = getY(config.warnMax);
  const yBottom = getY(config.minY);
  const yTop = getY(config.maxY);

  const activeIdx = hoveredIndex !== null ? hoveredIndex : sorted.length - 1;
  const activePoint = primaryPoints[activeIdx];
  const activeSecondary = secondaryPoints[activeIdx];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">{config.title}</span>
        {activePoint && (
          <div className="flex items-center gap-2 font-mono tabular-nums text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            <span>{formatShortDate(activePoint.record.recordedAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-teal-800">
              {metric === 'bp' && activeSecondary
                ? `${activePoint.val}/${activeSecondary.val} ${config.unit}`
                : `${activePoint.val} ${config.unit}`}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[420px] h-auto select-none"
          role="img"
          aria-label={config.title}
        >
          {/* HBM Zone Backgrounds */}
          <rect
            x={padLeft}
            y={yTop}
            width={chartW}
            height={Math.max(0, yWarnTop - yTop)}
            fill="#FEF2F2"
            opacity="0.7"
          />
          <rect
            x={padLeft}
            y={yWarnTop}
            width={chartW}
            height={Math.max(0, yNormalTop - yWarnTop)}
            fill="#FFFBEB"
            opacity="0.85"
          />
          <rect
            x={padLeft}
            y={yNormalTop}
            width={chartW}
            height={Math.max(0, yBottom - yNormalTop)}
            fill="#ECFDF5"
            opacity="0.75"
          />

          {/* Horizontal Grid & Y Labels */}
          {tickValues.map((tv) => {
            const yPos = getY(tv);
            return (
              <g key={tv}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + chartW}
                  y2={yPos}
                  stroke="#CBD5E1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {tv}
                </text>
              </g>
            );
          })}

          {/* Threshold reference lines */}
          <line
            x1={padLeft}
            y1={yWarnTop}
            x2={padLeft + chartW}
            y2={yWarnTop}
            stroke="#DC2626"
            strokeDasharray="5 4"
            strokeWidth="1.2"
            opacity="0.65"
          />
          <line
            x1={padLeft}
            y1={yNormalTop}
            x2={padLeft + chartW}
            y2={yNormalTop}
            stroke="#D97706"
            strokeDasharray="5 4"
            strokeWidth="1.2"
            opacity="0.65"
          />

          {/* Secondary Line (Diastolic) */}
          {secondaryPoints.length > 1 && (
            <polyline
              fill="none"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toPolyline(secondaryPoints)}
            />
          )}

          {/* Primary Line */}
          {primaryPoints.length > 1 && (
            <polyline
              fill="none"
              stroke="#0D9488"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toPolyline(primaryPoints)}
            />
          )}

          {/* Data Points & X-axis labels */}
          {primaryPoints.map((pt, idx) => {
            const isSelected = idx === activeIdx;
            const sec = secondaryPoints[idx];
            return (
              <g
                key={pt.record.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => setHoveredIndex(idx)}
              >
                {/* Invisible wider hit column */}
                <rect
                  x={pt.x - 18}
                  y={padTop}
                  width={36}
                  height={chartH + 24}
                  fill="transparent"
                />
                {isSelected && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={padTop + chartH}
                    stroke="#0F766E"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                {sec && (
                  <circle
                    cx={sec.x}
                    cy={sec.y}
                    r={isSelected ? 5.5 : 4}
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="2.5"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6.5 : 4.5}
                  fill={isSelected ? '#0D9488' : '#FFFFFF'}
                  stroke="#0D9488"
                  strokeWidth="2.5"
                />
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-mono ${
                    isSelected ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {formatShortDate(pt.record.recordedAt)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-teal-600 inline-block" />
          {metric === 'bp' ? 'Sistolik' : 'Nilai Pengukuran'}
        </span>
        {metric === 'bp' && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" />
            Diastolik
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-100 border border-emerald-300 inline-block" />
          Zona Normal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-300 inline-block" />
          Zona Waspada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-red-100 border border-red-300 inline-block" />
          Zona Konsultasi Puskesmas
        </span>
      </div>
    </div>
  );
};
