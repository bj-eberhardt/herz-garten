alter table public.garden_assets
  drop constraint if exists garden_assets_object_type_check;

alter table public.garden_assets
  drop column if exists object_type;
