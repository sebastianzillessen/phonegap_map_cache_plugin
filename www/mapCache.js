var localMapCache = function () {
    var MAP = null;
    var FILESYSTEM = null;

    function censor(censor) {
        return (function () {
            var i = 0;

            return function (key, value) {
                if (i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value)
                    return '[Circular]';

                if (i >= 29) // seems to be a harded maximum of 30 serialized objects?
                    return '[Unknown]';

                ++i; // so we know we aren't using the original object anymore

                return value;
            }
        })(censor);
    }


    function log(text) {
        text = JSON.stringify(text, censor(text));
        console.log("MapCachePlugin: " + text);
        $("#log").prepend("<li>" + text + "</li>");
    }

    function insertCss(filename) {
        var fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", filename);
        document.getElementsByTagName("head")[0].appendChild(fileref);
    };

    function init(id) {
        log("init");
        if (MAP !== null) {
            return "Already initialized that plugin";
        }
        if (document.getElementById(id) === null) {
            return "Element '" + id + "' could not be founded";
        }
        insertCss("css/leaflet.css");
        $.getScript("libs/event.js").done(function () {
            window.offlineMaps.eventManager
                .on('storageLoaded', function (storage) {
                    log("storage is:");
                    log(storage);
                    initializeMap(id, storage);
                });
            $.getScript("libs/storage.js").done(function () {
                $.getScript("libs/map.js").done(function () {
                    log("loaded libs");
                    window.offlineMaps.eventManager.fire('storageLoad');
                });
            });
        });
        return true;
    };

    function initializeMap(selector, storage) {
        log("Map Init");
        MAP = L.map(selector, {
            center: [52.521809, 13.412848],
            zoom: 13,
            maxZoom: 13,
            minZoom: 13,
            detectRetina: true,
            zoomControl: false
        });
        log("adding tile Layer now");
        log(MAP);
        log(window.offlineMaps);
        log(window.offlineMaps.storage);
        log(StorageTileLayer);
        new StorageTileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {storage: storage, log: log}).addTo(MAP);
        log("After storage init");
        MAP
            .locate({watch: true, setView: true, maxZoom: 18})
            .on('locationfound', locationFound)
            .on('locationerror', function (e) {
                log(e);
                log("LOCATION ERROR");
            });
        log("adding tile Layer: done");
    };


    function locationFound(loc) {
        console.log("Location found");
        localMapCache.location = e.latlng;
        alert("Location found");
    };


    return {
        'initialize': init
    };
}

    ();

module.exports = localMapCache;
