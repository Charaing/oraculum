-- PostgreSQL reference schema. NOT connected to the deployed D1 runtime.
CREATE TABLE readings (
 id uuid PRIMARY KEY,
 user_id text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('tarot','saju','iching','astrology')),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
 snapshot jsonb NOT NULL,
 explanation text NOT NULL,
 rule_version text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX readings_owner_created_idx ON readings(user_id,created_at DESC);
CREATE TABLE rate_limits (key text PRIMARY KEY, window bigint NOT NULL, count integer NOT NULL);
-- All queries must bind the authenticated user_id. Never accept it from a client body.
-- Optional RLS depends on a trusted adapter setting app.user_id per transaction.
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_readings ON readings USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));
