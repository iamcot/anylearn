(function () {
    $(".location-tree").on("change", function (e) {
        var level = $(this).data("next-level");
        var parentCode = $(this).val();

        if (!level) {
            return;
        }
        $.get('/location-tree/' + level + "/" + parentCode, function (data) {
            if (data.length == 0) {
                return;
            }
            if (level == "ward_path") {
                $("#ward_path").val(data.path_with_type);
            } else {
                $("#select-" + level).html("");
                $("#select-" + level).append('<option value="">--Chọn ' + (level == "district" ? "Quận/Huyện" : "Phường/Xã") + '--</option>');
                data.forEach(e => {
                    $("#select-" + level).append('<option value="' + e.code + '">' + e.name + '</option>');
                });
            }
          
        })
    });

    // $("#checkMap").on("click", function(e) {
    //     var fullAddress = $("#address").val() + " " + $("#ward_path").val();
    //     $.get("/location-geo/" + fullAddress, function(data) {
    //         if (data.length == 0) {
    //             return;
    //         }
    //         $("#longitude").val(data.longitude);
    //         $("#latitude").val(data.latitude);
    //     });
    // });
})(jQuery);