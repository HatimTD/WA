-- Change user role script
-- Run this with: psql -U postgres -d case_study_builder -f scripts/change-user-role.sql

-- Make dev user an APPROVER
UPDATE "User"
SET role = 'APPROVER'
WHERE email = 'tidihatim@gmail.com';

-- Verify the change
SELECT id, name, email, role, "totalPoints"
FROM "User"
WHERE email = 'tidihatim@gmail.com';
