var async = require('async'),
    debug = require('debug')('pokego-scanner'),
    cloudscraper = require('cloudscraper');

function get(url, next) {
    debug(url);
    cloudscraper.get(url, function(err, resp, body) {
        if (err) {
            next(err);
        } else {
            try {
                var json = JSON.parse(body);
                debug({statusCode: resp.statusCode, body: json});
                next(null, resp, true, json);
            } catch (e) {
                debug({statusCode: resp.statusCode, body: '(non-json content)'});
                next(null, resp, false, body);
            }
        }
    });
}

function ErrorWithType(message, type) {
    this.message = (message || "");
    this.type = type || "error";
}

ErrorWithType.prototype = Error.prototype;
module.exports.ErrorWithType = ErrorWithType;

function getErrorFromHtmlResp(html) {
    var err = null;

    if (html.indexOf('{disabled}') !== -1) {
        err = new ErrorWithType('Scanning is currently disabled temporarily.', 'warning');
    } else if (html.indexOf('{scan-throttle}') !== -1) {
        err = new ErrorWithType('You already scanned recently.', 'warning');
    } else if (html.indexOf('Maintenance') !== -1) {
        err = new ErrorWithType('API is undergoing maintenance. Everything should be completed shortly.', 'warning');
    } else {
        err = new ErrorWithType('Unknown response received from API.');
    }

    return err;
}

function getErrorFromJsonResp(json) {
    var err = null;

    if (json.message.indexOf('{disabled}') !== -1) {
        err = new ErrorWithType('Scanning is currently disabled temporarily.', 'warning');
    } else if (json.message.indexOf('{scan-throttle}') !== -1) {
        err = new ErrorWithType('You already scanned recently.', 'warning');
    } else {
        err = new ErrorWithType(json.message || 'Unknown invalid response received from API.');
    }

    return err;
}

module.exports.createScanJob = function(coor, next) {
    var url = 'https://pokevision.com/map/scan/'+coor.latitude+'/'+coor.longitude;
    get(url, function(err, resp, respIsJson, body) {
        if (err) return next(err);

        // if the response was not JSON, try to infer the error from its content
        if (!respIsJson) {
            return next(getErrorFromHtmlResp(body));
        }
        // if the JSON response was an error, try to determine which error it was
        else if (resp.statusCode !== 200 || body.status === 'error') {
            return next(getErrorFromJsonResp(body));
        }

        next(null, {
            latitude: coor.latitude,
            longitude: coor.longitude,
            jobId: body.jobId,
            jobUrl: 'https://pokevision.com/map/data/'+coor.latitude+'/'+coor.longitude+'/'+body.jobId
        });
    });
};

module.exports.getJobStatus = function(job, next) {
    get(job.jobUrl, function(err, resp, respIsJson, body) {
        if (err) return next(err);

        // if the response was not JSON, try to infer the error from its content
        if (!respIsJson) {
            return next(getErrorFromHtmlResp(body));
        }
        // if the JSON response was an error, try to determine which error it was
        else if (resp.statusCode !== 200 || body.status === 'error') {
            return next(getErrorFromJsonResp(body));
        }

        next(null, body);
    });
};
