# Msark Internal System - TODO

## Database & Backend
- [ ] Design and create all database tables (schema.ts)
- [ ] Run migrations and apply SQL
- [ ] Build server-side query helpers (db.ts)
- [ ] Build tRPC routers for all features

## Authentication & Roles
- [ ] Extend user table with role (admin, manager, employee, freelancer)
- [ ] Username/password login system (separate from OAuth)
- [ ] Role-based access control middleware
- [ ] Admin can create/manage user accounts

## Dashboard
- [ ] Main dashboard with KPI cards (active projects, tasks, revenue, team)
- [ ] Recent activity feed
- [ ] Upcoming deadlines widget
- [ ] Quick actions panel

## Projects Management
- [ ] Projects list page with filters (service type, status, client)
- [ ] Create/edit project form (7 service categories)
- [ ] Project detail page with tasks, team, timeline
- [ ] Project status workflow (draft, active, review, completed, cancelled)
- [ ] Project budget tracking

## Tasks Management
- [ ] Tasks list with kanban-style view
- [ ] Create/assign task form (to employee or freelancer)
- [ ] Task status states (pending, in_progress, under_review, completed)
- [ ] Task comments system
- [ ] File attachments on tasks
- [ ] Task deadline notifications

## Employees Management
- [ ] Employees list page
- [ ] Employee profile (department, salary, hire date, skills, performance)
- [ ] Create/edit employee form
- [ ] Department management
- [ ] Employee performance metrics

## Freelancers Management
- [ ] Freelancers list page
- [ ] Freelancer profile (skills, rate, portfolio)
- [ ] Invite freelancer (email invitation)
- [ ] Freelancer assigned projects tracking
- [ ] Freelancer performance rating

## Clients Management
- [ ] Clients list page
- [ ] Client profile (contact info, project history)
- [ ] Create/edit client form
- [ ] Contract management per client

## Reports & Analytics
- [ ] Team performance charts (recharts)
- [ ] Project status distribution chart
- [ ] Revenue metrics chart
- [ ] Service type breakdown chart
- [ ] Export reports

## Notifications
- [ ] Internal notification system
- [ ] Notifications for task assignments
- [ ] Notifications for deadline reminders
- [ ] Notifications for project status changes
- [ ] Notification bell in header

## UI/UX
- [ ] Arabic RTL layout throughout
- [ ] Professional dark/light theme (dark default)
- [ ] DashboardLayout with Arabic sidebar navigation
- [ ] Responsive design
- [ ] Loading states and empty states
- [ ] Toast notifications for actions

## Testing & Deployment
- [ ] Write vitest tests for core procedures
- [ ] Final QA and bug fixes
- [ ] Save checkpoint
- [ ] Push to GitHub
