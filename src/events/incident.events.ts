/**
 * src/events/incident.events.ts
 *
 * PURPOSE:
 *   Defines the strongly-typed internal event system for the incident
 *   lifecycle. The event bus allows pipeline steps, services, and Mastra
 *   workflows to broadcast state changes without needing direct references
 *   to their consumers.
 *
 * DESIGN DECISIONS:
 *   • Discriminated union events  — each event type is its own interface with
 *     a unique literal `type` field. TypeScript narrows the payload type
 *     correctly in switch statements and type guards.
 *   • IncidentEvent union         — one `type IncidentEvent = ...` type that
 *     covers every possible event. Subscribers receive this union and narrow
 *     using the `type` discriminant.
 *   • IncidentEventEmitter class  — a lightweight, type-safe event emitter
 *     built on Node's EventEmitter. All listener registrations are typed — no
 *     `any` in the public API.
 *   • Synchronous listeners only  — async listeners must handle their own
 *     errors. The emitter fires-and-forgets; it does not await listeners.
 *     This is intentional: side effects (notifications, metrics) must not
 *     block the pipeline.
 *   • No external dependencies    — uses only Node's built-in EventEmitter.
 *
 * DEPENDENCY RULE:
 *   Imports from types/common and models/IncidentContext.
 *   Never import from contracts (except for types already re-exported through
 *   IncidentContext), services, mastra, api, or config.
 */

import { EventEmitter } from "node:events";
import type { AppError, CorrelationId, EpochMs, IncidentId, RunId } from "../types/common";
import type { IncidentContext } from "../models/IncidentContext";
import type { IncidentLifecycle } from "../contracts/incident.contract";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Event Type Enum
//
//   Closed set of all event names in the system.
//   Using an enum (not plain strings) ensures renaming is caught by the
//   compiler and prevents typos in event name comparisons.
// ─────────────────────────────────────────────────────────────────────────────

/** All incident lifecycle event types emitted by the system. */
export enum IncidentEventType {
  /** A new incident has been created from an anomaly signal. */
  INCIDENT_CREATED = "INCIDENT_CREATED",

  /** The incident lifecycle state has changed. */
  LIFECYCLE_CHANGED = "LIFECYCLE_CHANGED",

  /** A pipeline step has started processing the incident. */
  STEP_STARTED = "STEP_STARTED",

  /** A pipeline step completed successfully. */
  STEP_COMPLETED = "STEP_COMPLETED",

  /** A pipeline step failed — an error has been recorded. */
  STEP_FAILED = "STEP_FAILED",

  /** Root cause analysis has been completed. */
  RCA_COMPLETED = "RCA_COMPLETED",

  /** Remediation actions have been generated. */
  REMEDIATIONS_GENERATED = "REMEDIATIONS_GENERATED",

  /** Enkrypt AI guardrail validation has completed. */
  REMEDIATIONS_VALIDATED = "REMEDIATIONS_VALIDATED",

  /** The incident has been resolved. */
  INCIDENT_RESOLVED = "INCIDENT_RESOLVED",

  /** The post-mortem draft has been generated. */
  POST_MORTEM_GENERATED = "POST_MORTEM_GENERATED",

  /** The incident has been closed (terminal state). */
  INCIDENT_CLOSED = "INCIDENT_CLOSED",

  /** An unrecoverable error has occurred — the incident is in FAILED state. */
  INCIDENT_FAILED = "INCIDENT_FAILED",
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Individual Event Interfaces (Discriminated Union Members)
// ─────────────────────────────────────────────────────────────────────────────

/** Shared envelope fields present on every event. */
interface BaseEvent {
  /** The specific event type — used as the discriminant. */
  readonly type: IncidentEventType;
  /** The incident this event relates to. */
  readonly incidentId: IncidentId;
  /** Cross-cutting trace identifier. */
  readonly correlationId: CorrelationId;
  /** Wall-clock time when this event was emitted. */
  readonly emittedAt: EpochMs;
}

/** Emitted when a new IncidentContext is first created. */
export interface IncidentCreatedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.INCIDENT_CREATED;
  /** The full context as it exists at creation time. */
  readonly context: IncidentContext;
}

/** Emitted every time the incident's lifecycle state changes. */
export interface LifecycleChangedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.LIFECYCLE_CHANGED;
  readonly previousLifecycle: IncidentLifecycle;
  readonly nextLifecycle: IncidentLifecycle;
  /** The run that triggered this state change. */
  readonly runId: RunId;
}

/** Emitted when a pipeline step begins executing. */
export interface StepStartedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.STEP_STARTED;
  readonly stepName: string;
  readonly runId: RunId;
  readonly startedAt: EpochMs;
}

/** Emitted when a pipeline step completes without error. */
export interface StepCompletedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.STEP_COMPLETED;
  readonly stepName: string;
  readonly runId: RunId;
  readonly durationMs: number;
}

