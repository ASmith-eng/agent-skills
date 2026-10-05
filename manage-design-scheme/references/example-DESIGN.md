---
version: alpha
name: Fieldbook
description: Job scheduling and on-site job records for small trade businesses — office staff plan the week on desktop, technicians run their day from a tablet or phone in the van.

colors:
  # Brand
  primary: "#115e59"          # deep teal — primary actions, selected state, links
  primary-hover: "#134e4a"    # hover / pressed on primary
  on-primary: "#ffffff"       # text and icons on primary

  # Neutrals
  background: "#ffffff"       # cards, sheets, inputs
  surface: "#faf9f7"          # warm off-white page background
  foreground: "#1c1917"       # primary text
  muted-foreground: "#57534e" # secondary text, helper text, timestamps
  muted: "#f5f5f4"            # hovered rows, disabled fills
  divider: "#d6d3d1"          # decorative dividers between sections and rows
  input-border: "#78716c"     # outlines of inputs and checkboxes (meets 3:1)
  focus-ring: "#115e59"       # 2px outline, 2px offset

  # Destructive
  destructive: "#b91c1c"      # destructive button fill
  on-destructive: "#ffffff"   # text on destructive

  # Status — chip background, text, border
  success-bg: "#f0fdf4"       # completed, paid, signed
  success-text: "#166534"
  success-border: "#86efac"
  warning-bg: "#fffbeb"       # running late, parts needed, unpaid
  warning-text: "#92400e"
  warning-border: "#fcd34d"
  error-bg: "#fef2f2"         # failed sync, cancelled by customer
  error-text: "#991b1b"
  error-border: "#fca5a5"
  info-bg: "#eff6ff"          # scheduled, en route
  info-text: "#1e40af"
  info-border: "#93c5fd"
  neutral-bg: "#f5f5f4"       # draft, on hold, archived
  neutral-text: "#44403c"
  neutral-border: "#d6d3d1"

typography:
  h1:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.3
  h3:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
  caption:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  sm: 4px      # inputs, checkboxes
  md: 6px      # buttons
  lg: 12px     # cards, sheets, dialogs
  full: 9999px # chips, avatars

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px

components:
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
  helper-text:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
  link:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 16px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.on-destructive}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 16px
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: 48px
    padding: 12px
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 24px
  table-row-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    height: 44px
  chip-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  chip-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  chip-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  chip-info:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  chip-neutral:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
---

# Fieldbook — Design system

This document is the source of truth for how Fieldbook looks and behaves. Start here when designing or building any screen; if a screen follows these rules it belongs to the product. It is a living document — update it when decisions change.

## Overview

Fieldbook is used by small trade businesses — plumbers, electricians, heating engineers. Office staff schedule and invoice on desktop in long sessions. Technicians use a tablet or phone in the van and on site, in short bursts, often outdoors, sometimes with gloves on.

The personality is **practical, sturdy and friendly**. It should feel like a good set of hand tools laid out on a van shelf: everything labelled, nothing decorative, built to be grabbed in a hurry.

### Design principles

1. **Usable with one hand, outdoors.** Large targets, high contrast, nothing that depends on hover.
2. **Today first.** The technician's next job is always one tap away.
3. **Plain over clever.** Familiar patterns and plain words; no hidden gestures.
4. **Color means something.** Teal marks the action; status colors mark state; everything else is neutral.

## Colors

A warm neutral canvas with one teal brand color. Most of a screen is off-white, white and near-black.

- **Primary teal (`#115e59`)** — the primary button, selected tabs and toggles, and text links. One primary button per view.
- **Neutrals** — `surface` behind everything, `background` for cards and inputs, `foreground` for text, `muted-foreground` for secondary text. `divider` is for decorative lines only; anything that outlines a control uses `input-border`.
- **Destructive red (`#b91c1c`)** — fills destructive buttons only.

### Dark theme

Not yet defined — ask before inventing.

### Status

| Meaning | Applies to | Family |
|---|---|---|
| Success | completed, paid, signed | green |
| Warning | running late, parts needed, unpaid | amber |
| Error | failed sync, cancelled by customer | red |
| Info | scheduled, en route | blue |
| Neutral | draft, on hold, archived | stone |

Status is shown as a tinted chip: the meaning's `-bg` fill, `-text` text, and a 1px `-border` outline, with a leading icon. A state that fits none of these maps to the closest meaning; no new status colors.

## Typography

Atkinson Hyperlegible for everything — chosen for legibility in poor light, falling back to the system sans-serif. It has two weights, 400 and 700, and those are the only weights used. Emphasis is 700, never a larger size. Job numbers and invoice references use the `mono` style, falling back to Menlo or Consolas.

Body text is 16px on every device; desktop tables may use `body-sm`. One `h1` per screen.

## Layout

### Page structure

- **Desktop (≥1200px):** left sidebar with the main sections, top bar with search and account, content on `surface`.
- **Tablet and phone:** bottom tab bar with four sections (Today, Schedule, Customers, More); a top bar with the page title and a back link.

### Rhythm

Built on an 8px base, using the `spacing` scale.

- Card padding: 16px on phone, 24px from tablet up.
- Between form fields: 16px; between form sections: 32px.
- Between cards: 16px.
- Inline gaps (icon to label, adjacent buttons): 8px.
- List rows: at least 56px tall on touch screens, 44px on desktop.

### Responsive behavior

Mobile-first, with breakpoints at **480px** (large phone), **768px** (tablet) and **1200px** (desktop). Below 768px, forms are single column, action bars stick to the bottom of the screen, and data tables become stacked cards. The page never scrolls horizontally.

