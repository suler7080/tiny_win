-- =============================================================================
-- Tiny Win — PostgreSQL Database Schema
-- Version: MVP 1.0
-- Author:  Lead System & Database Architect
-- Description: Normalized relational schema for Tiny Win social platform.
--              Covers Users, Friendships, Wins, Reactions, and Streaks.
--              Enforces 1 win/user/day constraint, idempotency and
--              full referential integrity.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive text for email

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

-- Supported reaction symbols (PRD §4.1, Business Rule #7)
CREATE TYPE reaction_type AS ENUM ('🔥', '👀', '🤝');

-- Friendship state machine
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Stores core account data. Server is the source-of-truth for timezone,
-- which drives the 1-win-per-day boundary (PRD §5, Rule #1).
-- =============================================================================
CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(30)     NOT NULL,
    email           CITEXT          NOT NULL,
    password_hash   TEXT            NOT NULL,               -- bcrypt / argon2id hash
    display_name    VARCHAR(50),
    timezone        VARCHAR(64)     NOT NULL DEFAULT 'UTC', -- IANA tz, e.g. 'Asia/Ho_Chi_Minh'
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_username_length   CHECK (char_length(username) >= 3),
    CONSTRAINT users_email_unique      UNIQUE (email),
    CONSTRAINT users_username_unique   UNIQUE (username)
);

-- Index: fast lookup by email during authentication
CREATE INDEX idx_users_email        ON users (email);
-- Index: username search / mention autocomplete
CREATE INDEX idx_users_username     ON users (username);
-- Index: filter inactive users in joins
CREATE INDEX idx_users_is_active    ON users (is_active) WHERE is_active = TRUE;

COMMENT ON TABLE  users IS 'Core user accounts. timezone drives the daily win boundary.';
COMMENT ON COLUMN users.timezone IS 'IANA timezone identifier. Used server-side to compute date_key for wins.';

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at on users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLE: friendships
-- =============================================================================
-- Bidirectional friendship graph using a canonical ordering convention:
--   requester_id < addressee_id (by UUID text comparison) to avoid
--   duplicate rows for the same pair. Application layer must enforce this.
-- PRD §4.1: Feed content is restricted to accepted friends.
-- =============================================================================
CREATE TABLE friendships (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id    UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    addressee_id    UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status          friendship_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Prevent self-friendship
    CONSTRAINT friendships_no_self_ref CHECK (requester_id <> addressee_id),
    -- One row per unique pair (canonical order enforced by application)
    CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

-- Index: all friends of a given user (both directions)
CREATE INDEX idx_friendships_requester  ON friendships (requester_id, status);
CREATE INDEX idx_friendships_addressee  ON friendships (addressee_id, status);
-- Index: fast status filter for accepted-only queries
CREATE INDEX idx_friendships_accepted   ON friendships (requester_id, addressee_id)
    WHERE status = 'accepted';

CREATE TRIGGER trg_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE  friendships IS 'Bidirectional friend graph. One row per pair in canonical (requester < addressee) order.';
COMMENT ON COLUMN friendships.status IS 'pending → accepted → (blocked). Only accepted pairs can see each other feeds.';

-- =============================================================================
-- TABLE: wins
-- =============================================================================
-- Stores Tiny Win posts. The key business rule: exactly ONE win per user
-- per calendar day in the user's own timezone is enforced via:
--   1. Unique constraint on (author_id, date_key)
--   2. date_key is computed server-side as: DATE(created_at AT TIME ZONE user.timezone)
--
-- Idempotency: API must supply an idempotency_key (client-generated UUID)
-- to prevent double-submit (PRD §8, US-A3, US-A4).
-- =============================================================================
CREATE TABLE wins (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id           UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- The post body: 1-120 Unicode grapheme clusters (PRD §5, Rules #3-5)
    content             VARCHAR(120) NOT NULL,

    -- Calendar day in the author's own timezone (PRD §5, Rule #1)
    -- Stored as DATE so no timezone math needed for daily-limit queries.
    date_key            DATE        NOT NULL,

    -- Client-supplied idempotency key to prevent double-submit (PRD §8)
    idempotency_key     UUID        NOT NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- -------------------------------------------------------------------------
    -- CORE BUSINESS CONSTRAINT: 1 win per user per day (PRD §5, Rule #2)
    -- -------------------------------------------------------------------------
    CONSTRAINT wins_one_per_day        UNIQUE (author_id, date_key),

    -- Idempotency: re-submitting the same client key returns the existing row
    CONSTRAINT wins_idempotency_unique UNIQUE (idempotency_key),

    CONSTRAINT wins_content_not_blank  CHECK (char_length(trim(content)) >= 1),
    CONSTRAINT wins_content_max_len    CHECK (char_length(trim(content)) <= 120)
);

-- Index: fetch today's win for a user (most frequent read path)
CREATE INDEX idx_wins_author_date       ON wins (author_id, date_key DESC);

-- Index: build friend feed — fetch wins for a list of friend IDs on a date
CREATE INDEX idx_wins_date_key          ON wins (date_key DESC, author_id);

-- Index: idempotency lookup before insert
CREATE INDEX idx_wins_idempotency       ON wins (idempotency_key);

COMMENT ON TABLE  wins IS '1 Tiny Win per user per calendar day. date_key is DATE in user timezone, computed server-side.';
COMMENT ON COLUMN wins.date_key         IS 'DATE(created_at AT TIME ZONE users.timezone). Server-computed, never client-set.';
COMMENT ON COLUMN wins.idempotency_key  IS 'Client UUID for safe retry. Duplicate key returns existing win, HTTP 200.';
COMMENT ON COLUMN wins.content          IS '1-120 grapheme clusters after trim. Enforced on both client and server.';

-- =============================================================================
-- TABLE: reactions
-- =============================================================================
-- Each user may place at most one reaction per win (PRD §4.1, Rules #7-9).
-- Changing reaction = UPDATE; removing = DELETE.
-- No public aggregate counts in MVP (PRD §4.2 / anti-Instagram principle).
-- =============================================================================
CREATE TABLE reactions (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    win_id      UUID            NOT NULL REFERENCES wins (id) ON DELETE CASCADE,
    user_id     UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        reaction_type   NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- CORE CONSTRAINT: one reaction per user per win (PRD §8)
    CONSTRAINT reactions_unique_user_win UNIQUE (win_id, user_id)
);

-- Index: render reactions for a win (type + who reacted)
CREATE INDEX idx_reactions_win          ON reactions (win_id, type);

-- Index: "did current user react to this win?" — single-row lookup
CREATE INDEX idx_reactions_user_win     ON reactions (user_id, win_id);

-- Index: all reactions made by a user (analytics / profile view)
CREATE INDEX idx_reactions_user         ON reactions (user_id, created_at DESC);

CREATE TRIGGER trg_reactions_updated_at
    BEFORE UPDATE ON reactions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE  reactions IS 'One reaction per (user, win). UPSERT on type change; DELETE on toggle-off.';
COMMENT ON COLUMN reactions.type IS 'Enum: 🔥 | 👀 | 🤝. No other values permitted.';

-- =============================================================================
-- TABLE: streaks
-- =============================================================================
-- Materialised streak counters maintained by a background job / trigger.
-- Avoids expensive sequential scans of wins table on every profile load.
-- MVP uses these for internal analytics; public display is out-of-scope (PRD §4.2).
-- =============================================================================
CREATE TABLE streaks (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- Longest ever consecutive-day streak
    longest_streak      INTEGER     NOT NULL DEFAULT 0,

    -- Current consecutive-day streak (0 if no win today or yesterday)
    current_streak      INTEGER     NOT NULL DEFAULT 0,

    -- Date of the most recent win that extended the current streak
    last_win_date       DATE,

    -- Running total of wins for analytics
    total_wins          INTEGER     NOT NULL DEFAULT 0,

    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT streaks_unique_user      UNIQUE (user_id),
    CONSTRAINT streaks_current_gte_zero CHECK (current_streak >= 0),
    CONSTRAINT streaks_longest_gte_zero CHECK (longest_streak >= 0),
    CONSTRAINT streaks_longest_gte_cur  CHECK (longest_streak >= current_streak)
);

-- Index: leaderboard / analytics sorts (internal only in MVP)
CREATE INDEX idx_streaks_current   ON streaks (current_streak DESC);
CREATE INDEX idx_streaks_longest   ON streaks (longest_streak DESC);

COMMENT ON TABLE  streaks IS 'Denormalised streak counters. Updated by fn_update_streak() after each win INSERT.';

-- ---------------------------------------------------------------------------
-- FUNCTION + TRIGGER: update streaks automatically when a win is inserted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_streak()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_last_date      DATE;
    v_cur_streak     INTEGER;
    v_lng_streak     INTEGER;
    v_total          INTEGER;
BEGIN
    -- Fetch existing streak row (or defaults)
    SELECT last_win_date, current_streak, longest_streak, total_wins
      INTO v_last_date, v_cur_streak, v_lng_streak, v_total
      FROM streaks
     WHERE user_id = NEW.author_id;

    IF NOT FOUND THEN
        -- First ever win
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_win_date, total_wins)
        VALUES (NEW.author_id, 1, 1, NEW.date_key, 1);
    ELSE
        v_total := v_total + 1;

        IF v_last_date IS NULL THEN
            v_cur_streak := 1;
        ELSIF NEW.date_key = v_last_date + INTERVAL '1 day' THEN
            -- Consecutive day
            v_cur_streak := v_cur_streak + 1;
        ELSIF NEW.date_key > v_last_date THEN
            -- Gap detected — streak resets
            v_cur_streak := 1;
        END IF;
        -- Same date_key (idempotent re-insert) — no change to streak

        v_lng_streak := GREATEST(v_lng_streak, v_cur_streak);

        UPDATE streaks
           SET current_streak = v_cur_streak,
               longest_streak = v_lng_streak,
               last_win_date  = NEW.date_key,
               total_wins     = v_total,
               updated_at     = NOW()
         WHERE user_id = NEW.author_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wins_update_streak
    AFTER INSERT ON wins
    FOR EACH ROW EXECUTE FUNCTION fn_update_streak();

-- =============================================================================
-- VIEW: v_friend_feed
-- =============================================================================
-- Convenience view for the friend-feed API endpoint.
-- Returns today's wins from accepted friends.
-- The API layer MUST additionally verify the requesting user has posted today.
-- =============================================================================
CREATE OR REPLACE VIEW v_friend_feed AS
SELECT
    w.id            AS win_id,
    w.author_id,
    u.username,
    u.display_name,
    w.content,
    w.date_key,
    w.created_at
FROM wins w
JOIN users u ON u.id = w.author_id
WHERE u.is_active = TRUE;

COMMENT ON VIEW v_friend_feed IS
    'Base view for feed queries. Caller must join friendships and filter date_key = current date in user tz.';

-- =============================================================================
-- MATERIALIZED VIEW: mv_win_reaction_counts
-- =============================================================================
-- Aggregate reaction counts per win — refreshed by background job.
-- Not exposed publicly in MVP but used for internal analytics.
-- =============================================================================
CREATE MATERIALIZED VIEW mv_win_reaction_counts AS
SELECT
    win_id,
    type,
    COUNT(*) AS reaction_count
FROM reactions
GROUP BY win_id, type
WITH DATA;

CREATE UNIQUE INDEX idx_mv_reaction_counts ON mv_win_reaction_counts (win_id, type);

COMMENT ON MATERIALIZED VIEW mv_win_reaction_counts IS
    'Refreshed via: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_win_reaction_counts. Internal analytics only in MVP.';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Enable RLS on content tables to enforce server-side access control.
-- Application connects as role 'tinywin_app'; admin tasks use 'tinywin_admin'.
-- =============================================================================

ALTER TABLE wins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- wins: a user can read wins from themselves or accepted friends
CREATE POLICY pol_wins_select ON wins
    FOR SELECT
    USING (
        author_id = current_setting('app.current_user_id')::UUID
        OR author_id IN (
            SELECT CASE
                       WHEN requester_id = current_setting('app.current_user_id')::UUID THEN addressee_id
                       ELSE requester_id
                   END
            FROM friendships
            WHERE (requester_id = current_setting('app.current_user_id')::UUID
                   OR addressee_id = current_setting('app.current_user_id')::UUID)
              AND status = 'accepted'
        )
    );

-- wins: a user can only insert their own win
CREATE POLICY pol_wins_insert ON wins
    FOR INSERT
    WITH CHECK (author_id = current_setting('app.current_user_id')::UUID);

-- reactions: a user can see reactions on wins they can access (via feed)
CREATE POLICY pol_reactions_select ON reactions
    FOR SELECT USING (TRUE);   -- further filtered by application join

-- reactions: a user can only insert/update/delete their own reactions
CREATE POLICY pol_reactions_modify ON reactions
    FOR ALL
    USING  (user_id = current_setting('app.current_user_id')::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
-- Assumes role 'tinywin_app' is the application service account.
-- =============================================================================
-- CREATE ROLE tinywin_app LOGIN PASSWORD '***';
-- GRANT CONNECT ON DATABASE tinywin TO tinywin_app;
-- GRANT USAGE ON SCHEMA public TO tinywin_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tinywin_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tinywin_app;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
