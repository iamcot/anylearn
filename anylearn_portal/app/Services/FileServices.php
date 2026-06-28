<?php

namespace App\Services;

use App\Constants\FileConstants;
use App\Models\ItemUserAction;
use DOMDocument;
use Exception;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Image;

class FileServices
{
    public static $allowFileExts = ['jpg', 'jpeg', 'png', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'];

    private $systemFiles = [
        '.gitignore',
    ];

    const MAX_IMAGE_W = 1980;

    public function doUploadFile($request, $field = 'file', $disk = 's3', $changeName = true, $childPath = 'files')
    {
        $rs = false;
        try {
            if ($request->hasFile($field) && $request->file($field)->isValid()) {
                $extension = $request->file($field)->extension();
                if ($changeName) {
                    if (!in_array($extension, self::$allowFileExts)) {
                        Log::debug("$extension is not allowed");
                        return false;
                    }
                    $file =  $this->randomFileName() . '.' . $extension;
                } else {
                    $file = $request->file($field)->getClientOriginalName();
                }

                $path = Storage::disk($disk)->putFileAs($childPath, $request->file($field), $file);
                if ($path) {
                    $rs = [
                        'file' => $file,
                        'path' => $path,
                        'url' => Storage::disk($disk)->url($childPath . '/' . $file),
                        'file_ext' => $extension,
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::error($e);
        }
        return $rs;
    }
    public function randomFileName()
    {
        return Str::random(10) . time();
    }

    public function getPathOfS3Url($url)
    {
        $baseUrl = env('AWS_URL', 'https://s3-ap-southeast-1.amazonaws.com/anylearn.vn/');
        $path = str_replace($baseUrl, "", $url);
        return $path;
    }

    public function deleteUserOldImageOnS3($url)
    {
        $path = $this->getPathOfS3Url($url);
        $this->deleteFiles([$path]);
    }

    public function doUploadImage($request, $field = 'file', $disk = 's3', $changeName = true, $childPath = 'images')
    {
        $rs = false;
        try {
            if ($request->hasFile($field) && $request->file($field)->isValid()) {
                $extension = $request->file($field)->extension();
                
                if ($changeName) {
                    $file =  $this->randomFileName() . '.jpg';
                } else {
                    $file = $request->file($field)->getClientOriginalName();
                }
                $photo = Image::make($request->file($field));

                $width = $photo->width();
                if ($width > self::MAX_IMAGE_W) {
                    $photo->resize(self::MAX_IMAGE_W, null, function ($constraint) {
                        $constraint->aspectRatio();
                    });
                }

                $photo->encode($extension, 70);
                $path = Storage::disk($disk)->put($childPath . "/" . $file, $photo);
                if ($path) {
                    $rs = [
                        'file' => $file,
                        'path' => $path,
                        'file_ext' => $extension,
                        'url' => Storage::disk($disk)->url($childPath . '/' . $file)
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::error($e);
        }
        return $rs;
    }

    public function urlFromPath($disk, $path)
    {
        if ($path) {
            return Storage::disk($disk)->url($path);
        }
        return '';
    }

    public function removeSystemFiles($files)
    {
        foreach ($this->systemFiles as $file) {
            if (($key = array_search($file, $files)) !== false) {
                unset($files[$key]);
            }
        }
        return $files;
    }

    public function getAllFiles($disk, $folder = '')
    {
        try {
            return Storage::disk($disk)->files($folder);
        } catch (\Exception $e) {
            Log::error($e);
        }
        return null;
    }

    public function editorHasNewImage($file)
    {
        $uploadedImages = session(FileConstants::SESSION_EDITOR_IMAGE, []);
        $uploadedImages[] = $file;
        session([FileConstants::SESSION_EDITOR_IMAGE => $uploadedImages]);
    }

    public function getImagesOfData($data)
    {
        session([FileConstants::SESSION_EDITOR_IMAGE => []]);
        if (empty($data)) {
            return;
        }
        $images = [];
        try {
            $htmlDom = new DOMDocument();
            @$htmlDom->loadHTML($this->buildFullHtml($data));
            $imageTags = $htmlDom->getElementsByTagName('img');
            foreach ($imageTags as $imageTag) {
                $imgSrc = $imageTag->getAttribute('src');
                //TODO hardcode S3
                $images[] = 'images/' . basename($imgSrc);
            }
        } catch (\Exception $e) {
            Log::error($e);
        }
        session([FileConstants::SESSION_EDITOR_IMAGE => $images]);
    }

    public function cleanNotUsedImages($data)
    {
        $uploadedImages = session(FileConstants::SESSION_EDITOR_IMAGE, []);
        if (empty($uploadedImages)) {
            return true;
        }
        try {
            $htmlDom = new DOMDocument();
            @$htmlDom->loadHTML($this->buildFullHtml($data));

            $imageTags = $htmlDom->getElementsByTagName('img');
            foreach ($imageTags as $imageTag) {
                $imgSrc = $imageTag->getAttribute('src');
                //TODO hardcode to images folder
                $imgFile = 'images/' . basename($imgSrc);
                // Log::debug("imgfile: " . $imgFile);

                if (($key = array_search($imgFile, $uploadedImages)) !== false) {
                    unset($uploadedImages[$key]);
                }
            }
            $this->deleteFiles($uploadedImages);
            $this->cleanLastEditorImage();
        } catch (\Exception $e) {
            Log::error($e);
        }
        return false;
    }

    public function cleanLastEditorImage()
    {
        session([FileConstants::SESSION_EDITOR_IMAGE => []]);
    }

    public function encodeFileName($file)
    {
        $file = str_replace('.', '=', $file);
        return str_replace('/', '+', $file);
    }

    public function decodeFileName($file)
    {
        $file = str_replace("=", ".", $file);
        return str_replace('+', '/', $file);
    }

    public function deleteFiles($files, $disk = 's3')
    {
        foreach ($files as $file) {
            // Log::debug("uploadedImages: " . $file);
            try {
                if (Storage::disk($disk)->exists($file)) {
                    Storage::disk($disk)->delete($file);
                }
            } catch (\Exception $e) {
                Log::error($e);
            }
        }
    }

    public function fileIcon($fileExt)
    {
        $icon = '';
        switch ($fileExt) {
            case 'cert':
                $icon = '<i class="fas fa-certificate"></i>';
                break;
            case 'docs':
                $icon = '<i class="fas fa-file-file"></i>';
                break;
            case 'jpg':
            case 'png':
                $icon = '<i class="fas fa-file-image"></i>';
                break;
            case 'ppt':
            case 'pptx':
                $icon = '<i class="fas fa-file-powerpoint"></i>';
                break;
            case 'doc':
            case 'docx':
                $icon = '<i class="fas fa-file-word"></i>';
                break;
            case 'xls':
            case 'xlsx':
                $icon = '<i class="fas fa-file-excel"></i>';
                break;
            case 'pdf':
                $icon = '<i class="fas fa-file-pdf"></i>';
                break;
            default:
                $icon = '<i class="fas fa-file"></i>';
                break;
        }
        return $icon;
    }

    private function buildFullHtml($data)
    {
        return '<!DOCTYPE html><html><body>' . $data  . '</body></html>';
    }

    public function generateCert($cert, $user, $item, $disk = 's3')
    {
        if (!Storage::disk($disk)->exists($cert->data)) {
            throw new Exception("Cert mẫu không tồn tại, vui lòng up lại.");
        }
        $ext = pathinfo($cert->data, PATHINFO_EXTENSION);
        $tempFile = now() . '.' . $ext;
        $fontPath = public_path('cdn/fonts/arial.ttf');
        $storageFile = Storage::disk($disk)->get($cert->data);
        if ($ext == 'jpg') {
            file_put_contents($tempFile, $storageFile);
            $certImg = imagecreatefromjpeg($tempFile);
        } elseif ($ext == 'png') {
            file_put_contents($tempFile, $storageFile);
            $certImg = imagecreatefrompng($tempFile);
        } else {
            throw new Exception("Cert mẫu có định dạng không hỗ trợ, vui lòng up lại.");
        }
        $imgW = imagesx($certImg);
        $imgH = imagesy($certImg);
        if ($imgW != env('CERT_WIDTH') || $imgH != env('CERT_HEIGHT')) {
            throw new Exception("Cert mẫu phải có kích thước ". env('CERT_WIDTH') ."x". env('CERT_HEIGHT')."px, vui lòng up lại.");
        }
        $centerX = $imgW / 2;
        $textColor = imagecolorallocate($certImg, 0, 160, 80); //green
        $text = $user->name;
        $fontSize = count(explode(" ", $text)) >= 5 ? 80 : 100;

        list($left, $bottom, $right, , , $top) = imageftbbox($fontSize, 0, $fontPath, $text);
        $left_offset = ($right - $left) / 2;
        $x = $centerX - $left_offset;

        imagettftext($certImg, $fontSize, 0, $x, env('CERT_Y'), $textColor, $fontPath, $text);
        imagejpeg($certImg, $tempFile);

        $uploadedFile = Storage::disk($disk)->putFile('cert', new File($tempFile));
        imagedestroy($certImg);
        unlink($tempFile);
        $newCertUrl = $this->urlFromPath('s3', $uploadedFile);
        ItemUserAction::create([
            'item_id' => $item->id,
            'user_id' => $user->id,
            'type' => ItemUserAction::TYPE_CERT,
            'value' => $newCertUrl
        ]);
        return $newCertUrl;
    }
}
