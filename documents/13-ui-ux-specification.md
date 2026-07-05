# ITBengal Hosting Platform - UI/UX Specification

This document provides a production-grade, highly detailed UI/UX specification for the ITBengal hosting platform. It serves as the single source of truth for frontend developers, UI designers, and QA engineers building the ITBengal customer and administrative portals.

---

## 1. Design System & Style Guide

The ITBengal design system is optimized for performance, high contrast, and minimal visual noise, heavily inspired by modern interfaces like Vercel and GitHub. The system uses a strict layout grid, predefined token scales, and a dark/light mode engine driven by CSS variables.

### 1.1 Color Tokens (Functional CSS Variables)

All color tokens are defined using HSL values, allowing for direct transparency overrides (e.g., `hsla(var(--accent-primary), 0.1)`).

```css
:root {
  /* Light Mode Tokens */
  --bg-primary: 0 0% 100%;            /* Pure White: #FFFFFF */
  --bg-secondary: 240 4.8% 95.9%;      /* Off-White: #F4F4F5 */
  --bg-tertiary: 240 5.9% 90%;         /* Light Gray: #E4E4E7 */
  --border-normal: 240 5.9% 85%;       /* Border base: #D4D4D8 */
  --border-muted: 240 5.9% 93%;        /* Subtle separator: #EFEFEF */
  --border-active: 240 5.9% 10%;       /* Active borders: #18181B */
  --text-primary: 240 10% 3.9%;        /* Near Black: #09090B */
  --text-secondary: 240 3.8% 46.1%;    /* Slate Gray: #71717A */
  --text-muted: 240 4.8% 65%;          /* Light Slate: #A1A1AA */
  --accent-primary: 262.1 83.3% 57.8%; /* ITBengal Violet: #7C3AED */
  --accent-hover: 262.1 83.3% 47.8%;   /* Darker Violet: #6D28D9 */
  --accent-active: 262.1 83.3% 37.8%;  /* Deep Violet: #5B21B6 */
  --accent-glow: hsla(262.1, 83.3%, 57.8%, 0.15);
  --success: 142.1 76.2% 36.3%;        /* Emerald Green: #16A34A */
  --success-bg: 142.1 76.2% 95%;       /* Light Green: #F0FDF4 */
  --error: 346.8 84.1% 50.2%;          /* Ruby Red: #DC2626 */
  --error-bg: 346.8 84.1% 97%;         /* Light Red: #FEF2F2 */
  --warning: 37.9 92.1% 50.2%;         /* Amber Orange: #D97706 */
  --warning-bg: 37.9 92.1% 96%;        /* Light Orange: #FEF3C7 */
  --info: 199.1 88.7% 48.4%;           /* Cyan Blue: #0284C7 */
  --info-bg: 199.1 88.7% 95%;          /* Light Blue: #F0F9FF */
}

.dark-theme {
  /* Dark Mode Tokens */
  --bg-primary: 240 10% 3.9%;          /* Deep Jet Black: #09090B */
  --bg-secondary: 240 10% 6%;          /* Charcoal: #0F0F11 */
  --bg-tertiary: 240 3.7% 15.9%;       /* Medium Gray: #27272A */
  --border-normal: 240 3.7% 15.9%;     /* Charcoal border: #27272A */
  --border-muted: 240 3.7% 10%;        /* Dark separator: #1A1A1D */
  --border-active: 240 5% 90%;         /* Bright active border: #E4E4E7 */
  --text-primary: 0 0% 98%;            /* Near White: #FAFAFA */
  --text-secondary: 240 5% 64.9%;      /* Muted gray: #A1A1AA */
  --text-muted: 240 3.7% 35%;          /* Dark gray text: #52525B */
  --accent-primary: 263.4 70% 50.4%;   /* Bright Violet: #8B5CF6 */
  --accent-hover: 263.4 70% 60.4%;     /* Lighter Violet: #A78BFA */
  --accent-active: 263.4 70% 70.4%;    /* Pale Violet: #C084FC */
  --accent-glow: hsla(263.4, 70%, 50.4%, 0.25);
  --success: 142.1 70.6% 45.3%;        /* Neon Emerald: #10B981 */
  --success-bg: 142.1 70.6% 8%;        /* Dark green background: #062312 */
  --error: 346.8 77.2% 49.8%;          /* Crimson: #EF4444 */
  --error-bg: 346.8 77.2% 8%;          /* Dark red background: #260505 */
  --warning: 37.9 92.1% 50.2%;         /* Vivid Amber: #F59E0B */
  --warning-bg: 37.9 92.1% 8%;         /* Dark amber background: #261502 */
  --info: 199.1 88.7% 48.4%;           /* Cyan: #0EA5E9 */
  --info-bg: 199.1 88.7% 8%;           /* Dark cyan background: #021C26 */
}
```

### 1.2 Typography & Hierarchy

- **Primary Font Family:** `Geist Sans`, `Inter`, sans-serif.
- **Monospace Font Family:** `Geist Mono`, Monaco, monospace.
- **Hierarchy Scale:**
  - `h1`: `1.875rem` (30px), Weight: `700`, Line Height: `2.25rem`, Letter Spacing: `-0.05em`.
  - `h2`: `1.5rem` (24px), Weight: `600`, Line Height: `1.875rem`, Letter Spacing: `-0.03em`.
  - `h3`: `1.25rem` (20px), Weight: `600`, Line Height: `1.625rem`, Letter Spacing: `-0.02em`.
  - `body`: `0.875rem` (14px), Weight: `400`, Line Height: `1.25rem`.
  - `small`: `0.75rem` (12px), Weight: `500`, Line Height: `1.0rem`.

### 1.3 Spacing System (4px Baseline Grid)
Spacing aligns strictly to a 4px grid: `4px` (space-1), `8px` (space-2), `12px` (space-3), `16px` (space-4), `24px` (space-6), `32px` (space-8).

