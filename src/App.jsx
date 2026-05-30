import React, { useState, useEffect, useRef, useMemo } from 'react';
import { seedAll } from './seedData';
import {
  Hammer, Package, Sparkles, Plus, Upload, Search, Check, X, Trash2, Pencil,
  ChevronLeft, ChevronRight, ChevronDown, Copy, AlertTriangle, Hexagon,
  ClipboardList, Flame, ShieldQuestion, ListChecks, Save, Link2, ExternalLink,
  Layers, Users, Swords, ArrowUpCircle
} from 'lucide-react';

/* ----------------------------------------------------------------------- */
/* constants & helpers                                                     */
/* ----------------------------------------------------------------------- */

const STORAGE_KEY = 'wf-build-tracker-v1';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const norm = (s) => (s || '').trim().toLowerCase();
const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));

const ITEM_CATEGORIES = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Companion', 'Companion Weapon', 'Exalted', 'Other'];
const CATEGORY_TABS = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Companion', 'Companion Weapon', 'Other'];
const buildTabFor = (cat) => (CATEGORY_TABS.includes(cat) ? cat : 'Other');

const RELATION_GROUPS = [
  ['Primary', 'Primary Weapons'],
  ['Secondary', 'Secondary Weapons'],
  ['Melee', 'Melee Weapons'],
  ['Companion', 'Companions'],
  ['Companion Weapon', 'Companion Weapons'],
  ['Exalted', 'Exalted Weapons'],
  ['Warframe', 'Warframes'],
  ['Other', 'Other'],
];

const COMPANION_SUBTYPES = ['Mechanical', 'Animal'];
const modSlotCountFor = ({ category, subtype } = {}) => {
  if (category === 'Companion') return subtype === 'Animal' ? 11 : 10;
  return 8;
};
const hasAuraSlot = (cat) => cat === 'Warframe';
const hasStanceSlot = (cat) => cat === 'Melee';
const hasTopSlot = (cat) => hasAuraSlot(cat) || hasStanceSlot(cat);
const hasExilusSlot = (cat) => !['Companion', 'Companion Weapon'].includes(cat);
const arcaneCountFor = (cat) => {
  if (cat === 'Warframe') return 2;
  if (cat === 'Companion' || cat === 'Companion Weapon') return 0;
  return 1;
};

const cut = (s = 12) => ({
  clipPath: `polygon(${s}px 0, 100% 0, 100% calc(100% - ${s}px), calc(100% - ${s}px) 100%, 0 100%, 0 ${s}px)`,
});

const SEED_MODS = {
  Warframe: ['Vitality', 'Redirection', 'Steel Fiber', 'Intensify', 'Streamline', 'Continuity', 'Stretch', 'Flow', 'Fleeting Expertise', 'Blind Rage', 'Overextended', 'Narrow Minded', 'Transient Fortitude', 'Augur Reach', 'Augur Secrets', 'Augur Message', 'Adaptation', 'Rolling Guard', 'Primed Continuity', 'Primed Flow', 'Primed Sure Footed', 'Umbral Vitality', 'Umbral Intensify', 'Umbral Fiber', 'Archon Continuity', 'Archon Intensify', 'Archon Stretch', 'Archon Vitality', 'Equilibrium', 'Natural Talent', 'Constitution', 'Handspring', 'Preparation', 'Energy Conversion', 'Catalyzing Shields', 'Quick Thinking', 'Primed Redirection'],
  Aura: ['Corrosive Projection', 'Steel Charge', 'Growing Power', 'Power Donation', 'Energy Siphon', 'Rejuvenation', 'Physique', 'Brief Respite', 'Pistol Amp', 'Rifle Amp', 'Shotgun Amp', 'Swift Momentum'],
  Stance: ['Shattering Storm', 'Crushing Ruin', 'Tempo Royale', 'Cleaving Whirlwind', 'Blind Justice', 'Decisive Judgement', 'Vermilion Storm', 'Crimson Dervish', 'Bullet Dance', 'Reaping Spiral', 'Wise Razor', 'Sovereign Outcast'],
  Exilus: ['Dispatch Overdrive', 'Primed Fast Hands', 'Terminal Velocity', 'Heightened Reflexes', 'Marked Target', 'Power Drift', 'Cunning Drift', 'Coaction Drift', 'Endurance Drift', 'Speed Drift'],
  Melee: ['Primed Pressure Point', 'Pressure Point', 'Sacrificial Pressure', 'Sacrificial Steel', 'Blood Rush', 'Weeping Wounds', 'Organ Shatter', 'True Steel', 'Gladiator Might', 'Gladiator Rush', 'Berserker Fury', 'Condition Overload', 'Primed Fever Strike', 'Fever Strike', 'Molten Impact', 'North Wind', 'Shocking Touch', 'Voltaic Strike', 'Virulent Scourge', 'Volcanic Edge', 'Vicious Frost', 'Focus Energy', 'Primed Reach', 'Reach', 'Spoiled Strike', 'Corrupt Charge', 'Seismic Wave', 'Quickening', 'Drifting Contact', 'Body Count', 'Fury', 'Primed Fury', 'Galvanized Reflex', 'Killing Blow', 'Buzz Kill', 'Collision Force', 'Amalgam Organ Shatter'],
  Primary: ['Serration', 'Split Chamber', 'Heavy Caliber', 'Vital Sense', 'Point Strike', 'Vile Acceleration', 'Speed Trigger', 'Hellfire', 'Stormbringer', 'Cryo Rounds', 'Infected Clip', 'Malignant Force', 'High Voltage', 'Thermite Rounds', 'Rime Rounds', 'Hunter Munitions', 'Galvanized Chamber', 'Galvanized Aptitude', 'Galvanized Scope', 'Primed Cryo Rounds', 'Vigilante Armaments', 'Critical Delay', 'Argon Scope', 'Bladed Rounds'],
  Secondary: ['Hornet Strike', 'Barrel Diffusion', 'Lethal Torrent', 'Pistol Pestilence', 'Convulsion', 'Deep Freeze', 'Heated Charge', 'Pathogen Rounds', 'Jolt', 'Frostbite', 'Primed Heated Charge', 'Primed Pistol Gambit', 'Pistol Gambit', 'Target Cracker', 'Primed Target Cracker', 'Galvanized Shot', 'Galvanized Diffusion', 'Galvanized Crosshairs', 'Hollow Point', 'Augur Pact', 'Magnum Force'],
  Companion: ['Pack Leader', 'Maul', 'Bite', 'Pounce', 'Hunter Recovery', 'Hunter Command', 'Hunter Synergy', 'Animal Instinct', 'Sharpened Claws', 'Tek Enhance'],
};

const POLARITIES = {
  madurai:   { name: 'Madurai',   color: '#f87171' },
  vazarin:   { name: 'Vazarin',   color: '#4ade80' },
  naramon:   { name: 'Naramon',   color: '#60a5fa' },
  zenurik:   { name: 'Zenurik',   color: '#facc15' },
  umbra:     { name: 'Umbra',     color: '#fcd34d' },
  unairu:    { name: 'Unairu',    color: '#cbd5e1' },
  penjaga:   { name: 'Penjaga',   color: '#f472b6' },
  universal: { name: 'Universal', color: '#22d3ee' },
};
const POLARITY_KEYS = Object.keys(POLARITIES);
const POLARITY_PATHS = {
  madurai:   'M2 4 L8 13 L14 4 L11 4 L8 9 L5 4 Z',
  vazarin:   'M4 3 L4 13 L8 13 Q14 8 8 3 Z',
  naramon:   'M3 6 L13 6 L13 10 L3 10 Z',
  zenurik:   'M3 4 L13 4 L13 6 L3 6 Z M3 10 L13 10 L13 12 L3 12 Z',
  umbra:     'M3 13 L3 8 L8 3 L13 8 L13 13 Z',
  unairu:    'M3 3 L5 3 L5 11 L11 11 L11 3 L13 3 L13 13 L3 13 Z',
  penjaga:   'M3 13 L3 9 L5 11 L6 5 L8 9 L10 5 L11 11 L13 9 L13 13 Z',
  universal: 'M8 1 L10 6 L15 6 L11 9 L13 14 L8 11 L3 14 L5 9 L1 6 L6 6 Z',
};
const emptyPolarities = (slotCount = 8) => ({ aura: null, exilus: null, slots: Array(slotCount).fill(null) });

const SEED_ARCANES = {
  Warframe: ['Arcane Energize', 'Arcane Grace', 'Arcane Guardian', 'Arcane Aegis', 'Arcane Avenger', 'Arcane Fury', 'Arcane Strike', 'Arcane Precision', 'Arcane Velocity', 'Arcane Acceleration', 'Arcane Rage', 'Arcane Tanker', 'Arcane Nullifier', 'Arcane Healing', 'Arcane Resistance', 'Arcane Trickery', 'Arcane Momentum', 'Arcane Ultimatum', 'Arcane Blessing', 'Arcane Battery', 'Arcane Intention', 'Arcane Power Ramp', 'Arcane Reaper', 'Arcane Steadfast', 'Arcane Crepuscular'],
  Melee: ['Melee Exposure', 'Melee Influence', 'Melee Vortex', 'Melee Crescendo', 'Melee Animosity', 'Melee Fortification', 'Melee Retaliation', 'Melee Duplicate'],
  Primary: ['Primary Merciless', 'Primary Deadhead', 'Primary Frostbite', 'Cascadia Flare', 'Theorem Demulcent'],
  Secondary: ['Secondary Merciless', 'Secondary Deadhead', 'Secondary Encumber', 'Cascadia Empowered', 'Secondary Frostbite'],
};

