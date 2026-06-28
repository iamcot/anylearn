<?php

use App\Constants\NotifConstants;

return [
    /** User notif */
    NotifConstants::NEW_USER => [
        'title' => 'Chào mừng',
        'template' => 'Chào mừng {username} đến với ứng dụng anyLEARN - Học không giới hạn. Chúc bạn có thật nhiều niềm vui và kiến thức bổ ích khi trải nghiệm nhé. Bạn hãy dành ít phút cập nhật thông tin của mình nhé.',
        'route' => '/account',
        'email' => 'App\Mail\UserRegistered',
    ],
    NotifConstants::NEW_FRIEND => [
        'title' => 'Bạn mới',
        'template' => '{friend} vừa mới tham gia anyLEARN với tư cách là bạn bè của bạn. Hãy chào mừng bạn ấy nào.',
        'route' => '/account/friends',
        'args' => true,
    ],
    NotifConstants::CONTRACT_APPROVED => [
        'title' => 'Hợp đồng được duyệt',
        'template' => 'Chúc mừng {username}! Hợp đồng của bạn đã được duyệt.',
        'route' => '/account',
    ],
    NotifConstants::CONTRACT_DELETED => [
        'title' => 'Hợp đồng bị từ chối',
        'template' => '{username} ơi. Rất tiếc hợp đồng của bạn đã bị từ chối, xin kiểm tra lại thông tin hoặc vui lòng liên hệ 0374 900 344 để được hỗ trợ.',
        'route' => '/account',
    ],
    NotifConstants::UPDATE_INFO_REMIND => [
        'title' => 'Cập nhật thông tin',
        'template' => 'Bạn ơi, bạn hãy cập nhật thông tin cá nhân và làm profile của mình thật cool ngầu nhé.',
        'route' => '/account/edit',
    ],

    /** Course process */
    NotifConstants::COURSE_APPROVED =>  [
        'title' => 'Khóa học được duyệt',
        'template' => 'Chúc mừng! Khóa học {course} của bạn đã được duyệt.',
        'route' => '/course/list',
    ],
    NotifConstants::COURSE_REJECTED =>  [
        'title' => 'Khóa học bị từ chối',
        'template' => '{username} ơi! Khóa học {course} của bạn vừa bị từ chối. Nó sẽ không được hiện thị trên hệ thống, Bạn vui lòng bổ sung thêm thông tin nhé.',
        'route' => '/course/list',
    ],
    NotifConstants::COURSE_REGISTERED =>  [
        'title' => 'Đăng kí thành công',
        'template' => 'Bạn đã đăng ký {course} thành công. Kiểm tra lịch để đừng bỏ lỡ nhé.',
        'route' => '/account/calendar',
        // 'email' => 'App\Mail\OrderSuccess',
    ],
    NotifConstants::COURSE_JOINED =>  [
        'title' => 'Có học viên vừa xác nhận tham gia',
        'template' => '{username} vừa mới xác nhận đã tham gia buổi học {course} của bạn.',
        'route' => '/course/list',
    ],
    NotifConstants::COURSE_HAS_REGISTERED =>  [
        'title' => 'Khóa học có người đăng ký',
        'template' => 'Khóa học {course} của bạn vừa có thêm người đăng ký mới. Kiểm tra danh sách học viên của bạn nhé!',
        'route' => '/course/list',
    ],
    NotifConstants::COURSE_HAS_NEW =>  [
        'title' => 'Khóa học mới trên hệ thống',
        'template' => 'Chào {username}, anyLEARN vừa có khoá học mới {course}. Mời bạn tìm hiểu và đăng ký ngay nhé!',
        'route' => '/pdp',
        'args' => true,
    ],
    NotifConstants::COURSE_HAS_CHANGED =>  [
        'title' => 'Khóa học có chút thay đổi',
        'template' => 'Bạn ơi, Khóa học {course} của bạn đăng ký có chút thay đổi về thời gian và địa điểm, bạn cập nhật thông tin nhé.',
        'route' => '/account/calendar',
    ],

    NotifConstants::COURSE_SHARE =>  [
        'title' => 'Bạn đã biết khóa học này chưa?',
        'template' => '{username} mời bạn cùng học {course}. Hãy xem khóa học này có gì hay nhé.',
        'route' => '/pdp',
        'args' => true,
    ],

    /** Transaction */

    NotifConstants::TRANSACTIONN_UPDATE =>  [
        'title' => 'Ví của bạn có sự thay đổi',
        'template' => '{content}',
        'route' => '/transaction',
    ],

    NotifConstants::TRANS_DEPOSIT_SENT =>  [
        'title' => 'Yêu cầu nạp tiền đã gửi',
        'template' => 'Bạn vừa gửi yêu cầu nạp {amount} vào tài khoản trên anyLEARN. Vui lòng hoàn thành các thao tác yêu cầu và đợi trong ít phút nhé. Liên hệ 037 4900 344 nếu bạn cần hỗ trợ',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_DEPOSIT_APPROVED =>  [
        'title' => 'Yêu cầu nạp tiền được xác nhận',
        'template' => 'Yêu cầu nạp tiền của bạn đã được xác nhận. Kiểm tra ngay!',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_DEPOSIT_REJECTED =>  [
        'title' => 'Yêu cầu nạp tiền bị từ chối',
        'template' => 'Yêu cầu nạp tiền của bạn đã bị từ chối. Thử lại lần nữa hoặc liên hệ 0374 900 344 để được hỗ trợ.',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_WITHDRAW_SENT =>  [
        'title' => 'Yêu cầu rút tiền đã gửi',
        'template' => 'Bạn vừa gửi yêu cầu rút {point} điểm thành {amount} về ngân hàng. Vui lòng chờ đợi trong ít phút nhé. Liên hệ 037 4900 344 nếu bạn cần hỗ trợ',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_WITHRAW_APPROVED =>  [
        'title' => 'Rút điểm về ngân hàng được duyệt',
        'template' => 'Bạn vừa rút {amount} về ngân hàng của mình. Chúc mừng bạn đã nhận được khoản tiền xứng đáng nhờ đầu tư học tập!',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_EXCHANGE_APPROVED =>  [
        'title' => 'Đổi điểm về tài khoản thành công',
        'template' => 'Bạn vừa đổi {amount} điểm thành tiền mặt trên anyLEARN. Bạn đã có thể thanh toán cho các khóa học của mình.',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_WITHRAW_REJECTED =>  [
        'title' => 'Rút điểm về ngân hàng bị từ chối',
        'template' => 'Rất tiếc! Yêu cầu rút điểm của bạn bị từ chối. Thử lại lần nữa hoặc liên hệ 0374 900 344 để được hỗ trợ.',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_DEPOSIT_REFUND =>  [
        'title' => 'Bạn vừa nhận hoàn tiền',
        'template' => '{username} ơi! anyLEARN vừa hoàn {amount} về ngân hàng của bạn. Vui lòng kiểm tra bạn nhé.',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_COMMISSION_RECEIVED =>  [
        'title' => 'Nhận được điểm thưởng',
        'template' => 'Chúc mừng {username}! Bạn vừa nhận được {amount} điểm thưởng. Kiểm tra nhé.',
        'route' => '/transaction',
    ],
    NotifConstants::TRANS_FOUNDATION =>  [
        'title' => 'Đóng góp vào quỹ Foundation',
        'template' => 'Bạn vừa đóng góp {amount} vào anyLEARN Foundation từ việc mua khóa học {course}. Hãy xem những gì chúng ta có thể cùng nhau xây dựng!',
        'route' => '/foundation',
    ],

    /** Reminder */
    NotifConstants::REMIND_CONFIRM =>  [
        'title' => 'Hoàn thành khóa học!',
        'template' => 'Chúc mừng {username} đã vừa hoàn thành buổi học {course}. Hãy dành chút thời gian vào mục Lịch học bấm Xác nhận tham gia lớp học để phục vụ cho công tác điểm danh của buổi học nhé!',
        'route' => '/account/calendar'
    ],
    NotifConstants::REMIND_COURSE_JOIN =>  [
        'title' => 'Vào lớp thôi!!!',
        'template' => 'Khoá học {course} của bạn vừa bắt đầu. Vào học ngay',
        'route' => '/account/calendar'
    ],
    NotifConstants::REMIND_COURSE_GOING =>  [
        'title' => 'Nhắc lịch học!',
        'template' => '{username} ơi, chỉ còn {day} ngày nữa là bắt đầu khóa học {course} của bạn. Đừng bỏ lỡ nhé!',
        'route' => '/account/calendar'
    ],
    NotifConstants::REMIND_COURSE_GOING_JOIN =>  [
        'title' => 'Sắp bắt đầu giờ học rồi nè!',
        'template' => '{username} ơi, khóa học {course} của bạn sẽ bắt đầu trong {time} nữa thôi. Chúng ta hãy vào lớp đúng giờ nhé!',
        'route' => '/account/calendar',
    ],

    NotifConstants::ASK_NEW_ANSWER =>  [
        'title' => 'Có câu trả lời mới',
        'template' => 'Câu hỏi của bạn có một trả lời mới, xem nhé',
        'route' => '/ask/forum/thread',
        'args' => true,

    ],

    NotifConstants::ASK_NEW_COMMENT =>  [
        'title' => 'Có bình luận mới',
        'template' => 'Câu trả lời của bạn có một bình luận mới, xem nhé',
        'route' => '/ask/forum/thread',
        'args' => true,
    ],

    NotifConstants::ASK_ANSWER_SELECTED =>  [
        'title' => 'Trả lời của bạn được chọn',
        'template' => 'Câu trả lời của bạn đã được người hỏi chọn là câu trả lời chính xác, xem nhé',
        'route' => '/ask/forum/thread',
        'args' => true,
    ],

    NotifConstants::VOUCHER_MONEY_SENT =>  [
        'title' => 'Bạn vừa được nhận một voucher',
        'template' => 'Bạn vừa nhận voucher {voucher} trị giá {amount} dùng để thanh toán giỏ hàng (chạm để  copy).',
        'route' => '',
        'copy' => true,
    ],
    NotifConstants::VOUCHER_CLASS_SENT =>  [
        'title' => 'Bạn vừa được nhận một voucher khóa học',
        'template' => 'Bạn vừa nhận voucher {voucher} để tham gia khóa học {class}. Hãy đăng ký nhé',
        'route' => '/pdp',
        'args' => true,
    ],
    NotifConstants::VOUCHER_PARTNER_SENT =>  [
        'title' => 'Bạn vừa được nhận một voucher của đối tác',
        'template' => 'Mã kích hoạt {partner} của bạn là: {voucher} (chạm để copy)',
        'route' => '',
        'copy' => true,
    ],

    NotifConstants::COURSE_ACTIVATION_API =>  [
        'title' => 'Kích hoạt khóa học',
        'template' => 'Bạn vừa đăng ký thành công khóa học {course}, vui lòng kiểm tra email để kích hoạt khóa học!',
        'route' => '',
        'email' => 'App\Mail\CourseActivation',
    ],

    NotifConstants::COURSE_ACTIVATION_MANUAL =>  [
        'title' => 'Kích hoạt khóa học',
        'template' => 'Mã kích hoạt khóa học {course} của bạn là: {code} (chạm để copy)',
        'route' => '',
        'copy' => true,
        'email' => 'App\Mail\CourseActivation',
    ],

    NotifConstants::COURSE_REGISTER_APPROVE =>  [
        'title' => 'Đăng ký học đã được xác nhận thanh toán',
        'template' => 'Khoá học {className} bạn đăng ký đã được thanh toán. Vui lòng kiểm tra lịch học.',
        'route' => '/account/calendar',
        'email' => 'App\Mail\OrderSuccess',
    ],

    NotifConstants::COURSE_REGISTER_REJECT =>  [
        'title' => 'Đơn hàng bạn đang đăng ký đã bị từ chối',
        'template' => 'Đơn hàng bạn đặt đã bị từ chối. Vui lòng thử lại hoặc liên hệ với hotline để được hỗ trợ.',
        'route' => '',
        // 'email' => 'App\Mail\OrderSuccess',
    ],

    NotifConstants::COURSE_RETURN =>  [
        'title' => 'Đơn hàng bạn mua đang được hoàn trả',
        'template' => 'Đơn hàng bạn mua đã bị hủy, chúng tôi đã tiến hành hoàn tiền cho bạn trong thời gian sớm nhất.',
        'route' => '',
        // 'email' => 'App\Mail\OrderSuccess',
    ],

    NotifConstants::COURSE_REFUND =>  [
        'title' => 'Đơn hàng bạn đã mua đang được hoàn tiền',
        'template' => 'Đơn hàng hủy của bạn đang được hoàn tiền. Thời gian hoàn tiền dự kiến trong vòng 3 ngày làm việc.',
        'route' => '',
        // 'email' => 'App\Mail\OrderSuccess',
    ],

    NotifConstants::COURSE_REGISTER_PENDING =>  [
        'title' => 'Khóa học đang chờ được thanh toán',
        'template' => 'Có một khóa học đang chờ được thanh toán, vui lòng kiểm tra email hoặc trên website để biết thêm thông tin nhé.',
        'route' => '',
        // 'email' => 'App\Mail\OrderPending',
    ],
    NotifConstants::COURSE_CREATED =>  [
        'title' => 'Khóa học mới trên anyLEARN',
        'template' => 'Đối tác {author} vừa tạo khóa học {class} trên anyLEARN với giá {price}. Xem ngay nhé.',
        'route' => '/pdp',
        'args' => true,
        'email' => 'App\Mail\NewClassCreated',
    ],
    NotifConstants::COURSE_CERT_SENT =>  [
        'title' => 'Chứng chỉ hoàn thành khóa học',
        'template' => 'Chúc mừng bạn vừa hoàn thành khóa học {class} trên anyLEARN. Chứng chỉ của bạn đã có, kiểm tra trên lịch học hoặc mail đăng ký nhé.',
        'route' => '/account/calendar',
        'email' => 'App\Mail\CourseCert',
    ],

    NotifConstants::SYSTEM_NOTIF =>  [
        'title' => 'Thông báo từ anyLEARN',
        'template' => '{message}',
        'route' => '',
        'args' => true,
        'copy' => true,
    ],
];
