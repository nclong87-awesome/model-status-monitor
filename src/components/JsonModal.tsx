import React, { useState } from 'react';
import { ModelStatus } from '../types';
import { X, Copy, Check, FileCode, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { formatUnlockTime } from '../utils/timeUtils';

interface JsonModalProps {
  data: ModelStatus[];
  onSave: (newData: ModelStatus[]) => void;
  onReset: () => void;
  onClose: () => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ data, onSave, onReset, onClose }) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON data must be an array of model status objects.');
      }
      onSave(parsed);
      setError(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateStandaloneHtml = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Model Status Monitor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 700; color: #0f172a; }
    p.subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
    
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .stat-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 8px; }
    
    .table-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; padding: 12px 16px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    tr:hover { background: #f8fafc; }
    
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .badge-healthy { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-unhealthy { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
    .badge-provider { background: #f1f5f9; color: #334155; border-radius: 6px; padding: 2px 8px; font-weight: 600; font-size: 12px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; }
    
    .progress-bg { background: #e2e8f0; border-radius: 9999px; height: 8px; width: 80px; display: inline-block; vertical-align: middle; margin-right: 8px; overflow: hidden; }
    .progress-fill { height: 100%; background: #10b981; }
    .progress-fill.low { background: #f43f5e; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>LLM Model Status Monitor</h1>
      <p class="subtitle">Live status report for ${data.length} language models across providers</p>
    </header>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Provider</th>
            <th>Model Identifier</th>
            <th>Status</th>
            <th>Tier</th>
            <th style="text-align: right;">Avg Latency</th>
            <th>Success Rate</th>
            <th style="text-align: center;">Locked</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(m => `
          <tr>
            <td style="color:#64748b; font-weight:600;">${m.rank}</td>
            <td><span class="badge-provider">${m.provider}</span></td>
            <td class="mono"><strong>${m.model}</strong></td>
            <td>
              <span class="badge ${m.status.toLowerCase() === 'healthy' ? 'badge-healthy' : 'badge-unhealthy'}">
                ${m.status.toLowerCase() === 'healthy' ? '✓ Healthy' : '⚠ Unhealthy'}
              </span>
            </td>
            <td style="color:#475569;">${m.tier}</td>
            <td style="text-align: right;" class="mono">${m.averageTimeSeconds.toFixed(3)}s</td>
            <td>
              <div class="progress-bg">
                <div class="progress-fill ${m.successRatePercent < 50 ? 'low' : ''}" style="width: ${m.successRatePercent}%;"></div>
              </div>
              <span class="mono">${m.successRatePercent}%</span>
            </td>
            <td style="text-align: center;">${m.isLocked ? `🔒 Locked (${formatUnlockTime(m.unlocksAtUtc)})` : '🔓 Unlocked'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm-status-monitor.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = () => {
    const htmlContent = generateStandaloneHtml();
    navigator.clipboard.writeText(htmlContent);
    setHtmlCopied(true);
    setTimeout(() => setHtmlCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900 text-base">Model Data JSON Editor & Exporter</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-600">
            Paste or update your JSON dataset below to refresh the table. You can also download a clean, single-file HTML version.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
              }}
              rows={14}
              className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed scrollbar-thin"
              placeholder="Paste model status JSON array..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied JSON' : 'Copy JSON'}
              </button>

              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {htmlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5" />}
                {htmlCopied ? 'Copied HTML' : 'Copy Standalone HTML'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .html File
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Default Prompt Data
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Apply JSON Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
