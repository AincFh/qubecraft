# 3D Voxel Survival — ATLAS Fork Integration

> **Upstream authored work.** AincFh is maintaining an experimental fork, not claiming to have created this game/tool.
>
> Original source: https://github.com/krabduke/qubecraft
> Original MIT license: [LICENSE](LICENSE), retained. Do not strip copyright notices.

## Project status

- Original gameplay and source code imported from upstream through GitHub Fork with visible parent repository.
- ATLAS integration status: `fork / review and QA required`, **not** an independently released AincFh original game.
- Upstream preview sites are independent of this fork; don't claim the fork is deployed until GitHub Actions succeeds and browser behavior is verified.

## Development priority

**世界加载与帧率优化** — first review engine structure and track actual issues, then develop small, independently verifiable PRs.

## Browser acceptance checklist

键鼠、触控、出生、采集、制作、夜间生存、存档重载；NORENDER 测试不等于渲染性能.

Test both desktop and touch where supported, capture the specific commit SHA, Actions result, browser console, and screenshot/video evidence. Preserve upstream history and MIT license in any derivative distribution.

## Further rules

Do not merge unrelated forks into original ATLAS games; avoid retroactively declaring an unmodified upstream feature as our implementation. New assets must be original or licensed for reuse. Any project-specific runtime and deployment dependencies must be validated separately.
