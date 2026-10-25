package com.anylearn.backend.service.pricing;

import com.anylearn.backend.entity.PriceReport;
import com.anylearn.backend.service.insights.CourseRequestRules;
import com.anylearn.backend.service.insights.SearchLogPolicy;

/** Turns what the visitor typed into a report to store; throws IllegalArgumentException with a message for them. */
public final class PriceReportRules {

    static final int MAX_PLACE = 255;
    static final int MAX_NOTE = 1000;
    static final long MAX_PRICE = 1_000_000_000L;

    private PriceReportRules() {}

    public static PriceReport toReport(PriceReportInput input, Long userId) {
        String place = SearchLogPolicy.clean(input.seenPlace(), MAX_PLACE);
        String note = SearchLogPolicy.clean(input.note(), MAX_NOTE);
        if (place == null && note == null) throw new IllegalArgumentException("Cho chúng tôi biết bạn thấy giá rẻ hơn ở đâu nhé.");
        if (input.seenPrice() != null && (input.seenPrice() <= 0 || input.seenPrice() > MAX_PRICE))
            throw new IllegalArgumentException("Giá bạn thấy chưa hợp lệ.");

        String phone = null;
        if (input.phone() != null && !input.phone().isBlank()) {
            phone = CourseRequestRules.normalizePhone(input.phone());
            if (phone == null) throw new IllegalArgumentException("Số điện thoại chưa đúng.");
        }
        // Someone without an account has to leave a number, otherwise nobody can come back to them.
        if (userId == null && phone == null) throw new IllegalArgumentException("Vui lòng để lại số điện thoại để anyLEARN phản hồi.");

        PriceReport report = new PriceReport();
        report.setItemId(input.itemId());
        report.setUserId(userId);
        report.setContactPhone(phone);
        report.setSeenPrice(input.seenPrice());
        report.setSeenPlace(place);
        report.setNote(note);
        return report;
    }
}
