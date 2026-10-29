# my-archify

A fork of [Archify](https://github.com/tt-a1i/archify) by tt-a1i, reduced to one diagram type: **architecture**.

my-archify is an agent skill that turns a system description or a real codebase into a checked, standalone HTML architecture diagram. The renderer, validation gates and viewer come from Archify 3.2.0 (upstream commit `d6059331`).

## What changed from Archify

| Kept | Removed |
|---|---|
| `architecture` renderer, schema and examples | workflow, sequence, dataflow, lifecycle, erd, class, tree, timeline and waterfall diagrams |
| `finalize`, `deliver`, `validate`, `check`, `browser-check`, `visual-check`, `preview`, `inspect` | explainer pages, architecture compare, workflow migration, scenario guide |
| Viewer runtime (themes, motion, export, path tracing) | upstream website, docs, gallery, benchmarks and release tooling |
| English and Korean locales | other locale catalogs |

The full list is in the commit history and in [NOTICE](NOTICE).

## Install

The skill lives in the `archify/` folder. Node.js 18 or newer is required; the skill itself has no runtime dependencies.

Copy the folder into your agent's skills directory under the name `my-archify`. For Claude Code:

```bash
git clone https://github.com/songyaeji/my-archify.git
cp -r my-archify/archify ~/.claude/skills/my-archify
```

Check the installation:

```bash
node ~/.claude/skills/my-archify/bin/archify.mjs doctor
```

## Use

Ask your agent to draw an architecture diagram, for example "draw the architecture of this repository". The skill writes a `candidate.json`, then renders and checks it:

```bash
node bin/archify.mjs finalize architecture candidate.json output.html --quality showcase --json
```

For a diagram backed by a local repository, pass `--repo-root <path>` so source evidence is verified. See [archify/SKILL.md](archify/SKILL.md) for the full authoring flow.

## Update checks

Archify checks the upstream stable manifest during delivery and can show an update reminder. Upstream releases do not contain this fork's changes, so installing one replaces my-archify with Archify. Set `ARCHIFY_UPDATE_CHECK_DISABLED=1` to turn the check off.

## License

[Apache-2.0](LICENSE), the same license as Archify. Historical MIT grants remain in effect; see [NOTICE](NOTICE) and [LICENSE-MIT](LICENSE-MIT). Third-party components keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

This fork is not affiliated with or endorsed by the Archify project. If you find the renderer useful, consider starring [tt-a1i/archify](https://github.com/tt-a1i/archify).
