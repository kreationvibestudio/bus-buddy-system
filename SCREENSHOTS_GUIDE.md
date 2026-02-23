# Screenshots Guide

This document provides a structure for organizing screenshots of each page in the FleetMaster Bus Management System.

## How to Add Screenshots

1. **Create a `screenshots/` folder** in the project root
2. **Organize by role** (e.g. `screenshots/admin/`, `screenshots/passenger/`, `screenshots/driver/`)
3. **Name files descriptively** (e.g. `passenger-dashboard.png`, `admin-routes-page.png`)
4. **Update this document** with the actual image paths once screenshots are added

## Screenshot Checklist

### Common Pages (All Roles)

- [ ] **Landing Page** (`/`) - Homepage with login/signup
- [ ] **Login Page** (`/auth`) - Authentication form
- [ ] **Dashboard** (`/dashboard`) - Role-specific dashboard
- [ ] **Settings** (`/settings`) - Profile and app settings
- [ ] **Profile** (`/profile`) - Redirects to Settings

### Passenger Pages

- [ ] **Book Ticket - Search** (`/book`) - Route/date selection
- [ ] **Book Ticket - Select Trip** (`/book`) - Available trips list
- [ ] **Book Ticket - Select Seats** (`/book`) - Seat picker interface
- [ ] **Book Ticket - Confirm** (`/book`) - Booking summary and payment
- [ ] **My Bookings - List** (`/my-bookings`) - All bookings view
- [ ] **My Bookings - Upcoming Filter** (`/my-bookings?filter=upcoming`) - Filtered view
- [ ] **My Bookings - Details Dialog** - Booking details modal
- [ ] **Track Bus** (`/tracking`) - Live map with bus locations

### Admin Pages

- [ ] **Dashboard** (`/dashboard`) - Admin overview with stats
- [ ] **User Management** (`/users`) - User list and roles
- [ ] **Fleet Management** (`/fleet`) - Bus list and management
- [ ] **Add/Edit Bus** - Bus form dialog
- [ ] **Drivers** (`/drivers`) - Driver list
- [ ] **Add/Edit Driver** - Driver form dialog
- [ ] **Stations** (`/stations`) - Station management (admin only)
- [ ] **Routes** (`/routes`) - Route list with daily bus count
- [ ] **Add/Edit Route** - Route form with daily bus count field
- [ ] **Regenerate Trips Button** - Routes page action
- [ ] **Schedules** (`/schedules`) - Trip list
- [ ] **Add Trip** - Trip form with fare field
- [ ] **Edit Trip Fare** - Fare override dialog
- [ ] **Bookings** (`/bookings`) - All bookings management
- [ ] **Live Tracking** (`/tracking`) - Map with all buses
- [ ] **Maintenance** (`/maintenance`) - Maintenance records
- [ ] **Inventory** (`/inventory`) - Parts and stock
- [ ] **Accounts** (`/accounts`) - Financial transactions
- [ ] **Customer Service** (`/customer-service`) - Complaints
- [ ] **Reports** (`/reports`) - Analytics and charts
- [ ] **System Status** (`/admin/system-status`) - Service health checks

### Staff Pages

- [ ] **Dashboard** (`/dashboard`) - Staff overview
- [ ] **Routes** (`/routes`) - Route management
- [ ] **Schedules** (`/schedules`) - Trip management
- [ ] **Bookings** (`/bookings`) - Booking management
- [ ] **Customer Service** (`/customer-service`) - Support tickets

### Driver Pages

- [ ] **Dashboard** (`/dashboard`) - Driver overview
- [ ] **My Trips** (`/driver/trips`) - Assigned trips
- [ ] **Trip Detail** (`/driver/trips/:id`) - Trip details and actions
- [ ] **Passenger Manifest** (`/driver/passengers`) - Passenger list for trip
- [ ] **Incidents** (`/driver/incidents`) - Report incidents

### Mechanic Pages

- [ ] **Dashboard** (`/dashboard`) - Mechanic overview
- [ ] **Job Cards** (`/job-cards`) - Maintenance job cards
- [ ] **Work Orders** (`/work-orders`) - Work order management
- [ ] **Maintenance** (`/maintenance`) - Maintenance records

### Storekeeper Pages

