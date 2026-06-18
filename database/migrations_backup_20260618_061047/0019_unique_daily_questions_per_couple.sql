delete from daily_question_instances duplicate_instance
using (
  select
    id,
    row_number() over (
      partition by couple_id, question_id
      order by date asc, created_at asc, id asc
    ) as duplicate_rank
  from daily_question_instances
) ranked_instances
where duplicate_instance.id = ranked_instances.id
  and ranked_instances.duplicate_rank > 1;

create unique index if not exists one_daily_question_instance_per_couple
  on daily_question_instances (couple_id, question_id);
