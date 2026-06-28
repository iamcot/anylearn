<?php

namespace App\Models;

use App\Constants\FileConstants;
use App\Services\FileServices;
use Illuminate\Database\Eloquent\Model;

class ItemResource extends Model
{
    protected $fillable = [
        'item_id', 'type', 'title', 'desc', 'data', 
    ];

    public function deleteRes($id)
    {
        $res = $this->find($id);
        if (!$res) {
            return true;
        }
        $fileService = new FileServices();
        $fileService->deleteFiles([$res->data], FileConstants::DISK_S3);
        return $res->delete();
    }
}
