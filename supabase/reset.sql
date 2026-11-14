-- CẢNH BÁO: xóa sạch dữ liệu để chạy lại schema.sql từ đầu
drop table if exists public.comments, public.video_views_daily, public.videos,
  public.video_categories, public.password_resets, public.sessions, public.users cascade;