const PRE_OWNED_RAW = {
  'Vitality': 10, 'Redirection': 10, 'Steel Fiber': 10, 'Streamline': 5, 'Intensify': 5,
  'Continuity': 5, 'Stretch': 5, 'Flow': 5, 'Serration': 10, 'Hornet Strike': 10,
  'Point Blank': 8, 'Pressure Point': 5, 'Split Chamber': 5, 'Primed Pressure Point': 10,
  'Blood Rush': 12, 'Organ Shatter': 5, 'Corrupt Charge': 10, 'Galvanized Reflex': 8,
};
const PRE_OWNED = Object.fromEntries(Object.entries(PRE_OWNED_RAW).map(([k, v]) => [norm(k), v]));

const MOD_CATEGORIES = ['Warframe', 'Aura', 'Stance', 'Exilus', 'Primary', 'Secondary', 'Shotgun', 'Melee', 'Companion', 'Companion Weapon', 'Exalted', 'Archgun', 'Archmelee', 'Other'];
const modCatForItem = (c) => (MOD_CATEGORIES.includes(c) ? c : 'Other');

// Curated starting roster — base frames. Recent additions are easy to add in-app.
const WARFRAMES = ['Ash', 'Atlas', 'Banshee', 'Baruuk', 'Caliban', 'Chroma', 'Citrine', 'Dagath', 'Dante', 'Ember', 'Equinox', 'Excalibur', 'Excalibur Umbra', 'Frost', 'Gara', 'Garuda', 'Gauss', 'Grendel', 'Gyre', 'Harrow', 'Hildryn', 'Hydroid', 'Inaros', 'Ivara', 'Jade', 'Khora', 'Kullervo', 'Lavos', 'Limbo', 'Loki', 'Mag', 'Mesa', 'Mirage', 'Nekros', 'Nezha', 'Nidus', 'Nova', 'Nyx', 'Oberon', 'Octavia', 'Protea', 'Qorvex', 'Revenant', 'Rhino', 'Saryn', 'Sevagoth', 'Styanax', 'Titania', 'Trinity', 'Valkyr', 'Vauban', 'Volt', 'Voruna', 'Wisp', 'Wukong', 'Xaku', 'Yareli', 'Zephyr'];

// Frames with exalted weapons (a weapon only that frame can use).
const EXALTED = {
  'Excalibur': ['Exalted Blade'],
  'Excalibur Umbra': ['Exalted Blade'],
  'Valkyr': ['Valkyr Talons'],
  'Mesa': ['Regulators'],
  'Ivara': ['Artemis Bow'],
  'Titania': ['Dex Pixia', 'Diwata'],
  'Wukong': ['Iron Staff'],
  'Baruuk': ['Desert Wind'],
  'Hildryn': ['Balefire'],
};

function seed() {
  return seedAll();
}

/* ----------------------------------------------------------------------- */
/* storage + migration                                                     */
/* ----------------------------------------------------------------------- */

function migrate(d) {
  if (!d || !d.builds) return null;
  let items = d.items;
  let builds = d.builds;
  if (!items) {
    items = [];
    const key = new Map();
    builds = d.builds.map((b) => {
      const cat = b.category || 'Other';
      const nm = b.item || 'Unknown Item';
      const k = norm(nm) + '|' + cat;
      let id = key.get(k);
      if (!id) { id = uid(); key.set(k, id); items.push({ id, name: nm, category: cat, relatedIds: [], guideLink: '', notes: '' }); }
      const { item, category, ...rest } = b;
      return { ...rest, itemId: id, guideLink: b.guideLink || '' };
    });
  }
  items = items.map((it) => {
    const cat = it.category || 'Other';
    const subtype = cat === 'Companion' ? (it.subtype || 'Mechanical') : (it.subtype || null);
    const slotCount = modSlotCountFor({ category: cat, subtype });
    return {
      relatedIds: [], guideLink: '', notes: '', owned: false, ...it,
      subtype,
      polarities: {
        aura: it.polarities?.aura ?? null,
        exilus: it.polarities?.exilus ?? null,
        slots: Array.from({ length: slotCount }, (_, i) => it.polarities?.slots?.[i] ?? null),
      },
    };
  });
  builds = builds.map((b) => ({
    guideLink: '', notes: '', formaApplied: 0, ...b,
    arcane2: b.arcane2 || '',
    slots: (b.slots || []).map((s, i) => ({ slot: s.slot || i + 1, mod: s.mod || '', rank: s.rank == null ? '' : s.rank })),
  }));
  const mods = (d.mods || []).map((m) => ({ ...m, ownedRank: m.ownedRank == null ? '' : m.ownedRank, source: m.source != null ? m.source : (m.notes || '') }));
  const arcanes = (d.arcanes || []).map((a) => ({ ...a, source: a.source != null ? a.source : (a.notes || '') }));
  return { items, builds, mods, arcanes };
}

// Combine incoming data into existing, additively. Existing items/builds/mods/arcanes are never overwritten.
// Match keys: items by category+name (case-insensitive), builds by id then name+itemId, mods/arcanes by name.
function mergeData(existing, incoming) {
  if (!incoming) return existing;
  const out = {
    items: [...existing.items],
    builds: [...existing.builds],
    mods: [...existing.mods],
    arcanes: [...existing.arcanes],
  };

  const itemKey = (i) => norm(i.name) + '|' + (i.category || '');
  const existingItemKeys = new Map(out.items.map((i) => [itemKey(i), i.id]));
  // id remap: incoming items that match an existing one keep the existing id so build links survive
  const idRemap = new Map();
  (incoming.items || []).forEach((inc) => {
    const k = itemKey(inc);
    const matchId = existingItemKeys.get(k);
    if (matchId) {
      idRemap.set(inc.id, matchId);
    } else {
      idRemap.set(inc.id, inc.id);
      out.items.push(inc);
      existingItemKeys.set(k, inc.id);
    }
  });
  // patch relatedIds in newly-added items through the id remap
  out.items.forEach((it) => {
    if (!it.relatedIds) return;
    it.relatedIds = it.relatedIds.map((rid) => idRemap.get(rid) || rid).filter((rid, idx, arr) => arr.indexOf(rid) === idx);
  });

  const buildKey = (b) => norm(b.name) + '|' + (b.itemId || '');
  const existingBuildIds = new Set(out.builds.map((b) => b.id));
  const existingBuildKeys = new Set(out.builds.map(buildKey));
  (incoming.builds || []).forEach((inc) => {
    const remapped = { ...inc, itemId: idRemap.get(inc.itemId) || inc.itemId };
    if (existingBuildIds.has(remapped.id)) return;
    if (existingBuildKeys.has(buildKey(remapped))) return;
    out.builds.push(remapped);
    existingBuildIds.add(remapped.id);
    existingBuildKeys.add(buildKey(remapped));
  });

  const modSet = new Set(out.mods.map((m) => norm(m.name)));
  (incoming.mods || []).forEach((m) => {
    if (modSet.has(norm(m.name))) return;
    out.mods.push(m);
    modSet.add(norm(m.name));
  });

  const arcSet = new Set(out.arcanes.map((a) => norm(a.name)));
  (incoming.arcanes || []).forEach((a) => {
    if (arcSet.has(norm(a.name))) return;
    out.arcanes.push(a);
    arcSet.add(norm(a.name));
  });

  return out;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* missing or unreadable */ }
  return null;
}
function persist(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage full / blocked */ }
}

/* ----------------------------------------------------------------------- */
/* analysis                                                                */
/* ----------------------------------------------------------------------- */

// Exalted weapons come with their parent warframe — owned status is derived, not stored.
function effectiveOwned(item, itemById) {
  if (!item) return false;
  if (item.category !== 'Exalted') return !!item.owned;
  return (item.relatedIds || []).some((rid) => {
    const r = itemById.get(rid);
    return r && r.category === 'Warframe' && r.owned;
  });
}

function ensureSlots(slots, count = 8) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const f = (slots || []).find((s) => s && s.slot === i + 1) || (slots || [])[i];
    out.push({ slot: i + 1, mod: (f && f.mod) || '', rank: f && f.rank != null ? f.rank : '' });
  }
  return out;
}

function normalizeImport(obj) {
  const raw = obj.slots || obj.mods || [];
  const slots = [];
  raw.forEach((s, i) => {
    if (typeof s === 'string') slots.push({ slot: i + 1, mod: s, rank: '' });
    else if (s && typeof s === 'object') slots.push({ slot: s.slot || i + 1, mod: s.mod || s.name || '', rank: s.rank != null ? s.rank : '' });
  });
  return {
    name: obj.name || obj.title || 'Imported Build',
    itemName: obj.item || obj.weapon || obj.warframe || '',
    category: ITEM_CATEGORIES.includes(obj.category) ? obj.category : 'Other',
    forma: Number(obj.forma) || 0,
    arcane: obj.arcane || (Array.isArray(obj.arcanes) ? obj.arcanes[0] : '') || '',
    arcane2: obj.arcane2 || (Array.isArray(obj.arcanes) ? obj.arcanes[1] : '') || '',
    stance: obj.stance || '',
    aura: obj.aura || '',
    exilus: obj.exilus || '',
    guideLink: obj.guideLink || obj.link || obj.url || '',
    slots,
    notes: obj.notes || '',
  };
}

