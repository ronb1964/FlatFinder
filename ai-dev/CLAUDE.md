# Using ai-dev-tasks with Claude Code (CLI) — Guardrailed Flow

This project follows the ai-dev-tasks workflow:
1) PRD → 2) Generate Tasks → 3) Process Tasks (one at a time).

## Golden Rules (paste these before each run)
- Do **one** task at a time from the current `/ai-dev/tasks-*.md`.
- Only edit files necessary for that single task.
- If another file must change, explain **why** first.
- Keep functions small; prefer new helpers over large edits.
- No renames/moves unless the task explicitly says so.
- Output a **unified diff** of changes.

## Commands you can copy into Claude Code CLI

### A) Start work on PRD #0001 tasks (calibration rotation)
“Read `/ai-dev/tasks-0001-calibration-rotation.md`. We will process tasks **one at a time**.  
Follow these guardrails:  
- change only files required for the current task,  
- explain any extra file changes first,  
- output a unified diff,  
- include short manual test steps.  
Begin with Task 1: **Content Rotation Wrapper**. Propose a filename and implement it.”

### B) Review + test after each task
“Explain exactly what changed and any risks. Then give me **5–8 manual test steps** with expected results. If changes touch multiple files, confirm they were necessary.”

### C) Proceed to the next task
“Proceed to the **next numbered task** in `/ai-dev/tasks-0001-calibration-rotation.md`. Use the **same guardrails**. Output a unified diff and then the manual test steps.”

### D) If the AI tries to wander
“Stop. You are deviating from the current task. Re-read the **current numbered task** and only change files necessary to complete it. If you believe a prerequisite is missing, list it as a new task at the end of the task file instead of changing unrelated code.”

### E) Generate a checklist file when asked in tasks
“Create `/ai-dev/tests/0001-checklist.md` with 6–8 steps a non-developer can follow. Keep it tool-agnostic and offline-friendly.”

### F) Switch to Leveling UX (PRD #0002) later
“Now switch to `/ai-dev/tasks-0002-leveling-ux.md`. Process the tasks **one at a time** with the same guardrails, producing a unified diff and manual tests for each.”

## Tip: keep sessions small
- Do one task per CLI run. Commit after it passes your manual test.
- If a patch looks too large, say: “Break this into smaller steps, touching fewer files.”

## Tip: keep bundle size small
- If AI suggests libraries or images, respond: “Reject large deps; keep app size small. Use platform APIs or light utilities only.”
