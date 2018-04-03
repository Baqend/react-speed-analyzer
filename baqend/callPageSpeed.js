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
const API_KEY = credentials_1.default.google_api_key;
const API_URL = 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?';
/**
 * @param url The URL to run the Page Speed tests on.
 * @param mobile Run the test as a mobile client.
 * @return
 */
function callPageSpeed(url, mobile) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = [
            `url=${encodeURIComponent(url)}`,
            'screenshot=true',
            `strategy=${mobile ? 'mobile' : 'desktop'}`,
            `key=${API_KEY}`,
        ].join('&');
        const response = yield node_fetch_1.default(API_URL + query, { method: 'get' });
        const [ok, data] = yield Promise.all([response.ok, response.json()]);
        if (!ok) {
            throw new Error(data.error.errors[0].message);
        }
        const { pageStats, screenshot } = data;
        const domains = pageStats.numberHosts || 0;
        const requests = pageStats.numberResources || 0;
        let bytes = parseInt(pageStats.htmlResponseBytes, 10) || 0;
        bytes += parseInt(pageStats.cssResponseBytes, 10) || 0;
        bytes += parseInt(pageStats.imageResponseBytes, 10) || 0;
        bytes += parseInt(pageStats.javascriptResponseBytes, 10) || 0;
        bytes += parseInt(pageStats.otherResponseBytes, 10) || 0;
        return { url, mobile, domains, requests, bytes, screenshot };
    });
}
exports.callPageSpeed = callPageSpeed;
/**
 * Baqend code API call.
 */
function get(db, req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield callPageSpeed(req.query.url, req.query.mobile === 'true');
        res.send(results);
    });
}
exports.get = get;
