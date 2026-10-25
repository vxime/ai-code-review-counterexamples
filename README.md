# AI Code Review Counterexamples

A small, dependency-free teaching repository with **synthetic examples** of four ways a superficial check can accept a bad result.

> **Safety and scope:** This is not a mirror, fork, export, or redacted copy of any production repository. It contains no production validator, no production patch, no private repository paths, no internal workflow, and no private commit or pull-request identifiers. The examples below are intentionally tiny and are not suitable for production use.

## What the examples demonstrate

- **SEC-01 — Existence is not exclusivity.** A toy check sees one allowed image and misses an additional unapproved reference on the same line.
- **SEC-02 — Check/use race.** A toy path check validates one target, then opens the pathname again after a controlled directory swap. The test uses temporary directories and a synthetic sentinel file.
- **SEC-03 — Reduced-motion end state.** Stopping an animation does not by itself make a transparent final frame visible.
- **SEC-04 — Source text is not rendered content.** A simple tag-counting regex counts an image tag inside an HTML comment.

The tests intentionally **reproduce the unsafe behavior** in these toy examples. A passing test means the example reproduced the documented failure mode; it does not mean a secure validator has been implemented.

## Run the examples

Requirements: Node.js 22 or newer. No third-party packages are needed.

```sh
npm test
```

## Deliberate exclusions

To protect the original private project, this repository does not include its source, internal architecture, production fixes, real manifests, site content, deployment configuration, internal paths, private commit hashes, or pull-request references. The test cases use synthetic names, paths, CSS, and sentinel data.

These examples are for code-review education only. They are not a general-purpose validator, a security library, or a production-ready fix.
