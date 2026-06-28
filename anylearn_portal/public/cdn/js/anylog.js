(function($) {
    "use strict"; // Start of use strict
    var randomLength = 10;
    const baseUrl = a_config['logUrl'];
    const uid = a_config['uid'];
    const lang = a_config['lang'];
    let a = $("meta[name='data-spm']").attr("content"),
        b = $("body").data("spm"),
        c = $("#spmc").data("spm") ? $("#spmc").data("spm") : 0,
        d = 0;

    //auto send when load pages
    $(function() {
        var spmKey = a + "." + b + "." + c + "." + d;
        if (spmKey != null) {
            spmKey += "." + genId(randomLength)
            var payload = payloadInfo();
            var url = baseUrl + "?spm=" + spmKey + "&" + payload;
            $.ajax({
                url: url,
                method: 'GET',
                // timeout: 100
            });
        }
    });

    //send event when click without redirect
    $("a").on("click", function(e) {
        var spmKey = $(this).data("spm");
        if (spmKey != null) {
            spmKey = a + "." + b + "." + spmKey + "." + genId(randomLength)
            console.log(spmKey);
            e.preventDefault();
            var newUrl = appendSpmToRedirectUrl($(this).attr('href'), spmKey);
            return window.location.href = newUrl;
        }
    });

    $("form").on("submit", function(e) {
        var spmKey = $(this).data("spm");
        if (spmKey != null) {
            var extra = null;
            if (spmKey.includes("search")) {
                extra = $(this).find("input[name=s]").val();
            }
            var payload = payloadInfo(extra);
            spmKey = a + "." + b + "." + spmKey + "." + genId(randomLength)
                // e.preventDefault();
            var url = baseUrl + "?spm=" + spmKey + "&" + payload;

            $.ajax({
                url: url,
                method: 'GET',
                // timeout: 100
            });
        }
        return true;
    });

    function appendSpmToRedirectUrl(url, spm) {
        if (url.includes("?")) {
            return url + "&spm=" + spm;
        }
        return url + "?spm=" + spm;
    }

    function payloadInfo(extra = "") {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        var payload = new Map();
        payload.set('spm_pre', urlParams.has('spm') ? urlParams.get('spm') : "");
        payload.set('screen', window.innerWidth);
        payload.set('usid', uid);
        payload.set('lang', lang);
        payload.set('os', navigator.platform);
        payload.set('p_url', encodeURI(window.location));
        payload.set('p_meta_canon', encodeURI(window.location));
        payload.set('p_title', document.title);
        payload.set('p_meta_desc', document.querySelector('meta[name="description"]').content);
        payload.set('logfrom', 'web');
        payload.set('p_ref', encodeURI(document.referrer));
        if (extra) {
            payload.set('extra', extra);
        }
        var arr = [];
        payload.forEach(function(val, key) {
            arr.push(key + "=" + encodeURI(val));
        });
        return arr.join("&");
    }

    function genId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
})(jQuery); // End of use strict