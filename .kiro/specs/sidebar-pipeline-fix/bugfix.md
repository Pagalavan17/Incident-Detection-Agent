# Bugfix Requirements Document

## Introduction

The frontend of the Incident Response Agent has two related UI defects.

**Defect 1 — Over-strict sidebar gating.** The sidebar gates five navigation items (Incident Details, Root Cause, Remediation, Guardrails, Post-Mortem) behind the presence of their respective data fields on `currentIncident` (e.g. `hasRca = !!currentIncident?.rootCause`). When the AI pipeline degrades gracefully and returns `null` for any of those fields, the corresponding sidebar item stays permanently locked with a lock icon, even though `currentIncident` exists and the target pages already render an `EmptyState` when their specific data is `null`. Users who ran a successful analysis but whose pipeline partially failed cannot navigate to those pages at all.

**Defect 2 — PipelineProgress conflates "failed" and "skipped" states.** The component sets `status: "skipped"` for any pipeline step whose data field is `null`, and renders the same neutral `HelpCircle` icon regardless of whether the step was genuinely skipped or actually failed. There is also no visual indication that a step is in-progress while `isAnalyzing` is `true`.

Both defects share the same root trigger: the components treat a `null` result from the backend as equivalent to "the step was never run", when in practice it means "the step ran but produced no usable output".

---

## Bug Analysis

### Current Behavior (Defect)

**Sidebar gating**

1.1 WHEN `currentIncident` exists AND `currentIncident.rootCause` is `null` THEN the system renders the Root Cause sidebar item as a non-navigable locked `<div>` instead of a `<NavLink>`

1.2 WHEN `currentIncident` exists AND `currentIncident.remediation` is `null` THEN the system renders the Remediation sidebar item as a non-navigable locked `<div>` instead of a `<NavLink>`

1.3 WHEN `currentIncident` exists AND `currentIncident.guardrails` is `null` THEN the system renders the Guardrails sidebar item as a non-navigable locked `<div>` instead of a `<NavLink>`

1.4 WHEN `currentIncident` exists AND `currentIncident.postMortem` is `null` THEN the system renders the Post-Mortem sidebar item as a non-navigable locked `<div>` instead of a `<NavLink>`

1.5 WHEN `isAnalyzing` is `true` (pipeline is actively running) THEN the system renders all incident-gated sidebar items as permanently locked `<div>` elements showing a Lock icon, with no indication that analysis is in progress

**PipelineProgress failed vs skipped distinction**

1.6 WHEN a pipeline step's data field (e.g. `rootCause`, `remediation`) is `null` THEN the system sets `status: "skipped"` regardless of whether the step actually ran and failed or was intentionally omitted, and renders the same `HelpCircle` icon for both cases

1.7 WHEN `isAnalyzing` is `true` THEN the PipelineProgress component has no in-progress visual state — steps show only success or neutral (skipped) icons, never a running/loading indicator

### Expected Behavior (Correct)

**Sidebar gating**

2.1 WHEN `currentIncident` exists AND `currentIncident.rootCause` is `null` THEN the system SHALL render the Root Cause sidebar item as a navigable `<NavLink>` (the page shows `EmptyState` when data is absent)

2.2 WHEN `currentIncident` exists AND `currentIncident.remediation` is `null` THEN the system SHALL render the Remediation sidebar item as a navigable `<NavLink>`

2.3 WHEN `currentIncident` exists AND `currentIncident.guardrails` is `null` THEN the system SHALL render the Guardrails sidebar item as a navigable `<NavLink>`

2.4 WHEN `currentIncident` exists AND `currentIncident.postMortem` is `null` THEN the system SHALL render the Post-Mortem sidebar item as a navigable `<NavLink>`

2.5 WHEN `isAnalyzing` is `true` AND `currentIncident` is `null` THEN the system SHALL render the incident-gated sidebar items in a pending/loading visual state (distinct from both the locked state and the active navigable state), conveying that analysis is underway

**PipelineProgress failed vs skipped distinction**

2.6 WHEN a pipeline step's data field is `null` THEN the system SHALL render that step with a red `XCircle` icon and a "failed" label to indicate the step ran but produced no output (since the backend pipeline always attempts every step)

