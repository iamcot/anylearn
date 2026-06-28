@extends('layout')
@php
    $contractDate = !empty($contract->created_at) ? \Carbon\Carbon::parse($contract->created_at)->format('d/m/Y') : '';

    $data = !empty($data) ? str_replace([
        '{name}',
        '{phone}',
        '{id}',
        '{user_id}',
        '{status}',
        '{type}',
        '{cert_id}',
        '{cert_date}',
        '{cert_place}',
        '{email}',
        '{dob}',
        '{dob_place}',
        '{tax}',
        '{ref}',
        '{ref_title}',
        '{address}',
        '{commission}',
        '{bank_name}',
        '{bank_branch}',
        '{bank_no}',
        '{bank_account}',
        '{signed}',
        '{created_at}',
        '{updated_at}',
        '{title}'
    ], [
        $contract->name,
        $contract->phone,
        $contract->id,
        $contract->user_id,
        $contract->status,
        $contract->type,
        $contract->cert_id,
        $contract->cert_date,
        $contract->cert_place,
        $contract->email,
        $contract->dob,
        $contract->dob_place,
        $contract->tax,
        $contract->ref,
        $contract->ref_title,
        $contract->address,
        (1-$contract->commission)*100 . '%',
        $contract->bank_name,
        $contract->bank_branch,
        $contract->bank_no,
        $contract->bank_account,
        $contract->signed,
        $contract->created_at,
        $contract->updated_at,
        $contract->title
    ], $data) : '';
@endphp
@section('body')
<p>
    @lang('Các thông tin trên hợp đồng này có thể sữa trực tiếp và tải xuống tuy nhiên nó sẽ không được lưu trữ để không ảnh hưởng tới mẫu hợp đồng')
</p>
    <form method="POST" action="{{ route('config.guide', ['type' => $guideType]) }}">
        @csrf
        <div class="card shadow">
            <div class="card-body p-0">
                <div class="document-editor__toolbar"></div>
                <textarea id="editor" name="data">{{ $data }}</textarea>
            </div>
            <div class="card-footer">
                <button type="button" id="download" class="btn btn-sm btn-primary float-right p-2"><i class="fas fa-download"></i> Tải xuống PDF</button>
                <button type="button" onclick="exportHTML();" class="btn btn-sm btn-primary float-right p-2 mr-2"><i class="fas fa-download"></i> Tải xuống Word</button>
            </div>
        </div>
    </form>
@endsection
@section('jscript')
    <script src="/cdn/vendor/ckeditor/ckeditor.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js"></script>
    <script>
        CKEDITOR.replace('editor');

        document.getElementById('download').addEventListener('click', function() {
            var editorData = CKEDITOR.instances.editor.getData();
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = editorData;
            // Sử dụng thư viện html2pdf để chuyển đổi HTML sang PDF
            html2pdf().from(tempDiv).set({
            margin: [2, 2, 2, 2], // Đặt căn lề trái, trên, phải, dưới (cm)
            filename: 'document.pdf', // Tên tệp PDF
            image: { type: 'jpeg', quality: 0.98 }, // Định dạng hình ảnh
            html2canvas: { scale: 2 }, // Tỷ lệ hiển thị trên canvas
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' } // Định dạng tệp PDF
        }).save();
        });
function exportHTML(){
       var header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
       var footer = "</body></html>";
       var editorData = CKEDITOR.instances.editor.getData();
var sourceHTML = header + editorData + footer;

       var source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
       var fileDownload = document.createElement("a");
       document.body.appendChild(fileDownload);
       fileDownload.href = source;
       fileDownload.download = 'document.doc';
       fileDownload.click();
       document.body.removeChild(fileDownload);
    }
    </script>
@endsection
