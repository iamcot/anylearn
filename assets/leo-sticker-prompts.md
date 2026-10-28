# Prompt tạo ảnh cho 12 sticker Leo

Cách dùng: với mỗi sticker, đính kèm ảnh tham chiếu `leo-3-views-sheet.png` (3 góc nhìn của Leo) rồi dán **Prompt gốc** + **Prompt riêng** của sticker đó. Prompt viết tiếng Anh vì các model ảnh hiểu tốt hơn, phần giải thích bằng tiếng Việt.

## Prompt gốc (dán trước mọi sticker)

```
Use the attached reference sheet as the exact character design of "Leo", the mascot. Keep his look identical in every image:
a chunky rounded-rectangle body like a soft pill or tube, flat bottom with one slightly squarer corner, smooth green gradient
(bright mint green at the top-left to deeper green at the bottom-right), two big white round eyes with dark green pupils and a
small white highlight, tiny pink-brown blush on both cheeks, a small friendly smile, a small blue open book emblem on his belly,
two short stubby arms and two round stubby feet, all with a dark green outline (#0b3d22), no nose, no hair, no clothes unless the scene asks for an accessory.
Style: flat vector cartoon, clean thick outline, soft gradient shading, cute and cheerful, kid-friendly.
Format: a die-cut sticker design, centered, with a thick white border (about 8 percent of the image width) around the whole
silhouette and a very subtle drop shadow, fully transparent background (PNG), square 1024x1024, no text unless stated, no watermark.
Leo is interacting with the object, the pose is expressive and playful. Keep the rest of the scene minimal: only the object and
at most 2 or 3 small decorative sparkles.
```

Mẹo: nếu model hay làm Leo "cao gầy" hoặc đổi màu, thêm câu `Do not change the proportions or the color of the character. Leo is a rounded tube shape, as wide as he is tall.` Nếu muốn Leo quay ngang, nói rõ `side view facing right` (dùng ảnh góc phải/trái trong bộ 3 góc).

## 12 prompt riêng

Mỗi dòng là phần "Prompt riêng" dán ngay sau Prompt gốc.

**1. Leo đọc sách (phổ thông)**
```
Leo sits cross-legged and holds a big open storybook with both hands, eyes looking down at the pages with a happy smile. Small stars float up from the book.
```

**2. Leo tập vẽ (phổ thông)**
```
Leo stands beside a small easel and holds a paintbrush in one hand, a color palette in the other. A colorful rainbow swirl is on the canvas, and a tiny dab of paint is on his cheek.
```

**3. Leo hát ca (phổ thông)**
```
Leo sings happily into a retro microphone with his mouth open in a round "o", eyes closed with joy. A few music notes float around him.
```

**4. Leo làm toán (phổ thông)**
```
Leo is moving the beads of a colorful abacus with one hand and gives a thumbs-up with the other. Small plus and equals signs float around him. No readable text.
```

**5. Leo thí nghiệm (phổ thông)**
```
Leo wears round safety goggles and carefully holds a bubbling test tube with a green liquid. Tiny bubbles pop up from it and one small sparkle flashes.
```

**6. Leo đá bóng (phổ thông)**
```
Leo is kicking a black and white soccer ball with one foot lifted, in a dynamic action pose with small motion lines behind the ball. A big excited grin.
```

**7. Leo học tiếng Anh (phổ thông)**
```
Leo waves hello with one hand, and holds a small alphabet flashcard showing a big letter "A" in the other. A speech bubble beside him reads "Hello!".
```
(Sticker này có chữ: chỉ chữ "A" và "Hello!". Nếu model viết sai chữ, bỏ chữ ra và chèn lại bằng công cụ chỉnh ảnh.)

**8. Leo ghi chép (phổ thông)**
```
Leo writes in a small notebook with a big yellow pencil, tongue slightly out in concentration. A tiny lightbulb glows above his head.
```

**9. Leo giành cúp (hiếm)**
```
Leo proudly lifts a shiny golden trophy above his head with both arms, a huge happy smile, confetti and sparkles bursting around him. A subtle golden glow behind the trophy.
```

**10. Leo tên lửa (hiếm)**
```
Leo rides a small red and white cartoon rocket, one arm raised and a big excited smile, flames and puffy smoke trailing below, a couple of small stars and a tiny moon in the sky. Add a soft blue glow around the whole sticker.
```

**11. Leo ngôi sao (hiếm)**
```
Leo stands on top of a large glowing yellow star and strikes a cheerful pose with both arms open, beaming with light rays and many small twinkling stars around him. Add a soft blue glow around the whole sticker.
```

