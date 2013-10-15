fileUtils = function () {

    var downloadInProgress = false;
    var downloadItems = [];
    var completedCallbacks = [];

    /** uniqe functions for arrays regarding type */
    Array.prototype.unique = function (a) {
        return function () {
            return this.filter(a)
        }
    }(function (a, b, c) {
        return c.indexOf(a, b + 1) < 0
    });

    function checkIfFileExists(fileSystem, path, callback) {
        path = path.replace(fileSystem.root.fullPath + "/", "");
        fileSystem.root.getFile(path, { create: false }, function () {
            callback(true);
        }, function () {
            callback(false);
        });
    };

    function rmDir(fileSystem, dirName, callback) {
        fileSystem.root.getDirectory(dirName, {create: true},
            function (dir) { //success
                dir.removeRecursively(
                    function () {
                        callback();
                    },
                    function () {
                        alert("Error deleting!");
                    }
                );
            },
            function () {
                alert("Error deleting directory");
            } //fail
        );
    };

    function bulkDownload(fileSystem, urls, targetDir, callback) {
        console.log("cecking BulkDownload :" + downloadInProgress);
        if (callback)
            completedCallbacks.push(callback);

        downloadItems = downloadItems.concat(urls).unique();
        if (downloadInProgress === true) {
            console.log("BulkDownload is already in progress. Storing for next reload.");
        }
        else {
            console.log("BulkDownload starting for " + urls.length + " elements.");
            downloadInProgress = true;
            /*
             * Bulk download of urls to the targetDir (relative path from root)
             */
            var rootDir = fileSystem.root.fullPath;
            if (rootDir[rootDir.length - 1] != '/') {
                rootDir += '/';
            }
            var dirPath = rootDir + targetDir;
            downloadFile(fileSystem, dirPath);

        }
    }

    function downloadFile(fileSystem, dirPath) {

        if (downloadItems.length === 0) { //callback if done
            downloadInProgress = false;
            for (var i = 0; i < completedCallbacks.length; i++) {
                console.log("Calling CompleteCallback " + i + " right now.");
                completedCallbacks[i]();
            }
            return;
        } else {
            var url = downloadItems[0];
            downloadItems = downloadItems.slice(1, downloadItems.length);
            console.log("Download Items size reduced to " + downloadItems.length);
            //NOTE: THIS IS SUPER HARD-CODED
            // http://../...../{z}/{x}/{y}.png
            //                 |-------------|

            var tail = url.split("/").slice(-3).join("/");

            var fn = dirPath + '/' + tail;

            checkIfFileExists(fileSystem, fn, function (exists) {
                if (exists === true) {
                    console.log("Skipping file " + fn);
                    downloadFile(fileSystem, dirPath);
                } else {
                    console.log("downloading file " + url + " to path " + fn);
                    var fileTransfer = new FileTransfer();
                    fileTransfer.download(url, fn,
                        function (theFile) {
                            downloadFile(fileSystem, dirPath);
                        },
                        function (error) {
                            console.log("==> download error code: " + error.code + "for file " + url + " to local file " + fn);
                            downloadFile(fileSystem, dirPath);
                        }
                    );
                }
            });
        }


    }

    return {
        'rmDir': rmDir,
        'bulkDownload': bulkDownload
    };

}();

module.exports = fileUtils;
