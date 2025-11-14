# SOET Smart Classroom Management System

A comprehensive classroom management system for the School of Engineering & Technology (SOET), Adamas University.

## Features

### Teacher Module
- Book classrooms with specific time slots
- Mark attendance for approved bookings
- View booking and attendance history
- Report classroom issues

### SPOC Module
- Manage room availability and maintenance
- Approve or reject booking requests
- Track and resolve classroom issues
- View system statistics

### Admin Module (Mock UI)
- View system analytics and statistics
- Monitor room utilization
- Track peak usage hours

### Student Module (Mock UI)
- View class schedule
- Check attendance records

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- shadcn/ui components

## Database Schema

- **Profiles**: User information with roles (TEACHER, SPOC, ADMIN, STUDENT)
- **Rooms**: 25 classrooms across AU4-AU7 buildings
- **Bookings**: Room reservation requests with approval workflow
- **Attendance**: Class attendance records
- **Issue Reports**: Classroom problem tracking

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. The backend (Supabase) is already configured and connected

## User Accounts

You can create test accounts with different roles:

- **Teacher**: Can book rooms, mark attendance, report issues
- **SPOC**: Can manage rooms, approve bookings, resolve issues
- **Admin**: Can view system analytics
- **Student**: Can view schedule and attendance

## Security

- Row Level Security (RLS) policies enforce role-based access
- All database operations are secured
- Authentication handled by Supabase Auth
