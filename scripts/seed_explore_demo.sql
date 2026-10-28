-- Sample posts for Khám phá (plan 14, phase 7) so the viewer is not empty while testing. Dev data only; delete them in the back office.
INSERT INTO explore_posts (kind, title, body, status, pinned, published_at) VALUES
('article', '5 phút đọc sách cùng con mỗi tối', 'Chỉ cần 5 phút mỗi tối, bé sẽ quen dần với sách. Hãy để bé chọn cuốn sách, bạn đọc to và dừng lại hỏi: "Theo con, chuyện gì sẽ xảy ra tiếp?". Quan trọng là bé thấy vui, không phải đọc cho hết.', 'published', 1, NOW()),
('article', 'Khen quá trình, đừng chỉ khen kết quả', 'Thay vì "Con giỏi quá, được điểm 10", hãy thử "Mẹ thấy con đã cố gắng ôn bài mỗi ngày". Bé sẽ tự tin thử thách mới thay vì sợ sai.', 'published', 0, NOW()),
('article', 'Giờ chơi ngoài trời giúp bé học tốt hơn', 'Vận động giúp bé tập trung lâu hơn khi ngồi học. Dành 30 đến 60 phút chơi ngoài trời mỗi ngày, trước giờ học bài là lý tưởng.', 'published', 0, NOW()),
('video', 'Mẹo giúp bé tập trung khi học bài (clip mẫu)', 'Clip thử nghiệm, thay bằng clip thật trong trang admin Khám phá.', 'draft', 0, NULL);
UPDATE explore_posts SET kind = 'article' WHERE kind = 'video' AND media_url IS NULL;
