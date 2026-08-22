## Hackathon execution mode

Optimize for speed and low token usage.

- Make the requested changes directly.
- Do not create git worktrees unless explicitly requested.
- Do not install/reinstall dependencies unless required for the change.
- Do not run baseline tests before editing.
- Do not load optional skills or perform independent code reviews.
- Do not create temporary preview routes.
- Do not use browser/computer inspection unless specifically requested.
- Do not repeatedly inspect responsive layouts.
- Keep progress updates extremely short.
- Do not explain routine git/tool operations.
- Avoid reading unrelated files.
- Prefer targeted file reads over repository-wide exploration.

After implementation:
1. Run `npm run typecheck` once.
2. Run the most relevant targeted test if one exists.
3. Run `npm run build` only when explicitly requested or when the change could affect production compilation.
4. Do not rerun successful checks.

For simple frontend changes, edit only the relevant components/styles and stop.

Git:
- Work on the current requested branch.
- Do not create worktrees.
- Do not commit, push, merge, or create PRs unless explicitly requested.

When the requested task is complete, give only:
- files changed
- checks run
- any issue requiring attention