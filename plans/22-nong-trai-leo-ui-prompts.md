# Plan 22 – Prompt ảnh cho giao diện Nông trại (bảng hiệu, rương xu, icon tab)

Mỗi prompt dưới đây đã có sẵn đoạn style, **chỉ cần copy cả khối và dán**. Vẽ trong cùng cuộc chat với các ảnh nông trại cũ để giữ nét. Xuất PNG nền trắng, bỏ vào `assets/farm/` với đúng tên file (đuôi `.png`), rồi chạy `python3 scripts/farm_assets.py` (script tự xóa nền).

Chữ trên bảng hiệu, số xu và tên tab do app vẽ, nên ảnh không có chữ.

## 1. `ui_sign_board.png` — Bảng hiệu gỗ làm header (viết chữ bằng app) (1536x512, ngang)

```
A wide wooden farm signboard, horizontal plank panel made of three warm brown planks with visible wood grain, rounded corners, dark brown frame, four round nails in the corners, two short hanging ropes tied at the top, a small green leaf sprig and a tiny yellow flower decorating the top-left corner, the center of the board is a clean empty flat wooden area for text. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 2. `ui_coin_chest.png` — Rương xu cạnh bảng hiệu (số xu đặt bên cạnh) (512x512)

```
A small cute wooden treasure chest, lid open, overflowing with shiny round golden coins with a star embossed on each coin, brown planks with golden metal corner brackets, a few coins sparkling, a couple of coins fallen in front, three-quarter view. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 3. `ui_tab_garden.png` — Icon tab Vườn (256x256)

```
A cute small tilled soil patch with a green sprout and two leaves growing from it, a tiny watering drop above, rounded diamond-shaped soil tile with mint grass edge. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 4. `ui_tab_orders.png` — Icon tab Đơn hàng (256x256)

```
A cute small wooden crate holding a stack of fresh vegetables (a carrot, a tomato, a green leaf) with a paper delivery tag tied to the crate, kawaii. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 5. `ui_tab_quests.png` — Icon tab Nhiệm vụ (256x256)

```
A cute rolled parchment scroll tied with a green ribbon next to a small golden star, a tiny sparkling check mark badge, kawaii. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 6. `ui_tab_neighbors.png` — Icon tab Hàng xóm (256x256)

```
Two cute small round houses side by side with red roofs and a tiny fence between them, a small pink heart floating above, kawaii. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 7. `ui_tab_market.png` — Icon tab Chợ (256x256)

```
A cute small market stall with a striped red and cream awning, wooden counter with a basket of apples and a small pile of golden coins, kawaii. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```

## 8. `ui_tab_market_alt.png` — Icon Chợ (phương án hai, nếu bản trên trùng bảng đơn hàng) (256x256)

```
A cute round golden coin bag tied with a green ribbon with a tiny leaf, next to a small wooden price tag shaped like a leaf, kawaii. Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Plain pure white background, single object centered with a little margin, no shadow on the ground. No text, no letters, no numbers, no logo, no watermark.
```