### 1.4 Shadows & Border Radii
- **Box Shadows:** Low: `0 1px 3px rgba(0,0,0,0.05)`; Medium: `0 4px 6px -1px rgba(0,0,0,0.07)`; High: `0 20px 25px -5px rgba(0,0,0,0.1)`.
- **Border Radii:** `radius-sm` (4px - badges), `radius-md` (8px - inputs, buttons), `radius-lg` (12px - cards, modals).

---

## 2. Component Library Specification

### 2.1 Button
- **Props:** `variant` (primary, secondary, outline, ghost), `size` (sm, md, lg), `isLoading` (bool), `disabled` (bool).
- **Anatomy:** Inline flexbox: `height: 36px (md)`, `padding: 0 var(--space-4)`.
- **States:** Hover: accent-hover; Active: scale(0.98); Focus: custom ring offset.
- **Keyboard:** `Tab` moves focus; `Enter`/`Space` executes action.
- **React Code:**
```tsx
export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'md', children, ...props }) => (
  <button className={`btn btn-${variant} btn-${size}`} {...props}>{children}</button>
);
```

### 2.2 Input
- **Props:** `type` (text, password, email), `label` (string), `error` (string), `placeholder` (string), `disabled` (bool).
- **Anatomy:** Label stacked directly above input container.
- **States:** Focus sets border to accent-primary. Error triggers error border color.
- **Code:**
```tsx
export const Input: React.FC<InputProps> = ({ label, error, ...props }) => (
  <div className="input-group">
    {label && <label>{label}</label>}
    <input className={error ? 'error' : ''} {...props} />
  </div>
);
```

### 2.3 Select
- **Props:** `options` (array of {label, value}), `value` (string), `onChange` (func).
- **Anatomy:** Selection trigger button with dropdown overlay popup menu.
- **Keyboard:** Arrow keys navigate list. Enter commits choice. Escape exits menu.
- **Code:**
```tsx
export const Select: React.FC<SelectProps> = ({ options, value, onChange }) => (
  <div className="select"><button type="button">{value}</button>
    <div className="dropdown">{options.map(opt => <div key={opt.value} onClick={() => onChange(opt.value)}>{opt.label}</div>)}</div>
  </div>
);
```

### 2.4 Modal
- **Props:** `isOpen` (bool), `onClose` (func), `title` (string).
- **Anatomy:** Fixed backdrop overlay blur `8px` containing centered card wrapper dialog.
- **Keyboard:** Tab loops focus inside modal. Esc closes.
- **Code:**
```tsx
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => isOpen ? (
  <div className="backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><h3>{title}</h3>{children}</div></div>
) : null;
```

### 2.5 Toast Notification
- **Props:** `type` (success, error, warning, info), `title` (string), `message` (string).
- **Anatomy:** Right-bottom anchor viewport block stacking notifications vertically.
- **Code:**
```tsx
export const Toast: React.FC<ToastProps> = ({ type, title }) => <div className={`toast toast-${type}`} role="alert"><strong>{title}</strong></div>;
```

### 2.6 Card
- **Props:** `isClickable` (bool), `variant` (outline, flat, interactive).
- **States:** Interactive variant adds border color swap and `translateY(-2px)` on hover.

### 2.7 Table
- **Props:** `columns` (array), `data` (array).
- **States:** Hovering rows adds subtle background change.

### 2.8 Badge
- **Props:** `variant` (success, error, warning, info, neutral), `text` (string).
- **Anatomy:** Pill element with compact horizontal padding and rounded corners.

### 2.9 Avatar
- **Props:** `src` (string), `name` (string).
- **Anatomy:** Circle layout falling back to initials on load failure.

### 2.10 Command Palette (Cmd+K)
- **Anatomy:** Backdrop filter overlay, center input bar, options list categories.
- **Keyboard:** `Cmd+K` toggles display. Arrow keys navigate. Escape closes.

---

## 3. Theme Engine & Accessibility Architecture

### 3.1 Theme Swapping Logic
- An inline blocking script checks local storage to prevent style flashes:
```javascript
(function() {
  const theme = localStorage.getItem('itbengal-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (theme === 'dark') document.documentElement.classList.add('dark-theme');
})();
```
- A toggle button switches root class classes and commits changes to cookies and local storage.

### 3.2 Accessibility Checklist
- **Contrast Check:** Functional color variables guarantee a 4.5:1 ratio for text copies.
- **Aria Live Regions:** Dynamic alert updates trigger browser notifications using announcer divs.
- **Focus visible:** Focus outline styles are set to outline indicator offsets by default.

### 3.3 Micro-Animations
- Transitions use: `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.
- Pulse loader animations run on building items continuously.

---

## 4. Customer Dashboard Wireframe Blueprints & Flows

### 4.1 Screen 1: Dashboard Home
```
+---------------------------------------------------------------+
| [ITB Logo] | Org: ITBengal Workspace [v]              | (Avt) |
+---------------------------------------------------------------+
| Welcome back, Rahman!                                         |
| Active Projects: 14 Active  | Bandwidth: 42.8 GB / 100 GB     |
| Recent Deployments:                                           |
| - my-react-app (Starter-1) -> [Successful]  12m ago           |
| [ Deploy React App ]  [ Install WordPress ]                   |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Main: `display: flex; gap: var(--space-6); padding: var(--space-6);`. Sidebar: `width: 260px; height: 100vh; flex-shrink: 0;`.
- **UI Copy:** `"Welcome back, Rahman!"`, `"Active Projects"`, `"Deploy React App"`, `"Install WordPress"`.
- **HTML DOM Structure:**
```html
<div class="dashboard-layout">
  <aside class="sidebar">...</aside>
  <main class="content-view">
    <header class="page-header">...</header>
    <section class="metrics-grid">...</section>
  </main>
</div>
```
- **Event Flow:**
  1. User clicks `"Deploy React App"`.
  2. Router rewrites screen targets to `/projects/deploy?type=react`.
  3. Dynamic wizard wizard screens map repositories configuration databases.

