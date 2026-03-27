# Modified Build Notice

This is a modified build of Superset desktop.

Upstream project:
- Superset
- Copyright 2025-2026 Superset, Inc.
- Licensed under Elastic License 2.0 (ELv2)

Fork / distributor:
- Downstream local-only fork maintained outside the upstream Superset release channel

This build includes local modifications:
- disabled Superset cloud authentication for local-only use during development and research workflows
- disabled or redirected Superset backend and Electric dependencies for local workspace use
- changed branding and release/update configuration so this fork is not presented as an official Superset desktop release

This build is not an official Superset release.

When redistributing this modified build, include this notice together with the upstream `LICENSE.md` file.

Recommended distribution notes:
- keep this notice in the packaged app under `Contents/Resources/legal/`
- keep the upstream `LICENSE.md` in the packaged app under `Contents/Resources/legal/`
- add a visible in-product or download-page notice that the build is modified
- do not remove or obscure upstream licensing, copyright, or trademark notices
