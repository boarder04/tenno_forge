# Tenno Forge — Warframe Build Tracker

A local-first tool for tracking your Warframe loadouts: which mods you own and
at what rank, how much forma a build still wants, which arcanes you're missing,
slot polarities, and where to farm what you don't have.

No account, no server, no API. Everything runs in your browser and is saved to
`localStorage` on your machine.

**Live demo:** https://boarder04.github.io/tenno_forge/

## Run locally

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/boarder04/tenno_forge.git
cd tenno_forge
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To make a static build you can host anywhere:

```bash
npm run build      # output goes to dist/
npm run preview    # serve the built version locally
```

## How to use

### Categories

Items and builds live under category tabs:

| Tab | Mod slots | Arcanes | Aura / Stance / Exilus |
|---|---|---|---|
| Warframes | 8 | 2 | Aura + Exilus |
| Primary | 8 | 1 | Exilus |
| Secondary | 8 | 1 | Exilus |
| Melee | 8 | 1 | Stance + Exilus |
| Companions (Mechanical) | 10 | 0 | — |
| Companions (Animal) | 11 | 0 | — |
| Companion Weapons | 8 | 0 | — |
| Other | 8 | 1 | optional |

`Exalted` items also exist (Whipclaw, Dex Pixia, etc.) — link them to their
parent frame and ownership is derived automatically.

### Items, builds, and ownership

- An **item** is a warframe / weapon / companion. Click the hex on a card to
  mark it owned (exalted items derive their owned state from the parent frame).
- Each item can carry multiple **builds**. A build lists a mod per slot with
  the rank that slot *needs*.
- Each owned **mod** stores *your* current rank. If a build wants a higher
  rank than you have, the build flags amber and the Mods tab shows a deficit
  badge.
- **Polarities** are set per item from the item editor. Slots with no polarity
  are highlighted as "needs forma"; the build view shows a count of
  unpolarized slots.

### Readiness analysis

Each build computes:

- Missing mods (not owned)
- Under-ranked mods (owned but below the required rank)
- Missing arcanes
- Forma remaining (`Forma Required − Forma Applied`)
- Unpolarized slots

The "STILL NEEDED" panel on a build lists everything that's gating it, with
one-click "Mark owned" buttons.

### Sources

Every mod and arcane has a free-text **Source** field — vendors, mission drops,
relic packs, whatever. Missing items surface their source in the build view so
you know exactly where to go.

### Related loadouts

Items can be linked to each other (a frame ↔ its weapons, a sentinel ↔ its
weapon, an animal companion ↔ its claws). Open any item to jump to its
related ones. Exalted weapons auto-link to their parent frame.

### Backup and sharing

The footer has three data buttons:

- **Export data** — downloads `tenno-forge-data.json` with your full collection.
- **Import data** — *replaces* everything with the contents of a JSON file.
- **Merge data** — *adds to* your existing data from a JSON file. Items match
  on `name + category`, builds on `name + itemId`, mods/arcanes on `name`.
  Existing entries are never overwritten.

## Importing builds

There are two import paths depending on whether you're adding one build or a
whole pack.

### One build at a time — from a screenshot

The app can't scrape overframe.gg directly, so screenshot import works in two
steps:

1. In the Builds screen, click **Import JSON** and copy the extraction prompt.
2. Open a normal Claude chat, attach your overframe.gg or in-game Arsenal
   screenshot, and paste the prompt. Claude returns a JSON block.
3. Paste that JSON back into the app. It parses onto an editable review screen
   so you can correct anything before saving.

The single-build JSON format the extraction prompt produces:

```json
{
  "name": "Slamistar | x5 Combo Slam Spam",
  "item": "Magistar",
  "category": "Melee",
  "forma": 5,
  "arcane": "Melee Exposure",
  "arcane2": "",
  "aura": "",
  "stance": "Shattering Storm",
  "exilus": "Dispatch Overdrive",
  "guideLink": "https://overframe.gg/build/...",
  "slots": [
    { "slot": 1, "mod": "Primed Pressure Point", "rank": 10 },
    { "slot": 2, "mod": "Sacrificial Steel",     "rank": 5  },
    { "slot": 3, "mod": "Blood Rush",            "rank": 12 },
    { "slot": 4, "mod": "Organ Shatter",         "rank": 5  },
    { "slot": 5, "mod": "Seismic Wave",          "rank": 5  },
    { "slot": 6, "mod": "Primed Fever Strike",   "rank": 10 },
    { "slot": 7, "mod": "Galvanized Reflex",     "rank": 10 },
    { "slot": 8, "mod": "Corrupt Charge",        "rank": 10 }
  ]
}
```

Rules:
- `category` is one of `Warframe`, `Primary`, `Secondary`, `Melee`, `Companion`,
  `Companion Weapon`, `Exalted`, `Other`.
- `arcane2` only applies to Warframes; leave empty otherwise.
- `aura` is for Warframes, `stance` is for Melee; the rest leave empty.
- `slots` length matches the item type (8 for most, 10–11 for companions).
- Any mod / arcane named here that isn't in your inventory gets auto-added as
  not-owned, so it shows up in the Mods / Arcanes tabs to track later.

### Bulk pack — Export / Import / Merge full state

For sharing multiple items + builds at once, use a full-state JSON file. The
**Export data** button writes this format; **Import data** replaces with it;
**Merge data** adds to your existing data.

Full-state template:

```json
{
  "items": [
    {
      "id": "wf-khora",
      "name": "Khora Prime",
      "category": "Warframe",
      "owned": true,
      "subtype": null,
      "relatedIds": ["e-whipclaw", "c-venari"],
      "guideLink": "",
      "notes": "",
      "polarities": {
        "aura": "vazarin",
        "exilus": "naramon",
        "slots": [
          "madurai", "madurai", "vazarin", "vazarin",
          "vazarin", "zenurik", "naramon", "naramon"
        ]
      }
    },
    {
      "id": "c-venari",
      "name": "Venari Prime",
      "category": "Companion",
      "owned": true,
      "subtype": "Animal",
      "relatedIds": ["wf-khora", "cw-venari-claws"],
      "guideLink": "",
      "notes": "Khora's exalted Kavat companion.",
      "polarities": {
        "aura": null,
        "exilus": null,
        "slots": [
          "madurai", "madurai", "madurai", "madurai", "madurai",
          "madurai", "madurai", "madurai", "madurai", "madurai", "madurai"
        ]
      }
    }
  ],
  "builds": [
    {
      "id": "b-khora",
      "itemId": "wf-khora",
      "name": "Thunderdome Khora | SP Endurance",
      "forma": 3,
      "formaApplied": 3,
      "arcane": "Arcane Aegis",
      "arcane2": "Arcane Fury",
      "aura": "Brief Respite",
      "stance": "",
      "exilus": "Cunning Drift",
      "guideLink": "https://overframe.gg/build/...",
      "notes": "",
      "createdAt": 1733000000000,
      "slots": [
        { "slot": 1, "mod": "Pilfering Strangledome",  "rank": 3  },
        { "slot": 2, "mod": "Accumulating Whipclaw",   "rank": 3  },
        { "slot": 3, "mod": "Primed Flow",             "rank": 10 },
        { "slot": 4, "mod": "Primed Continuity",       "rank": 10 },
        { "slot": 5, "mod": "Catalyzing Shields",      "rank": 3  },
        { "slot": 6, "mod": "Equilibrium",             "rank": 10 },
        { "slot": 7, "mod": "Streamline",              "rank": 5  },
        { "slot": 8, "mod": "Overextended",            "rank": 5  }
      ]
    }
  ],
  "mods": [
    {
      "id": "mod-primed-flow",
      "name": "Primed Flow",
      "category": "Warframe",
      "owned": true,
      "ownedRank": 10,
      "source": "Baro Ki'Teer"
    }
  ],
  "arcanes": [
    {
      "id": "arc-arcane-aegis",
      "name": "Arcane Aegis",
      "category": "Warframe",
      "owned": false,
      "source": "Eidolon Hydrolyst — rare"
    }
  ]
}
```