// readiness for one build
function analyze(build, modByName, arcByName) {
  const refs = [];
  (build.slots || []).forEach((s) => { if (s.mod) refs.push({ name: s.mod, kind: 'Slot ' + s.slot, reqRank: s.rank }); });
  if (build.aura) refs.push({ name: build.aura, kind: 'Aura', reqRank: '' });
  if (build.stance) refs.push({ name: build.stance, kind: 'Stance', reqRank: '' });
  if (build.exilus) refs.push({ name: build.exilus, kind: 'Exilus', reqRank: '' });

  const refMods = refs.map((r) => {
    const m = modByName.get(norm(r.name));
    const owned = !!(m && m.owned);
    const ownedRank = m ? num(m.ownedRank) : null;
    const reqRank = num(r.reqRank);
    const deficit = owned && ownedRank != null && reqRank != null ? Math.max(0, reqRank - ownedRank) : 0;
    return { ...r, owned, ownedRank, reqRank, deficit, source: m ? m.source : '', category: m ? m.category : '?' };
  });
  const missing = refMods.filter((r) => !r.owned);
  const underRanked = refMods.filter((r) => r.owned && r.deficit > 0);

  const arcanes = [];
  [build.arcane, build.arcane2].forEach((nm) => {
    if (!nm) return;
    const a = arcByName.get(norm(nm));
    arcanes.push({ name: nm, owned: !!(a && a.owned), source: a ? a.source : '' });
  });
  const formaRemaining = Math.max(0, (Number(build.forma) || 0) - (Number(build.formaApplied) || 0));
  const ready = missing.length === 0 && underRanked.length === 0 && formaRemaining === 0 && arcanes.every((x) => x.owned);
  return { refMods, missing, underRanked, arcanes, formaRemaining, ready };
}

// map: mod norm-name -> { maxRank, refs:[{build,rank}] }
function buildModRequirements(builds) {
  const map = new Map();
  builds.forEach((b) => {
    const refs = [...(b.slots || [])];
    [b.aura, b.stance, b.exilus].forEach((m) => { if (m) refs.push({ mod: m, rank: '' }); });
    refs.forEach((s) => {
      if (!s.mod) return;
      const k = norm(s.mod);
      const e = map.get(k) || { maxRank: 0, refs: [] };
      const rk = num(s.rank) || 0;
      e.maxRank = Math.max(e.maxRank, rk);
      e.refs.push({ build: b.name, rank: s.rank });
      map.set(k, e);
    });
  });
  return map;
}

const IMPORT_PROMPT = `I'm attaching a Warframe build screenshot (overframe.gg or in-game Arsenal). Extract it into JSON matching EXACTLY this schema. Output ONLY the JSON — no commentary, no code fences:

{
  "name": "build title",
  "item": "weapon or warframe name",
  "category": "Warframe|Primary|Secondary|Melee|Companion|Exalted|Other",
  "forma": 0,
  "arcane": "arcane name or empty string",
  "aura": "aura mod name or empty string",
  "stance": "stance mod name or empty string",
  "exilus": "exilus mod name or empty string",
  "guideLink": "the overframe.gg URL if I gave you one, else empty string",
  "slots": [ {"slot": 1, "mod": "mod name", "rank": 0} ]
}

Rules: read the 8 mod slots in grid order (top-left to bottom-right). Put the aura/stance mod in "aura" or "stance" and the exilus mod in "exilus". Slot order must match the screenshot exactly. Use the visible rank pips for "rank". If a value is unknown use an empty string or 0.`;

/* ----------------------------------------------------------------------- */
/* shared UI                                                               */
/* ----------------------------------------------------------------------- */

const inputCls = 'w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm px-3 py-2 outline-none focus:border-cyan-400 placeholder-slate-600';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wider text-cyan-400/80 mb-1 uppercase">{label}</label>
      {children}
    </div>
  );
}

function Combobox({ value, onChange, options, placeholder }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase())).slice(0, 9);
  const isNew = q.trim() && !options.some((o) => norm(o) === norm(q));
  return (
    <div ref={ref} className="relative">
      <input
        value={open ? q : value}
        placeholder={placeholder}
        onFocus={() => { setQ(value || ''); setOpen(true); }}
        onChange={(e) => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        className={inputCls}
      />
      {open && (filtered.length > 0 || isNew) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 max-h-56 overflow-y-auto shadow-xl">
          {filtered.map((o) => (
            <button key={o} onMouseDown={(e) => { e.preventDefault(); onChange(o); setQ(o); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300">
              {o}
            </button>
          ))}
          {isNew && <div className="px-3 py-2 text-xs text-amber-400 border-t border-slate-800">Will add &ldquo;{q.trim()}&rdquo; as new</div>}
        </div>
      )}
    </div>
  );
}

function StatusPill({ a, small }) {
  const cls = small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  if (a.ready) {
    return <span className={`inline-flex items-center gap-1 font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 ${cls}`}><Check size={12} /> READY</span>;
  }
  const bits = [];
  if (a.missing.length) bits.push(`${a.missing.length} missing`);
  if (a.underRanked.length) bits.push(`${a.underRanked.length} low rank`);
  if (a.formaRemaining) bits.push(`${a.formaRemaining} forma`);
  return <span className={`inline-flex items-center gap-1 font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/40 ${cls}`}><AlertTriangle size={12} /> {bits.join(' · ') || 'incomplete'}</span>;
}

function PolarityIcon({ polarity, size = 14, className = '' }) {
  if (!polarity) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" className={`text-slate-700 ${className}`}>
        <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" />
      </svg>
    );
  }
  const p = POLARITIES[polarity];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className} style={{ color: p.color }}>
      <path d={POLARITY_PATHS[polarity]} fill="currentColor" />
    </svg>
  );
}

