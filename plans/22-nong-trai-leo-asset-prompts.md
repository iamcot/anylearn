# Plan 22 – Prompt tạo ảnh cho Nông trại Leo

Đi kèm `plans/22-nong-trai-leo.md`. Cách làm giống `iamcot/gunb` (`plan/03-assets.md`, `08-prompt-nhan-vat.md`): **một đoạn style chung dán vào mọi prompt**, vẽ trong **cùng một cuộc chat** để giữ nét, tạo ảnh tĩnh, còn chuyển động (lắc lá, nảy quả, giọt nước, lấp lánh) làm bằng CSS. Prompt viết tiếng Anh vì model ảnh hiểu tốt hơn; giải thích bằng tiếng Việt.

Luật chung:
- Không đưa tên game thương mại, studio hay họa sĩ có thật vào prompt (không "in the style of ..."). Phong cách mô tả bằng lời.
- Mọi ảnh có Leo: đính kèm `assets/leo-3-views-sheet.png` và dán thêm **Đoạn Leo** (mục 3).
- Lưu prompt đã dùng vào `assets/farm/source/prompts/<file>.txt`, ghi công cụ + gói (để biết có được dùng thương mại không) vào `assets/farm/CREDITS.json` như gunb.
- Không có chữ trong ảnh. Chữ do app vẽ.

## 1. Style bible "Đồi Nắng"

Cảm giác: **anime chibi, dễ thương, tươi sáng**, như sách tranh thiếu nhi buổi sáng nắng đẹp. Khối tròn mềm, không góc nhọn, mắt to, má hồng. Ánh sáng ấm từ trên bên trái. Bóng ít, đổ bóng hai tông (cel shading) và chuyển màu mềm. Viền dày, tròn đầu, **màu nâu ấm đậm** cho cảnh vật và **xanh rêu đậm `#0B3D22`** cho Leo (giống sticker hiện có).

### Bảng màu

| Vai trò | Màu | Hex |
|---|---|---|
| Xanh thương hiệu (Leo, lá chính) | Green | `#00A651` |
| Xanh lá non / cỏ sáng | Mint | `#7FE0A8` |
| Cỏ vùng tối | Leaf deep | `#2E9E5B` |
| Nắng, quả vàng, xu | Sunny yellow | `#FFCA05` |
| Trời | Sky | `#8FD3FF` |
| Đất tơi | Soil | `#A8723F` |
| Đất ướt / tối | Wet soil | `#6B4423` |
| Kem, đường đi, gỗ sáng | Cream | `#FFF4DC` |
| Hồng đào (má, hoa) | Peach pink | `#FFB3C1` |
| Cam san hô (cà rốt, nhấn) | Coral | `#FF7A59` |
| Tím oải hương (hoa, phép màu) | Lavender | `#B9A4FF` |
| Viền cảnh vật | Outline brown | `#4A3020` |
| Viền Leo | Outline green | `#0B3D22` |
| Đêm (nền tối) | Night navy | `#1B2A4A` |

### Đoạn style chung (dán vào cuối mọi prompt)

```
Cute chibi anime 2D game art for a children's farming game, bright cheerful morning colors, soft rounded shapes with no sharp corners, thick smooth rounded outlines in warm dark brown #4A3020, two-tone cel shading with soft gradients, gentle warm light from the top-left, small white highlights, kawaii and friendly. Palette: brand green #00A651, mint #7FE0A8, leaf green #2E9E5B, sunny yellow #FFCA05, sky blue #8FD3FF, soil brown #A8723F, wet soil #6B4423, cream #FFF4DC, peach pink #FFB3C1, coral #FF7A59, lavender #B9A4FF. Camera: soft three-quarter top-down view (about 35 degrees), like a cozy isometric garden. No text, no letters, no numbers, no logo, no watermark.
```

### Negative prompt (dùng chung, công cụ nào có ô này thì dán)

```
text, letters, numbers, watermark, signature, logo, realistic, photorealistic, 3d render, plastic, pixel art, horror, scary, dark gloomy, sharp spikes, gore, weapons, thin scratchy lines, messy sketch, cluttered background, harsh shadows, cropped object, extra limbs, deformed character
```

### Định dạng xuất

