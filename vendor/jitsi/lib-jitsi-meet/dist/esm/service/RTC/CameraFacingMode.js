/**
 * The possible camera facing modes. For now support only 'user' and
 * 'environment' because 'left' and 'right' are not used anywhere in our
 * projects at the time of this writing. For more information please refer to
 * https://w3c.github.io/mediacapture-main/getusermedia.html
 * #def-constraint-facingMode.
 *
 * @enum {string}
 */
export var CameraFacingMode;
(function (CameraFacingMode) {
    /**
     * The mode which specifies the environment-facing camera.
     */
    CameraFacingMode["ENVIRONMENT"] = "environment";
    /**
     * The mode which specifies the user-facing camera.
     */
    CameraFacingMode["USER"] = "user";
})(CameraFacingMode || (CameraFacingMode = {}));
//# sourceMappingURL=CameraFacingMode.js.map