- [ ] **Dashboard** (`/dashboard`) - Storekeeper overview
- [ ] **Inventory** (`/inventory`) - Stock management
- [ ] **Parts Requests** (`/parts-requests`) - Request management

### Accounts Pages

- [ ] **Dashboard** (`/dashboard`) - Accounts overview
- [ ] **Transactions** (`/accounts`) - Financial transactions
- [ ] **Payroll** (`/payroll`) - Payroll management
- [ ] **Reports** (`/reports`) - Financial reports

## Screenshot Organization Structure

```
screenshots/
├── common/
│   ├── landing-page.png
│   ├── login.png
│   └── settings.png
├── passenger/
│   ├── dashboard.png
│   ├── book-ticket-search.png
│   ├── book-ticket-select-trip.png
│   ├── book-ticket-seats.png
│   ├── book-ticket-confirm.png
│   ├── my-bookings-list.png
│   ├── my-bookings-upcoming.png
│   ├── my-bookings-details.png
│   └── track-bus.png
├── admin/
│   ├── dashboard.png
│   ├── users.png
│   ├── fleet.png
│   ├── drivers.png
│   ├── stations.png
│   ├── routes.png
│   ├── routes-regenerate.png
│   ├── schedules.png
│   ├── schedules-trip-fare.png
│   ├── bookings.png
│   ├── tracking.png
│   ├── maintenance.png
│   ├── inventory.png
│   ├── accounts.png
│   ├── customer-service.png
│   ├── reports.png
│   └── system-status.png
├── staff/
│   ├── dashboard.png
│   ├── routes.png
│   ├── schedules.png
│   ├── bookings.png
│   └── customer-service.png
├── driver/
│   ├── dashboard.png
│   ├── trips.png
│   ├── trip-detail.png
│   ├── passengers.png
│   └── incidents.png
├── mechanic/
│   ├── dashboard.png
│   ├── job-cards.png
│   ├── work-orders.png
│   └── maintenance.png
├── storekeeper/
│   ├── dashboard.png
│   ├── inventory.png
│   └── parts-requests.png
└── accounts/
    ├── dashboard.png
    ├── transactions.png
    ├── payroll.png
    └── reports.png
```

## How to Capture Screenshots

### Using Browser DevTools

1. Open the page in Chrome/Edge
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
4. Type "screenshot" and select:
   - **Capture full size screenshot** - for full page
   - **Capture node screenshot** - for specific element
5. Save to `screenshots/[role]/[page-name].png`

### Using Browser Extensions

- **Full Page Screen Capture** (Chrome)
- **FireShot** (Chrome/Firefox)
- **Awesome Screenshot** (Chrome/Firefox)

### Using macOS

- `Cmd+Shift+4` - Select area
- `Cmd+Shift+3` - Full screen
- `Cmd+Shift+4` then `Space` - Capture window

### Using Windows

- `Win+Shift+S` - Snipping Tool (Windows 10/11)
- `Print Screen` - Full screen (paste in Paint)

## Adding Screenshots to Documentation

Once screenshots are captured, add them to documentation files:

### In README.md

```markdown
## Screenshots

### Passenger Dashboard
![Passenger Dashboard](./screenshots/passenger/dashboard.png)

### Admin Routes Management
![Admin Routes](./screenshots/admin/routes.png)
```

### In PLATFORM_WORKBOOK.md

Add screenshots to relevant sections:

```markdown
## 8. Adding a New Bus

![Add Bus Dialog](./screenshots/admin/fleet-add-bus.png)

1. Log in as admin
2. Go to **Fleet Management**
...
```

## Tips for Good Screenshots

1. **Use consistent browser** (Chrome recommended)
2. **Window size**: 1920x1080 or 1440x900
3. **Hide sensitive data**: Blur emails, phone numbers, or use test data
4. **Show key features**: Highlight important UI elements
5. **Include context**: Show breadcrumbs, sidebar, or navigation when relevant
6. **Consistent styling**: Use same theme (light/dark) across all screenshots
7. **File size**: Optimize PNGs (use tools like TinyPNG) to keep repo size manageable

## Annotating Screenshots

For complex flows, consider adding annotations:

- Use tools like **Annotely**, **Skitch**, or **Snagit**
- Add numbered callouts for step-by-step guides
- Highlight important fields or buttons

---

*Last updated: February 2026*
