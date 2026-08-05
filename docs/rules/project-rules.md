# Project-Specific Rules

Rules specific to this codebase that supplement the universal TypeScript standards.

---

## 1. Always Use Reusable UI Components

Before creating **any** new UI element (button, input, badge, card, modal, select, tooltip, skeleton, toast, tag, etc.), you **must** check `client/src/components/ui/` for an existing component that covers the use case.

### How to check

```bash
ls client/src/components/ui/
```

This directory contains all reusable UI primitives. If a component exists that can be configured via props to achieve the desired behavior, use it. Do not create a raw HTML/JSX element from scratch.

### Decision flow

```
Need a UI element?
  ├── Does a component in src/components/ui/ cover it?
  │     ├── YES → Use it, configure via props
  │     └── NO  → Does a close variant exist that can be extended?
  │                 ├── YES → Extend the existing component (add a prop or variant)
  │                 └── NO  → Create a new reusable component in src/components/ui/
  └── Never hard-code raw HTML elements for things like badges, buttons, inputs, etc.
```

### Currently available components

| Component | File | Use for |
|-----------|------|---------|
| Accordion | `Accordion.tsx` | Collapsible content sections |
| Avatar | `Avatar.tsx` | User/avatar images |
| Badge | `Badge.tsx` | Status indicators, tags, labels, counters |
| Breadcrumbs | `Breadcrumbs.tsx` | Navigation breadcrumbs |
| Button | `Button.tsx` | All clickable actions |
| Card | `Card.tsx` | Content containers |
| Checkbox | `Checkbox.tsx` | Checkbox inputs |
| CommandMenu | `CommandMenu.tsx` | Command palette / search |
| DropdownMenu | `DropdownMenu.tsx` | Dropdown menus |
| Input | `Input.tsx` | Text inputs |
| Loader | `Loader.tsx` | Loading spinners |
| Modal | `Modal.tsx` | Dialogs and drawers |
| OtpInput | `OtpInput.tsx` | OTP / verification code inputs |
| Pagination | `Pagination.tsx` | List pagination |
| Popover | `Popover.tsx` | Floating content panels |
| RadioGroup | `RadioGroup.tsx` | Radio button groups |
| Select | `Select.tsx` | Dropdown selects |
| Skeleton | `Skeleton.tsx` | Loading placeholder shapes |
| Switch | `Switch.tsx` | Toggle switches |
| Table | `Table.tsx` | Data tables |
| Tabs | `Tabs.tsx` | Tab navigation |
| TagInput | `TagInput.tsx` | Multi-tag input fields |
| Textarea | `Textarea.tsx` | Multi-line text inputs |
| RichTextEditor | `RichTextEditor/` | Formatted clinical notes (bold, italic, underline, strike, lists, checklist) |
| Timeline | `Timeline.tsx` | Step / event timelines |
| Toast | `Toast.tsx` | Toast notifications |
| Tooltip | `Tooltip.tsx` | Hover tooltips |
| FieldErrorSlot | `FieldErrorSlot.tsx` | Reserved inline field error/helper text |

### Example: correct vs incorrect

```tsx
// WRONG: raw span for a tag/status label
<span
  style={{
    fontSize: "0.625rem",
    color: "var(--color-text-muted)",
    backgroundColor: "var(--color-bg-sunken)",
    padding: "2px 8px",
  }}
>
  {tag}
</span>

// CORRECT: use the Badge component
<Badge size="sm" variant="ghost" status="neutral">
  {tag}
</Badge>
```

```tsx
// WRONG: raw button with inline styles
<button
  style={{
    background: "var(--color-primary)",
    border: "1.5px solid var(--color-primary)",
    padding: "8px 18px",
    cursor: "pointer",
  }}
>
  Create Project
</button>

// CORRECT: use the Button component
<Button variant="primary" size="sm">
  Create Project
</Button>
```

### When creating a new component

If no existing component fits, follow these rules when creating a new one in `src/components/ui/`:

1. **Export from `index.ts`**: add the export to `src/components/ui/index.ts` so other files can import it cleanly.
2. **Accept a `className` prop**: allow consumers to extend styles when needed.
3. **Use CSS variables**: reference `var(--color-*)` tokens, never hard-code hex/rgb values.
4. **Follow the Editorial design system**: 4px radius, Cormorant Garamond + Syne, burgundy primary, cream page background. See `docs/design/theme-02-editorial-design-system.md`.
5. **Make it prop-configurable**: support `size`, `variant`, and `status` props where applicable.

