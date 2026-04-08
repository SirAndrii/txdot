/**
 * DocumentColumn — React implementation of Figma component
 * Source: M-DCS MLM Inspection Flow (Hub), node 4891:10217 "level=Document"
 * Dimensions: 246px wide column with ColTitle header + document rows
 */

import type { CSSProperties, ReactNode } from 'react';
import { colors, typography, spacing, componentDimensions, transitions } from '../design/tokens';

// ── Shared style helpers ──────────────────────────────────────────────────────
const flexRow = (extra?: CSSProperties): CSSProperties => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  ...extra,
});

// ── Sub-components ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  onClick?: () => void;
  children: ReactNode;
}

/** Small chip-style action button — Figma node 530:22013, padding 8/5, gap 8 */
export function ActionButton({ onClick, children }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        padding: `${spacing.sm} ${spacing.lg}`,
        border: `1px solid ${colors.border}`,
        borderRadius: componentDimensions.chipRadius,
        background: colors.surface,
        cursor: 'pointer',
        transition: transitions.button,
        font: 'inherit',
        ...typography.sm,
        color: colors.textPrimary,
      }}
    >
      {children}
    </button>
  );
}

interface PrimaryButtonProps {
  onClick?: () => void;
  children: ReactNode;
}

/** CTA/primary button — Figma node 1058:4507, padding 10/5, HUG width */
export function PrimaryButton({ onClick, children }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        padding: `${spacing.sm} ${spacing.xl}`,
        border: `1px solid ${colors.interactive}`,
        borderRadius: componentDimensions.borderRadius,
        background: colors.interactive,
        color: colors.white,
        cursor: 'pointer',
        transition: transitions.button,
        font: 'inherit',
        ...typography.sm,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e =>
        ((e.currentTarget as HTMLButtonElement).style.background = colors.interactiveHover)
      }
      onMouseLeave={e =>
        ((e.currentTarget as HTMLButtonElement).style.background = colors.interactive)
      }
    >
      {children}
    </button>
  );
}

interface ColTitleProps {
  label: string;
  count?: number;
  onAdd?: () => void;
  onAction?: () => void;
}

/**
 * ColTitle — Figma node 4891:10218
 * Horizontal row, SPACE_BETWEEN, padding 4px all sides, height 40px
 * Left: badge frame (padding 6, corner 4, gap 8) + label text
 * Right: action button + primary button
 */
export function ColTitle({ label, count, onAdd, onAction }: ColTitleProps) {
  return (
    <div
      style={flexRow({
        justifyContent: 'space-between',
        padding: spacing.xs,
        height: componentDimensions.colTitleHeight,
        flexShrink: 0,
        width: '100%',
        gap: spacing.xs,
        boxSizing: 'border-box',
      })}
    >
      {/* Left: badge frame + label — Figma "Frame 627451" + "Label" text */}
      <div style={flexRow({ gap: spacing.lg })}>
        {count !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.md,
              borderRadius: componentDimensions.chipRadius,
              background: colors.componentAccent,
              ...typography.xs,
              color: colors.textPrimary,
              minWidth: '20px',
            }}
          >
            {count}
          </div>
        )}
        <span
          style={{
            ...typography.sm,
            color: colors.textPrimary,
          }}
        >
          {label}
        </span>
      </div>

      {/* Right: action + primary buttons */}
      <div style={flexRow({ gap: spacing.sm, flexShrink: 0 })}>
        {onAction && <ActionButton onClick={onAction}>•••</ActionButton>}
        {onAdd && <PrimaryButton onClick={onAdd}>+ Add</PrimaryButton>}
      </div>
    </div>
  );
}

interface ToolbarProps {
  children?: ReactNode;
}

/**
 * Toolbar row — Figma node 5602:6449 "Frame 627493"
 * Horizontal, height 32px, gap 16px, items aligned to the right (primaryAxisAlignItems: MAX)
 */
export function Toolbar({ children }: ToolbarProps) {
  return (
    <div
      style={flexRow({
        justifyContent: 'flex-end',
        height: componentDimensions.toolbarHeight,
        flexShrink: 0,
        width: '100%',
        gap: spacing['2xl'],
        boxSizing: 'border-box',
        padding: `0 ${spacing.xs}`,
      })}
    >
      {children}
    </div>
  );
}

export interface DocumentRowProps {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  onClick?: () => void;
}

/**
 * Document row — Figma component "Pyr_6_documents" (instances 4891:10220 etc.)
 * Horizontal, FILL width, height ~100px, transitions to 4721:68536 on click
 */
export function DocumentRow({ title, subtitle, meta, status, onClick }: DocumentRowProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        minHeight: componentDimensions.documentRowHeight,
        padding: `${spacing.lg} ${spacing.xs}`,
        borderBottom: `1px solid ${colors.border}`,
        gap: spacing.lg,
        cursor: onClick ? 'pointer' : 'default',
        transition: transitions.row,
        boxSizing: 'border-box',
        background: colors.surface,
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = colors.background; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = colors.surface; }}
    >
      {/* Document icon placeholder */}
      <div
        style={{
          width: '32px',
          height: '40px',
          flexShrink: 0,
          borderRadius: '2px',
          background: colors.stroke,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...typography.xs,
          color: colors.textLabel,
        }}
      >
        📄
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...typography.comboListContent,
            color: colors.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              ...typography.notes,
              color: colors.textMuted,
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
        {meta && (
          <div style={{ ...typography.smallDetails, color: colors.textLabel, marginTop: '4px' }}>
            {meta}
          </div>
        )}
      </div>

      {/* Status badge */}
      {status && (
        <div
          style={{
            flexShrink: 0,
            padding: `2px ${spacing.md}`,
            borderRadius: componentDimensions.chipRadius,
            background: colors.stroke,
            ...typography.xs,
            color: colors.interactive,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface DocumentColumnProps {
  /** Column header label (Figma: "Documents") */
  label: string;
  /** Document count badge */
  count?: number;
  /** Toolbar content (sort/filter buttons) */
  toolbar?: ReactNode;
  /** Document rows */
  documents: DocumentRowProps[];
  /** Callback for the "+ Add" primary button */
  onAdd?: () => void;
  /** Callback for the "•••" action button */
  onAction?: () => void;
  /** Override column width (default: 246px from Figma) */
  width?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * DocumentColumn — matches Figma component node 4891:10217 "level=Document"
 *
 * Structure:
 *   ColTitle (40px)        ← header with label + buttons
 *   Toolbar  (32px)        ← right-aligned action row
 *   DocumentRow × N (100px each)
 */
export default function DocumentColumn({
  label,
  count,
  toolbar,
  documents,
  onAdd,
  onAction,
  width = componentDimensions.columnWidth,
  className,
  style,
}: DocumentColumnProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        flexShrink: 0,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: componentDimensions.borderRadius,
        overflow: 'hidden',
        fontFamily: typography.fontFamily,
        ...style,
      }}
    >
      <ColTitle label={label} count={count} onAdd={onAdd} onAction={onAction} />
      <Toolbar>{toolbar}</Toolbar>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {documents.map(doc => (
          <DocumentRow key={doc.id} {...doc} />
        ))}
        {documents.length === 0 && (
          <div
            style={{
              padding: spacing['2xl'],
              textAlign: 'center',
              ...typography.notes,
              color: colors.textLabel,
            }}
          >
            No documents
          </div>
        )}
      </div>
    </div>
  );
}
