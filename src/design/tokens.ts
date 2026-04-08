/**
 * Design tokens extracted from Figma:
 * M-DCS MLM Inspection Flow (Hub) — node 4891:10217
 * File: KV5Pe7OPDku4YEYy4F8iOt  |  Last modified: 2026-04-07
 */

// ── Colors ────────────────────────────────────────────────────────────────────
export const colors = {
  /** Pure white — fill style "White" */
  white: '#FFFFFF',
  /** Component accent yellow — fill style "Component" */
  componentAccent: '#FFED47',
  /** Radial overlay (black → transparent) — fill style "rad" / "radial-grad" */
  radialOverlay: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',

  // Semantic / UI colours inferred from component fills + variable aliases
  /** Card / column background */
  surface: '#FFFFFF',
  /** Page / canvas background */
  background: '#F5F5F5',
  /** Primary border / divider */
  border: '#E2E8F0',
  /** Strong border */
  borderStrong: '#CBD5E1',
  /** Primary text */
  textPrimary: '#0F172A',
  /** Secondary / muted text */
  textMuted: '#64748B',
  /** Label / caption text */
  textLabel: '#94A3B8',
  /** Interactive / link blue */
  interactive: '#2563EB',
  /** Interactive hover */
  interactiveHover: '#1D4ED8',
  /** Stroke on light surface */
  stroke: '#DBEAFE',
} as const;

// ── Typography — Sonalake scale (Poppins) ────────────────────────────────────
// Usage from Figma style descriptions:
//   xs   → tiny details
//   sm   → labels, small body
//   base → most body copy and labels
//   lg   → section headings, important labels
//   xl   → (not in active use)
//   2xl  → display numbers
//   3xl  → (not in active use)
export const typography = {
  fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  // Sonalake scale
  xs:   { fontSize: '10px', lineHeight: '12px',    fontWeight: 500 },
  sm:   { fontSize: '14px', lineHeight: '14px',    fontWeight: 500 },
  base: { fontSize: '15px', lineHeight: '18px',    fontWeight: 500 },
  lg:   { fontSize: '18px', lineHeight: '23.4px',  fontWeight: 500 },
  xl:   { fontSize: '20px', lineHeight: '21px',    fontWeight: 700 },
  '2xl':{ fontSize: '24px', lineHeight: '25.2px',  fontWeight: 700 },
  '3xl':{ fontSize: '32px', lineHeight: '33.6px',  fontWeight: 700 },

  // Metrologic roles
  landingText:       { fontSize: '40px', lineHeight: '60px',   fontWeight: 400 },
  pageTitle:         { fontSize: '20px', lineHeight: '30px',   fontWeight: 700 },
  kanbanHeader:      { fontSize: '18px', lineHeight: '27px',   fontWeight: 400 },
  cardTitle:         { fontSize: '16px', lineHeight: '24px',   fontWeight: 700 },
  label:             { fontSize: '15px', lineHeight: '22.5px', fontWeight: 400 },
  endToEndSelector:  { fontSize: '15px', lineHeight: '24px',   fontWeight: 400 },
  comboListContent:  { fontSize: '14px', lineHeight: '24px',   fontWeight: 400 },
  notes:             { fontSize: '12px', lineHeight: '18px',   fontWeight: 400 },
  smallDetails:      { fontSize: '11px', lineHeight: '16.5px', fontWeight: 400 },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
// Extracted from component box model (ColTitle, document rows, buttons)
export const spacing = {
  /** 4px — column title padding, ColTitle gap */
  xs:  '4px',
  /** 5px — button top/bottom padding */
  sm:  '5px',
  /** 6px — badge/chip frame padding, icon pad */
  md:  '6px',
  /** 8px — button inline gap, badge gap */
  lg:  '8px',
  /** 10px — CTA button horizontal padding */
  xl:  '10px',
  /** 16px — toolbar section gap */
  '2xl': '16px',
} as const;

// ── Component dimensions (46891:10217 — "level=Document" column) ──────────────
export const componentDimensions = {
  /** Column width */
  columnWidth:      '246px',
  /** ColTitle row height */
  colTitleHeight:   '40px',
  /** Toolbar row height */
  toolbarHeight:    '32px',
  /** Document row height */
  documentRowHeight: '100px',
  /** Badge/chip corner radius */
  chipRadius:       '4px',
  /** Default border radius */
  borderRadius:     '4px',
} as const;

// ── Transitions (from interaction specs on button/action nodes) ───────────────
export const transitions = {
  /** ColTitle action button → target 627:21975, ease-out 300ms */
  button: 'all 300ms ease-out',
  /** Document row → target 4721:68536, ease-out 300ms */
  row: 'all 300ms ease-out',
} as const;
