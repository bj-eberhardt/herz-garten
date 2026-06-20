-- Translation-only taxonomy labels.
-- Move German labels into translation tables before removing duplicated
-- labels from taxonomy entity tables.

create index if not exists idx_relationship_mode_translations_mode_locale
  on public.relationship_mode_translations(mode_id, locale);

create index if not exists idx_content_style_translations_style_locale
  on public.content_style_translations(style_id, locale);

create index if not exists idx_content_category_translations_category_locale
  on public.content_category_translations(category_id, locale);

insert into public.relationship_mode_translations (mode_id, locale, label)
select id, 'de', label from public.relationship_modes
on conflict (mode_id, locale) do nothing;

insert into public.content_style_translations (style_id, locale, label)
select id, 'de', label from public.content_styles
on conflict (style_id, locale) do nothing;

insert into public.content_category_translations (category_id, locale, label)
select id, 'de', label from public.content_categories
on conflict (category_id, locale) do nothing;

drop index if exists public.content_categories_type_active_sort_idx;

alter table public.relationship_modes drop column if exists label;
alter table public.content_styles drop column if exists label;
alter table public.content_categories drop column if exists label;

create index if not exists content_categories_type_active_sort_idx
  on public.content_categories(content_type, active, sort_order);

alter table public.relationship_mode_translations alter column label set not null;
alter table public.content_style_translations alter column label set not null;
alter table public.content_category_translations alter column label set not null;