### 4.2 Screen 2: Projects Listing
```
+ Projects                               [ + Deploy New Project ]
| [ Search by name...   ] [ All Frameworks [v] ]                |
| - my-next-dashboard (Next.js) -> Active                       |
| - bangla-commerce-site (WordPress) -> Active                  |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Toolbar: `display: flex; justify-content: space-between; align-items: center; gap: var(--space-4);`.
- **UI Copy:** `"Projects"`, `"Search by name..."`, `"All Frameworks"`, `"+ Deploy New Project"`.
- **HTML DOM Structure:**
```html
<div class="projects-list-wrapper">
  <div class="toolbar-actions">...</div>
  <div class="projects-grid">...</div>
</div>
```
- **Event Flow:**
  1. User enters query query string variables in search field.
  2. Key listeners debounce and query database parameters records.
  3. Redraws listing grid dynamically, filtering unrelated cards.

### 4.3 Screen 3: React App Details - Deployments Tab
```
+ Deployments | Domains | Env Vars | Logs | Settings            |
| - Commit: "Update metadata title tags" -> [Success] 12m ago   |
| - Commit: "Install postcss compiler" -> [Failed] 2h ago       |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** List: `display: flex; flex-direction: column; gap: var(--space-4);`.
- **UI Copy:** `"Build History"`, `"Manual Deploy"`, `"Commit: Fix verification logic"`, `"Rollback"`.
- **HTML DOM Structure:**
```html
<div class="deployments-panel">
  <nav class="sub-tabs">...</nav>
  <div class="history-list">...</div>
</div>
```
- **Event Flow:**
  1. User clicks `"Rollback"` action button.
  2. Dialog modal requests rollback confirmation authentication keys.
  3. Confirming executes revert scripts payload, updating build lists.

### 4.4 Screen 4: React App Details - Domains Tab
```
+ [ app.domain.com              ] [ + Add Custom Domain ]       |
| - domain.com (ALIAS) -> proxy.itbengal.net [Verified SSL]     |
| - app.domain.com (A) -> 103.150.12.42 [Verify DNS]            |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Input row: `display: flex; gap: var(--space-4); margin-bottom: var(--space-6);`.
- **UI Copy:** `"Custom Domains"`, `"app.domain.com"`, `"+ Add Domain"`, `"Verify DNS status"`.
- **HTML DOM Structure:**
```html
<div class="domains-config-container">
  <form class="domain-form">...</form>
  <table class="mappings-table">...</table>
</div>
```
- **Event Flow:**
  1. User clicks `"Verify DNS"` tag button.
  2. Calls verification checker endpoint `/api/domains/verify`.
  3. Displays success check indicators status on validation.

### 4.5 Screen 5: React App Details - Environment Variables Tab
```
+ KEY: [ DATABASE_URL ] VALUE: [ postgresql://... ] [ + Add ]   |
| - DATABASE_URL (Prod, Dev) -> ••••••••••••••••••••• [Show]    |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Form grid: `display: grid; grid-template-columns: 1fr 2fr auto; gap: var(--space-3);`.
- **UI Copy:** `"Environment Variables"`, `"KEY"`, `"VALUE"`, `"Targets"`, `"Show"`, `"+ Add Variable"`.
- **HTML DOM Structure:**
```html
<div class="variables-manager">
  <form class="var-entry-form">...</form>
  <ul class="vars-list">...</ul>
</div>
```
- **Event Flow:**
  1. User clicks `"Show"` decrypt link actions.
  2. Verification modal requests passcode authorization validation checks.
  3. Decrypts runtime secrets variables text display on success.

### 4.6 Screen 6: React App Details - Logs Tab
```
+ [ Search logs... ] [ Level: All ] [ Pause WebSocket Stream ]  |
| 17:10:02 [INFO] Starting container processes...               |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Console Box: `background: #000000; height: 350px; overflow-y: auto; padding: var(--space-4);`.
- **UI Copy:** `"Runtime Container Logs"`, `"Level: All"`, `"Auto-scroll"`, `"Pause Stream"`, `"Download Logs"`.
- **HTML DOM Structure:**
```html
<div class="logs-console-wrapper">
  <div class="logs-header">...</div>
  <div class="terminal-body" id="logs-container">...</div>
</div>
```
- **Event Flow:**
  1. User clicks `"Pause WebSocket Stream"`.
  2. WebSockets receiver suspends UI console logs appending activities.
  3. Toggle selector changes active label to `"Resume Live Log Stream"`.

### 4.7 Screen 7: React App Details - Settings Tab
```
+ Danger Zone:                                                  |
| - Deactivate node   [ Pause Deployment ]                      |
| - Delete project    [ Delete Project ]                        |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Boundaries wrapper: `max-width: 800px; margin: 0 auto; display: flex; flex-direction: column;`.
- **UI Copy:** `"Build Settings"`, `"Danger Zone"`, `"Pause Project"`, `"Delete Project"`.
- **HTML DOM Structure:**
```html
<div class="project-settings-form">
  <section class="build-overrides">...</section>
  <section class="danger-zone-card">...</section>
</div>
```
- **Event Flow:**
  1. User clicks `"Delete Project"` warning button.
  2. Confirmation modal prompts user typing project name indicators.
  3. Submitting deletes container fleet integration variables setups.

### 4.8 Screen 8: WordPress Site Details - Overview Tab
```
+ SFTP Access: wp-node-3.itbengal.net | Port: 2222 | User: sftp |
| DB Access: localhost | DB Name: wp_db_214 | DB User: wp_user  |
| [ Download SSH Key ]                     [ Visit WP Admin ]   |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Container: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);`.
- **UI Copy:** `"SFTP & SSH Connection Details"`, `"wp-node-3.itbengal.net"`, `"Download SSH Key"`.
- **HTML DOM Structure:**
```html
<div class="wp-overview-grid">
  <div class="credentials-card">...</div>
  <div class="database-card">...</div>
