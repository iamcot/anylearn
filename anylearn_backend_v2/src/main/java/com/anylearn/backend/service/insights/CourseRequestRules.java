package com.anylearn.backend.service.insights;

import com.anylearn.backend.entity.CourseRequest;
import com.anylearn.backend.service.PersonNames;

import java.util.Set;
import java.util.regex.Pattern;

/** Validation and cleaning of a course request, so the service only stores what makes sense. */
public final class CourseRequestRules {

    static final int MIN_SUBJECT_LENGTH = 2;
    static final int MAX_SUBJECT_LENGTH = 255;
    static final int MAX_NAME_LENGTH = 100;
    static final int MAX_DISTRICT_LENGTH = 100;
    static final int MAX_NOTE_LENGTH = 1000;
    static final long MAX_BUDGET = 1_000_000_000L;
    private static final Set<String> PREFERRED_TIMES = Set.of("weekday_evening", "weekend", "summer", "flexible");
    private static final Set<String> MODES = Set.of("offline", "online", "any");
    private static final Pattern LOCAL_PHONE = Pattern.compile("0\\d{9,10}");

    private CourseRequestRules() {}

    /** "+84 912 345 678", "84912345678" and "0912.345.678" all become "0912345678"; anything else is null. */
    public static String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[\\s.\\-()]", "");
        if (digits.startsWith("+84")) digits = "0" + digits.substring(3);
        else if (digits.startsWith("84") && digits.length() >= 11) digits = "0" + digits.substring(2);
        return LOCAL_PHONE.matcher(digits).matches() ? digits : null;
    }

    /** Returns the request to store (not saved), or throws IllegalArgumentException with a message for the visitor. */
    public static CourseRequest toRequest(CourseRequestInput input, Long userId) {
        String phone = normalizePhone(input.phone());
        if (phone == null) throw new IllegalArgumentException("Số điện thoại chưa đúng, vui lòng kiểm tra lại");
        String subject = SearchLogPolicy.clean(input.subject(), MAX_SUBJECT_LENGTH);
        if (subject == null || subject.length() < MIN_SUBJECT_LENGTH)
            throw new IllegalArgumentException("Vui lòng cho biết bạn muốn tìm khóa học gì");
        if (input.learnerAge() != null && SearchLogPolicy.cleanLearnerAge(input.learnerAge()) == null)
            throw new IllegalArgumentException("Độ tuổi chưa hợp lệ");
        if (input.budgetMax() != null && (input.budgetMax() < 0 || input.budgetMax() > MAX_BUDGET))
            throw new IllegalArgumentException("Ngân sách chưa hợp lệ");

        CourseRequest request = new CourseRequest();
        request.setUserId(userId);
        request.setContactName(SearchLogPolicy.clean(input.name(), MAX_NAME_LENGTH));
        request.setContactPhone(phone);
        request.setSubject(subject);
        request.setSubjectNormalized(PersonNames.normalize(subject));
        request.setLearnerAge(input.learnerAge());
        request.setProvinceCode(SearchLogPolicy.cleanFilter(input.provinceCode()));
        request.setDistrictText(SearchLogPolicy.clean(input.districtText(), MAX_DISTRICT_LENGTH));
        request.setBudgetMax(input.budgetMax());
        request.setPreferredTime(oneOf(input.preferredTime(), PREFERRED_TIMES));
        request.setMode(oneOf(input.mode(), MODES));
        request.setNote(SearchLogPolicy.clean(input.note(), MAX_NOTE_LENGTH));
        request.setSourceRef(SearchLogPolicy.isValidRef(input.sourceRef()) ? input.sourceRef() : null);
        return request;
    }

    private static String oneOf(String value, Set<String> allowed) {
        return value != null && allowed.contains(value) ? value : null;
    }
}
