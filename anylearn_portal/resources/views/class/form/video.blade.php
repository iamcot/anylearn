@inject('videoServ', 'App\Services\VideoServices')
@inject('itemServ', 'App\Services\ItemServices')
<div class="p-3">
    @if (!empty($videos) && count($videos) > 0)
        @foreach ($videos as $chapter)
        <div class="mb-3 card">
            <h5 class="card-header">
                <div class="g-0 justify-content-between row">
                    <div class="col-sm-auto">
                        <h5 class="text-success mb-0 font-weight-bold">Chương {{ $chapter['chapter']->chapter_no }}: {{ $chapter['chapter']->title }}

                        </h5>
                    </div>
                    <div class=" mb-md-0 col-md-auto">
                        <div class="g-3 gy-md-0 h-100 align-items-center row">
                            @if(count($chapter['lessons']) == 0)
                            <a class="text-danger" href="?action=dchap&cid={{ $chapter['chapter']->id }}"><i class="fa fa-trash"></i></a>
                            @else
                            <small class="text-xs">Chương không có bài học mới có thể xóa</small>
                            @endif

                        </div>
                    </div>
                </div>
            </h5>
            <div class="p-0 card-body">
                <div class="table-responsive scrollbar">
                    <table role="table" class="fs--1 mb-0 overflow-hidden table table-sm table-striped">
                        <tbody>
                            @foreach ($chapter['lessons'] as $les)
                            <tr class="align-middle white-space-nowrap" role="row">
                                <td role="cell" class="p-2">
                                    <div><strong>Bài {{ $les->lesson_no }}: {{ $les->title }}</strong></div>
                                    <div class="fs-11">Loại bài học: <strong>{{ $les->type }}</strong> ({{ $les->type_value }}). <a target="_blank" href="{{ $itemServ->classVideoUrl($courseId, $les->id) }}"><i class="fa fa-play"></i> Xem</a></div>
                                    <p class="fs--1 text-900 mb-0">
                                        {!! $les->description !!}
                                    </p>
                                </td>
                                <td class="text-right">
                                    <a class="text-danger" href="?action=dlesson&lid={{ $les->id }}"><i class="fa fa-trash"></i></a>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                    <p class="p-2 border-top"><a href="#" onclick="addid({{ $chapter['chapter']->id }})" class="" data-bs-toggle="modal" data-bs-target="#exampleModal2">
                            <i class="fa fa-plus"></i> Thêm bài mới</a></p>
                </div>
            </div>
        </div>
        @endforeach
    @endif
    @if (empty($videos) || count($videos) == 0)
    <div class="mb-1 card">
        <div class="text-center py-2 card-footer">
            <a href="#" class="btn btn-link btn-sm" data-bs-toggle="modal" data-bs-target="#exampleModal">
                <i class="fa fa-plus"></i> Hãy bắt đầu bằng Thêm Chương Mới
            </a>
        </div>
    </div>
    @else
    <div class="text-center py-2 card-footer">
        <a href="#" class="btn btn-link btn-sm" data-bs-toggle="modal" data-bs-target="#exampleModal">
            <i class="fa fa-plus"></i> Thêm Chương Mới
        </a>
    </div>
    @endif

    <!-- Modal -->
    <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <form action="" method="post" id="courseEditForm" enctype="multipart/form-data">
                @csrf
                <input type="hidden" name="id" value="{{ !empty($courseId) ? $courseId : 0 }}">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title h4">
                            <h5 class="text-primary fw-bold mb-0">Thêm chương mới</h5>
                        </div>
                        <button type="button" class="close btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div>
                            <div class="mb-3 form-group">
                                <label for="floatingInput">Chương số</label>
                                <input type="number" id="floatingInput" name="chapterno" class="form-control" min=0>
                            </div>
                            <div class="mb-3 form-group">
                                <label for="floatingInput2">Tiêu đề</label>
                                <input type="text" id="floatingInput2" name="chaptitle" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="floatingTextarea2">Giới Thiệu ngắn</label>
                                <textarea id="floatingTextarea2" name="chapdes" class="form-control" style="height: 100px;"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="mb-1 btn btn-success" name="action" value="createChapter">Thêm
                            mới</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal 2-->