</div>
```
- **Event Flow:**
  1. User clicks `"Visit WP Admin"`.
  2. Queries auth SSO token validator route `/api/wp/sso`.
  3. Redirects browser view target to WordPress login bypass screen.

### 4.9 Screen 9: WordPress Site Details - Backups Tab
```
+ Backups list:                                                 |
| - 2026-07-04 02:00 (Auto) -> 240 MB [Restore] [Download ZIP]  |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Grid Table: `width: 100%; border: 1px solid var(--border-normal);`.
- **UI Copy:** `"Backups"`, `"Create Manual Backup"`, `"Restore Backup"`, `"Download ZIP"`.
- **HTML DOM Structure:**
```html
<div class="backups-manager-wrapper">
  <div class="table-actions">...</div>
  <table class="backups-table">...</table>
</div>
```
- **Event Flow:**
  1. User clicks `"Restore Backup"` action link.
  2. Launches verification validation dialog check warning users of code reversions.
  3. Confirming runs database restore pipelines, blocking changes inputs.

### 4.10 Screen 10: WordPress Site Details - Staging Tab
```
+ Staging URL: https://staging-bangla.itbengal.link             |
| [ Push Staging to Production ]   [ Copy Production to Staging ]|
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Split Column layout: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);`.
- **UI Copy:** `"Staging Environment"`, `"Push Staging to Production"`, `"Clone Live to Staging"`.
- **HTML DOM Structure:**
```html
<div class="staging-sync-panel">
  <div class="sync-card push-card">...</div>
  <div class="sync-card pull-card">...</div>
</div>
```
- **Event Flow:**
  1. User clicks `"Push Staging to Production"`.
  2. Renders verification dialog overlay checklist options.
  3. Confirming runs dynamic merge pipelines, launching background worker status metrics.

### 4.11 Screen 11: WordPress Site Details - File Manager Tab
```
+ Path: /public_html/ [ Up One Level ] [ Create File ]          |
| - [Folder] wp-content  [Open] [Delete]                        |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Flex container: `display: flex; gap: var(--space-3); margin-bottom: var(--space-4);`.
- **UI Copy:** `"FileManager"`, `"Up One Level"`, `"Upload ZIP"`, `"CHMOD Permissions"`.
- **HTML DOM Structure:**
```html
<div class="file-manager-wrapper">
  <div class="file-toolbar">...</div>
  <table class="files-table">...</table>
</div>
```
- **Event Flow:**
  1. User double clicks folder card elements.
  2. Queries directory explorer API route `/api/wp/files/list`.
  3. Redraws file tree structure displaying sub-level items.

### 4.12 Screen 12: WordPress Site Details - Database Manager Tab
```
+ SQL Command: [ SELECT * FROM wp_users; ]                      |
| [ Execute Statement ]                                         |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Text area console box: `width: 100%; height: 120px; font-family: var(--font-mono);`.
- **UI Copy:** `"Database Manager"`, `"Run SQL Statement"`, `"Execute Query"`, `"Open phpMyAdmin"`.
- **HTML DOM Structure:**
```html
<div class="database-console-wrapper">
  <textarea class="sql-input">...</textarea>
  <div class="results-table-container">...</div>
</div>
```
- **Event Flow:**
  1. User enters SQL script blocks inside text field.
  2. Clicking execute posts scripts data to database API checker.
  3. Parses JSON records outputs into display grid matrices cells.

### 4.13 Screen 13: WordPress Site Details - Caching Tab
```
+ Proxy Caching: [ Purge Edge Cache ]                           |
| Object Caching: Status [ Active ] [ Disable Object Cache ]    |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Panel: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);`.
- **UI Copy:** `"Edge Caching"`, `"Purge All Cache"`, `"Object Cache (Redis)"`, `"Enabled"`.
- **HTML DOM Structure:**
```html
<div class="caching-config-wrapper">
  <div class="edge-cache-panel">...</div>
  <div class="object-cache-panel">...</div>
</div>
```
- **Event Flow:**
  1. User clicks `"Purge Edge Cache"`.
  2. Submits edge clear command signals payload to load balancer nodes.
  3. Edge proxies purge cache state parameters, firing success toast logs.

### 4.14 Screen 14: WordPress Site Details - Malware Scanner Tab
```
+ Last Scan: 2026-07-03 12:00 [ Run Scan Now ]                  |
| Scan Log: 4,212 files, 0 threats [View scan logs]             |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Layout flexbox: `display: flex; flex-direction: column; gap: var(--space-4);`.
- **UI Copy:** `"Malware Protection"`, `"Run Scan Now"`, `"Threats: Clean"`, `"View Scan Log"`.
- **HTML DOM Structure:**
```html
<div class="scanner-dashboard">
  <div class="scanner-header">...</div>
  <table class="scan-history-table">...</table>
</div>
```
- **Event Flow:**
  1. User clicks `"Run Scan Now"`.
  2. Disables scanner action buttons, showing progress loading bars.
  3. Updates database files list status on scan task completion.

### 4.15 Screen 15: WordPress Site Details - Updates Tab
```
+ WP Version: WP 6.5.3 (Latest)                                 |
| - [x] WooCommerce (Current v8.8.0 -> New v8.9.1)              |
| [ Upgrade Selected ]                                          |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Container bounds: `max-width: 800px; margin: 0 auto; display: flex; flex-direction: column;`.
- **UI Copy:** `"Core & Plugin Updates"`, `"WooCommerce"`, `"Apply Upgrades"`, `"Auto-updates"`.
- **HTML DOM Structure:**
```html
<div class="wp-updates-form">
  <div class="core-status">...</div>
  <ul class="plugins-list">...</ul>
</div>
```
- **Event Flow:**
  1. User checks WooCommerce update option checkbox.
  2. Clicks update button calling command installer script `/api/wp/updates/run`.
  3. Shows console shell installations output streams, verifying success.

