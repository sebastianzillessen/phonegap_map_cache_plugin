tileUtils = function () {

    function pyramid(mapID, lat, lon, options) {
        /*
         Given a list of mapIDs, a central lat/lng, and zoomLimit/radius options
         generate the urls for the pyramid of tiles for zoom levels 3-17

         radius is how many tiles from the center at zoomLimit
         (by default
         zooms 3-14 have radius of 1.
         15 has radius 2
         16 has radius 4.
         17 has radius 8
         )
         */

        //handle options
        options = options || {};
        var zoomLimit = options['zoomLimit'] || 17;
        var minZoom = options['minZoom'] || 3;
        var maxZoom = options['maxZoom'] || 14;
        var radius = options['radius'] || 1;

        //declare vars outside of loop
        var urls = [], mapID, zoom, t_x, t_y, r, x, y;

        for (zoom = maxZoom - 1; zoom >= minZoom; zoom--) { //iterate over zoom levels
            t_x = long2tile(lon, zoom);
            t_y = lat2tile(lat, zoom);
            r = radius * Math.pow(2, (Math.max(zoom, zoomLimit) - zoomLimit));
            for (x = t_x - r; x <= t_x + r; x++) { //iterate over x's
                for (y = t_y - r; y <= t_y + r; y++) { //iterate over y's
                    urls.push(tile2url(mapID, zoom, x, y));
                }
            }
        }
        return urls;
    }

    function tile2url(mapID, zoom, x, y) {
        /*  Given a mapID, zoom, tile_x, and tile_y,
         *  return the url of that tile
         */
        var url = "http://tile.osm.org/{z}/{x}/{y}.png";
        url = url.replace("{z}", zoom);
        url = url.replace("{x}", x);
        url = url.replace("{y}", y);
        return url;
    }

//both from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
    function long2tile(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }

    function lat2tile(lat, zoom) {
        return (Math.floor(
            (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
        ));
    }

    return {
        'pyramid': pyramid
    };

}();

module.exports = tileUtils;