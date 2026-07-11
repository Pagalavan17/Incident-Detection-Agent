# Sidebar & PipelineProgress Bugfix Design

## Overview

Two UI components in the Incident Response Agent frontend misinterpret a `null` pipeline result as "step never ran", when in fact the backend always attempts every step and a `null` result means the step ran but produced no usable output.

**Defect 1 — Sidebar over-gating:** `Sidebar.tsx` gates Root Cause, Remediation, Guardrails, and Post-Mortem nav items behind the presence of their individual data fields (e.g. `!!currentIncident?.rootCause`). The correct gate is simply `!!currentIncident`, since the target pages already render an `EmptyState` when specific data is absent.

**Defect 2 — PipelineProgress "skipped" misnomer:** `PipelineProgress.tsx` labels null step data as `"skipped"` and renders a neutral `HelpCircle` icon. It should render `"failed"` with a red `XCircle`. Neither component shows any visual state during `isAnalyzing`.

The fix touches exactly two files: `frontend/src/components/ui/Sidebar.tsx` and `frontend/src/components/incident/PipelineProgress.tsx`. The `Dashboard.tsx` call site also needs a one-line `isAnalyzing` pass-through. No changes to context, types, routes, or backend.

---

## Glossary

- **Bug_Condition (C)**: The conditions that trigger the observed defects — see formal specs below.
- **Property (P)**: The desired correct behavior when C holds.
- **Preservation**: Existing behaviors that must remain byte-for-byte equivalent after the fix.
- **`hasIncident`**: `!!currentIncident` — the sole gate for incident-scoped nav items in the fixed sidebar.
- **`isAnalyzing`**: boolean from `useIncident()` / `IncidentContext` that is `true` while the AI pipeline is running.
- **`"failed"` step**: A pipeline step whose result field is `null`, meaning the backend attempted it but produced no output.
- **`"skipped"` step**: Genuinely omitted — this concept does not exist in the current backend contract; the current `"skipped"` label is therefore always a misnomer for `null` results.

---

## Bug Details

### Bug Condition — Sidebar

The bug manifests when `currentIncident` is truthy but one or more of its nullable sub-fields (`rootCause`, `remediation`, `guardrails`, `postMortem`) are `null`, causing those nav items to render as non-navigable locked `<div>` elements. A secondary manifestation is the absence of a loading state when `isAnalyzing` is `true`.

**Formal Specification:**
```
FUNCTION isBugCondition_Sidebar(X)
  INPUT: X = { currentIncident, isAnalyzing }
  OUTPUT: boolean

  RETURN (X.currentIncident IS NOT NULL AND ANY OF (
    X.currentIncident.rootCause IS NULL,
    X.currentIncident.remediation IS NULL,
    X.currentIncident.guardrails IS NULL,
    X.currentIncident.postMortem IS NULL
  )) OR (X.isAnalyzing = TRUE AND X.currentIncident IS NULL)
END FUNCTION
```

### Examples — Sidebar

- **Partial pipeline failure**: Analysis completes, `rootCause` is non-null but `remediation` is `null` → "Remediation" nav item is stuck locked. *Expected*: navigable `<NavLink>`.
- **Full pipeline failure on sub-fields**: `currentIncident` set, all four sub-fields `null` → all four items locked. *Expected*: all four navigable.
- **Analysis in progress**: `isAnalyzing=true`, `currentIncident=null` → items show Lock icon. *Expected*: items show spinner/pending visual.
- **Pre-analysis (clean state)**: `isAnalyzing=false`, `currentIncident=null` → items show Lock icon. *Unchanged behavior — this is correct.*

### Bug Condition — PipelineProgress

The bug manifests when a pipeline step data field is `null` (set to `"skipped"` status instead of `"failed"`) or when `isAnalyzing` is `true` but no in-progress indicator is shown.

**Formal Specification:**
```
FUNCTION isBugCondition_Pipeline(X)
  INPUT: X = { incidentData, isAnalyzing }
  OUTPUT: boolean

  RETURN (ANY step IN [historicalMatches, rootCause, remediation, guardrails, postMortem]
    WHERE X.incidentData[step] IS NULL)
  OR X.isAnalyzing = TRUE
END FUNCTION
```

### Examples — PipelineProgress

- **null rootCause**: `incidentData.rootCause = null` → renders `HelpCircle` / "skipped". *Expected*: `XCircle` (red) / "failed".
- **null postMortem**: `incidentData.postMortem = null` → neutral icon. *Expected*: red `XCircle`.
- **isAnalyzing=true**: No step shows a spinner. *Expected*: in-progress steps (those not yet completed) show `Loader2`.
- **All data present**: All fields non-null → all show `CheckCircle2`. *Unchanged — still correct.*

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Pre-analysis lock state: when `currentIncident` is `null` AND `isAnalyzing` is `false`, all incident-gated sidebar items remain non-navigable locked `<div>` elements.
- Dashboard, Upload Logs, and System Health nav items always render as `<NavLink>` regardless of state.
- Incident Details link continues to gate on `hasIncident` only (already correct).
- Pipeline steps where data is non-null continue to render `CheckCircle2` (success/green).
- The first two steps (Log Ingestion and Anomaly Scans) always render as `"success"` — they are hardcoded and do not change.
- The IncidentContext, CompleteIncidentResponse type, App.tsx route structure, and backend contract are not modified.

