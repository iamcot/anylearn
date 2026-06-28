<?php

namespace Tests\Unit;

use App\Services\QRServices;
use Tests\TestCase;

class QRServiceTest extends TestCase
{

    public function testCRC1()
    {
        $qrService = new QRServices();
        $str = "00020101021238600010A00000072701300006970403011697040311012345670208QRIBFTTC530370454061800005802VN62340107NPS68690819thanh toan don hang6304";
        $res = $qrService->calCRC($str);
        $this->assertEquals("A203", $res);
    }

    public function testCRC2()
    {
        $qrService = new QRServices();
        $str = "00020101021238500010A0000007270120000697041601065454460208QRIBFTTA530370454061800005802VN62270823thanh toan don hang6304";
        $res = $qrService->calCRC($str);
        $this->assertEquals("4302", $res);
    }

    public function testCRC3()
    {
        $qrService = new QRServices();
        $str = "00020101021238570010A00000072701270006970403011300110123456780208QRIBFTTA530370454061800005802VN62340107NPS68690819thanh toan don hang6304";
        $res = $qrService->calCRC($str);
        $this->assertEquals("2E2E", $res);
    }

    public function testCRC4()
    {
        $qrService = new QRServices();
        $str = "00020101021238500010A0000007270120000697041601065454460208QRIBFTTA53037045405801005802VN62250821Thanh toan anyLEARN 86304";
        $res = $qrService->calCRC($str);
        $this->assertEquals("FA27", $res);
    }


    public function testQR1()
    {
        $qrService = new QRServices();
        $money = 80100;
        $content = 8;
        $res = $qrService->QR($money, $content);
        $this->assertEquals("00020101021238500010A0000007270120000697041601065454460208QRIBFTTA53037045405801005802VN62250821Thanh toan anyLEARN 86304FA27", $res);
    }
}