### 4.16 Screen 16: Domains Registry - Availability Search & Purchase
```
+ Domain search: [ domain-name.com ] [ Search Availability ]    |
| Results: domain-name.com (Available) -> BDT 1,200/yr [ Add ]  |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Search grid: `display: grid; grid-template-columns: 8fr 2fr; gap: var(--space-3);`.
- **UI Copy:** `"Find a domain"`, `"Search Availability"`, `"BDT 1,200/yr"`, `"Add to Cart"`.
- **HTML DOM Structure:**
```html
<div class="domain-search-panel">
  <div class="search-bar-row">...</div>
  <div class="results-container">...</div>
</div>
```
- **Event Flow:**
  1. User inputs query domain name keywords.
  2. Clicks search calling Openprovider API availability checker.
  3. Renders domain options price list results cards.

### 4.17 Screen 17: Domains Registry - Domain Transfer
```
+ Domain: [ domain-to-transfer.com ]                            |
| Auth Key: [ EPP-Authentication-Key-1234 ]                     |
| [ Verify Domain Eligibility ]                                 |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Bounds wrapper: `max-width: 700px; display: flex; flex-direction: column;`.
- **UI Copy:** `"Transfer Registrar"`, `"Authorization EPP Code"`, `"Verify Eligibility"`.
- **HTML DOM Structure:**
```html
<div class="domain-transfer-form">
  <div class="form-row">...</div>
  <div class="eligibility-checklist">...</div>
</div>
```
- **Event Flow:**
  1. User fills Domain name and auth EPP keys parameters.
  2. Clicks verify queries Openprovider status checks.
  3. Displays checkout billing links on successful authorization status checks.

### 4.18 Screen 18: Domains Registry - DNS Management
```
+ [ Type: A ] [ Host: www ] [ Value: 103.150.12.42 ] [ + Add ]  |
| - A   | @   | 103.150.12.42      | [Edit] [Delete]            |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Table Grid: `width: 100%; border: 1px solid var(--border-normal);`.
- **UI Copy:** `"DNS Zone Records"`, `"Type"`, `"Host"`, `"Value"`, `"+ Add Record"`, `"Delete"`.
- **HTML DOM Structure:**
```html
<div class="dns-zone-wrapper">
  <table class="dns-records-table">...</table>
  <form class="inline-record-form">...</form>
</div>
```
- **Event Flow:**
  1. User fills DNS inputs row parameters.
  2. Clicks add record button, saving settings parameters configurations.
  3. Appends new record data row inside tables list instantly.

### 4.19 Screen 19: Billing - Subscriptions
```
+ Subscriptions:                                                |
| - my-next-dashboard (React Starter) -> BDT 450/mo [Upgrade]   |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Main container limits: `max-width: 1000px; margin: 0 auto;`.
- **UI Copy:** `"Active Subscriptions"`, `"Cost"`, `"Renewal Date"`, `"Change Plan"`, `"Cancel Plan"`.
- **HTML DOM Structure:**
```html
<div class="subscriptions-manager">
  <div class="active-plans-list">...</div>
  <div class="upgrade-modal-anchor">...</div>
</div>
```
- **Event Flow:**
  1. User clicks `"Upgrade"` option actions link.
  2. Opens billing catalogs dialog displaying packages choices.
  3. Selecting upgrade shifts route location to invoice payments pages.

### 4.20 Screen 20: Billing - Invoices History
```
+ Invoice ID | Date       | Description     | Amount | Action   |
| #INV-0412  | 2026-07-01 | React Starter   | BDT 450| [Download|
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Align margins: `max-width: 1100px; margin: 0 auto; width: 100%;`.
- **UI Copy:** `"Invoice History"`, `"Invoice Date"`, `"Paid"`, `"Unpaid"`, `"Download PDF"`, `"Pay Now"`.
- **HTML DOM Structure:**
```html
<div class="invoices-history-panel">
  <table class="invoices-list-table">...</table>
</div>
```
- **Event Flow:**
  1. User clicks `"Download"` action links details.
  2. Calls proxy export API converter `/api/invoices/:id/pdf`.
  3. Initiates file stream downloads inside local browser storage.

### 4.21 Screen 21: Billing - Resource Usage Analytics
```
+ React Host Bandwidth:  [============------------] 42.8 GB/100 GB|
| WP Database Storage:   [====--------------------] 412 MB/2.0 GB |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Metrics flex split: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);`.
- **UI Copy:** `"Plan Resource Utilization"`, `"Bandwidth"`, `"Build Minutes"`, `"Storage"`.
- **HTML DOM Structure:**
```html
<div class="resource-usage-dashboard">
  <div class="usage-charts-grid">...</div>
</div>
```
- **Event Flow:**
  1. User hovers over bandwidth visualization graph indicators.
  2. Hover listener triggers rendering details popup tooltip.
  3. Displays detailed daily resource consumption breakdown records.

---

## 5. Admin Dashboard Wireframe Blueprints & Flows

### 5.1 Screen 1: Admin Main Dashboard
```
+---------------------------------------------------------------+
| [ITB ADMIN] | [Search Admin Console...] | Status: [Healthy]   |
+---------------------------------------------------------------+
| MRR: BDT 842,500.00 | Users: 1,412 | Containers: 2,890        |
| [ Settle Support Queue ]          [ Manage Server Clusters ]  |
+---------------------------------------------------------------+
```
- **Layout Grid CSS:** Grid elements: `display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);`.
- **UI Copy:** `"Global Admin Overview"`, `"MRR: BDT 842.5K"`, `"Resolve Support Queue"`.
- **HTML DOM Structure:**
```html
<div class="admin-dashboard-root">
  <header class="admin-header">...</header>
  <div class="admin-content-grid">...</div>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Resolve Support Queue"`.
  2. Path rewrites target browser location route to `/admin/tickets`.
  3. Inbox workspaces container hydrates with open queue threads list.

