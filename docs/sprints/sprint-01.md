# Sprint 1: Project Setup & Authentication

**Sprint Dates:** Week 1
**Sprint Goal:** Users can register, log in, and access a protected dashboard

---

## Sprint Backlog

### Story 1.1: Supabase Project Setup
**Points:** 3 | **Assignee:** Backend

**Tasks:**
- [ ] Create Supabase project for EU region (Frankfurt)
- [ ] Create Supabase project for US region (Virginia)
- [ ] Configure authentication providers (email/password)
- [ ] Enable MFA settings
- [ ] Set up storage buckets for documents
- [ ] Document project IDs and URLs

**Acceptance Criteria:**
- [ ] Both projects accessible via dashboard
- [ ] Auth configured and tested
- [ ] Storage buckets created

---

### Story 1.2: Database Schema - Core Tables
**Points:** 5 | **Assignee:** Backend

**Tasks:**
- [ ] Create `organizations` table
- [ ] Create `users` table with org relationship
- [ ] Create `vendors` table with org relationship
- [ ] Create `documents` table
- [ ] Enable RLS on all tables
- [ ] Write RLS policies for organization isolation
- [ ] Create database types file

**Acceptance Criteria:**
- [ ] All tables created in both regions
- [ ] RLS prevents cross-org access
- [ ] TypeScript types generated

**SQL to Execute:**
```sql
-- See: /supabase/migrations/001_initial_schema.sql
```

---

### Story 1.3: Environment Configuration
**Points:** 2 | **Assignee:** Full-stack

**Tasks:**
- [ ] Update `.env.local` with Supabase credentials
- [ ] Update `.env.example` with all required variables
- [ ] Configure Vercel environment variables
- [ ] Test region switching works

**Acceptance Criteria:**
- [ ] Local development works
- [ ] Vercel preview deployments work
- [ ] Region selection persists

---

### Story 1.4: Authentication UI - Login
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Create `/login` page
- [ ] Build login form with email/password
- [ ] Add form validation (Zod)
- [ ] Handle login errors (toast)
- [ ] Add "Forgot password" link
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] Users can log in with valid credentials
- [ ] Invalid credentials show error
- [ ] Redirect to dashboard on success

---

### Story 1.5: Authentication UI - Register
**Points:** 5 | **Assignee:** Frontend

**Tasks:**
- [ ] Create `/register` page
- [ ] Build registration form (name, email, password, org name)
- [ ] Add password strength indicator
- [ ] Create organization on signup
- [ ] Send email confirmation
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] New users can register
- [ ] Organization created automatically
- [ ] Confirmation email sent
- [ ] Redirect to dashboard on success

---

### Story 1.6: Protected Routes & Middleware
**Points:** 3 | **Assignee:** Full-stack

**Tasks:**
- [ ] Update middleware for auth check
- [ ] Redirect unauthenticated users to login
- [ ] Preserve intended destination after login
- [ ] Handle session refresh

**Acceptance Criteria:**
- [ ] Unauthenticated users redirected
- [ ] Session persists across page loads
- [ ] Expired sessions handled gracefully

---

### Story 1.7: Dashboard Shell
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Create dashboard layout with sidebar
- [ ] Build sidebar navigation component
- [ ] Add user menu (profile, logout)
- [ ] Create page header component
- [ ] Add responsive mobile menu
- [ ] Implement logout functionality

**Acceptance Criteria:**
- [ ] Sidebar shows navigation items
- [ ] User can log out
- [ ] Mobile menu works
- [ ] Layout matches wireframes

---

### Story 1.8: Dashboard Home Page
**Points:** 2 | **Assignee:** Frontend

**Tasks:**
- [ ] Create dashboard home page
- [ ] Add placeholder stat cards
- [ ] Add "Getting Started" section
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] Dashboard displays after login
- [ ] Shows welcome message with user name
- [ ] Placeholder content indicates next steps

---

## Sprint Totals

| Metric | Value |
|--------|-------|
| Total Stories | 8 |
| Total Points | 26 |
| Team Capacity | 2 developers |

---

## Definition of Done

- [ ] Code reviewed and approved
- [ ] TypeScript types complete
- [ ] Basic error handling in place
- [ ] Responsive on mobile
- [ ] Deployed to Vercel preview
- [ ] Tested manually

---

## Risks & Blockers

| Risk | Mitigation |
|------|------------|
| Supabase setup delays | Start immediately, use existing docs |
| Auth edge cases | Use Supabase templates, test thoroughly |

---

## Notes

- Focus on getting auth flow solid - it's foundation for everything
- Don't over-engineer dashboard yet - just shell + placeholders
- Ensure RLS is correct from day 1
