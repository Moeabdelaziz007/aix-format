# Archived development reports

This directory holds dated reports, fix summaries, audit snapshots, and
one-off plans that used to live at the repository root. They have been
moved here because they are historical artifacts of the build, not
authoritative documentation. They are kept (instead of deleted) so the
project's history of decisions and incidents stays inspectable.

If you are looking for the current canonical surface, read these files
instead, all at the repo root:

- `README.md` — what AIX Format is, how to use it.
- `CHANGELOG.md` — versioned, semver-aligned change log.
- `ROADMAP.md` — what's planned next.
- `CONTRIBUTING.md` — how to contribute.
- `COPYRIGHT.md`, `LICENSE` — legal.
- `AGENT_GOVERNANCE.md`, `AIX_CONSTITUTION.md`, `AIX_RULES.md`,
  `ARCH_DECISIONS.md` — governance and architecture rules that bind
  every contributor (human or agent).
- `openmemory.md` — the living journal.

Anything in this archive directory is informational, not binding.
Cross-references between archived files still resolve because the whole
set moved together; cross-references _into_ this archive from outside
(for example from `docs/CRITICAL_FIXES_APPLIED.md` or `scripts/README.md`)
may need a `docs/archive/` prefix to keep working — fix those inbound
links lazily as they're encountered.