### 5.2 Screen 2: Customer Management Explorer
```
+-----------------------------------------------------------------------------------------------+
| Customer Accounts Explorer                                                                    |
| [ Search by email or name...     ] [ Status: All [v] ] [ Plan: All [v] ]                      |
| +-------------------------------------------------------------------------------------------+ |
| | USERNAME / EMAIL     | ACTIVE APPS | BILLING STATUS | SYSTEM STATE | ACTIONS              | |
| |----------------------+-------------+----------------+--------------+----------------------| |
| | rahman@itbengal.net  | 4 Apps      | Active AutoPay | [Verified]   | [Edit Customer Rec]  | |
| +-------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
```
- **Layout Grid CSS:** Flex stack: `display: flex; flex-direction: column; gap: var(--space-4);`.
- **UI Copy:** `"Search Customer Accounts"`, `"Status"`, `"Verify User"`, `"Suspend Account"`.
- **HTML DOM Structure:**
```html
<div class="customer-explorer">
  <div class="filter-header">...</div>
  <table class="customers-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Suspend User"` action links details.
  2. Opens verification dialog drawer checklist options settings.
  3. Submitting updates user status configuration variables logs.

### 5.3 Screen 3: Order Details
```
+-----------------------------------------------------------------------------------------------+
| Order details: #ORD-94122                                                                     |
| User Account: Rahman (rahman@itbengal.net)                                                    |
| +-------------------------------------------------------------------------------------------+ |
| | DESCRIPTION                           | UNIT COST    | QUANTITY | ITEM TOTAL              | |
| |---------------------------------------+--------------+----------+-------------------------| |
| | WordPress hosting - Starter Plan      | BDT 450.00   | 1        | BDT 450.00              | |
| +-------------------------------------------------------------------------------------------+ |
| [ Refund Order ]                                                     [ Manual Force Approve ] |
+-----------------------------------------------------------------------------------------------+
```
- **Layout Grid CSS:** Align card boundaries: `max-width: 900px; margin: 0 auto;`.
- **UI Copy:** `"Order details"`, `"Payment Status: Paid"`, `"Refund Order"`, `"Force Approve"`.
- **HTML DOM Structure:**
```html
<div class="order-details-card">
  <header class="order-header">...</header>
  <table class="order-items-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Refund Order"` danger options button.
  2. Prompts refund confirmation API checks credentials.
  3. Releases transaction refunds payload variables, changing status.

### 5.4 Screen 4: Payment Processing Logs
```
+ Logs:                                                         |
| - 17:12:02 | bKash | BKASH941021 | BDT 1,650 | Success [View] |
+---------------------------------------------------------------+
- **Layout Grid CSS:** Table layout width: `width: 100%; border: 1px solid var(--border-normal);`.
- **UI Copy:** `"Gateway logs"`, `"bKash"`, `"Stripe"`, `"Transaction ID"`, `"Failed attempts"`.
- **HTML DOM Structure:**
```html
<div class="payment-logs-viewer">
  <table class="gateway-transactions-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"View"` payload JSON logs action.
  2. Opens overlay box rendering API connection details log strings.
  3. Escape button close details console viewer.

### 5.5 Screen 5: Hosting Server Fleets Health & Node Utilization
```
+-----------------------------------------------------------------------------------------------+
| Hosting Cluster fleet status node allocations                                                 |
| Node-1 (react-node-1)      [ Active ]                                                         |
| CPU Core Load:  [====----------------] 20%                                                    |
| Memory Usage:   [======--------------] 32%                                                    |
| [ Drain active traffic ]  [ Diagnostics]                                                      |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Fleets grid split: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);`.
- **UI Copy:** `"Server Node Cluster"`, `"CPU Load"`, `"Memory Load"`, `"Drain Active Traffic"`.
- **HTML DOM Structure:**
```html
<div class="servers-health-grid">
  <div class="node-health-card">...</div>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Drain Node-1 Traffic"`.
  2. Changes node config state to draining, blocking allocations.
  3. Re-routes container targets scheduler off drained node.

### 5.6 Screen 6: Active Deployments Monitoring Queue
```
+ Active Builds:                                                |
| - #DEP-9041 | my-next-dashboard | main | DockerBuild | [Abort]|
+---------------------------------------------------------------+
- **Layout Grid CSS:** Table structure container: `width: 100%; border: 1px solid var(--border-normal);`.
- **UI Copy:** `"Build Queue status"`, `"Building: Next-App"`, `"Elapsed Time"`, `"Abort Build"`.
- **HTML DOM Structure:**
```html
<div class="deployments-monitoring-panel">
  <table class="build-queue-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Abort"` button next to build queues elements.
  2. Sends terminal signal command aborting worker container `/api/admin/deployments/:id/abort`.
  3. Halts active compilations process pipelines immediately.

### 5.7 Screen 7: Support Ticket Chat Threads
```
+ Tickets Inbox:                  | chat: DB Connection Error   |
| - #TK-1049 - DB Err (High) [Sel]| [Rahman] db connecting error|
| [ Submit reply ]  [ Close Ticket ]                            |
+---------------------------------+-----------------------------+
- **Layout Grid CSS:** Split Layout split: `display: grid; grid-template-columns: 320px 1fr;`.
- **UI Copy:** `"Tickets Workspace"`, `"High Priority"`, `"Open"`, `"Reply"`, `"Close Ticket"`.
- **HTML DOM Structure:**
```html
<div class="tickets-workspace-root">
  <div class="tickets-sidebar">...</div>
  <div class="chat-thread-container">...</div>
</div>
```
- **Event Flow:**
  1. Admin types response details inside inputs message box.
  2. Admin clicks `"Submit reply"` calling ticket responder API.
  3. Hydrates conversation chat stream instantly via WebSocket channels.