| Loại | Kích thước | Nền | Ghi chú đặt hình |
|---|---|---|---|
| Ô đất | 512×384 | trong suốt | mặt đất là hình thoi nằm giữa, rộng ~90% ảnh |
| Cây (mỗi giai đoạn) | 512×512 | trong suốt | gốc cây ở giữa dưới, tâm gốc ở (256, 420), cây không chạm mép trên |
| Sản phẩm, hạt, dụng cụ, icon | 256×256 (vẽ 1024 rồi thu nhỏ) | trong suốt | vật ở giữa, rõ ở 40 px |
| Nhân vật | 1024×1024 | trong suốt | toàn thân, chân chạm đáy ~90% |
| Đồ trang trí | 512×512 | trong suốt | đứng trên mặt đất góc nhìn như ô đất |
| Nền vườn | 1080×1920 (điện thoại) và 1920×1080 (máy tính) | đặc | để trống vùng giữa cho lưới ô |
| Tranh chương | 1200×675 | đặc | chừa 30% dưới cho chữ |

Công cụ không xuất được nền trong suốt: thêm `plain solid white background`, rồi xóa nền (như quy trình gunb mục 4), kiểm không còn viền trắng.

## 2. Mẹo giữ đồng bộ

1. Vẽ **ô đất và một cây mẫu (Cà rốt cầu vồng) trước**. Ưng rồi mới vẽ tiếp, mỗi prompt sau mở đầu bằng `Same art style, outline, palette and camera as the carrot images in this chat.`
2. Các giai đoạn của cùng một cây vẽ liền nhau: `Same plant as the previous image, now at the next growth stage.`
3. Model hay vẽ thêm nền / chậu: nhắn `only the plant growing from a small soil mound, transparent background, no pot, no ground tile`.
4. Ra 3D bóng nhựa: nhắn `flat 2D cel shaded illustration, not 3d`.
5. Cây phải đọc được ở 64 px: hình khối to, ít chi tiết nhỏ.

## 3. Đoạn Leo (dán thêm khi ảnh có Leo, đính kèm `leo-3-views-sheet.png`)

```
Use the attached reference sheet as the exact design of "Leo", the mascot: a chunky rounded-rectangle body like a soft pill, as wide as he is tall, flat bottom, smooth green gradient from mint green at the top-left to deeper green at the bottom-right, two big white round eyes with dark green pupils and a small white highlight, tiny pink blush on both cheeks, small friendly smile, a small blue open book emblem on his belly, short stubby arms and round stubby feet, dark green outline #0B3D22. Do not change his proportions or body color. Clothing and props are allowed only as described.
```

## 4. Leo và nhân vật

| File | Mô tả | Prompt riêng (ghép Đoạn Leo nếu là Leo, rồi Đoạn style) |
|---|---|---|
| `leo_farmer_idle.png` | Leo làm vườn đứng vẫy tay | `Leo as a cheerful little farmer: a round straw hat with a tiny green sprout sticking out of the top, light blue denim overall straps over his body (the book emblem stays visible on the bib), small brown rubber boots. Standing in three-quarter view facing right, waving one hand, big happy smile.` |
| `leo_farmer_water.png` | Leo tưới cây | `Same farmer Leo. Holding a small round mint-green watering can with both hands, tilting it forward, a soft arc of water droplets pouring out to the right, eyes happily closed.` |
| `leo_farmer_harvest.png` | Leo thu hoạch | `Same farmer Leo. Holding up a woven wicker basket overflowing with colorful vegetables and flowers, leaning back slightly with an excited open-mouth smile, two tiny sparkles.` |
| `leo_farmer_sleep.png` | Leo ngủ (ban đêm) | `Same farmer Leo, sitting on the ground and leaning against a small wooden crate, straw hat tipped over his eyes, peacefully sleeping, a tiny "z" shape made of a soft cloud puff (not a letter) above him.` |
| `leo_farmer_cheer.png` | Leo mừng lên cấp | `Same farmer Leo jumping in the air with both arms up, straw hat flying slightly above his head, confetti of tiny leaves and petals around him.` |
| `npc_be_mam.png` | Bé Mầm, tinh linh hạt giống | `A tiny round seed spirit character, body like a plump light-brown seed with a soft glow, two little green leaves sprouting from the top of the head like pigtails, big sparkling eyes, rosy cheeks, floating slightly above the ground with a soft mint glow beneath. Kind and curious.` |
| `npc_bu_nhin.png` | Bác Bù Nhìn (bảng đơn hàng) | `A friendly chibi scarecrow standing on a wooden pole: a sack-cloth head with a warm smile stitched in, button eyes, a patched cream straw hat, a coral checkered shirt with straw poking out of the sleeves, arms open wide in a welcoming pose. Not scary at all.` |
| `npc_co_tho.png` | Cô Thỏ ở chợ | `A cute chibi rabbit shopkeeper girl standing upright, white fluffy fur with peach-pink inner ears, a sunny yellow apron with a small carrot pocket, holding a little wooden scale in one paw, bright welcoming smile.` |
| `npc_cho_bong.png` | Chó Bông canh vườn | `A small fluffy cream-colored puppy with floppy ears and a round body, a tiny green bandana around its neck, sitting proudly and alert with ears up, tongue slightly out, tail wagging (show two small motion lines).` |
| `npc_cho_bong_chase.png` | Chó Bông đuổi | `Same puppy running fast to the right, ears flying back, playful barking face (mouth open, no teeth shown sharply), small dust puffs behind its paws.` |
| `npc_ong_mat.png` | Cô Ong Mật | `A round chibi bee girl, fuzzy yellow and soft brown stripes, translucent rounded wings, two tiny antennae with heart tips, carrying a little honey pot, happy closed-eye smile.` |
| `pet_ga_bong.png` | Gà Bông (giai đoạn sau) | `A plump round white hen with a small red comb and yellow beak, tiny wings, sitting on a straw nest with one cream egg peeking out, sleepy happy eyes.` |
| `pet_bo_dom.png` | Bò Sữa Đốm (giai đoạn sau) | `A small chubby chibi cow, white with soft brown patches, tiny horns, pink nose, a little bell on a green collar, standing and smiling.` |

