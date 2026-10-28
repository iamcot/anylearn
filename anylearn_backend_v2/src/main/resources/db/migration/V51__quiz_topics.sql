-- Vui học (plan 14): quiz topics are edited in the back office instead of living in code.
CREATE TABLE quiz_topics (
    topic_key  VARCHAR(30)  NOT NULL PRIMARY KEY,
    label      VARCHAR(60)  NOT NULL,
    hint       VARCHAR(400) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    active     TINYINT      NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO quiz_topics (topic_key, label, hint, sort_order) VALUES
 ('parenting', 'Nuôi dạy con', 'nuôi dạy con: dinh dưỡng, giấc ngủ, phát triển theo độ tuổi, kỹ năng sống, giao tiếp với con, an toàn', 1),
 ('english', 'Tiếng Anh', 'tiếng Anh cho trẻ và phụ huynh: từ vựng, ngữ pháp cơ bản, phát âm, thành ngữ, văn hóa các nước nói tiếng Anh', 2),
 ('music', 'Âm nhạc', 'âm nhạc: nốt nhạc, nhạc cụ, nhà soạn nhạc nổi tiếng, thể loại, nhịp điệu', 3),
 ('art', 'Mỹ thuật', 'mỹ thuật: màu sắc, họa sĩ nổi tiếng, kỹ thuật vẽ, chất liệu, các trường phái', 4),
 ('science', 'Khoa học', 'khoa học: vũ trụ, cơ thể người, động thực vật, vật lý và hóa học đời thường, môi trường', 5),
 ('history', 'Lịch sử', 'lịch sử Việt Nam và thế giới: nhân vật, sự kiện, triều đại, mốc thời gian quen thuộc', 6),
 ('geography', 'Địa lý', 'địa lý: các tỉnh thành, sông núi, quốc gia, thủ đô, khí hậu, bản đồ', 7),
 ('society', 'Xã hội & đời sống', 'xã hội và đời sống: phong tục, lễ hội, nghề nghiệp, luật giao thông, văn hóa ứng xử, kiến thức đời thường', 8);