### 5.8 Screen 8: Coupons Configuration Configurator
```
+-----------------------------------------------------------------------------------------------+
| Discount Coupons configurations                                     [ + Create New Coupon ]   |
| +-------------------------------------------------------------------------------------------+ |
| | CODE       | DISCOUNT TYPE | VALUE        | USAGES     | STATUS     | ACTIONS             | |
| |------------+---------------+--------------+------------+------------+---------------------| |
| | BENGAL20   | Percentage    | 20%          | 142/500    | Active     | [Revoke Promotion]  | |
| +-------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Form boundaries layout: `display: flex; flex-direction: column; gap: var(--space-4);`.
- **UI Copy:** `"Coupon Promotion Manager"`, `"+ Add Promo"`, `"Value"`, `"Revoke Promo"`.
- **HTML DOM Structure:**
```html
<div class="coupons-manager-wrapper">
  <form class="create-coupon-form">...</form>
  <table class="active-coupons-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"+ Create Coupon"`.
  2. Form overlay registers discount code parameter setups.
  3. Commits new code data to billing records databases on submit.

### 5.9 Screen 9: Global System Settings
```
+-----------------------------------------------------------------------------------------------+
| Global systems configuration variables                                                        |
| API Username:   [ admin_itbengal                                    ]                         |
| API Token:      [ ••••••••••••••••••••••••••••••••••••••••••••••••• ] [Show credentials]      |
| [ Save Settings variables ]                                                                   |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Align settings bounds: `max-width: 800px; margin: 0 auto; display: flex; flex-direction: column;`.
- **UI Copy:** `"Global configurations"`, `"Openprovider API Key"`, `"SMTP settings"`, `"Save Settings"`.
- **HTML DOM Structure:**
```html
<div class="global-settings-form">
  <section class="api-integration">...</section>
  <button type="submit">...</button>
</div>
```
- **Event Flow:**
  1. Admin updates registrar API configurations values.
  2. Clicks save button calling system updater `/api/admin/settings/save`.
  3. Commits settings updates, showing save alerts toast notifications.

### 5.10 Screen 10: Admin Roles & Permissions
```
+-----------------------------------------------------------------------------------------------+
| Administrative permissions allocation                                                         |
| +-------------------------------------------------------------------------------------------+ |
| | OPERATOR ACCOUNT EMAIL   | ASSIGNED ROLE      | AUTHORIZATION STATE | ACTIONS             | |
| |--------------------------+--------------------+---------------------+---------------------| |
| | m.rahman@itb.net         | Super Admin        | Active              | [Edit Role] [Revk]  | |
| +-------------------------------------------------------------------------------------------+ |
| [ + Assign Administrator Access ]                                                             |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Table Layout limits: `width: 100%; border: 1px solid var(--border-normal);`.
- **UI Copy:** `"Administrative Roles"`, `"Super Admin"`, `"Billing Manager"`, `"Revoke Access"`.
- **HTML DOM Structure:**
```html
<div class="admin-permissions-manager">
  <table class="operators-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Revk"` role permissions link button.
  2. Opens verification authorization modal checks panel details.
  3. Confirms action, removing operator access authentication cookies variables.

### 5.11 Screen 11: React Server Node Management
```
+-----------------------------------------------------------------------------------------------+
| React Host Fleet Node Manager                                     [ + Register React Host IP ]|
| +-------------------------------------------------------------------------------------------+ |
| | HOST NODE NAME | CONTAINER IP BOUNDS | DOCKER CONFIG  | STATE      | ACTIONS              | |
| |----------------+--------------------+----------------+------------+----------------------| |
| | react-node-1   | 172.20.0.0/16      | v24.0.7        | Active     | [Tweak Allocations]  | |
| +-------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Container layout table width: `width: 100%; border-collapse: collapse;`.
- **UI Copy:** `"React Cluster Nodes"`, `"IP Allocation Range"`, `"Active Containers"`, `"Node Maintenance"`.
- **HTML DOM Structure:**
```html
<div class="react-fleet-manager">
  <table class="nodes-list-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Diagnostics"` checks link next to React nodes.
  2. Queries cluster health inspector daemon logs records.
  3. Displays latency and resource metrics graphs displays overlay.

### 5.12 Screen 12: WordPress Server Node Management
```
+ WP Server nodes:                                              |
| - wp-node-1 (10.10.10.12) -> Active [Configure Node]          |
+---------------------------------------------------------------+
- **Layout Grid CSS:** Flex listing container layout: `display: flex; flex-direction: column;`.
- **UI Copy:** `"Managed WP Server Fleet"`, `"Database Clusters"`, `"PHP pool limits"`.
- **HTML DOM Structure:**
```html
<div class="wordpress-fleet-manager">
  <table class="nodes-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Configure Node"` action options link.
  2. Drawer panel exposes PHP settings and MySQL allocation configurations.
  3. Submitting updates node configuration records, saving database tags.

