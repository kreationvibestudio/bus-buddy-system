# FleetMaster Bus Management - Flow Diagrams

This document contains visual flow diagrams for key user journeys and system processes.

## Table of Contents

1. [Passenger Booking Flow](#passenger-booking-flow)
2. [Admin Route & Trip Management](#admin-route--trip-management)
3. [GPS Tracking Flow](#gps-tracking-flow)
4. [Payment Flow](#payment-flow)
5. [Driver Trip Management](#driver-trip-management)
6. [System Architecture](#system-architecture)

---

## Passenger Booking Flow

```mermaid
flowchart TD
    A[Passenger visits /book] --> B{Select Route & Date}
    B --> C[Search Available Trips]
    C --> D{Trip Type?}
    D -->|One Way| E[Select Outbound Trip]
    D -->|Round Trip| F[Select Outbound Trip]
    F --> G[Select Return Trip]
    E --> H[Select Seats]
    G --> H
    H --> I{Logged In?}
    I -->|No| J[Redirect to Login]
    I -->|Yes| K[Confirm Booking]
    J --> K
    K --> L{Payment Method}
    L -->|Pay Now| M[Process Payment]
    L -->|Pay at Terminal| N[Booking Confirmed<br/>Payment Pending]
    M --> O[Booking Confirmed<br/>Payment Completed]
    N --> P[View in My Bookings]
    O --> P
    P --> Q[Can Pay Later or Cancel]
```

---

## Admin Route & Trip Management

```mermaid
flowchart TD
    A[Admin → Routes] --> B[View All Routes]
    B --> C{Action?}
    C -->|Add Route| D[Create Route<br/>Set Base Fare<br/>Set Daily Bus Count]
    C -->|Edit Route| E[Update Route<br/>Change Daily Bus Count]
    C -->|Regenerate Trips| F[Click Regenerate Upcoming Trips]
    D --> G[Route Created]
    E --> H[Route Updated]
    F --> I[Delete Future Trips<br/>Create New Trips<br/>Based on Daily Bus Count]
    G --> J[Schedules Page]
    H --> J
    I --> J
    J --> K[View/Create Trips]
    K --> L{Set Trip Fare?}
    L -->|Yes| M[Set Custom Fare<br/>Override Route Base Fare]
    L -->|No| N[Use Route Base Fare]
    M --> O[Trip Created/Updated]
    N --> O
```

---

## GPS Tracking Flow

```mermaid
flowchart LR
    A[GPS Device on Bus] -->|Sends Position| B[Traccar Server]
    B -->|Forward via Webhook| C[Supabase Edge Function<br/>traccar-webhook]
    C --> D{Device Mapped<br/>to Bus?}
    D -->|Yes| E[Store in bus_locations]
    D -->|No| F[Return 404<br/>Log Error]
    E --> G[Live Tracking Page]
    G --> H[Display on Map]
    I[Admin: System Status] --> J{Traccar<br/>Reachable?}
    J -->|Public URL| K[Check Status: OK]
    J -->|Private IP| L[Status: Cannot Reach]
```

---

## Payment Flow

```mermaid
flowchart TD
    A[Booking Created] --> B{Payment Status}
    B -->|Pending| C[Passenger Options]
    B -->|Completed| D[Booking Paid]
    C --> E[Pay at Terminal]
    C --> F[Pay Later from<br/>My Bookings]
    C --> G[Cancel Booking]
    E --> H[Admin/Staff Marks Paid]
    F --> H
    H --> D
    G --> I[Booking Cancelled]
    D --> J[Trip Day: Board Bus]
    I --> K[Refund if Paid]
```

---

## Driver Trip Management

```mermaid
flowchart TD
    A[Driver Logs In] --> B[Dashboard: My Trips]
    B --> C[View Assigned Trips]
    C --> D{Trip Status}
    D -->|Scheduled| E[Click Start Trip]
    D -->|In Progress| F[View Passengers<br/>Report Incidents]
    D -->|Completed| G[View History]
    E --> H[Trip Status: In Progress]
    H --> I[GPS Tracking Active]
    I --> F
    F --> J{Action?}
    J -->|End Trip| K[Trip Status: Completed]
    J -->|Report Incident| L[Create Incident Report]
    K --> G
```

---

## System Architecture

```mermaid
graph TB
    subgraph "Frontend (Vercel)"
        A[React App<br/>bms.sdkoncept.com]
    end
    
    subgraph "Backend (Supabase)"
        B[(PostgreSQL Database)]
        C[Edge Functions]
        D[Authentication]
        E[Real-time Subscriptions]
    end
    
    subgraph "External Services"
        F[Traccar GPS Server<br/>Cloudflare Tunnel]
        G[Mapbox Maps]
    end
    
    A -->|API Calls| B
    A -->|Auth| D
    A -->|Real-time| E
    A -->|Maps| G
    F -->|Webhook| C
    C -->|Store Data| B
    B -->|Query| A
```

---

## User Role Access Flow

```mermaid
flowchart TD
    A[User Logs In] --> B{Check Role}
    B -->|admin| C[Full Access<br/>All Pages]
    B -->|staff| D[Routes, Schedules<br/>Bookings, Customer Service]
    B -->|passenger| E[Book Ticket<br/>My Bookings<br/>Track Bus]
    B -->|driver| F[My Trips<br/>Passengers<br/>Incidents]
    B -->|mechanic| G[Job Cards<br/>Work Orders<br/>Maintenance]
    B -->|storekeeper| H[Inventory<br/>Parts Requests]
    B -->|accounts| I[Transactions<br/>Payroll<br/>Reports]
```

---

## Booking Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Create Booking
    Pending --> Confirmed: Auto-confirm
    Confirmed --> Paid: Payment Completed
    Confirmed --> Cancelled: Cancel
    Paid --> Cancelled: Cancel (Refund)
    Paid --> Completed: Trip Completed
    Confirmed --> Completed: Trip Completed
    Cancelled --> [*]
    Completed --> [*]
```

---

*Last updated: February 2026*
