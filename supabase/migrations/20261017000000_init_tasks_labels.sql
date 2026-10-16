-- Công Việc Của Tôi v2: bảng nhãn và công việc, mỗi người chỉ thấy dữ liệu của mình (RLS).

-- ───────────── Bảng ─────────────
create table public.labels (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  color text not null check (color in ('slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink')),
  created_at timestamptz not null default now()
);

-- Tên nhãn không trùng (không phân biệt hoa thường) trong phạm vi một người.
create unique index labels_user_name_key on public.labels (user_id, lower(name));

create table public.tasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  status text not null check (status in ('todo', 'in_progress', 'done', 'on_hold')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  label_ids text[] not null default '{}',
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_user_status_idx on public.tasks (user_id, status);

-- ───────────── Quyền truy cập ─────────────
alter table public.labels enable row level security;
alter table public.tasks enable row level security;

revoke all on table public.labels, public.tasks from anon, public;
grant select, insert, update, delete on table public.labels, public.tasks to authenticated;
grant select, insert, update, delete on table public.labels, public.tasks to service_role;

create policy "labels: xem của mình" on public.labels for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "labels: thêm của mình" on public.labels for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "labels: sửa của mình" on public.labels for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "labels: xoá của mình" on public.labels for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "tasks: xem của mình" on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "tasks: thêm của mình" on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "tasks: sửa của mình" on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks: xoá của mình" on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ───────────── Hàm (chạy với quyền người gọi, RLS vẫn áp dụng) ─────────────

-- Gỡ nhãn khỏi mọi việc rồi xoá nhãn, trong một giao dịch.
create function public.remove_label(p_label_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.tasks
     set label_ids = array_remove(label_ids, p_label_id::text),
         updated_at = now()
   where p_label_id::text = any (label_ids);

  delete from public.labels where id = p_label_id;
  if not found then
    raise exception 'label % not found', p_label_id using errcode = 'P0002';
  end if;
end;
$$;

-- Ghi đè / thêm nhiều việc (hàng đầy đủ, khoá snake_case) trong một giao dịch.
create function public.upsert_tasks(p_tasks jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.tasks (
    id, user_id, title, description, status, priority, due_at,
    label_ids, position, created_at, updated_at, completed_at
  )
  select r.id, (select auth.uid()), r.title, r.description, r.status, r.priority, r.due_at,
         r.label_ids, r.position, r.created_at, r.updated_at, r.completed_at
    from jsonb_populate_recordset(null::public.tasks, p_tasks) as r
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    priority = excluded.priority,
    due_at = excluded.due_at,
    label_ids = excluded.label_ids,
    position = excluded.position,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    completed_at = excluded.completed_at;
end;
$$;

-- Nhập dữ liệu (sao lưu hoặc dữ liệu cũ trên máy): nhãn trước, việc sau, cùng một giao dịch.
-- Việc gộp nhãn trùng tên đã được làm phía client trước khi gọi.
create function public.import_data(p_tasks jsonb, p_labels jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.labels (id, user_id, name, color)
  select r.id, (select auth.uid()), r.name, r.color
    from jsonb_populate_recordset(null::public.labels, p_labels) as r
  on conflict (id) do update set
    name = excluded.name,
    color = excluded.color;

  perform public.upsert_tasks(p_tasks);
end;
$$;

revoke execute on function public.remove_label(uuid), public.upsert_tasks(jsonb), public.import_data(jsonb, jsonb)
  from public, anon;
grant execute on function public.remove_label(uuid), public.upsert_tasks(jsonb), public.import_data(jsonb, jsonb)
  to authenticated, service_role;
