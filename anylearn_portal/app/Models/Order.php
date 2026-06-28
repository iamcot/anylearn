<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Constants\ConfigConstants;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'quantity', 'amount', 'status', 'delivery_name', 'delivery_address', 'delivery_phone',
        'payment', 'sale_id', 'created_at'
    ];
    public function searchOrders(Request $request, $file = false)
    {
        $orders = DB::table('orders')
        ->join('users', 'users.id', '=', 'orders.user_id');

        if ($request->input('id_f') > 0) {
            if ($request->input('id_t') > 0) {
                $orders = $orders->where('orders.id', '>=', $request->input('id_f'))->where('orders.id', '<=', $request->input('id_t'));
            } else {
                $orders = $orders->where('orders.id', $request->input('id_f'));
            }
        }
        if ($request->input('name')) {
            $orders = $orders->where('users.name', 'like', '%' . $request->input('name') . '%');
        }

        if ($request->input('phone')) {
            $orders = $orders->where('users.phone', $request->input('phone'));
        }

        if ($request->input('status')) {
            $orders = $orders->where('orders.status', $request->input('status'));
        } else {
            $orders = $orders->where('orders.status', '!=', 'new');
        }
        if ($request->input('payment')) {
            $orders = $orders->where('orders.payment', $request->input('payment'));
        }
        if ($request->input('date')) {
            $orders = $orders->whereDate('orders.created_at', '>=', $request->input('date'));
        }

        if ($request->input('datet')) {
            $orders = $orders->whereDate('orders.created_at', '<=', $request->input('datet'));
        }
        $orders = $orders->leftJoin('vouchers_used', 'vouchers_used.order_id', '=', 'orders.id')
        ->leftJoin('vouchers', 'vouchers_used.voucher_id', '=', 'vouchers.id')
        ->leftJoin('transactions', function ($query) {
            $query->on('transactions.order_id', '=', 'orders.id')
                ->where('transactions.type', '=', ConfigConstants::TRANSACTION_EXCHANGE);
        })
        ->select(
            'orders.*',
            'users.name',
            'users.phone',
            'vouchers.voucher',
            'vouchers.value AS voucher_value',
            'transactions.amount AS anypoint',
            DB::raw("(SELECT GROUP_CONCAT(items.title SEPARATOR ',' ) as classes FROM order_details AS os JOIN items ON items.id = os.item_id WHERE os.order_id = orders.id) as classes")
        )->orderby('orders.id', 'desc');

        if (!$file) {
            $orders = $orders->paginate();
        } else {
            $orders = $orders->get();
            if ($orders) {
                $orders = json_decode(json_encode($orders->toArray()), true);
            } else {
                $orders = [];
            }
        }

        return $orders;
    }
}
