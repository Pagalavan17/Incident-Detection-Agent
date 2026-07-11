import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIncident } from "../../context/IncidentContext";

interface Message {
  sender: "user" | "ai";
  text: string;
  isStreaming?: boolean;
}

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "SecOps Copilot active. Ingest logs and select a query option below, or write a custom question.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const { currentIncident } = useIncident();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "Summarize Logs", value: "Summarize the ingested logs and session data." },
    { label: "Explain Incident", value: "What is the probable cause and reasoning of this incident?" },
    { label: "Suggest Remediation", value: "What are the recommended actions to resolve this incident?" },
    { label: "Predict Impact", value: "What is the estimated blast radius and risk impact?" },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const simulateAISetting = (fullText: string) => {
    setMessages((prev) => [...prev, { sender: "ai", text: "", isStreaming: true }]);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setMessages((prev) => {
          const next = [...prev];
          if (next[next.length - 1]) {
            next[next.length - 1] = {
              sender: "ai",
              text: fullText.substring(0, currentIndex + 3),
              isStreaming: true,
            };
          }
          return next;
        });
        currentIndex += 3;
      } else {
        clearInterval(interval);
        setMessages((prev) => {
          const next = [...prev];
          if (next[next.length - 1]) {
            next[next.length - 1] = {
              sender: "ai",
              text: fullText,
              isStreaming: false,
            };
          }
          return next;
        });
      }
    }, 15);
  };

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setInputValue("");

    let reply = "";
    const cleanQuery = textToSend.toLowerCase();

    if (!currentIncident) {
      reply = "I don't detect any active operational session. Please upload a system log file in the Ingestion module first so that I can diagnose system failures.";
    } else {
      const { incident, rootCause, remediation } = currentIncident;

      if (cleanQuery.includes("summar") || cleanQuery.includes("log")) {
        reply = `Incident Summary:
• Title: ${incident.title}
• Current Lifecycle: ${incident.lifecycle}
• Detected At: ${new Date(incident.detectedAt).toLocaleString()}
• Log entry count: ${incident.logBatch?.entries?.length || 0}
• Total anomalies detected: ${currentIncident.anomalies.length}

Would you like to drill down into the Root Cause or the Remediation options next?`;
      } else if (cleanQuery.includes("cause") || cleanQuery.includes("explain") || cleanQuery.includes("rca")) {
        if (rootCause) {
          reply = `Root Cause Diagnosis:
• Probable Cause: ${rootCause.probableCause}
• AI Confidence: ${Math.round(rootCause.confidence * 100)}%
• Reasoning: ${rootCause.reasoning}

Supporting evidence found in logs:
${rootCause.evidence.map((e) => ` - "${e}"`).join("\n")}`;
        } else {
          reply = "The Root Cause Analysis module completed but did not find a high-confidence fault chain. Please check the logs manually in the Telemetry section.";
        }
      } else if (cleanQuery.includes("remedi") || cleanQuery.includes("suggest") || cleanQuery.includes("fix")) {
        if (remediation) {
          reply = `Remediation Recommendations:
• Immediate mitigations:
${remediation.immediateActions.map((a) => ` - ${a}`).join("\n")}

• Long term structural fixes:
${remediation.longTermFixes.map((a) => ` - ${a}`).join("\n")}

• Estimated Impact: ${remediation.estimatedImpact}
• Rollback Required: ${remediation.rollbackRequired ? "Yes" : "No"}`;
        } else {
          reply = "The AI agent did not output distinct remediation commands for this session run. Please examine the policy guardrails.";
        }
      } else if (cleanQuery.includes("impact") || cleanQuery.includes("predict") || cleanQuery.includes("risk")) {
        if (remediation) {
          reply = `Risk Assessment & Impact Analysis:
• Estimated Impact Level: ${remediation.estimatedImpact}
• Safety Guardrail Level: ${currentIncident.guardrails?.riskLevel || "LOW"}
• Known risks:
${remediation.risks?.map((r) => ` - ${r}`).join("\n") || " - No extreme deployment risks reported."}
• Approved for Auto-remediation: ${currentIncident.guardrails?.approved ? "Yes (Safe to execute)" : "No (Manual approval required)"}`;
        } else {
          reply = "Unable to estimate impact. Remediation metrics are missing.";
        }
      } else {
        reply = `I've analyzed the current active case session:
• Case ID: #${incident.runId.substring(0, 8)}...
• Impact severity: ${incident.severity} (${incident.priority})
• Primary service affected: ${incident.title.split(" ").slice(-1)[0]}

Feel free to ask me to 'summarize logs', 'explain the root cause', or 'list remediation actions' for custom details.`;
      }
    }

    setTimeout(() => {
      simulateAISetting(reply);
    }, 400);
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(79,70,229,0.5)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-brand-primary to-brand-accent text-white rounded-full flex items-center justify-center shadow-lg z-50 cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageSquare size={24} />
              {currentIncident && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-neon rounded-full animate-ping" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-96 h-[500px] glass-lg rounded-2xl flex flex-col z-50 shadow-2xl overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/15 to-transparent border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/30 flex items-center justify-center border border-brand-primary/40 text-brand-neon">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">SecOps Copilot</h4>
                  <span className="text-[10px] text-brand-neon font-mono flex items-center gap-1">
                    <Shield size={10} /> AI Agent Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs font-mono whitespace-pre-line leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-brand-primary text-white border border-brand-primary/20 rounded-tr-none"
                        : "bg-white/5 text-text-secondary border border-white/5 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3 bg-brand-neon ml-1 animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="p-2 border-t border-white/5 bg-black/20 flex flex-wrap gap-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => handleSend(prompt.value)}
                  className="px-2 py-1 text-[10px] bg-white/5 hover:bg-brand-primary/25 border border-white/5 hover:border-brand-primary/45 rounded text-text-secondary hover:text-white transition-all font-mono"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="p-3 border-t border-white/10 bg-[#070B14]/80 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask custom question..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary font-mono"
              />
              <button
                type="submit"
                className="px-3 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat;
