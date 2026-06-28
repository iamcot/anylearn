<?php

namespace App\Models;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\UserConstants;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Transaction extends Model
{
    protected $fillable = [
        'user_id', 'type', 'amount', 'pay_method', 'pay_info', 'order_id', 'content', 'status',
        'ref_user_id', 'ref_amount','created_at','updated_at','ref_id'
    ];

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'user_id', 'id');
    }
    public function refUser()
    {
        return $this->belongsTo('App\Models\User', 'ref_user_id', 'id');
    }
    public function order()
    {
        return $this->belongsTo('App\Models\Order', 'order_id', 'id');
    }
    public function search(Request $request, $file = false)
    {
        $data = DB::table('transactions')->whereIn('type', [
            ConfigConstants::TRANSACTION_FIN_OFFICE,
            ConfigConstants::TRANSACTION_FIN_SALE,
            ConfigConstants::TRANSACTION_FIN_MARKETING,
            ConfigConstants::TRANSACTION_FIN_OTHERS,
            ConfigConstants::TRANSACTION_FIN_SALARY,
            ConfigConstants::TRANSACTION_FIN_ASSETS,
        ])

            ->join('users','users.id','=','transactions.ref_user_id')
            ->orderby('transactions.id', 'desc');



            // ->paginate(20);
            if ($request->input('id_f') > 0) {
                if ($request->input('id_t') > 0) {
                    $data = $data->where('transactions.id', '>=', $request->input('id_f'))->where('transactions.id', '<=', $request->input('id_t'));
                } else {
                    $data = $data->where('transactions.id', $request->input('id_f'));
                }
            }
            if ($request->input('content')) {
                $data = $data->where('transactions.content', 'like', '%' . $request->input('content') . '%');
            }
            if ($request->input('type')) {
                $data = $data->where('transactions.type', $request->input('type'));
            }
            if ($request->input('date')) {
                $data = $data->whereDate('transactions.created_at', '>=', $request->input('date'));
            }
            if ($request->input('datet')) {
                $data = $data->whereDate('transactions.created_at', '<=', $request->input('datet'));
            }
            if (!$file) {
                 $data = $data->select(['transactions.id','transactions.ref_user_id','transactions.user_id','users.name','users.phone',
                 'transactions.type','transactions.amount','transactions.pay_method','transactions.pay_info',
                 'transactions.content','transactions.created_at','transactions.updated_at']);
            } else {
               $data = $data->select(['transactions.id','transactions.ref_user_id','transactions.user_id','users.name AS Họ Tên','users.phone AS SĐT',
               'transactions.type AS Loại','transactions.amount AS Số tiền','transactions.pay_method AS Hình Thức Thanh Toán','transactions.pay_info AS Thông Tin Thanh Toán',
               'transactions.content AS Nội Dung','transactions.created_at AS Ngày Tạo','transactions.updated_at AS Ngày Cập Nhật'])->get();
                if ($data) {
                    $data = json_decode(json_encode($data->toArray()), true);
                } else {
                    $data = [];
                }
            }
            return $data;
    }
    public function pendingWalletM($userId)
    {
        return Transaction::where('user_id', $userId)
            ->where('type', ConfigConstants::TRANSACTION_DEPOSIT)
            ->where('status', ConfigConstants::TRANSACTION_STATUS_PENDING)
            ->sum('amount');
    }

    public function pendingWalletC($userId)
    {
        return Transaction::where('user_id', $userId)
            ->where('type', ConfigConstants::TRANSACTION_WITHDRAW)
            ->where('status', ConfigConstants::TRANSACTION_STATUS_PENDING)
            ->sum('amount');
    }

    public function history($userId, $wallet)
    {
        $query = Transaction::where('user_id', $userId);
        if ($wallet == UserConstants::WALLET_M) {
            $query = $query->whereIn('type', [ConfigConstants::TRANSACTION_ORDER, ConfigConstants::TRANSACTION_EXCHANGE, ConfigConstants::TRANSACTION_DEPOSIT, ConfigConstants::TRANSACTION_DEPOSIT_REFUND]);
        } else {
            $query = $query->whereIn('type', [ConfigConstants::TRANSACTION_EXCHANGE, ConfigConstants::TRANSACTION_COMMISSION, ConfigConstants::TRANSACTION_COMMISSION_ADD, ActivitybonusConstants::Activitybonus_Bonus]);
        }
        $db = $query->orderby('id', 'desc')
            ->take(40)->get();
        $data = [];
        foreach($db as $k => $v) {
            $data[$k] = $v;
            $data[$k]->pay_info = "";//$v->pay_info ?? "";
            $data[$k]->order_id = $data[$k]->order_id ?? 0;
        }
        return $data;
    }
}
