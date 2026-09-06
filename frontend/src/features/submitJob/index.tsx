import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import JobConfiguration from './components/JobConfiguration/JobConfiguration';
import ExecutionSchedule from './components/ExecutionSchedule/ExecutionSchedule';
import PayloadEditor from './components/PayloadEditor/PayloadEditor';
import JobSummary from './components/JobSummary/JobSummary';
import { useSubmitJob } from './hooks/useSubmitJob';

const SubmitJobPage: React.FC = () => {
  const { form, updateField, payloadError, validatePayload, handleSubmit, mutation } = useSubmitJob();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 dark:bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Overview
        </Link>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Submit Job</p>
        <h1 className="text-xl font-bold text-white">Configure a task and add it to the execution queue.</h1>
      </div>

      <div className="flex gap-5">
        {/* Main Form */}
        <div className="flex-1 space-y-6">
          {/* Section 1 */}
          <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <JobConfiguration
              type={form.type}
              priority={form.priority}
              onTypeChange={(v) => updateField('type', v)}
              onPriorityChange={(v) => updateField('priority', v)}
            />
          </div>

          {/* Section 2 */}
          <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <ExecutionSchedule
              schedule={form.schedule}
              onScheduleChange={(v) => updateField('schedule', v)}
            />
          </div>

          {/* Section 3 */}
          <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <PayloadEditor
              payload={form.payload}
              error={payloadError}
              onChange={(v) => updateField('payload', v)}
              onValidate={validatePayload}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            {mutation.isSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 size={13} />
                Job submitted successfully! It appears in the overview.
              </div>
            )}
            {mutation.isError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={13} />
                Submission failed. Check your payload and try again.
              </div>
            )}
            {!mutation.isSuccess && !mutation.isError && (
              <p className="text-xs text-slate-500">Submitted jobs appear in the overview.</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 ml-auto"
            >
              {mutation.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                : <><Plus size={14} /> Submit job</>
              }
            </button>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="w-60 flex-shrink-0">
          <JobSummary form={form} />
        </div>
      </div>
    </div>
  );
};

export default SubmitJobPage;
