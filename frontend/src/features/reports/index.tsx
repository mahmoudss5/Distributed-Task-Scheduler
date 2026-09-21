import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportApi } from '../../shared/api/reportApi';
import type { Report } from '../../shared/types';
import { REPORTS_PAGE_SIZE, useReports } from './hooks/useReports';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const ReportsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [busyReport, setBusyReport] = useState<{ id: string; action: 'view' | 'download' } | null>(null);
  const { reportsQuery, refresh } = useReports(page);
  const reports = reportsQuery.data?.data ?? [];
  const meta = reportsQuery.data?.meta;
  const hasPreviousPage = page > 1;
  const hasNextPage = Boolean(meta && page * meta.limit < meta.total);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await reportApi.generate();
      toast.success('Report generation queued. It will appear here when ready.');
      refresh();
    } catch {
      toast.error('Could not queue report generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportBlobUrl = async (
    report: Report,
    action: 'view' | 'download',
    previewWindow?: Window | null,
  ) => {
    setBusyReport({ id: report.id, action });
    try {
      const response = await reportApi.download(report.id);
      const url = URL.createObjectURL(response.data);

      if (action === 'view') {
        const targetWindow = previewWindow ?? window.open(url, '_blank', 'noopener,noreferrer');
        if (targetWindow) {
          targetWindow.location.href = url;
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = report.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      previewWindow?.close();
      toast.error('The report file is not available.');
    } finally {
      setBusyReport(null);
    }
  };

  const handleView = (report: Report) => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      toast.error('Allow pop-ups to view a report.');
      return;
    }
    previewWindow.document.title = 'Loading report…';
    void getReportBlobUrl(report, 'view', previewWindow);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 dark:bg-slate-950 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Workspace</p>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">View and download your generated activity reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={reportsQuery.isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Generate report
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border bg-violet-500/10 border-violet-500/20">
        <FileText size={14} className="text-violet-400" />
        <span className="text-xs text-violet-300">
          {meta?.total ?? 0} report{meta?.total === 1 ? '' : 's'} available
        </span>
        <span className="text-xs text-slate-500">New reports may take a few seconds to appear.</span>
      </div>

      <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                {['Report', 'Generated', 'Actions'].map((heading) => (
                  <th key={heading} className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportsQuery.isLoading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-slate-700/30">
                    {[...Array(3)].map((__, cellIndex) => (
                      <td key={cellIndex} className="py-4 px-4"><div className="h-3 bg-slate-700/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : reportsQuery.isError ? (
                <tr><td colSpan={3} className="px-4 py-10 text-sm text-red-400">Reports could not be loaded. Refresh to try again.</td></tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center">
                    <FileText size={26} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No reports generated yet.</p>
                    <p className="text-xs text-slate-600 mt-1">Generate a report to see it here.</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isBusy = busyReport?.id === report.id;
                  return (
                    <tr key={report.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <FileText size={15} className="text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{report.fileName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{report.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(report.createdAt)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(report)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-md disabled:opacity-50"
                          >
                            {isBusy && busyReport?.action === 'view' ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                            View
                          </button>
                          <button
                            onClick={() => void getReportBlobUrl(report, 'download')}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-violet-300 hover:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-md disabled:opacity-50"
                          >
                            {isBusy && busyReport?.action === 'download' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Page {page}{meta ? ` of ${Math.max(1, Math.ceil(meta.total / REPORTS_PAGE_SIZE))}` : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => current - 1)}
              disabled={!hasPreviousPage || reportsQuery.isFetching}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNextPage || reportsQuery.isFetching}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {reportsQuery.isError && (
        <div className="flex items-center gap-2 mt-4 text-xs text-red-400">
          <AlertCircle size={13} />
          Make sure the backend is running and try refreshing the list.
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
