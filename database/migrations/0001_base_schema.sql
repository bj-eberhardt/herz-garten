--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_categories (
    id uuid NOT NULL,
    content_type text NOT NULL,
    value text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    relationship_modes text[] DEFAULT '{}'::text[] NOT NULL,
    content_styles text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT content_categories_content_type_check CHECK ((content_type = ANY (ARRAY['daily-questions'::text, 'quests'::text, 'know-me-catalog'::text, 'love-jar-templates'::text, 'memories'::text])))
);


--
-- Name: content_category_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_category_translations (
    category_id uuid NOT NULL,
    locale text NOT NULL,
    label text NOT NULL
);


--
-- Name: content_style_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_style_translations (
    style_id uuid NOT NULL,
    locale text NOT NULL,
    label text NOT NULL
);


--
-- Name: content_styles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_styles (
    id uuid NOT NULL,
    value text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: couple_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.couple_members (
    couple_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'partner'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT couple_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'partner'::text])))
);


--
-- Name: couple_quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.couple_quests (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    quest_id uuid NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    completed_by_user_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    completed_at timestamp with time zone,
    reward_applied_at timestamp with time zone,
    CONSTRAINT couple_quests_status_check CHECK ((status = ANY (ARRAY['available'::text, 'accepted'::text, 'completed'::text])))
);


--
-- Name: couples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.couples (
    id uuid NOT NULL,
    invite_code text NOT NULL,
    relationship_type text DEFAULT 'mixed'::text NOT NULL,
    content_preference text DEFAULT 'balanced'::text NOT NULL,
    heart_points integer DEFAULT 0 NOT NULL,
    garden_stage integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_question_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_question_answers (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    question_id uuid NOT NULL,
    user_id uuid NOT NULL,
    answer_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_question_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_question_instances (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    question_id uuid NOT NULL,
    date date NOT NULL,
    reward_applied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_question_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_question_translations (
    question_id uuid NOT NULL,
    locale text NOT NULL,
    text text NOT NULL
);


--
-- Name: daily_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_questions (
    id uuid NOT NULL,
    category text NOT NULL,
    category_content_type text GENERATED ALWAYS AS ('daily-questions'::text) STORED,
    depth_level integer NOT NULL,
    long_distance_suitable boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT daily_questions_depth_level_check CHECK (((depth_level >= 1) AND (depth_level <= 4)))
);


--
-- Name: garden_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.garden_assets (
    key text NOT NULL,
    label text NOT NULL,
    source_types text[] DEFAULT '{}'::text[] NOT NULL,
    stage_unlock integer NOT NULL,
    image text NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    anchor_x numeric(4,3) NOT NULL,
    anchor_y numeric(4,3) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT garden_assets_anchor_x_check CHECK (((anchor_x >= (0)::numeric) AND (anchor_x <= (1)::numeric))),
    CONSTRAINT garden_assets_anchor_y_check CHECK (((anchor_y >= (0)::numeric) AND (anchor_y <= (1)::numeric))),
    CONSTRAINT garden_assets_height_check CHECK ((height > 0)),
    CONSTRAINT garden_assets_stage_unlock_check CHECK ((stage_unlock >= 1)),
    CONSTRAINT garden_assets_width_check CHECK ((width > 0))
);


--
-- Name: garden_level_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.garden_level_translations (
    level_id uuid NOT NULL,
    locale text NOT NULL,
    name text NOT NULL
);


--
-- Name: garden_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.garden_levels (
    id uuid NOT NULL,
    stage integer NOT NULL,
    points_to_next integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    area_key text NOT NULL,
    background_image text NOT NULL,
    accent text NOT NULL,
    CONSTRAINT garden_levels_points_to_next_check CHECK (((points_to_next IS NULL) OR (points_to_next > 0))),
    CONSTRAINT garden_levels_stage_check CHECK ((stage >= 1))
);


--
-- Name: garden_objects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.garden_objects (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    type text NOT NULL,
    source_type text NOT NULL,
    source_id uuid,
    label text NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    area_key text DEFAULT 'heart_bed'::text NOT NULL,
    asset_key text DEFAULT 'conversation_flower'::text NOT NULL,
    z_index integer DEFAULT 1 NOT NULL,
    scale numeric(4,2) DEFAULT 1 NOT NULL,
    rotation integer DEFAULT 0 NOT NULL,
    placed_by_user boolean DEFAULT false NOT NULL,
    reward_points integer DEFAULT 0 NOT NULL,
    CONSTRAINT garden_objects_source_type_check CHECK ((source_type = ANY (ARRAY['question'::text, 'quest'::text, 'memory'::text, 'love_jar'::text, 'milestone'::text, 'know_me'::text]))),
    CONSTRAINT garden_objects_type_check CHECK ((type = ANY (ARRAY['flower'::text, 'tree'::text, 'bench'::text, 'light'::text, 'stone'::text, 'pond'::text, 'decoration'::text])))
);


--
-- Name: know_me_catalog_question_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.know_me_catalog_question_translations (
    catalog_question_id uuid NOT NULL,
    locale text NOT NULL,
    question_text text NOT NULL,
    category_label text NOT NULL
);


--
-- Name: know_me_catalog_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.know_me_catalog_questions (
    id uuid NOT NULL,
    category text NOT NULL,
    category_content_type text GENERATED ALWAYS AS ('know-me-catalog'::text) STORED,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: know_me_guesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.know_me_guesses (
    id uuid NOT NULL,
    question_id uuid NOT NULL,
    user_id uuid NOT NULL,
    selected_option_index integer NOT NULL,
    is_correct boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT know_me_guesses_selected_option_index_check CHECK (((selected_option_index >= 0) AND (selected_option_index <= 3)))
);


--
-- Name: know_me_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.know_me_questions (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    author_id uuid NOT NULL,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_option_index integer NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    reward_applied_at timestamp with time zone,
    answered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    catalog_question_id uuid,
    CONSTRAINT know_me_questions_check CHECK ((correct_option_index < jsonb_array_length(options))),
    CONSTRAINT know_me_questions_correct_option_index_check CHECK (((correct_option_index >= 0) AND (correct_option_index <= 3))),
    CONSTRAINT know_me_questions_options_check CHECK ((jsonb_typeof(options) = 'array'::text)),
    CONSTRAINT know_me_questions_options_check1 CHECK (((jsonb_array_length(options) >= 2) AND (jsonb_array_length(options) <= 4))),
    CONSTRAINT know_me_questions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'answered'::text])))
);


