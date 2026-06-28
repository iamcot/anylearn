@inject('videoServ', 'App\Services\VideoServices')
<div class="">
    @foreach ($videos as $chapter)
    @if (count($chapter['lessons']) > 0)
    <div class="">
        <h5 class="card-header">
            <div class="g-0 justify-content-between">
                <div class="col-sm-auto">
                    <h6 class="text-success fs--1 mb-0 fw-bold p-2">Chương {{ $chapter['chapter']->chapter_no }}: {{ $chapter['chapter']->title }}</h6>
                </div>
            </div>
        </h5>
        <div class="d-flex align-items-center px-card border-200">
            <table class="fs--1 text-end mb-0 table">
                <tbody>
                    @foreach ($chapter['lessons'] as $les)
                    <tr class="btn-reveal-trigger bg-light">
                        <td class="align-middle white-space-nowrap text-start p-2">
                            <div class="d-flex align-items-center row">
                                <div class="col-md-1">
                                    <h6 class="text-black text-center fs--1 mb-0">Bài {{ $les->lesson_no }}</h6>
                                </div>
                                <div class="col-md-9">
                                    <strong>{{ $les->title }}</strong>
                                </div>
                                <div class="col-md-2">
                                    @if (auth()->check())
                                    @if (!$videoServ->checkOrder($item->id))
                                    @if ($les->is_free == 1)
                                    <a href="{{ $itemServ->classVideoUrl($les->item_id, $les->id) }}" class="float-end btn btn-outline-danger btn-sm">FREE</a>
                                    @else
                                    <form action="{{ route('add2cart') }}" method="get" id="pdpAdd2Cart">
                                        <input type="hidden" name="class" value="{{ $item->id }}">
                                        <button name="action" value="add2cart" class="float-end btn btn-outline-success btn-sm"><i class="fa fa-cart-plus"></i></button>
                                    </form>
                                    @endif
                                    @else
                                    <a href="{{ $itemServ->classVideoUrl($les->item_id, $les->id) }}" class="float-end btn btn-outline-success btn-sm"><i class="fa fa-play"></i></a>
                                    @endif
                                    @elseif($les->is_free == 1)
                                    <a href="{{ $itemServ->classVideoUrl($les->item_id, $les->id) }}" class="float-end btn btn-outline-danger btn-sm">FREE</a>
                                    @endif
                                </div>
                            </div>

                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    @endif
    @endforeach
</div>