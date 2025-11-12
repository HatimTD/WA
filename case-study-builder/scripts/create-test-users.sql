-- Create test users with different roles
-- Run this with: psql -U postgres -d case_study_builder -f scripts/create-test-users.sql

-- Create a Contributor user
INSERT INTO "User" (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'contributor@test.com',
  'Test Contributor',
  'CONTRIBUTOR',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET role = 'CONTRIBUTOR';

-- Create an Approver user
INSERT INTO "User" (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'approver@test.com',
  'Test Approver',
  'APPROVER',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET role = 'APPROVER';

-- Create a Viewer user
INSERT INTO "User" (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'viewer@test.com',
  'Test Viewer',
  'VIEWER',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET role = 'VIEWER';

-- Display all users
SELECT id, name, email, role, "totalPoints" FROM "User" ORDER BY role;
