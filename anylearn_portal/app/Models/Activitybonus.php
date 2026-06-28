<?php

namespace App\Models;

use App\Constants\ActivitybonusConstants;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class Activitybonus extends Model
{
    protected $fillable = [
        'key', 'value', 'type'
    ];
    public function get($key)
    {
        $dbConfig = $this->where('key', $key)->first();
        if ($dbConfig) {
            return $dbConfig->value;
        }
        $fileConfig = config('activitybonus.' . $key);
        if ($fileConfig) {
            return $fileConfig['value'];
        }
        return null;
    }
    public function createOrUpdate($key, $value, $type)
    {
        if ($value == "") {
            return;
        }
        $find = $this->where('key', $key)->first();
        if (!$find) {
            $rs = $this->create([
                'key' => $key,
                'value' => $value,
                'type' => $type
            ]);

            return $rs != null;
        }
        return $this->where('key', $key)->update(
            ['value' => $value]
        );
    }
    public function getConfigs()
    {
        $data = config('activitybonus');
        $dbConfig = $this->where('type', ActivitybonusConstants::TYPE_CONFIG)->get();

        if (empty($dbConfig)) {
            return $data;
        }
        foreach ($dbConfig as $config) {
            if (!isset($data[$config->key])) {
                continue;
            }
            $data[$config->key]['value'] = $config->value;
        }
        return $data;
    }
}
