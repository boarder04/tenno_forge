# Tenno Forge — Warframe Build Tracker

A local-first tool for tracking your Warframe builds: which mods you own, what
ranks they need, how much forma a build still wants, which arcanes you're
missing, and where to farm what you don't have.

No account, no server, no API. Everything runs in your browser and is saved to
`localStorage` on your machine.

## Quick start

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone <your-repo-url>
cd tenno-forge
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To make a static build you can open or host anywhere:

```bash
npm run build      # output goes to dist/
npm run preview    # serve the built version locally
```

## What it does

**Items and builds.** An *item* is a warframe or weapon (e.g. Magistar). Each
item can hold multiple *builds*. Builds are organised under tabs: Warframes,
Primary, Secondary, Melee, and Other (companions and exalted weapons live here).

**Importing a build.** The app can't scrape overframe.gg directly, so import
works in two steps:

1. In the Builds screen, click **Import JSON** and copy the extraction prompt.
2. Open a normal Claude chat, attach your overframe.gg or in-game Arsenal
   screenshot, paste the prompt. Claude returns a JSON block.
3. Paste that JSON back into the app. It parses onto an editable review screen
   so you can correct anything before saving.

Mod slot order is preserved exactly, which matters for elemental combinations.

**Mod and rank tracking.** Mark a mod owned once and it counts across every
build. Each owned mod stores *your* rank; each build slot stores the rank it
*needs*. If you own a mod but at too low a rank, the build flags it amber and
the Mods screen shows a deficit badge.

**Sources.** Every mod and arcane has a free-text Source field — list vendors,
mission drops, whatever. Missing items surface their source so you know where
to go.

**Related loadouts.** Link weapons, companions and frames together. Exalted
weapons come pre-linked to their frame (Exalted Blade ↔ Excalibur, etc.).

**Backup and sharing.** The footer has Export / Import buttons. Export writes a
JSON file of your whole collection; a friend can Import it into their own copy.

## Pre-loaded data

The app ships seeded with:

- The base Warframe roster.
- Exalted weapons linked to their frames.
- ~160 common meta mods and ~45 arcanes.
- One worked example build (a Magistar) so nothing starts empty.

This seed is a **curated starting point, not a complete game database**. Mod
max-ranks in the seed are approximate — correct them as you go. Anything
missing can be added inside the app, and any mod/arcane named in an imported
build is added automatically.

## Roadmap ideas

- Replace the curated seed with a full dataset sourced from the Warframe wiki
  or the community `warframe-items` data package, so every item/mod/arcane is
  present out of the box.
- Per-build elemental-order preview.

## Customising the seed

Open `src/App.jsx` and edit the `WARFRAMES`, `EXALTED`, `SEED_MODS` and
`SEED_ARCANES` constants near the top. Use the in-app **Reset** button
afterwards to regenerate from the new seed (this clears existing data — export
first).

## License

MIT — see `LICENSE`. Update the copyright line with your name before sharing.
