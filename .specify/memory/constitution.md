<!--
SYNC IMPACT REPORT (temporary scratch material — remove before committing)

Version change: (unratified template) → 1.0.0
Modified principles: none (initial ratification; all template placeholders resolved)
Added sections:
  - Core Principles I–V (Readability First, Idiomatic Code, Simple Design,
    Testability as a Design Constraint, Consistency & Maintainability)
  - Code Quality Standards
  - Development Workflow
  - Governance
Removed sections: none
Follow-up TODOs: none (tech stack not yet chosen; principles are written
language-agnostically and apply to any language/framework adopted)
END SYNC IMPACT REPORT
-->

# Daily Bible Constitution

## Core Principles

### I. Readability First

Code is read far more often than it is written; every change MUST optimize for
the next reader, not the author.

- Names MUST reveal intent: verbs for functions, nouns for types/modules,
  predicates (`is_`, `has_`, `can_`) for booleans. No abbreviations that
  require decoding.

- Functions MUST do one thing at one level of abstraction.

- Guard clauses are preferred over nested conditionals; nesting MUST NOT
  exceed three levels.

- Plain, obvious code beats clever code. A reviewer MUST be able to read a
  function top-to-bottom without consulting the author.

### II. Idiomatic Code

Code MUST follow the conventions and idioms of the language and frameworks in
use, not a generic house style.

- Use the community-standard formatter and linter for the stack (e.g.,
  rustfmt + Clippy for Rust, PEP 8 + Ruff for Python, ESLint + Prettier with
  an established config for TypeScript) and accept their verdicts.

- Prefer the standard library and established ecosystem libraries over
  hand-rolled equivalents.

- Follow the framework's intended patterns rather than working around them;
  framework-mandated conventions (hooks rules, lifecycle, dependency
  injection) are non-negotiable.

### III. Simple Design (YAGNI)

Build the simplest solution that satisfies the current spec.

- No speculative abstractions: extract only on the Rule of Three, when
  duplication has proven the need.

- Explicit is better than implicit; direct is better than clever.

- Comments explain WHY (context, constraints, links to specs), never WHAT.
  Code that needs a "what" comment MUST be renamed or restructured instead.

- Dead code, commented-out code, and unused parameters MUST be deleted;
  version control keeps the history.

### IV. Testability as a Design Constraint

If it cannot be tested through its public interface, the design is wrong.

- Every feature MUST ship with tests that verify the behavior described in
  its spec; tests are part of the definition of done, not an afterthought.

- Tests MUST be deterministic, independent, and named after the behavior they
  verify.

- Linting, formatting, type checking, and tests MUST pass before any merge;
  CI enforces these gates.

### V. Consistency & Maintainability

- One formatter, one linter, one naming style across the repository; style
  debates end at the tool config, not in review.

- Public interfaces (exported functions, CLI flags, API routes, schemas)
  MUST be explicit, documented, and changed deliberately with migration notes.

- When touching code, leave it better: fix misleading names, remove dead
  branches, and reduce debt in the immediate vicinity of the change.

## Code Quality Standards

- Naming: descriptive, pronounceable, unabbreviated; no type-encoding
  prefixes (no Hungarian notation).

- Functions: ≤ ~40 lines, ≤ 4 parameters (use an options object beyond
  that), cyclomatic complexity ≤ 10.

- Errors: handle explicitly at the appropriate boundary; never swallow an
  error or return null where an error type exists.

- Comments: only for WHY, context, or spec references; every TODO MUST
  reference an issue.

- Dependencies: additions MUST be justified in review (maintenance status,
  license, necessity) and pinned.

## Development Workflow

- Changes follow the Spec Kit flow — spec → plan → tasks → implementation —
  before code is written.

- Every PR MUST state which spec/task it implements and MUST be reviewed for
  constitution compliance; reviewers MAY reject on readability grounds alone.

- Refactoring MUST be a separate, described change, never mixed silently
  into a feature PR.

- CI MUST run format check, lint, type check, and tests on every PR; red CI
  blocks merge without exception.

## Governance

- This constitution supersedes ad-hoc preferences and prior habits; in any
  conflict, it wins.

- Amendments require: documented motivation, a semantic version bump
  (MAJOR: removals or redefinitions; MINOR: new principles or material
  expansion; PATCH: clarifications and wording), and an updated Last Amended
  date.

- Compliance is verified in every review; deviations MUST be justified in
  writing and approved explicitly.

**Version**: 1.0.0 | **Ratified**: 2026-10-20 | **Last Amended**: 2026-10-20
