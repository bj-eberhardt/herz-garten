alter table notifications
  alter column couple_id drop not null;

alter table notifications
  drop constraint if exists notifications_couple_id_fkey,
  add constraint notifications_couple_id_fkey
    foreign key (couple_id) references couples(id) on delete set null;

alter table notifications
  drop constraint if exists notifications_type_check,
  add constraint notifications_type_check check (
    type in (
      'daily_answer_waiting',
      'daily_revealed',
      'quest_waiting_confirmation',
      'quest_completed',
      'love_jar_note',
      'memory_created',
      'know_me_question',
      'know_me_answered',
      'couple_disconnected'
    )
  );
