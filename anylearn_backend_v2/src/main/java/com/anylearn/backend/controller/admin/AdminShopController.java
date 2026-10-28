package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.quiz.QuizGameSettings;
import com.anylearn.backend.service.shop.ShopSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Back office page "Cửa hàng Leo Xu" (plan 15): every price, daily limit and switch of the shop, plus the quiz numbers the shop shares
 * (item prices `quiz/price_*`, energy, pack size), which are the same rows as on the page "Quiz Leo rank".
 */
@RestController
@RequestMapping("/admin/fun/shop-config")
@RequiredArgsConstructor
public class AdminShopController {

    /** The quiz numbers this page may write. */
    private static boolean sharedQuizKey(String key) {
        return key.startsWith("price_") || key.startsWith("energy_") || "pack_size".equals(key) || "buy_daily_cap".equals(key);
    }

    private final ShopSettings shop;
    private final QuizGameSettings quiz;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private Map<String, Object> view() {
        Map<String, Object> out = new LinkedHashMap<>(shop.asMap());
        out.put("fields", shop.fields());
        Map<String, Object> numbers = new LinkedHashMap<>();
        ((Map<?, ?>) quiz.asMap().get("numbers")).forEach((k, v) -> {
            if (sharedQuizKey(String.valueOf(k))) numbers.put(String.valueOf(k), v);
        });
        out.put("quizNumbers", numbers);
        List<QuizGameSettings.Field> quizFields = quiz.fields().stream().filter(f -> sharedQuizKey(f.key())).toList();
        out.put("quizFields", quizFields);
        return out;
    }

    @GetMapping
    public ApiResponse<?> get(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(view());
    }

    /** Body {enabled?, numbers: {shop numbers}, quizNumbers: {quiz numbers}}; a value outside its range is refused and nothing is saved. */
    @PutMapping
    public ApiResponse<?> save(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = shop.check(body);
        if (problem != null) return ApiResponse.fail(problem);
        Map<String, Object> quizNumbers = new LinkedHashMap<>();
        if (body.get("quizNumbers") instanceof Map<?, ?> given) {
            for (Map.Entry<?, ?> e : given.entrySet()) {
                if (sharedQuizKey(String.valueOf(e.getKey()))) quizNumbers.put(String.valueOf(e.getKey()), e.getValue());
            }
        }
        if (!quizNumbers.isEmpty()) {
            problem = quiz.save(Map.of("numbers", quizNumbers));
            if (problem != null) return ApiResponse.fail(problem);
        }
        shop.save(body);
        return ApiResponse.ok(view());
    }
}
