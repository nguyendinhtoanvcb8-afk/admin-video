-- Kiểm tra nhanh sau khi chạy schema.sql
-- Đăng nhập thử (phải trả về token + user)
select public.app_login('admin1', '123456');

-- Lấy token vừa nhận, thay vào <TOKEN>
select public.app_dashboard_stats('<TOKEN>');
select public.app_top_videos('<TOKEN>', 10);
select public.app_views_by_period('<TOKEN>', 'month');

-- user1 gọi hàm admin phải báo FORBIDDEN
select public.app_delete_video((public.app_login('user1','123456')->>'token'), 1);
