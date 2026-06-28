<?php

namespace Tests\Unit;

use App\Services\VideoServices;
use Tests\TestCase;

class VideoServiceTest extends TestCase
{

    public function testYoutubeGetId()
    {
        $videoServ = new VideoServices();
        $url = "https://www.youtube.com/watch?v=2FydDzKecpI";
        $id = $videoServ->getlinkYT($url);
        $this->assertEquals("2FydDzKecpI", $id);
    }

    public function testYoutubeGetId2()
    {
        $videoServ = new VideoServices();
        $url = "https://youtu.be/2FydDzKecpI";
        $id = $videoServ->getlinkYT($url);
        $this->assertEquals("2FydDzKecpI", $id);
    }

    public function testYoutubeGetId3()
    {
        $videoServ = new VideoServices();
        $url = "https://www.youtube.com/embed/2FydDzKecpI";
        $id = $videoServ->getlinkYT($url);
        $this->assertEquals("2FydDzKecpI", $id);
    }
}
