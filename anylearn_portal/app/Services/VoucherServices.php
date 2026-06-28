<?php

namespace App\Services;

use App\Constants\ConfigConstants;
use App\Models\VoucherEvent;
use App\Models\VoucherGroup;

class VoucherServices
{
    private function getFixedVouchers($events)
    {
        $vouchers = [];
        foreach($events as $event) {
            $groups = VoucherGroup::whereIn('id', explode(',', $event->targets))
                ->where('generate_type', 'manual')
                ->pluck('prefix')
                ->toArray();

            if ($groups)  {
                $voucher = new \stdClass();      
                $voucher->id = $event->id;
                $voucher->title = $event->title;
                $voucher->code = $groups[0]; 
                $vouchers[] = $voucher; 
            }

            if (count($vouchers) == ConfigConstants::CONFIG_NUM_VOUCHER_DISPLAY) {
                break;
            }
        }

        return $vouchers;
    }

    public function getVoucherEvents()
    {
        $events = VoucherEvent::select('id', 'title', 'targets')
            ->where('type', 'class')
            ->orderByDesc('id')
            ->get();

        return $this->getFixedVouchers($events);
    }

    public function getVoucherEventsBySubtype($subtype)
    {
        // Add voucher_events.type = promote, trigger = subtype.id
        $subtypes = array_flip(config('subtype_list'));
        $events   =  VoucherEvent::select('id', 'title', 'trigger', 'targets')
            ->where('type', 'promote' )
            ->where('trigger', $subtypes[$subtype])
            ->orderByDesc('id')
            ->get();

        return $this->getFixedVouchers($events);
    }

    public function getVoucherByPartner($id) 
    {
        // Add voucher_events.type = partner, trigger = partner.id
        $events = VoucherEvent::select('id', 'title', 'targets')
            ->where('type', 'partner')
            ->where('trigger', $id)
            ->orderByDesc('id')
            ->get();
        
        $vouchers = $this->getFixedVouchers($events);

        return $vouchers ? $vouchers[0] : null;
    }
}
