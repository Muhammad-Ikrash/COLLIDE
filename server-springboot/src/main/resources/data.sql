-- Test user for development
-- Email: test@example.com
-- Password: password123
-- This password is hashed with BCrypt (strength 10)
-- Note: DataInitializer.java creates this user programmatically, so this file is optional
-- H2 doesn't support ON CONFLICT, so we use MERGE instead

MERGE INTO users (id, name, email, pass_hash, created_at)
KEY(email)
VALUES (
    1,
    'Test User',
    'test@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    CURRENT_TIMESTAMP
);

