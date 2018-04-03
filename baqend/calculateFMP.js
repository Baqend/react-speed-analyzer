"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const credentials_1 = __importDefault(require("./credentials"));
/**
 * Get the raw visual progress data of a given html string.
 *
 * @param htmlString The html string to get the data from.
 * @return An array of the raw visual progress data.
 */
function getDataFromHtml(htmlString) {
    const regex = /google\.visualization\.arrayToDataTable\((\[(.|\n)*])\);/gm;
    const matchArray = regex.exec(htmlString);
    if (!matchArray || !matchArray[1]) {
        throw new Error('Could not find data table in HTML.');
    }
    const data = JSON.parse(matchArray[1]);
    // Remove the first item of the data array because it has irrelevant data like "Time (ms)"
    data.shift();
    return data.map(row => [parseFloat(row[0]), row[1]]);
}
/**
 * Calculate first meaningful paint based on the given data.
 *
 * @param data An Array of visual progress raw data.
 * @return {number} The first meaningful paint value.
 */
function calculateFMP(data) {
    let firstMeaningfulPaint = 0;
    let highestDiff = 0;
    if (data.length === 1) {
        return data[0][0] * 1000;
    }
    for (let i = 1; i < data.length; i += 1) {
        const [time, visualProgress] = data[i];
        const diff = visualProgress - data[i - 1][1];
        // stop loop if the visual progress is negative => FMP is last highest diff
        if (diff < 0) {
            break;
        }
        // The current diff is the highest and the visual progress is at least 50%
        if (diff > highestDiff) {
            highestDiff = diff;
            firstMeaningfulPaint = time;
        }
        if (highestDiff >= 50) {
            break;
        }
    }
    return firstMeaningfulPaint * 1000;
}
/**
 * Gets the first meaningful paint for a given test run.
 */
function getFMP(testId, runIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = `http://${credentials_1.default.wpt_dns}/video/compare.php?tests=${testId}-r:${runIndex}-c:0`;
            const response = yield node_fetch_1.default(url);
            const htmlString = yield response.text();
            const data = getDataFromHtml(htmlString);
            return calculateFMP(data);
        }
        catch (err) {
            throw new Abort(err.mesage);
        }
    });
}
exports.getFMP = getFMP;
/**
 * Baqend code API call.
 */
function call(db, data) {
    const { testId, runIndex = 0 } = data;
    return getFMP(testId, runIndex);
}
exports.call = call;