#### Field reference

**Item**

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable unique key. Used by `builds.itemId` and `relatedIds`. |
| `name` | string | Display name. |
| `category` | string | See category list above. |
| `owned` | bool | Toggleable via the hex on item cards. Exalted items derive this. |
| `subtype` | `"Mechanical" \| "Animal" \| null` | Required for companions; controls slot count. |
| `relatedIds` | string[] | Bidirectional links. Other items' `id`s. |
| `guideLink` | string | URL to a build guide. |
| `notes` | string | Free text. |
| `polarities.aura` | polarity \| null | Aura/Stance slot. `null` = unpolarized. |
| `polarities.exilus` | polarity \| null | Exilus slot. |
| `polarities.slots` | (polarity\|null)[] | Length 8 (most), 10 (mechanical), or 11 (animal). |

**Polarity values:** `"madurai"`, `"vazarin"`, `"naramon"`, `"zenurik"`,
`"umbra"`, `"unairu"`, `"penjaga"`, `"universal"`, or `null`.

**Build**

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique. |
| `itemId` | string | Must match an item's `id`. |
| `name` | string | Build title. |
| `forma` | int | Total forma the build needs. |
| `formaApplied` | int | How many you've actually applied. |
| `arcane` | string | Arcane name. Use `""` for none. |
| `arcane2` | string | Warframes only. `""` otherwise. |
| `aura` | string | Warframes only. |
| `stance` | string | Melee only. |
| `exilus` | string | Empty for companions and companion weapons. |
| `slots` | object[] | `{ slot, mod, rank }`. `rank: ""` if unspecified. |
| `notes` | string | Free text. |
| `createdAt` | int | Unix ms. |

**Mod**

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique. |
| `name` | string | Mod display name. Matched case-insensitively across the app. |
| `category` | string | `Warframe`, `Aura`, `Stance`, `Exilus`, `Primary`, `Secondary`, `Shotgun`, `Melee`, `Companion`, `Companion Weapon`, `Exalted`, `Archgun`, `Archmelee`, `Other`. |
| `owned` | bool | |
| `ownedRank` | int \| `""` | Your current rank. `""` = unranked/unspecified. |
| `source` | string | Free text. |

**Arcane** — same shape as Mod minus `ownedRank`. `category` is one of
`Warframe`, `Melee`, `Primary`, `Secondary`, `Other`.

### Tips for hand-rolling a JSON pack

- IDs only need to be unique within the file. Pick anything stable (e.g.
  `wf-khora`, `b-khora-sp`, `mod-primed-flow`).
- For a Merge import, you can leave out the `mods` and `arcanes` arrays
  entirely — any mod / arcane your builds reference but you don't list will
  be auto-added as not-owned.
- The Merge importer matches items on `name + category`; you can safely
  re-export the same pack and re-merge without creating duplicates.

## Hosting your own copy on GitHub Pages

The repo includes a `.github/workflows/deploy.yml` that builds and publishes on
every push to `main`.

One-time setup on your fork:

1. On GitHub: **Settings → Pages → Build and deployment → Source** → set to
   **GitHub Actions**.
2. If your repo isn't named `tenno_forge`, update the `base` in
   `vite.config.js` to match your repo name (e.g. `/my-repo-name/`).
3. Push to `main` — the Action builds and publishes to `gh-pages`.

The site appears at `https://<your-user>.github.io/<repo-name>/`.

## Customising the seed

`src/seedData.js` exports a `seedAll()` function that returns the initial
`{ items, builds, mods, arcanes }` a fresh visitor sees. By default it's
empty. To bake your own starting state in:

1. Use **Export data** to download your current collection.
2. Open `src/seedData.js` and have `seedAll()` return the contents of that
   JSON file.

Fresh visitors (or anyone who clicks **Reset**) will get that starting set.

## License

MIT — see `LICENSE`. Update the copyright line with your name before sharing.
