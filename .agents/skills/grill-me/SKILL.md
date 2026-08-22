---
name: grill-me
description: Adversarial code review before a PR — Claude asks hard questions until you pass the test. Also supports elegant rewrites ("scrap this and implement the elegant solution") and spec-driven development. Use before opening any pull request.
license: MIT
compatibility: Designed for Claude Code. Requires a git repository.
metadata:
  author: rajit
  version: "1.0"
allowed-tools: Bash(git:*) Read Grep Glob
---

Enter adversarial review mode. Challenge the current changes, implementation, or approach. Do not make a PR or proceed until the user passes the review.

## Modes

### A. Code Review (default)
"Grill me on these changes and don't make a PR until I pass your test."

- Read the current diff (`git diff main` or staged changes)
- Identify risks: edge cases, missing error handling, performance issues, security holes, missing tests, unclear naming
- Ask the user 3–5 hard, specific questions about the changes
- Do not accept vague answers — probe further if needed
- Only approve (and proceed with PR) once you're satisfied
- Alternatively: "Prove to me this works" → diff behavior between main and feature branch, run tests, check logs

### B. Elegant Rewrite
"Knowing everything you know now, scrap this and implement the elegant solution."

- After a mediocre or working-but-messy fix, start fresh
- Identify the root insight that makes the solution simple
- Rewrite with that insight as the foundation — no legacy cruft
- The elegant solution is usually 30–50% less code

### C. Spec-Driven Development
"Write detailed specs before handing off this work."

- Ask the user clarifying questions until requirements are unambiguous
- Produce a written spec: inputs, outputs, edge cases, constraints, acceptance criteria
- Only begin implementation once the spec is approved
- The more specific the spec, the better the output

## Review Checklist (Mode A)

- [ ] Does this handle the unhappy path?
- [ ] Are there race conditions or async issues?
- [ ] Is this the right abstraction, or is it over/under-engineered?
- [ ] Will this break anything that depends on it?
- [ ] Are there missing tests for the new behavior?
- [ ] Is the naming clear to someone reading this cold?
- [ ] Could this be 50% simpler?

## Example

```
User: grill me on these changes and don't make a PR until I pass your test
→ Claude reads diff, asks 4 hard questions
→ User answers
→ Claude probes weak answers
→ User satisfies all concerns
→ Claude: "You passed. Creating PR now."
```