/** Emitted when a pipeline step fails. */
export interface StepFailedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.STEP_FAILED;
  readonly stepName: string;
  readonly runId: RunId;
  readonly error: AppError;
  readonly durationMs: number;
}

/** Emitted when RCA completes successfully. */
export interface RcaCompletedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.RCA_COMPLETED;
  readonly rcaSummary: string;
  readonly confidence: string;
}

/** Emitted when remediation actions are generated. */
export interface RemediationsGeneratedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.REMEDIATIONS_GENERATED;
  readonly actionCount: number;
}

/** Emitted after Enkrypt AI has validated the remediation actions. */
export interface RemediationsValidatedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.REMEDIATIONS_VALIDATED;
  readonly approvedCount: number;
  readonly rejectedCount: number;
  readonly needsReviewCount: number;
}

/** Emitted when the incident reaches RESOLVED state. */
export interface IncidentResolvedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.INCIDENT_RESOLVED;
  /** Total time from detection to resolution in milliseconds. */
  readonly resolutionTimeMs: number;
}

/** Emitted when the post-mortem draft has been generated. */
export interface PostMortemGeneratedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.POST_MORTEM_GENERATED;
  readonly postMortemTitle: string;
}

/** Emitted when the incident is closed (terminal). */
export interface IncidentClosedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.INCIDENT_CLOSED;
  /** The final lifecycle state at closure. */
  readonly finalLifecycle: IncidentLifecycle;
}

/** Emitted when an unrecoverable error places the incident in FAILED state. */
export interface IncidentFailedEvent extends BaseEvent {
  readonly type: typeof IncidentEventType.INCIDENT_FAILED;
  /** The step that caused the failure. */
  readonly failedInStep: string;
  readonly error: AppError;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. IncidentEvent — The Master Discriminated Union
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete union of all possible incident events.
 * Subscribers receive this union and narrow the concrete type via:
 *
 *   switch (event.type) {
 *     case IncidentEventType.INCIDENT_CREATED:
 *       // TypeScript knows event is IncidentCreatedEvent here
 *   }
 */
export type IncidentEvent =
  | IncidentCreatedEvent
  | LifecycleChangedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepFailedEvent
  | RcaCompletedEvent
  | RemediationsGeneratedEvent
  | RemediationsValidatedEvent
  | IncidentResolvedEvent
  | PostMortemGeneratedEvent
  | IncidentClosedEvent
  | IncidentFailedEvent;

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Type-Safe Event Listener
// ─────────────────────────────────────────────────────────────────────────────

/** A function that handles any IncidentEvent. */
export type IncidentEventListener = (event: IncidentEvent) => void;

/** A function that handles a specific, narrowed event type. */
export type TypedEventListener<T extends IncidentEvent> = (event: T) => void;

// ─────────────────────────────────────────────────────────────────────────────
// § 5. IncidentEventEmitter — Type-Safe Event Bus
//
//   Wraps Node's EventEmitter with a fully typed public API.
//   All methods use the IncidentEventType enum — no raw string event names.
// ─────────────────────────────────────────────────────────────────────────────

/** The single channel name used for all incident events on the emitter. */
const INCIDENT_CHANNEL = "incident" as const;

/**
 * A type-safe, application-level event emitter for incident lifecycle events.
 *
 * USAGE — Emitting:
 *   const emitter = new IncidentEventEmitter();
 *   emitter.emit({ type: IncidentEventType.INCIDENT_CREATED, ... });
 *
 * USAGE — Subscribing:
 *   emitter.on((event) => {
 *     if (event.type === IncidentEventType.STEP_FAILED) {
 *       // TypeScript: event is StepFailedEvent
 *       console.error(event.error.message);
 *     }
 *   });
 *
 * SINGLETON:
 *   Export a singleton instance below for use across the application.
 *   Multiple test instances can be created by calling `new IncidentEventEmitter()`.
 */
export class IncidentEventEmitter {
  readonly #emitter: EventEmitter;

  constructor() {
    this.#emitter = new EventEmitter();
    // In production, many listeners may exist (metrics, logging, notifications).
    // Increase the default max to suppress spurious warnings.
    this.#emitter.setMaxListeners(50);
  }

  /**
   * Emit an incident event to all registered listeners.
   * Fire-and-forget: does not await async listeners.
   */
  emit(event: IncidentEvent): void {
    this.#emitter.emit(INCIDENT_CHANNEL, event);
  }

  /**
   * Register a listener for all incident events.
   * Returns an unsubscribe function for easy cleanup.
   */
  on(listener: IncidentEventListener): () => void {
    this.#emitter.on(INCIDENT_CHANNEL, listener);
    return () => {
      this.#emitter.off(INCIDENT_CHANNEL, listener);
    };
  }

