import React, { useState, useMemo } from "react";
import {
  Search,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Terminal,
  Check,
  AlertOctagon,
  AlertTriangle,
  Info,
  Bug,
} from "lucide-react";
import { NormalisedLogEntry } from "../../api/types";

interface LogViewerProps {
  logs: NormalisedLogEntry[];
}

type LogFilter = "ALL" | "CRITICAL" | "ERROR" | "WARN" | "INFO" | "DEBUG";

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<LogFilter>("ALL");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter and search
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter level
      const matchesLevel =
        filterLevel === "ALL" || log.severity.toUpperCase() === filterLevel;

      // Search query
      const matchesSearch =
        searchQuery === "" ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.host.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesLevel && matchesSearch;
    });
  }, [logs, searchQuery, filterLevel]);

  const handleCopy = () => {
    const rawString = filteredLogs
      .map((l) => `[${l.timestampIso}] [${l.severity}] [${l.service}@${l.host}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(rawString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const rawString = filteredLogs
      .map((l) => `[${l.timestampIso}] [${l.severity}] [${l.service}@${l.host}] ${l.message}`)
      .join("\n");
    const blob = new Blob([rawString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incident-logs-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "text-red-500 font-bold";
      case "ERROR":
        return "text-red-400";
      case "WARN":
        return "text-amber-400";
      case "INFO":
        return "text-blue-400";
      default:
        return "text-slate-400";
    }
  };

  const getLevelIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return <AlertOctagon size={12} className="text-red-500 flex-shrink-0 mt-0.5" />;
      case "ERROR":
        return <AlertOctagon size={12} className="text-red-400 flex-shrink-0 mt-0.5" />;
      case "WARN":
        return <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />;
      case "INFO":
        return <Info size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />;
      default:
        return <Bug size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      className={`bg-[#070B14] border border-white/10 rounded-2xl flex flex-col font-mono text-left select-text ${
        isFullscreen
          ? "fixed inset-4 z-50 shadow-2xl h-[calc(100vh-32px)]"
          : "relative h-[480px] w-full"
      }`}
    >
      {/* Top bar control options */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-brand-neon" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Raw Log Console ({filteredLogs.length} entries)
          </span>
        </div>

        {/* Filters and buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Level Filter select dropdown */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as LogFilter)}
            className="bg-[#111827] border border-white/10 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">Severity: ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          {/* Search bar input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grep logs..."
              className="bg-[#111827] border border-white/10 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-brand-primary w-40 sm:w-48"
            />
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={handleCopy}
              title="Copy to Clipboard"
              className="p-2 hover:bg-white/10 border border-white/5 rounded-lg transition-colors text-text-secondary hover:text-white"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleDownload}
              title="Download Logs"
              className="p-2 hover:bg-white/10 border border-white/5 rounded-lg transition-colors text-text-secondary hover:text-white"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle Fullscreen"
              className="p-2 hover:bg-white/10 border border-white/5 rounded-lg transition-colors text-text-secondary hover:text-white"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-auto flex text-xs leading-relaxed p-4 select-text">
        {/* Line numbers stack */}
        <div className="text-right text-text-dim pr-4 border-r border-white/10 select-none flex-shrink-0 text-[11px] font-mono leading-6">
          {filteredLogs.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
          {filteredLogs.length === 0 && <div>1</div>}
        </div>

        {/* Core log lines */}
        <div className="flex-1 pl-4 font-mono select-text whitespace-nowrap overflow-x-auto leading-6">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-2 hover:bg-white/5 px-1 rounded transition-colors group">
              {getLevelIcon(log.severity)}
              <span className="text-[10px] text-text-dim flex-shrink-0 select-all">
                [{log.timestampIso}]
              </span>
              <span className={`text-[10px] font-bold flex-shrink-0 select-all ${getLevelColor(log.severity)}`}>
                [{log.severity.toUpperCase()}]
              </span>
              <span className="text-brand-neon font-semibold text-[10px] flex-shrink-0 select-all">
                {log.service}@{log.host}:
              </span>
              <span className="text-text-secondary select-all whitespace-pre-wrap break-all">
                {log.message}
              </span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-text-dim italic text-center py-12">
              No matching log outputs detected. Use filters or modify search terms.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
