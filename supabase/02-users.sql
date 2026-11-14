-- QUẢN LÝ USER: chạy file này SAU schema.sql (có thể chạy lại nhiều lần)

-- Danh sách user (ADMIN), tìm theo username / email / họ tên
create or replace function public.app_list_users(p_token text, p_search text default null)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  perform public._require_admin(p_token);
  return coalesce((
    select json_agg(t order by t.created_at) from (
      select u.id, u.username, u.email, u.full_name, u.role, u.is_active, u.created_at
      from public.users u
      where v_search is null
         or u.username ilike '%' || v_search || '%'
         or u.email    ilike '%' || v_search || '%'
         or coalesce(u.full_name, '') ilike '%' || v_search || '%') t
  ), '[]'::json);
end $$;

-- Đổi role (ADMIN). Không cho tự đổi role của chính mình.
create or replace function public.app_set_user_role(p_token text, p_user_id uuid, p_role text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_admin public.users;
begin
  v_admin := public._require_admin(p_token);
  if p_role not in ('ADMIN', 'USER') then
    raise exception 'Role không hợp lệ';
  end if;
  if p_user_id = v_admin.id then
    raise exception 'Không thể tự đổi role của chính mình';
  end if;
  update public.users set role = p_role where id = p_user_id;
  if not found then raise exception 'Không tìm thấy user'; end if;
  return json_build_object('id', p_user_id, 'role', p_role);
end $$;

-- 10 tài khoản mẫu user1..user10 (mật khẩu 123456); bỏ qua nếu đã tồn tại
insert into public.users(username, email, password_hash, full_name, role)
select 'user' || n, 'user' || n || '@gmail.com',
       extensions.crypt('123456', extensions.gen_salt('bf')), 'Người dùng ' || n, 'USER'
from generate_series(1, 10) n
on conflict do nothing;
