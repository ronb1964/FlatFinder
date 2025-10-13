# PRD: Leveling Outputs UX (Blocks & Trailer Hitch)

## Problem
After measuring pitch/roll, users need clear, offline instructions: how many blocks under each wheel and (for trailers) how far to raise/lower the hitch. Instructions must be glanceable, with limits/warnings for impractical stacks.

## Goals (V1)
1. **Blocks per wheel**: select counts to achieve ≤0.2° tolerance (configurable).
2. **Trailer hitch delta**: display inches to raise/lower tongue jack; show wheel blocks too.
3. **Edge constraints**: warn when max stack exceeded and propose alternatives.

## UX Requirements
- Simple schematic (4 wheels for RV/van; 2 wheels + tongue for trailer).
- Labels like “+2 blocks” per wheel; “Raise hitch 1.25 in”.
- Respect configured block sizes (editable in Settings).

## Technical Requirements
- Use existing leveling math; avoid heavy new libs.
- Round to achievable block stacks from user’s configured sizes.
- Deterministic outputs; document rounding rules and tolerance.

## Acceptance Criteria
- Given realistic inputs, app produces unambiguous instructions within tolerance, or shows a clear warning with alternatives.
