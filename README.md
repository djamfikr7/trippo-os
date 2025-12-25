# 🚀 Trippo.OS - Logistics Platform

A comprehensive ride-sharing and logistics platform with Neo-Industrial dark theme, built with cutting-edge technologies.

## ✨ Project Overview

Trippo.OS is a full-stack ride-sharing and logistics platform that emphasizes:

- **Open-First**: OpenStreetMap (OSM), OSRM routing, Nominatim geocoding
- **Cash Economy**: Cash-based payment system without Stripe
- **Local Processing**: JWT authentication with local-first data handling
- **Industrial Design**: Neo-Industrial dark theme (#050505, #F59E0B)

## ✨ Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **📊 Recharts** - Redefined chart library built with React and D3

### 🔐 Authentication & Security
- **🔐 Jose** - JWT token generation and verification
- **🔒 SHA-256** - Secure password hashing

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation TypeScript ORM (SQLite)
- **💾 Local Database** - SQLite with type-safe queries

### 📋 Data Management
- **📋 Zod** - TypeScript-first schema validation
- **🐻 Zustand** - Simple, scalable state management

## 🎨 Neo-Industrial Design

Trippo.OS features a distinctive dark industrial aesthetic:

- **Background**: #050505 (near black)
- **Primary/Accent**: #F59E0B (amber)
- **Surface**: #121212 (dark gray)
- **Typography**: Geist Sans (tech), Geist Mono (data)
- **Design**: Sharp angles, data-dense dashboards, minimal chrome

## 🚀 Features

### ✅ Completed Features

#### Authentication System
- JWT-based authentication with access tokens (15min expiry)
- Refresh token rotation (7 days expiry)
- Secure password hashing with SHA-256
- Role-based access control (Rider, Driver, Admin)

#### Admin Dashboard
- **Dashboard Overview**: Real-time statistics and analytics
  - Total rides, active drivers, revenue, registered users
  - 7-day ride volume chart (bar chart)
  - Revenue trend chart (line chart)
  - Recent trips and active drivers tables

#### Driver Management
- Comprehensive driver profiles
- Real-time status tracking (online/offline)
- Driver verification workflow
- Vehicle information management
- Rating and trip history
- Filtering by status, vehicle type
- Driver actions (view, verify, suspend)

#### Trip Management
- Real-time trip tracking
- Multiple trip status states (Requested, Searching, Driver Found, Arrived, In Progress, Completed, Cancelled)
- Route and fare information
- Distance and duration tracking
- Payment status tracking (Paid/Unpaid)
- Trip filtering and search
- Export functionality

#### Cash Collection Tracking
- Cash payment collection monitoring
- Transaction history
- Collection status (Collected, Pending, Disputed)
- Dispute handling
- Top collectors leaderboard
- Collection rate analytics
- Daily reports and exports

### ⏳ Planned Features

- **Live Map Integration**: OpenStreetMap/Leaflet for real-time driver tracking
- **Real-Time Updates**: WebSocket/Socket.io for live data
- **OSRM Integration**: Routing and distance calculation
- **Nominatim Integration**: Geocoding for address lookup
- **Advanced Analytics**: More detailed reports and insights
- **User Management**: Rider and driver profile management

## 🏗️ Database Schema

### Core Models
- **User**: Riders, drivers, and admins
- **Driver**: Driver profiles with vehicle info
- **Trip**: Ride requests and completions
- **Transaction**: Cash payment records
- **Document**: Driver verification documents
- **Wallet**: User wallet for future features

### Enums
- **UserRole**: RIDER, DRIVER, ADMIN
- **TripStatus**: REQUESTED, SEARCHING, DRIVER_FOUND, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED
- **PaymentMethod**: CASH, WALLET
- **DocumentStatus**: PENDING, APPROVED, REJECTED

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Push database schema
bun run db:push

# Generate Prisma client
bun run db:generate

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/         # Login endpoint
│   │   │   ├── register/      # Registration endpoint
│   │   │   └── refresh/       # Token refresh endpoint
│   │   └── admin/
│   │       ├── stats/          # Dashboard statistics
│   │       ├── drivers/        # Driver management
│   │       └── trips/          # Trip management
│   ├── globals.css             # Global styles with Neo-Industrial theme
│   ├── layout.tsx              # Root layout
│   └── page.tsx               # Main dashboard page
├── components/
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── sidebar.tsx        # Navigation sidebar
│   │   ├── dashboard-layout.tsx
│   │   ├── stat-card.tsx      # Statistics cards
│   │   ├── drivers-page.tsx   # Driver management
│   │   ├── trips-page.tsx     # Trip management
│   │   └── transactions-page.tsx
│   └── ui/                    # shadcn/ui components
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── lib/
    ├── auth.ts                # JWT and password utilities
    ├── db.ts                  # Prisma client
    └── utils.ts               # Utility functions
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/drivers` - List drivers (with filters)
- `PATCH /api/admin/drivers` - Update driver (verify, etc.)
- `GET /api/admin/trips` - List trips (with pagination)

## 🎨 Design Tokens

```css
--background: oklch(0.02 0 0);        /* #050505 */
--card: oklch(0.08 0 0);               /* #121212 */
--primary: oklch(0.68 0.16 65);        /* #F59E0B - Amber */
--foreground: oklch(0.92 0 0);         /* Off-white text */
--border: oklch(0.2 0 0);              /* Subtle border */
--muted: oklch(0.12 0 0);              /* Secondary backgrounds */
```

## 🚀 Deployment

The application is production-ready with:
- Optimized build configuration
- Environment-based configuration
- Database migrations
- Type-safe API routes
- Responsive design for all devices

## 📝 Development Notes

- The application uses a single-page approach with hash-based navigation
- All API routes are properly authenticated
- Database schema is versioned with Prisma
- All components follow shadcn/ui design patterns
- Neo-Industrial theme is applied consistently throughout

## 🤝 Contributing

This project is designed for AI-assisted development. The codebase structure and component architecture are optimized for AI code generation and modification.

## 📄 License

Trippo.OS - Logistics Platform
Copyright © 2024

---

Built with Next.js 15, TypeScript, and shadcn/ui 🚀
