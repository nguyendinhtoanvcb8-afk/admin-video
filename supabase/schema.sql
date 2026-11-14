-- VIDEO ADMIN: chạy toàn bộ file này trong Supabase -> SQL Editor (một lần)

create extension if not exists pgcrypto with schema extensions;

-- USERS
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  email         text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  password_hash text not null,
  full_name     text,
  avatar_url    text,
  role          text not null default 'USER' check (role in ('ADMIN','USER')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- SESSIONS
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_user on public.sessions(user_id);

-- PASSWORD RESETS
create table if not exists public.password_resets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

-- VIDEO CATEGORIES
create table if not exists public.video_categories (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- VIDEOS
create table if not exists public.videos (
  id             bigint generated always as identity primary key,
  title          text not null check (length(trim(title)) between 1 and 200),
  description    text,
  category_id    bigint references public.video_categories(id) on delete set null,
  video_path     text,
  video_url      text,
  thumbnail_path text,
  thumbnail_url  text,
  file_size      bigint not null default 0 check (file_size >= 0),
  thumbnail_size bigint not null default 0 check (thumbnail_size >= 0),
  duration       int    not null default 0 check (duration >= 0),
  views          bigint not null default 0 check (views >= 0),
  status         text   not null default 'PUBLISHED' check (status in ('PUBLISHED','DRAFT','HIDDEN')),
  created_by     uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_videos_views    on public.videos(views desc);
create index if not exists idx_videos_category on public.videos(category_id);

-- VIDEO VIEWS DAILY
create table if not exists public.video_views_daily (
  video_id  bigint not null references public.videos(id) on delete cascade,
  view_date date   not null,
  views     int    not null default 0 check (views >= 0),
  primary key (video_id, view_date)
);
create index if not exists idx_vvd_date on public.video_views_daily(view_date);

-- COMMENTS
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  video_id   bigint not null references public.videos(id) on delete cascade,
  user_id    uuid   not null references public.users(id) on delete cascade,
  content    text   not null check (length(trim(content)) between 1 and 1000),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_video on public.comments(video_id);

-- Tự cập nhật updated_at
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_users_updated on public.users;
create trigger trg_users_updated before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_videos_updated on public.videos;
create trigger trg_videos_updated before update on public.videos
for each row execute function public.set_updated_at();
alter table public.users             enable row level security;
alter table public.sessions          enable row level security;
alter table public.password_resets   enable row level security;
alter table public.video_categories  enable row level security;
alter table public.videos            enable row level security;
alter table public.video_views_daily enable row level security;
alter table public.comments          enable row level security;
-- Không tạo policy => anon/authenticated không đọc/ghi trực tiếp được.
-- Mọi truy cập đi qua hàm RPC SECURITY DEFINER bên dưới.
create or replace function public._require_user(p_token text)
returns public.users
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users;
begin
  select u.* into v_user
  from public.sessions s
  join public.users u on u.id = s.user_id
  where s.token = p_token and s.expires_at > now() and u.is_active
  limit 1;

  if v_user.id is null then
    raise exception 'UNAUTHORIZED: Phiên đăng nhập không hợp lệ hoặc đã hết hạn';
  end if;
  return v_user;
end $$;

create or replace function public._require_admin(p_token text)
returns public.users
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users;
begin
  v_user := public._require_user(p_token);
  if v_user.role <> 'ADMIN' then
    raise exception 'FORBIDDEN: Bạn không có quyền thực hiện thao tác này';
  end if;
  return v_user;
end $$;

create or replace function public._user_json(u public.users)
returns json language sql immutable as $$
  select json_build_object(
    'id', u.id, 'username', u.username, 'email', u.email,
    'full_name', u.full_name, 'avatar_url', u.avatar_url, 'role', u.role);
$$;

-- Không cho frontend gọi trực tiếp hàm nội bộ
revoke execute on function public._require_user(text)  from public, anon, authenticated;
revoke execute on function public._require_admin(text) from public, anon, authenticated;
revoke execute on function public._user_json(public.users) from public, anon, authenticated;
-- ĐĂNG NHẬP: bằng username hoặc email
create or replace function public.app_login(p_login text, p_password text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users; v_token text;
begin
  select * into v_user from public.users
  where lower(email) = lower(trim(p_login)) or lower(username) = lower(trim(p_login))
  limit 1;

  if v_user.id is null or v_user.password_hash <> crypt(p_password, v_user.password_hash) then
    raise exception 'Sai tên đăng nhập/email hoặc mật khẩu';
  end if;
  if not v_user.is_active then
    raise exception 'Tài khoản đã bị khóa';
  end if;

  delete from public.sessions where user_id = v_user.id and expires_at < now();

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.sessions(user_id, token, expires_at)
  values (v_user.id, v_token, now() + interval '7 days');

  return json_build_object('token', v_token, 'user', public._user_json(v_user));
end $$;

-- ĐĂNG KÝ: luôn tạo role USER, đăng ký xong tự đăng nhập
create or replace function public.app_register(
  p_username text, p_email text, p_password text, p_full_name text default null)
returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_username !~ '^[A-Za-z0-9_]{3,30}$' then
    raise exception 'Username 3–30 ký tự, chỉ gồm chữ, số, dấu gạch dưới';
  end if;
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email không hợp lệ';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Mật khẩu tối thiểu 6 ký tự';
  end if;
  if exists (select 1 from public.users where lower(username) = lower(p_username)) then
    raise exception 'Username đã tồn tại';
  end if;
  if exists (select 1 from public.users where lower(email) = lower(p_email)) then
    raise exception 'Email đã được sử dụng';
  end if;

  insert into public.users(username, email, password_hash, full_name, role)
  values (p_username, lower(trim(p_email)), crypt(p_password, gen_salt('bf')),
          nullif(trim(p_full_name), ''), 'USER');

  return public.app_login(p_username, p_password);
end $$;

-- ĐĂNG XUẤT
create or replace function public.app_logout(p_token text)
returns void
language sql security definer set search_path = public as $$
  delete from public.sessions where token = p_token;
$$;

-- LẤY USER HIỆN TẠI (dùng để kiểm tra phiên khi vào mỗi trang)
create or replace function public.app_get_current_user(p_token text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  return public._user_json(public._require_user(p_token));
end $$;

-- QUÊN MẬT KHẨU – BƯỚC 1: tạo mã 6 số, hiệu lực 15 phút
-- ⚠️ CHẾ ĐỘ HỌC TẬP: hàm trả mã về để hiển thị trên màn hình (vì không có server gửi email).
-- Khi làm thật: KHÔNG trả demo_code, mà gửi mã qua email bằng Supabase Edge Function.
create or replace function public.app_request_password_reset(p_email text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users; v_code text;
begin
  select * into v_user from public.users
  where lower(email) = lower(trim(p_email)) and is_active limit 1;

  if v_user.id is null then
    -- Không tiết lộ email có tồn tại hay không
    return json_build_object('message', 'Nếu email tồn tại, mã khôi phục đã được tạo.', 'demo_code', null);
  end if;

  update public.password_resets set used_at = now()
  where user_id = v_user.id and used_at is null;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  insert into public.password_resets(user_id, token, expires_at)
  values (v_user.id, v_code, now() + interval '15 minutes');

  return json_build_object('message', 'Nếu email tồn tại, mã khôi phục đã được tạo.', 'demo_code', v_code);
end $$;

-- QUÊN MẬT KHẨU – BƯỚC 2: nhập email + mã + mật khẩu mới
create or replace function public.app_reset_password(p_email text, p_code text, p_new_password text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_reset public.password_resets;
begin
  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'Mật khẩu tối thiểu 6 ký tự';
  end if;

  select r.* into v_reset
  from public.password_resets r
  join public.users u on u.id = r.user_id
  where lower(u.email) = lower(trim(p_email))
    and r.token = trim(p_code) and r.used_at is null and r.expires_at > now()
  order by r.created_at desc limit 1;

  if v_reset.id is null then
    raise exception 'Mã khôi phục không đúng hoặc đã hết hạn';
  end if;

  update public.users set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = v_reset.user_id;
  update public.password_resets set used_at = now() where id = v_reset.id;
  delete from public.sessions where user_id = v_reset.user_id; -- đăng xuất mọi thiết bị

  return json_build_object('message', 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
end $$;
-- 3 thẻ số liệu
create or replace function public.app_dashboard_stats(p_token text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_user(p_token);
  return (
    select json_build_object(
      'total_videos',        count(*),
      'total_views',         coalesce(sum(views), 0),
      'total_storage_bytes', coalesce(sum(file_size + thumbnail_size), 0))
    from public.videos);
end $$;

-- Top N video nhiều lượt xem nhất (mặc định 10)
create or replace function public.app_top_videos(p_token text, p_limit int default 10)
returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_user(p_token);
  return coalesce((
    select json_agg(t) from (
      select id, title, thumbnail_url, views
      from public.videos
      order by views desc, id
      limit greatest(1, least(coalesce(p_limit, 10), 50))
    ) t), '[]'::json);
end $$;

-- Lượt xem theo ngày hoặc tháng (có đủ cả ngày/tháng = 0)
-- p_group: 'day' | 'month'
create or replace function public.app_views_by_period(
  p_token text, p_group text default 'day',
  p_from date default null, p_to date default null)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_unit text := case when p_group = 'month' then 'month' else 'day' end;
  v_fmt  text := case when p_group = 'month' then 'YYYY-MM' else 'YYYY-MM-DD' end;
  v_to   date := coalesce(p_to, current_date);
  v_from date := coalesce(p_from,
                  case when p_group = 'month'
                       then (date_trunc('month', current_date) - interval '11 months')::date
                       else current_date - 29 end);
begin
  perform public._require_user(p_token);
  return coalesce((
    select json_agg(json_build_object('period', to_char(g.d, v_fmt), 'views', coalesce(s.views, 0)) order by g.d)
    from generate_series(date_trunc(v_unit, v_from::timestamp),
                         date_trunc(v_unit, v_to::timestamp),
                         ('1 ' || v_unit)::interval) as g(d)
    left join (
      select date_trunc(v_unit, view_date::timestamp) as d, sum(views)::bigint as views
      from public.video_views_daily
      where view_date between v_from and v_to
      group by 1
    ) s on s.d = g.d
  ), '[]'::json);
end $$;
-- DANH SÁCH VIDEO (tìm kiếm, lọc, sắp xếp, phân trang)
-- p_sort: 'newest' | 'views'
create or replace function public.app_list_videos(
  p_token text, p_search text default null, p_category_id bigint default null,
  p_page int default 1, p_page_size int default 10, p_sort text default 'newest')
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_size   int := greatest(1, least(coalesce(p_page_size, 10), 100));
  v_page   int := greatest(coalesce(p_page, 1), 1);
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_total  bigint;
  v_items  json;
begin
  perform public._require_user(p_token);

  select count(*) into v_total from public.videos v
  where (v_search is null or v.title ilike '%' || v_search || '%')
    and (p_category_id is null or v.category_id = p_category_id);

  select coalesce(json_agg(t), '[]'::json) into v_items from (
    select v.id, v.title, v.thumbnail_url, v.views, v.status, v.file_size,
           v.duration, v.created_at, v.category_id, c.name as category_name
    from public.videos v
    left join public.video_categories c on c.id = v.category_id
    where (v_search is null or v.title ilike '%' || v_search || '%')
      and (p_category_id is null or v.category_id = p_category_id)
    order by case when p_sort = 'views' then v.views end desc nulls last,
             v.created_at desc, v.id desc
    limit v_size offset (v_page - 1) * v_size
  ) t;

  return json_build_object('items', v_items, 'total', v_total, 'page', v_page, 'page_size', v_size);
end $$;

-- CHI TIẾT 1 VIDEO
create or replace function public.app_get_video(p_token text, p_id bigint)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v json;
begin
  perform public._require_user(p_token);
  select row_to_json(t) into v from (
    select v.*, c.name as category_name, u.username as created_by_username
    from public.videos v
    left join public.video_categories c on c.id = v.category_id
    left join public.users u on u.id = v.created_by
    where v.id = p_id) t;
  if v is null then raise exception 'Không tìm thấy video'; end if;
  return v;
end $$;

-- THÊM VIDEO (ADMIN)
create or replace function public.app_create_video(p_token text, p_data jsonb)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users; v_id bigint;
begin
  v_user := public._require_admin(p_token);
  if coalesce(trim(p_data->>'title'), '') = '' then
    raise exception 'Tiêu đề không được để trống';
  end if;

  insert into public.videos(title, description, category_id, video_path, video_url,
                            thumbnail_path, thumbnail_url, file_size, thumbnail_size,
                            duration, status, created_by)
  values (trim(p_data->>'title'),
          p_data->>'description',
          nullif(p_data->>'category_id', '')::bigint,
          p_data->>'video_path', p_data->>'video_url',
          p_data->>'thumbnail_path', p_data->>'thumbnail_url',
          coalesce(nullif(p_data->>'file_size', '')::bigint, 0),
          coalesce(nullif(p_data->>'thumbnail_size', '')::bigint, 0),
          coalesce(nullif(p_data->>'duration', '')::int, 0),
          coalesce(nullif(p_data->>'status', ''), 'PUBLISHED'),
          v_user.id)
  returning id into v_id;

  return json_build_object('id', v_id);
end $$;

-- SỬA VIDEO (ADMIN) – chỉ cập nhật các key có trong p_data
create or replace function public.app_update_video(p_token text, p_id bigint, p_data jsonb)
returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  if p_data ? 'title' and coalesce(trim(p_data->>'title'), '') = '' then
    raise exception 'Tiêu đề không được để trống';
  end if;

  update public.videos set
    title          = case when p_data ? 'title'          then trim(p_data->>'title')                         else title end,
    description    = case when p_data ? 'description'    then p_data->>'description'                         else description end,
    category_id    = case when p_data ? 'category_id'    then nullif(p_data->>'category_id', '')::bigint     else category_id end,
    status         = case when p_data ? 'status'         then p_data->>'status'                              else status end,
    video_path     = case when p_data ? 'video_path'     then p_data->>'video_path'                          else video_path end,
    video_url      = case when p_data ? 'video_url'      then p_data->>'video_url'                           else video_url end,
    thumbnail_path = case when p_data ? 'thumbnail_path' then p_data->>'thumbnail_path'                      else thumbnail_path end,
    thumbnail_url  = case when p_data ? 'thumbnail_url'  then p_data->>'thumbnail_url'                       else thumbnail_url end,
    file_size      = case when p_data ? 'file_size'      then coalesce(nullif(p_data->>'file_size','')::bigint, 0)      else file_size end,
    thumbnail_size = case when p_data ? 'thumbnail_size' then coalesce(nullif(p_data->>'thumbnail_size','')::bigint, 0) else thumbnail_size end,
    duration       = case when p_data ? 'duration'       then coalesce(nullif(p_data->>'duration','')::int, 0)          else duration end
  where id = p_id;

  if not found then raise exception 'Không tìm thấy video'; end if;
  return json_build_object('id', p_id);
end $$;

-- XÓA VIDEO (ADMIN) – trả về đường dẫn file để frontend xóa khỏi Storage
create or replace function public.app_delete_video(p_token text, p_id bigint)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_video_path text; v_thumb_path text;
begin
  perform public._require_admin(p_token);
  delete from public.videos where id = p_id
  returning video_path, thumbnail_path into v_video_path, v_thumb_path;
  if not found then raise exception 'Không tìm thấy video'; end if;
  return json_build_object('video_path', v_video_path, 'thumbnail_path', v_thumb_path);
end $$;

-- DANH MỤC: danh sách (mọi user đã đăng nhập)
create or replace function public.app_list_categories(p_token text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_user(p_token);
  return coalesce((
    select json_agg(t order by t.name) from (
      select c.id, c.name, c.slug, c.description,
             (select count(*) from public.videos v where v.category_id = c.id) as video_count
      from public.video_categories c) t), '[]'::json);
end $$;

-- DANH MỤC: thêm (p_id null) hoặc sửa (ADMIN)
create or replace function public.app_save_category(
  p_token text, p_id bigint, p_name text, p_slug text, p_description text default null)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_id bigint;
begin
  perform public._require_admin(p_token);
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_slug), '') = '' then
    raise exception 'Tên và slug không được để trống';
  end if;
  if p_id is null then
    insert into public.video_categories(name, slug, description)
    values (trim(p_name), lower(trim(p_slug)), p_description) returning id into v_id;
  else
    update public.video_categories
    set name = trim(p_name), slug = lower(trim(p_slug)), description = p_description
    where id = p_id returning id into v_id;
    if v_id is null then raise exception 'Không tìm thấy danh mục'; end if;
  end if;
  return json_build_object('id', v_id);
exception when unique_violation then
  raise exception 'Tên hoặc slug danh mục đã tồn tại';
end $$;

-- DANH MỤC: xóa (ADMIN) – video thuộc danh mục sẽ có category_id = null
create or replace function public.app_delete_category(p_token text, p_id bigint)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  delete from public.video_categories where id = p_id;
end $$;

-- BÌNH LUẬN: danh sách theo video (ADMIN thấy cả bình luận ẩn)
create or replace function public.app_list_comments(p_token text, p_video_id bigint)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users;
begin
  v_user := public._require_user(p_token);
  return coalesce((
    select json_agg(t order by t.created_at desc) from (
      select cm.id, cm.content, cm.is_hidden, cm.created_at, cm.user_id,
             u.username, u.avatar_url
      from public.comments cm join public.users u on u.id = cm.user_id
      where cm.video_id = p_video_id and (not cm.is_hidden or v_user.role = 'ADMIN')) t
  ), '[]'::json);
end $$;

-- BÌNH LUẬN: thêm (mọi user đã đăng nhập)
create or replace function public.app_add_comment(p_token text, p_video_id bigint, p_content text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users; v_id bigint;
begin
  v_user := public._require_user(p_token);
  if length(trim(coalesce(p_content, ''))) not between 1 and 1000 then
    raise exception 'Nội dung bình luận 1–1000 ký tự';
  end if;
  insert into public.comments(video_id, user_id, content)
  values (p_video_id, v_user.id, trim(p_content)) returning id into v_id;
  return json_build_object('id', v_id);
end $$;

-- BÌNH LUẬN: xóa (ADMIN xóa mọi bình luận, USER chỉ xóa của mình)
create or replace function public.app_delete_comment(p_token text, p_comment_id bigint)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_user public.users;
begin
  v_user := public._require_user(p_token);
  delete from public.comments
  where id = p_comment_id and (v_user.role = 'ADMIN' or user_id = v_user.id);
  if not found then raise exception 'Không xóa được bình luận (không tồn tại hoặc không có quyền)'; end if;
end $$;

-- BÌNH LUẬN: ẩn / hiện (ADMIN)
create or replace function public.app_toggle_comment(p_token text, p_comment_id bigint, p_hidden boolean)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  update public.comments set is_hidden = p_hidden where id = p_comment_id;
end $$;
-- 2 bucket public. Giới hạn: video 50MB (giới hạn mặc định gói Free), ảnh 5MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos',     'videos',     true, 52428800, array['video/mp4','video/webm','video/quicktime']),
  ('thumbnails', 'thumbnails', true, 5242880,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Vì dùng đăng nhập tự làm (không có Supabase Auth), upload phải cho phép role anon.
-- ⚠️ Bất kỳ ai có anon key đều upload/xóa được file trong 2 bucket này. Chỉ phù hợp học tập.
drop policy if exists "va_public_read"  on storage.objects;
drop policy if exists "va_anon_upload"  on storage.objects;
drop policy if exists "va_anon_update"  on storage.objects;
drop policy if exists "va_anon_delete"  on storage.objects;

create policy "va_public_read" on storage.objects
  for select to anon using (bucket_id in ('videos','thumbnails'));
create policy "va_anon_upload" on storage.objects
  for insert to anon with check (bucket_id in ('videos','thumbnails'));
create policy "va_anon_update" on storage.objects
  for update to anon using (bucket_id in ('videos','thumbnails'));
create policy "va_anon_delete" on storage.objects
  for delete to anon using (bucket_id in ('videos','thumbnails'));
-- 2 tài khoản mẫu (mật khẩu 123456, băm bcrypt)
insert into public.users (username, email, password_hash, full_name, role) values
  ('admin1', 'admin1@gmail.com', extensions.crypt('123456', extensions.gen_salt('bf')), 'Quản trị viên', 'ADMIN'),
  ('user1',  'user1@gmail.com',  extensions.crypt('123456', extensions.gen_salt('bf')), 'Người dùng 1',  'USER')
on conflict (username) do nothing;

-- Danh mục
insert into public.video_categories (name, slug, description) values
  ('Giáo dục',  'giao-duc',  'Video bài giảng, hướng dẫn'),
  ('Giải trí',  'giai-tri',  'Video giải trí'),
  ('Công nghệ', 'cong-nghe', 'Review, lập trình, công nghệ'),
  ('Âm nhạc',   'am-nhac',   'MV, cover, nhạc cụ'),
  ('Du lịch',   'du-lich',   'Vlog, địa điểm')
on conflict (slug) do nothing;

-- 15 video mẫu (chưa có file thật, thumbnail dùng ảnh ngẫu nhiên)
insert into public.videos (title, description, category_id, thumbnail_url, file_size, duration, status, created_by)
select
  'Video mẫu số ' || i,
  'Mô tả cho video mẫu số ' || i,
  (select id from public.video_categories order by id offset (i % 5) limit 1),
  'https://picsum.photos/seed/video' || i || '/320/180',
  ((20 + random() * 30) * 1024 * 1024)::bigint,          -- 20–50 MB
  (60 + random() * 900)::int,                            -- 1–16 phút
  case when i % 7 = 0 then 'DRAFT' else 'PUBLISHED' end,
  (select id from public.users where username = 'admin1')
from generate_series(1, 15) as i
where not exists (select 1 from public.videos);

-- Lượt xem theo ngày trong 365 ngày gần nhất
insert into public.video_views_daily (video_id, view_date, views)
select v.id, d::date, (random() * (20 + v.id * 15))::int
from public.videos v
cross join generate_series(current_date - 364, current_date, interval '1 day') as d
on conflict do nothing;

-- Đồng bộ tổng views của từng video
update public.videos v
set views = coalesce((select sum(w.views) from public.video_views_daily w where w.video_id = v.id), 0);

-- Bình luận mẫu
insert into public.comments (video_id, user_id, content)
select v.id, u.id, 'Video hay quá! (' || u.username || ')'
from public.videos v cross join public.users u
where v.id <= 3
  and not exists (select 1 from public.comments);