## 5. Cảnh vật và ô đất

| File | Prompt riêng |
|---|---|
| `bg_farm_day_mobile.png` (1080×1920) | `Vertical background of a cozy hillside farm on a sunny morning: soft sky blue at the top with two fluffy clouds and a gentle sun glow in the top-left corner, rolling green hills, a small wooden farmhouse with a red-orange roof and a round window in the upper area, a winding cream dirt path, wildflowers along the edges. The large central area is an open flat grassy meadow left empty (a garden grid will be placed there). Calm and low detail in the middle.` |
| `bg_farm_day_desktop.png` (1920×1080) | `Same farm scene as the previous image, widened to a horizontal composition: farmhouse on the left, a small pond and trees on the right, open flat meadow in the center left empty.` |
| `bg_farm_night_mobile.png` | `Same farm scene as the day version, at a cozy night: deep night navy #1B2A4A sky with soft stars and a smiling crescent moon, warm yellow light in the farmhouse window, fireflies as tiny glowing dots, hills in cool blue-green tones. Still cute and not scary.` |
| `bg_farm_sunset_mobile.png` | `Same farm scene at golden sunset: peach and coral sky gradient, long soft warm light, everything slightly golden.` |
| `plot_dry.png` | `A single garden plot tile seen from the soft three-quarter top-down view: a diamond-shaped raised bed of light tilled soil #A8723F with neat furrows, a thin rim of short grass around it. Transparent background, nothing growing.` |
| `plot_wet.png` | `Same plot tile but freshly watered: darker wet soil #6B4423, a few shiny water glints and two tiny puddles.` |
| `plot_fertilized.png` | `Same plot tile with a sprinkle of tiny golden-brown fertilizer pellets and three small sparkles on the soil.` |
| `plot_seeded.png` | `Same plot tile with three small soil mounds in a row, each with a tiny seed peeking out. Used for every crop at the seed stage.` |
| `plot_locked.png` | `Same plot tile shape but covered with overgrown grass, a few pebbles and a small wooden sign with a padlock symbol (no text).` |
| `tree_slot_empty.png` | `A round patch of soil for planting a fruit tree, ringed with small smooth stones, seen from the same view. Transparent background.` |
| `compost_bin.png` | `A cute wooden compost bin with three slats, green leaves and a carrot top peeking out, a small happy face carved on the front board.` |
| `market_stall.png` | `A small wooden market stall with a striped coral and cream awning, baskets of colorful vegetables and flowers on the counter, a little hanging lantern.` |
| `order_board.png` | `A wooden notice board on two posts with three blank paper notes pinned on it (no writing), a small straw roof on top, a tiny sprout growing at its foot.` |
| `farmhouse_leo.png` | `Leo's small cottage: rounded walls in cream, a mint-green door with a round top, a red-orange roof shaped like a leaf, a round window with flower box, a chimney shaped like a pencil. Standing on the same ground view as the plot tiles.` |
| `well.png` | `A small round stone well with a wooden roof and a bucket on a rope, ivy leaves on the stones.` |
| `mailbox_neighbor.png` | `A cute green mailbox on a wooden post shaped like a little house, a red flag raised, a small heart sticker on the side.` |