--
-- Name: love_jar_draws; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.love_jar_draws (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    user_id uuid NOT NULL,
    note_id uuid NOT NULL,
    drawn_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: love_jar_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.love_jar_notes (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    author_id uuid NOT NULL,
    text text NOT NULL,
    category text NOT NULL,
    category_content_type text GENERATED ALWAYS AS ('love-jar-templates'::text) STORED,
    is_drawn boolean DEFAULT false NOT NULL,
    drawn_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: love_jar_template_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.love_jar_template_translations (
    template_id uuid NOT NULL,
    locale text NOT NULL,
    text text NOT NULL
);


--
-- Name: love_jar_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.love_jar_templates (
    id uuid NOT NULL,
    category text DEFAULT 'compliment'::text NOT NULL,
    category_content_type text GENERATED ALWAYS AS ('love-jar-templates'::text) STORED,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: memory_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memory_entries (
    id uuid NOT NULL,
    couple_id uuid NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    date date NOT NULL,
    image_url text,
    category text NOT NULL,
    category_content_type text GENERATED ALWAYS AS ('memories'::text) STORED,
    linked_garden_object_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: message_template_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_template_translations (
    template_key text NOT NULL,
    locale text NOT NULL,
    text text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_templates (
    key text NOT NULL,
    namespace text NOT NULL,
    required_params text[] DEFAULT '{}'::text[] NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    couple_id uuid,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    source_type text NOT NULL,
    source_id uuid,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title_key text,
    body_key text,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['daily_answer_waiting'::text, 'daily_revealed'::text, 'quest_waiting_confirmation'::text, 'quest_completed'::text, 'love_jar_note'::text, 'memory_created'::text, 'know_me_question'::text, 'know_me_answered'::text, 'couple_disconnected'::text, 'couple_joined'::text, 'admin_password_reset'::text])))
);


--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_requests (
    id uuid NOT NULL,
    email_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    display_name text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    password_hash text NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_success_at timestamp with time zone,
    last_failure_at timestamp with time zone,
    failure_count integer DEFAULT 0 NOT NULL,
    disabled_at timestamp with time zone
);


--
-- Name: quest_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_translations (
    quest_id uuid NOT NULL,
    locale text NOT NULL,
    title text NOT NULL,
    description text NOT NULL
);


--
-- Name: quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quests (
    id uuid NOT NULL,
    category text NOT NULL,
    category_content_type text GENERATED ALWAYS AS ('quests'::text) STORED,
    estimated_minutes integer NOT NULL,
    effort_level text NOT NULL,
    reward_points integer DEFAULT 0 NOT NULL,
    reward_seed_type text,
    requires_both_partners boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT quests_effort_level_check CHECK ((effort_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: relationship_mode_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relationship_mode_translations (
    mode_id uuid NOT NULL,
    locale text NOT NULL,
    label text NOT NULL
);


--
-- Name: relationship_modes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relationship_modes (
    id uuid NOT NULL,
    value text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supported_locales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supported_locales (
    locale text NOT NULL,
    label text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL
);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: content_categories content_categories_content_type_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_categories
    ADD CONSTRAINT content_categories_content_type_value_key UNIQUE (content_type, value);


--
-- Name: content_categories content_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_categories
    ADD CONSTRAINT content_categories_pkey PRIMARY KEY (id);


--
-- Name: content_category_translations content_category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_category_translations
    ADD CONSTRAINT content_category_translations_pkey PRIMARY KEY (category_id, locale);


--
-- Name: content_style_translations content_style_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_style_translations
    ADD CONSTRAINT content_style_translations_pkey PRIMARY KEY (style_id, locale);


--
-- Name: content_styles content_styles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_styles
    ADD CONSTRAINT content_styles_pkey PRIMARY KEY (id);


--
-- Name: content_styles content_styles_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_styles
    ADD CONSTRAINT content_styles_value_key UNIQUE (value);


--
-- Name: couple_members couple_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couple_members
    ADD CONSTRAINT couple_members_pkey PRIMARY KEY (couple_id, user_id);


--
-- Name: couple_quests couple_quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couple_quests
    ADD CONSTRAINT couple_quests_pkey PRIMARY KEY (id);


--
-- Name: couples couples_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couples
    ADD CONSTRAINT couples_invite_code_key UNIQUE (invite_code);


--
-- Name: couples couples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couples
    ADD CONSTRAINT couples_pkey PRIMARY KEY (id);


--
-- Name: daily_question_answers daily_question_answers_couple_id_question_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_answers
    ADD CONSTRAINT daily_question_answers_couple_id_question_id_user_id_key UNIQUE (couple_id, question_id, user_id);


--
-- Name: daily_question_answers daily_question_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_answers
    ADD CONSTRAINT daily_question_answers_pkey PRIMARY KEY (id);


--
-- Name: daily_question_instances daily_question_instances_couple_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_instances
    ADD CONSTRAINT daily_question_instances_couple_id_date_key UNIQUE (couple_id, date);


--
-- Name: daily_question_instances daily_question_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_instances
    ADD CONSTRAINT daily_question_instances_pkey PRIMARY KEY (id);


--
-- Name: daily_question_translations daily_question_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_translations
    ADD CONSTRAINT daily_question_translations_pkey PRIMARY KEY (question_id, locale);


--
-- Name: daily_questions daily_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_questions
    ADD CONSTRAINT daily_questions_pkey PRIMARY KEY (id);


--
-- Name: garden_assets garden_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_assets
    ADD CONSTRAINT garden_assets_pkey PRIMARY KEY (key);


--
-- Name: garden_level_translations garden_level_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_level_translations
    ADD CONSTRAINT garden_level_translations_pkey PRIMARY KEY (level_id, locale);


--
-- Name: garden_levels garden_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_levels
    ADD CONSTRAINT garden_levels_pkey PRIMARY KEY (id);


--
-- Name: garden_levels garden_levels_stage_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_levels
    ADD CONSTRAINT garden_levels_stage_key UNIQUE (stage);


--
-- Name: garden_objects garden_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_objects
    ADD CONSTRAINT garden_objects_pkey PRIMARY KEY (id);


--
-- Name: know_me_catalog_question_translations know_me_catalog_question_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_catalog_question_translations
    ADD CONSTRAINT know_me_catalog_question_translations_pkey PRIMARY KEY (catalog_question_id, locale);


--
-- Name: know_me_catalog_questions know_me_catalog_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_catalog_questions
    ADD CONSTRAINT know_me_catalog_questions_pkey PRIMARY KEY (id);


--
-- Name: know_me_guesses know_me_guesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_guesses
    ADD CONSTRAINT know_me_guesses_pkey PRIMARY KEY (id);


--
-- Name: know_me_guesses know_me_guesses_question_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_guesses
    ADD CONSTRAINT know_me_guesses_question_id_user_id_key UNIQUE (question_id, user_id);


--
-- Name: know_me_questions know_me_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_questions
    ADD CONSTRAINT know_me_questions_pkey PRIMARY KEY (id);


--
-- Name: love_jar_draws love_jar_draws_couple_id_user_id_drawn_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_draws
    ADD CONSTRAINT love_jar_draws_couple_id_user_id_drawn_date_key UNIQUE (couple_id, user_id, drawn_date);


--
-- Name: love_jar_draws love_jar_draws_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_draws
    ADD CONSTRAINT love_jar_draws_pkey PRIMARY KEY (id);


--
-- Name: love_jar_notes love_jar_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_notes
    ADD CONSTRAINT love_jar_notes_pkey PRIMARY KEY (id);


--
-- Name: love_jar_template_translations love_jar_template_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_template_translations
    ADD CONSTRAINT love_jar_template_translations_pkey PRIMARY KEY (template_id, locale);


--
-- Name: love_jar_templates love_jar_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_templates
    ADD CONSTRAINT love_jar_templates_pkey PRIMARY KEY (id);


--
-- Name: memory_entries memory_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT memory_entries_pkey PRIMARY KEY (id);


--
-- Name: message_template_translations message_template_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_template_translations
    ADD CONSTRAINT message_template_translations_pkey PRIMARY KEY (template_key, locale);


--
-- Name: message_templates message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_pkey PRIMARY KEY (key);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: quest_translations quest_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_translations
    ADD CONSTRAINT quest_translations_pkey PRIMARY KEY (quest_id, locale);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: relationship_mode_translations relationship_mode_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationship_mode_translations
    ADD CONSTRAINT relationship_mode_translations_pkey PRIMARY KEY (mode_id, locale);


--
-- Name: relationship_modes relationship_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationship_modes
    ADD CONSTRAINT relationship_modes_pkey PRIMARY KEY (id);


--
-- Name: relationship_modes relationship_modes_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationship_modes
    ADD CONSTRAINT relationship_modes_value_key UNIQUE (value);


--
-- Name: supported_locales supported_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supported_locales
    ADD CONSTRAINT supported_locales_pkey PRIMARY KEY (locale);


--
-- Name: admin_audit_log_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: content_categories_content_styles_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_categories_content_styles_gin_idx ON public.content_categories USING gin (content_styles);


--
-- Name: content_categories_relationship_modes_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_categories_relationship_modes_gin_idx ON public.content_categories USING gin (relationship_modes);


--
-- Name: content_categories_type_active_sort_value_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_categories_type_active_sort_value_idx ON public.content_categories USING btree (content_type, active, sort_order, value);


--
-- Name: couple_members_user_couple_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX couple_members_user_couple_idx ON public.couple_members USING btree (user_id, couple_id);


--
-- Name: couple_quests_couple_completed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX couple_quests_couple_completed_idx ON public.couple_quests USING btree (couple_id, completed_at);


--
-- Name: couples_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX couples_created_idx ON public.couples USING btree (created_at DESC);


--
-- Name: couples_invite_code_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX couples_invite_code_lower_idx ON public.couples USING btree (lower(invite_code));


--
-- Name: daily_question_answers_couple_question_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_question_answers_couple_question_created_idx ON public.daily_question_answers USING btree (couple_id, question_id, created_at);


--
-- Name: daily_question_answers_user_couple_question_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_question_answers_user_couple_question_idx ON public.daily_question_answers USING btree (user_id, couple_id, question_id);


--
-- Name: daily_question_instances_couple_question_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_question_instances_couple_question_date_idx ON public.daily_question_instances USING btree (couple_id, question_id, date);


--
-- Name: daily_questions_active_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_questions_active_category_idx ON public.daily_questions USING btree (active, category);


--
-- Name: garden_levels_area_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX garden_levels_area_key_idx ON public.garden_levels USING btree (area_key);


--
-- Name: garden_objects_area_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX garden_objects_area_created_idx ON public.garden_objects USING btree (couple_id, area_key, created_at);


--
-- Name: garden_objects_couple_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX garden_objects_couple_created_idx ON public.garden_objects USING btree (couple_id, created_at);


--
-- Name: garden_objects_couple_source_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX garden_objects_couple_source_created_idx ON public.garden_objects USING btree (couple_id, source_type, source_id, created_at DESC) WHERE (source_id IS NOT NULL);


--
-- Name: know_me_catalog_questions_active_category_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX know_me_catalog_questions_active_category_sort_idx ON public.know_me_catalog_questions USING btree (active, category, sort_order);


--
-- Name: know_me_questions_author_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX know_me_questions_author_idx ON public.know_me_questions USING btree (author_id);


--
-- Name: know_me_questions_catalog_author_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX know_me_questions_catalog_author_idx ON public.know_me_questions USING btree (couple_id, author_id, catalog_question_id) WHERE (catalog_question_id IS NOT NULL);


--
-- Name: know_me_questions_couple_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX know_me_questions_couple_created_idx ON public.know_me_questions USING btree (couple_id, created_at DESC);


--
-- Name: love_jar_draws_couple_user_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX love_jar_draws_couple_user_date_idx ON public.love_jar_draws USING btree (couple_id, user_id, drawn_date DESC);


--
-- Name: love_jar_notes_author_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX love_jar_notes_author_idx ON public.love_jar_notes USING btree (author_id);


--
-- Name: love_jar_notes_couple_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX love_jar_notes_couple_created_idx ON public.love_jar_notes USING btree (couple_id, created_at DESC);


--
-- Name: love_jar_notes_couple_unread_author_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX love_jar_notes_couple_unread_author_idx ON public.love_jar_notes USING btree (couple_id, author_id) WHERE (is_drawn = false);


--
-- Name: love_jar_templates_active_category_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX love_jar_templates_active_category_sort_idx ON public.love_jar_templates USING btree (active, category, sort_order);


--
-- Name: memory_entries_author_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX memory_entries_author_idx ON public.memory_entries USING btree (author_id);


--
-- Name: memory_entries_couple_date_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX memory_entries_couple_date_created_idx ON public.memory_entries USING btree (couple_id, date DESC, created_at DESC);


--
-- Name: message_templates_namespace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_templates_namespace_idx ON public.message_templates USING btree (namespace, key);


--
-- Name: notifications_couple_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_couple_created_idx ON public.notifications USING btree (couple_id, created_at DESC) WHERE (couple_id IS NOT NULL);


--
-- Name: notifications_dedupe_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notifications_dedupe_source_idx ON public.notifications USING btree (user_id, type, source_type, source_id) WHERE (source_id IS NOT NULL);


--
-- Name: notifications_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: notifications_user_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_unread_idx ON public.notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);


--
-- Name: one_couple_quest_per_quest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_couple_quest_per_quest ON public.couple_quests USING btree (couple_id, quest_id);


--
-- Name: one_know_me_garden_object_per_question; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_know_me_garden_object_per_question ON public.garden_objects USING btree (source_type, source_id) WHERE ((source_type = 'know_me'::text) AND (source_id IS NOT NULL));


--
-- Name: one_love_jar_light_per_note; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_love_jar_light_per_note ON public.garden_objects USING btree (source_type, source_id) WHERE ((source_type = 'love_jar'::text) AND (source_id IS NOT NULL));


--
-- Name: one_memory_stone_per_entry; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_memory_stone_per_entry ON public.garden_objects USING btree (source_type, source_id) WHERE ((source_type = 'memory'::text) AND (source_id IS NOT NULL));


--
-- Name: one_quest_reward_object_per_couple_quest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_quest_reward_object_per_couple_quest ON public.garden_objects USING btree (source_type, source_id) WHERE ((source_type = 'quest'::text) AND (source_id IS NOT NULL));


--
-- Name: one_question_reward_object_per_instance; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_question_reward_object_per_instance ON public.garden_objects USING btree (source_type, source_id) WHERE ((source_type = 'question'::text) AND (source_id IS NOT NULL));


--
-- Name: password_reset_requests_email_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_requests_email_created_idx ON public.password_reset_requests USING btree (email_hash, created_at DESC);


--
-- Name: password_reset_tokens_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_expires_idx ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: password_reset_tokens_user_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_user_active_idx ON public.password_reset_tokens USING btree (user_id, created_at DESC) WHERE (used_at IS NULL);


--
-- Name: profiles_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_created_idx ON public.profiles USING btree (created_at DESC);


--
-- Name: push_subscriptions_endpoint_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX push_subscriptions_endpoint_idx ON public.push_subscriptions USING btree (endpoint);


--
-- Name: push_subscriptions_user_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_subscriptions_user_active_idx ON public.push_subscriptions USING btree (user_id, updated_at DESC) WHERE (disabled_at IS NULL);


--
-- Name: quests_active_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quests_active_category_idx ON public.quests USING btree (active, category);


--
-- Name: supported_locales_single_default_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX supported_locales_single_default_idx ON public.supported_locales USING btree (is_default) WHERE (is_default = true);


--
-- Name: content_category_translations content_category_translations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_category_translations
    ADD CONSTRAINT content_category_translations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.content_categories(id) ON DELETE CASCADE;


--
-- Name: content_category_translations content_category_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_category_translations
    ADD CONSTRAINT content_category_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: content_style_translations content_style_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_style_translations
    ADD CONSTRAINT content_style_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: content_style_translations content_style_translations_style_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_style_translations
    ADD CONSTRAINT content_style_translations_style_id_fkey FOREIGN KEY (style_id) REFERENCES public.content_styles(id) ON DELETE CASCADE;


--
-- Name: couple_members couple_members_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couple_members
    ADD CONSTRAINT couple_members_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: couple_members couple_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couple_members
    ADD CONSTRAINT couple_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: couple_quests couple_quests_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couple_quests
    ADD CONSTRAINT couple_quests_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: couple_quests couple_quests_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couple_quests
    ADD CONSTRAINT couple_quests_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: daily_question_answers daily_question_answers_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_answers
    ADD CONSTRAINT daily_question_answers_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: daily_question_answers daily_question_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_answers
    ADD CONSTRAINT daily_question_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.daily_questions(id) ON DELETE RESTRICT;


--
-- Name: daily_question_answers daily_question_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_answers
    ADD CONSTRAINT daily_question_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: daily_question_instances daily_question_instances_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_instances
    ADD CONSTRAINT daily_question_instances_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: daily_question_instances daily_question_instances_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_instances
    ADD CONSTRAINT daily_question_instances_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.daily_questions(id) ON DELETE RESTRICT;


--
-- Name: daily_question_translations daily_question_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_translations
    ADD CONSTRAINT daily_question_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: daily_question_translations daily_question_translations_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_question_translations
    ADD CONSTRAINT daily_question_translations_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.daily_questions(id) ON DELETE CASCADE;


--
-- Name: daily_questions daily_questions_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_questions
    ADD CONSTRAINT daily_questions_category_fkey FOREIGN KEY (category_content_type, category) REFERENCES public.content_categories(content_type, value) ON DELETE RESTRICT;


--
-- Name: garden_level_translations garden_level_translations_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_level_translations
    ADD CONSTRAINT garden_level_translations_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.garden_levels(id) ON DELETE CASCADE;


--
-- Name: garden_level_translations garden_level_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_level_translations
    ADD CONSTRAINT garden_level_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: garden_objects garden_objects_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garden_objects
    ADD CONSTRAINT garden_objects_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: know_me_catalog_question_translations know_me_catalog_question_translations_catalog_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_catalog_question_translations
    ADD CONSTRAINT know_me_catalog_question_translations_catalog_question_id_fkey FOREIGN KEY (catalog_question_id) REFERENCES public.know_me_catalog_questions(id) ON DELETE CASCADE;


--
-- Name: know_me_catalog_question_translations know_me_catalog_question_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_catalog_question_translations
    ADD CONSTRAINT know_me_catalog_question_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: know_me_catalog_questions know_me_catalog_questions_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_catalog_questions
    ADD CONSTRAINT know_me_catalog_questions_category_fkey FOREIGN KEY (category_content_type, category) REFERENCES public.content_categories(content_type, value) ON DELETE RESTRICT;


--
-- Name: know_me_guesses know_me_guesses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_guesses
    ADD CONSTRAINT know_me_guesses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.know_me_questions(id) ON DELETE CASCADE;


--
-- Name: know_me_guesses know_me_guesses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_guesses
    ADD CONSTRAINT know_me_guesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: know_me_questions know_me_questions_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_questions
    ADD CONSTRAINT know_me_questions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: know_me_questions know_me_questions_catalog_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_questions
    ADD CONSTRAINT know_me_questions_catalog_question_id_fkey FOREIGN KEY (catalog_question_id) REFERENCES public.know_me_catalog_questions(id) ON DELETE SET NULL;


--
-- Name: know_me_questions know_me_questions_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.know_me_questions
    ADD CONSTRAINT know_me_questions_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: love_jar_draws love_jar_draws_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_draws
    ADD CONSTRAINT love_jar_draws_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: love_jar_draws love_jar_draws_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_draws
    ADD CONSTRAINT love_jar_draws_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.love_jar_notes(id) ON DELETE CASCADE;


--
-- Name: love_jar_draws love_jar_draws_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_draws
    ADD CONSTRAINT love_jar_draws_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: love_jar_notes love_jar_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_notes
    ADD CONSTRAINT love_jar_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: love_jar_notes love_jar_notes_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_notes
    ADD CONSTRAINT love_jar_notes_category_fkey FOREIGN KEY (category_content_type, category) REFERENCES public.content_categories(content_type, value) ON DELETE RESTRICT;


--
-- Name: love_jar_notes love_jar_notes_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_notes
    ADD CONSTRAINT love_jar_notes_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: love_jar_template_translations love_jar_template_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_template_translations
    ADD CONSTRAINT love_jar_template_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: love_jar_template_translations love_jar_template_translations_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_template_translations
    ADD CONSTRAINT love_jar_template_translations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.love_jar_templates(id) ON DELETE CASCADE;


--
-- Name: love_jar_templates love_jar_templates_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.love_jar_templates
    ADD CONSTRAINT love_jar_templates_category_fkey FOREIGN KEY (category_content_type, category) REFERENCES public.content_categories(content_type, value) ON DELETE RESTRICT;


--
-- Name: memory_entries memory_entries_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT memory_entries_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: memory_entries memory_entries_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT memory_entries_category_fkey FOREIGN KEY (category_content_type, category) REFERENCES public.content_categories(content_type, value) ON DELETE RESTRICT;


--
-- Name: memory_entries memory_entries_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT memory_entries_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: memory_entries memory_entries_linked_garden_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT memory_entries_linked_garden_object_id_fkey FOREIGN KEY (linked_garden_object_id) REFERENCES public.garden_objects(id) ON DELETE SET NULL;


--
-- Name: message_template_translations message_template_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_template_translations
    ADD CONSTRAINT message_template_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: message_template_translations message_template_translations_template_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_template_translations
    ADD CONSTRAINT message_template_translations_template_key_fkey FOREIGN KEY (template_key) REFERENCES public.message_templates(key) ON DELETE CASCADE;


--
-- Name: notifications notifications_couple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: quest_translations quest_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_translations
    ADD CONSTRAINT quest_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: quest_translations quest_translations_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_translations
    ADD CONSTRAINT quest_translations_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: quests quests_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_category_fkey FOREIGN KEY (category_content_type, category) REFERENCES public.content_categories(content_type, value) ON DELETE RESTRICT;


--
-- Name: relationship_mode_translations relationship_mode_translations_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationship_mode_translations
    ADD CONSTRAINT relationship_mode_translations_locale_fkey FOREIGN KEY (locale) REFERENCES public.supported_locales(locale) ON DELETE RESTRICT;


--
-- Name: relationship_mode_translations relationship_mode_translations_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationship_mode_translations
    ADD CONSTRAINT relationship_mode_translations_mode_id_fkey FOREIGN KEY (mode_id) REFERENCES public.relationship_modes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


