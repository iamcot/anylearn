<div class="mb-3 mb-lg-0 card">
    <div class="bg-light card-header">Quản lý Nội Dung Mail</div>
    <div class="card-body">
        <input type="hidden" name="tab" value="templatemail">
        <textarea rows="13" placeholder="Nội dung mail" name="mailcontent" id="mailcontent" class="editor form-control">{{!empty($course['info']->mailcontent) ? $course['info']->mailcontent : null}}</textarea>

    </div>
    <div class="card-footer">
        <button class="btn btn-success" name="action" value="mailsave">Lưu</button>
    </div>
</div>