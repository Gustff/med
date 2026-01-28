# Medical Voice Triage Assistant

## Overview

This is a professional medical voice chat application focused on clinical triage in Spanish (LATAM - Peru). The application provides safe medical orientation through voice interaction, helping users understand their symptoms and determine urgency levels without diagnosing or prescribing medications.

Key features:
- Voice-to-text and text-to-voice chat interface
- Clinical triage classification (PS1: Emergency, PS2: Urgent, PS3: Non-urgent)
- Clinical domain categorization (trauma/shock, gynecology, clinical)
- Empathetic, professional medical guidance in Spanish
- Emergency detection and immediate referral recommendations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable components in `client/src/components/`
- UI primitives in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Style**: REST endpoints under `/api/`
- **File Uploads**: Multer for handling audio uploads

The backend processes voice recordings, communicates with LemonFox AI API for transcription and medical AI responses, and manages chat sessions.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Managed via `drizzle-kit push`
- **Session Storage**: In-memory storage for chat sessions (MemStorage class)

### Shared Code
- Schema definitions and types shared between frontend and backend in `shared/` directory
- Zod schemas for runtime validation
- Type exports for Message, ChatSession, TriagePriority, ClinicalDomain

### Build Process
- Custom build script in `script/build.ts`
- Vite builds frontend to `dist/public`
- esbuild bundles server code to `dist/index.cjs`
- Selective dependency bundling for optimized cold starts

## External Dependencies

### AI/ML Services
- **LemonFox AI API**: Used for speech-to-text transcription and AI chat responses
  - Requires `LEMONFOX_API_KEY` environment variable
  - Base URL: `https://api.lemonfox.ai/v1`

### Database
- **PostgreSQL**: Primary database
  - Requires `DATABASE_URL` environment variable
  - Uses Drizzle ORM for type-safe queries
  - connect-pg-simple for session management

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `zod`: Runtime type validation
- `express`: HTTP server framework
- `multer`: Multipart form data handling for audio uploads
- Radix UI primitives: Accessible UI components