**Scope:**
All inputs that do NOT satisfy the bug conditions above must produce identical rendered output before and after the fix.

---

## Hypothesized Root Cause

1. **Incorrect gating predicate in Sidebar**: The developer used `hasRca = !!currentIncident?.rootCause` (and equivalent checks) as the navigation gate, intending to prevent users from visiting empty pages. The correct intent is to only block access before an incident exists — the target pages already handle absent data with `EmptyState`. The sub-field checks are an over-eager guard.

2. **Missing `isAnalyzing` prop in PipelineProgress**: `PipelineProgress` receives only `incidentData: CompleteIncidentResponse`. It has no access to `isAnalyzing`, so it cannot render an in-progress state. The prop interface needs extending.

3. **"skipped" as a catch-all in PipelineProgress**: The ternary `incidentData.rootCause ? "success" : "skipped"` was written without considering that `null` from the backend means failure, not omission. Changing the else branch to `"failed"` aligns with the backend contract.

4. **Sidebar lacks `isAnalyzing` awareness**: `Sidebar.tsx` only reads `currentIncident` from `useIncident()`. Adding `isAnalyzing` to the destructure and using it to conditionally render a loader icon (instead of the lock) covers the pending state during analysis.

---

## Correctness Properties

Property 1: Bug Condition — Sidebar Nav Items are Navigable When Incident Exists

_For any_ state where `currentIncident` is non-null (regardless of which sub-fields are null), the fixed Sidebar SHALL render the Root Cause, Remediation, Guardrails, and Post-Mortem items as navigable `<NavLink>` elements.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Bug Condition — Sidebar Shows Loading State During Analysis

_For any_ state where `isAnalyzing` is `true` AND `currentIncident` is `null`, the fixed Sidebar SHALL render the incident-gated items with a loading/pending visual indicator (e.g. animated `Loader2` icon) instead of the static lock icon.

**Validates: Requirements 2.5**

Property 3: Bug Condition — PipelineProgress Shows Failed for Null Steps

_For any_ pipeline step whose data field is `null`, the fixed PipelineProgress SHALL render that step with a red `XCircle` icon and a "failed" label.

**Validates: Requirements 2.6**

Property 4: Bug Condition — PipelineProgress Shows Loading During Analysis

_For any_ render where `isAnalyzing` is `true`, the fixed PipelineProgress SHALL display an animated loading indicator (e.g. `Loader2`) on in-progress steps.

**Validates: Requirements 2.7**

Property 5: Preservation — Pre-Analysis Lock State Unchanged

_For any_ state where `currentIncident` is `null` AND `isAnalyzing` is `false`, the fixed Sidebar SHALL produce identical output to the original Sidebar (locked non-navigable `<div>` for incident-gated items).

**Validates: Requirements 3.1, 3.5**

Property 6: Preservation — Successful Steps Unchanged

_For any_ pipeline step whose data field is non-null, the fixed PipelineProgress SHALL produce identical output to the original (green `CheckCircle2`).

**Validates: Requirements 3.3, 3.4**

---

## Fix Implementation

### Changes Required

**File**: `frontend/src/components/ui/Sidebar.tsx`

**Specific Changes**:
1. **Destructure `isAnalyzing`** from `useIncident()` in addition to `currentIncident`.
2. **Import `Loader2`** from `lucide-react` (replaces Lock icon for the pending state).
3. **Remove sub-field derived booleans** (`hasRca`, `hasRemediation`, `hasGuardrails`, `hasPostMortem`) — they are no longer used as gates.
4. **Simplify gating condition** for Root Cause, Remediation, Guardrails, Post-Mortem: use `hasIncident` only.
5. **Add pending/loading visual branch**: when `!hasIncident && isAnalyzing`, render items with `Loader2` animated icon and a muted-but-not-fully-opaque style (distinct from the locked state).

---

**File**: `frontend/src/components/incident/PipelineProgress.tsx`

**Specific Changes**:
1. **Extend `PipelineProgressProps`** to include `isAnalyzing: boolean`.
2. **Import `Loader2`** from `lucide-react`.
3. **Change `"skipped"` to `"failed"`** in all five nullable step ternaries (`historicalMatches`, `rootCause`, `remediation`, `guardrails`, `postMortem`).
4. **Add `"loading"` status branch**: when `isAnalyzing` is `true`, override the status of steps that are `null` with `"loading"` so they render a spinner.
5. **Add `Loader2` render branch** in the icon switch for `"loading"` status.