---

## 2. Badge Component Usage

The `Badge` component is the standard way to render:

- **Status indicators** (ACTIVE, DRAFT, ARCHIVED) → `variant="solid"` + appropriate `status`
- **Tags / labels** → `variant="ghost"` or `variant="outline"` + `status="neutral"`
- **Counters** → `as="counter"` + `count` prop
- **Notification dots** → `dot` prop

Never use raw `<span>` or `<div>` for any of these use cases.

### Status vs Tags: visual distinction

```tsx
// Status badge: solid, colored
<Badge size="sm" variant="solid" status="success">ACTIVE</Badge>
<Badge size="sm" variant="solid" status="warning">DRAFT</Badge>
<Badge size="sm" variant="solid" status="neutral">ARCHIVED</Badge>

// Tag badge: ghost, neutral
<Badge size="sm" variant="ghost" status="neutral">research</Badge>
<Badge size="sm" variant="ghost" status="neutral">Q3-2026</Badge>
```

---

## 3. Design System Enforcement

All UI must follow the **Editorial** design system (`docs/design/theme-02-editorial-design-system.md`). No exceptions.

| Token | Value |
|-------|-------|
| Border radius | `4px` (`--radius-sm`) on all containers |
| Display font | `Cormorant Garamond` (`--font-display`) for headlines H1 to H3 |
| Body / UI font | `Syne` (`--font-body`) for body, labels, buttons, nav |
| Page background | `#faf7f2` (`--color-bg-base`) |
| Surface background | `#ffffff` (`--color-bg-surface`) |
| Secondary surface | `#f4ede3` (`--color-bg-secondary`) |
| Primary accent | `#7b2d3b` (`--color-primary`), burgundy |
| Input/button borders | `1.5px` |
| Shadows | Warm brown `rgba(44, 24, 16, …)`, soft elevation |

Never hard-code hex colors in components. Always use `var(--color-*)` tokens from `client/src/index.css`.

---

## 4. Brand Identity: Logo and Wordmark

ClinicOS has a single approved brand mark. **Do not substitute other icons, logos, or wordmarks.**

### Logo mark

| Property | Rule |
|----------|------|
| Icon | `Stethoscope` from `lucide-react`. The **only** approved product icon |
| Icon container | `rounded-sm` (4px), solid fill |
| On light backgrounds | Burgundy container (`bg-primary`), white icon (`--color-text-inverse`) |
| On burgundy backgrounds | White container (`--color-text-inverse`), burgundy icon (`--color-primary`) |

### Wordmark

| Property | Rule |
|----------|------|
| Text | `ClinicOS`. Exact casing, no spaces, no alternate spellings |
| Font | `font-display` (Cormorant Garamond) |
| Weight | `font-semibold` |
| Size | `text-2xl` for header/auth; scale via `ClinicLogo` `size` prop |
| Color on light | `text-primary` (burgundy) |
| Color on burgundy | `text-[var(--color-text-inverse)]` |

### Implementation

Always use the shared `ClinicLogo` component. Never reimplement the logo inline.

```tsx
// CORRECT: shared brand component
import { ClinicLogo } from '@/components/brand/ClinicLogo';

<ClinicLogo variant="on-light" size="md" linkToHome />

// Auth left panel (burgundy background)
import { AuthBrandHeader } from '@/components/brand/AuthBrandHeader';

<AuthBrandHeader />

// WRONG: ad-hoc icon or different lucide icon for branding
<Activity /> Advinty
<Heart /> Clinic OS
```

Files:

- `client/src/components/brand/ClinicLogo.tsx`
- `client/src/components/brand/AuthBrandHeader.tsx`

---

## 5. Store Types: No `as` Casting

When reading `metadata` or any `Record<string, unknown>` from the store, use a type guard function instead of `as` casting.

```tsx
// WRONG: type casting with `as`
const tags = Array.isArray((project.metadata as Record<string, unknown>)?.tags)
  ? (project.metadata as Record<string, unknown>).tags as string[]
  : [];

// CORRECT: type guard helper
function getProjectTags(metadata: IProject["metadata"]): string[] {
  if (metadata === null || typeof metadata !== "object") return [];
  if (!("tags" in metadata)) return [];
  if (!Array.isArray(metadata.tags)) return [];
  return metadata.tags.filter((t): t is string => typeof t === "string");
}
```

---

