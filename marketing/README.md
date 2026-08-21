# PulseRoom — Marketing Folder

Everything needed to build the PulseRoom marketing site lives in this folder.

| File | What it is |
|---|---|
| [`PULSEROOM_MARKETING_PACKAGE.md`](PULSEROOM_MARKETING_PACKAGE.md) | The complete 18-section product marketing package: positioning, pitches, feature inventory, UI analysis, screenshot plan, animation plan, all landing-page copy, visual style guide, competitive analysis, image-generation prompts, motion storyboards, page structure, and checklists. |
| [`CONTENT_MARKETING_BRIEF.md`](CONTENT_MARKETING_BRIEF.md) | The content-creation brief: audience & their exact language, messaging house, voice rules, content pillars with post ideas, hook bank, per-channel playbook (TikTok/YouTube/Reddit/Pinterest/blog SEO), 4-week launch calendar, KPIs, and publishing guardrails. |
| [`developer-handoff.json`](developer-handoff.json) | Machine-readable version — colors, fonts, tokens, features, screenshots, animations, copy, SEO, FAQs, CTAs, navigation, image prompts. Directly consumable by another Claude Code instance building the site. |
| [`screenshots/`](screenshots/) | Real app captures S1–S10 (1280×840 PNG), taken from the shipped app via `capture.js` in the project root. Re-run `node_modules\electron\dist\electron.exe capture.js` after any UI change to refresh them. |
| [`logo/`](logo/) | Full logo kit: five-bar mark SVG (color, mono white, mono black), horizontal logo (dark-bg, light-bg, mono white), stacked logo, `favicon.svg`, and transparent mark PNGs at 512/1024. Color versions are designed for dark backgrounds; use `-on-light` / `mono-black` on white. |
| [`video/`](video/) | `pulseroom-walkthrough.mp4` — 51 s, 1280×840, 30 fps scripted walkthrough of every page with a simulated cursor (tap tempo → delay copy → reverb spaces → EQ instruments → compression envelope → chains → guide → reference). Silent; add music per §15 of the package. Re-record with `record.js` in the project root after UI changes. |

## How to use with another Claude Code instance

Point it at this folder and say:

> "Build the PulseRoom landing page using `marketing/PULSEROOM_MARKETING_PACKAGE.md` as the spec and `marketing/developer-handoff.json` as the design tokens and copy source. Follow the section order in §16 and the style guide in §11 exactly."

## Before launch

1. Raw screenshots S1–S10 are already in `screenshots/`; assemble the S11–S12 composites and any hero-grade framed versions per §7.
2. Replace the placeholder testimonials with real quotes (they are clearly marked).
3. Verify download links and file sizes per OS.