## 6. Dụng cụ, vật phẩm, icon (256×256)

| File | Prompt riêng |
|---|---|
| `tool_can_1.png` / `_2` / `_3` | `Single game icon: a small round watering can in mint green` / `... a bigger watering can in brand green with a gold rim` / `... a large magical watering can in lavender with a tiny rainbow arching from the spout and sparkles` |
| `item_fertilizer.png` | `Single game icon: a small cream burlap sack tied with green string, tiny golden pellets spilling out, a little leaf symbol printed on the sack (no text).` |
| `item_compost.png` | `Single game icon: a small pile of dark rich compost with a sprouting leaf on top and three sparkles.` |
| `item_wilted.png` | `Single game icon: two droopy brown-yellow leaves curled together, cute not sad.` |
| `item_knowledge_seed.png` | `Single game icon: a glowing golden seed shaped like a tiny closed book, soft light rays and sparkles around it.` |
| `item_seed_packet.png` | `Single game icon: a blank cream paper seed packet with a scalloped top edge and a big empty round window in the middle (the app will place a crop picture there), tied with a small green ribbon.` |
| `item_bouquet.png` | `Single game icon: a small bouquet of mixed colorful flowers wrapped in cream paper with a peach-pink ribbon bow.` |
| `item_scarecrow_guard.png` | `Single game icon: a tiny version of the friendly scarecrow head with a shield-shaped wooden badge in front.` |
| `item_basket.png` | `Single game icon: an empty woven wicker basket with a handle.` |
| `item_gift_box.png` | `Single game icon: a small square gift box in brand green with a sunny yellow ribbon, lid slightly open with sparkles.` |
| `icon_heart_neighbor.png` | `Single game icon: a plump peach-pink heart with a tiny green leaf on top.` |
| `icon_steal_hand.png` | `Single game icon: a cute small white glove gently pinching one flower stem, playful mischievous mood (two tiny motion lines).` |
| `icon_water_drop.png` | `Single game icon: one plump sky-blue water droplet with a white highlight and a tiny smile.` |
| `icon_thirsty.png` | `Single game icon: a droopy sprout with a speech-bubble-like cloud containing a water droplet.` |
| `icon_xp.png` | `Single game icon: a round sunny yellow star badge with a small sprout on top.` |

## 7. Cây trồng

Mỗi cây cần **3 ảnh giai đoạn + 1 ảnh sản phẩm** (giai đoạn "hạt" dùng chung `plot_seeded.png`; giai đoạn héo làm bằng CSS: ngả màu + rủ xuống). Khuôn prompt:

```
[Stage 2 – mầm]   Same art style, outline, palette and camera as the carrot images in this chat. A single young {CROP} seedling growing from a small soil mound: {SEEDLING}. Small and fresh. Transparent background, no pot, no ground tile.
[Stage 3 – lớn]   Same plant as the previous image, now half grown: {GROWING}. Transparent background.
[Stage 4 – chín]  Same plant as the previous image, now fully grown and ready to harvest: {RIPE}. Lush and appealing, three small sparkles around it. Transparent background.
[Sản phẩm]       Single game icon, same art style: {PRODUCT}. Centered, readable at 40 pixels, transparent background.
```

Rồi ghép **Đoạn style chung** vào cuối mỗi dòng. Bảng dưới chỉ ghi phần `{...}`.

### 7.1 Rau củ

