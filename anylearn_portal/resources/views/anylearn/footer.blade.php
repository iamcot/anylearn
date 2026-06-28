@inject('itemServ', 'App\Services\ItemServices')
<footer>
    <div class="container p-5">
        <div class="row">
            <div class="col-md-4">
                <p><img src="/cdn/anylearn/img/logo-color.svg" class="img-fluid" alt=""></p>
            </div>
            <div class="col-md-3 d-md-block d-none head_text">
                <div class="fw-bold">@lang('THÔNG TIN HỖ TRỢ')</div>
            </div>
            <div class="col-md-5 d-md-block d-none head_text">
                <div class="fw-bold">@lang('TIN TỨC MỚI NHẤT')</div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4">
                <ul class="list-unstyled text-secondary">
                    <li><i class="fas fa-briefcase text-success m-2"></i>@lang('CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ GIÁO DỤC ANYLEARN')</li>
                    <li><i class="fas fa-briefcase text-success m-2"></i>MSKD: 0316363793</li>
                    <li><i class="fas fa-envelope text-success m-2"></i>info@anylearn.vn</li>
                    <li><i class="fas fa-phone text-success m-2"></i><a href="tel:0374900344">+84 37 490 0344</a></li>
                    <li><i class="fas fa-map-marker-alt text-success m-2"></i>@lang('352/28A Nguyễn Tất Thành, P.13, Q.4,<br> TP Hồ Chí Minh, Việt Nam')
                    </li>
                </ul>
            </div>
           
            <div class="col-md-3">
                <div class="fw-bold d-md-none d-sm-block head_text">@lang('THÔNG TIN HỖ TRỢ')</div>
                <ul class="list-unstyled text-secondary">
                    <li><p><a data-spm="footer.helpcenter" href="/helpcenter" class="text-secondary text-decoration-none">@lang('Trung tâm hỗ trợ')</a></p></li>
                    <li><p><a data-spm="footer.privacy" href="/privacy" class="text-secondary text-decoration-none">@lang('Chính sách')</a></p></li>
                    <li><p><a data-spm="footer.toc" href="/guide?p=guide_toc" class="text-secondary text-decoration-none">@lang('Điều khoản')</a></p></li>
                    <li><p><a data-spm="footer.about" href="https://anylearn.vn/info" class="text-secondary text-decoration-none">@lang('Giới thiệu')</a></p></li>
                </ul>
            </div>
            <div class="col-md-5">
                <div class="fw-bold d-md-none d-sm-block head_text">@lang('TIN TỨC MỚI NHẤT')</div>
                <ul class="list-unstyled text-secondary">
                    @foreach($itemServ->footerNews() as $news)
                    <li><p><a data-spm="footer-news.{{ $news->id }}" href="{{ $itemServ->articleUrl($news->id) }}" class="text-secondary text-decoration-none">{{ $news->title }}</a></p></li>
                    @endforeach
                </ul>
                <ul class="list-unstyled list-inline">
                    <li class="list-inline-item"><a data-spm="footer.facebook" href="https://www.facebook.com/anylearnhockhonggioihan"><i class="fab fa-2x fa-facebook"></i></a></li>
                    <li class="list-inline-item"><a data-spm="footer.youtube" href="https://www.youtube.com/channel/UCam71id1lM8tZuMfjy2DDRw"><i class="fab fa-2x fa-youtube text-danger"></i></a></li>
                </ul>
            </div>
        </div>
    </div>
</footer>
<div id="footer_call"><i class="fas fa-phone text-success m-2 blink_me"></i><a href="tel:0374900344">+84 37 490 0344</a></div>