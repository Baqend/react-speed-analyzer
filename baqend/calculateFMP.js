const request = require('request-promise');
const credentials = require('./credentials');

/**
 * Get the raw visual progress data of a given html string.
 *
 * @param {string} htmlString The html string to get the data from.
 * @return {array} An array of the raw visual progress data.
 */
function getDataFromHtml(htmlString) {
  const regex = /google\.visualization\.arrayToDataTable(((.|\n)*?));/gm;
  const matchArray = regex.exec(htmlString);

  if (!matchArray && matchArray[1]) {
    return null;
  }

  const data = eval(matchArray[1]);
  if (!data) {
    return null;
  }

  // Remove the first item of the data array because it has irrelevant data like "Time (ms)"
  data.shift();
  return data;
}

/**
 * Calculate first meaningful paint based on the given data.
 *
 * @param {array} data An Array of visual progress raw data.
 * @return {number} The first meaningful paint value.
 */
function calculateFMP(data) {
  let firstMeaningfulPaint = 0;
  let highestDiff = 0;

  if (!data) {
    return firstMeaningfulPaint;
  }

  if (data.length === 1) {
    return data[0][0];
  }

  for (let i = 1; i < data.length; i += 1) {
    const diff = data[i][1] - data[i - 1][1];

    if (diff > highestDiff) {
      highestDiff = diff;
      [firstMeaningfulPaint] = data[i];
    }
  }

  return (parseFloat(firstMeaningfulPaint) * 1000).toString();
}

function getFMP(testId) {
  const url = `http://${credentials.wpt_dns}/video/compare.php?tests=${testId}`;
  return request(url)
    .then((htmlString) => {
      const dataArray = getDataFromHtml(htmlString);

      return calculateFMP(dataArray);
    })
    .catch((err) => {
      throw new Abort(err.mesage);
    });
}

exports.call = (db, data) => {
  const { testId } = data;
  return getFMP(testId);
};

exports.getFMP = getFMP;
