# MDCAT LMS — Authentication UI: Behavior Spec & Fix Checklist

**Audience:** Claude Code (or any engineer) working on the authentication screens of the MDCAT LMS frontend (React + Vite).
**Purpose:** This is both (a) a precise spec of how every auth page must look and behave in **mobile and desktop** views, and (b) an ordered checklist of the concrete issues to resolve. Scope is **UI/UX behavior only** — do not change API endpoints, request payloads, field names, role logic, or routing.

---

## 0. Your task

Audit and bring **all authentication pages** into line with the behavior described below, in **both mobile and desktop** layouts and in **both light and dark themes**. Work page-by-page and view-by-view. For every change, confirm it against the Acceptance Criteria in Section 10. Prefer CSS + small markup adjustments; do not introduce new dependencies and do not touch backend, network, or auth business logic.

**Golden rule:** a returning user should experience the login form as calm and stable — text is *fully and smoothly visible* the instant they focus a field, does not change appearance as they type, the cursor is clearly visible and a consistent height, and saved-account autofill works the way the browser normally offers it. Nothing should "jump," thicken, shrink, or shift.

---

## 1. Pages in scope

| Page | Route | Field pattern | Has a form? | Autofill intent |
|------|-------|---------------|-------------|-----------------|
| **Login** | `/login` | Floating-label (icon + floating label + inline Show toggle) | Yes — email + password + Google | **Allow** browser autofill & saved-account chooser |
| **Set Password** | `/set-password` | Floating-label (same as Login) | Yes — new password + confirm | **Suppress** autofill (creating a *new* password) |
| **Register** | `/register` | Plain `.auth-field` (label text above input) | Yes — name, email, password (+ role, subjects) | **Suppress** autofill (new account) |
| **Forgot Password** | `/forgot-password` | — | No (static message; email OTP disabled) | n/a |
| **Verify Email** | `/verify-email` | — | No (static message; email OTP disabled) | n/a |

**Two distinct input patterns exist — treat them separately:**

- **Floating-label field** (`Login`, `SetPassword`): a rounded container holds an SVG icon, a label that floats, the input, and (for passwords) an inline "Show/Hide" button and a validity dot. On desktop the label is absolutely positioned and floats up when filled/focused; on mobile the label becomes a static block *above* the input.
- **Plain field** (`Register`): a `<label>` with a `<span>` caption sitting above a normal input. No floating behavior, no icon.

A change to the floating-label field affects **both Login and SetPassword** — verify both.

---

## 2. Global design principles (professional behavior)

These apply to every field on every auth page, in every view and theme:

1. **No visual jump between states.** Font family, font size, font weight, letter spacing, and input height **must be identical** across empty, placeholder-shown, focused, typing, autofilled, and valid states. The *only* things allowed to change are: border color, focus ring, label color/position, icon color, and text *color* (muted placeholder → solid entered text). Weight/size/family must never change.
2. **The cursor (caret) is always clearly visible and a consistent height** from the very first character to the last, in both views. It uses the brand accent color so it is visible on the dark field background.
3. **Zero layout shift.** Focusing, typing, autofilling, showing a password, or a field becoming valid must not move surrounding elements or resize the field.
4. **Theme parity.** Light and dark themes must both satisfy this spec. Autofilled values must not paint a jarring browser-yellow background — they should match the field's own background and text styling.
5. **Mobile ergonomics.** Inputs use a font-size of **at least 16px** on mobile to prevent iOS from auto-zooming on focus. Interactive targets (inputs, Show/Hide, role buttons, submit) are **at least ~44px** tall/tappable. No horizontal scrolling at 320–430px widths.
6. **Accessibility.** Every input has an associated label; focus states are visible (focus-visible ring); contrast meets WCAG AA; the Show/Hide toggle and role buttons are real `<button>`s with clear pressed/active states.
7. **Motion is subtle** and respects `prefers-reduced-motion`.

---

## 3. Field state model (the core spec)

For a single text/password input, the intended rendering per state:

- **Empty (placeholder shown):** placeholder text is muted (lower-contrast) but fully legible and not blurred; label is in its resting position (floated up on desktop, static above on mobile); icon in resting color; border in resting color. Weight/size = the shared baseline.
- **Hover:** border subtly brightens. Nothing else changes.
- **Focus:** border switches to the accent color and a soft focus ring appears; label + icon shift to the active accent color; caret is visible at full line height at the caret position. No change to text metrics.
- **Typing / filled:** entered text is solid, full-contrast, and the **same weight/size** as the placeholder was — only the color goes from muted to solid. Absolutely no bold-ening.
- **Autofilled (browser):** looks identical to manually typed text (same background, color, weight, size). No yellow/blue browser overlay.
- **Valid:** optional validity affordance (e.g., accent dot) may appear without shifting layout; text metrics unchanged.
- **Invalid / error:** if/when shown, use a clear error color on border/message; still no metric changes.
- **Disabled / loading (submit in progress):** the primary button shows a loading label and is disabled; inputs remain visually stable.

---

