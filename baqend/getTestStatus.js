const API = require('./Pagetest').API;

exports.call = function(db, data, req) {
    const { baqendId } = data;
    return getTestStatus(db, baqendId);
};

function getTestStatus(db, baqendId) {
    return db.TestResult.load(baqendId).then((result) => {
        if (!result) {
            throw new Abort('Object not found');
        }

        return API.getTestStatus(result.testId);
    }).then((status) => {
        return { status };
    });
}

exports.getTestStatus = getTestStatus;
