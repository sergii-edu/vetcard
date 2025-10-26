# Design Guidelines: Veterinary Smart Medical Card Application

## Design Approach
**Selected System:** Material Design 3  
**Justification:** This utility-focused medical application requires clarity, consistency, and reliability over visual experimentation. Material Design 3 provides robust patterns for data-dense interfaces, form-heavy workflows, and dashboard visualizations while maintaining professional credibility essential for healthcare applications.

**Core Principles:**
- Trust through clarity and consistency
- Efficiency in data entry and retrieval
- Hierarchical information architecture
- Accessibility for prolonged professional use

---

## Color Palette

### Light Mode
- **Primary:** 210 85% 45% (Medical Blue - trustworthy, professional)
- **Primary Container:** 210 90% 92%
- **Secondary:** 165 60% 40% (Teal - health, wellness)
- **Background:** 0 0% 98%
- **Surface:** 0 0% 100%
- **Surface Variant:** 210 20% 95%
- **Outline:** 210 15% 75%

### Dark Mode
- **Primary:** 210 75% 65%
- **Primary Container:** 210 70% 25%
- **Secondary:** 165 50% 55%
- **Background:** 210 10% 10%
- **Surface:** 210 8% 15%
- **Surface Variant:** 210 10% 20%
- **Outline:** 210 10% 40%

### Semantic Colors
- **Success:** 140 60% 45% (Healthy metrics)
- **Warning:** 35 85% 55% (Approaching limits)
- **Error:** 355 75% 50% (Critical alerts, out-of-range values)
- **Info:** 210 85% 55%

---

## Typography

**Font Family:** Inter (Google Fonts) for UI, Roboto Mono for data tables and metric values

**Type Scale:**
- **Display (Page Headers):** 32px / 700 / -0.5px tracking
- **Headline (Section Headers):** 24px / 600 / -0.25px tracking
- **Title (Card Headers):** 18px / 600 / normal
- **Body Large (Forms, Content):** 16px / 400 / 0.15px tracking
- **Body (General Text):** 14px / 400 / 0.25px tracking
- **Label (Form Labels, Buttons):** 13px / 500 / 0.5px tracking
- **Caption (Metadata, Timestamps):** 12px / 400 / 0.4px tracking

**Data Display:** Roboto Mono 14px/500 for numerical values, measurements, dates

---

## Layout System

**Spacing Primitives:** Use Tailwind units: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24  
Common patterns: p-4, gap-6, mb-8, py-12

**Grid Structure:**
- Container: max-w-7xl with px-4 (mobile) to px-8 (desktop)
- Dashboard: 12-column grid with responsive breakpoints
- Forms: max-w-2xl centered for focused data entry
- Data Tables: full-width with horizontal scroll on mobile

**Responsive Breakpoints:**
- Mobile: base (< 768px)
- Tablet: md (768px - 1024px)
- Desktop: lg (1024px+)

---

## Component Library

### Navigation
- **Top App Bar:** Fixed header with clinic/user context, notifications bell, profile menu
- **Side Navigation (Desktop):** Persistent drawer with grouped sections (Dashboard, Pets, Records, Vaccinations, Settings)
- **Mobile Navigation:** Bottom navigation bar with 4-5 primary actions

### Forms
- **Text Inputs:** Material filled style with labels, helper text, error states
- **Select Dropdowns:** Native select enhanced with search for long lists (breeds, clinics)
- **Date Pickers:** Calendar overlay with keyboard input support
- **File Upload:** Drag-and-drop zone with preview thumbnails for OCR documents
- **Form Actions:** Right-aligned primary/secondary button groups

### Data Displays
- **Cards:** Elevated surfaces with 8px border-radius, shadow-sm
  - Pet Profile Cards: Avatar, name, species, key metrics preview
  - Record Cards: Visit date, vet, diagnosis summary, expandable details
- **Data Tables:** Striped rows, sortable headers, sticky header on scroll
  - Columns: Checkbox select, metric name, value (Roboto Mono), unit, reference range, status indicator
- **Metrics Dashboard:** Grid of stat cards showing current/trend with sparkline charts
- **Charts:** Chart.js with Material color palette
  - Line charts for weight/metric trends over time
  - Bar charts for comparative analysis
  - Status indicators: Green (in-range), Yellow (borderline), Red (out-of-range)

### Alerts & Notifications
- **Alert Banners:** Full-width colored strips at top of relevant sections
  - Critical: Red background with white text, exclamation icon
  - Warning: Amber background, dark text, alert icon
  - Info: Blue background, white text, info icon
- **Inline Alerts:** Within metric cards showing out-of-range values with badge indicator
- **Toast Notifications:** Bottom-right temporary messages for actions (save success, error)

### Overlays
- **Dialogs:** Centered modal for confirmations, OCR verification interface
  - OCR Review Dialog: Side-by-side original image + extracted data table with edit capabilities
- **Bottom Sheets (Mobile):** For filters, quick actions

---

## OCR Feature Specifics
- **Upload Interface:** Large drop zone with file icon, "Upload Document" text, supported formats notice (JPG, PNG, PDF)
- **Processing State:** Linear progress bar with "Scanning document..." message
- **Review Interface:** 
  - Left pane: Document preview with zoom controls
  - Right pane: Editable table of extracted metrics
  - Each row: Metric name (text input), Value (number input), Unit (dropdown), Reference range (text input)
  - Bottom actions: "Discard", "Save to Records" (primary button)

---

## Animations
- **Minimal approach:** Smooth transitions only where they aid comprehension
- **Micro-interactions:** Button ripples (Material standard), input focus states
- **Page transitions:** 200ms fade for route changes
- **Chart animations:** 400ms ease-in-out on initial render only
- **NO decorative animations, scroll effects, or complex motion**

---

## Images
- **Pet Avatars:** Circular 80px (profile cards) to 120px (detail pages), placeholder silhouette if no photo
- **Document Thumbnails:** 120x160px preview cards in upload history
- **No hero images** - this is a functional dashboard application, not marketing

---

## Dashboard Layout Example
1. **Summary Cards Row:** 4 cards (Total Pets, Upcoming Vaccinations, Recent Alerts, Last Visit) - grid-cols-1 md:grid-cols-2 lg:grid-cols-4
2. **Main Content Area:** 
   - Left (8 cols): Active pet selector + health metrics charts
   - Right (4 cols): Recent records list, quick actions sidebar
3. **Alerts Section:** Full-width expandable panel showing flagged metrics

This design prioritizes clarity, efficiency, and trustworthiness appropriate for medical data management while maintaining modern web standards.