export var MediaSessionEvents;
(function (MediaSessionEvents) {
    /**
     * Event triggered when the remote party signals video max frame heights for its local sources.
     */
    MediaSessionEvents["REMOTE_SOURCE_CONSTRAINTS_CHANGED"] = "media_session.REMOTE_SOURCE_CONSTRAINTS_CHANGED";
    /**
     * Event triggered when the video codec of the local video track has changed.
     */
    MediaSessionEvents["VIDEO_CODEC_CHANGED"] = "media_session.VIDEO_CODEC_CHANGED";
})(MediaSessionEvents || (MediaSessionEvents = {}));
//# sourceMappingURL=MediaSessionEvents.js.map