2.7 WHEN `isAnalyzing` is `true` THEN the system SHALL render currently in-progress pipeline steps with an animated loading indicator (spinner or `Loader2` icon) to convey that the pipeline is actively running

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `currentIncident` is `null` AND `isAnalyzing` is `false` THEN the system SHALL CONTINUE TO render all incident-gated sidebar items as non-navigable locked `<div>` elements (pre-analysis state is unchanged)

3.2 WHEN `currentIncident` exists AND a data field such as `rootCause` is non-null THEN the system SHALL CONTINUE TO render the corresponding sidebar item as a navigable `<NavLink>` with its normal icon

3.3 WHEN a pipeline step's data field is non-null THEN the system SHALL CONTINUE TO render that step with a green `CheckCircle2` icon indicating success

3.4 WHEN `currentIncident` exists AND the first two pipeline steps (Log Ingestion and Anomaly Scans) always have data THEN the system SHALL CONTINUE TO render those steps as `"success"` in PipelineProgress

3.5 WHEN the user navigates to the Dashboard, Upload Logs, or System Health pages THEN the system SHALL CONTINUE TO render those sidebar items as always-navigable `<NavLink>` elements regardless of `currentIncident` or `isAnalyzing` state

3.6 WHEN the IncidentContext, CompleteIncidentResponse type, App.tsx route structure, and backend pipeline contract are in use THEN the system SHALL CONTINUE TO consume them without modification

---

## Bug Condition Derivation

**Bug Condition C(X) — Sidebar gating:**
```pascal
FUNCTION isBugCondition_Sidebar(X)
  INPUT: X = { currentIncident, isAnalyzing }
  OUTPUT: boolean

  // Bug fires when an incident exists but a sub-field is null,
  // OR when analysis is running and the sidebar shows a lock instead of a loader
  RETURN (X.currentIncident IS NOT NULL AND ANY OF (
    X.currentIncident.rootCause IS NULL,
    X.currentIncident.remediation IS NULL,
    X.currentIncident.guardrails IS NULL,
    X.currentIncident.postMortem IS NULL
  )) OR (X.isAnalyzing = TRUE AND X.currentIncident IS NULL)
END FUNCTION
```

**Fix Checking Property:**
```pascal
// Property: Fix Checking — incident-gated items are navigable when incident exists
FOR ALL X WHERE isBugCondition_Sidebar(X) DO
  rendered ← Sidebar'(X)
  IF X.currentIncident IS NOT NULL THEN
    ASSERT rendered.incidentGatedItems ARE NavLink elements
  ELSE IF X.isAnalyzing = TRUE THEN
    ASSERT rendered.incidentGatedItems SHOW loading/pending state (NOT Lock icon)
  END IF
END FOR
```

**Bug Condition C(X) — PipelineProgress:**
```pascal
FUNCTION isBugCondition_Pipeline(X)
  INPUT: X = { incidentData, isAnalyzing }
  OUTPUT: boolean

  // Bug fires when a non-always-present step has null data (shown as skipped not failed)
  // OR when pipeline is running but no in-progress indicator is shown
  RETURN ANY step IN [rootCause, remediation, guardrails, postMortem, historicalMatches]
    WHERE X.incidentData[step] IS NULL
  OR X.isAnalyzing = TRUE
END FUNCTION
```

**Fix Checking Property:**
```pascal
// Property: Fix Checking — null steps render as failed, running shows loader
FOR ALL X WHERE isBugCondition_Pipeline(X) DO
  rendered ← PipelineProgress'(X)
  FOR EACH step WHERE X.incidentData[step] IS NULL DO
    ASSERT rendered[step].icon = XCircle (red, failed)
  END FOR
  IF X.isAnalyzing = TRUE THEN
    ASSERT rendered SHOWS at least one Loader2/spinner icon
  END IF
END FOR
```

**Preservation Goal:**
```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_Sidebar(X) AND NOT isBugCondition_Pipeline(X) DO
  ASSERT Sidebar(X) = Sidebar'(X)
  ASSERT PipelineProgress(X) = PipelineProgress'(X)
END FOR
```