| Cây | {SEEDLING} | {GROWING} | {RIPE} | {PRODUCT} |
|---|---|---|---|---|
| Rau mầm sương mai | two tiny round cotyledon leaves on a thin stem | a small dense clump of pale green sprouts | a fluffy cushion of bright microgreens, each tip holding a tiny glittering dew drop | a small bunch of microgreens tied with a string, one shiny dew drop |
| Cà rốt cầu vồng | three thin feathery leaves | a bushy tuft of feathery leaves, a hint of orange top in the soil | tall feathery leaves above the top of a fat carrot with soft rainbow stripes peeking out of the soil | one chubby carrot with gentle rainbow stripes and a leafy top, cute smiling face |
| Bắp rang nổ | one long grass-like leaf | a short corn stalk with two leaves and a small green ear | a sturdy corn stalk with one golden ear whose kernels are popping into fluffy white popcorn puffs | a corn cob half turned into popcorn, a few popcorn puffs jumping out |
| Khoai lang tím mặt cười | a heart-shaped leaf on a short vine | a small mound of trailing heart-shaped leaves | lush heart-leaf vines with a plump purple sweet potato peeking out, it has a little smiling face | one purple sweet potato with a happy face and two rosy cheeks |
| Cà chua bóng bay | two small jagged tomato leaves | a small tomato plant with yellow star-shaped flowers | a tomato plant where three round red tomatoes float upward like balloons, each tied to the stem by a thin curly vine | one glossy round red tomato floating with a curly vine string like a balloon |
| Bí ngô đèn lồng | a broad round leaf with a curly tendril | a spreading vine with big leaves and one small green pumpkin | a big round orange pumpkin with carved-looking window shapes glowing warm yellow from inside like a lantern, vine with a lantern handle | a small glowing pumpkin lantern with a stem handle |
| Bắp cải mây | a small pale green rosette | a loose round cabbage head forming | a big round cabbage whose outer leaves are soft white and fluffy like a cloud, light green at the center, a tiny cloud puff floating above | one cloud-like cabbage, white fluffy outer leaves and mint heart |
| Ớt tia lửa | two narrow leaves | a small bush with tiny white flowers | a bushy pepper plant with glossy red chilies, each with a tiny cute spark crackling at the tip | one red chili pepper with a little star spark at its tip |

### 7.2 Hoa

| Cây | {SEEDLING} | {GROWING} | {RIPE} | {PRODUCT} |
|---|---|---|---|---|
| Hoa nắng mai | a tiny sprout with two round leaves | a short stem with a closed yellow bud | three bright yellow flowers whose petals spread like little sun rays, a warm glow in each center | one sunny yellow sun-ray flower |
| Hoa nốt nhạc | a sprout with a curly tendril like a treble clef curve | stems with buds shaped like eighth notes | flowers whose lavender petals are shaped like musical notes, gently swaying, two tiny note-shaped petals floating in the air (no staff lines, no text) | one lavender flower with music-note shaped petals |
| Hướng dương mặt cười | a sturdy sprout with two oval leaves | a tall stem with a big closed green bud | a tall sunflower with a big round face of seeds in the center smiling happily, golden petals | one smiling sunflower head |
| Tulip ánh trăng | a pointed leaf pair | a stem with a closed silver-blue bud | three tulips with silvery pale blue petals softly glowing like moonlight, a tiny crescent moon sparkle above | one glowing silver-blue tulip |
| Hoa bảy sắc | a sprout with seven tiny leaves in a circle | a stem with a multicolored bud | a round flower with seven petals, each a different rainbow color, a tiny rainbow arc behind it | one seven-colored rainbow flower |
| Hoa pha lê tuyết | a sprout with icy blue tips | a stem with a clear crystal-like bud | flowers with translucent crystal petals catching light, tiny snowflakes drifting around | one crystal flower with a snowflake sparkle |

### 7.3 Cây diệu kỳ

| Cây | {SEEDLING} | {GROWING} | {RIPE} | {PRODUCT} |
|---|---|---|---|---|
| Dây leo số đếm | a curly vine shoot | a vine climbing a small wooden stick with tiny round buds | a vine on a little trellis with chubby fruit shaped like the shapes of the digits one, two and three in coral, yellow and mint (smooth rounded shapes, not printed text) | one chubby fruit shaped like a rounded digit, glossy |
| Cây chữ cái | a sapling with two leaves shaped like rounded letters | a small round tree with colorful buds | a small round tree whose fruits are puffy rounded alphabet-letter shapes in many bright colors, like soft candy (shapes only, no readable words) | one puffy letter-shaped fruit, glossy candy look |
| Cây bút chì màu | a sprout whose stem looks like a tiny pencil tip | a thin sapling with a trunk like a yellow pencil | a small tree with a yellow pencil-like trunk and branches ending in colorful crayon tips instead of fruits | a bundle of three colorful pencil-crayon fruits tied with a leaf |
| Nấm thiên văn | a small round bump of dark soil with a tiny cap | two small mushrooms with navy caps | three mushrooms with deep night-blue caps covered in glowing star dots forming simple constellations, soft glow | one night-blue mushroom with glowing star spots |
| Cây Tri thức | a golden sprout glowing softly | a young tree with a few glowing leaves and tiny closed books as buds | a magical small tree with mint and gold leaves, small glowing books hanging like fruits, gentle sparkles and light rays | one small glowing book fruit with a leaf on its spine |