## 6. Copy and Punctuation: No Em Dashes

Do **not** use the em dash character (`—`, Unicode U+2014) anywhere in this project:

- User-facing UI copy (headings, labels, descriptions, toasts, empty states)
- Comments in source code
- Documentation written for this repo (`docs/rules/`, README, etc.)

Use plain punctuation instead:

| Instead of | Use |
|------------|-----|
| `Feature — detail` | `Feature. Detail` or `Feature: detail` |
| `A — B — C` | Commas, semicolons, or separate sentences |
| `built for X — with Y` | `built for X, with Y` |

```tsx
// WRONG
<p>Shared patients — role-restricted access</p>

// CORRECT
<p>Shared patients, with role-restricted access</p>
```

This keeps copy consistent and avoids encoding or font-rendering issues across platforms.

---

## 7. Form Field Errors: Reserved Space (Auth Only)

Reserved error space prevents layout shift on **authentication pages only**, where forms are fixed-height inside `AuthLayout`.

### Rules

| Rule | Detail |
|------|--------|
| Default | `reserveErrorSpace={false}` on `Input`, `Select`, `OtpInput`, and similar field components |
| Auth pages only | Pass `reserveErrorSpace` (or `reserveErrorSpace={true}`) on every field in `pages/auth/**` |
| App pages / modals | Do **not** reserve error space. Show errors inline only when present |
| Reserved height (auth) | `h-5` (20px) below the control via `FieldErrorSlot` |
| Overflow | `overflow-hidden` + `truncate` on error text |

### Implementation

```tsx
// Auth page — stable layout
<Input reserveErrorSpace error={errors.email?.message} {...register('email')} />

// Patients, dashboards, modals — no reserved slot
<Input error={errors.name?.message} {...register('name')} />
```

`FieldErrorSlot` defaults to `reserveSpace={false}`. Auth layout scrolling rules below are unchanged.

`AuthLayout` uses a fixed viewport height (`h-screen overflow-hidden`):

- **Left panel** (illustration): fixed, never scrolls
- **Right panel** (form): `overflow-y-auto` only on the form side
- **Max widths**: keep `max-w-[440px]` (left) and `max-w-[420px]` (right) unchanged
- **Authentication header**: always keep the "Authentication" section label on auth pages

---

## 8. Modals and Floating Panels (Select, DatePicker, etc.)

Forms inside modals often use portaled dropdowns and pickers. Follow these rules so controls remain usable.

### Modal layout

| Rule | Detail |
|------|--------|
| Max height | Modal shell: `max-h-[95vh]`, `flex flex-col`, `overflow-hidden` |
| Scroll | `Modal.Body`: `flex-1 overflow-y-auto` — long forms scroll inside the dialog, not the page |
| Error spacing | Do **not** use `reserveErrorSpace` in modals; use `space-y-4` between fields and show errors only when present (see §7) |

### Portaled panels (z-index + interaction)

| Rule | Detail |
|------|--------|
| Z-index | Portaled Select / MultiSelect / DatePicker / TimePicker / Dropdown panels use `FLOATING_PANEL_Z_CLASS` (`z-[450]`) — above modal overlay (300) and modal content (400) |
| Portal target | Keep panels on `document.body`, not inside `overflow-hidden` modal body |
| Click-outside | `useClickOutside` must receive **both** `triggerRef` and `panelRef`. A trigger-only listener closes the panel on the first click inside the portaled menu (gender, allergies, calendar month nav all fail) |
| Data attribute | Portaled panels set `data-floating-panel` via `FLOATING_PANEL_DATA_ATTR` for dismiss / modal helpers |

### Implementation

```tsx
// Correct — dismiss only when click is outside trigger AND panel
useClickOutside([triggerRef, panelRef], () => setOpen(false), open);

// Wrong — panel closes immediately on any panel click
useClickOutside(triggerRef, () => setOpen(false), open);
```

### Viewport-aware placement

| Rule | Detail |
|------|--------|
| Flip | If space below trigger is too small, open panel **above** the trigger |
| Max height | Set `maxHeight` from available viewport space (not a fixed `max-h-60`) |
| Clamp | Keep panel within viewport with `FLOATING_PANEL_VIEWPORT_PADDING` (12px) |
| Style helper | Use `getFloatingPanelStyle(position)` from `floating-panel.ts` |

See `docs/plans/reusable-ui-components/plan.md` §9.11–§9.15 for full history and fixes.
