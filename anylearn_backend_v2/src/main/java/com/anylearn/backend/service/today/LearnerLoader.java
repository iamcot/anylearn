package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.entity.UserCourseEnrollment;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemScheduleRepository;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LearnerLoader {

    private static final Byte IS_CHILD = 1;
    private static final String ACTIVE = "active";

    private final UserRepository users;
    private final UserCourseEnrollmentRepository enrollments;
    private final ItemRepository items;
    private final ItemScheduleRepository schedules;
    private final OrderDetailRepository orderDetails;

    public List<Learner> learnersOf(User account) {
        List<Learner> learners = new ArrayList<>();
        learners.add(new Learner(account.getId(), account.getName(), true));
        users.findByUserIdAndIsChild(account.getId(), IS_CHILD).stream()
                .sorted(Comparator.comparing(User::getId))
                .map(child -> new Learner(child.getId(), child.getName(), false))
                .forEach(learners::add);
        return learners;
    }

    public Learner require(User account, Long learnerId) {
        return learnersOf(account).stream()
                .filter(learner -> learner.id().equals(learnerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người học"));
    }

    public LearnerData load(Long learnerId) {
        List<UserCourseEnrollment> active = enrollments.findByUserIdAndStatus(learnerId, ACTIVE);
        List<Long> pendingItemIds = orderDetails.findItemIdsWithPendingPayment(learnerId);

        Map<Long, Item> itemsById = itemsById(active, pendingItemIds);
        Map<Long, ItemSchedule> schedulesById = schedulesById(active);

        List<EnrollmentContext> contexts = active.stream()
                .filter(enrollment -> itemsById.containsKey(enrollment.getItemId()))
                .map(enrollment -> new EnrollmentContext(enrollment,
                        itemsById.get(enrollment.getItemId()),
                        schedulesById.get(enrollment.getScheduleId())))
                .toList();

        List<Item> pendingFeeItems = pendingItemIds.stream()
                .map(itemsById::get)
                .filter(item -> item != null && Integer.valueOf(1).equals(item.getIsPaymentfee()))
                .toList();

        return new LearnerData(contexts, pendingFeeItems);
    }

    private Map<Long, Item> itemsById(List<UserCourseEnrollment> active, List<Long> pendingItemIds) {
        Set<Long> ids = new HashSet<>(pendingItemIds);
        active.forEach(enrollment -> ids.add(enrollment.getItemId()));
        return items.findAllById(ids).stream().collect(Collectors.toMap(Item::getId, Function.identity()));
    }

    private Map<Long, ItemSchedule> schedulesById(List<UserCourseEnrollment> active) {
        List<Long> ids = active.stream().map(UserCourseEnrollment::getScheduleId).filter(id -> id != null).toList();
        return schedules.findAllById(ids).stream().collect(Collectors.toMap(ItemSchedule::getId, Function.identity()));
    }
}