### 7.4 Cây lâu năm (512×512, vẽ thêm ảnh "có quả" và "nghỉ")

| Cây | Lớn | Có quả | Nghỉ | Sản phẩm |
|---|---|---|---|---|
| Bụi dâu sao băng | `a round green berry bush with white flowers` | `the same bush covered with red strawberries whose seeds sparkle like tiny stars, one small shooting-star trail above` | `the same bush with only leaves, resting, a few fallen leaves` | `one strawberry with star-shaped sparkling seeds` |
| Cây cam mặt trời | `a small round orange tree with glossy leaves` | `the same tree full of bright orange fruits glowing like small suns` | `the same tree with leaves only` | `one orange glowing softly like a sun` |
| Cây táo ngôi sao | `a small apple tree with a cozy round crown` | `the same tree with shiny red apples, one apple cut in half on the grass showing a star shape inside` | `the same tree with leaves only` | `one red apple and its half showing a star in the core` |

### 7.5 Cây theo mùa

| Cây | {RIPE} (mầm / lớn tự suy ra như trên) | {PRODUCT} |
|---|---|---|
| Hoa mai vàng | a small apricot blossom tree full of five-petal golden-yellow flowers, tiny red envelope shapes hanging (blank, no text) | a branch of yellow apricot blossoms |
| Bưởi mặt cười | a pomelo tree with big round green-yellow pomelos, one has a cute smiling face made of leaf eyebrows | one pomelo with a happy face and leaf ears |
| Cây thông kẹo gậy | a small round pine tree decorated with candy canes and tiny glowing ornaments | one red and white candy cane with a pine sprig |
| Cẩm tú cầu khai giảng | big round hydrangea clusters in blue and lavender, a tiny school bell shaped flower on top | one round hydrangea cluster |

## 8. Đồ trang trí (512×512, đứng trên nền nhìn 3/4)

```
Single decoration object for the farm, same view as the plot tiles, standing on a small patch of grass, transparent background: {DECOR}.
```

| File | {DECOR} |
|---|---|
| `decor_fence_wood.png` | a short section of rounded wooden picket fence with a tiny flower at its base |
| `decor_bench.png` | a small curved wooden bench with a cream cushion |
| `decor_swing.png` | a tree-branch rope swing with a wooden seat |
| `decor_pond.png` | a small round pond with two lily pads and a smiling little frog |
| `decor_lantern.png` | a standing paper lantern on a bamboo pole, warm glow |
| `decor_windmill.png` | a tiny wooden windmill with mint and cream sails |
| `decor_flower_arch.png` | an arch covered with peach-pink and lavender flowers |
| `decor_book_stack.png` | a stack of three giant storybooks used as a little garden seat |
| `decor_sign_name.png` | a wooden name sign on a post with a blank board (the app writes the name) |
| `decor_hammock.png` | a cozy striped hammock between two short posts |
| `decor_tet_lantern.png` | a red-orange lantern with gold tassel for Lunar New Year |
| `decor_mooncake_lamp.png` | a star-shaped Mid-Autumn lantern with a candle glow |

Trang phục Leo (chồng lên `leo_farmer_*`, cùng tư thế): `outfit_hat_sunflower.png` "a straw hat with a big sunflower on the side", `outfit_overall_coral.png` "coral overalls with a pocket shaped like a leaf", `outfit_boots_frog.png` "green rubber boots with frog eyes on the toes". Vẽ bằng prompt: `Same farmer Leo in the same pose as {file}, now wearing {outfit}. Keep everything else identical.`

## 9. Tranh chương (1200×675, có Leo)

```
Wide story illustration for chapter {N} of a children's farming game, same characters and art style as this chat, warm storybook mood, lower 30 percent of the image kept calm and simple for a text overlay: {SCENE}.
```