## Elevation & Depth

Surfaces are separated mainly by background tone — white cards on the off-white `surface` — with shadows used sparingly.

- **Cards:** `0 1px 2px rgba(28,25,23,0.08)`, no border.
- **Sheets, dialogs and menus:** `0 6px 16px rgba(28,25,23,0.16)`.
- Nothing else casts a shadow. Inputs and buttons are flat.

## Shapes

Corners are softly rounded and get rounder as the element gets bigger: 4px on inputs and checkboxes, 6px on buttons, 12px on cards, sheets and dialogs. Chips and avatars are fully rounded. No sharp corners and no other radii.

## Components

### Buttons

Three variants, one height per size: 48px on touch screens, 40px on desktop.

- **Primary** — teal fill, white text. One per view.
- **Secondary** — white fill, teal text, `input-border` outline.
- **Destructive** — red fill, white text. Always followed by a confirmation dialog, except where noted below.

Buttons act on the current screen. They never navigate.

### Links & navigation

Navigation uses text links: teal, 400 weight, underlined. A back link sits at the top left with a leading arrow ("Back to schedule"). Table and list drill-ins are links on the item's name.

### Action placement

- **Desktop:** action bar at the bottom of the form or dialog; Cancel on the left, the primary on the far right, secondary forward actions to its left.
- **Touch screens:** the primary is a full-width button at the bottom of the screen, with Cancel as a text button above it.
- Destructive actions sit in the overflow menu (⋯), never next to the primary.

### Inputs & forms

White fill, `input-border` outline, 48px tall on touch screens. The label sits above the field; helper text below in `muted-foreground`. On error the border and helper text turn error red and the message says how to fix it. Required fields are marked "(required)"; optional ones are not marked. Fields validate when the user leaves them and again on submit.

Job notes and checklists save automatically; they show "Saved" with a time, and there is no Save button.

### Signature pad

A full-width white area with an `input-border` outline and a "Clear" text button below it. Clearing the signature pad does not ask for confirmation; the customer signs again.

### Cards

White, no border, with an optional header holding the title and a right-aligned overflow menu.

### Data tables

Desktop only. `body-sm` cells, 44px rows, `muted` on row hover, sticky header, pagination below. Status columns use chips. Below 768px, each row becomes a card.

### Status chips

Caption-sized, fully rounded, tinted per [Status](#status), with a leading icon. Not interactive.

### Overlays

- **Dialog** — confirmations and short forms. Centered on desktop; a bottom sheet on touch screens.
- **Sheet** — job and customer details on desktop, sliding in from the right.
- One overlay at a time.

### Feedback

- **Toasts** — bottom center, above the tab bar on touch screens; bottom right on desktop. Auto-dismiss after 5 seconds, except errors, which stay until dismissed.
- **Empty states** — a line saying what belongs here and the primary action ("No jobs today. Add a job").
- **Loading** — skeleton rows matching the final layout.
- **Errors** — what happened and what to do, with a Retry button where it applies.
- **Offline** — a neutral banner at the top: "You're offline. Changes will sync when you reconnect."

## Interaction & Motion

Every interactive element has default, pressed, focus and disabled states; desktop adds hover. Nothing depends on hover to be discovered. Focus is a 2px `focus-ring` outline with a 2px offset and is never removed. Motion is 150ms ease-out fades and slides for sheets and toasts. With reduced motion requested, sheets and toasts appear without sliding.

## Iconography

Not yet defined — ask before inventing.

## Accessibility

- **Contrast** — text meets 4.5:1 (1.4.3); `muted-foreground` is the lightest permitted text color. Control outlines, focus rings and meaningful icons meet 3:1 (1.4.11), which is why inputs use `input-border` and not `divider`.
- **Color is never the only signal** (1.4.1) — chips carry an icon and text; errors carry a message.
- **Keyboard** — everything works by keyboard on desktop, in visual order, with visible focus (2.1.1, 2.4.3, 2.4.7). The sticky action bar never covers the focused field (2.4.11).
- **Targets** — at least 48×48px on touch screens; never below 24×24px anywhere (2.5.8).
- **Structure** — one `h1`, headings in order, landmarks for navigation and main content, a skip link on desktop (1.3.1, 2.4.1). Every screen has a descriptive title (2.4.2).
- **Labels** — every input has a visible label (3.3.2); icon-only buttons have an accessible name (4.1.2).
- **Errors** — identified in text with a suggested fix (3.3.1, 3.3.3). Invoices can be reviewed before sending (3.3.4).
- **Status messages** — "Saved", sync status and toasts are announced without moving focus (4.1.3).
- **Reflow and resize** — usable at 320px wide and at 200% text size (1.4.10, 1.4.4).
- **Motion** — honors reduced-motion (2.3.3).
- **Sign-in** — password managers and paste work; no puzzles (3.3.8).

## Voice & Tone

Plain, friendly and brief — how a good office manager talks to a technician. Use the trade's words ("job", "callout", "parts"), not software words ("record", "entity"). Sentence case everywhere. Errors say what happened and what to do: "Couldn't send the invoice. Check your connection and try again."

## Do's and Don'ts

- **Do** keep one primary action per view, on the right on desktop and full-width at the bottom on touch screens.
- **Do** design empty, loading, error and offline states for every list.
- **Do** keep touch targets at 48px.
- **Do** use links for navigation and buttons for actions.
- **Don't** introduce colors, fonts, weights or spacing outside the tokens above.
- **Don't** depend on hover.
- **Don't** put a destructive action next to the primary.
- **Don't** stack overlays.
