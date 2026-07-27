/**
 * Checks whether analytics is enabled or not.
 *
 * @param {Object} options - Init options.
 * @returns {boolean}
 */
export function isAnalyticsEnabled(options) {
    const { analytics, disableThirdPartyRequests } = options;
    return !(analytics?.disabled || disableThirdPartyRequests);
}
/**
 * Checks whether rtcstats is enabled or not.
 *
 * @param {Object} options - Init options.
 * @returns {boolean}
 */
export function isRtcstatsEnabled(options) {
    const { analytics } = options;
    return analytics?.rtcstatsEnabled ?? false;
}
/**
 * Checks whether watchrtc is enabled or not.
 *
 * @param {Object} options - Init options.
 * @returns {boolean}
 */
export function isWatchRTCEnabled(options) {
    const { analytics } = options;
    return analytics?.watchRTCEnabled ?? false;
}
//# sourceMappingURL=functions.js.map