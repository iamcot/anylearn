<?php
if (isset($_POST['submit'])) {
    $file = $_FILES['excel'];
    if (empty($file) || empty($file['tmp_name']) || $file['size'] <= 0) {
        $error = "Không có file!";
    } else {
        $filepath = $file['tmp_name'];
        $provineIndex = -1;
        $districtIndex = -1;
        $wardIndex = -1;
        $data = [];
        $id = 1;
        if (($handle = fopen($filepath, "r")) !== FALSE ) {
            $firstLine = fgets($handle);
            $delimiter = ',';
            if (strpos($firstLine, ';') !== false) {
                $delimiter = ';';
            }
            fseek($handle, 0);
            while(($line = fgetcsv($handle, 1000, $delimiter)) !== FALSE) {
                if ($provineIndex < 0 || $districtIndex < 0 || $wardIndex < 0) {
                    foreach($line as $k => $v) {
                        if ($v == 'Province') {
                            $provineIndex = $k;
                        } else if ($v == 'District') {
                            $districtIndex = $k;
                        } else if ($v == 'Subdistrict') {
                            $wardIndex = $k;
                        }
                    }
                } else {
                    if (!isset($data[$line[$provineIndex]])) {
                        $data[$line[$provineIndex]] = [
                            'id' => $id++,
                            'name' => $line[$provineIndex],
                            'list' => [],
                        ];
                    }
                    if (!isset($data[$line[$provineIndex]]['list'][$line[$districtIndex]])) {
                        $data[$line[$provineIndex]]['list'][$line[$districtIndex]] = [
                            'id' => $id++,
                            'name' => $line[$districtIndex],
                            'list' => [],
                        ];
                    }
                    $data[$line[$provineIndex]]['list'][$line[$districtIndex]]['list'][] = $line[$wardIndex]; 
                }
            }
        }
        $data = array_values($data);
        for($i = 0; $i < count($data); $i++) {
            $data[$i]['list'] = array_values($data[$i]['list']);
        }
        $json = mb_convert_encoding(json_encode($data), 'UTF-8');
        fclose($handle);
        // print_r($json);
        
        // $f = fopen('php://memory', 'w'); 
        // fputs($f, utf8_encode($json));
        // fseek($f, 0);
        // header('Content-Type: application/json');
        // header('Content-Type: text/json; charset=utf-8');
        // header('Content-Disposition: attachment; filename="block_areas'.time().'.json";');
        // fpassthru($f);
    }
}
?>
<html>
<head>
    <title>Convert csv to json</title>
    <meta charset="utf-8">
</head>
<body>
<p>*Support CSV format with delimiter "," only. From excel sheet > File > Save As > Select ext is CSV</p>
<form action="" method="post" enctype="multipart/form-data">
<input name="excel" type="file" />
<?php 
if (!empty($error)) {
    echo "<p style='color:red;'>$error</p>";
} 
?>
<button name="submit" value="file">to Json Please!</button>
</form>
<hr>
<?php 
if (!empty($json)) {
?>
<div><button name="copy">Copy</button></div>
<textarea id="json" style="width: 95%;" rows="20"><?php echo($json); ?></textarea>
<?php 
}
?>
</body>
<script>
    document.querySelector("button[name=copy]").onclick = function(){
    document.querySelector("textarea").select();
    document.execCommand('copy');
}
</script>
</html>