### 5.13 Screen 13: Pricing Plans Configurator
```
+-----------------------------------------------------------------------------------------------+
| Pricing Plans Configurator                                                                    |
| React Starter tier                               WordPress Starter tier                       |
| Cost: BDT 450.00 / month                         Cost: BDT 500.00 / month                     |
| [ Edit plan catalog limits ]                     [ Edit plan catalog limits ]                 |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Plan panel grid: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);`.
- **UI Copy:** `"Pricing Plan Catalog"`, `"Starter plan limit config"`, `"RAM limit"`, `"Save changes"`.
- **HTML DOM Structure:**
```html
<div class="pricing-configurator">
  <div class="plans-grid">...</div>
</div>
```
- **Event Flow:**
  1. Admin modifies plan cost values variables inputs.
  2. Clicks save pricing changes button, sending updates payload.
  3. Hydrates checkout catalog database, changing plans variables.

### 5.14 Screen 14: System Announcements Broadcast Manager
```
+-----------------------------------------------------------------------------------------------+
| Global Banner Announcements dispatcher                                                        |
| Target audience parameters: [ All hosting customers [v] ]                                     |
| Announcement Message:                                                                         |
| +-------------------------------------------------------------------------------------------+ |
| | Emergency maintenance window scheduled on wp-node-3: July 10 at 02:00 UTC.                | |
| +-------------------------------------------------------------------------------------------+ |
| [ Dispatch Banner Announcement Immediately ]                                                   |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Form container bounds: `max-width: 800px; margin: 0 auto;`.
- **UI Copy:** `"Alert Banners Dispatcher"`, `"All Workspace Users"`, `"Publish Alert Banner"`.
- **HTML DOM Structure:**
```html
<div class="announcements-dispatcher-wrapper">
  <form class="announcement-form">...</form>
</div>
```
- **Event Flow:**
  1. Admin enters alert message parameters text blocks.
  2. Clicks publish announcement button, launching WebSocket payload.
  3. Broadcasts alert banner to customer active browser sessions.

### 5.15 Screen 15: Audit Logs Viewer
```
+ Timestamps | Operator | Action | Target                       |
| 17:12:02   | rahman   | Delete | my-old-dashboard             |
| [ Download CSV audit records ]                                |
+---------------------------------------------------------------+
- **Layout Grid CSS:** Log grid table container: `width: 100%; border: 1px solid var(--border-normal);`.
- **UI Copy:** `"Operator security logs"`, `"Action: Delete Database"`, `"Download CSV Logs"`.
- **HTML DOM Structure:**
```html
<div class="audit-logs-viewer-wrapper">
  <table class="audit-logs-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Download CSV audit records"`.
  2. Queries audit trail databases logs entries records details.
  3. Browser exports secure CSV files inside download folders.

### 5.16 Screen 16: Security Center & Firewall Operations
```
+-----------------------------------------------------------------------------------------------+
| Firewall rules administration & IP Bans                               [ + Add Firewall Rule ] |
| IP Block records                                                                              |
| +-------------------------------------------------------------------------------------------+ |
| | TARGET BANNED IP  | BLOCK TRIGGER REASON KEY       | DATE CREATED | ACTIONS               | |
| |-------------------+--------------------------------+--------------+-----------------------| |
| | 103.140.12.190    | SSH brute force password attack| 2026-07-04   | [Deactivate IP Block] | |
| +-------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
- **Layout Grid CSS:** Table structures layout width: `width: 100%; border-collapse: collapse;`.
- **UI Copy:** `"System Firewall Security"`, `"Active IP Bans"`, `"DDoS Mitigation"`, `"Unban IP"`.
- **HTML DOM Structure:**
```html
<div class="security-center-firewall">
  <table class="blocked-ips-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Remove Ban"` button options details.
  2. Sends firewall unblock instructions command to server daemon.
  3. Restores IP network connections capabilities on success validation.

### 5.17 Screen 17: Domain Registry Diagnostics
```
+ API Status: ONLINE | Pending queue: 2 failed registrations    |
| - rahman-web.com (Transfer-In) -> EPP Mismatch [Retry Job]    |
+---------------------------------------------------------------+
- **Layout Grid CSS:** Flex box list layouts: `display: flex; flex-direction: column; gap: var(--space-4);`.
- **UI Copy:** `"Openprovider Diagnostics"`, `"Quota stats"`, `"Pending transfers"`, `"Retry job"`.
- **HTML DOM Structure:**
```html
<div class="registry-diagnostics-dashboard">
  <table class="pending-jobs-table">...</table>
</div>
```
- **Event Flow:**
  1. Admin clicks `"Retry Job"` action link checks.
  2. Re-transmits registrar command variables to registry API server.
  3. Refreshes transfer exception queue lists displays on success.

---

## 6. State Transitions & Empty States Layout Specs

### 6.1 Generic Empty States Specs

When resource lists are empty, ITBengal displays a centered card container designed to avoid visual clutter and guide the user's next action.

```
+-----------------------------------------------------------+
|                                                           |
|                     [ Icon Asset ]                        |
|                                                           |
|                  No Active Domains Found                  |
|          Register or transfer a domain to get started.    |
|                                                           |
|                   [ Register Domain ]                     |
|                                                           |
+-----------------------------------------------------------+
```

```css
.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  border: 1px dashed var(--border-normal);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  text-align: center;
  max-width: 600px;
  margin: var(--space-8) auto;
}
```

### 6.2 Loading Skeletons Specs

Loading skeletons use animated, flat background blocks shaped to match the dimensions of incoming content to prevent layout shifts.

```css
.skeleton-shimmer {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-normal) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer-swipe 1.5s infinite linear;
}
@keyframes shimmer-swipe {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 6.3 State Transitions & Overlays

- **Toast Stacking:** Toasts stack vertically up to 5 elements. Gap spacing is `8px` (`var(--space-2)`). CSS transition: `transition: all 0.3s var(--ease-out-expo);`.
- **Form validation errors:** Input border shifts to error red. Focus glow updates: `box-shadow: 0 0 0 1px hsl(var(--error));`. An inline helper error text is inserted directly below.
- **Dropdown menus:** Click scales popover element in from `0.95` scale to `1.0` while fading opacity.
