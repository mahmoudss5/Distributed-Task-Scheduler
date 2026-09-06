import React from 'react';
import { Code2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PayloadEditorProps {
  payload: string;
  error: string | null;
  onChange: (v: string) => void;
  onValidate: () => boolean;
}

const PayloadEditor: React.FC<PayloadEditorProps> = ({ payload, error, onChange, onValidate }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center justify-center w-5 h-5 bg-violet-600/20 text-violet-400 rounded text-xs font-bold">3</span>
      <div className="flex items-center gap-1.5">
        <Code2 size={13} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-violet-400">Payload</h2>
      </div>
    </div>

    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${
      error ? 'border-red-500/50' : 'border-slate-600/50 focus-within:border-violet-500/50'
    }`}>
      <div className="flex items-center justify-between px-3 py-2 bg-slate-700/40 border-b border-slate-600/30">
        <span className="text-xs text-slate-400 font-mono">payload.json</span>
        <span className="text-xs text-slate-500">Manual JSON</span>
      </div>
      <textarea
        value={payload}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        spellCheck={false}
        className="w-full bg-slate-800/60 dark:bg-slate-900/60 text-slate-200 text-xs font-mono p-3 resize-none focus:outline-none leading-relaxed"
        placeholder='{ "key": "value" }'
      />
    </div>

    <div className="flex items-center justify-between mt-2">
      <button
        onClick={onValidate}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        {error
          ? <AlertCircle size={12} className="text-red-400" />
          : <CheckCircle2 size={12} className="text-emerald-400" />
        }
        {error ? <span className="text-red-400">{error}</span> : 'Validate JSON'}
      </button>
      <span className="text-xs text-slate-500 font-mono">{payload.length} chars</span>
    </div>

    <p className="text-xs text-slate-500 mt-1">
      Payload must be a valid JSON object. This demo does not send emails or call external services.
    </p>
  </div>
);

export default PayloadEditor;
