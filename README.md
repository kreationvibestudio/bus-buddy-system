# EagleLine Fleet Management System

A comprehensive bus fleet management system with booking, tracking, maintenance, and multi-role access control.

> Built with [Cursor](https://cursor.sh/) - The AI-powered code editor

## Features

- **Fleet Management**: Bus tracking, maintenance, and inventory management
- **Booking System**: Ticket booking and passenger management
- **Driver Management**: Driver profiles, trips, incidents, and GPS tracking
- **Route & Schedule Management**: Bus routes and scheduling
- **Multi-role Access**: Admin, Staff, Driver, Mechanic, Passenger, Accounts, Storekeeper roles
- **Real-time Tracking**: GPS-based bus location tracking with Mapbox
- **Mobile Support**: Capacitor-based mobile app support
- **PWA**: Progressive Web App support for offline functionality

## Technology Stack

- **Frontend**: React 18.3 + TypeScript
- **Build Tool**: Vite 5.4
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Maps**: Mapbox GL
- **Mobile**: Capacitor 8

## Prerequisites

- Node.js 18+ and npm (or bun/yarn/pnpm)
- [Supabase](https://supabase.com) account and project
- [Vercel](https://vercel.com) account (for deployment)
- Mapbox account (optional, for map features)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bus-buddy-system
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Getting your Supabase credentials**:
1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the **Project URL** for `VITE_SUPABASE_URL`
4. Copy the **anon public** key for `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4. Set Up Supabase Edge Function Secrets (Optional)

If you're using the Mapbox integration, set the secret in Supabase:

**Using Supabase CLI**:
```bash
supabase secrets set MAPBOX_PUBLIC_TOKEN=your-mapbox-token-here
```

**Using Supabase Dashboard**:
1. Go to **Project Settings > Edge Functions > Secrets**
2. Add `MAPBOX_PUBLIC_TOKEN` with your Mapbox token

### 5. Run Database Migrations (If Needed)

If you have a local Supabase instance or need to apply migrations:

```bash
# Using Supabase CLI
supabase db reset
# or
supabase migration up
```

### 6. Start the Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment to Vercel

This project is configured for seamless deployment on Vercel.

### Quick Deploy

1. **Push your code to GitHub** (if not already done)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Vite configuration

3. **Configure Environment Variables**:
   In Vercel project settings, add these environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

   See [VERCEL_ENV_VARIABLES.md](./VERCEL_ENV_VARIABLES.md) for detailed instructions.

4. **Deploy**:
   - Click "Deploy"
   - Your site will be live in minutes!

### Vercel Configuration

The project includes `vercel.json` with optimal settings:
- SPA routing support (all routes redirect to `index.html`)
- Security headers
- Asset caching
- Build command: `npm run build`
- Output directory: `dist`

For more details, see the [Vercel deployment documentation](https://vercel.com/docs).

## Mobile App Development (Capacitor)

### Sync Capacitor

```bash
npx cap sync
```

### Open in Native IDE

```bash
# Android
npx cap open android

# iOS
npx cap open ios
```

## Project Structure

```
src/
├── components/      # React components
│   ├── auth/       # Authentication
│   ├── booking/    # Booking components
│   ├── dashboard/  # Dashboard widgets
│   ├── driver/     # Driver components
│   ├── layout/     # Layout components
│   └── ui/         # shadcn/ui components
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── integrations/   # Third-party integrations
│   └── supabase/  # Supabase client
├── pages/          # Page components (routes)
└── types/          # TypeScript types

supabase/
├── functions/      # Edge Functions
└── migrations/     # Database migrations
```

## Key Routes

- `/` - Landing page
- `/auth` - Login
- `/dashboard` - Main dashboard
- `/fleet` - Fleet management (admin)
- `/drivers` - Driver management (admin)
- `/routes` - Route management
- `/schedules` - Schedule management
- `/bookings` - Booking management
- `/tracking` - Real-time tracking
- `/maintenance` - Maintenance records
- `/inventory` - Inventory management
- `/driver-app` - Driver mobile interface

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |

**Supabase Edge Function Secrets**:
- `MAPBOX_PUBLIC_TOKEN` - Mapbox API token (for map features)

## Populating Sample Data

To populate the database with realistic sample data for client demonstration:

### Option 1: Using Edge Function (Recommended)

1. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy seed-comprehensive-data
   ```

2. **Call the function:**
   ```bash
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/seed-comprehensive-data \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

   Or use the Supabase Dashboard:
   - Go to **Edge Functions** → **seed-comprehensive-data**
   - Click **Invoke** button

This will create:
- 11 test users (admin, staff, drivers, mechanics, passengers, accounts, storekeeper)
- Driver profiles with licenses
- 20+ bookings with payments
- Maintenance records and work orders
- Stock requests and transactions
- Complaints, incidents, and notifications

### Option 2: Using SQL Scripts

1. Run the basic sample data script:
   ```sql
   -- In Supabase SQL Editor, run:
   -- supabase/setup/03_sample_data.sql
   ```

2. For comprehensive data, use the Edge Function (Option 1) as it handles user creation properly.

## Traccar GPS Integration

To use Traccar (hosted on another server) for hardware GPS tracking:

1. **Run the migration** to add `traccar_device_id` to buses:
   ```bash
   supabase db push
   ```

2. **Deploy the webhook function**:
   ```bash
   supabase functions deploy traccar-webhook
   ```

3. **Map buses to Traccar devices** in Fleet Management: Edit each bus and set its Traccar Device ID (from your Traccar server).

4. **Configure Traccar** (`traccar.xml`):
   ```xml
   <entry key='forward.url'>https://YOUR_PROJECT_REF.supabase.co/functions/v1/traccar-webhook</entry>
   <entry key='forward.type'>json</entry>
   <entry key='forward.header'>Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY</entry>
   ```

5. Restart Traccar. Positions will flow into the Live Tracking map automatically.

## Troubleshooting

### Environment Variables Not Loading
- Ensure `.env.local` is in the root directory
- Restart the dev server after adding/changing variables
- Variable names must start with `VITE_`

### Supabase Connection Issues
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure RLS policies allow your operations

### Mapbox Not Working
- Verify `MAPBOX_PUBLIC_TOKEN` is set in Supabase secrets
- Check that the `get-mapbox-token` edge function is deployed
- Verify the token has correct scopes/permissions

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npm run lint`

### PWA Build Issues
- If you encounter PWA build errors on Vercel, ensure `vite-plugin-pwa` is properly installed
- Check that `pwa-192x192.png` exists in the `public/` directory
- The PWA plugin is enabled by default for production builds

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## License

[Add your license here]
# Test