function PolarityPicker({ value, onChange, category, subtype }) {
  const [editing, setEditing] = useState(null);
  const showTop = hasTopSlot(category);
  const topLabel = hasAuraSlot(category) ? 'Aura' : 'Stance';
  const showExilus = hasExilusSlot(category);
  const slotCount = modSlotCountFor({ category, subtype });
  const slots = [
    ...(showTop ? [{ key: 'aura', label: topLabel }] : []),
    ...(showExilus ? [{ key: 'exilus', label: 'Exilus' }] : []),
    ...Array.from({ length: slotCount }, (_, i) => ({ key: 'slot' + (i + 1), label: String(i + 1) })),
  ];
  const getPol = (k) => {
    if (k === 'aura') return value.aura;
    if (k === 'exilus') return value.exilus;
    return value.slots[parseInt(k.slice(4), 10) - 1];
  };
  const setPol = (k, p) => {
    if (k === 'aura') onChange({ ...value, aura: p });
    else if (k === 'exilus') onChange({ ...value, exilus: p });
    else {
      const idx = parseInt(k.slice(4), 10) - 1;
      const slotsArr = [...value.slots];
      while (slotsArr.length <= idx) slotsArr.push(null);
      slotsArr[idx] = p;
      onChange({ ...value, slots: slotsArr });
    }
  };
  const editingLabel = slots.find((x) => x.key === editing)?.label;
  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>

        {slots.map((s) => {
          const pol = getPol(s.key);
          const active = editing === s.key;
          return (
            <button key={s.key} type="button" onClick={() => setEditing(active ? null : s.key)}
              className={`flex flex-col items-center justify-center gap-1 py-2 bg-slate-950 border ${active ? 'border-cyan-400' : pol ? 'border-slate-700' : 'border-dashed border-slate-800'} hover:border-cyan-500/60`}>
              <PolarityIcon polarity={pol} size={18} />
              <span className="text-[9px] text-slate-500 leading-none truncate max-w-full">{s.label}</span>
            </button>
          );
        })}
      </div>
      {editing && (
        <div className="mt-2 p-2 bg-slate-950 border border-slate-700 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Set polarity for {editingLabel}</div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => { setPol(editing, null); setEditing(null); }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-slate-700 text-slate-400 hover:border-slate-500">
              <X size={12} /> None
            </button>
            {POLARITY_KEYS.map((p) => (
              <button key={p} type="button" onClick={() => { setPol(editing, p); setEditing(null); }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-slate-700 hover:border-cyan-500/60 text-slate-200">
                <PolarityIcon polarity={p} size={14} /> {POLARITIES[p].name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GuideLink({ url }) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 hover:border-cyan-500 px-2.5 py-1">
      <Link2 size={12} /> Build guide <ExternalLink size={11} />
    </a>
  );
}

/* ----------------------------------------------------------------------- */
/* item form                                                               */
/* ----------------------------------------------------------------------- */

function ItemForm({ initial, allItems, onSave, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [category, setCategory] = useState(initial.category || 'Warframe');
  const [guideLink, setGuideLink] = useState(initial.guideLink || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [related, setRelated] = useState(initial.relatedIds || []);
  const [owned, setOwned] = useState(!!initial.owned);
  const [subtype, setSubtype] = useState(initial.subtype || (initial.category === 'Companion' ? 'Mechanical' : null));
  const [polarities, setPolarities] = useState(initial.polarities || emptyPolarities(modSlotCountFor({ category: initial.category, subtype: initial.subtype })));

  const isCompanion = category === 'Companion';
  useEffect(() => {
    if (isCompanion && !subtype) setSubtype('Mechanical');
    if (!isCompanion && subtype) setSubtype(null);
  }, [isCompanion, subtype]);
  useEffect(() => {
    const count = modSlotCountFor({ category, subtype });
    if (polarities.slots.length !== count) {
      setPolarities((prev) => ({
        ...prev,
        slots: Array.from({ length: count }, (_, i) => prev.slots[i] ?? null),
      }));
    }
  }, [category, subtype, polarities.slots.length]);

  const others = allItems.filter((i) => i.id !== initial.id);
  const toggle = (id) => setRelated((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const save = () => onSave({
    id: initial.id || uid(),
    name: name.trim() || 'Untitled Item',
    category, guideLink: guideLink.trim(), notes: notes.trim(),
    relatedIds: related,
    owned,
    subtype: isCompanion ? (subtype || 'Mechanical') : null,
    polarities,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onCancel} className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 text-sm mb-4"><ChevronLeft size={16} /> Cancel</button>
      <h2 className="wf-display text-xl text-slate-100 mb-4">{initial.id ? 'Edit Item' : 'New Item'}</h2>
      <div className="bg-slate-900/70 border border-slate-800 p-5 space-y-4" style={cut(14)}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Item Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Magistar" /></Field>
          <Field label="Category">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {ITEM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {isCompanion && (
            <Field label="Companion Type">
              <select className={inputCls} value={subtype || 'Mechanical'} onChange={(e) => setSubtype(e.target.value)}>
                {COMPANION_SUBTYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )}
        </div>
        {category === 'Exalted' ? (() => {
          const parentFrames = related.map((rid) => allItems.find((i) => i.id === rid)).filter((r) => r && r.category === 'Warframe');
          const derivedOwned = parentFrames.some((p) => p.owned);
          return (
            <div className={`flex items-center gap-2.5 text-sm px-3 py-2 border ${derivedOwned ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200/90' : 'border-slate-800 text-slate-400'}`}>
              <Hexagon size={18} className={derivedOwned ? 'text-emerald-400/70 fill-emerald-500/20' : 'text-slate-700'} />
              <span className="font-semibold">{derivedOwned ? 'Owned' : 'Not owned'}</span>
              <span className="text-[11px] text-slate-500 ml-auto">{parentFrames.length > 0 ? `via ${parentFrames.map((p) => p.name).join(' / ')}` : 'link a parent warframe below'}</span>
            </div>
          );
        })() : (
          <button type="button" onClick={() => setOwned((v) => !v)}
            className={`flex items-center gap-2.5 text-sm px-3 py-2 border w-full text-left ${owned ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-200' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
            <Hexagon size={18} className={owned ? 'text-emerald-400 fill-emerald-500/30' : 'text-slate-700'} />
            <span className="font-semibold">{owned ? 'You own this' : 'Not in your collection'}</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-auto">click to toggle</span>
          </button>
        )}
        <Field label="Build Guide Link"><input className={inputCls} value={guideLink} onChange={(e) => setGuideLink(e.target.value)} placeholder="https://overframe.gg/..." /></Field>
        <Field label="Notes"><textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div>
          <label className="block text-xs font-semibold tracking-wider text-cyan-400/80 mb-2 uppercase">Polarities</label>
          <p className="text-[11px] text-slate-500 mb-2">Click a slot to set its polarity. Dashed slots are unpolarized — those need forma.</p>
          <PolarityPicker value={polarities} onChange={setPolarities} category={category} subtype={subtype} />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wider text-cyan-400/80 mb-2 uppercase">Related Loadout</label>
          {others.length === 0 && <p className="text-slate-600 text-xs">Create more items first to link them here.</p>}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {RELATION_GROUPS.map(([cat, label]) => {
              const group = others.filter((i) => i.category === cat);
              if (group.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((i) => (
                      <button key={i.id} onClick={() => toggle(i.id)}
                        className={`text-xs px-2.5 py-1 border ${related.includes(i.id) ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                        {related.includes(i.id) && <Check size={11} className="inline mr-1" />}{i.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={save} className="flex items-center gap-2 bg-cyan-500 text-slate-950 font-bold text-sm px-5 py-2.5 hover:bg-cyan-400" style={cut(10)}><Save size={16} /> Save Item</button>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm px-4">Cancel</button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* build form                                                              */
/* ----------------------------------------------------------------------- */

function BuildForm({ initial, items, modNames, arcaneNames, onSave, onCancel }) {
  const lockItem = !!initial.lockItem;
  const [name, setName] = useState(initial.name || '');
  const [itemName, setItemName] = useState(initial.itemName || '');
  const [category, setCategory] = useState(initial.category || 'Melee');
  const [subtype, setSubtype] = useState(initial.subtype || (initial.category === 'Companion' ? 'Mechanical' : null));
  const [forma, setForma] = useState(String(initial.forma ?? 0));
  const [formaApplied, setFormaApplied] = useState(String(initial.formaApplied ?? 0));
  const [arcane, setArcane] = useState(initial.arcane || '');
  const [arcane2, setArcane2] = useState(initial.arcane2 || '');
  const [exilus, setExilus] = useState(initial.exilus || '');
  const [auraStance, setAuraStance] = useState(initial.aura || initial.stance || '');
  const [guideLink, setGuideLink] = useState(initial.guideLink || '');
  const [slots, setSlots] = useState(ensureSlots(initial.slots, modSlotCountFor({ category: initial.category, subtype: initial.subtype })));
  const [notes, setNotes] = useState(initial.notes || '');

  const isCompanion = category === 'Companion';
  const arcaneCount = arcaneCountFor(category);
  const showAura = hasAuraSlot(category);
  const showStance = hasStanceSlot(category);
  const showTop = showAura || showStance;
  const showExilus = hasExilusSlot(category);
  const slotCount = modSlotCountFor({ category, subtype });

  useEffect(() => {
    if (isCompanion && !subtype) setSubtype('Mechanical');
    if (!isCompanion && subtype) setSubtype(null);
  }, [isCompanion, subtype]);
  useEffect(() => {
    setSlots((prev) => (prev.length === slotCount ? prev : ensureSlots(prev, slotCount)));
  }, [slotCount]);
  useEffect(() => {
    if (!isCompanion) return;
    const matched = items.find((i) => norm(i.name) === norm(itemName) && i.category === 'Companion');
    if (matched && matched.subtype) setSubtype(matched.subtype);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, isCompanion, items]);

  const setSlot = (i, patch) => setSlots((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const itemOptions = items.filter((i) => i.category === category).map((i) => i.name);

  const save = () => onSave({
    id: initial.id || uid(),
    itemId: initial.itemId || null,
    name: name.trim() || 'Untitled Build',
    itemName: itemName.trim() || 'Unknown Item',
    category,
    subtype: isCompanion ? (subtype || 'Mechanical') : null,
    forma: Number(forma) || 0,
    formaApplied: Math.min(Number(formaApplied) || 0, Number(forma) || 0),
    arcane: arcaneCount >= 1 ? arcane.trim() : '',
    arcane2: arcaneCount >= 2 ? arcane2.trim() : '',
    aura: showAura ? auraStance.trim() : '',
    stance: showStance ? auraStance.trim() : '',
    exilus: showExilus ? exilus.trim() : '',
    guideLink: guideLink.trim(),
    slots: slots.map((s) => ({ slot: s.slot, mod: s.mod.trim(), rank: s.rank === '' ? '' : Number(s.rank) })),
    notes: notes.trim(),
    createdAt: initial.createdAt || Date.now(),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onCancel} className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 text-sm mb-4"><ChevronLeft size={16} /> Cancel</button>
      <h2 className="wf-display text-xl text-slate-100 mb-1">{initial.id ? 'Edit Build' : 'Review & Save Build'}</h2>
      <p className="text-slate-500 text-sm mb-5">Mods and arcanes named here that aren&rsquo;t in your inventory get added automatically as not-owned.</p>

      <div className="bg-slate-900/70 border border-slate-800 p-5 space-y-4" style={cut(14)}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Build Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slam Spam" /></Field>
          <Field label="Category">
            {lockItem
              ? <input className={inputCls + ' opacity-60'} value={category} readOnly />
              : <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>{ITEM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}
          </Field>
          <Field label="Item">
            {lockItem
              ? <input className={inputCls + ' opacity-60'} value={itemName} readOnly />
              : <Combobox value={itemName} onChange={setItemName} options={itemOptions} placeholder="e.g. Magistar" />}
          </Field>
          {isCompanion && (
            <Field label="Companion Type">
              {lockItem
                ? <input className={inputCls + ' opacity-60'} value={subtype || 'Mechanical'} readOnly />
                : <select className={inputCls} value={subtype || 'Mechanical'} onChange={(e) => setSubtype(e.target.value)}>{COMPANION_SUBTYPES.map((s) => <option key={s}>{s}</option>)}</select>}
            </Field>
          )}
          {arcaneCount >= 1 && (
            <Field label={arcaneCount === 2 ? 'Arcane 1' : 'Arcane'}><Combobox value={arcane} onChange={setArcane} options={arcaneNames} placeholder="Arcane (optional)" /></Field>
          )}
          {arcaneCount >= 2 && (
            <Field label="Arcane 2"><Combobox value={arcane2} onChange={setArcane2} options={arcaneNames} placeholder="Second arcane (optional)" /></Field>
          )}
          <Field label="Forma Required"><input type="number" min="0" className={inputCls} value={forma} onChange={(e) => setForma(e.target.value)} /></Field>
          <Field label="Forma Applied"><input type="number" min="0" className={inputCls} value={formaApplied} onChange={(e) => setFormaApplied(e.target.value)} /></Field>
        </div>
        <Field label="Build Guide Link"><input className={inputCls} value={guideLink} onChange={(e) => setGuideLink(e.target.value)} placeholder="https://overframe.gg/..." /></Field>
        {(showTop || showExilus) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {showTop && (
              <Field label={showAura ? 'Aura' : 'Stance'}><Combobox value={auraStance} onChange={setAuraStance} options={modNames} placeholder={showAura ? 'Aura mod' : 'Stance mod'} /></Field>
            )}
            {showExilus && (
              <Field label="Exilus"><Combobox value={exilus} onChange={setExilus} options={modNames} placeholder="Exilus mod" /></Field>
            )}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold tracking-wider text-cyan-400/80 mb-2 uppercase">Mod Slots — order matters for elementals</label>
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="w-6 text-center text-xs font-bold text-slate-500">{s.slot}</span>
                <div className="flex-1"><Combobox value={s.mod} onChange={(v) => setSlot(i, { mod: v })} options={modNames} placeholder={`Slot ${s.slot} mod`} /></div>
                <input type="number" min="0" max="13" value={s.rank} onChange={(e) => setSlot(i, { rank: e.target.value })} placeholder="Req R"
                  className="w-16 bg-slate-950 border border-slate-700 text-slate-100 text-sm px-2 py-2 outline-none focus:border-cyan-400 placeholder-slate-600 text-center" />
              </div>
            ))}
          </div>
        </div>
        <Field label="Notes"><textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={save} className="flex items-center gap-2 bg-cyan-500 text-slate-950 font-bold text-sm px-5 py-2.5 hover:bg-cyan-400" style={cut(10)}><Save size={16} /> Save Build</button>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm px-4">Cancel</button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* import modal                                                            */
/* ----------------------------------------------------------------------- */

function ImportModal({ onParse, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const parse = () => {
    setError('');
    const cleaned = text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    if (!cleaned) { setError('Paste the JSON first.'); return; }
    let obj;
    try { obj = JSON.parse(cleaned); } catch (e) { setError('That isn\u2019t valid JSON — check for stray text or missing commas.'); return; }
    onParse(normalizeImport(obj));
  };
  const copyPrompt = () => {
    try { navigator.clipboard.writeText(IMPORT_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl my-6" style={cut(16)}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <h3 className="wf-display text-cyan-300 text-base flex items-center gap-2"><Upload size={16} /> Import Build from JSON</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 p-3">
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              <span className="text-cyan-300 font-semibold">Step 1.</span> In a normal Claude chat, attach your screenshot and paste this prompt — Claude returns a JSON block.
            </p>
            <button onClick={copyPrompt} className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy extraction prompt'}
            </button>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2"><span className="text-cyan-300 font-semibold">Step 2.</span> Paste the JSON here:</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9}
              placeholder='{ "name": "...", "item": "...", "forma": 7, "slots": [ ... ] }'
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono px-3 py-2 outline-none focus:border-cyan-400 placeholder-slate-600" />
          </div>
          {error && <p className="text-rose-400 text-sm flex items-center gap-1.5"><AlertTriangle size={14} /> {error}</p>}
          <div className="flex gap-3">
            <button onClick={parse} className="bg-cyan-500 text-slate-950 font-bold text-sm px-5 py-2.5 hover:bg-cyan-400" style={cut(10)}>Parse &amp; Review</button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm px-3">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* build detail                                                            */
/* ----------------------------------------------------------------------- */

function SlotCard({ label, name, state, reqRank, ownedRank, polarity }) {
  const empty = !name;
  const palette = empty ? 'border-slate-800 bg-slate-900/40'
    : state === 'missing' ? 'border-rose-600/40 bg-rose-500/5'
    : state === 'low' ? 'border-amber-600/40 bg-amber-500/5'
    : 'border-emerald-600/40 bg-emerald-500/5';
  return (
    <div className={`relative p-2.5 border ${palette}`} style={cut(8)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <PolarityIcon polarity={polarity} size={12} />
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase truncate">{label}</span>
        </div>
        {!empty && (state === 'missing' ? <X size={12} className="text-rose-400" />
          : state === 'low' ? <ArrowUpCircle size={12} className="text-amber-400" />
          : <Check size={12} className="text-emerald-400" />)}
      </div>
      <div className={`text-sm font-semibold leading-tight ${empty ? 'text-slate-600 italic' : 'text-slate-100'}`}>{name || 'empty'}</div>
      {!empty && (
        <div className="text-[10px] mt-0.5 flex gap-2">
          {reqRank != null && <span className="text-cyan-400/70">needs R{reqRank}</span>}
          {state === 'low' && <span className="text-amber-400">have R{ownedRank}</span>}
        </div>
      )}
    </div>
  );
}

function BuildDetail({ build, item, modByName, arcByName, onBack, onEdit, onDelete, onToggleMod, onToggleArcane, onForma }) {
  const a = useMemo(() => analyze(build, modByName, arcByName), [build, modByName, arcByName]);
  const cat = item?.category;
  const subtype = item?.subtype;
  const showAura = hasAuraSlot(cat);
  const showStance = hasStanceSlot(cat);
  const showTop = showAura || showStance;
  const showExilus = hasExilusSlot(cat);
  const arcaneCount = arcaneCountFor(cat);
  const pols = item?.polarities || emptyPolarities(modSlotCountFor({ category: cat, subtype }));
  const unpolarized =
    (showTop && !pols.aura ? 1 : 0) +
    (showExilus && !pols.exilus ? 1 : 0) +
    pols.slots.filter((p) => !p).length;
  const ownedOk = a.refMods.length - a.missing.length - a.underRanked.length;
  const slotState = (mod) => {
    if (!mod) return 'empty';
    const rm = a.refMods.find((r) => norm(r.name) === norm(mod));
    if (!rm) return 'empty';
    if (!rm.owned) return 'missing';
    if (rm.deficit > 0) return 'low';
    return 'ok';
  };
  const reqOf = (mod) => { const r = a.refMods.find((x) => norm(x.name) === norm(mod)); return r ? r.reqRank : null; };
  const ownOf = (mod) => { const r = a.refMods.find((x) => norm(x.name) === norm(mod)); return r ? r.ownedRank : null; };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 text-sm mb-4"><ChevronLeft size={16} /> {item ? item.name : 'Back'}</button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <h2 className="wf-display text-2xl text-slate-50 leading-tight">{build.name}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{item ? item.name : 'Unknown'} · <span className="text-cyan-400">{item ? item.category : ''}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(build)} className="flex items-center gap-1.5 text-sm text-slate-300 border border-slate-700 hover:border-cyan-400 hover:text-cyan-300 px-3 py-1.5"><Pencil size={14} /> Edit</button>
          <button onClick={() => onDelete(build.id)} className="flex items-center gap-1.5 text-sm text-rose-400 border border-rose-900/60 hover:border-rose-500 px-3 py-1.5"><Trash2 size={14} /> Delete</button>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-5"><StatusPill a={a} /><GuideLink url={build.guideLink} /></div>

      <div className={`grid ${arcaneCount > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-5`}>
        <div className="bg-slate-900/70 border border-slate-800 p-3" style={cut(10)}>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1"><Flame size={13} /> Forma</div>
          <div className="text-slate-100 text-lg font-bold">{build.formaApplied || 0}<span className="text-slate-500 text-sm"> / {build.forma || 0}</span></div>
          <div className="flex gap-1 mt-1.5">
            <button onClick={() => onForma(build.id, -1)} className="w-6 h-6 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300">-</button>
            <button onClick={() => onForma(build.id, 1)} className="w-6 h-6 text-xs bg-amber-500/80 hover:bg-amber-400 text-slate-950 font-bold">+</button>
          </div>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-3" style={cut(10)}>
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1"><Package size={13} /> Mods</div>
          <div className="text-slate-100 text-lg font-bold">{ownedOk}<span className="text-slate-500 text-sm"> / {a.refMods.length}</span></div>
          <div className="text-xs text-slate-500 mt-1">{a.missing.length} missing · {a.underRanked.length} low</div>
        </div>
        {arcaneCount > 0 && (
          <div className="bg-slate-900/70 border border-slate-800 p-3" style={cut(10)}>
            <div className="flex items-center gap-1.5 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider mb-1"><Sparkles size={13} /> Arcane{arcaneCount > 1 ? 's' : ''}</div>
            {a.arcanes.length > 0 ? (
              <div className="space-y-1.5">
                {a.arcanes.map((arc, i) => (
                  <div key={i}>
                    <div className="text-slate-100 text-sm font-bold leading-tight">{arc.name}</div>
                    <div className={`text-xs ${arc.owned ? 'text-emerald-400' : 'text-rose-400'}`}>{arc.owned ? 'Owned' : 'Missing'}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-slate-600 text-sm italic">none</div>}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <h3 className="wf-display text-sm text-cyan-300 tracking-wider">CONFIGURATION</h3>
        {unpolarized > 0 && <span className="text-[10px] text-amber-400/80 uppercase tracking-widest">{unpolarized} slot{unpolarized === 1 ? '' : 's'} unpolarized</span>}
      </div>
      {(showTop || showExilus) && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {showTop && (
            <SlotCard label={showAura ? 'Aura' : 'Stance'} name={build.aura || build.stance} state={slotState(build.aura || build.stance)} reqRank={reqOf(build.aura || build.stance)} ownedRank={ownOf(build.aura || build.stance)} polarity={pols.aura} />
          )}
          {showExilus && (
            <SlotCard label="Exilus" name={build.exilus} state={slotState(build.exilus)} reqRank={reqOf(build.exilus)} ownedRank={ownOf(build.exilus)} polarity={pols.exilus} />
          )}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {build.slots.map((s) => (
          <SlotCard key={s.slot} label={`Slot ${s.slot}`} name={s.mod} state={slotState(s.mod)} reqRank={reqOf(s.mod)} ownedRank={ownOf(s.mod)} polarity={pols.slots[s.slot - 1]} />
        ))}
      </div>

      {(a.missing.length > 0 || a.underRanked.length > 0 || a.arcanes.some((arc) => !arc.owned)) && (
        <div className="bg-slate-900/70 border border-amber-900/40 p-4 mb-6" style={cut(12)}>
          <h3 className="wf-display text-sm text-amber-300 mb-3 tracking-wider flex items-center gap-2"><ListChecks size={15} /> STILL NEEDED</h3>
          <div className="space-y-2">
            {a.missing.map((m) => (
              <div key={m.kind} className="flex items-start justify-between gap-3 bg-slate-950/60 border border-slate-800 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-slate-100 text-sm font-semibold">{m.name} <span className="text-rose-400 text-xs">· not owned</span></div>
                  <div className="text-[11px] text-slate-500">{m.kind}{m.reqRank != null ? ` · needs R${m.reqRank}` : ''}{m.source ? <span className="text-cyan-400/80"> · {m.source.split('\n')[0]}</span> : ''}</div>
                </div>
                <button onClick={() => onToggleMod(m.name)} className="shrink-0 text-xs font-semibold text-emerald-300 border border-emerald-700/60 hover:bg-emerald-500/10 px-2.5 py-1">Mark owned</button>
              </div>
            ))}
            {a.underRanked.map((m) => (
              <div key={'lr' + m.kind} className="flex items-start justify-between gap-3 bg-slate-950/60 border border-slate-800 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-slate-100 text-sm font-semibold">{m.name} <span className="text-amber-400 text-xs">· under-ranked</span></div>
                  <div className="text-[11px] text-slate-500">{m.kind} · own R{m.ownedRank}, build needs R{m.reqRank} (upgrade {m.deficit})</div>
                </div>
              </div>
            ))}
            {a.arcanes.filter((arc) => !arc.owned).map((arc) => (
              <div key={'arc-' + arc.name} className="flex items-start justify-between gap-3 bg-slate-950/60 border border-slate-800 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-slate-100 text-sm font-semibold">{arc.name} <span className="text-rose-400 text-xs">· arcane</span></div>
                  {arc.source && <div className="text-[11px] text-cyan-400/80">{arc.source.split('\n')[0]}</div>}
                </div>
                <button onClick={() => onToggleArcane(arc.name)} className="shrink-0 text-xs font-semibold text-emerald-300 border border-emerald-700/60 hover:bg-emerald-500/10 px-2.5 py-1">Mark owned</button>
              </div>
            ))}
            {a.formaRemaining > 0 && <div className="text-xs text-amber-400 pt-1 flex items-center gap-1.5"><Flame size={12} /> {a.formaRemaining} forma still to apply</div>}
          </div>
        </div>
      )}

      {build.notes && <div className="bg-slate-900/50 border border-slate-800 p-4 text-sm text-slate-400 leading-relaxed" style={cut(10)}>{build.notes}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* item detail                                                             */
/* ----------------------------------------------------------------------- */

const REL_ICON = { Warframe: Users, Companion: Users, Primary: Swords, Secondary: Swords, Melee: Hammer, Exalted: Sparkles, Other: Layers };

function ItemDetail({ item, builds, allItems, modByName, arcByName, onBack, onEditItem, onDeleteItem, onOpenBuild, onNewBuild, onOpenItem }) {
  const itemBuilds = builds.filter((b) => b.itemId === item.id);
  const related = (item.relatedIds || []).map((id) => allItems.find((i) => i.id === id)).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 text-sm mb-4"><ChevronLeft size={16} /> {item.category}s</button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <h2 className="wf-display text-2xl text-slate-50 leading-tight">{item.name}</h2>
          <p className="text-slate-400 text-sm mt-0.5"><span className="text-cyan-400">{item.category}</span>{item.subtype ? <span className="text-slate-500"> · {item.subtype}</span> : null} · {itemBuilds.length} build{itemBuilds.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEditItem(item)} className="flex items-center gap-1.5 text-sm text-slate-300 border border-slate-700 hover:border-cyan-400 hover:text-cyan-300 px-3 py-1.5"><Pencil size={14} /> Edit</button>
          <button onClick={() => onDeleteItem(item.id)} className="flex items-center gap-1.5 text-sm text-rose-400 border border-rose-900/60 hover:border-rose-500 px-3 py-1.5"><Trash2 size={14} /> Delete</button>
        </div>
      </div>
      {item.guideLink && <div className="mb-4"><GuideLink url={item.guideLink} /></div>}
      {item.notes && <div className="bg-slate-900/50 border border-slate-800 p-3 text-sm text-slate-400 mb-5" style={cut(8)}>{item.notes}</div>}

      <div className="flex items-center justify-between mb-2">
        <h3 className="wf-display text-sm text-cyan-300 tracking-wider">BUILDS</h3>
        <button onClick={() => onNewBuild(item)} className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 px-2.5 py-1" style={cut(6)}><Plus size={13} /> New Build</button>
      </div>
      {itemBuilds.length === 0 && <p className="text-slate-600 text-sm border border-dashed border-slate-800 p-6 text-center mb-6">No builds yet for {item.name}.</p>}
      <div className="grid sm:grid-cols-2 gap-3 mb-7">
        {itemBuilds.map((b) => {
          const a = analyze(b, modByName, arcByName);
          return (
            <button key={b.id} onClick={() => onOpenBuild(b.id)} className="text-left bg-slate-900/70 border border-slate-800 hover:border-cyan-500/60 p-4 group" style={cut(12)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-slate-50 font-bold text-sm leading-tight group-hover:text-cyan-300">{b.name}</h4>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 shrink-0" />
              </div>
              <div className="mb-2"><StatusPill a={a} small /></div>
              <div className="flex gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Flame size={11} className="text-amber-500" /> {a.formaRemaining}</span>
                <span className="flex items-center gap-1"><Package size={11} className="text-cyan-500" /> {a.refMods.length - a.missing.length - a.underRanked.length}/{a.refMods.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      <h3 className="wf-display text-sm text-cyan-300 tracking-wider mb-2">RELATED LOADOUT</h3>
      {related.length === 0 && <p className="text-slate-600 text-sm">No linked items. Use Edit to relate weapons, companions or frames.</p>}
      <div className="space-y-3">
        {RELATION_GROUPS.map(([cat, label]) => {
          const group = related.filter((r) => r.category === cat);
          if (group.length === 0) return null;
          const Icon = REL_ICON[cat] || Layers;
          return (
            <div key={cat}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Icon size={11} /> {label}</div>
              <div className="flex flex-wrap gap-2">
                {group.map((r) => (
                  <button key={r.id} onClick={() => onOpenItem(r.id)}
                    className="flex items-center gap-1.5 text-sm text-slate-200 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/60 hover:text-cyan-300 px-3 py-1.5" style={cut(7)}>
                    {r.name} <ChevronRight size={13} className="text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* items list (per category tab)                                           */
/* ----------------------------------------------------------------------- */

function ItemsList({ buildCat, items, builds, modByName, arcByName, onSetCat, onOpenItem, onNewItem, onImport, onToggleOwned }) {
  const [search, setSearch] = useState('');
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const isOwned = (it) => effectiveOwned(it, itemById);
  const catItems = items
    .filter((i) => buildTabFor(i.category) === buildCat)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => {
      const ao = isOwned(a), bo = isOwned(b);
      if (ao !== bo) return ao ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  const ownedCount = catItems.filter(isOwned).length;
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="wf-display text-xl text-slate-100 flex items-center gap-2"><ClipboardList size={18} className="text-cyan-400" /> Your Loadouts</h2>
        <div className="flex gap-2">
          <button onClick={onImport} className="flex items-center gap-1.5 text-sm font-semibold text-cyan-300 border border-cyan-700/60 hover:bg-cyan-500/10 px-3 py-1.5"><Upload size={14} /> Import JSON</button>
          <button onClick={onNewItem} className="flex items-center gap-1.5 text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5" style={cut(8)}><Plus size={14} /> New Item</button>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 -mt-2 mb-4">Tap the hex on a card to mark it as owned. Owned items are sorted to the top.</p>

      <div className="flex gap-1 mb-5 border-b border-slate-800 overflow-x-auto">
        {CATEGORY_TABS.map((c) => (
          <button key={c} onClick={() => onSetCat(c)}
            className={`text-sm font-semibold px-3 py-2 border-b-2 -mb-px whitespace-nowrap ${buildCat === c ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {c === 'Warframe' ? 'Warframes' : c === 'Companion' ? 'Companions' : c === 'Companion Weapon' ? 'Companion Weapons' : c}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className={inputCls + ' pl-9'} />
      </div>

      {catItems.length === 0 && (
        <div className="border border-dashed border-slate-800 p-10 text-center">
          <ShieldQuestion size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No {buildCat === 'Warframe' ? 'warframes' : buildCat.toLowerCase() + ' items'} yet. Create one or import a build.</p>
        </div>
      )}

      {catItems.length > 0 && (
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{ownedCount} owned · {catItems.length - ownedCount} not owned</p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {catItems.map((it) => {
          const bs = builds.filter((b) => b.itemId === it.id);
          const ready = bs.filter((b) => analyze(b, modByName, arcByName).ready).length;
          const owned = isOwned(it);
          const dim = !owned;
          const isExalted = it.category === 'Exalted';
          const parentFrames = isExalted ? (it.relatedIds || []).map((rid) => itemById.get(rid)).filter((r) => r && r.category === 'Warframe') : [];
          const ownedParent = parentFrames.find((p) => p.owned);
          const hexTitle = isExalted
            ? (owned ? `Owned via ${ownedParent ? ownedParent.name : 'parent frame'}` : `Comes with ${parentFrames.map((p) => p.name).join(' or ') || 'parent frame'}`)
            : (owned ? 'Owned — click to unmark' : 'Not owned — click to mark owned');
          return (
            <div key={it.id} onClick={() => onOpenItem(it.id)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenItem(it.id); } }}
              className={`relative cursor-pointer text-left border p-4 group ${dim ? 'bg-slate-900/30 border-slate-800/60 hover:border-slate-600 opacity-60 hover:opacity-100' : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/60'}`}
              style={cut(12)}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {isExalted ? (
                    <span title={hexTitle} className="shrink-0 cursor-help">
                      <Hexagon size={18} className={owned ? 'text-emerald-400/70 fill-emerald-500/20' : 'text-slate-700'} />
                    </span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); onToggleOwned(it.id); }}
                      title={hexTitle}
                      className="shrink-0">
                      <Hexagon size={18} className={owned ? 'text-emerald-400 fill-emerald-500/30' : 'text-slate-700 hover:text-slate-500'} />
                    </button>
                  )}
                  <h3 className={`font-bold text-base leading-tight truncate ${dim ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-50 group-hover:text-cyan-300'}`}>{it.name}</h3>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 shrink-0" />
              </div>
              <p className="text-xs text-slate-500 mb-2">{it.category}{isExalted && parentFrames.length > 0 && <span className="text-slate-600"> · via {parentFrames.map((p) => p.name).join(' / ')}</span>}</p>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>{bs.length} build{bs.length === 1 ? '' : 's'}</span>
                {bs.length > 0 && <span className={ready === bs.length ? 'text-emerald-400' : 'text-amber-400'}>{ready} ready</span>}
                {(it.relatedIds || []).length > 0 && <span className="flex items-center gap-1"><Link2 size={11} /> {it.relatedIds.length}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* inventory (mods / arcanes)                                               */
/* ----------------------------------------------------------------------- */

function InventoryView({ kind, items, modReq, onToggle, onSetRank, onSource, onAdd }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [ownedFilter, setOwnedFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [newName, setNewName] = useState('');
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort(), [items]);
  const [newCat, setNewCat] = useState(categories[0] || 'Other');

  const deficitOf = (it) => {
    if (kind !== 'mod' || !it.owned) return 0;
    const req = modReq.get(norm(it.name));
    const own = num(it.ownedRank);
    if (!req || own == null) return 0;
    return Math.max(0, req.maxRank - own);
  };

  const neededFor = (it) => {
    if (kind !== 'mod' || it.owned) return null;
    const req = modReq.get(norm(it.name));
    return req && req.refs.length > 0 ? req : null;
  };

  const visible = items.filter((it) => {
    if (filter !== 'All' && it.category !== filter) return false;
    if (ownedFilter === 'owned' && !it.owned) return false;
    if (ownedFilter === 'missing' && it.owned) return false;
    if (ownedFilter === 'deficit' && deficitOf(it) === 0) return false;
    if (ownedFilter === 'needed' && !neededFor(it)) return false;
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const ownedTotal = items.filter((i) => i.owned).length;
  const deficitTotal = kind === 'mod' ? items.filter((i) => deficitOf(i) > 0).length : 0;
  const neededTotal = kind === 'mod' ? items.filter((i) => neededFor(i)).length : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="wf-display text-xl text-slate-100 flex items-center gap-2">
          {kind === 'mod' ? <Package size={18} className="text-cyan-400" /> : <Sparkles size={18} className="text-fuchsia-400" />}
          {kind === 'mod' ? 'Mod Inventory' : 'Arcane Inventory'}
        </h2>
        <span className="text-sm text-slate-400">{ownedTotal} <span className="text-slate-600">/ {items.length}</span>{deficitTotal > 0 && <span className="text-amber-400"> · {deficitTotal} under-ranked</span>}{neededTotal > 0 && <span className="text-rose-400"> · {neededTotal} needed</span>}</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`Add a ${kind} not in the list...`} className={inputCls} />
        <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="bg-slate-950 border border-slate-700 text-slate-200 text-sm px-2 outline-none focus:border-cyan-400">
          {(kind === 'mod' ? MOD_CATEGORIES : ['Warframe', 'Melee', 'Primary', 'Secondary', 'Other']).map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => { if (newName.trim()) { onAdd(newName.trim(), newCat); setNewName(''); } }} className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 flex items-center"><Plus size={16} /></button>
      </div>

      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className={inputCls + ' pl-9'} />
      </div>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {['All', ...categories].map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`text-xs px-2.5 py-1 border ${filter === c ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>{c}</button>
        ))}
      </div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[['all', 'All'], ['owned', 'Owned'], ['missing', 'Missing'], ...(kind === 'mod' ? [['needed', `Needed for builds${neededTotal ? ` (${neededTotal})` : ''}`], ['deficit', 'Under-ranked']] : [])].map(([v, l]) => (
          <button key={v} onClick={() => setOwnedFilter(v)} className={`text-xs px-2.5 py-1 border ${ownedFilter === v ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-1.5">
        {visible.length === 0 && <p className="text-slate-600 text-sm py-6 text-center">Nothing matches.</p>}
        {visible.map((it) => {
          const def = deficitOf(it);
          const req = kind === 'mod' ? modReq.get(norm(it.name)) : null;
          return (
            <div key={it.id} className="bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3 px-3 py-2">
                <button onClick={() => onToggle(it.id)} className="shrink-0" title={it.owned ? 'Owned' : 'Not owned'}>
                  {it.owned ? <Hexagon size={20} className="text-emerald-400 fill-emerald-500/30" /> : <Hexagon size={20} className="text-slate-700" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${it.owned ? 'text-slate-100' : 'text-slate-400'}`}>{it.name}</div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">{it.category}{req ? ` · used in ${req.refs.length}` : ''}</div>
                </div>
                {kind === 'mod' && it.owned && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-500">R</span>
                    <input type="number" min="0" max="13" value={it.ownedRank} onChange={(e) => onSetRank(it.id, e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 text-slate-100 text-xs px-1.5 py-1 outline-none focus:border-cyan-400 text-center" />
                  </div>
                )}
                {def > 0 && <span className="shrink-0 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-600/50 px-1.5 py-0.5">NEEDS R{req.maxRank}</span>}
                <button onClick={() => setExpanded(expanded === it.id ? null : it.id)} className={`shrink-0 text-xs flex items-center gap-1 px-2 py-1 ${it.source ? 'text-cyan-300' : 'text-slate-500'} hover:text-cyan-300`}>
                  {expanded === it.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Source
                </button>
              </div>
              {expanded === it.id && (
                <div className="px-3 pb-2.5 space-y-2">
                  <textarea value={it.source || ''} onChange={(e) => onSource(it.id, e.target.value)} rows={2}
                    placeholder={kind === 'mod' ? 'Where to get it — vendor(s), mission drops, etc. (one per line is fine)' : 'Where to get this arcane...'}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 outline-none focus:border-cyan-400 placeholder-slate-600" />
                  {req && req.refs.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      <span className="text-slate-400 font-semibold">Required by:</span> {req.refs.map((r, i) => <span key={i}>{i > 0 && ', '}{r.build}{r.rank !== '' && r.rank != null ? ` (R${r.rank})` : ''}</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* root app                                                                */
/* ----------------------------------------------------------------------- */

export default function App() {
  const [data, setData] = useState(() => loadData() || seed());
  const [tab, setTab] = useState('builds');
  const [buildCat, setBuildCat] = useState('Warframe');
  const [itemId, setItemId] = useState(null);
  const [buildId, setBuildId] = useState(null);
  const [editingBuild, setEditingBuild] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);
  const mergeFileRef = useRef(null);

  useEffect(() => { persist(data); }, [data]);

  const modByName = useMemo(() => { const m = new Map(); (data?.mods || []).forEach((x) => m.set(norm(x.name), x)); return m; }, [data]);
  const arcByName = useMemo(() => { const m = new Map(); (data?.arcanes || []).forEach((x) => m.set(norm(x.name), x)); return m; }, [data]);
  const modNames = useMemo(() => (data?.mods || []).map((m) => m.name).sort(), [data]);
  const arcaneNames = useMemo(() => (data?.arcanes || []).map((a) => a.name).sort(), [data]);
  const modReq = useMemo(() => buildModRequirements(data?.builds || []), [data]);

  /* mod / arcane mutations */
  const toggleMod = (id) => setData((d) => ({ ...d, mods: d.mods.map((m) => (m.id === id ? { ...m, owned: !m.owned } : m)) }));
  const toggleModByName = (name) => setData((d) => ({ ...d, mods: d.mods.map((m) => (norm(m.name) === norm(name) ? { ...m, owned: !m.owned } : m)) }));
  const setModRank = (id, r) => setData((d) => ({ ...d, mods: d.mods.map((m) => (m.id === id ? { ...m, ownedRank: r === '' ? '' : Number(r) } : m)) }));
  const sourceMod = (id, source) => setData((d) => ({ ...d, mods: d.mods.map((m) => (m.id === id ? { ...m, source } : m)) }));
  const addMod = (name, category) => setData((d) => d.mods.some((m) => norm(m.name) === norm(name)) ? d : { ...d, mods: [...d.mods, { id: uid(), name, category, owned: true, ownedRank: '', source: '' }] });

  const toggleArcane = (id) => setData((d) => ({ ...d, arcanes: d.arcanes.map((a) => (a.id === id ? { ...a, owned: !a.owned } : a)) }));
  const toggleArcaneByName = (name) => setData((d) => ({ ...d, arcanes: d.arcanes.map((a) => (norm(a.name) === norm(name) ? { ...a, owned: !a.owned } : a)) }));
  const sourceArcane = (id, source) => setData((d) => ({ ...d, arcanes: d.arcanes.map((a) => (a.id === id ? { ...a, source } : a)) }));
  const addArcane = (name, category) => setData((d) => d.arcanes.some((a) => norm(a.name) === norm(name)) ? d : { ...d, arcanes: [...d.arcanes, { id: uid(), name, category, owned: true, source: '' }] });

  const formaStep = (bid, delta) => setData((d) => ({
    ...d, builds: d.builds.map((b) => b.id !== bid ? b : { ...b, formaApplied: Math.max(0, Math.min((Number(b.forma) || 0), (Number(b.formaApplied) || 0) + delta)) }),
  }));

  /* save item (with bidirectional relation sync) */
  const saveItem = (item) => {
    setData((d) => {
      const prev = d.items.find((i) => i.id === item.id);
      const prevRel = new Set(prev ? prev.relatedIds || [] : []);
      const nextRel = new Set(item.relatedIds || []);
      const items = d.items.map((i) => {
        if (i.id === item.id) return item;
        const rel = new Set(i.relatedIds || []);
        if (nextRel.has(i.id) && !prevRel.has(i.id)) rel.add(item.id);
        if (!nextRel.has(i.id) && prevRel.has(i.id)) rel.delete(item.id);
        return { ...i, relatedIds: Array.from(rel) };
      });
      const exists = d.items.some((i) => i.id === item.id);
      return { ...d, items: exists ? items : [...items, item] };
    });
    setEditingItem(null);
    setItemId(item.id);
    setBuildCat(buildTabFor(item.category));
  };

  const toggleItemOwned = (id) => setData((d) => ({
    ...d, items: d.items.map((i) => (i.id === id ? { ...i, owned: !i.owned } : i)),
  }));

  const deleteItem = (id) => {
    setData((d) => ({
      ...d,
      items: d.items.filter((i) => i.id !== id).map((i) => ({ ...i, relatedIds: (i.relatedIds || []).filter((r) => r !== id) })),
      builds: d.builds.filter((b) => b.itemId !== id),
    }));
    setItemId(null); setBuildId(null);
  };

  /* save build — find/create item, auto-add unknown mods + arcanes */
  const saveBuild = (form) => {
    setData((d) => {
      let items = d.items;
      let targetItemId = form.itemId;
      const existsItem = targetItemId && items.some((i) => i.id === targetItemId);
      if (!existsItem) {
        const found = items.find((i) => norm(i.name) === norm(form.itemName) && i.category === form.category);
        if (found) targetItemId = found.id;
        else {
          targetItemId = uid();
          const itSubtype = form.category === 'Companion' ? (form.subtype || 'Mechanical') : null;
          const slotCount = modSlotCountFor({ category: form.category, subtype: itSubtype });
          items = [...items, { id: targetItemId, name: form.itemName, category: form.category, relatedIds: [], guideLink: '', notes: '', owned: false, subtype: itSubtype, polarities: emptyPolarities(slotCount) }];
        }
      }
      const build = {
        id: form.id, itemId: targetItemId, name: form.name, forma: form.forma, formaApplied: form.formaApplied,
        arcane: form.arcane, arcane2: form.arcane2 || '', aura: form.aura, stance: form.stance, exilus: form.exilus,
        guideLink: form.guideLink, slots: form.slots, notes: form.notes, createdAt: form.createdAt,
      };

      const known = new Set(d.mods.map((m) => norm(m.name)));
      const newMods = [];
      const consider = (nm, cat) => {
        if (nm && !known.has(norm(nm))) { known.add(norm(nm)); newMods.push({ id: uid(), name: nm.trim(), category: cat, owned: false, ownedRank: '', source: '' }); }
      };
      build.slots.forEach((s) => consider(s.mod, modCatForItem(form.category)));
      consider(build.aura, 'Aura'); consider(build.stance, 'Stance'); consider(build.exilus, 'Exilus');

      const newArcs = [];
      const arcCat = SEED_ARCANES[form.category] ? form.category : 'Warframe';
      const considerArc = (nm) => {
        if (!nm) return;
        const exists = d.arcanes.some((a) => norm(a.name) === norm(nm)) || newArcs.some((a) => norm(a.name) === norm(nm));
        if (!exists) newArcs.push({ id: uid(), name: nm.trim(), category: arcCat, owned: false, source: '' });
      };
      considerArc(build.arcane);
      considerArc(build.arcane2);
      const exists = d.builds.some((b) => b.id === build.id);
      return {
        ...d, items,
        mods: [...d.mods, ...newMods],
        arcanes: [...d.arcanes, ...newArcs],
        builds: exists ? d.builds.map((b) => (b.id === build.id ? build : b)) : [...d.builds, build],
      };
    });
    setEditingBuild(null);
    setBuildId(form.id);
    if (form.itemId) setItemId(form.itemId);
    setTab('builds');
  };

  const deleteBuild = (id) => { setData((d) => ({ ...d, builds: d.builds.filter((b) => b.id !== id) })); setBuildId(null); };
  const resetAll = () => { setData(seed()); setItemId(null); setBuildId(null); setEditingBuild(null); setEditingItem(null); setConfirmReset(false); };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenno-forge-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = migrate(JSON.parse(reader.result));
        if (parsed) { setData(parsed); setItemId(null); setBuildId(null); }
        else window.alert('That file did not contain readable tracker data.');
      } catch (err) { window.alert('Could not read that file — is it a Tenno Forge export?'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const mergeImportData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = migrate(JSON.parse(reader.result));
        if (!parsed) { window.alert('That file did not contain readable tracker data.'); return; }
        setData((cur) => mergeData(cur, parsed));
        const addedItems = parsed.items.length;
        const addedBuilds = parsed.builds.length;
        window.alert(`Merged ${addedItems} item${addedItems === 1 ? '' : 's'} and ${addedBuilds} build${addedBuilds === 1 ? '' : 's'} (duplicates skipped, existing data preserved).`);
      } catch (err) { window.alert('Could not read that file — is it a Tenno Forge export?'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openItem = (id) => {
    const it = data.items.find((i) => i.id === id);
    if (it) setBuildCat(buildTabFor(it.category));
    setItemId(id); setBuildId(null); setTab('builds');
  };

  const curItem = data.items.find((i) => i.id === itemId);
  const curBuild = data.builds.find((b) => b.id === buildId);
  const curBuildItem = curBuild ? data.items.find((i) => i.id === curBuild.itemId) : null;

  const buildInitial = (b) => {
    const it = data.items.find((x) => x.id === b.itemId);
    return { ...b, itemName: it ? it.name : '', category: it ? it.category : 'Other', subtype: it?.subtype || null };
  };

  return (
    <div className="min-h-screen wf-body" style={{ background: 'radial-gradient(ellipse at top, #0d1420 0%, #070a0f 60%)', color: '#cbd5e1' }}>
      <style>{`
        .wf-display{font-family:'Orbitron',sans-serif;}
        .wf-body{font-family:'Chakra Petch',sans-serif;}
        @keyframes wfup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .wf-anim{animation:wfup .35s ease both}
        input[type=number]::-webkit-inner-spin-button{opacity:.4}
      `}</style>

      <header className="border-b border-slate-800/80 sticky top-0 z-30" style={{ background: 'rgba(7,10,15,0.92)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center bg-cyan-500/15 border border-cyan-500/40" style={cut(6)}><Hammer size={16} className="text-cyan-400" /></div>
          <div>
            <h1 className="wf-display text-base text-slate-50 leading-none tracking-wider">TENNO FORGE</h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Warframe Build Tracker</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {[['builds', 'Builds', ClipboardList], ['mods', 'Mods', Package], ['arcanes', 'Arcanes', Sparkles]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => { setTab(id); setItemId(null); setBuildId(null); setEditingBuild(null); setEditingItem(null); }}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 border-b-2 ${tab === id ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-6 pb-16">
        <div className="wf-anim" key={`${tab}-${itemId}-${buildId}-${editingBuild ? 'eb' : ''}-${editingItem ? 'ei' : ''}`}>
          {editingItem ? (
            <ItemForm initial={editingItem} allItems={data.items} onSave={saveItem} onCancel={() => setEditingItem(null)} />
          ) : editingBuild ? (
            <BuildForm initial={editingBuild} items={data.items} modNames={modNames} arcaneNames={arcaneNames} onSave={saveBuild} onCancel={() => setEditingBuild(null)} />
          ) : tab === 'builds' ? (
            curBuild ? (
              <BuildDetail build={curBuild} item={curBuildItem} modByName={modByName} arcByName={arcByName}
                onBack={() => setBuildId(null)} onEdit={(b) => setEditingBuild(buildInitial(b))} onDelete={deleteBuild}
                onToggleMod={toggleModByName} onToggleArcane={toggleArcaneByName} onForma={formaStep} />
            ) : curItem ? (
              <ItemDetail item={curItem} builds={data.builds} allItems={data.items} modByName={modByName} arcByName={arcByName}
                onBack={() => setItemId(null)} onEditItem={(i) => setEditingItem(i)} onDeleteItem={deleteItem}
                onOpenBuild={(id) => setBuildId(id)} onOpenItem={openItem}
                onNewBuild={(it) => setEditingBuild({ lockItem: true, itemId: it.id, itemName: it.name, category: it.category, subtype: it.subtype || null, slots: [], forma: 0 })} />
            ) : (
              <ItemsList buildCat={buildCat} items={data.items} builds={data.builds} modByName={modByName} arcByName={arcByName}
                onSetCat={setBuildCat} onOpenItem={openItem}
                onNewItem={() => setEditingItem({ category: buildCat === 'Other' ? 'Other' : buildCat, relatedIds: [] })}
                onImport={() => setShowImport(true)} onToggleOwned={toggleItemOwned} />
            )
          ) : tab === 'mods' ? (
            <InventoryView kind="mod" items={data.mods} modReq={modReq} onToggle={toggleMod} onSetRank={setModRank} onSource={sourceMod} onAdd={addMod} />
          ) : (
            <InventoryView kind="arcane" items={data.arcanes} modReq={new Map()} onToggle={toggleArcane} onSetRank={() => {}} onSource={sourceArcane} onAdd={addArcane} />
          )}
        </div>

        <div className="max-w-3xl mx-auto mt-12 pt-4 border-t border-slate-900 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-slate-700">Data is saved in this browser. Export to back up or share with friends.</p>
          <div className="flex items-center gap-3">
            <button onClick={exportData} className="text-[11px] text-slate-500 hover:text-cyan-300">Export data</button>
            <button onClick={() => fileRef.current && fileRef.current.click()} className="text-[11px] text-slate-500 hover:text-cyan-300" title="Replace all data from a JSON file">Import data</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={importData} className="hidden" />
            <button onClick={() => mergeFileRef.current && mergeFileRef.current.click()} className="text-[11px] text-slate-500 hover:text-cyan-300" title="Add new items/builds/mods from a JSON file without replacing existing data">Merge data</button>
            <input ref={mergeFileRef} type="file" accept="application/json,.json" onChange={mergeImportData} className="hidden" />
            {confirmReset ? (
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-rose-400">Reset everything?</span>
                <button onClick={resetAll} className="text-[11px] text-rose-300 border border-rose-800 px-2 py-0.5 hover:bg-rose-500/10">Yes</button>
                <button onClick={() => setConfirmReset(false)} className="text-[11px] text-slate-500 px-1">No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="text-[11px] text-slate-700 hover:text-rose-400">Reset</button>
            )}
          </div>
        </div>
      </main>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onParse={(b) => { setShowImport(false); setEditingBuild({ ...b, slots: b.slots }); }} />}
    </div>
  );
}