## 4. Caret (text cursor) behavior — includes the known fix

**Required behavior:** the caret is a clearly visible vertical bar in the brand accent color, and its **height is consistent** whether the field is empty, at the first character, or full of text — in both mobile and desktop.

**Known root cause (mobile):** the floating-label input was given a tall fixed height while its text line was much shorter and vertically centered. When empty, mobile browsers drew the caret at the *font* height (short); once text existed, the caret used the taller *line-height*, so the cursor appeared to "grow" from tiny-at-start to normal. 

**Required fix (mobile floating-label input):** make the input's `height` and `line-height` equal (one consistent line box, e.g. a fixed line height in px that matches the input height), with the surrounding container providing vertical padding for a comfortable tap target. This forces the caret to fill the same single line in every state. Keep an explicit, visible `caret-color` (brand accent).

**Caveat to record, not to hack around:** the caret's exact pixel rendering is ultimately the browser/OS's call. The spec's job is to remove the *height inconsistency* (fixed above) and guarantee color/visibility. Do **not** reintroduce JS hacks to force caret size.

---

## 5. Autofill & password-manager behavior — read carefully

There are **two opposite intents**, and they must not be confused:

### 5a. Sign-in form (Login) — ALLOW autofill + saved-account chooser
- Email input: `type="email"`, `autocomplete="username"`. Password input: `type="password"`, `autocomplete="current-password"`. Both live inside a real `<form autocomplete="on">`.
- **Do not** apply `readonly`, `disabled`, or "readonly-until-interaction" tricks to these fields — those block the browser's saved-account dropdown (this was a real bug: the password field showed saved accounts but the email field did not, because a `readOnly` toggle suppressed it on the email field). The email field must be as autofill-eligible as the password field.
- Autofilled values must be styled identically to typed values (Section 3).
- **Expected, correct behavior — not a bug:** the browser may *pre-fill* the fields on page load and may or may not show a dropdown on click. Whether it pre-fills vs. offers a chooser is governed by the user's browser/OS password-manager settings, **not** by the site. The site's only responsibility is to send the correct signals above and never block them. Do not add code that tries to force fields empty on load — that path is exactly what breaks the chooser.

### 5b. New-credential forms (SetPassword, Register) — SUPPRESS autofill
- These create a *new* password, so the browser must **not** fill an existing one. Keep `autocomplete="new-password"`, and the existing suppression signals (`data-lpignore`, `data-form-type="other"`, and the readonly-until-focus behavior on SetPassword) **as-is**.
- **Do not "fix" these by enabling autofill.** The readonly-until-focus pattern is *correct here* even though the identical-looking pattern was *wrong* on Login. Judge by intent: sign-in = allow; set/create = suppress.

---

## 6. Mobile view spec (≤ 640px)

- The dark brand/marketing panel collapses; a compact brand header / "MDCAT Prep" stat bar is shown instead. The form panel takes the full width with comfortable side padding and no horizontal overflow.
- Floating-label fields switch the label to a **static block above** the input. The input sits below it as a single clean line with a consistent-height caret (Section 4). The icon stays vertically aligned with the input; the password "Show/Hide" button stays pinned on the right and does not overlap typed text.
- Role switcher (Login/Register) uses its mobile variant and remains easily tappable.
- Inputs: font-size ≥ 16px; tap target ≥ ~44px including container padding.
- Buttons (submit, Google, role, Show/Hide) are full-width or large enough to tap accurately; text is centered and never clipped.
- Verify at 320px, 360px, 390px, and 430px widths.

---

## 7. Desktop view spec (≥ ~641px / two-panel breakpoint)

- Two-panel `auth-shell`: left = dark brand panel (grid texture, brand mark, headline, role switcher / registration steps); right = form panel with a centered card of constrained max-width.
- Floating labels sit inside the field and float to the top-left when the field is focused or filled; icon and label recolor to the accent on focus/fill.
- Hover brightens the border; focus shows the accent border + soft ring. All transitions subtle.
- Password fields show the inline "Show/Hide" toggle aligned right, never overlapping text.
- Confirm the same no-jump / consistent-caret rules hold on desktop (they were most visible on mobile but must be correct here too).

---

## 8. Per-page details

**Login (`/login`)** — Role switcher (Student / Teacher / Admin) that adjusts the accent and the `role` query param. Email + password floating-label fields; password has Show/Hide. "Remember this device" checkbox + "Forgot password" link. Primary "Sign In" button (shows "Signing in…" while loading). Google sign-in block. Footer link to Register. Autofill = **allow** (5a).

**Set Password (`/set-password`)** — Reached after Google onboarding. Two floating-label password fields: "New Password" and "Confirm Password", each with Show/Hide. Client validation: ≥ 6 characters and both must match; primary button disabled until valid; shows "Saving…" while submitting. Autofill = **suppress** (5b) — keep existing suppression.