| Chương | {SCENE} |
|---|---|
| 1 Hạt mầm đầu tiên | farmer Leo kneeling in an overgrown old garden at sunrise, gently holding a glowing seed while the tiny seed spirit Bé Mầm pops out of the soil to greet him |
| 2 Chợ Đồi Nắng | Leo pulling a small wooden cart of vegetables to a lively little market stall where the rabbit shopkeeper waves, colorful bunting overhead |
| 3 Hạt giống Tri thức | Leo and Bé Mầm watching a magical small tree with glowing book fruits grow, a child's school backpack resting nearby, sparkles in the air |
| 4 Hàng xóm thân thiện | Leo watering a neighbor's flower bed over a low fence while the fluffy puppy wags its tail and a neighbor's mailbox has hearts floating out |
| 5 Ngày hội hoa | a flower festival in the garden: rows of rainbow flowers, the bee girl flying with a honey pot, Leo holding a big bouquet, paper lanterns |
| 6 Đồi Nắng rực rỡ | the whole hillside farm in full bloom at golden hour, Leo's cottage finished, all characters together waving, fireflies and petals |

## 10. Ảnh khác

| File | Prompt riêng |
|---|---|
| `notify_ripe.png` (512×512) | `Farmer Leo peeking out from behind a big ripe carrot and a sunflower, pointing at them with excitement.` (dùng làm ảnh trong thông báo / thẻ "Vườn chín") |
| `empty_neighbors.png` | `Farmer Leo standing alone by a garden fence holding a letter with a heart, looking hopeful toward an empty neighbor plot.` |
| `comeback_gift.png` | `Farmer Leo holding a small seed packet gift with both hands toward the viewer, warm smile, a watering can at his feet.` |
| `share_farm_card.png` (1200×630) | `Horizontal banner: a lush cute hillside farm with colorful crops in diamond plots, farmer Leo waving in the front left, wide empty sky area on the right for a title overlay.` |
| `shortcut_farm.png` (512×512) | `Farmer Leo holding a watering can over a small sprout, shown as a round app shortcut illustration, white outline around the silhouette.` (đặt cạnh các ảnh `public/fun/leo_*.png` của `FunShortcuts`) |
| `sticker_farm_01..12.png` | Bộ sticker "Nông trại Leo": dùng **Prompt gốc** của `assets/leo-sticker-prompts.md` (die-cut, viền trắng) + một cảnh: Leo ôm cà rốt cầu vồng · Leo đội bí đèn lồng · Leo ngủ trên bắp cải mây · Leo thổi bồ công anh · Leo cưỡi chó Bông · Leo hái trộm hoa nhón chân · Leo nhảy múa với Bé Mầm · Leo tắm dưới bình tưới · Leo đếm quả dây số · Leo đọc sách dưới Cây Tri thức · Leo và Ong Mật chia mật · Leo ôm bó hoa tặng cô giáo |

## 11. Thứ tự vẽ theo phần việc

| Phần | Ảnh |
|---|---|
| 22.1 | ô đất (5), nền ngày điện thoại + máy tính, 8 cây đầu (32 ảnh), Leo idle / water / harvest, dụng cụ cấp 1, phân, phân ủ, thùng ủ, gói hạt, giỏ, giọt nước, khát, XP, lối tắt |
| 22.2 | Cô Thỏ, quầy chợ |
| 22.3 | Bác Bù Nhìn, bảng tin, bó hoa, hộp quà |
| 22.4 | Bé Mầm, Leo cheer, Cây Tri thức, hạt Tri thức, 6 tranh chương, thẻ chia sẻ |
| 22.5 | chó Bông (2), bù nhìn bảo vệ, hộp thư, tim, găng tay, hàng xóm trống |
| 22.6 | ảnh thông báo, quà quay lại, Leo ngủ, nền đêm, nền hoàng hôn |
| 22.7 | các cây còn lại, cây lâu năm, đồ trang trí, trang phục, dụng cụ cấp 2-3, sticker bộ nông trại |
| 22.8 | cây mùa, đồ mùa, vật nuôi |

Đặt ảnh vào `assets/farm/<nhóm>/<file>` (bản gốc 1024) và để code xuất bản nhẹ vào `anylearn_v2/public/farm/` (WebP, đúng kích thước bảng mục 1), như cách `public/fun/leo_*.png` được cắt từ `assets/icons`. Ảnh cây cũng tải được lên từ admin (tab Cây trồng) để thêm cây mới không cần deploy.
