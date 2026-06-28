<div id="tocModal" class="modal fade shadow" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-xl ">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">@lang('Điều khoản sử dụng')</h5>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            </div>
            <div class="modal-body">
            </div>
            <div class="modal-footer">
                <button id="accept_toc" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">@lang('Tôi đã đọc và Đồng ý')</button>
            </div>
        </div>
    </div>
</div>
@section('jscript')
<script>
$('#toc-action').click(function(){
    var url = $(this).data("url"); 
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        success: function(res) {
            if (!res.success) {
                return;
            }
            $('#tocModal').find('.modal-body').html(res.data);
            $('#tocModal').modal('show');
            
        },
        error:function(request, status, error) {
            console.log("ajax call went wrong:" + request.responseText);
        }
    });
});
$('#accept_toc').click(function(){
    $('#tocModal').modal('hide');
    $("#toc").prop("checked", true);
});

$('input[type=radio][name=role]').change(function() {
    if (this.value == 'school') {
        $("#label_name").text("Tên trung tâm *");
    }
    else {
        $("#label_name").text("Họ và Tên *");
    }
});
</script>
@endsection
