-- Thu hẹp quyền của vai trò authenticated chỉ còn 4 thao tác cần thiết (bỏ TRUNCATE / TRIGGER / REFERENCES
-- mà quyền mặc định của Supabase cấp sẵn), và giới hạn kích thước dữ liệu để chống lạm dụng.

revoke all on table public.labels, public.tasks from authenticated;
grant select, insert, update, delete on table public.labels, public.tasks to authenticated;

alter table public.tasks
  add constraint tasks_description_length check (char_length(description) <= 10000),
  add constraint tasks_label_ids_count check (cardinality(label_ids) <= 50);
