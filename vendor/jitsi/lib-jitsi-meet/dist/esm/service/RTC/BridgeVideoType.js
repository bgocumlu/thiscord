/**
 * Enumeration of the video types that are signaled to the bridge
 * @type {{CAMERA: string, DESKTOP: string, DESKTOP_HIGH_FPS: string, NONE: string}}
 */
export var BridgeVideoType;
(function (BridgeVideoType) {
    /**
     * The camera video type.
     */
    BridgeVideoType["CAMERA"] = "camera";
    /**
     * The low fps desktop video type.
     */
    BridgeVideoType["DESKTOP"] = "desktop";
    /**
     * The high fps desktop video type.
     */
    BridgeVideoType["DESKTOP_HIGH_FPS"] = "desktop_high_fps";
    /**
     * Video type when no local source is present.
     */
    BridgeVideoType["NONE"] = "none";
})(BridgeVideoType || (BridgeVideoType = {}));
//# sourceMappingURL=BridgeVideoType.js.map