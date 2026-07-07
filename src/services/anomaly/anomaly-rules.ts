/**
 * src/services/anomaly/anomaly-rules.ts
 *
 * PURPOSE:
 *   Implements the 9 deterministic anomaly detection rules.
 *   Each rule is structured as a pure object satisfying the AnomalyRule interface.
 */

import { randomUUID } from "node:crypto";
import { Severity, toEpochMs } from "../../types/common";
import { AnomalyType } from "../../contracts/incident.contract";
import type { AnomalySignal } from "../../contracts/incident.contract";
import type { NormalisedLogEntry } from "../../types/log";
import type { AnomalyThresholds } from "../../constants/anomaly-thresholds";
import type { AnomalyRule } from "./anomaly-types";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. High CPU Rule
// ─────────────────────────────────────────────────────────────────────────────

const getCpuPercent = (entry: NormalisedLogEntry): number | null => {
  if (entry.metadata && typeof entry.metadata["cpuPercent"] === "number") {
    return entry.metadata["cpuPercent"];
  }
  const match = entry.message.match(/CPU spike detected:\s*(\d+)%/i) ||
                entry.message.match(/CPU utilisation:\s*(\d+)%/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const cpuRule: AnomalyRule = {
  name: "High CPU Utilisation",
  code: "HIGH_CPU",
  evaluate(entries, thresholds) {
    const groups = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      const cpuVal = getCpuPercent(entry);
      if (cpuVal !== null && cpuVal >= thresholds.cpuPercentLimit) {
        const key = `${entry.service}::${entry.host}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [key, triggeringEntries] of groups.entries()) {
      const [service, host] = key.split("::");
      const cpuValues = triggeringEntries.map(e => getCpuPercent(e) || 0);
      const maxCpu = Math.max(...cpuValues);
      const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

      anomalies.push({
        id: randomUUID(),
        type: AnomalyType.SPIKE,
        description: `High CPU utilisation detected on service ${service} host ${host}: peak of ${maxCpu}% exceeded threshold of ${thresholds.cpuPercentLimit}%`,
        confidence: Math.min(1.0, maxCpu / 100),
        severity: maxCpu >= 90 ? Severity.CRITICAL : Severity.ERROR,
        detectedAt,
        triggeringEntries,
        metadata: { service, host, maxCpu, threshold: thresholds.cpuPercentLimit },
      });
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 2. High Memory Rule
// ─────────────────────────────────────────────────────────────────────────────

const getMemoryPercent = (entry: NormalisedLogEntry): number | null => {
  if (entry.metadata && typeof entry.metadata["memoryPercent"] === "number") {
    return entry.metadata["memoryPercent"];
  }
  const msg = entry.message.toLowerCase();
  if (msg.includes("oomkilled") || msg.includes("out of memory") || msg.includes("heap limit exceeded")) {
    return 100;
  }
  return null;
};

export const memoryRule: AnomalyRule = {
  name: "High Memory Utilisation",
  code: "HIGH_MEMORY",
  evaluate(entries, thresholds) {
    const groups = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      const memVal = getMemoryPercent(entry);
      if (memVal !== null && memVal >= thresholds.memoryPercentLimit) {
        const key = `${entry.service}::${entry.host}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [key, triggeringEntries] of groups.entries()) {
      const [service, host] = key.split("::");
      const memValues = triggeringEntries.map(e => getMemoryPercent(e) || 0);
      const maxMem = Math.max(...memValues);
      const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

      anomalies.push({
        id: randomUUID(),
        type: AnomalyType.SPIKE,
        description: `High memory utilisation detected on service ${service} host ${host}: peak of ${maxMem}% exceeded threshold of ${thresholds.memoryPercentLimit}%`,
        confidence: Math.min(1.0, maxMem / 100),
        severity: maxMem >= 95 ? Severity.CRITICAL : Severity.ERROR,
        detectedAt,
        triggeringEntries,
        metadata: { service, host, maxMem, threshold: thresholds.memoryPercentLimit },
      });
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Error Rate Spike Rule
// ─────────────────────────────────────────────────────────────────────────────

export const errorRateRule: AnomalyRule = {
  name: "Error Rate Spike",
  code: "ERROR_RATE_SPIKE",
  evaluate(entries, thresholds) {
    const serviceLogs = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      if (!serviceLogs.has(entry.service)) {
        serviceLogs.set(entry.service, []);
      }
      serviceLogs.get(entry.service)!.push(entry);
    }

    const anomalies: AnomalySignal[] = [];
    for (const [service, serviceEntries] of serviceLogs.entries()) {
      const errorEntries = serviceEntries.filter(
        e =>
          e.severity === Severity.ERROR ||
          e.severity === Severity.CRITICAL ||
          (e.metadata && typeof e.metadata["httpStatus"] === "number" && e.metadata["httpStatus"] >= 500)
      );

      const totalCount = serviceEntries.length;
      const errorCount = errorEntries.length;
      const errorRate = totalCount > 0 ? errorCount / totalCount : 0;

      if (totalCount >= thresholds.minLogsForErrorRate && errorRate >= thresholds.errorRateLimit) {
        const detectedAt = toEpochMs(Math.max(...errorEntries.map(e => e.timestamp)));

        anomalies.push({
          id: randomUUID(),
          type: AnomalyType.SPIKE,
          description: `High error rate detected in service ${service}: ${(errorRate * 100).toFixed(1)}% errors (${errorCount}/${totalCount}) exceeded threshold of ${(thresholds.errorRateLimit * 100).toFixed(1)}%`,
          confidence: Math.min(1.0, errorRate * 1.5),
          severity: errorRate > 0.2 ? Severity.CRITICAL : Severity.ERROR,
          detectedAt,
          triggeringEntries: errorEntries,
          metadata: { service, errorRate, errorCount, totalCount, threshold: thresholds.errorRateLimit },
        });
      }
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Authentication Failures Rule
// ─────────────────────────────────────────────────────────────────────────────

const isAuthFailure = (entry: NormalisedLogEntry): boolean => {
  const status = entry.metadata && typeof entry.metadata["httpStatus"] === "number" ? entry.metadata["httpStatus"] : null;
  if (status === 401 || status === 403) return true;
  const msg = entry.message.toLowerCase();
  return (
    msg.includes("login failed") ||
    msg.includes("unauthorized") ||
    msg.includes("auth failure") ||
    msg.includes("authentication failure") ||
    msg.includes("invalid token") ||
    msg.includes("credentials invalid") ||
    (entry.service === "auth-service" && msg.includes("rate limit exceeded"))
  );
};

export const authFailureRule: AnomalyRule = {
  name: "Authentication Failures Burst",
  code: "AUTH_FAILURES",
  evaluate(entries, thresholds) {
    const serviceAuthFailures = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      if (isAuthFailure(entry)) {
        if (!serviceAuthFailures.has(entry.service)) {
          serviceAuthFailures.set(entry.service, []);
        }
        serviceAuthFailures.get(entry.service)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [service, triggeringEntries] of serviceAuthFailures.entries()) {
      const count = triggeringEntries.length;
      if (count >= thresholds.authFailureLimit) {
        const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

        anomalies.push({
          id: randomUUID(),
          type: AnomalyType.PATTERN,
          description: `Authentication failures burst in service ${service}: ${count} failures detected, exceeding threshold of ${thresholds.authFailureLimit}`,
          confidence: Math.min(1.0, count / (thresholds.authFailureLimit * 2)),
          severity: count >= thresholds.authFailureLimit * 2 ? Severity.ERROR : Severity.WARN,
          detectedAt,
          triggeringEntries,
          metadata: { service, count, threshold: thresholds.authFailureLimit },
        });
      }
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Database Timeout Burst Rule
// ─────────────────────────────────────────────────────────────────────────────

const isDbTimeout = (entry: NormalisedLogEntry, thresholds: AnomalyThresholds): boolean => {
  const msg = entry.message.toLowerCase();
  if (
    msg.includes("connection pool exhausted") ||
    msg.includes("deadlock detected") ||
    msg.includes("database timeout") ||
    msg.includes("db timeout") ||
    msg.includes("query timeout") ||
    msg.includes("postgres-primary timeout")
  ) {
    return true;
  }
  if (entry.metadata && typeof entry.metadata["dbQueryLatencyMs"] === "number") {
    return entry.metadata["dbQueryLatencyMs"] >= thresholds.dbQueryLatencyLimitMs;
  }
  return false;
};

export const dbTimeoutRule: AnomalyRule = {
  name: "Database Timeout Burst",
  code: "DB_TIMEOUT_BURST",
  evaluate(entries, thresholds) {
    const triggeringEntries = entries.filter(e => isDbTimeout(e, thresholds));
    const count = triggeringEntries.length;

    if (count >= thresholds.dbTimeoutLimit) {
      const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

      return [{
        id: randomUUID(),
        type: AnomalyType.PATTERN,
        description: `Database timeout burst detected: ${count} timeout events recorded, exceeding threshold of ${thresholds.dbTimeoutLimit}`,
        confidence: Math.min(1.0, count / (thresholds.dbTimeoutLimit * 2)),
        severity: Severity.CRITICAL,
        detectedAt,
        triggeringEntries,
        metadata: { count, threshold: thresholds.dbTimeoutLimit },
      }];
    }
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 6. High API Latency Rule
// ─────────────────────────────────────────────────────────────────────────────

const getLatencyMs = (entry: NormalisedLogEntry): number | null => {
  if (entry.metadata && typeof entry.metadata["latencyMs"] === "number") {
    return entry.metadata["latencyMs"];
  }
  const match = entry.message.match(/(?:latency|in|after)\s*=\s*(\d+)\s*ms/i) ||
                entry.message.match(/(?:completed in|timeout after)\s*(\d+)\s*ms/i) ||
                entry.message.match(/processed successfully in\s*(\d+)\s*ms/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const apiLatencyRule: AnomalyRule = {
  name: "High API Latency",
  code: "HIGH_API_LATENCY",
  evaluate(entries, thresholds) {
    const serviceLatencies = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      const lat = getLatencyMs(entry);
      if (lat !== null && lat >= thresholds.apiLatencyLimitMs) {
        if (!serviceLatencies.has(entry.service)) {
          serviceLatencies.set(entry.service, []);
        }
        serviceLatencies.get(entry.service)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [service, triggeringEntries] of serviceLatencies.entries()) {
      const count = triggeringEntries.length;
      if (count >= thresholds.slowRequestCountLimit) {
        const latencies = triggeringEntries.map(e => getLatencyMs(e) || 0);
        const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / count;
        const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

        anomalies.push({
          id: randomUUID(),
          type: AnomalyType.LATENCY,
          description: `High API latency detected in service ${service}: ${count} requests exceeded latency threshold of ${thresholds.apiLatencyLimitMs}ms (average slow request latency: ${avgLatency.toFixed(0)}ms)`,
          confidence: Math.min(1.0, avgLatency / (thresholds.apiLatencyLimitMs * 3)),
          severity: avgLatency > thresholds.apiLatencyLimitMs * 3 ? Severity.ERROR : Severity.WARN,
          detectedAt,
          triggeringEntries,
          metadata: { service, count, avgLatency, thresholdMs: thresholds.apiLatencyLimitMs },
        });
      }
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 7. Service Crash Rule
// ─────────────────────────────────────────────────────────────────────────────

const isServiceCrash = (entry: NormalisedLogEntry): boolean => {
  const msg = entry.message.toLowerCase();
  return (
    msg.includes("pod evicted") ||
    msg.includes("oomkilled") ||
    msg.includes("segmentation fault") ||
    msg.includes("unhandled exception") ||
    msg.includes("panic:") ||
    msg.includes("fatal error") ||
    msg.includes("exit code")
  );
};

export const serviceCrashRule: AnomalyRule = {
  name: "Service Crash",
  code: "SERVICE_CRASH",
  evaluate(entries, thresholds) {
    const serviceCrashes = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      if (isServiceCrash(entry)) {
        if (!serviceCrashes.has(entry.service)) {
          serviceCrashes.set(entry.service, []);
        }
        serviceCrashes.get(entry.service)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [service, triggeringEntries] of serviceCrashes.entries()) {
      const count = triggeringEntries.length;
      if (count >= thresholds.serviceCrashLimit) {
        const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

        anomalies.push({
          id: randomUUID(),
          type: AnomalyType.PATTERN,
          description: `Service crash detected for ${service}: ${count} crash events recorded, exceeding threshold of ${thresholds.serviceCrashLimit}`,
          confidence: 1.0,
          severity: Severity.CRITICAL,
          detectedAt,
          triggeringEntries,
          metadata: { service, count, threshold: thresholds.serviceCrashLimit },
        });
      }
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 8. Disk Usage Rule
// ─────────────────────────────────────────────────────────────────────────────

const getDiskUsagePercent = (entry: NormalisedLogEntry): number | null => {
  if (entry.metadata && typeof entry.metadata["diskPercent"] === "number") {
    return entry.metadata["diskPercent"];
  }
  const match = entry.message.match(/disk usage critical:\s*(\d+)%/i) ||
                entry.message.match(/disk usage[^0-9]*(\d+)%/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const diskUsageRule: AnomalyRule = {
  name: "Critical Disk Usage",
  code: "DISK_USAGE",
  evaluate(entries, thresholds) {
    const groups = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      const diskVal = getDiskUsagePercent(entry);
      if (diskVal !== null && diskVal >= thresholds.diskUsageLimitPercent) {
        const key = `${entry.service}::${entry.host}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [key, triggeringEntries] of groups.entries()) {
      const [service, host] = key.split("::");
      const diskValues = triggeringEntries.map(e => getDiskUsagePercent(e) || 0);
      const maxDisk = Math.max(...diskValues);
      const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

      anomalies.push({
        id: randomUUID(),
        type: AnomalyType.SPIKE,
        description: `Critical disk usage on service ${service} host ${host}: peak of ${maxDisk}% exceeded threshold of ${thresholds.diskUsageLimitPercent}%`,
        confidence: Math.min(1.0, maxDisk / 100),
        severity: maxDisk >= 95 ? Severity.CRITICAL : Severity.ERROR,
        detectedAt,
        triggeringEntries,
        metadata: { service, host, maxDisk, threshold: thresholds.diskUsageLimitPercent },
      });
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 9. Network Packet Loss Rule
// ─────────────────────────────────────────────────────────────────────────────

const getPacketLossPercent = (entry: NormalisedLogEntry): number | null => {
  if (entry.metadata && typeof entry.metadata["packetLossPercent"] === "number") {
    return entry.metadata["packetLossPercent"];
  }
  const match = entry.message.match(/packet loss[^0-9]*(\d+(?:\.\d+)?)\s*%/i) ||
                entry.message.match(/network packet loss[^0-9]*(\d+(?:\.\d+)?)\s*%/i);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
};

export const networkPacketLossRule: AnomalyRule = {
  name: "High Network Packet Loss",
  code: "NETWORK_PACKET_LOSS",
  evaluate(entries, thresholds) {
    const groups = new Map<string, NormalisedLogEntry[]>();
    for (const entry of entries) {
      const lossVal = getPacketLossPercent(entry);
      if (lossVal !== null && lossVal >= thresholds.networkPacketLossLimitPercent) {
        const key = `${entry.service}::${entry.host}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(entry);
      }
    }

    const anomalies: AnomalySignal[] = [];
    for (const [key, triggeringEntries] of groups.entries()) {
      const [service, host] = key.split("::");
      const lossValues = triggeringEntries.map(e => getPacketLossPercent(e) || 0);
      const maxLoss = Math.max(...lossValues);
      const detectedAt = toEpochMs(Math.max(...triggeringEntries.map(e => e.timestamp)));

      anomalies.push({
        id: randomUUID(),
        type: AnomalyType.SPIKE,
        description: `High network packet loss on service ${service} host ${host}: peak of ${maxLoss}% exceeded threshold of ${thresholds.networkPacketLossLimitPercent}%`,
        confidence: Math.min(1.0, maxLoss / 20),
        severity: maxLoss >= 10 ? Severity.CRITICAL : Severity.ERROR,
        detectedAt,
        triggeringEntries,
        metadata: { service, host, maxLoss, threshold: thresholds.networkPacketLossLimitPercent },
      });
    }
    return anomalies;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 10. Rules Registry
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_RULES: ReadonlyArray<AnomalyRule> = [
  cpuRule,
  memoryRule,
  errorRateRule,
  authFailureRule,
  dbTimeoutRule,
  apiLatencyRule,
  serviceCrashRule,
  diskUsageRule,
  networkPacketLossRule,
];
