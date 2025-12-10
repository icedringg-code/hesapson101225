# SyncArch İş Takip Sistemi (Job Tracking System)

A professional, production-ready job tracking and financial management system built with React, TypeScript, Tailwind CSS, and Supabase. Available as PWA and native mobile apps for iOS and Android.

## Features

### Core Functionality
- **User Authentication**: Secure email/password authentication with Supabase Auth
- **Job Management**: Create, view, edit, and delete jobs with different statuses (Active, Completed, Paused)
- **Company Management**: Track employers and employees for each job
- **Transaction Tracking**: Record income and expenses with detailed notes
- **Financial Statistics**: Real-time calculation of income, expenses, and net balance
- **Multi-user Support**: Each user has isolated access to their own data

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication with Supabase
- Automatic session management

### User Interface
- Modern, professional design with Tailwind CSS
- Responsive layout (mobile, tablet, desktop)
- Smooth animations and transitions
- Intuitive navigation
- Real-time data updates

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite
- **Mobile**: Capacitor (iOS & Android)
- **Deployment**: Web (Vercel/Netlify), Mobile (App Store/Play Store), PWA

## Prerequisites

- Node.js 16+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. The database tables and RLS policies have already been created via migration
3. Copy your project's URL and anon key

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Database Schema

### Tables

#### jobs
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text) - Job name
- `description` (text) - Job description
- `start_date` (date) - Start date
- `end_date` (date, nullable) - End date
- `status` (text) - Status (Aktif, Tamamlandı, Duraklatıldı)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### companies
- `id` (uuid, primary key)
- `job_id` (uuid, foreign key)
- `user_id` (uuid, foreign key)
- `name` (text) - Company/Employee name
- `type` (text) - Type (İşveren, Çalışan)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### transactions
- `id` (uuid, primary key)
- `job_id` (uuid, foreign key)
- `company_id` (uuid, foreign key)
- `performed_by_id` (uuid, foreign key, nullable)
- `user_id` (uuid, foreign key)
- `date` (date) - Transaction date
- `description` (text) - Description
- `income` (numeric) - Income amount
- `expense` (numeric) - Expense amount
- `note` (text) - Additional notes
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AddJobModal.tsx
│   └── JobCard.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/                # Core libraries and clients
│   ├── auth.ts
│   └── supabase.ts
├── pages/              # Main application pages
│   ├── AuthPage.tsx
│   └── Dashboard.tsx
├── services/           # API service layer
│   ├── jobs.ts
│   └── statistics.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── formatters.ts
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

## Features in Detail

### Authentication
- Email/password sign up and login
- Secure session management
- Automatic token refresh
- Password visibility toggle

### Job Management
- Create jobs with name, description, dates, and status
- Filter jobs by status (All, Active, Completed, Paused)
- Visual indicators for job status
- Quick actions (edit, delete)

### Statistics Dashboard
- Total income across all jobs
- Total expenses across all jobs
- Net balance (income - expenses)
- Job count by status

### Data Security
- Row Level Security (RLS) ensures users can only see their own data
- All database operations are authenticated
- Foreign key constraints maintain data integrity
- Cascade delete operations prevent orphaned records

## Deployment

### 📱 Mobile Apps (iOS & Android)

**See detailed instructions**: [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md)

Quick start:
```bash
# Build and sync for mobile
npm run mobile:build

# Open in Xcode (iOS)
npm run cap:open:ios

# Open in Android Studio
npm run cap:open:android
```

**Requirements**:
- iOS: macOS with Xcode, Apple Developer account ($99/year)
- Android: Android Studio, Google Play Console account ($25 one-time)

### 🌐 Web Deployment

#### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

#### Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

#### Other Platforms

The application can be deployed to any static hosting service that supports Single Page Applications (SPA).

### 📲 PWA (Progressive Web App)

The app is already configured as a PWA:
- Works offline
- Installable on mobile devices
- Push notifications ready
- Fast and responsive

Users can install it from their browser:
- **iOS**: Safari > Share > Add to Home Screen
- **Android**: Chrome > Menu > Install App

## Development

```bash
# Run development server
npm run dev

# Run TypeScript type checking
npm run typecheck

# Run linter
npm run lint

# Build for production
npm run build
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and questions, please open an issue on the project repository.
