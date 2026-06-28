<div id="homepopupModal" class="modal fade shadow" tabindex="-1" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">{{ $popup['title'] }}
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>

                </h5>
              
            </div>
            <div class="modal-body">
                @if (!empty($popup['image']))
                    <img src="{{ $popup['image'] }}" alt="" style="max-width: 100%;">
                @endif
            </div>
            <div class="modal-footer">
                <a href="{{ $popup['route'] }}" target="_blank">@lang('XEM THÊM') <i class="fa fa-chevron-right"></i></a>
            </div>
        </div>
    </div>
</div>