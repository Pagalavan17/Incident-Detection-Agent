import React, { useState, useRef } from "react";
import { Upload, FileCode, CheckCircle, AlertCircle } from "lucide-react";

interface LogUploaderProps {
  onUpload: (logs: Record<string, unknown>[]) => void;
  isAnalyzing: boolean;
}

export const LogUploader: React.FC<LogUploaderProps> = ({ onUpload, isAnalyzing }) => {
  const [logsText, setLogsText] = useState<string>("");
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndParse = (rawText: string): Record<string, unknown>[] | null => {
    setValidationError(null);
    setSuccessCount(null);
    const trimmed = rawText.trim();
    if (!trimmed) {
      setValidationError("Log payload cannot be empty");
      return null;
    }

    try {
      // 1. Attempt to parse as standard JSON (object or array)
      const parsed = JSON.parse(trimmed);
      
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setValidationError("Log array must not be empty");
          return null;
        }
        setSuccessCount(parsed.length);
        return parsed as Record<string, unknown>[];
      }

      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.logs)) {
          if (parsed.logs.length === 0) {
            setValidationError("The 'logs' array field must not be empty");
            return null;
          }
          setSuccessCount(parsed.logs.length);
          return parsed.logs as Record<string, unknown>[];
        }
        setValidationError("JSON object must contain a 'logs' array field");
        return null;
      }

      setValidationError("Parsed value is not a valid JSON array or object");
      return null;
    } catch {
      // 2. If standard JSON fails, attempt to parse as JSON Lines (JSONL)
      try {
        const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          setValidationError("No valid log lines found");
          return null;
        }

        const parsedLines = lines.map(line => JSON.parse(line));
        setSuccessCount(parsedLines.length);
        return parsedLines;
      } catch {
        setValidationError("Invalid logs format. Must be a valid JSON array, a JSON object containing a 'logs' array, or a list of JSON Lines (one object per line).");
        return null;
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLogsText(val);
    if (!val) {
      setValidationError(null);
      setSuccessCount(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readLogFile(file);
  };

  const readLogFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setLogsText(text);
      validateAndParse(text);
    };
    reader.onerror = () => {
      setValidationError("Failed to read log file");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readLogFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLogs = validateAndParse(logsText);
    if (parsedLogs) {
      onUpload(parsedLogs);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-mono text-left">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-6 text-center transition-all ${
          dragOver
            ? "border-cyber-primary bg-cyber-primary/5"
            : "border-cyber-border-light dark:border-cyber-border-dark bg-cyber-panel-light dark:bg-cyber-panel-dark"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-3" />
        <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
          Drag & Drop Log File here
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase">
          Supports .json, .log, or plain text JSON Lines
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.log,.txt"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="mt-4 px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-cyber-border-light dark:border-cyber-border-dark cursor-pointer transition-all uppercase"
        >
          Select File
        </button>
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Or Paste Raw Log Stream (JSON array or JSON lines)
        </label>
        <textarea
          rows={10}
          value={logsText}
          onChange={handleTextChange}
          disabled={isAnalyzing}
          placeholder={`[
  { "timestamp": "2026-07-07T16:00:00Z", "level": "ERROR", "service": "api-gateway", "host": "prod-1", "message": "Failed connecting to DB" }
]`}
          className="w-full bg-cyber-bg-light dark:bg-cyber-bg-dark border border-cyber-border-light dark:border-cyber-border-dark p-3 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-700 focus:outline-none focus:border-cyber-primary"
        />
      </div>

      {/* Validation status banners */}
      {validationError && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 flex items-start space-x-2 text-xs">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successCount !== null && !validationError && (
        <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-3 flex items-start space-x-2 text-xs">
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>Format verified: {successCount} log line(s) ready for ingestion.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isAnalyzing || !logsText.trim()}
        className="w-full flex items-center justify-center py-2.5 bg-cyber-primary hover:bg-cyber-primary/95 disabled:bg-cyber-primary/45 text-white font-bold tracking-widest text-xs uppercase border border-cyber-primary cursor-pointer transition-all"
      >
        <FileCode size={14} className="mr-2" />
        {isAnalyzing ? "Analyzing Log Payload..." : "Execute Incident Response"}
      </button>
    </form>
  );
};
export default LogUploader;
