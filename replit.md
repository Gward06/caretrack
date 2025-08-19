# Overview

CareTrack is a mobile-first caregiving application designed for private in-home care services for disabled and elderly people. The app enables caregivers to clock in/out of visits, manage client information, document care notes, and generate reports. It features a real-time tracking system with visit management, client relationship management, and comprehensive reporting capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod for runtime type validation
- **Storage Pattern**: Interface-based storage abstraction with in-memory implementation for development
- **API Design**: RESTful endpoints with consistent error handling and logging middleware

## Data Storage Solutions
- **Database**: PostgreSQL (configured for production via DATABASE_URL)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Migrations**: Schema-first approach with migrations in dedicated folder
- **Development Storage**: In-memory storage implementation for rapid development
- **Session Management**: Basic authentication with localStorage for user sessions

## Authentication and Authorization
- **Authentication**: Simple username/password authentication
- **Session Storage**: Client-side localStorage for user session persistence
- **Role-Based Access**: User roles (caregiver, admin, client) with role-based data filtering
- **API Security**: Basic request validation and user context for data access control

## Key Data Models
- **Users**: Caregivers, admins, and clients with role-based permissions
- **Clients**: Care recipients with medical conditions, emergency contacts, and care instructions
- **Visits**: Time tracking with clock in/out, GPS location, scheduled vs actual times
- **Care Notes**: Categorized documentation (medication, care, mood, safety, meals, exercise)
- **Schedules**: Planned visits and appointments for caregivers

## Mobile-Specific Features
- **Clock System**: Central clock button for easy visit start/stop with real-time duration tracking
- **GPS Integration**: Location capture for visit verification
- **Offline-Ready Architecture**: Query caching and optimistic updates for improved mobile experience
- **Touch-Optimized UI**: Large touch targets and mobile-friendly interactions

# External Dependencies

## Database and ORM
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: CLI tool for schema management and migrations

## Frontend UI and Interactions
- **@radix-ui/***: Headless UI primitives for accessibility and functionality
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **class-variance-authority**: Utility for building variant-based component APIs
- **tailwindcss**: Utility-first CSS framework

## Development and Build Tools
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React support for Vite
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay for Replit environment

## Utilities and Validation
- **zod**: Schema validation and type inference
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional CSS class utility
- **nanoid**: URL-safe unique ID generator