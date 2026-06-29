CREATE INDEX IF NOT EXISTS couple_quests_couple_status_idx ON public.couple_quests USING btree (couple_id, status);
CREATE INDEX IF NOT EXISTS know_me_questions_couple_status_idx ON public.know_me_questions USING btree (couple_id, status);
