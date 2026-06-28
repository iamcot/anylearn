<div id="userDocModal" class="modal fade shadow" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-xl ">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">@lang('Các giấy tờ của thành viên')</h5>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            </div>
            <div class="modal-body p-0">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ngày đăng</th>
                            <th>Loại file</th>
                            <th>File</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>

                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button id="allow_doc" class="btn btn-success">@lang('Giấy tờ hợp lệ')</button>
                <button id="clean_doc" class="btn btn-danger">@lang('Giấy tờ không hợp lệ')</button>
            </div>
        </div>
    </div>
</div>
@section('jscript')
<script>
    var userId = 0;
    $('.check_doc').click(function() {
        userId = $(this).data("id");
        $.ajax({
            type: "GET",
            url: "/ajax/doc/" + userId,
            dataType: 'json',
            success: function(res) {
                if (!res.success || res.data.length == 0) {
                    html = "<tr><td class=\"text-center\" colspan=\"5\">Thành viên này chưa có giấy tờ nào.</td></tr>";
                } else {
                    html = renderFiles(res.data);
                }
                $('#userDocModal').find('tbody').html(html);
                $('#userDocModal').modal('show');
            },
            error: function(request, status, error) {
                console.log("ajax call went wrong:" + request.responseText);
            }
        });
    });

    $('#clean_doc').click(function() {
        $.ajax({
            type: "GET",
            url: "/ajax/remove-doc/" + userId,
            dataType: 'json',
            success: function(res) {
                if (!res.success) {
                    alert(res.data);
                } else {
                    $('#userDocModal').modal('hide');
                    location.reload();
                }
            },
            error: function(request, status, error) {
                console.log("ajax call went wrong:" + request.responseText);
            }
        });
    });

    $('#allow_doc').click(function() {
        $.ajax({
            type: "GET",
            url: "/ajax/allow-doc/" + userId,
            dataType: 'json',
            success: function(res) {
                if (!res.success) {
                    alert(res.data);
                } else {
                    $('#userDocModal').modal('hide');
                    location.reload();
                }
            },
            error: function(request, status, error) {
                console.log("ajax call went wrong:" + request.responseText);
            }
        });
    });

    function renderFiles(files) {
        var html = "";
        $.each(files, function(k, file) {
            html += "<tr>" +
                "<td>#" + (parseInt(k) + 1) + "</td>" +
                "<td>" + file.created_at + "</td>" +
                "<td>" + file.file_ext + "</td>" +
                "<td><a href=\"" + file.data + "\" target=\"_blank\"> " + file.data + "</a></td>" +
                "<td></td>" +
                "</tr>";
        });
        return html;
    }
</script>
@endsection