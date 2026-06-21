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
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.app_settings (key, value, updated_at) VALUES ('auth.adminJwtTtlMinutes', '60', '2026-06-18 04:26:15.180793+00');
INSERT INTO public.app_settings (key, value, updated_at) VALUES ('auth.userJwtTtlMinutes', '10080', '2026-06-18 04:26:15.180793+00');


--
-- Data for Name: content_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('8f793a49-6df2-4eb7-bf19-4f3af9c63314', 'daily-questions', 'everyday', true, 40, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('f74f7a74-9eaf-4b21-9726-bd9c3e9cc0cd', 'know-me-catalog', 'date', true, 30, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{local,mixed}', '{balanced,romantic,playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('11178257-cb88-4ac8-bb7b-6f1646b3a876', 'know-me-catalog', 'memory', true, 40, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance,mixed}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('defeb1fc-a507-40e4-b64e-a452faafe3b8', 'know-me-catalog', 'music', true, 70, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance,mixed}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('81c77f24-ba21-4f06-9805-6859ed2faba2', 'know-me-catalog', 'travel', true, 90, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance,mixed}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('bd2f8bb8-492f-40e5-a457-d5f8b0230f40', 'know-me-catalog', 'adventure', true, 10, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('5afafe00-e77a-4909-8f48-c4610d7bf05d', 'know-me-catalog', 'humor', true, 60, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('cbddddee-04c0-4148-b3f3-5481134c5513', 'know-me-catalog', 'stress', true, 120, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('bbec34f7-4a34-4b86-94c5-73e3b460d6ee', 'daily-questions', 'teamwork', true, 130, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('7cf515ef-d2d3-4005-a2b5-fc0c15211771', 'quests', 'teamwork', true, 60, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('98d138d8-cc52-4f03-aa94-b13d22e4c228', 'daily-questions', 'connection', true, 10, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('3b98d0e8-125b-486b-a658-03474952f0d6', 'daily-questions', 'gratitude', true, 60, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('98e5485f-be1a-41f4-ac82-5b01ff4fce57', 'daily-questions', 'romance', true, 110, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('3f0b635c-1f09-4307-a4d6-333ae27c78b5', 'quests', 'romance', true, 50, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('4e062a47-84ff-4fa4-aecb-0e1e631fda4d', 'daily-questions', 'date', true, 20, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('2dad4c76-93d6-4637-ab48-ae7463b4a6ad', 'daily-questions', 'humor', true, 70, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('3717b3b7-0b1e-433a-b0d9-97d060d87cbb', 'daily-questions', 'ritual', true, 100, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('a7be19bc-87e1-4100-8b9c-bee8d8d56dce', 'quests', 'date', true, 10, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('83d8bdb5-52dc-47e3-8571-66172e8fa528', 'quests', 'humor', true, 20, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('361a26c1-374b-4b61-a81c-df5c1531dca6', 'daily-questions', 'deep', true, 30, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('ecf43929-5488-4e95-9634-d132e1a72adf', 'daily-questions', 'future', true, 50, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('c6416028-cd31-405f-a012-33d215d4316a', 'daily-questions', 'memory', true, 90, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('f9b0a19c-af2b-4977-8ac1-844820fb8a6d', 'daily-questions', 'support', true, 120, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('5ef346f7-9532-41df-b7db-f90d504988b5', 'daily-questions', 'trust', true, 140, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('1f26de1c-46e3-404a-baae-503056f464a8', 'quests', 'memory', true, 40, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('9e5d5d1b-7e0a-46a3-ba57-66c439cdadb1', 'daily-questions', 'long_distance', true, 80, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('61dd6f56-d02d-4a35-a5d9-f6cb681a321e', 'quests', 'long_distance', true, 30, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('72b5ce9d-d3b2-4ad0-b566-242305eeaf34', 'know-me-catalog', 'everyday', true, 20, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('78153f90-eb53-4d28-86be-7bc5ac5a8173', 'know-me-catalog', 'free_time', true, 50, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('fa8e6fc2-d354-4907-b2a4-ed37bcdd2ecb', 'know-me-catalog', 'closeness', true, 80, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('d957d633-990b-4df9-aa71-0ee2f149112a', 'know-me-catalog', 'ritual', true, 100, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('6414c79b-dbc6-49a5-9598-fbf9e0d6af91', 'know-me-catalog', 'calm', true, 110, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('ffe0c9b9-c696-4116-9847-8b090496e200', 'know-me-catalog', 'support', true, 130, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('0683a5c6-fdbb-4cd5-b7b0-2b33da9c5a89', 'love-jar-templates', 'voucher', true, 40, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('97f307d1-9c0a-414a-be1f-516e85ab3bad', 'love-jar-templates', 'wish', true, 50, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('46bcbf7c-a2ee-4681-8574-dc7c03187a0a', 'memories', 'everyday', true, 10, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('924cc61e-c8b6-41a2-915c-ec9e84438a60', 'memories', 'travel', true, 30, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('47f8a01c-a387-4ddc-977a-f3be24ff2ad3', 'memories', 'special', true, 60, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('ab9b4983-28d9-47bc-ae0b-4578132b2589', 'love-jar-templates', 'compliment', true, 10, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('2d5f9aae-ae3e-449d-809f-a2b72fe4054b', 'love-jar-templates', 'surprise', true, 30, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('b53ebb22-2fcc-401a-9685-12cb26303de7', 'memories', 'date', true, 20, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('fd937429-53d1-4545-8ca7-597c164b2817', 'memories', 'funny', true, 50, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('a88157f9-484d-4977-9e5c-0887a6b29df2', 'love-jar-templates', 'memory', true, 20, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('29ef76a9-168a-473b-bc3c-2acc4ce3f4dd', 'memories', 'milestone', true, 40, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('fb4c9621-f448-450c-bafb-3a3a00254a5d', 'know-me-catalog', 'connection', true, 160, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('6fcbe584-95cf-452b-bc13-bb992664acc8', 'know-me-catalog', 'preferences', true, 170, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('0dd2e84f-4f9f-454e-ba74-47d481514a60', 'know-me-catalog', 'home', true, 190, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('be554430-552d-4170-a0f1-50b73f248c61', 'know-me-catalog', 'surprise', true, 150, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{local,mixed}', '{balanced,romantic,playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('afc001c9-7d06-4beb-9c7d-77f7be0c8b49', 'know-me-catalog', 'future', true, 180, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance,mixed}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('828560d6-b686-4896-8467-4ba5a4d4bc90', 'know-me-catalog', 'depth', true, 140, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('eb7f8f02-e8d6-491f-97e1-6a8dfbaa8562', 'daily-questions', 'conflict_repair', true, 150, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('49d5ec67-d0d8-4511-a930-2e07afeb20c2', 'daily-questions', 'needs', true, 160, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('d14c1f53-51fb-46d0-83ec-5e3d5554b8fd', 'daily-questions', 'boundaries', true, 170, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('5c173fc7-b9f2-4753-9334-b9a0f8762b23', 'daily-questions', 'intimacy', true, 180, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('9fdf79e7-3bc2-430f-88f3-12a0a47bc844', 'daily-questions', 'appreciation', true, 190, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('a587b4f9-09f7-45c9-bd31-6abb2f0c6926', 'daily-questions', 'everyday_dreams', true, 200, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('14776e66-f423-45a6-a683-20c9a454afbe', 'quests', 'care', true, 70, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('6cf1587c-01e8-4543-84ff-85de6cb58e28', 'quests', 'creativity', true, 80, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('b29bd2eb-a552-4b6a-a6cc-485826a14310', 'quests', 'household_team', true, 90, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('8f3e70e5-9563-497c-9f67-3f621bbfa601', 'quests', 'outdoors', true, 100, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{local,mixed}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('2548096e-6c48-49ef-83c6-3ee7e4431b57', 'quests', 'digital_distance', true, 110, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance,mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('927331ad-60bf-4d2c-8f03-2bad43cb0d68', 'quests', 'surprise', true, 120, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic,playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('279250f1-ae52-4dcf-b72d-3611856ab6e7', 'know-me-catalog', 'family', true, 200, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('03c9e73f-6d6b-4b37-bb50-15d1e124e957', 'know-me-catalog', 'childhood', true, 210, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('e19dbb2e-467f-48b2-9ba6-6f8478478900', 'know-me-catalog', 'values', true, 220, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('12401895-79ac-4064-b474-e69d9383cc36', 'know-me-catalog', 'wellbeing', true, 230, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('745d3395-73e4-481d-b6f2-ec8da80c49da', 'know-me-catalog', 'food', true, 240, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{balanced,playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('ca150bf0-1bd4-4b16-bb51-ff7b62e6f7be', 'know-me-catalog', 'work_goals', true, 250, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('b8d6e758-64a9-4d27-bcd8-6b5a31d30f26', 'know-me-catalog', 'sex', true, 260, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{mixed}', '{romantic,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('5019e8b6-4604-49c3-9aa2-3409994cbed4', 'love-jar-templates', 'gratitude', true, 60, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('2e29134b-5e4c-4317-a841-6717245233ec', 'love-jar-templates', 'encouragement', true, 70, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('72a9eabb-d1b8-4177-96ae-aa8eeae816d7', 'love-jar-templates', 'longing', true, 80, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{long_distance}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('aadd71b3-6f65-4b89-b7f1-f21a154a5fd3', 'love-jar-templates', 'invitation', true, 90, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{playful}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('d3ed8edf-5a35-47e3-9ca8-4f28594e7a63', 'love-jar-templates', 'apology', true, 100, '2026-06-18 04:26:14.413007+00', '2026-06-18 04:26:14.433234+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('02cda105-9338-4102-8587-2f0a1abd34c6', 'memories', 'anniversaries', true, 70, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{romantic,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('47ab0026-33c7-4c2b-b162-d9862f0de2a6', 'memories', 'first_times', true, 80, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{romantic}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('f9b723ed-df79-4040-aa3f-c3372921e3e6', 'memories', 'small_moments', true, 90, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{balanced}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('a805beb4-b90e-47fb-b084-c13cd5aca5f2', 'memories', 'shared_successes', true, 100, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{balanced,deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('a60c34fb-484a-43fa-9a4a-393b47bec881', 'memories', 'challenges', true, 110, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{deep}');
INSERT INTO public.content_categories (id, content_type, value, active, sort_order, created_at, updated_at, relationship_modes, content_styles) VALUES ('8701bb0d-363b-443c-8ebe-3464f20d9859', 'memories', 'favorite_places', true, 120, '2026-06-18 04:26:14.525198+00', '2026-06-18 04:26:14.542477+00', '{}', '{romantic,balanced}');


--
-- Data for Name: supported_locales; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.supported_locales (locale, label, active, is_default) VALUES ('de', 'Deutsch', true, true);
INSERT INTO public.supported_locales (locale, label, active, is_default) VALUES ('en', 'English', true, false);


--
-- Data for Name: content_category_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('98d138d8-cc52-4f03-aa94-b13d22e4c228', 'en', 'Connection');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('98d138d8-cc52-4f03-aa94-b13d22e4c228', 'de', 'Verbindung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('4e062a47-84ff-4fa4-aecb-0e1e631fda4d', 'en', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('4e062a47-84ff-4fa4-aecb-0e1e631fda4d', 'de', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('361a26c1-374b-4b61-a81c-df5c1531dca6', 'en', 'Deep conversations');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('361a26c1-374b-4b61-a81c-df5c1531dca6', 'de', 'Tiefe Gespräche');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('8f793a49-6df2-4eb7-bf19-4f3af9c63314', 'en', 'Everyday life');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('8f793a49-6df2-4eb7-bf19-4f3af9c63314', 'de', 'Alltag');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ecf43929-5488-4e95-9634-d132e1a72adf', 'en', 'Future');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ecf43929-5488-4e95-9634-d132e1a72adf', 'de', 'Zukunft');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('3b98d0e8-125b-486b-a658-03474952f0d6', 'en', 'Gratitude');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('3b98d0e8-125b-486b-a658-03474952f0d6', 'de', 'Dankbarkeit');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2dad4c76-93d6-4637-ab48-ae7463b4a6ad', 'en', 'Humor');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2dad4c76-93d6-4637-ab48-ae7463b4a6ad', 'de', 'Humor');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('9e5d5d1b-7e0a-46a3-ba57-66c439cdadb1', 'en', 'Long distance');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('9e5d5d1b-7e0a-46a3-ba57-66c439cdadb1', 'de', 'Fernbeziehung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('c6416028-cd31-405f-a012-33d215d4316a', 'en', 'Memories');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('c6416028-cd31-405f-a012-33d215d4316a', 'de', 'Erinnerungen');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('3717b3b7-0b1e-433a-b0d9-97d060d87cbb', 'en', 'Rituals');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('3717b3b7-0b1e-433a-b0d9-97d060d87cbb', 'de', 'Rituale');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('98e5485f-be1a-41f4-ac82-5b01ff4fce57', 'en', 'Romance');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('98e5485f-be1a-41f4-ac82-5b01ff4fce57', 'de', 'Romantik');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('f9b0a19c-af2b-4977-8ac1-844820fb8a6d', 'en', 'Support');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('f9b0a19c-af2b-4977-8ac1-844820fb8a6d', 'de', 'Unterstützung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('bbec34f7-4a34-4b86-94c5-73e3b460d6ee', 'en', 'Teamwork');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5ef346f7-9532-41df-b7db-f90d504988b5', 'en', 'Trust');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5ef346f7-9532-41df-b7db-f90d504988b5', 'de', 'Vertrauen');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a7be19bc-87e1-4100-8b9c-bee8d8d56dce', 'en', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a7be19bc-87e1-4100-8b9c-bee8d8d56dce', 'de', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('83d8bdb5-52dc-47e3-8571-66172e8fa528', 'en', 'Humor');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('83d8bdb5-52dc-47e3-8571-66172e8fa528', 'de', 'Humor');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('61dd6f56-d02d-4a35-a5d9-f6cb681a321e', 'en', 'Long distance');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('61dd6f56-d02d-4a35-a5d9-f6cb681a321e', 'de', 'Fernbeziehung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('1f26de1c-46e3-404a-baae-503056f464a8', 'en', 'Memories');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('1f26de1c-46e3-404a-baae-503056f464a8', 'de', 'Erinnerungen');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('3f0b635c-1f09-4307-a4d6-333ae27c78b5', 'en', 'Romance');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('3f0b635c-1f09-4307-a4d6-333ae27c78b5', 'de', 'Romantik');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('7cf515ef-d2d3-4005-a2b5-fc0c15211771', 'en', 'Teamwork');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ab9b4983-28d9-47bc-ae0b-4578132b2589', 'en', 'Compliment');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ab9b4983-28d9-47bc-ae0b-4578132b2589', 'de', 'Kompliment');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a88157f9-484d-4977-9e5c-0887a6b29df2', 'en', 'Memory');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a88157f9-484d-4977-9e5c-0887a6b29df2', 'de', 'Erinnerung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2d5f9aae-ae3e-449d-809f-a2b72fe4054b', 'en', 'Surprise');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2d5f9aae-ae3e-449d-809f-a2b72fe4054b', 'de', 'Überraschung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('0683a5c6-fdbb-4cd5-b7b0-2b33da9c5a89', 'en', 'Voucher');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('0683a5c6-fdbb-4cd5-b7b0-2b33da9c5a89', 'de', 'Gutschein');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('97f307d1-9c0a-414a-be1f-516e85ab3bad', 'en', 'Wish');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('97f307d1-9c0a-414a-be1f-516e85ab3bad', 'de', 'Wunsch');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('bd2f8bb8-492f-40e5-a457-d5f8b0230f40', 'de', 'Abenteuer');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('72b5ce9d-d3b2-4ad0-b566-242305eeaf34', 'de', 'Alltag');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('f74f7a74-9eaf-4b21-9726-bd9c3e9cc0cd', 'de', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('11178257-cb88-4ac8-bb7b-6f1646b3a876', 'de', 'Erinnerung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('78153f90-eb53-4d28-86be-7bc5ac5a8173', 'de', 'Freizeit');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5afafe00-e77a-4909-8f48-c4610d7bf05d', 'de', 'Humor');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('defeb1fc-a507-40e4-b64e-a452faafe3b8', 'de', 'Musik');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('fa8e6fc2-d354-4907-b2a4-ed37bcdd2ecb', 'de', 'Nähe');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('81c77f24-ba21-4f06-9805-6859ed2faba2', 'de', 'Reise');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('d957d633-990b-4df9-aa71-0ee2f149112a', 'de', 'Ritual');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('6414c79b-dbc6-49a5-9598-fbf9e0d6af91', 'de', 'Ruhe');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('cbddddee-04c0-4148-b3f3-5481134c5513', 'de', 'Stress');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ffe0c9b9-c696-4116-9847-8b090496e200', 'de', 'Unterstützung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('828560d6-b686-4896-8467-4ba5a4d4bc90', 'de', 'Tiefe');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('be554430-552d-4170-a0f1-50b73f248c61', 'de', 'Überraschung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('fb4c9621-f448-450c-bafb-3a3a00254a5d', 'de', 'Verbindung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('6fcbe584-95cf-452b-bc13-bb992664acc8', 'de', 'Vorlieben');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('afc001c9-7d06-4beb-9c7d-77f7be0c8b49', 'de', 'Zukunft');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('0dd2e84f-4f9f-454e-ba74-47d481514a60', 'de', 'Zuhause');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('bd2f8bb8-492f-40e5-a457-d5f8b0230f40', 'en', 'Adventure');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('72b5ce9d-d3b2-4ad0-b566-242305eeaf34', 'en', 'Everyday life');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('f74f7a74-9eaf-4b21-9726-bd9c3e9cc0cd', 'en', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('11178257-cb88-4ac8-bb7b-6f1646b3a876', 'en', 'Memory');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('78153f90-eb53-4d28-86be-7bc5ac5a8173', 'en', 'Free time');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5afafe00-e77a-4909-8f48-c4610d7bf05d', 'en', 'Humor');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('defeb1fc-a507-40e4-b64e-a452faafe3b8', 'en', 'Music');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('fa8e6fc2-d354-4907-b2a4-ed37bcdd2ecb', 'en', 'Closeness');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('81c77f24-ba21-4f06-9805-6859ed2faba2', 'en', 'Travel');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('d957d633-990b-4df9-aa71-0ee2f149112a', 'en', 'Ritual');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('6414c79b-dbc6-49a5-9598-fbf9e0d6af91', 'en', 'Calm');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('cbddddee-04c0-4148-b3f3-5481134c5513', 'en', 'Stress');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ffe0c9b9-c696-4116-9847-8b090496e200', 'en', 'Support');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('828560d6-b686-4896-8467-4ba5a4d4bc90', 'en', 'Depth');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('be554430-552d-4170-a0f1-50b73f248c61', 'en', 'Surprise');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('fb4c9621-f448-450c-bafb-3a3a00254a5d', 'en', 'Connection');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('6fcbe584-95cf-452b-bc13-bb992664acc8', 'en', 'Preferences');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('afc001c9-7d06-4beb-9c7d-77f7be0c8b49', 'en', 'Future');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('0dd2e84f-4f9f-454e-ba74-47d481514a60', 'en', 'Home');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('46bcbf7c-a2ee-4681-8574-dc7c03187a0a', 'de', 'Alltag');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('46bcbf7c-a2ee-4681-8574-dc7c03187a0a', 'en', 'Everyday');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('b53ebb22-2fcc-401a-9685-12cb26303de7', 'de', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('b53ebb22-2fcc-401a-9685-12cb26303de7', 'en', 'Date');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('bbec34f7-4a34-4b86-94c5-73e3b460d6ee', 'de', 'Zusammenarbeit');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('7cf515ef-d2d3-4005-a2b5-fc0c15211771', 'de', 'Zusammenarbeit');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('924cc61e-c8b6-41a2-915c-ec9e84438a60', 'de', 'Reise');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('924cc61e-c8b6-41a2-915c-ec9e84438a60', 'en', 'Travel');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('29ef76a9-168a-473b-bc3c-2acc4ce3f4dd', 'de', 'Meilenstein');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('29ef76a9-168a-473b-bc3c-2acc4ce3f4dd', 'en', 'Milestone');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('fd937429-53d1-4545-8ca7-597c164b2817', 'de', 'Lustig');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('fd937429-53d1-4545-8ca7-597c164b2817', 'en', 'Funny');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('47f8a01c-a387-4ddc-977a-f3be24ff2ad3', 'de', 'Besonders');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('47f8a01c-a387-4ddc-977a-f3be24ff2ad3', 'en', 'Special');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('eb7f8f02-e8d6-491f-97e1-6a8dfbaa8562', 'de', 'Konflikt & Versöhnung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('eb7f8f02-e8d6-491f-97e1-6a8dfbaa8562', 'en', 'Conflict & repair');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('49d5ec67-d0d8-4511-a930-2e07afeb20c2', 'de', 'Bedürfnisse');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('49d5ec67-d0d8-4511-a930-2e07afeb20c2', 'en', 'Needs');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('d14c1f53-51fb-46d0-83ec-5e3d5554b8fd', 'de', 'Grenzen');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('d14c1f53-51fb-46d0-83ec-5e3d5554b8fd', 'en', 'Boundaries');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5c173fc7-b9f2-4753-9334-b9a0f8762b23', 'de', 'Intimität');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5c173fc7-b9f2-4753-9334-b9a0f8762b23', 'en', 'Intimacy');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('9fdf79e7-3bc2-430f-88f3-12a0a47bc844', 'de', 'Wertschätzung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('9fdf79e7-3bc2-430f-88f3-12a0a47bc844', 'en', 'Appreciation');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a587b4f9-09f7-45c9-bd31-6abb2f0c6926', 'de', 'Alltagsträume');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a587b4f9-09f7-45c9-bd31-6abb2f0c6926', 'en', 'Everyday dreams');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('14776e66-f423-45a6-a683-20c9a454afbe', 'de', 'Fürsorge');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('14776e66-f423-45a6-a683-20c9a454afbe', 'en', 'Care');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('6cf1587c-01e8-4543-84ff-85de6cb58e28', 'de', 'Kreativität');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('6cf1587c-01e8-4543-84ff-85de6cb58e28', 'en', 'Creativity');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('b29bd2eb-a552-4b6a-a6cc-485826a14310', 'de', 'Haushalt & Team');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('b29bd2eb-a552-4b6a-a6cc-485826a14310', 'en', 'Household & team');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('8f3e70e5-9563-497c-9f67-3f621bbfa601', 'de', 'Draußen');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('8f3e70e5-9563-497c-9f67-3f621bbfa601', 'en', 'Outdoors');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2548096e-6c48-49ef-83c6-3ee7e4431b57', 'de', 'Digital & Distanz');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2548096e-6c48-49ef-83c6-3ee7e4431b57', 'en', 'Digital & distance');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('927331ad-60bf-4d2c-8f03-2bad43cb0d68', 'de', 'Überraschung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('927331ad-60bf-4d2c-8f03-2bad43cb0d68', 'en', 'Surprise');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('279250f1-ae52-4dcf-b72d-3611856ab6e7', 'de', 'Familie');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('279250f1-ae52-4dcf-b72d-3611856ab6e7', 'en', 'Family');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('03c9e73f-6d6b-4b37-bb50-15d1e124e957', 'de', 'Kindheit');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('03c9e73f-6d6b-4b37-bb50-15d1e124e957', 'en', 'Childhood');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('e19dbb2e-467f-48b2-9ba6-6f8478478900', 'de', 'Werte');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('e19dbb2e-467f-48b2-9ba6-6f8478478900', 'en', 'Values');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('12401895-79ac-4064-b474-e69d9383cc36', 'de', 'Körper & Wohlbefinden');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('12401895-79ac-4064-b474-e69d9383cc36', 'en', 'Body & wellbeing');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('745d3395-73e4-481d-b6f2-ec8da80c49da', 'de', 'Essen & Genuss');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('745d3395-73e4-481d-b6f2-ec8da80c49da', 'en', 'Food & enjoyment');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ca150bf0-1bd4-4b16-bb51-ff7b62e6f7be', 'de', 'Arbeit & Ziele');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('ca150bf0-1bd4-4b16-bb51-ff7b62e6f7be', 'en', 'Work & goals');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('b8d6e758-64a9-4d27-bcd8-6b5a31d30f26', 'de', 'Sex');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('b8d6e758-64a9-4d27-bcd8-6b5a31d30f26', 'en', 'Sex');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5019e8b6-4604-49c3-9aa2-3409994cbed4', 'de', 'Dank');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('5019e8b6-4604-49c3-9aa2-3409994cbed4', 'en', 'Gratitude');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2e29134b-5e4c-4317-a841-6717245233ec', 'de', 'Mutmacher');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('2e29134b-5e4c-4317-a841-6717245233ec', 'en', 'Encouragement');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('72a9eabb-d1b8-4177-96ae-aa8eeae816d7', 'de', 'Sehnsucht');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('72a9eabb-d1b8-4177-96ae-aa8eeae816d7', 'en', 'Longing');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('aadd71b3-6f65-4b89-b7f1-f21a154a5fd3', 'de', 'Einladung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('aadd71b3-6f65-4b89-b7f1-f21a154a5fd3', 'en', 'Invitation');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('d3ed8edf-5a35-47e3-9ca8-4f28594e7a63', 'de', 'Entschuldigung');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('d3ed8edf-5a35-47e3-9ca8-4f28594e7a63', 'en', 'Apology');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('02cda105-9338-4102-8587-2f0a1abd34c6', 'de', 'Jahrestage');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('02cda105-9338-4102-8587-2f0a1abd34c6', 'en', 'Anniversaries');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('47ab0026-33c7-4c2b-b162-d9862f0de2a6', 'de', 'Erste Male');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('47ab0026-33c7-4c2b-b162-d9862f0de2a6', 'en', 'First times');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('f9b723ed-df79-4040-aa3f-c3372921e3e6', 'de', 'Kleine Momente');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('f9b723ed-df79-4040-aa3f-c3372921e3e6', 'en', 'Small moments');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a805beb4-b90e-47fb-b084-c13cd5aca5f2', 'de', 'Gemeinsame Erfolge');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a805beb4-b90e-47fb-b084-c13cd5aca5f2', 'en', 'Shared successes');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a60c34fb-484a-43fa-9a4a-393b47bec881', 'de', 'Herausforderungen');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('a60c34fb-484a-43fa-9a4a-393b47bec881', 'en', 'Challenges');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('8701bb0d-363b-443c-8ebe-3464f20d9859', 'de', 'Lieblingsorte');
INSERT INTO public.content_category_translations (category_id, locale, label) VALUES ('8701bb0d-363b-443c-8ebe-3464f20d9859', 'en', 'Favorite places');


--
-- Data for Name: content_styles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_styles (id, value, active, sort_order, created_at, updated_at) VALUES ('83fa45a2-465a-4e32-b409-3e97a33b0a86', 'balanced', true, 10, '2026-06-18 04:26:14.840706+00', '2026-06-18 04:26:14.840706+00');
INSERT INTO public.content_styles (id, value, active, sort_order, created_at, updated_at) VALUES ('d4cdaa8c-136a-44df-9873-372567763cc4', 'romantic', true, 20, '2026-06-18 04:26:14.840706+00', '2026-06-18 04:26:14.840706+00');
INSERT INTO public.content_styles (id, value, active, sort_order, created_at, updated_at) VALUES ('cf92a660-6589-43c1-9bf9-23d2c8eb6fb1', 'playful', true, 30, '2026-06-18 04:26:14.840706+00', '2026-06-18 04:26:14.840706+00');
INSERT INTO public.content_styles (id, value, active, sort_order, created_at, updated_at) VALUES ('56cf071a-cd8f-4e89-ae56-824054a5842a', 'deep', true, 40, '2026-06-18 04:26:14.840706+00', '2026-06-18 04:26:14.840706+00');


--
-- Data for Name: content_style_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('83fa45a2-465a-4e32-b409-3e97a33b0a86', 'en', 'Balanced');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('83fa45a2-465a-4e32-b409-3e97a33b0a86', 'de', 'Ausgewogen');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('d4cdaa8c-136a-44df-9873-372567763cc4', 'en', 'Romantic');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('d4cdaa8c-136a-44df-9873-372567763cc4', 'de', 'Romantisch');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('cf92a660-6589-43c1-9bf9-23d2c8eb6fb1', 'en', 'Playful');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('cf92a660-6589-43c1-9bf9-23d2c8eb6fb1', 'de', 'Verspielt');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('56cf071a-cd8f-4e89-ae56-824054a5842a', 'en', 'Deep');
INSERT INTO public.content_style_translations (style_id, locale, label) VALUES ('56cf071a-cd8f-4e89-ae56-824054a5842a', 'de', 'Tiefgründig');


--
-- Data for Name: couples; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: couple_members; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000201', 'romance', 10, 'low', 15, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000202', 'date', 30, 'medium', 20, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000203', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000204', 'date', 20, 'low', 15, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000205', 'romance', 5, 'low', 10, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000206', 'memory', 15, 'low', 15, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000208', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000209', 'memory', 10, 'low', 15, 'future_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000210', 'humor', 5, 'low', 10, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000211', 'teamwork', 15, 'medium', 20, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000212', 'romance', 2, 'low', 8, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000213', 'date', 15, 'low', 12, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000214', 'humor', 5, 'low', 8, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000215', 'memory', 10, 'low', 12, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000216', 'teamwork', 10, 'low', 10, 'support_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000217', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000218', 'memory', 10, 'low', 12, 'future_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000219', 'date', 30, 'medium', 20, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000220', 'teamwork', 15, 'medium', 18, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000221', 'long_distance', 5, 'low', 10, 'compliment_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000222', 'date', 25, 'medium', 18, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000223', 'romance', 10, 'low', 12, 'trust_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000224', 'humor', 5, 'low', 8, 'humor_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000225', 'long_distance', 15, 'medium', 18, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000226', 'memory', 20, 'medium', 20, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000227', 'teamwork', 10, 'low', 10, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000228', 'romance', 20, 'medium', 18, 'compliment_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000229', 'memory', 15, 'low', 15, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000230', 'date', 30, 'medium', 20, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000231', 'humor', 10, 'low', 10, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000207', 'teamwork', 10, 'low', 10, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000232', 'date', 30, 'medium', 20, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000233', 'date', 20, 'low', 15, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000234', 'humor', 10, 'low', 10, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000235', 'humor', 10, 'low', 10, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000236', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000237', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000238', 'memory', 15, 'low', 15, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000239', 'memory', 15, 'low', 15, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000240', 'romance', 10, 'low', 12, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000241', 'romance', 15, 'medium', 18, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000242', 'teamwork', 15, 'medium', 18, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000243', 'teamwork', 10, 'low', 10, 'team_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000244', 'care', 20, 'low', 15, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000245', 'care', 10, 'low', 12, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000246', 'creativity', 15, 'low', 12, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000247', 'creativity', 15, 'low', 12, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000248', 'household_team', 15, 'low', 12, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000249', 'household_team', 25, 'medium', 18, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000250', 'outdoors', 20, 'low', 15, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000251', 'outdoors', 20, 'low', 15, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000252', 'digital_distance', 20, 'low', 15, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000253', 'digital_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000254', 'surprise', 20, 'medium', 18, 'compliment_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000255', 'surprise', 10, 'low', 12, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000256', 'date', 25, 'medium', 18, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000257', 'date', 30, 'medium', 20, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000258', 'humor', 10, 'low', 10, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000259', 'humor', 10, 'low', 10, 'humor_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000260', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000261', 'long_distance', 5, 'low', 10, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000262', 'memory', 15, 'low', 15, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000263', 'memory', 15, 'medium', 18, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000264', 'romance', 10, 'low', 12, 'compliment_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000265', 'romance', 5, 'low', 10, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000266', 'teamwork', 15, 'medium', 18, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000267', 'teamwork', 10, 'low', 12, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000268', 'care', 10, 'low', 12, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000269', 'care', 15, 'medium', 18, 'support_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000270', 'creativity', 15, 'low', 12, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000271', 'creativity', 20, 'medium', 18, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000272', 'household_team', 20, 'medium', 18, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000273', 'household_team', 20, 'medium', 18, 'team_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000274', 'outdoors', 20, 'low', 15, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000275', 'outdoors', 25, 'medium', 18, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000276', 'digital_distance', 10, 'low', 12, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000277', 'digital_distance', 5, 'low', 8, 'light_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000278', 'surprise', 10, 'low', 12, 'compliment_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000279', 'surprise', 20, 'medium', 18, 'compliment_seed', false, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000280', 'date', 20, 'low', 15, 'date_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000281', 'memory', 20, 'medium', 20, 'memory_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000282', 'romance', 10, 'low', 15, 'compliment_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000283', 'teamwork', 20, 'medium', 20, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000284', 'care', 10, 'low', 12, 'support_seed', true, true);
INSERT INTO public.quests (id, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners, active) VALUES ('00000000-0000-0000-0000-000000000285', 'creativity', 15, 'low', 15, 'future_seed', true, true);


--
-- Data for Name: couple_quests; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: daily_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000101', 'gratitude', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000102', 'romance', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000103', 'future', 1, false, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000104', 'humor', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000105', 'memory', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000106', 'trust', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000107', 'everyday', 1, false, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000108', 'future', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000109', 'gratitude', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000110', 'support', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000111', 'ritual', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000112', 'everyday', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000113', 'connection', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000114', 'romance', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000115', 'humor', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000116', 'connection', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000117', 'gratitude', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000118', 'everyday', 2, false, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000119', 'deep', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000120', 'long_distance', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000121', 'memory', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000122', 'trust', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000123', 'teamwork', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000124', 'date', 1, false, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000125', 'romance', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000126', 'trust', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000127', 'humor', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000128', 'support', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000129', 'future', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000130', 'deep', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000131', 'teamwork', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000132', 'everyday', 1, false, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000133', 'gratitude', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000134', 'date', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000135', 'long_distance', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000136', 'memory', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000137', 'support', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000138', 'ritual', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000139', 'deep', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000140', 'trust', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000141', 'romance', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000142', 'deep', 4, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000143', 'connection', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000144', 'conflict_repair', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000145', 'conflict_repair', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000146', 'needs', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000147', 'needs', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000148', 'boundaries', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000149', 'boundaries', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000150', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000151', 'intimacy', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000152', 'appreciation', 1, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000153', 'appreciation', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000154', 'everyday_dreams', 2, false, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000155', 'everyday_dreams', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000156', 'intimacy', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000157', 'intimacy', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000158', 'intimacy', 2, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000159', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000160', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000161', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000162', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000163', 'intimacy', 4, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000164', 'intimacy', 4, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000165', 'intimacy', 4, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000166', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000167', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000168', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000169', 'intimacy', 3, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000170', 'intimacy', 4, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000171', 'intimacy', 4, true, true);
INSERT INTO public.daily_questions (id, category, depth_level, long_distance_suitable, active) VALUES ('00000000-0000-0000-0000-000000000172', 'intimacy', 4, true, true);


--
-- Data for Name: daily_question_answers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: daily_question_instances; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: daily_question_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000101', 'de', 'Was war ein Moment, in dem du dich durch mich geliebt gefühlt hast?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000102', 'de', 'Welche kleine Geste von mir bedeutet dir viel?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000103', 'de', 'Was möchtest du bald wieder gemeinsam machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000104', 'de', 'Wann musstest du zuletzt wegen mir lächeln?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000105', 'de', 'Welche Erinnerung mit uns würdest du gern nochmal erleben?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000106', 'de', 'Was gibt dir in unserer Beziehung Sicherheit?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000107', 'de', 'Was liebst du an unserem Alltag?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000108', 'de', 'Was ist ein Traum, den wir irgendwann gemeinsam erfüllen könnten?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000109', 'de', 'Welche Eigenschaft an mir bewunderst du gerade besonders?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000110', 'de', 'Was kann ich tun, damit du dich diese Woche unterstützt fühlst?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000111', 'de', 'Welche kleine gemeinsame Tradition möchtest du pflegen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000112', 'de', 'Was war am vergangenen Tag ein kleiner guter Moment?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000113', 'de', 'Welcher Ort fühlt sich für uns beide nach Ruhe an?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000114', 'de', 'Welche kleine Geste von mir bleibt dir länger im Herzen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000115', 'de', 'Was hat dich diese Woche zum Schmunzeln gebracht?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000116', 'de', 'Welcher gemeinsame Moment hat sich zuletzt leicht angefühlt?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000117', 'de', 'Wofür möchtest du mir heute Danke sagen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000118', 'de', 'Welche kleine Sache könnte unseren Alltag gerade schöner machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000119', 'de', 'Was wünschst du dir für unser nächstes ruhiges Gespräch?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000120', 'de', 'Wann fühlst du dich mir auch aus der Ferne nah?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000121', 'de', 'Welche Erinnerung würdest du gern als kleines Ritual wiederholen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000122', 'de', 'Was gibt dir in uns gerade Zuversicht?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000123', 'de', 'Welche Eigenschaft an uns als Team magst du?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000124', 'de', 'Was sollten wir bald wieder nur für uns machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000125', 'de', 'Welche liebevolle Nachricht hättest du heute gern gehört?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000126', 'de', 'Was war ein kleiner Moment, in dem du dich verstanden gefühlt hast?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000127', 'de', 'Welche alberne Sache sollten wir mal wieder zusammen machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000128', 'de', 'Was könnte ich tun, damit dein Tag morgen leichter wird?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000129', 'de', 'Welcher Zukunftsgedanke mit uns fühlt sich warm an?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000130', 'de', 'Welche Grenze oder Pause würde dir gerade guttun?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000131', 'de', 'Welche gemeinsame Stärke vergessen wir manchmal?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000132', 'de', 'Was möchtest du an unserem Zuhause oder Alltag feiern?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000133', 'de', 'Welche Sache an mir macht dich stolz?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000134', 'de', 'Was wäre ein schönes Mini-Date für die nächsten Tage?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000135', 'de', 'Welche Sehnsucht möchtest du mir sanft erklären?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000136', 'de', 'Welche Erinnerung zeigt gut, wer wir als Paar sind?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000137', 'de', 'Wobei fühlst du dich von mir am besten unterstützt?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000138', 'de', 'Welche kleine Tradition passt zu unserer aktuellen Lebensphase?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000139', 'de', 'Was sollten wir uns gegenseitig öfter erlauben?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000140', 'de', 'Was war ein Moment, in dem du dich sicher bei mir gefühlt hast?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000141', 'de', 'Welche kleine Überraschung würde dir gerade Freude machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000142', 'de', 'Welche Frage möchtest du mir schon lange stellen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000143', 'de', 'Was macht unsere Verbindung auch an vollen Tagen spürbar?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000144', 'de', 'Was hilft uns, nach einem Missverständnis wieder weich miteinander zu werden?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000145', 'de', 'Welcher Satz würde dir helfen, wenn zwischen uns Spannung entsteht?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000146', 'de', 'Welches Bedürfnis von dir sollte ich gerade besser verstehen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000147', 'de', 'Was brauchst du diese Woche, um dich in unserer Beziehung getragen zu fühlen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000148', 'de', 'Welche Grenze würde dir gerade helfen, dich freier und sicherer zu fühlen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000149', 'de', 'Wobei wünschst du dir mehr Rücksicht von mir, ohne dich erklären zu müssen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000150', 'de', 'Wann fühlst du dich mir körperlich oder emotional besonders nah?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000151', 'de', 'Welche Art von Nähe tut dir gerade besonders gut?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000152', 'de', 'Welche kleine Sache von mir möchtest du heute bewusst wertschätzen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000153', 'de', 'Wofür in unserem Miteinander möchtest du gerade Danke sagen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000154', 'de', 'Welche kleine Veränderung würde unseren Alltag traumhaft leichter machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000155', 'de', 'Welcher gemeinsame Alltagswunsch fühlt sich gerade schön und erreichbar an?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000156', 'de', 'Was macht Berührung für dich gerade besonders schön oder sicher?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000157', 'de', 'Welche Art von Nähe wünschst du dir von mir häufiger?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000158', 'de', 'Wann fühlst du dich beim Küssen mir besonders nah?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000159', 'de', 'Welche Berührung von mir bleibt dir besonders im Kopf?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000160', 'de', 'Was hilft dir, dich körperlich bei mir ganz fallen zu lassen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000161', 'de', 'Gibt es etwas Intimes, das du mit mir gern langsamer erkunden würdest?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000162', 'de', 'Welche kleine Geste bringt dich manchmal sofort in eine sinnliche Stimmung?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000163', 'de', 'Was möchtest du mir über deine Lust gerade ehrlicher sagen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000164', 'de', 'Welche Art von Verführung fühlt sich für dich liebevoll statt drängend an?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000165', 'de', 'Welche Fantasie oder Stimmung würdest du mit mir gern vorsichtig teilen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000166', 'de', 'Was sollte ich öfter tun, damit du dich begehrt fühlst?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000167', 'de', 'Wann fühlst du dich von mir nicht nur geliebt, sondern wirklich gewollt?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000168', 'de', 'Was wünschst du dir vor oder nach körperlicher Nähe mehr von mir?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000169', 'de', 'Welche intime Erinnerung mit uns fühlt sich für dich besonders warm an?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000170', 'de', 'Was macht es dir leichter, beim Sex zu sagen, was du möchtest?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000171', 'de', 'Was möchtest du beim nächsten Mal bewusster genießen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000172', 'de', 'Welche kleine intime Überraschung dürfte ich dir irgendwann machen?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000101', 'en', 'What was a moment when you felt loved by me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000102', 'en', 'Which small gesture from me means a lot to you?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000103', 'en', 'What would you like us to do together again soon?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000104', 'en', 'When did you last smile because of me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000105', 'en', 'Which memory with us would you like to experience again?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000106', 'en', 'What gives you a sense of safety in our relationship?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000107', 'en', 'What do you love about our everyday life?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000108', 'en', 'What is a dream we could fulfill together someday?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000109', 'en', 'Which quality in me do you especially admire right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000110', 'en', 'What can I do so you feel supported this week?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000111', 'en', 'Which small shared tradition would you like to keep?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000112', 'en', 'What was a small good moment from the previous day?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000113', 'en', 'Which place feels calm for both of us?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000114', 'en', 'Which small gesture from me stays in your heart?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000115', 'en', 'What made you smile this week?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000116', 'en', 'Which shared moment has felt easy lately?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000117', 'en', 'What would you like to thank me for today?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000118', 'en', 'What small thing could make our everyday life nicer right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000119', 'en', 'What do you wish for our next quiet conversation?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000120', 'en', 'When do you feel close to me even from afar?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000121', 'en', 'Which memory would you like to repeat as a small ritual?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000122', 'en', 'What gives you confidence in us right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000123', 'en', 'Which quality do you like about us as a team?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000124', 'en', 'What should we do again soon just for us?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000125', 'en', 'Which loving message would you have liked to hear today?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000126', 'en', 'What was a small moment when you felt understood?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000127', 'en', 'What silly thing should we do together again?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000128', 'en', 'What could I do to make your day easier tomorrow?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000129', 'en', 'Which thought about our future feels warm?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000130', 'en', 'Which boundary or pause would be good for you right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000131', 'en', 'Which shared strength do we sometimes forget?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000132', 'en', 'What would you like to celebrate about our home or everyday life?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000133', 'en', 'What is something about me that makes you proud?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000134', 'en', 'What would be a nice mini date for the next few days?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000135', 'en', 'Which longing would you like to gently explain to me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000136', 'en', 'Which memory shows well who we are as a couple?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000137', 'en', 'Where do you feel best supported by me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000138', 'en', 'Which small tradition fits our current phase of life?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000139', 'en', 'What should we allow each other more often?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000140', 'en', 'What was a moment when you felt safe with me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000141', 'en', 'Which small surprise would make you happy right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000142', 'en', 'Which question have you wanted to ask me for a long time?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000143', 'en', 'What makes our connection noticeable even on busy days?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000144', 'en', 'What helps us become gentle with each other again after a misunderstanding?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000145', 'en', 'Which sentence would help you when tension comes up between us?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000146', 'en', 'Which need of yours should I understand better right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000147', 'en', 'What do you need this week to feel held in our relationship?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000148', 'en', 'Which boundary would help you feel freer and safer right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000149', 'en', 'Where would you like more consideration from me without having to explain yourself?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000150', 'en', 'When do you feel especially close to me physically or emotionally?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000151', 'en', 'What kind of closeness feels especially good to you right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000152', 'en', 'Which small thing from me would you like to consciously appreciate today?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000153', 'en', 'What in the way we treat each other would you like to say thank you for right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000154', 'en', 'Which small change would make our everyday life feel wonderfully easier?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000155', 'en', 'Which shared everyday wish feels beautiful and reachable right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000156', 'en', 'What makes touch feel especially beautiful or safe for you right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000157', 'en', 'What kind of closeness would you like from me more often?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000158', 'en', 'When do you feel especially close to me while kissing?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000159', 'en', 'Which touch from me stays in your mind the most?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000160', 'en', 'What helps you fully let go physically with me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000161', 'en', 'Is there something intimate you would like to explore more slowly with me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000162', 'en', 'Which small gesture sometimes puts you in a sensual mood right away?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000163', 'en', 'What would you like to tell me more honestly about your desire right now?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000164', 'en', 'What kind of seduction feels loving to you instead of pressuring?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000165', 'en', 'Which fantasy or mood would you like to carefully share with me?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000166', 'en', 'What should I do more often so you feel desired?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000167', 'en', 'When do you feel not only loved by me, but truly wanted?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000168', 'en', 'What would you like more from me before or after physical closeness?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000169', 'en', 'Which intimate memory with us feels especially warm to you?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000170', 'en', 'What makes it easier for you to say what you want during sex?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000171', 'en', 'What would you like to enjoy more consciously next time?');
INSERT INTO public.daily_question_translations (question_id, locale, text) VALUES ('00000000-0000-0000-0000-000000000172', 'en', 'What small intimate surprise could I make for you someday?');


--
-- Data for Name: garden_assets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('conversation_flower', 'Gespraechsblume', '{question}', 1, '/garden-assets/conversation-flower.png', 86, 108, 0.500, 0.900, true, 10, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('heart_flower', 'Herzblume', '{know_me,quest}', 1, '/garden-assets/heart-flower.png', 92, 112, 0.500, 0.900, true, 20, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('memory_tree', 'Erinnerungsbaum', '{quest,milestone}', 4, '/garden-assets/memory-tree.png', 150, 178, 0.500, 0.940, true, 30, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('memory_stone', 'Erinnerungsstein', '{memory,quest}', 1, '/garden-assets/memory-stone.png', 108, 82, 0.500, 0.820, true, 40, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('warm_lantern', 'Liebesglas-Licht', '{love_jar,quest}', 1, '/garden-assets/warm-lantern.png', 76, 118, 0.500, 0.920, true, 50, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('couple_bench', 'Paarbank', '{milestone}', 3, '/garden-assets/couple-bench.png', 148, 100, 0.500, 0.840, true, 60, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('quiet_pond', 'Teich der Ruhe', '{milestone}', 6, '/garden-assets/quiet-pond.png', 190, 112, 0.500, 0.780, true, 70, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('picnic_blanket', 'Picknickdecke', '{quest}', 7, '/garden-assets/picnic-blanket.png', 148, 96, 0.500, 0.780, true, 80, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('wishing_well', 'Wunschbrunnen', '{milestone}', 9, '/garden-assets/wishing-well.png', 128, 152, 0.500, 0.900, true, 90, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('date_pavilion', 'Date-Pavillon', '{quest}', 10, '/garden-assets/date-pavilion.png', 174, 154, 0.500, 0.920, true, 100, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('distance_bridge', 'Fernbeziehungs-Bruecke', '{quest}', 8, '/garden-assets/distance-bridge.png', 184, 112, 0.500, 0.820, true, 110, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('polaroid_frame', 'Polaroid-Ort', '{memory}', 4, '/garden-assets/polaroid-frame.png', 94, 118, 0.500, 0.900, true, 120, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');
INSERT INTO public.garden_assets (key, label, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, created_at, updated_at) VALUES ('garden_decor', 'Gartendeko', '{quest,milestone}', 1, '/garden-assets/garden-decor.png', 92, 94, 0.500, 0.860, true, 130, '2026-06-18 04:26:15.080357+00', '2026-06-18 04:26:15.080357+00');


--
-- Data for Name: garden_levels; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('4dcd4d74-b92f-418d-9e9d-08674adc2e38', 10, NULL, '2026-06-18 04:26:14.954072+00', '2026-06-18 04:26:14.954072+00', 'garden_fest', '/garden-backgrounds/garden-fest.png', '#d89d52');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('ba70490f-c235-424f-a4b4-4b9e55c570f3', 1, 100, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'heart_bed', '/garden-backgrounds/heart-bed.png', '#f08a82');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('264f952b-5d47-4fb1-914b-d70cfd282c3b', 2, 100, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'flower_meadow', '/garden-backgrounds/flower-meadow.png', '#e7a86f');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('bebe213c-9508-45f0-95bf-82e1e60aa0b0', 3, 100, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'bench_grove', '/garden-backgrounds/bench-grove.png', '#8fb66b');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('158e9203-d57a-4737-b10c-e981a1d45679', 4, 150, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'memory_tree', '/garden-backgrounds/memory-tree-area.png', '#7ca37b');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('989fc3d5-6be8-4f5a-8f6f-e8c4627014d8', 5, 150, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'light_meadow', '/garden-backgrounds/light-meadow.png', '#e9bd62');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('8eb6c65b-53e6-4322-bcf8-54385ffec9d5', 6, 200, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'pond', '/garden-backgrounds/pond-area.png', '#6fb5c7');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('3a5e0a09-3c59-4f8f-945f-2905faa58b85', 7, 200, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'picnic', '/garden-backgrounds/picnic-area.png', '#d87964');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('a03dd00c-43ea-42e4-abf2-c110ccc41fcd', 8, 200, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'star_meadow', '/garden-backgrounds/star-meadow.png', '#727bb9');
INSERT INTO public.garden_levels (id, stage, points_to_next, created_at, updated_at, area_key, background_image, accent) VALUES ('371d7aed-99ed-450d-b2ea-5dd2a6a809bb', 9, 200, '2026-06-18 04:26:14.954072+00', '2026-06-21 04:47:24.545318+00', 'wishing_well', '/garden-backgrounds/wishing-well-area.png', '#8b90a8');


--
-- Data for Name: garden_level_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('ba70490f-c235-424f-a4b4-4b9e55c570f3', 'en', 'Heart Bed');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('ba70490f-c235-424f-a4b4-4b9e55c570f3', 'de', 'Herzbeet');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('264f952b-5d47-4fb1-914b-d70cfd282c3b', 'en', 'Flower Meadow');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('264f952b-5d47-4fb1-914b-d70cfd282c3b', 'de', 'Blumenwiese');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('bebe213c-9508-45f0-95bf-82e1e60aa0b0', 'en', 'Bench Grove');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('bebe213c-9508-45f0-95bf-82e1e60aa0b0', 'de', 'Banklichtung');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('158e9203-d57a-4737-b10c-e981a1d45679', 'en', 'Memory Tree');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('158e9203-d57a-4737-b10c-e981a1d45679', 'de', 'Erinnerungsbereich');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('989fc3d5-6be8-4f5a-8f6f-e8c4627014d8', 'en', 'Light Meadow');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('989fc3d5-6be8-4f5a-8f6f-e8c4627014d8', 'de', 'Lichterwiese');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('8eb6c65b-53e6-4322-bcf8-54385ffec9d5', 'en', 'Quiet Pond');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('8eb6c65b-53e6-4322-bcf8-54385ffec9d5', 'de', 'Teich der Ruhe');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('3a5e0a09-3c59-4f8f-945f-2905faa58b85', 'en', 'Picnic Place');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('3a5e0a09-3c59-4f8f-945f-2905faa58b85', 'de', 'Picknickplatz');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('a03dd00c-43ea-42e4-abf2-c110ccc41fcd', 'en', 'Star Meadow');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('a03dd00c-43ea-42e4-abf2-c110ccc41fcd', 'de', 'Sternenwiese');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('371d7aed-99ed-450d-b2ea-5dd2a6a809bb', 'en', 'Wishing Well');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('371d7aed-99ed-450d-b2ea-5dd2a6a809bb', 'de', 'Wunschbrunnen');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('4dcd4d74-b92f-418d-9e9d-08674adc2e38', 'en', 'Garden Fest');
INSERT INTO public.garden_level_translations (level_id, locale, name) VALUES ('4dcd4d74-b92f-418d-9e9d-08674adc2e38', 'de', 'Gartenfest');


--
-- Data for Name: garden_objects; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: know_me_catalog_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001201', 'everyday', true, 10, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001202', 'preferences', true, 20, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001203', 'stress', true, 30, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001204', 'calm', true, 40, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001205', 'closeness', true, 50, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001206', 'humor', true, 60, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001207', 'music', true, 70, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001208', 'support', true, 80, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001209', 'memory', true, 90, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001210', 'ritual', true, 100, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001211', 'surprise', true, 110, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001212', 'support', true, 120, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001213', 'preferences', true, 130, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001214', 'travel', true, 140, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001215', 'everyday', true, 150, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001216', 'home', true, 160, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001217', 'closeness', true, 170, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001218', 'everyday', true, 180, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001219', 'stress', true, 190, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001220', 'date', true, 200, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001221', 'free_time', true, 210, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001222', 'closeness', true, 220, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001223', 'connection', true, 230, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001224', 'adventure', true, 240, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001225', 'memory', true, 250, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001226', 'preferences', true, 260, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001227', 'everyday', true, 270, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001228', 'future', true, 280, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001229', 'closeness', true, 290, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001230', 'support', true, 300, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001231', 'depth', true, 310, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001232', 'free_time', true, 320, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001233', 'ritual', true, 330, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001234', 'support', true, 340, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001235', 'calm', true, 350, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001236', 'depth', true, 360, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001237', 'sex', true, 370, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001238', 'sex', true, 380, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001239', 'sex', true, 390, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001240', 'sex', true, 400, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001241', 'sex', true, 410, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001242', 'sex', true, 420, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001243', 'sex', true, 430, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001244', 'family', true, 440, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001245', 'family', true, 450, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001246', 'family', true, 460, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001247', 'childhood', true, 470, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001248', 'childhood', true, 480, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001249', 'childhood', true, 490, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001250', 'values', true, 500, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001251', 'values', true, 510, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001252', 'wellbeing', true, 520, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001253', 'wellbeing', true, 530, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001254', 'food', true, 540, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001255', 'food', true, 550, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001256', 'work_goals', true, 560, '2026-06-18 04:26:14.034137+00');
INSERT INTO public.know_me_catalog_questions (id, category, active, sort_order, created_at) VALUES ('00000000-0000-0000-0000-000000001257', 'work_goals', true, 570, '2026-06-18 04:26:14.034137+00');


--
-- Data for Name: know_me_catalog_question_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001201', 'de', 'Was wäre mein perfekter Sonntag?', 'Alltag');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001202', 'de', 'Was ist mein heimlicher Lieblingssnack?', 'Vorlieben');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001203', 'de', 'Was stresst mich mehr: Unordnung oder Zeitdruck?', 'Stress');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001204', 'de', 'Welcher Ort gibt mir Ruhe?', 'Ruhe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001205', 'de', 'Welche kleine Geste bedeutet mir besonders viel?', 'Nähe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001206', 'de', 'Was bringt mich fast immer zum Lachen?', 'Humor');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001207', 'de', 'Welches Lied passt gerade am besten zu meiner Stimmung?', 'Musik');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001208', 'de', 'Womit kann man mir nach einem langen Tag helfen?', 'Support');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001209', 'de', 'Welche Erinnerung mit dir erzähle ich besonders gern?', 'Erinnerung');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001210', 'de', 'Was ist mein Lieblingsritual mit dir?', 'Ritual');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001211', 'de', 'Welche Überraschung würde mich wirklich freuen?', 'Überraschung');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001212', 'de', 'Was brauche ich, wenn ich still werde?', 'Support');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001213', 'de', 'Welche Jahreszeit passt am besten zu mir?', 'Vorlieben');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001214', 'de', 'Was würde ich auf einer Reise zuerst fotografieren?', 'Reise');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001215', 'de', 'Welche Aufgabe schiebe ich am ehesten vor mir her?', 'Alltag');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001216', 'de', 'Was macht ein Zuhause für mich gemütlich?', 'Zuhause');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001217', 'de', 'Welche Nachricht von dir würde meinen Tag sofort besser machen?', 'Nähe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001218', 'de', 'Was ist mein liebster Start in den Morgen?', 'Alltag');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001219', 'de', 'Welche Kleinigkeit macht mich schneller ungeduldig?', 'Stress');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001220', 'de', 'Welche Date-Idee würde ich spontan wählen?', 'Date');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001221', 'de', 'Was würde ich an einem freien Abend am liebsten tun?', 'Freizeit');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001222', 'de', 'Welche Art Kompliment bleibt mir lange im Kopf?', 'Nähe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001223', 'de', 'Wobei fühle ich mich besonders verstanden?', 'Verbindung');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001224', 'de', 'Was ist für mich ein kleines Abenteuer?', 'Abenteuer');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001225', 'de', 'Welcher Duft erinnert mich an etwas Schönes?', 'Erinnerung');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001226', 'de', 'Was würde ich bestellen, wenn ich mich nicht entscheiden muss?', 'Vorlieben');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001227', 'de', 'Welche Gewohnheit von mir kennst du inzwischen gut?', 'Alltag');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001228', 'de', 'Welche gemeinsame Zukunftsidee macht mich neugierig?', 'Zukunft');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001229', 'de', 'Wann fühle ich mich dir besonders nah?', 'Nähe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001230', 'de', 'Was hilft mir, wenn ich mich verzettele?', 'Support');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001231', 'de', 'Welche Eigenschaft an mir unterschätze ich selbst?', 'Tiefe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001232', 'de', 'Was ist mein heimlicher Komfortfilm oder meine Komfortserie?', 'Freizeit');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001233', 'de', 'Welche kleine Tradition würde ich gern mit dir anfangen?', 'Ritual');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001234', 'de', 'Was sollte man mir sagen, wenn ich mutiger sein darf?', 'Support');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001235', 'de', 'Welche Pause tut mir wirklich gut?', 'Ruhe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001236', 'de', 'Worauf bin ich im Stillen stolz?', 'Tiefe');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001237', 'de', 'Welche Berührung bringt mich am schnellsten in Stimmung?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001238', 'de', 'Welche Art von Verführung gefällt mir besonders?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001239', 'de', 'Was macht mir beim Küssen am meisten Lust auf mehr?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001240', 'de', 'Welche Fantasie würde ich mit dir vielleicht gern teilen?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001241', 'de', 'Woran merkst du, dass ich mich begehrt fühle?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001242', 'de', 'Welche kleine sexuelle Überraschung würde mich neugierig machen?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001243', 'de', 'Was macht Sex für mich besonders verbindend?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001244', 'de', 'Wer ist mein Lieblingsmensch in meiner Familie?', 'Familie');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001245', 'de', 'Was wünsche ich mir von dir, wenn es um meine Familie geht?', 'Familie');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001246', 'de', 'Bei wem oder wobei in meiner Familie fühle ich mich besonders wohl?', 'Familie');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001247', 'de', 'Welche Kindheitserinnerung macht mich heute noch sofort weich?', 'Kindheit');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001248', 'de', 'Was hätte mein jüngeres Ich besonders gern öfter gehört?', 'Kindheit');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001249', 'de', 'Welches Spiel, Ritual oder Hobby aus meiner Kindheit würde ich gern noch einmal erleben?', 'Kindheit');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001250', 'de', 'Welcher Wert ist mir in einer Beziehung unverhandelbar wichtig?', 'Werte');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001251', 'de', 'Was bedeutet Treue für mich jenseits von nicht fremdgehen?', 'Werte');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001252', 'de', 'Woran merkst du, dass ich körperlich oder emotional erschöpft bin?', 'Körper & Wohlbefinden');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001253', 'de', 'Welche Art von Nähe hilft mir, wieder bei mir anzukommen?', 'Körper & Wohlbefinden');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001254', 'de', 'Welches Essen fühlt sich für mich nach Zuhause an?', 'Essen & Genuss');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001255', 'de', 'Welche gemeinsame Mahlzeit mit dir würde ich gern wiederholen?', 'Essen & Genuss');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001256', 'de', 'Bei welchem Ziel wünsche ich mir am meisten Rückhalt von dir?', 'Arbeit & Ziele');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001257', 'de', 'Woran merkst du, dass mich Arbeit innerlich noch beschäftigt?', 'Arbeit & Ziele');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001201', 'en', 'What would my perfect Sunday look like?', 'Everyday life');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001202', 'en', 'What is my secret favorite snack?', 'Preferences');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001203', 'en', 'What stresses me more: clutter or time pressure?', 'Stress');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001204', 'en', 'Which place helps me feel calm?', 'Calm');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001237', 'en', 'Which touch puts me in the mood fastest?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001238', 'en', 'What kind of seduction do I especially like?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001239', 'en', 'What about kissing makes me want more the most?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001240', 'en', 'Which fantasy might I like to share with you?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001241', 'en', 'How can you tell that I feel desired?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001242', 'en', 'What small sexual surprise would make me curious?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001243', 'en', 'What makes sex feel especially connecting for me?', 'Sex');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001244', 'en', 'Who is my favorite person in my family?', 'Family');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001245', 'en', 'What do I wish for from you when it comes to my family?', 'Family');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001246', 'en', 'With whom or where in my family do I feel especially comfortable?', 'Family');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001247', 'en', 'Which childhood memory still makes me immediately tender today?', 'Childhood');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001248', 'en', 'What would my younger self have loved to hear more often?', 'Childhood');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001249', 'en', 'Which game, ritual, or hobby from my childhood would I like to experience again?', 'Childhood');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001250', 'en', 'Which value is non-negotiably important to me in a relationship?', 'Values');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001251', 'en', 'What does loyalty mean to me beyond not cheating?', 'Values');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001252', 'en', 'How can you tell that I am physically or emotionally exhausted?', 'Body & Wellbeing');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001253', 'en', 'What kind of closeness helps me come back to myself?', 'Body & Wellbeing');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001254', 'en', 'Which food feels like home to me?', 'Food & Enjoyment');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001255', 'en', 'Which shared meal with you would I like to repeat?', 'Food & Enjoyment');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001256', 'en', 'For which goal do I most wish for your support?', 'Work & Goals');
INSERT INTO public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label) VALUES ('00000000-0000-0000-0000-000000001257', 'en', 'How can you tell that work is still on my mind?', 'Work & Goals');


--
-- Data for Name: know_me_questions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: know_me_guesses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: love_jar_notes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: love_jar_draws; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: love_jar_templates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001601', 'compliment', true, 10, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001602', 'compliment', true, 20, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001603', 'memory', true, 30, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001604', 'wish', true, 40, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001605', 'voucher', true, 50, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001606', 'compliment', true, 60, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001607', 'compliment', true, 70, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001608', 'memory', true, 80, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001609', 'compliment', true, 90, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001610', 'wish', true, 100, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001611', 'memory', true, 110, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001612', 'compliment', true, 120, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001613', 'memory', true, 130, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001614', 'compliment', true, 140, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001615', 'voucher', true, 150, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001616', 'surprise', true, 160, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001617', 'compliment', true, 170, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001618', 'wish', true, 180, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001619', 'surprise', true, 190, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001620', 'compliment', true, 200, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001621', 'wish', true, 210, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001622', 'wish', true, 220, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001623', 'compliment', true, 230, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001624', 'compliment', true, 240, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001625', 'wish', true, 250, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001626', 'compliment', true, 260, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001627', 'gratitude', true, 270, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001628', 'gratitude', true, 280, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001629', 'gratitude', true, 290, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001630', 'gratitude', true, 300, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001631', 'gratitude', true, 310, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001632', 'encouragement', true, 320, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001633', 'encouragement', true, 330, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001634', 'encouragement', true, 340, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001635', 'encouragement', true, 350, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001636', 'encouragement', true, 360, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001637', 'longing', true, 370, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001638', 'longing', true, 380, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001639', 'longing', true, 390, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001640', 'longing', true, 400, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001641', 'longing', true, 410, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001642', 'invitation', true, 420, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001643', 'invitation', true, 430, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001644', 'invitation', true, 440, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001645', 'invitation', true, 450, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001646', 'invitation', true, 460, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001647', 'apology', true, 470, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001648', 'apology', true, 480, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001649', 'apology', true, 490, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001650', 'apology', true, 500, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');
INSERT INTO public.love_jar_templates (id, category, active, sort_order, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000001651', 'apology', true, 510, '2026-06-18 04:26:14.321574+00', '2026-06-18 04:26:14.321574+00');


--
-- Data for Name: love_jar_template_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001601', 'de', 'Ich liebe an dir ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001602', 'de', 'Danke, dass du ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001603', 'de', 'Mein liebster Moment mit dir war ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001604', 'de', 'Ich freue mich mit dir auf ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001605', 'de', 'Gutschein für ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001606', 'de', 'Heute möchte ich dir sagen ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001607', 'de', 'Du hast meinen Tag leichter gemacht, weil ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001608', 'de', 'Ich musste an dich denken, als ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001609', 'de', 'Eine kleine Sache, die ich an dir bewundere, ist ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001610', 'de', 'Wenn wir bald Zeit haben, wünsche ich mir ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001611', 'de', 'Mein Herzmoment der Woche mit dir war ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001612', 'de', 'Ich fühle mich dir nah, wenn ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001613', 'de', 'Eine Erinnerung, die ich gern wiederholen würde, ist ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001614', 'de', 'Ich bin stolz auf uns, weil ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001615', 'de', 'Gutschein für einen Abend ohne Handy: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001616', 'de', 'Heute schenke ich dir diesen Gedanken: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001617', 'de', 'Was du vielleicht zu selten hörst: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001618', 'de', 'Ich freue mich auf unser nächstes ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001619', 'de', 'Ein kleines Versprechen für diese Woche: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001620', 'de', 'Du bringst mich zum Lächeln, wenn ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001621', 'de', 'Ich möchte dir bald wieder zeigen, dass ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001622', 'de', 'Ein Wunsch für uns beide: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001623', 'de', 'Danke für deine Geduld bei ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001624', 'de', 'Ich fühle mich sicher mit dir, wenn ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001625', 'de', 'Ein Mini-Date, das ich gern mit dir hätte: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001626', 'de', 'Was ich an unserem Alltag liebe: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001627', 'de', 'Danke, dass du mich so oft genau dort auffängst, wo ich es selbst nicht schaffe.');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001628', 'de', 'Ich bin dir dankbar für eine kleine Sache, die du wahrscheinlich selbst kaum bemerkst: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001629', 'de', 'Danke, dass du mein Leben wärmer machst, indem du ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001630', 'de', 'Ich merke viel zu selten laut an, wie sehr ich schätze, dass du ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001631', 'de', 'Heute möchte ich dir danken für den Moment, in dem du ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001632', 'de', 'Ich glaube an dich, besonders wenn du gerade an dir zweifelst, weil ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001633', 'de', 'Du darfst heute einen Schritt langsamer gehen. Ich bin trotzdem stolz auf dich, weil ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001634', 'de', 'Falls dein Tag schwer ist: Denk daran, wie stark du schon warst, als ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001635', 'de', 'Ich sehe in dir eine Stärke, die du manchmal übersiehst: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001636', 'de', 'Du musst heute nicht alles schaffen. Für mich bist du genug, auch wenn ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001637', 'de', 'Ich vermisse gerade besonders, wie es sich anfühlt, wenn du ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001638', 'de', 'Wenn ich jetzt bei dir wäre, würde ich als Erstes ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001639', 'de', 'Ein kleiner Moment mit dir, nach dem ich mich heute sehne, ist ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001640', 'de', 'Ich freue mich schon darauf, dich wieder in den Arm zu nehmen und ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001641', 'de', 'Bis wir uns wiedersehen, halte ich diesen Gedanken für dich fest: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001642', 'de', 'Ich lade dich ein zu einem kleinen Moment nur für uns: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001643', 'de', 'Komm heute Abend kurz mit mir raus, damit wir ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001644', 'de', 'Lass uns bald etwas machen, das sich wieder nach uns anfühlt: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001645', 'de', 'Ich möchte dich auf ein Mini-Date entführen, bei dem wir ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001646', 'de', 'Such dir einen Abend aus. Ich kümmere mich um ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001647', 'de', 'Es tut mir leid, dass ich zuletzt nicht genug gesehen habe, wie du dich gefühlt hast bei ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001648', 'de', 'Ich möchte etwas wiedergutmachen, weil mir wichtig ist, dass du dich bei mir sicher fühlst: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001649', 'de', 'Entschuldige, dass ich in diesem Moment nicht so liebevoll war, wie du es verdient hast: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001650', 'de', 'Ich will besser zuhören, wenn es um ... geht.');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001651', 'de', 'Es tut mir leid für meinen Anteil an ... und ich möchte dir zeigen, dass ich daraus lerne.');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001601', 'en', 'What I love about you is ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001602', 'en', 'Thank you for ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001603', 'en', 'My favorite moment with you was ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001604', 'en', 'I am looking forward to ... with you');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001605', 'en', 'Voucher for ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001606', 'en', 'Today I want to tell you ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001607', 'en', 'You made my day easier because ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001608', 'en', 'I thought of you when ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001609', 'en', 'One small thing I admire about you is ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001610', 'en', 'When we have time soon, I wish for ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001611', 'en', 'My heart moment of the week with you was ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001612', 'en', 'I feel close to you when ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001613', 'en', 'A memory I would love to repeat is ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001614', 'en', 'I am proud of us because ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001615', 'en', 'Voucher for a phone-free evening: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001616', 'en', 'Today I am giving you this thought: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001617', 'en', 'What you may not hear often enough: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001618', 'en', 'I am looking forward to our next ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001619', 'en', 'A small promise for this week: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001620', 'en', 'You make me smile when ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001621', 'en', 'I want to show you again soon that ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001622', 'en', 'A wish for both of us: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001623', 'en', 'Thank you for your patience with ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001624', 'en', 'I feel safe with you when ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001625', 'en', 'A mini date I would like with you: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001626', 'en', 'What I love about our everyday life: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001627', 'en', 'Thank you for catching me so often exactly where I cannot manage it myself.');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001628', 'en', 'I am grateful to you for one small thing you probably barely notice yourself: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001629', 'en', 'Thank you for making my life warmer by ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001630', 'en', 'I say far too rarely out loud how much I appreciate that you ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001631', 'en', 'Today I want to thank you for the moment when you ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001632', 'en', 'I believe in you, especially when you are doubting yourself, because ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001633', 'en', 'You may take one slower step today. I am still proud of you because ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001634', 'en', 'If your day is hard: remember how strong you already were when ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001635', 'en', 'I see a strength in you that you sometimes overlook: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001636', 'en', 'You do not have to manage everything today. To me, you are enough, even when ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001637', 'en', 'Right now I especially miss how it feels when you ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001638', 'en', 'If I were with you right now, the first thing I would do is ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001639', 'en', 'One small moment with you that I am longing for today is ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001640', 'en', 'I am already looking forward to holding you again and ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001641', 'en', 'Until we see each other again, I am keeping this thought for you: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001642', 'en', 'I invite you into a small moment just for us: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001643', 'en', 'Come outside with me for a moment tonight so we can ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001644', 'en', 'Let us soon do something that feels like us again: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001645', 'en', 'I want to take you on a mini date where we ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001646', 'en', 'Choose an evening. I will take care of ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001647', 'en', 'I am sorry that recently I did not see enough how you felt about ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001648', 'en', 'I want to make something right because it matters to me that you feel safe with me: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001649', 'en', 'I am sorry that in that moment I was not as loving as you deserved: ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001650', 'en', 'I want to listen better when it is about ...');
INSERT INTO public.love_jar_template_translations (template_id, locale, text) VALUES ('00000000-0000-0000-0000-000000001651', 'en', 'I am sorry for my part in ... and I want to show you that I am learning from it.');


--
-- Data for Name: memory_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: message_templates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.dailyAnswerWaiting', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.dailyRevealed', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.questWaitingConfirmation', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.questCompleted', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.loveJarNote', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.memoryCreated', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.knowMeQuestion', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.knowMeAnsweredHit', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.knowMeAnsweredMiss', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.coupleDisconnected', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.dailyAnswerWaiting', 'notifications', '{name}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.dailyRevealed', 'notifications', '{}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.questWaitingConfirmation', 'notifications', '{name,title}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.questCompleted', 'notifications', '{title}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.loveJarNote', 'notifications', '{name}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.memoryCreated', 'notifications', '{name,title}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.knowMeQuestion', 'notifications', '{name}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.knowMeAnsweredHit', 'notifications', '{name}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.knowMeAnsweredMiss', 'notifications', '{name}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.coupleDisconnected', 'notifications', '{name}', true, '2026-06-18 04:26:14.691406+00', '2026-06-18 04:26:14.983178+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.coupleJoined', 'notifications', '{name}', true, '2026-06-18 04:26:15.196925+00', '2026-06-18 04:26:15.196925+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.coupleJoined', 'notifications', '{name}', true, '2026-06-18 04:26:15.196925+00', '2026-06-18 04:26:15.196925+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('emails.passwordReset.subject', 'email', '{}', true, '2026-06-21 04:47:24.42765+00', '2026-06-21 04:47:24.42765+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('emails.passwordReset.body', 'email', '{displayName,resetUrl,expiresInMinutes}', true, '2026-06-21 04:47:24.42765+00', '2026-06-21 04:47:24.42765+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.dailyAnswerWaiting', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.dailyRevealed', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.questWaitingConfirmation', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.questCompleted', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.loveJarNote', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.memoryCreated', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.knowMeQuestion', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.knowMeAnsweredHit', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.knowMeAnsweredMiss', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.coupleDisconnected', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.coupleJoined', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.dailyAnswerWaiting', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.dailyRevealed', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.questWaitingConfirmation', 'push', '{name,title}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.questCompleted', 'push', '{title}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.loveJarNote', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.memoryCreated', 'push', '{name,title}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.knowMeQuestion', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.knowMeAnsweredHit', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.knowMeAnsweredMiss', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.coupleDisconnected', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.coupleJoined', 'push', '{name}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.test', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.test', 'push', '{}', true, '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.titles.adminPasswordReset', 'notifications', '{}', true, '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('notifications.bodies.adminPasswordReset', 'notifications', '{}', true, '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.titles.adminPasswordReset', 'push', '{}', true, '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('push.bodies.adminPasswordReset', 'push', '{}', true, '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('emails.adminPasswordReset.subject', 'email', '{}', true, '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_templates (key, namespace, required_params, active, created_at, updated_at) VALUES ('emails.adminPasswordReset.body', 'email', '{displayName}', true, '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');


--
-- Data for Name: message_template_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.dailyAnswerWaiting', 'de', 'Antwort wartet', 'Benachrichtigungstitel: Antwort wartet', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.dailyRevealed', 'de', 'Eure Antworten sind sichtbar', 'Benachrichtigungstitel: Tagesfrage freigeschaltet', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.loveJarNote', 'de', 'Ein neuer Zettel wartet', 'Benachrichtigungstitel: Liebesglas-Zettel', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.memoryCreated', 'de', 'Neue Erinnerung', 'Benachrichtigungstitel: Erinnerung erstellt', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.knowMeQuestion', 'de', 'Eine Kennst-du-mich-Frage wartet', 'Benachrichtigungstitel: Kennst-du-mich-Frage', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.knowMeAnsweredHit', 'de', 'Treffer im Kennst-du-mich-Spiel', 'Benachrichtigungstitel: Kennst-du-mich richtig geraten', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.knowMeAnsweredMiss', 'de', 'Eine Antwort ist da', 'Benachrichtigungstitel: Kennst-du-mich falsch geraten', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.coupleDisconnected', 'de', 'Paarung wurde getrennt', 'Benachrichtigungstitel: Paarung getrennt', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.dailyAnswerWaiting', 'de', '{name} hat die Tagesfrage beantwortet. Jetzt fehlst noch du.', 'Benachrichtigungstext: Antwort wartet', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.dailyRevealed', 'de', 'Ihr habt beide geantwortet. Eine neue Blume ist gewachsen.', 'Benachrichtigungstext: Tagesfrage freigeschaltet', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.questWaitingConfirmation', 'de', '{name} hat "{title}" bestätigt. Wenn es für dich auch passt, kannst du sie abschließen.', 'Benachrichtigungstext: Aufgabe wartet auf Bestätigung', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.memoryCreated', 'de', '{name} hat "{title}" in eure Timeline gelegt.', 'Benachrichtigungstext: Erinnerung erstellt', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.knowMeQuestion', 'de', '{name} hat eine Frage über sich gestellt. Was schätzt du?', 'Benachrichtigungstext: Kennst-du-mich-Frage', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.knowMeAnsweredHit', 'de', '{name} hat dich richtig eingeschätzt. Eine besondere Blume ist gewachsen.', 'Benachrichtigungstext: Kennst-du-mich richtig geraten', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.knowMeAnsweredMiss', 'de', '{name} hat geraten. Nicht getroffen, aber ein neuer Gesprächsanlass.', 'Benachrichtigungstext: Kennst-du-mich falsch geraten', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.coupleDisconnected', 'de', '{name} hat das Konto gelöscht. Eure Paarung wurde deshalb getrennt. Du kannst dich jetzt neu paaren.', 'Benachrichtigungstext: Paarung getrennt', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.questWaitingConfirmation', 'de', 'Aufgabe wartet auf dich', 'Benachrichtigungstitel: Aufgabe wartet auf Bestätigung', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.questCompleted', 'de', 'Aufgabe abgeschlossen', 'Benachrichtigungstitel: Aufgabe abgeschlossen', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.questCompleted', 'de', 'Eure Aufgabe "{title}" hat euren Garten wachsen lassen.', 'Benachrichtigungstext: Aufgabe abgeschlossen', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.696561+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.loveJarNote', 'de', '{name} hat etwas in euer Liebesglas gelegt.', 'Benachrichtigungstext: Liebesglas-Zettel', '2026-06-18 04:26:14.696561+00', '2026-06-18 04:26:14.994909+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.coupleJoined', 'de', 'Dein Partner ist da', 'Benachrichtigungstitel: Partner beigetreten', '2026-06-18 04:26:15.20095+00', '2026-06-18 04:26:15.20095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.coupleJoined', 'de', 'Toll, {name} hat deinen Paarraum betreten. Ihr könnt nun gemeinsam an eurem Garten arbeiten.', 'Benachrichtigungstext: Partner beigetreten', '2026-06-18 04:26:15.20095+00', '2026-06-18 04:26:15.20095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.dailyAnswerWaiting', 'en', 'Answer waiting', 'Notification title: answer waiting', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.dailyRevealed', 'en', 'Your answers are visible', 'Notification title: daily question revealed', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.questWaitingConfirmation', 'en', 'Quest waiting for you', 'Notification title: quest awaiting confirmation', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.questCompleted', 'en', 'Quest completed', 'Notification title: quest completed', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.loveJarNote', 'en', 'A new note is waiting', 'Notification title: love jar note', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.memoryCreated', 'en', 'New memory', 'Notification title: memory created', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.knowMeQuestion', 'en', 'A Know Me question is waiting', 'Notification title: Know Me question', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.knowMeAnsweredHit', 'en', 'Hit in the Know Me game', 'Notification title: Know Me guessed correctly', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.knowMeAnsweredMiss', 'en', 'An answer is in', 'Notification title: Know Me guessed incorrectly', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.coupleDisconnected', 'en', 'Pairing was disconnected', 'Notification title: pairing disconnected', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.coupleJoined', 'en', 'Your partner is here', 'Notification title: partner joined', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.dailyAnswerWaiting', 'en', '{name} answered the daily question. Now it is your turn.', 'Notification body: answer waiting', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.dailyRevealed', 'en', 'You both answered. A new flower has grown.', 'Notification body: daily question revealed', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.questWaitingConfirmation', 'en', '{name} confirmed "{title}". If it works for you too, you can complete it.', 'Notification body: quest awaiting confirmation', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.questCompleted', 'en', 'Your quest "{title}" helped your garden grow.', 'Notification body: quest completed', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.loveJarNote', 'en', '{name} put something in your love jar.', 'Notification body: love jar note', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.memoryCreated', 'en', '{name} added "{title}" to your timeline.', 'Notification body: memory created', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.knowMeQuestion', 'en', '{name} asked a question about themselves. What is your guess?', 'Notification body: Know Me question', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.knowMeAnsweredHit', 'en', '{name} guessed you correctly. A special flower has grown.', 'Notification body: Know Me guessed correctly', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.knowMeAnsweredMiss', 'en', '{name} guessed. Not a hit, but a new conversation starter.', 'Notification body: Know Me guessed incorrectly', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.coupleDisconnected', 'en', '{name} deleted the account. Your pairing was disconnected because of that. You can pair again now.', 'Notification body: pairing disconnected', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.coupleJoined', 'en', 'Great, {name} joined your couple space. You can now work on your garden together.', 'Notification body: partner joined', '2026-06-21 04:47:24.31095+00', '2026-06-21 04:47:24.31095+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.passwordReset.subject', 'de', 'Passwort für deinen Herzgarten zurücksetzen', 'E-Mail-Betreff: Passwort zurücksetzen', '2026-06-21 04:47:24.42765+00', '2026-06-21 04:47:24.503625+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.passwordReset.body', 'de', '
Hallo {displayName},

du hast angefragt, dein Herzgarten-Passwort zurückzusetzen.

Öffne diesen Link, um ein neues Passwort zu vergeben:
{resetUrl}

Der Link ist {expiresInMinutes} Minuten gültig.

Wenn du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.
', 'E-Mail-Text: Passwort zurücksetzen', '2026-06-21 04:47:24.42765+00', '2026-06-21 04:47:24.503625+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.passwordReset.subject', 'en', 'Reset your Herzgarten password', 'Email subject: password reset', '2026-06-21 04:47:24.42765+00', '2026-06-21 04:47:24.503625+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.passwordReset.body', 'en', '
Hello {displayName},

you asked to reset your Herzgarten password.

Open this link to choose a new password:
{resetUrl}

The link is valid for {expiresInMinutes} minutes.

If you did not request a new password, you can ignore this email.
', 'Email body: password reset', '2026-06-21 04:47:24.42765+00', '2026-06-21 04:47:24.503625+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.dailyAnswerWaiting', 'de', 'Antwort wartet', 'Push-Titel: Antwort wartet', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.dailyRevealed', 'de', 'Eure Antworten sind sichtbar', 'Push-Titel: Tagesfrage freigeschaltet', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.questWaitingConfirmation', 'de', 'Aufgabe wartet auf dich', 'Push-Titel: Aufgabe wartet auf Bestätigung', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.questCompleted', 'de', 'Aufgabe abgeschlossen', 'Push-Titel: Aufgabe abgeschlossen', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.loveJarNote', 'de', 'Ein neuer Zettel wartet', 'Push-Titel: Liebesglas-Zettel', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.memoryCreated', 'de', 'Neue Erinnerung', 'Push-Titel: Erinnerung erstellt', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.knowMeQuestion', 'de', 'Eine Kennst-du-mich-Frage wartet', 'Push-Titel: Kennst-du-mich-Frage', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.knowMeAnsweredHit', 'de', 'Treffer im Kennst-du-mich-Spiel', 'Push-Titel: Kennst-du-mich richtig geraten', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.knowMeAnsweredMiss', 'de', 'Eine Antwort ist da', 'Push-Titel: Kennst-du-mich falsch geraten', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.coupleDisconnected', 'de', 'Paarung wurde getrennt', 'Push-Titel: Paarung getrennt', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.coupleJoined', 'de', '{name} ist da', 'Push-Titel: Partner beigetreten', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.dailyAnswerWaiting', 'de', '{name} hat geantwortet. Jetzt fehlst noch du.', 'Push-Text: Antwort wartet', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.dailyRevealed', 'de', 'Ihr habt beide geantwortet. Eine neue Blume ist gewachsen.', 'Push-Text: Tagesfrage freigeschaltet', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.questWaitingConfirmation', 'de', '{name} hat "{title}" bestätigt. Du kannst jetzt abschließen.', 'Push-Text: Aufgabe wartet auf Bestätigung', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.questCompleted', 'de', 'Eure Aufgabe "{title}" hat euren Garten wachsen lassen.', 'Push-Text: Aufgabe abgeschlossen', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.loveJarNote', 'de', '{name} hat etwas in euer Liebesglas gelegt.', 'Push-Text: Liebesglas-Zettel', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.memoryCreated', 'de', '{name} hat "{title}" in eure Timeline gelegt.', 'Push-Text: Erinnerung erstellt', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.knowMeQuestion', 'de', '{name} hat eine Frage über sich gestellt. Was schätzt du?', 'Push-Text: Kennst-du-mich-Frage', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.knowMeAnsweredHit', 'de', '{name} hat dich richtig eingeschätzt.', 'Push-Text: Kennst-du-mich richtig geraten', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.knowMeAnsweredMiss', 'de', '{name} hat geraten. Ein neuer Gesprächsanlass ist da.', 'Push-Text: Kennst-du-mich falsch geraten', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.coupleDisconnected', 'de', '{name} hat das Konto gelöscht. Eure Paarung wurde getrennt.', 'Push-Text: Paarung getrennt', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.coupleJoined', 'de', '{name} hat deinen Paarraum betreten.', 'Push-Text: Partner beigetreten', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.test', 'de', 'Herzgarten Test', 'Push-Titel: Testnachricht', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.test', 'de', 'Push-Benachrichtigungen sind aktiv.', 'Push-Text: Testnachricht', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.dailyAnswerWaiting', 'en', 'Answer waiting', 'Push title: answer waiting', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.dailyRevealed', 'en', 'Your answers are visible', 'Push title: daily question revealed', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.questWaitingConfirmation', 'en', 'Quest waiting for you', 'Push title: quest awaiting confirmation', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.questCompleted', 'en', 'Quest completed', 'Push title: quest completed', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.loveJarNote', 'en', 'A new note is waiting', 'Push title: love jar note', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.memoryCreated', 'en', 'New memory', 'Push title: memory created', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.knowMeQuestion', 'en', 'A Know Me question is waiting', 'Push title: Know Me question', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.knowMeAnsweredHit', 'en', 'Hit in the Know Me game', 'Push title: Know Me guessed correctly', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.knowMeAnsweredMiss', 'en', 'An answer is in', 'Push title: Know Me guessed incorrectly', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.coupleDisconnected', 'en', 'Pairing was disconnected', 'Push title: pairing disconnected', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.coupleJoined', 'en', '{name} is here', 'Push title: partner joined', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.dailyAnswerWaiting', 'en', '{name} answered. Now it is your turn.', 'Push body: answer waiting', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.dailyRevealed', 'en', 'You both answered. A new flower has grown.', 'Push body: daily question revealed', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.questWaitingConfirmation', 'en', '{name} confirmed "{title}". You can complete it now.', 'Push body: quest awaiting confirmation', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.questCompleted', 'en', 'Your quest "{title}" helped your garden grow.', 'Push body: quest completed', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.loveJarNote', 'en', '{name} put something in your love jar.', 'Push body: love jar note', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.memoryCreated', 'en', '{name} added "{title}" to your timeline.', 'Push body: memory created', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.knowMeQuestion', 'en', '{name} asked a question about themselves. What is your guess?', 'Push body: Know Me question', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.knowMeAnsweredHit', 'en', '{name} guessed you correctly.', 'Push body: Know Me guessed correctly', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.knowMeAnsweredMiss', 'en', '{name} guessed. A new conversation starter is here.', 'Push body: Know Me guessed incorrectly', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.coupleDisconnected', 'en', '{name} deleted the account. Your pairing was disconnected.', 'Push body: pairing disconnected', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.coupleJoined', 'en', '{name} joined your couple space.', 'Push body: partner joined', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.test', 'en', 'Herzgarten Test', 'Push title: test notification', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.test', 'en', 'Push notifications are active.', 'Push body: test notification', '2026-06-21 04:47:24.510522+00', '2026-06-21 04:47:24.510522+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.adminPasswordReset.subject', 'de', 'Dein Herzgarten-Passwort wurde neu gesetzt', 'E-Mail-Betreff: Admin hat Passwort neu gesetzt', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.adminPasswordReset.body', 'de', 'Hallo {displayName},

dein Herzgarten-Passwort wurde durch einen Administrator neu gesetzt.

Wenn du diese Änderung nicht erwartet hast, melde dich bitte sofort beim Support. Aus Sicherheitsgründen enthält diese E-Mail kein Passwort.', 'E-Mail-Text: Admin hat Passwort neu gesetzt', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.adminPasswordReset', 'de', 'Dein Passwort wurde durch einen Administrator neu gesetzt', 'Benachrichtigungstitel: Admin hat Passwort neu gesetzt', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.adminPasswordReset', 'de', 'Ein Administrator hat dein Passwort neu gesetzt. Wenn du das nicht erwartet hast, melde dich bitte sofort beim Support und ändere dein Passwort erneut.', 'Benachrichtigungstext: Admin hat Passwort neu gesetzt', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.adminPasswordReset', 'de', 'Passwort durch Admin neu gesetzt', 'Push-Titel: Admin hat Passwort neu gesetzt', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.adminPasswordReset', 'de', 'Prüfe dein Konto. Dein Passwort wurde durch einen Administrator geändert.', 'Push-Text: Admin hat Passwort neu gesetzt', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.titles.adminPasswordReset', 'en', 'Your password was reset by an administrator', 'Notification title: admin reset password', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('notifications.bodies.adminPasswordReset', 'en', 'An administrator reset your password. If you did not expect this, contact support immediately and change your password again.', 'Notification body: admin reset password', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.titles.adminPasswordReset', 'en', 'Password reset by admin', 'Push title: admin reset password', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('push.bodies.adminPasswordReset', 'en', 'Check your account. Your password was changed by an administrator.', 'Push body: admin reset password', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.adminPasswordReset.subject', 'en', 'Your Herzgarten password was reset', 'Email subject: admin reset password', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');
INSERT INTO public.message_template_translations (template_key, locale, text, description, created_at, updated_at) VALUES ('emails.adminPasswordReset.body', 'en', 'Hello {displayName},

your Herzgarten password was reset by an administrator.

If you did not expect this change, please contact support immediately. For security reasons, this email does not contain a password.', 'Email body: admin reset password', '2026-06-21 04:47:24.53672+00', '2026-06-21 04:47:24.53672+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: password_reset_requests; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quest_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000201', 'de', 'Drei Komplimente', 'Schreibt euch gegenseitig drei konkrete Komplimente.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000202', 'de', 'Spaziergang ohne Handy', 'Geht gemeinsam spazieren und lasst die Handys in der Tasche.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000203', 'de', 'Aktueller Moment', 'Schickt euch ein Foto von eurem aktuellen Moment.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000204', 'de', 'Mini-Date zu Hause', 'Legt Musik auf, macht euch ein Getränk und schenkt euch 20 Minuten ohne Ablenkung.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000205', 'de', 'Dank für etwas Konkretes', 'Sagt euch jeweils eine Sache, für die ihr heute dankbar seid.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000206', 'de', 'Alte Fotos ansehen', 'Sucht gemeinsam drei Fotos aus, die euch an eine schöne Zeit erinnern.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000208', 'de', 'Ein Song gleichzeitig', 'Startet zur gleichen Zeit denselben Song und schreibt euch eine Zeile dazu.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000209', 'de', 'Zukunftswunsch', 'Schreibt je einen kleinen Wunsch auf, den ihr irgendwann gemeinsam erleben wollt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000210', 'de', 'Insider-Witz sammeln', 'Erinnert euch an einen Insider-Witz und gebt ihm einen Namen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000211', 'de', 'Stress kurz teilen', 'Nennt je eine Sache, die gerade anstrengend ist, und eine kleine Hilfe.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000212', 'de', 'Zwei-Minuten-Danke', 'Sagt euch nacheinander eine konkrete Sache, für die ihr heute dankbar seid.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000213', 'de', 'Lieblingssnack-Date', 'Besorgt oder bereitet einen Lieblingssnack und schenkt euch 15 Minuten ohne Ablenkung.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000214', 'de', 'Insider-Wort', 'Erfindet ein neues Wort für etwas, das nur ihr beide versteht.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000215', 'de', 'Foto-Rückblick', 'Wählt ein altes Foto aus und erzählt euch, was ihr daran mögt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000216', 'de', 'Kleine Hilfe', 'Übernehmt eine kleine Aufgabe, die dem anderen heute Luft gibt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000217', 'de', 'Gleiches Lied', 'Hört zur gleichen Zeit denselben Song und schreibt euch danach einen Satz.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000218', 'de', 'Zukunftszettel', 'Schreibt beide einen Wunsch für dieses Jahr auf und lest ihn euch vor.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000219', 'de', 'Spaziergang mit Frage', 'Geht spazieren und nehmt eine Frage mit, die nicht organisatorisch ist.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000220', 'de', 'Stress-Ampel', 'Nennt rot, gelb und grün für eure aktuelle Woche: schwer, mittel, gut.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000221', 'de', 'Kompliment per Sprachnachricht', 'Schickt eine kurze Sprachnachricht mit einem ehrlichen Kompliment.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000222', 'de', 'Wohnzimmer-Picknick', 'Legt eine Decke aus und macht aus einem normalen Essen ein kleines Picknick.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000223', 'de', 'Drei gute Dinge', 'Nennt drei Dinge, die in eurer Beziehung gerade gut laufen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000224', 'de', 'Albernes Selfie', 'Macht ein absichtlich albernes Paar-Selfie oder beschreibt eins aus der Ferne.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000225', 'de', 'Nächstes Wiedersehen', 'Plant einen kleinen konkreten Punkt fuer euer nächstes Wiedersehen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000226', 'de', 'Dank an früher', 'Erinnert euch an eine schwere Phase und sagt, was ihr daran geschafft habt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000227', 'de', 'Mini-Aufraue-Team', 'Macht gemeinsam einen 10-Minuten-Aufraue-Sprint mit Musik.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000228', 'de', 'Überraschung unter 5 Euro', 'Plant eine kleine Überraschung, die nicht teuer sein muss.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000229', 'de', 'Sternstunden-Liste', 'Schreibt drei Momente auf, die sich nach euch anfühlen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000230', 'de', 'Keine-Handy-Insel', 'Legt für 30 Minuten beide Handys weg und macht etwas Einfaches zusammen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000231', 'de', 'Wer würde eher', 'Spielt zehn schnelle Wer-würde-eher-Fragen, liebevoll und ohne Sticheln.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000201', 'en', 'Three Compliments', 'Write each other three specific compliments.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000202', 'en', 'Phone-Free Walk', 'Go for a walk together and keep your phones in your pockets.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000203', 'en', 'Current Moment', 'Send each other a photo of your current moment.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000204', 'en', 'Mini Date at Home', 'Put on music, make yourselves a drink, and give each other 20 minutes without distractions.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000205', 'en', 'Thanks for Something Specific', 'Each tell the other one specific thing you are grateful for today.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000206', 'en', 'Look at Old Photos', 'Choose three photos together that remind you of a beautiful time.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000207', 'en', '10-Minute Teamwork', 'Do a small everyday task together and make it feel easy.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000208', 'en', 'One Song at the Same Time', 'Start the same song at the same time and send each other one line about it.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000209', 'en', 'Future Wish', 'Each write down one small wish you want to experience together someday.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000210', 'en', 'Collect an Inside Joke', 'Remember an inside joke and give it a name.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000211', 'en', 'Share Stress Briefly', 'Each name one thing that feels hard right now and one small thing that would help.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000212', 'en', 'Two-Minute Thanks', 'Take turns naming one specific thing you are grateful for today.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000213', 'en', 'Favorite Snack Date', 'Get or prepare a favorite snack and give each other 15 minutes without distractions.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000214', 'en', 'Inside Word', 'Invent a new word for something only the two of you understand.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000215', 'en', 'Photo Flashback', 'Choose an old photo and tell each other what you like about it.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000216', 'en', 'Small Help', 'Take over one small task that gives the other person some breathing room today.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000217', 'en', 'Same Song', 'Listen to the same song at the same time and write each other one sentence afterward.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000218', 'en', 'Future Note', 'Both write down one wish for this year and read it to each other.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000219', 'en', 'Walk with a Question', 'Go for a walk and bring along a question that is not about logistics.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000220', 'en', 'Stress Traffic Light', 'Name red, yellow, and green for your current week: hard, mixed, good.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000221', 'en', 'Compliment by Voice Message', 'Send a short voice message with an honest compliment.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000222', 'en', 'Living Room Picnic', 'Spread out a blanket and turn an ordinary meal into a small picnic.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000223', 'en', 'Three Good Things', 'Name three things that are going well in your relationship right now.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000224', 'en', 'Silly Selfie', 'Take an intentionally silly couple selfie or describe one from afar.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000225', 'en', 'Next Reunion', 'Plan one small concrete detail for your next reunion.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000226', 'en', 'Thanks to Earlier Us', 'Remember a hard phase and say what you managed to get through.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000227', 'en', 'Mini Cleanup Team', 'Do a 10-minute cleanup sprint together with music.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000228', 'en', 'Surprise Under 5 Euros', 'Plan a small surprise that does not have to cost much.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000229', 'en', 'Bright Moments List', 'Write down three moments that feel like the two of you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000230', 'en', 'Phone-Free Island', 'Put both phones away for 30 minutes and do something simple together.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000231', 'en', 'Who Would Rather', 'Play ten quick who-would-rather questions, lovingly and without jabs.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000207', 'de', '10-Minuten-Zusammenarbeit', 'Erledigt gemeinsam eine kleine Alltagsaufgabe und macht sie euch leicht.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000232', 'de', 'Lieblingsort-Date', 'Geht an einen Ort, der sich für einen von euch besonders gut anfühlt, und erzählt warum.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000233', 'de', '20-Minuten-nur-wir', 'Stellt einen Timer und schenkt euch 20 Minuten ohne Handy, Haushalt oder Organisation.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000234', 'de', 'Lach-Archiv', 'Sammelt drei Momente, über die ihr heute noch lachen müsst, und gebt ihnen lustige Titel.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000235', 'de', 'Schlechter-Flirt-Wettbewerb', 'Macht euch absichtlich übertriebene, schlechte Anmachsprüche und kürt den liebevollsten.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000236', 'de', 'Gleicher Himmel', 'Schaut zur gleichen Zeit aus dem Fenster oder in den Himmel und beschreibt euch, was ihr seht.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000237', 'de', 'Gute-Nacht-Sprachnachricht', 'Schickt euch je eine kurze Nachricht mit einem Gedanken, der Nähe schafft.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000238', 'de', 'Unser kleiner Meilenstein', 'Erzählt euch von einem Moment, in dem ihr gemerkt habt: Wir sind ein gutes Team.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000239', 'de', 'Damals und Heute', 'Wählt eine alte Erinnerung und sagt, was sich seitdem zwischen euch schön entwickelt hat.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000240', 'de', 'Ein Satz, der bleibt', 'Schreibt euch je einen Satz, den der andere an einem schweren Tag wieder lesen darf.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000241', 'de', 'Kleine Liebeserklärung', 'Sagt euch drei Dinge: was ihr liebt, was ihr bewundert, was ihr euch wünscht.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000242', 'de', 'Team-Check-in', 'Nennt je eine Sache, die gerade leichter wäre, wenn ihr sie gemeinsam tragt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000243', 'de', 'Aufgaben-Tausch', 'Übernehmt heute bewusst eine kleine Aufgabe, die dem anderen spürbar hilft.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000244', 'de', 'Sanfter Abend', 'Fragt euch gegenseitig: Was würde dir heute guttun? Dann erfüllt eine kleine Sache davon.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000245', 'de', 'Akku-Aufladen', 'Jeder nennt eine Sache, die Energie kostet, und eine Sache, die heute entlasten würde.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000246', 'de', 'Unser Fantasie-Date', 'Erfindet ein Date, das es nur in eurer Welt gibt, und malt oder beschreibt es kurz.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000247', 'de', 'Paar-Playlist-Cover', 'Denkt euch ein Albumcover und einen Titel für eure Beziehung gerade aus.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000248', 'de', 'Haushalt mit Herz', 'Macht zusammen 15 Minuten Haushalt und sagt dabei drei Dinge, die ihr am Alltag miteinander mögt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000249', 'de', 'Wohlfühl-Ecke', 'Räumt oder gestaltet eine kleine Ecke so, dass sie sich mehr nach euch beiden anfühlt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000250', 'de', 'Hand-in-Hand-Runde', 'Geht eine kleine Runde und beantwortet unterwegs: Was hat uns diese Woche verbunden?');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000251', 'de', 'Fundstück für dich', 'Findet draußen etwas Kleines, das euch an den anderen erinnert, und erklärt warum.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000252', 'de', 'Digitales Mini-Date', 'Macht einen Video- oder Chat-Termin mit einer festen Frage und einem schönen Abschlussritual.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000253', 'de', 'Foto mit Bedeutung', 'Schickt euch ein Foto aus eurem Tag und erzählt die kleine Geschichte dahinter.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000254', 'de', 'Kleine Freude', 'Plant eine kleine Überraschung, die zeigt: Ich habe an dich gedacht.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000255', 'de', 'Geheimer Wunschzettel', 'Schreibt heimlich drei kleine Dinge auf, über die ihr euch freuen würdet, und tauscht sie aus.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000256', 'de', 'Erstes-Date-Gefühl', 'Erinnert euch an euer erstes Date oder einen frühen Moment und wiederholt eine kleine Geste davon.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000257', 'de', 'Lieblingsfragen-Abend', 'Sucht euch drei Fragen aus, die ihr euch lange nicht gestellt habt, und beantwortet sie in Ruhe.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000258', 'de', 'Gemeinsame Comedy-Minute', 'Zeigt euch je etwas Kurzes, das euch zum Lachen bringt, und erklärt, warum es zu euch passt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000259', 'de', 'Kosenamen-Labor', 'Erfindet drei liebevolle oder alberne Kosenamen und entscheidet, welcher bleiben darf.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000260', 'de', 'Morgenbild', 'Schickt morgens ein Bild von eurem Start in den Tag und einen Satz, der Nähe schafft.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000261', 'de', 'Fünf-Minuten-Nähe', 'Nehmt euch fünf Minuten Videozeit und sagt nur, was euch heute am anderen fehlt oder freut.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000262', 'de', 'Unser Soundtrack', 'Wählt ein Lied, das zu einer gemeinsamen Erinnerung passt, und hört es bewusst zusammen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000263', 'de', 'Mutiger Moment', 'Erzählt euch von einem Moment, in dem ihr in der Beziehung mutig oder ehrlich wart.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000264', 'de', 'Handgeschriebene Zeile', 'Schreibt dem anderen eine kurze Zeile auf Papier oder als Nachricht, die ehrlich und warm ist.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000265', 'de', 'Blickkontakt-Pause', 'Schaut euch eine Minute bewusst an und sagt danach je einen liebevollen Gedanken.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000266', 'de', 'Wochenplan als Team', 'Plant eine kleine Sache für diese Woche so, dass sie für euch beide leichter wird.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000267', 'de', 'Stärken-Tausch', 'Nennt je eine Stärke des anderen und wo sie eure Beziehung gerade trägt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000268', 'de', 'Wärme-Check', 'Fragt einander: Was brauchst du heute, um dich gesehen und gehalten zu fühlen?');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000269', 'de', 'Heute entlasten', 'Wählt eine kleine Belastung des anderen und macht einen konkreten Entlastungsschritt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000270', 'de', 'Unsere Mini-Geschichte', 'Schreibt zusammen fünf Sätze über euch als Paar, liebevoll, albern oder poetisch.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000271', 'de', 'Traumwohnung skizzieren', 'Beschreibt oder zeichnet eine Ecke eines Zuhauses, das sich nach euch beiden anfühlt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000272', 'de', 'Küchen-Duo', 'Bereitet zusammen etwas Kleines vor und gebt euch dabei bewusst gute Rollen statt Stress.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000273', 'de', 'Gemütlich in 20 Minuten', 'Macht einen Raum in 20 Minuten gemütlicher und sagt, was euch daran verbindet.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000274', 'de', 'Sonnenuntergangsfrage', 'Geht kurz raus und beantwortet eine Frage, die euch als Paar ruhiger oder näher macht.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000275', 'de', 'Neue Straße', 'Nehmt bewusst einen Weg, den ihr selten geht, und teilt dabei einen neuen Gedanken über euch.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000276', 'de', 'Synchroner Tee', 'Macht euch zur gleichen Zeit ein Getränk und führt zehn Minuten ein kleines Distanz-Date.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000277', 'de', 'Emoji-Tagesbericht', 'Erzählt euren Tag nur mit fünf Emojis und erklärt danach die wichtigsten zwei.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000278', 'de', 'Versteckte Nachricht', 'Versteckt oder schickt eine kleine liebevolle Nachricht, die der andere unerwartet findet.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000279', 'de', 'Lieblingsding vorbereiten', 'Bereitet eine kleine Lieblingssache des anderen vor, ohne vorher groß darüber zu sprechen.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000280', 'de', 'Frühstücks-Date', 'Macht aus dem nächsten Frühstück ein bewusstes Mini-Date mit einer liebevollen Frage.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000281', 'de', 'Drei Wendepunkte', 'Nennt drei Momente, die eure Beziehung in eine gute Richtung bewegt haben.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000282', 'de', 'Warum du', 'Sagt dem anderen drei Gründe, warum ihr euch heute wieder für ihn entscheiden würdet.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000283', 'de', 'Konflikt fair üben', 'Wählt ein harmloses Thema und übt, erst zu verstehen und dann zu antworten.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000284', 'de', 'Schlaf-gut-Ritual', 'Entwickelt ein kleines Abendritual, das dem anderen Ruhe, Wärme oder Sicherheit gibt.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000285', 'de', 'Zukunftspostkarte', 'Schreibt eine kurze Postkarte aus einer schönen gemeinsamen Zukunft an euch beide.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000232', 'en', 'Favorite Place Date', 'Go to a place that feels especially good for one of you and explain why.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000233', 'en', '20 Minutes Just Us', 'Set a timer and give each other 20 minutes without phones, chores, or planning.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000234', 'en', 'Laugh Archive', 'Collect three moments you still laugh about today and give them funny titles.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000235', 'en', 'Bad Flirting Contest', 'Give each other intentionally over-the-top bad pickup lines and choose the most loving one.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000236', 'en', 'Same Sky', 'Look out the window or at the sky at the same time and describe what you see.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000237', 'en', 'Good-Night Voice Message', 'Send each other a short message with one thought that creates closeness.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000238', 'en', 'Our Small Milestone', 'Tell each other about a moment when you realized: we are a good team.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000239', 'en', 'Then and Now', 'Choose an old memory and say what has developed beautifully between you since then.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000240', 'en', 'A Sentence That Stays', 'Each write one sentence the other may reread on a hard day.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000241', 'en', 'Small Declaration of Love', 'Tell each other three things: what you love, what you admire, and what you wish for.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000242', 'en', 'Team Check-In', 'Each name one thing that would feel easier if you carried it together.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000243', 'en', 'Task Swap', 'Consciously take over one small task today that noticeably helps the other person.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000244', 'en', 'Gentle Evening', 'Ask each other: what would feel good for you today? Then fulfill one small thing.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000245', 'en', 'Recharge Check', 'Each name one thing that costs energy and one thing that would bring relief today.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000246', 'en', 'Our Fantasy Date', 'Invent a date that exists only in your world and draw or describe it briefly.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000247', 'en', 'Couple Playlist Cover', 'Invent an album cover and title for your relationship right now.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000248', 'en', 'Chores with Heart', 'Do 15 minutes of chores together and name three things you like about everyday life together.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000249', 'en', 'Comfort Corner', 'Tidy or shape one small corner so it feels more like the two of you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000250', 'en', 'Hand-in-Hand Walk', 'Take a short walk and answer along the way: what connected us this week?');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000251', 'en', 'Found Thing for You', 'Find something small outside that reminds you of the other person and explain why.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000252', 'en', 'Digital Mini Date', 'Make a video or chat date with one fixed question and a nice closing ritual.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000253', 'en', 'Photo with Meaning', 'Send each other a photo from your day and tell the small story behind it.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000254', 'en', 'Small Joy', 'Plan a small surprise that shows: I was thinking of you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000255', 'en', 'Secret Wish List', 'Secretly write down three little things you would enjoy and exchange them.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000256', 'en', 'First-Date Feeling', 'Remember your first date or an early moment and repeat one small gesture from it.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000257', 'en', 'Favorite Questions Evening', 'Choose three questions you have not asked each other in a while and answer them calmly.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000258', 'en', 'Shared Comedy Minute', 'Show each other something short that makes you laugh and explain why it fits you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000259', 'en', 'Pet Name Lab', 'Invent three loving or silly pet names and decide which one may stay.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000260', 'en', 'Morning Picture', 'Send a morning picture of how your day starts and one sentence that creates closeness.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000261', 'en', 'Five Minutes of Closeness', 'Take five minutes on video and say only what you miss or appreciate about the other today.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000262', 'en', 'Our Soundtrack', 'Choose a song that fits a shared memory and listen to it together intentionally.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000263', 'en', 'Brave Moment', 'Tell each other about a moment when you were brave or honest in the relationship.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000264', 'en', 'Handwritten Line', 'Write the other person a short line on paper or as a message that is honest and warm.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000265', 'en', 'Eye Contact Pause', 'Look at each other consciously for one minute and then each share one loving thought.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000266', 'en', 'Weekly Plan as a Team', 'Plan one small thing for this week so it becomes easier for both of you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000267', 'en', 'Strength Swap', 'Each name one strength of the other and where it supports your relationship right now.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000268', 'en', 'Warmth Check', 'Ask each other: what do you need today to feel seen and held?');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000269', 'en', 'Relieve Today', 'Choose one small burden of the other person and take one concrete relief step.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000270', 'en', 'Our Mini Story', 'Write five sentences together about you as a couple, loving, silly, or poetic.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000271', 'en', 'Sketch a Dream Home', 'Describe or draw one corner of a home that would feel like both of you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000272', 'en', 'Kitchen Duo', 'Prepare something small together and consciously choose good roles instead of stress.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000273', 'en', 'Cozy in 20 Minutes', 'Make a room cozier in 20 minutes and say what connects you in it.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000274', 'en', 'Sunset Question', 'Step outside briefly and answer a question that makes you calmer or closer as a couple.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000275', 'en', 'New Street', 'Intentionally take a path you rarely walk and share one new thought about the two of you.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000276', 'en', 'Synchronized Tea', 'Make a drink at the same time and have a ten-minute little distance date.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000277', 'en', 'Emoji Day Report', 'Tell your day using only five emojis and then explain the two most important ones.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000278', 'en', 'Hidden Message', 'Hide or send a small loving message that the other person finds unexpectedly.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000279', 'en', 'Prepare a Favorite Thing', 'Prepare one small favorite thing for the other person without talking much about it first.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000280', 'en', 'Breakfast Date', 'Turn your next breakfast into an intentional mini date with one loving question.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000281', 'en', 'Three Turning Points', 'Name three moments that moved your relationship in a good direction.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000282', 'en', 'Why You', 'Tell the other person three reasons why you would choose them again today.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000283', 'en', 'Practice Fair Conflict', 'Choose a harmless topic and practice understanding first, then answering.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000284', 'en', 'Sleep-Well Ritual', 'Develop a small evening ritual that gives the other person calm, warmth, or safety.');
INSERT INTO public.quest_translations (quest_id, locale, title, description) VALUES ('00000000-0000-0000-0000-000000000285', 'en', 'Future Postcard', 'Write a short postcard from a beautiful shared future to both of you.');


--
-- Data for Name: relationship_modes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.relationship_modes (id, value, active, sort_order, created_at, updated_at) VALUES ('d1100bc3-4c81-4991-baf8-d0dd7af2345f', 'mixed', true, 10, '2026-06-18 04:26:14.831486+00', '2026-06-18 04:26:14.831486+00');
INSERT INTO public.relationship_modes (id, value, active, sort_order, created_at, updated_at) VALUES ('e09f48b6-1cf5-4542-9ff7-6e86f06188f5', 'local', true, 20, '2026-06-18 04:26:14.831486+00', '2026-06-18 04:26:14.831486+00');
INSERT INTO public.relationship_modes (id, value, active, sort_order, created_at, updated_at) VALUES ('2a58c0d2-bc1d-471c-80f7-9bc4b4240093', 'long_distance', true, 30, '2026-06-18 04:26:14.831486+00', '2026-06-18 04:26:14.831486+00');


--
-- Data for Name: relationship_mode_translations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.relationship_mode_translations (mode_id, locale, label) VALUES ('d1100bc3-4c81-4991-baf8-d0dd7af2345f', 'en', 'Mixed');
INSERT INTO public.relationship_mode_translations (mode_id, locale, label) VALUES ('d1100bc3-4c81-4991-baf8-d0dd7af2345f', 'de', 'Gemischt');
INSERT INTO public.relationship_mode_translations (mode_id, locale, label) VALUES ('e09f48b6-1cf5-4542-9ff7-6e86f06188f5', 'en', 'Together locally');
INSERT INTO public.relationship_mode_translations (mode_id, locale, label) VALUES ('e09f48b6-1cf5-4542-9ff7-6e86f06188f5', 'de', 'Zusammen vor Ort');
INSERT INTO public.relationship_mode_translations (mode_id, locale, label) VALUES ('2a58c0d2-bc1d-471c-80f7-9bc4b4240093', 'en', 'Long distance');
INSERT INTO public.relationship_mode_translations (mode_id, locale, label) VALUES ('2a58c0d2-bc1d-471c-80f7-9bc4b4240093', 'de', 'Fernbeziehung');


--
-- PostgreSQL database dump complete
--