**Register (`/register`)** — Plain `.auth-field` inputs: First name, Last name, Email, Password (min 6). Role select + mobile role switcher (Student / Teacher). Teachers pick assigned subjects via chips; at least one required. Student path may show Google sign-up. Submits to create account (student) or request access (teacher, shows pending message). Autofill = **suppress** (5b). Apply the same no-jump text and visible-caret principles to `.auth-field` inputs; ensure ≥16px font and adequate tap targets on mobile.

**Forgot Password (`/forgot-password`) & Verify Email (`/verify-email`)** — Currently static informational cards (email OTP disabled; direct users to Google). No form fields. Just ensure the card, text, and "Back to login" link are centered, readable, and responsive in both views and themes. Do not add form inputs unless the OTP flow is being re-enabled (out of scope here).

---

## 9. Fix checklist (ordered, actionable)

Do these in order. Each item lists the symptom, the required behavior, and how to prove it fixed.

1. **Remove the text-weight jump on floating-label inputs (Login + SetPassword).**
   - Symptom: entered/typed text renders heavier (bolder) than the placeholder/empty state, so text "thickens" when you type.
   - Required: one shared font-weight across empty, placeholder, typing, autofilled, and valid states, in both themes.
   - Prove: type into email and password on Login (light + dark) — weight is visually identical before and after typing; autofilled text matches too.

2. **Fix the mobile caret height (Login + SetPassword).**
   - Symptom: cursor is very short at the start of an empty field, then grows to normal as you type.
   - Required: consistent caret height from the first character onward (equal input height/line-height per Section 4); caret uses the visible accent color.
   - Prove: on a phone (or device emulation), tap an empty email field — the caret is already full height; it does not change as you type.

3. **Login email field must offer the saved-account chooser, like the password field.**
   - Symptom: clicking the email field showed no saved accounts while the password field did.
   - Required: no `readonly`/`disabled`/readonly-until-interaction on Login's email or password; correct `username` / `current-password` autocomplete; fields inside the `<form>`.
   - Prove: in a browser profile that has saved credentials, load Login, clear the email field, focus it → the browser offers the saved account(s), same as the password field.

4. **Do NOT regress the new-password suppression (SetPassword + Register).**
   - Required: keep `new-password`, `data-lpignore`, `data-form-type="other"`, and SetPassword's readonly-until-focus. These are correct here.
   - Prove: on SetPassword, the browser does not auto-insert an existing saved password into the "New Password" field.

5. **Placeholder → typed transition is color-only.**
   - Required: placeholder is muted but legible (not blurred into illegibility); entered text becomes solid/full-contrast at the same weight/size. No blur artifacts.
   - Prove: compare placeholder vs typed — only contrast/color differs.

6. **Autofill styling parity.**
   - Required: autofilled inputs match the field's own background and text styling (no browser-yellow, correct dark-theme colors).
   - Prove: trigger autofill on Login in dark theme — background and text look native to the design.

7. **No layout shift.**
   - Required: focusing, typing, autofilling, toggling Show/Hide, and validity affordances do not move or resize anything.
   - Prove: record/observe the field while interacting — surrounding elements stay put.

8. **Both-view, both-theme consistency pass.**
   - Required: everything above holds on mobile and desktop, light and dark, across Login, SetPassword, and Register.

---

## 10. Acceptance criteria (QA matrix)

Verify each page in **{mobile, desktop} × {light, dark}**:

- [ ] Placeholder is legible; entered text is the **same weight and size** as the placeholder (only color changes).
- [ ] Caret is visible (accent color) and a **consistent height** from the first character to the last.
- [ ] No element shifts or resizes on focus, typing, autofill, Show/Hide, or validity change.
- [ ] **Login only:** with saved credentials present, the **email** field offers the saved-account chooser (parity with the password field); autofilled text is styled identically to typed text.
- [ ] **SetPassword / Register only:** the browser does **not** fill an existing password; suppression signals intact.
- [ ] Mobile inputs are ≥16px font (no iOS zoom on focus); tap targets ≥ ~44px; no horizontal scroll at 320–430px.
- [ ] Password "Show/Hide" toggle and validity dot never overlap the text.
- [ ] Light and dark themes both pass; autofill has no browser-yellow background.
- [ ] Static pages (Forgot / Verify) are centered, readable, and responsive.

---

## 11. Out of scope / do not change

- Do not modify API endpoints, request/response shapes, field names, `role` logic, routing, or Google sign-in wiring.
- Do not remove or weaken the **new-password autofill suppression** on SetPassword/Register (Section 5b).
- Do not add JS that forces fields empty on load or that manipulates `readonly` on the **Login** fields (Section 5a).
- Do not add new dependencies. Keep changes to styling and minimal markup.

**One implementation caution (UI CSS):** the same visual property for these inputs may be declared in more than one stylesheet and enforced with `!important`. When you change a property (e.g. font-weight, caret, font-size), search **all** relevant CSS for that property across every state selector (`:placeholder-shown`, `:not(:placeholder-shown)`, `--filled`, `--valid`, `:-webkit-autofill`, focus, hover, and any per-theme override blocks) and make them agree — otherwise a single edit can be silently overridden and appear to "do nothing."