<div class="modal fade" id="exampleModal2" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form action="" method="post" id="courseEditForm" enctype="multipart/form-data">
            @csrf
            <input type="hidden" name="id" value="{{ !empty($courseId) ? $courseId : 0 }}">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title h4">
                        <h5 class="text-primary fw-bold mb-0">Thêm bài mới</h5>
                    </div>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">x</button>
                </div>
                <div class="modal-body">
                    <div>
                        <input type="hidden" class="form-control" id="idchaplklesson" name="idchaplklesson">
                        <div class="mb-3 form-group">
                            <div>
                                <select aria-label="Default select example" class="form-select form-control" name="typelesson" id="select" onchange="getval(this)">
                                    <option><label for="floatingInput">Loại bài học</label></option>
                                    {{-- <option value="file">File</option> --}}
                                    <option value="youtube">Youtube</option>
                                    {{-- <option value="stream">Stream Video</option> --}}
                                </select>
                            </div>
                        </div>
                        <div class="mb-3 form-group d-none" id="ytb">
                            <label for="floatingInput">Youtube link</label>
                            <input type="text" class="form-control" min=0 name="youtube">
                        </div>
                        <div class="mb-3 form-group d-none" id="file">
                            <label for="floatingInput">File</label>
                            <input type="file" class="form-control" name="file" min=0>
                        </div>
                        <div class="mb-3 form-group d-none" id="stream">
                            <label for="floatingInput">Stream Link</label>
                            <input type="text" class="form-control" min=0 name="stream">
                        </div>
                        {{-- <div class="mb-3 form-group">
                            <label for="floatingInput2">Đường dẫn bài học</label>
                            <input type="text" class="form-control">
                    </div> --}}
                        <div class="mb-3 form-group">
                            <label for="floatingInput2">Bài học số</label>
                            <input type="number" class="form-control" name="lessonno" required>
                        </div>
                        <div class="mb-3 form-group">
                            <label for="floatingInput2">Tên bài</label>
                            <input type="text" class="form-control" name="lessonname" required>
                        </div>
                        <div class="mb-3 form-group">
                            <label for="floatingInput2">Thời lượng (phút)</label>
                            <input type="text" class="form-control" name="length">
                        </div>
                        <div class="mb-3 form-group">
                            <label for="floatingTextarea2">Giới Thiệu</label>
                            <textarea name="lessondes" class="editor form-control" rows="4"></textarea>
                        </div>
                        <div>
                            <select aria-label="Default select example" class="form-select form-control" name="is_free">
                                <option value="2">Thu Phí</option>
                                <option value="1">Miễn Phí</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" name="action" value="createLesson" class="mb-1 btn btn-success">Thêm
                        mới</button>
                </div>
            </div>
        </form>
    </div>
</div>
<script src="/cdn/anylearn/bootstrap-5.1.1/js/bootstrap.bundle.min.js"></script>
<script src="/cdn/anylearn/jquery-3.6.0.min.js"></script>
<!-- <script src="/cdn/anylearn/owl.carousel.min.js"></script> -->
<script>
    function getval(sel) {
        if (sel.value == "file") {
            document.getElementById("file").classList.remove("d-none");
            document.getElementById("ytb").classList.add("d-none");
            document.getElementById("stream").classList.add("d-none");
        } else if (sel.value == "youtube") {
            document.getElementById("ytb").classList.remove("d-none");
            document.getElementById("stream").classList.add("d-none");
            document.getElementById("file").classList.add("d-none");

        } else if (sel.value == "stream") {
            document.getElementById("stream").classList.remove("d-none");
            document.getElementById("file").classList.add("d-none");
            document.getElementById("ytb").classList.add("d-none");
        } else {
            document.getElementById("file").classList.add("d-none");
            document.getElementById("ytb").classList.add("d-none");
            document.getElementById("stream").classList.add("d-none");
        }
    }

    function addid(id) {
        document.getElementById("idchaplklesson").value = id;
    }
</script>