**12. Leo vương miện (siêu hiếm)**
```
Leo wears a golden crown with small red and blue jewels, sits on a small royal cushion holding a golden scepter topped with a question mark, looking proud and wise. Sparkles all around, a rich gold and purple shimmer border inside the white edge so it feels special and legendary.
```

## Gợi ý để sticker hiếm nổi bật hơn

| Độ hiếm | Cách nhận ra ngay trong ảnh |
|---|---|
| Phổ thông (8 cái) | Nền sạch, viền trắng đơn giản, ít hiệu ứng. |
| Hiếm (3 cái) | Thêm vầng sáng xanh nhạt hoặc vàng nhạt quanh hình, nhiều tia sáng hơn, vật dụng lớn hơn. |
| Siêu hiếm (1 cái) | Viền ánh kim vàng nằm trong viền trắng, hiệu ứng lấp lánh, thêm phụ kiện sang trọng (vương miện). Có thể làm thêm một bản có hiệu ứng ánh kim óng ánh (holographic) để dùng khi album đủ bộ. |

App đã tự vẽ khung màu theo độ hiếm quanh mỗi sticker (`RARITY_STYLE`), nên ảnh không cần tự thêm khung màu, chỉ cần vầng sáng và hiệu ứng như trên.

## Kiểm tra trước khi upload (admin "Sticker" > mỗi sticker có ô tải ảnh)

- PNG nền trong suốt, vuông, tối thiểu 512x512 (nên 1024x1024); đưa lên nền xám để chắc viền trắng không bị lem.
- Leo đúng màu xanh lá, đúng quyển sách xanh dương ở bụng, đủ viền xanh đậm.
- Hiện ra rõ ở cỡ nhỏ (khoảng 72 px): nếu chi tiết quá nhiều thì bảo model đơn giản hóa.
- Giữ nhất quán giữa 12 ảnh: cùng độ dày viền, cùng kiểu đổ bóng. Nên sinh cả 12 trong cùng một phiên và cùng ảnh tham chiếu.


# Prompt tạo ảnh 3 icon Leo cho trang Vui học
Cách dùng: đính kèm ảnh tham chiếu leo-3-views-sheet.png, dán Prompt gốc icon rồi dán Prompt riêng của icon cần làm. Đây là icon nên khác bộ sticker ở chỗ: nhân vật to và rõ, ít chi tiết, đọc được ở cỡ 64 đến 128 px, nền trong suốt, không viền trắng dày.

## Prompt gốc icon (dán trước cả 3)
Use the attached reference sheet as the exact character design of "Leo", the mascot. Keep his look identical in every image:
a chunky rounded-rectangle body like a soft pill or tube, flat bottom with one slightly squarer corner, smooth green gradient
(bright mint green at the top-left to deeper green at the bottom-right), two big white round eyes with dark green pupils and a
small white highlight, tiny pink-brown blush on both cheeks, a small friendly smile, a small blue open book emblem on his belly,
two short stubby arms and two round stubby feet, all with a dark green outline (#0b3d22), no nose, no hair, no clothes unless the scene asks for an accessory.
Do not change the proportions or the color of the character. Leo is a rounded tube shape, as wide as he is tall.
Style: flat vector cartoon, clean thick outline, soft gradient shading, cute and cheerful, kid-friendly.
Format: an app icon illustration, Leo large and centered filling about 85 percent of the frame, simple bold shapes that stay readable
at 64 px, only one or two props, no scene background, fully transparent background (PNG), square 1024x1024, no text, no watermark,
no thick white sticker border, only a very subtle soft shadow under the feet.

## 3 prompt riêng
### 1. Leo leo rank (Quiz)

Leo is climbing up a short steep staircase of five steps that grow from bronze to silver to gold colors, one foot on a step and one arm reaching up toward a shiny gold star at the top. Leo looks up with a determined happy smile, a tiny sweat drop on his forehead. Two small sparkles near the star.

### 2. Leo thu thập sticker

Leo holds a small open sticker album in one arm like a book and peels a round star sticker off a sheet with the other hand, looking proud. Three colorful stickers (a star, a heart, a rainbow) float around him, a little tilted.

### 3. Leo khám phá

Leo wears a small explorer backpack and holds a big magnifying glass up to one eye, so one of his eyes looks large through the lens. He walks forward with one foot lifted, curious smile. One small compass or a question mark floats beside him.

Mẹo: muốn đủ cả ba nhìn cùng một bộ, tạo cùng một model và cùng một seed nếu có. Nếu viền chưa đủ rõ ở cỡ nhỏ, thêm thicker dark green outline. Nếu Leo bị biến dạng khi leo thang, thêm side view facing right (dùng góc phải trong bộ 3 góc).

