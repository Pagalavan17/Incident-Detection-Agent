import React, { useState, useRef } from "react";
import {
  Upload,
  FileCode,
  CheckCircle,
  AlertCircle,
  Github,
  CloudLightning,
  MonitorPlay,
  Share2,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";

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

  const mockLogs = {
    AWS: `[
  { "timestamp": "2026-07-09T21:10:00Z", "level": "WARN", "service": "aws-vpc-flow", "host": "i-0a1b2c3d4e5f6g7h8", "message": "Inbound connection blocked on port 22 from unauthorized IP 198.51.100.42" },
  { "timestamp": "2026-07-09T21:11:00Z", "level": "ERROR", "service": "aws-rds-postgres", "host": "rds-db-primary", "message": "FATAL: remaining connection slots are reserved for non-replication superuser connections" },
  { "timestamp": "2026-07-09T21:12:00Z", "level": "INFO", "service": "aws-ecs-billing", "host": "ecs-task-billing-01", "message": "Order transaction routing initiated for invoice_id #98234" }
]`,
    Azure: `[
  { "timestamp": "2026-07-09T21:10:00Z", "level": "INFO", "service": "azure-app-service", "host": "vm-app-gateway-001", "message": "Routing HTTPS request to payment-processor-service" },
  { "timestamp": "2026-07-09T21:11:15Z", "level": "CRITICAL", "service": "azure-keyvault", "host": "kv-secops-prod", "message": "Access denied for service principal 'sp-payment-reader'. Access token expired or key deleted." }
]`,
    GCP: `[
  { "timestamp": "2026-07-09T21:10:00Z", "level": "INFO", "service": "gcp-gke-ingress", "host": "gke-cluster-node-99", "message": "Received HTTP POST /api/v1/checkout from 203.0.113.11" },
  { "timestamp": "2026-07-09T21:11:30Z", "level": "ERROR", "service": "gcp-pubsub", "host": "pubsub-trigger-handler", "message": "Failed to publish message: connection pool exhausted inside pubsub driver" }
]`,
    GitHub: `[
  { "timestamp": "2026-07-09T21:10:00Z", "level": "INFO", "service": "github-actions-runner", "host": "runner-ubuntu-latest", "message": "Job 'deploy-prod' started on branch 'main'" },
  { "timestamp": "2026-07-09T21:11:00Z", "level": "ERROR", "service": "github-webhooks", "host": "webhook-handler-pod", "message": "Webhook delivery failure: 504 Gateway Timeout while hitting checkout-callback-endpoint" }
]`,
    Paste: `[
  { "timestamp": "2026-07-09T21:10:00Z", "level": "INFO", "service": "api-gateway", "host": "apigw-node-1", "message": "Forwarding API request POST /checkout to payment-service" },
  { "timestamp": "2026-07-09T21:10:15Z", "level": "ERROR", "service": "payment-service", "host": "payment-pod-1a", "message": "Failed connecting to Database RDS Master. Thread connection pool exhausted." }
]`,
  };

  const handlePreFill = (platform: keyof typeof mockLogs) => {
    const data = mockLogs[platform];
    setLogsText(data);
    validateAndParse(data);
  };

  const validateAndParse = (rawText: string): Record<string, unknown>[] | null => {
    setValidationError(null);
    setSuccessCount(null);
    const trimmed = rawText.trim();
    if (!trimmed) {
      setValidationError("Log payload cannot be empty");
      return null;
    }

    const mapTextToSchema = (line: string) => {
      // Basic heuristic for syslog/text
      const levelMatch = line.match(/(ERROR|WARN|INFO|DEBUG|CRITICAL)/i);
      const level = levelMatch ? levelMatch[0].toUpperCase() : "INFO";
      return {
        timestamp: new Date().toISOString(),
        level,
        service: "ingestor",
        host: "local",
        message: line,
      };
    };

    try {
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
      try {
        const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          setValidationError("No valid log lines found");
          return null;
        }

        // Try JSONL / NDJSON
        try {
          const parsedLines = lines.map(line => JSON.parse(line));
          setSuccessCount(parsedLines.length);
          return parsedLines;
        } catch {
          // If JSONL fails, check if CSV (basic check: has commas)
          const isCsv = lines[0].includes(",") && lines.length > 1;
          
          if (isCsv) {
            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            if (headers.includes("message") || headers.includes("msg")) {
              const csvData = lines.slice(1).map(line => {
                const cols = line.split(",");
                const obj: Record<string, any> = {
                  timestamp: new Date().toISOString(),
                  level: "INFO",
                  service: "ingestor",
                  host: "local"
                };
                headers.forEach((h, i) => {
                  if (cols[i]) obj[h] = cols[i].trim();
                });
                return obj;
              });
              setSuccessCount(csvData.length);
              return csvData;
            }
          }

          // Fallback to plain text / syslog mapping
          const textData = lines.map(mapTextToSchema);
          setSuccessCount(textData.length);
          return textData;
        }
      } catch {
        setValidationError("Invalid logs format. Failed to parse text data.");
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
    } else {
      validateAndParse(val);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    readLogFile(files);
  };

  const readLogFile = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    let combinedText = "";
    let processed = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        combinedText += text + "\n";
        processed++;
        
        if (processed === fileArray.length) {
          setLogsText(combinedText);
          validateAndParse(combinedText);
        }
      };
      reader.onerror = () => {
        setValidationError(`Failed to read log file: ${file.name}`);
      };
      reader.readAsText(file);
    });
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      readLogFile(files);
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
    <form onSubmit={handleSubmit} className="space-y-5 font-mono text-left">
      {/* Platform Pre-Fills Shortcuts */}
      <div>
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
          Select Source Log Stream (Mock pre-fill)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: "GitHub", label: "GitHub", icon: Github },
            { id: "AWS", label: "AWS", icon: CloudLightning },
            { id: "Azure", label: "Azure", icon: Share2 },
            { id: "GCP", label: "GCP", icon: MonitorPlay },
            { id: "Paste", label: "Paste", icon: Terminal },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePreFill(item.id as keyof typeof mockLogs)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-white/10 hover:border-brand-neon hover:bg-brand-neon/10 rounded-lg text-[10px] text-text-secondary hover:text-white transition-all font-mono uppercase cursor-pointer"
              >
                <ItemIcon size={12} className="text-brand-accent group-hover:text-brand-neon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag and Drop Region */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.005 }}
        className={`border-2 border-dashed p-8 text-center rounded-2xl transition-all ${
          dragOver
            ? "border-brand-neon bg-brand-neon/5 shadow-glowCyan"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3 animate-bounce" />
        <p className="text-xs font-bold uppercase text-white">
          Drag & Drop Log File here
        </p>
        <p className="text-[9px] text-text-muted mt-1 uppercase">
          Supported Formats Badge list
        </p>

        {/* Formats Badges */}
        <div className="flex items-center justify-center gap-1.5 mt-3 select-none">
          {["JSON", "CSV", "TXT", "LOG"].map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded text-[8px] bg-white/5 border border-white/15 text-text-secondary font-bold font-mono"
            >
              {fmt}
            </span>
          ))}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.jsonl,.ndjson,.log,.txt,.csv,.syslog,.evtx"
          multiple
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="mt-5 px-4 py-1.5 text-xs font-semibold bg-brand-primary/20 hover:bg-brand-primary text-white border border-brand-primary/45 rounded-lg cursor-pointer transition-all uppercase"
        >
          Browse Local File
        </button>
      </motion.div>

      {/* Textarea Paste input */}
      <div className="flex flex-col space-y-1.5">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          Or Paste Raw Log Stream (JSON array or JSON lines)
        </label>
        <textarea
          rows={7}
          value={logsText}
          onChange={handleTextChange}
          disabled={isAnalyzing}
          placeholder={`[
  { "timestamp": "2026-07-09T21:10:00Z", "level": "ERROR", "service": "payment-service", "host": "payment-pod-1a", "message": "Failed connecting to Database RDS Master" }
]`}
          className="w-full bg-[#070B14] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white placeholder-text-dim focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon"
        />
      </div>

      {/* Validation status banners */}
      {validationError && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-lg flex items-start space-x-2 text-xs">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successCount !== null && !validationError && (
        <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-3 rounded-lg flex items-start space-x-2 text-xs">
          <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>Ingest validator checked: {successCount} log line(s) verified for ingestion.</span>
        </div>
      )}

      {/* Submit Trigger */}
      <button
        type="submit"
        disabled={isAnalyzing || !logsText.trim() || !!validationError}
        className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary disabled:from-brand-primary/20 disabled:to-brand-primary/20 disabled:text-text-dim text-white font-bold tracking-widest text-xs uppercase border border-brand-accent/30 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-xl hover:shadow-brand-primary/25"
      >
        <FileCode size={14} className="mr-2" />
        {isAnalyzing ? "Executing Cognitive Diagnostic Pipeline..." : "Execute Incident Response"}
      </button>
    </form>
  );
};

export default LogUploader;
