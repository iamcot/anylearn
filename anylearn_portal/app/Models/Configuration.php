<?php

namespace App\Models;

use App\Constants\ConfigConstants;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class Configuration extends Model
{
    protected $fillable = [
        'key', 'value', 'type'
    ];

    public function createOrUpdate($key, $value, $type, $force = false)
    {
        if ($value == "" && !$force) {
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

    public function getSiteConfigs()
    {
        $data = config('site');
        $dbConfig = $this->where('type', ConfigConstants::TYPE_CONFIG)->get();

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

    public function getToc()
    {
        return $this->get(ConfigConstants::GUIDE_TOC);
    }

    public function getDoc($key)
    {
        return $this->where('key', $key)->first();
    }

    public function get($key)
    {
        $dbConfig = $this->where('key', $key)->first();
        if ($dbConfig) {
            return $dbConfig->value;
        }
        $fileConfig = config('site.' . $key);
        if ($fileConfig) {
            return $fileConfig['value'];
        }
        return null;
    }

    public function gets(array $keys)
    {
        $data = [];
        $fileConfig = config('site');
        foreach ($keys as $key) {
            $data[$key] = $fileConfig[$key]['value'];
        }
        $dbConfig = $this->whereIn('key', $keys)->get();

        if ($dbConfig) {
            foreach ($dbConfig as $config) {
                $data[$config->key] = $config->value;
            }
        }

        return $data;
    }

    public function getAnotherConfigs(array $keys, $default = null)
    {
        $data = [];
        $fileConfig = $default ?? [];
        foreach ($keys as $key) {
            $data[$key] = $fileConfig[$key];
        }
        $dbConfig = $this->whereIn('key', $keys)->get();

        if ($dbConfig) {
            foreach ($dbConfig as $config) {
                $data[$config->key]['value'] = $config->value;
            }
        }

        return $data;
    }

    public function enableIOSTrans(Request $request)
    {
        $appVer = $request->get('v');
        $platform = $request->get('p', '');
        if ($platform != 'ios') {
            return 1;
        }

        $configVer = env('APP_VERSION_REVIEW', 'NOT_DEFINED');
        return $appVer != $configVer ? 1 : 0;
    }
}
