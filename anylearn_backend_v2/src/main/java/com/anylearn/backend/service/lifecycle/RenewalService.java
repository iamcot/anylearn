package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.entity.UserCourseEnrollment;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.CartService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.today.EnrollmentContext;
import com.anylearn.backend.service.today.LearnerData;
import com.anylearn.backend.service.today.LearnerLoader;
import com.anylearn.backend.service.today.PackageCards;
import com.anylearn.backend.service.today.SessionSchedule;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One-tap renewal (plan 07.5): puts the same course for the same learner (same class, next fee period) in the cart, and
 * remembers which enrollment it renews. When that order is paid, a renewal made while the old package or period still
 * ran earns the early-renewal anyPoint bonus, once per renewed enrollment.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RenewalService {

    public static final String TYPE_BONUS = "renew_bonus";

    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final ItemRepository itemRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final LearnerLoader learnerLoader;
    private final SessionSchedule sessionSchedule;
    private final PackageCards packageCards;
    private final LifecycleSettings settings;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    /** Adds the renewal to the cart. The IllegalArgumentException message (class full, registration closed…) is shown to the person. */
    @Transactional
    public Map<String, Object> renew(User account, Long enrollmentId) {
        UserCourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khóa học cần gia hạn"));
        learnerLoader.require(account, enrollment.getUserId());
        Item item = itemRepository.findById(enrollment.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Khóa học không còn tồn tại"));

        LocalDate today = LocalDate.now(clock);
        boolean early = isEarly(enrollment, item, today);
        boolean feeItem = enrollment.getScheduleId() == null;
        String startDate = feeItem && enrollment.getEndDate() != null ? enrollment.getEndDate().plusDays(1).toString() : null;
        Long studentId = enrollment.getUserId().equals(account.getId()) ? null : enrollment.getUserId();

        Map<String, Object> result = new LinkedHashMap<>();
        try {
            Map<String, Object> added = cartService.addToCart(item.getId(), studentId, null, enrollment.getScheduleId(), null,
                    startDate, null, null, null, account);
            Object cartItemId = added.get("cartItemId");
            if (cartItemId instanceof Number id) tagRenewal(id.longValue(), enrollmentId, early);
            result.putAll(added);
        } catch (IllegalArgumentException e) {
            if (!String.valueOf(e.getMessage()).contains("đã có trong giỏ")) throw e;
            result.put("alreadyInCart", true);
        }
        result.put("early", early);
        result.put("bonusPoints", early ? settings.earlyRenewBonusPoints() : 0);
        return result;
    }

    private boolean isEarly(UserCourseEnrollment enrollment, Item item, LocalDate today) {
        LearnerData data = learnerLoader.load(enrollment.getUserId());
        EnrollmentContext context = data.contexts().stream()
                .filter(c -> c.enrollment().getId().equals(enrollment.getId())).findFirst().orElse(null);
        if (context == null) return false; // the old enrollment is not active any more: nothing is "early"
        int remaining = 0;
        if (context.isSessionBased() && context.hasSchedule()) {
            remaining = packageCards.progressOf(sessionSchedule.wholePeriod(context), context.purchasedSessions(),
                    LocalDateTime.now(clock)).remaining();
        }
        return LifecycleRules.isEarlyRenewal(context.isSessionBased(), remaining, enrollment.getEndDate(), today);
    }

    private void tagRenewal(Long cartItemId, Long enrollmentId, boolean early) {
        itemUserActionRepository.findById(cartItemId).ifPresent((ItemUserAction action) -> {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> extra = objectMapper.readValue(
                        action.getExtraValue() != null ? action.getExtraValue() : "{}", Map.class);
                extra.put("renewOf", enrollmentId);
                extra.put("renewEarly", early);
                action.setExtraValue(objectMapper.writeValueAsString(extra));
                itemUserActionRepository.save(action);
            } catch (Exception e) {
                log.warn("Renewal: could not tag cart item {}: {}", cartItemId, e.getMessage());
            }
        });
    }

    /** Called when an order is paid, with the `extra` of each item of it. Gives the early-renewal bonus once. Returns the points given. */
    @Transactional
    public int onPaid(Map<String, Object> extra, Long orderId, Long buyerId) {
        if (!Boolean.TRUE.equals(extra.get("renewEarly")) || extra.get("renewOf") == null) return 0;
        int bonus = settings.earlyRenewBonusPoints();
        if (bonus <= 0) return 0;
        Long renewed = Long.parseLong(String.valueOf(extra.get("renewOf")));
        Long learnerId = enrollmentRepository.findById(renewed).map(UserCourseEnrollment::getUserId).orElse(buyerId);
        int rows = jdbc.update(
                "INSERT IGNORE INTO lifecycle_messages (enrollment_id, learner_id, user_id, stage, dedup_key) VALUES (?, ?, ?, 'renew_bonus', ?)",
                renewed, learnerId, buyerId, "renew-bonus:" + renewed);
        if (rows != 1) return 0;

        Transaction tx = new Transaction();
        tx.setUserId(buyerId);
        tx.setType(TYPE_BONUS);
        tx.setAmount((long) bonus);
        tx.setPayMethod("wallet_c");
        tx.setOrderId(orderId);
        tx.setContent("Thưởng gia hạn sớm đơn hàng #" + orderId);
        tx.setStatus(1);
        tx.setCreatedAt(LocalDateTime.now());
        tx.setUpdatedAt(LocalDateTime.now());
        transactionRepository.save(tx);
        walletService.creditWalletC(buyerId, bonus);
        try {
            notificationService.createNotification(buyerId, "system_notif", "Nhận " + bonus + " anyPoint",
                    "Cảm ơn bạn đã gia hạn sớm, anyLEARN tặng bạn " + bonus + " anyPoint.", "/account/anypoint", null);
        } catch (Exception e) {
            log.warn("Renewal: notification to {} failed: {}", buyerId, e.getMessage());
        }
        return bonus;
    }
}
