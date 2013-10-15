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
        console.log("MapCachePlugin: " + JSON.stringify(text, censor(text)));
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

        window.requestFileSystem(
            LocalFileSystem.PERSISTENT, 0,
            function (fs) { //success
                FILESYSTEM = fs; //set global - sloppy, I know
                addTileLayer();
            },
            function () {
                alert("Failure accessing filesystem!");
            } //filesystem failure
        );

        MAP = L
            .map(id, {
                center: [51.505, -0.09],
                zoom: 13,
                maxZoom: 14,
                minZoom: 3,
                detectRetina: true
            });

        MAP
            .locate({watch: true, setView: true, maxZoom: 18})
            .on('locationfound', function (e) {
                console.log("Location found");
                localMapCache.location = e.latlng;
                addTileLayer();
            })
            .on('locationerror', function (e) {
                log(e);
                log("LOCATION ERROR");
            });


        /*L.tileLayer('http://{s}.tile.cloudmade.com/9259e57a25e3434880e56895ba098a24/{styleId}/256/{z}/{x}/{y}.png', {
         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
         styleId: 105345,
         maxZoom: 18
         }).addTo(MAP);*/
        return true;
    };

    function addTileLayer() {
        if (localMapCache.location && FILESYSTEM) {
            var layer = L
                .tileLayer(tilePath(FILESYSTEM), {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                })
                .addTo(MAP)
                .on('loading', function (e) {
                    log("Tile layer is loading tiles now.");
                })
                .on('tileload', function (e) {
                    fileUtils.bulkDownload(FILESYSTEM, [getRemotePath(e.url)], "tiles");
                });

            var tiles = tileUtils.pyramid("", localMapCache.location.lat, localMapCache.location.lng);
            /*fileUtils.bulkDownload(FILESYSTEM, tiles, "tiles", function () {
             log("BulkDownload completed");
             layer.redraw();
             });*/
            log("AddTileLayer included");
        }

    }

    function getRemotePath(localPath) {
        // eg: "file:///storage/emulated/0/tiles/14/8802/5375.png"
        //                                       {z}{x}  {y}
        var pattern = /.*\/(\d+)\/(\d+)\/(\d+)\.png/;
        pattern.exec(localPath);
        var z = parseInt(RegExp.$1);
        var x = parseInt(RegExp.$2);
        var y = parseInt(RegExp.$3);
        if (isNaN(z) || isNaN(x) || isNaN(y)) {
            log("local Path " + localPath + " could not be matched to pattern.");
            return;
        }
        else {
            var url = "http://tile.osm.org/{z}/{x}/{y}.png";
            url = url.replace("{z}", z);
            url = url.replace("{x}", x);
            url = url.replace("{y}", y);
            log("returning remote url '" + url + "' for localPath '" + localPath + "'");
            return url;
        }
    }

    //http://{s}.tile.osm.org/{z}/{x}/{y}.png
    function tilePath(fileSystem) {
        //return "http://tile.osm.org/{z}/{x}/{y}.png";
        var rootDir = fileSystem.root.fullPath;
        if (rootDir[rootDir.length - 1] != '/') {
            rootDir += '/';
        }
        var r = rootDir + 'tiles/{z}/{x}/{y}.png';
        log("Tile Path is :" + r);
        return r;
    }

    function updatePosition(pos) {
        if (MAP === null) {
            log("Map not initialized");
            return false;
        }
        log("updatePosition " + JSON.stringify(pos));
        if (pos.coords.latitude && pos.coords.longitude) {
            log("Set position to " + pos.coords.latitude + "|" + pos.coords.longitude);
            //MAP.setView([pos.coords.latitude, pos.coords.longitude], 13);
        }
    };


    function getTile() {
        log("get Tile");
    };
    return {
        'getTile': getTile,
        'initialize': init,
        'updatePosition': updatePosition
    };
}();

module.exports = localMapCache;
