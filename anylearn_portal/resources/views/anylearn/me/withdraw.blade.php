@inject('transServ','App\Services\TransactionService')

@extends('anylearn.me.layout')

@section('spmb')
    withdraw
@endsection
@section('body')
    <div class="row crm mb-5">
        <div class="col-lg-6">
            <div class="card shadow">
                <div class="card-body">
                    <div class="row">
                        <div class="col-sm-2">
                            <div class="imagebox border">
                                @if ($user->image)
                                    <img src="{{ $user->image }}" class="rounded" alt="{{ $user->name }}">
                                @else
                                    <i class="fa fa-user fa-2x"></i>
                                @endif
                            </div>
                        </div>
                        <div class="col-sm-9">
                            <h3><span class="text-dark">{{ $user->name }}</span>
                            </h3>
                            <div>Thành viên từ:
                                {{ $user->is_registered == 0 ? 'Chưa đăng ký' : date('d/m/Y', strtotime($user->created_at)) }}
                            </div>
                            <div>Số anyPoint Hiện Có: <strong
                                    class="text-danger">{{ number_format($user->wallet_c, 0, ',', '.') }} (Tương đương {{ number_format($user->wallet_c * 1000, 0, ',', '.') }} VND)</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card shadow mt-3">
                <div class="card-header"><strong>Lịch Sử Giao Dịch</strong></div>
                <div class="card-body">
                    <table class="table table-striped text-secondary">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ngày</th>
                                <th width=40%>Nội Dung</th>
                                <th>Số Tiền</th>
                                <th>Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($history as $row)
                            <tr>
                                <td>{{ $row->id }}</td>
                                <td>{{ date("H:i d/m/y", strtotime($row->created_at)) }}</td>
                                <td>{{ $row->content }}</td>
                                <td>{{ number_format($row->amount) }}</td>
                                <td>
                                <span class="badge badge-{{ $transServ->statusColor($row->status) }}">{{ $transServ->statusText($row->status) }}</span>
                                </td>

                            </tr>
                            @endforeach
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card shadow">
                <div class="card-body">
                    <div class="container">
                        <h1 class="my-4" id="titleform">Rút tiền</h1>
                        <form autocomplete="off" >
                            @csrf
                            <div class="form-group">
                                <label for="inputCurrentBalance">Số điểm được rút</label>
                                <input type="text" class="form-control" min="0" max="{{ $totalAmount }}"
                                    value="{{ isset($totalAmount) ? $totalAmount : null}}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="inputCurrentBalance">Ngân Hàng:</label>
                                <input type="text" class="form-control"
                                    value="{{ isset($contract->bank_name) ? $contract->bank_name : null}}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="inputCurrentBalance">Chi Nhánh:</label>
                                <input type="text" class="form-control"
                                    value="{{ isset($contract->bank_branch) ? $contract->bank_branch: null}}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="inputCurrentBalance">Người Hưởng Thụ:</label>
                                <input type="text" class="form-control"
                                    value="{{ isset($contract->bank_account) ? $contract->bank_account: null}}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="inputReceiverAccount">Tài khoản nhận tiền:</label>
                                <input type="text" class="form-control" id="inputReceiverAccount"
                                    placeholder="{{ isset($contract->bank_no) ? $contract->bank_no: null }}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="total-amount-input">Số tiền muốn rút:</label>
                                <input autocomplete="off" type="number" class="form-control" name="withdraw" id="total-amount-input"
                                    placeholder="Nhập số tiền muốn rút" required>
                                    <span id="total-amount-error" style="color: red;"></span>
                            </div>
                            <div class="form-group">
                                <label for="inputPassword">Mật khẩu:</label>
                                <input autocomplete="new-password" type="password" name="password" class="form-control" id="inputPassword" placeholder="Nhập mật khẩu">
                            </div>
                            <button type="submit" class="btn btn-primary float-right" name="action" value="withdraw">Xác nhận rút tiền</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('jscript')
@parent
<script>
    const totalAmountInput = document.getElementById('total-amount-input');
    const totalAmountError = document.getElementById('total-amount-error');
    const totalAmount = Number('{{ $totalAmount }}');

    totalAmountInput.min = 0;
    totalAmountInput.max = totalAmount;

    document.addEventListener('submit', (event) => {
      const inputValue = Number(totalAmountInput.value);

      if (inputValue < 0 || inputValue > totalAmount) {
        event.preventDefault();
        totalAmountError.innerText = `The input value must be between 0 and ${totalAmount}`;
      } else {
        totalAmountError.innerText = '';
      }
    });
  </script>
@endsection