  /**
   * Register a listener for a specific event type.
   * The listener receives the narrowed event type — no manual narrowing needed.
   *
   * @example
   *   emitter.onType(IncidentEventType.STEP_FAILED, (event) => {
   *     // event is StepFailedEvent — fully typed
   *     logger.error(event.error.message);
   *   });
   */
  onType<T extends IncidentEvent>(
    eventType: T["type"],
    listener: TypedEventListener<T>
  ): () => void {
    const wrapped = (event: IncidentEvent): void => {
      if (event.type === eventType) {
        listener(event as T);
      }
    };
    this.#emitter.on(INCIDENT_CHANNEL, wrapped);
    return () => {
      this.#emitter.off(INCIDENT_CHANNEL, wrapped);
    };
  }

  /**
   * Register a one-time listener for a specific event type.
   * Automatically removes itself after the first matching event.
   */
  onceType<T extends IncidentEvent>(
    eventType: T["type"],
    listener: TypedEventListener<T>
  ): void {
    const wrapped = (event: IncidentEvent): void => {
      if (event.type === eventType) {
        listener(event as T);
        this.#emitter.off(INCIDENT_CHANNEL, wrapped);
      }
    };
    this.#emitter.on(INCIDENT_CHANNEL, wrapped);
  }

  /**
   * Remove all listeners — primarily useful in tests to prevent cross-test
   * state leakage.
   */
  removeAllListeners(): void {
    this.#emitter.removeAllListeners(INCIDENT_CHANNEL);
  }

  /** Returns the count of currently registered listeners. */
  get listenerCount(): number {
    return this.#emitter.listenerCount(INCIDENT_CHANNEL);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Application-Level Singleton
//
//   A shared emitter instance for use across the application.
//   Tests should create their own instances to avoid cross-test state.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The application-wide incident event bus.
 * Import this in pipeline steps, services, and Mastra workflows to
 * publish or subscribe to incident lifecycle events.
 */
export const incidentEventBus = new IncidentEventEmitter();

// ─────────────────────────────────────────────────────────────────────────────
// § 7. Event Factory Helpers
//
//   Convenience functions that construct event objects with the correct shape.
//   Using these prevents field omission bugs when emitting events.
// ─────────────────────────────────────────────────────────────────────────────

/** Shared base fields applied to every emitted event. */
const baseEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId
): Pick<BaseEvent, "incidentId" | "correlationId" | "emittedAt"> => ({
  incidentId,
  correlationId,
  emittedAt: Date.now() as EpochMs,
});

/** Factory — build an INCIDENT_CREATED event. */
export const makeIncidentCreatedEvent = (
  context: IncidentContext
): IncidentCreatedEvent => ({
  type: IncidentEventType.INCIDENT_CREATED,
  ...baseEvent(context.id, context.correlationId),
  context,
});

/** Factory — build a LIFECYCLE_CHANGED event. */
export const makeLifecycleChangedEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId,
  runId: RunId,
  previousLifecycle: IncidentLifecycle,
  nextLifecycle: IncidentLifecycle
): LifecycleChangedEvent => ({
  type: IncidentEventType.LIFECYCLE_CHANGED,
  ...baseEvent(incidentId, correlationId),
  runId,
  previousLifecycle,
  nextLifecycle,
});

/** Factory — build a STEP_STARTED event. */
export const makeStepStartedEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId,
  runId: RunId,
  stepName: string,
  startedAt: EpochMs
): StepStartedEvent => ({
  type: IncidentEventType.STEP_STARTED,
  ...baseEvent(incidentId, correlationId),
  runId,
  stepName,
  startedAt,
});

/** Factory — build a STEP_COMPLETED event. */
export const makeStepCompletedEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId,
  runId: RunId,
  stepName: string,
  durationMs: number
): StepCompletedEvent => ({
  type: IncidentEventType.STEP_COMPLETED,
  ...baseEvent(incidentId, correlationId),
  runId,
  stepName,
  durationMs,
});

/** Factory — build a STEP_FAILED event. */
export const makeStepFailedEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId,
  runId: RunId,
  stepName: string,
  error: AppError,
  durationMs: number
): StepFailedEvent => ({
  type: IncidentEventType.STEP_FAILED,
  ...baseEvent(incidentId, correlationId),
  runId,
  stepName,
  error,
  durationMs,
});

/** Factory — build an INCIDENT_RESOLVED event. */
export const makeIncidentResolvedEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId,
  resolutionTimeMs: number
): IncidentResolvedEvent => ({
  type: IncidentEventType.INCIDENT_RESOLVED,
  ...baseEvent(incidentId, correlationId),
  resolutionTimeMs,
});

/** Factory — build an INCIDENT_FAILED event. */
export const makeIncidentFailedEvent = (
  incidentId: IncidentId,
  correlationId: CorrelationId,
  failedInStep: string,
  error: AppError
): IncidentFailedEvent => ({
  type: IncidentEventType.INCIDENT_FAILED,
  ...baseEvent(incidentId, correlationId),
  failedInStep,
  error,
});