---

**File**: `frontend/src/pages/Dashboard.tsx`

**Specific Changes**:
1. **Destructure `isAnalyzing`** from `useIncident()`.
2. **Pass `isAnalyzing={isAnalyzing}`** to the `<PipelineProgress>` call site.

---

## Testing Strategy

### Validation Approach

Two-phase approach: first surface counterexamples on unfixed code, then verify the fix satisfies all properties and preserves unchanged behaviors.

### Exploratory Bug Condition Checking

**Goal**: Demonstrate the bugs on unfixed code to confirm root cause analysis.

**Test Cases**:
1. **Sidebar with null sub-fields**: Render `<Sidebar>` with `currentIncident` set but `rootCause=null` → observe Lock icon on Root Cause item instead of `<NavLink>`. (Fails on unfixed code)
2. **PipelineProgress null step**: Render `<PipelineProgress>` with `incidentData.remediation=null` → observe `HelpCircle` icon with "skipped" label. (Fails on unfixed code)
3. **Sidebar analyzing state**: Render with `isAnalyzing=true, currentIncident=null` → observe static Lock icon with no loading indicator. (Fails on unfixed code)
4. **PipelineProgress analyzing state**: Render with `isAnalyzing=true` → observe no spinner on any step. (Fails on unfixed code)

**Expected Counterexamples**:
- Lock icon appears even when `currentIncident` is truthy.
- `HelpCircle` ("skipped") appears for null pipeline results that should be "failed".

### Fix Checking

**Goal**: Verify all four correctness properties hold on fixed code.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition_Sidebar(X) DO
  rendered := Sidebar_fixed(X)
  IF X.currentIncident IS NOT NULL THEN
    ASSERT rendered.incidentGatedItems ARE NavLink elements
  ELSE IF X.isAnalyzing = TRUE THEN
    ASSERT rendered.incidentGatedItems SHOW Loader2 (not Lock)
  END IF
END FOR

FOR ALL X WHERE isBugCondition_Pipeline(X) DO
  rendered := PipelineProgress_fixed(X)
  FOR EACH step WHERE X.incidentData[step] IS NULL DO
    ASSERT rendered[step].icon = XCircle (red)
  END FOR
  IF X.isAnalyzing = TRUE THEN
    ASSERT rendered SHOWS at least one Loader2 icon
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify all inputs outside the bug condition produce identical output before and after the fix.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition_Sidebar(X) AND NOT isBugCondition_Pipeline(X) DO
  ASSERT Sidebar(X) = Sidebar_fixed(X)
  ASSERT PipelineProgress(X) = PipelineProgress_fixed(X)
END FOR
```

**Key preservation cases**:
- Pre-analysis state: `currentIncident=null, isAnalyzing=false` → Lock icons unchanged
- All sub-fields present: all nav items navigable (already true before fix, stays true after)
- Steps with non-null data: `CheckCircle2` unchanged
- Log Ingestion and Anomaly Scans: always "success", unchanged

### Unit Tests

- Render `<Sidebar>` with `currentIncident` fully populated → all items are `<NavLink>`.
- Render `<Sidebar>` with `currentIncident` set and `rootCause=null` → Root Cause is still a `<NavLink>` (not a `<div>`).
- Render `<Sidebar>` with `currentIncident=null, isAnalyzing=false` → incident-gated items are locked `<div>` elements.
- Render `<Sidebar>` with `currentIncident=null, isAnalyzing=true` → incident-gated items show `Loader2`, not Lock.
- Render `<PipelineProgress>` with `remediation=null, isAnalyzing=false` → step shows `XCircle`.
- Render `<PipelineProgress>` with all data present → all non-first-two steps show `CheckCircle2`.
- Render `<PipelineProgress>` with `isAnalyzing=true, rootCause=null` → that step shows `Loader2`.

### Property-Based Tests

- Generate random `CompleteIncidentResponse` objects with each nullable field independently set to `null` or a value → verify each sidebar gate uses only `hasIncident`.
- Generate random `isAnalyzing` / `currentIncident` combinations → verify lock vs loader vs active state is always consistent.
- Generate random pipeline result objects → verify icon mapping is deterministic: non-null → `CheckCircle2`, null+notAnalyzing → `XCircle`, null+analyzing → `Loader2`.

### Integration Tests

- Full flow: upload logs → trigger analysis → while `isAnalyzing=true`, verify sidebar shows loaders and PipelineProgress shows spinners.
- Post-analysis with partial failure: verify sidebar items with null sub-fields are navigable, failed steps show red XCircle.
- Navigate to each page with null sub-field data → verify `EmptyState` renders (page-level behavior, unchanged).
