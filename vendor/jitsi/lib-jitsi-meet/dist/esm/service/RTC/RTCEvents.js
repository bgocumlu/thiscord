export var RTCEvents;
(function (RTCEvents) {
    /**
     * Designates an event indicating that the audio output device has changed.
     */
    RTCEvents["AUDIO_OUTPUT_DEVICE_CHANGED"] = "rtc.audio_output_device_changed";
    /**
     * Designates an event indicating that some audio SSRCs that have already been signaled will now map to new remote
     * sources.
     */
    RTCEvents["AUDIO_SSRCS_REMAPPED"] = "rtc.audio_ssrcs_remapped";
    /**
     * Designates an event indicating that the bridge bandwidth estimation stats have been received.
     */
    RTCEvents["BRIDGE_BWE_STATS_RECEIVED"] = "rtc.bridge_bwe_stats_received";
    /**
     * Indicates that the data channel has been closed.
     */
    RTCEvents["DATA_CHANNEL_CLOSED"] = "rtc.data_channel_closed";
    /**
     * Indicates that the data channel has been opened.
     */
    RTCEvents["DATA_CHANNEL_OPEN"] = "rtc.data_channel_open";
    /**
     * Indicates that the list with available devices is now available.
     */
    RTCEvents["DEVICE_LIST_AVAILABLE"] = "rtc.device_list_available";
    /**
     * Indicates that the list with available devices has changed.
     */
    RTCEvents["DEVICE_LIST_CHANGED"] = "rtc.device_list_changed";
    /**
     * Indicates that the list with available devices will change.
     */
    RTCEvents["DEVICE_LIST_WILL_CHANGE"] = "rtc.device_list_will_change";
    /**
     * Indicates that the dominant speaker has changed.
     */
    RTCEvents["DOMINANT_SPEAKER_CHANGED"] = "rtc.dominant_speaker_changed";
    /**
     * Indicates that the connection status of the endpoint has changed.
     */
    RTCEvents["ENDPOINT_CONN_STATUS_CHANGED"] = "rtc.endpoint_conn_status_changed";
    /**
     * Indicates that a message from another participant is received on data channel.
     */
    RTCEvents["ENDPOINT_MESSAGE_RECEIVED"] = "rtc.endpoint_message_received";
    /**
     * Indicates that the remote endpoint stats have been received on data channel.
     */
    RTCEvents["ENDPOINT_STATS_RECEIVED"] = "rtc.endpoint_stats_received";
    /**
     * Indicates that the list of sources currently being forwarded by the bridge has changed.
     */
    RTCEvents["FORWARDED_SOURCES_CHANGED"] = "rtc.forwarded_sources_changed";
    /**
     * Event emitted when {@link RTC.setLastN} method is called to update with the new value set.
     * The first argument is the value passed to {@link RTC.setLastN}.
     */
    RTCEvents["LASTN_VALUE_CHANGED"] = "rtc.lastn_value_changed";
    /**
     * The max enabled resolution of a local video track was changed.
     */
    RTCEvents["LOCAL_TRACK_MAX_ENABLED_RESOLUTION_CHANGED"] = "rtc.local_track_max_enabled_resolution_changed";
    /**
     * Designates an event indicating that the local ICE username fragment of
     * the jingle session has changed.
     * The first argument of the vent is <tt>TraceablePeerConnection</tt> which
     * is the source of the event.
     * The second argument is the actual "ufrag" string.
     */
    RTCEvents["LOCAL_UFRAG_CHANGED"] = "rtc.local_ufrag_changed";
    /**
     * Event emitted when the user granted/blocked a permission for the camera / mic.
     * Used to keep track of the granted permissions on browsers which don't
     * support the Permissions API.
     */
    RTCEvents["PERMISSIONS_CHANGED"] = "rtc.permissions_changed";
    /**
     * Event fired when we remote track is added to the conference.
     * 1st event argument is the added <tt>JitsiRemoteTrack</tt> instance.
     **/
    RTCEvents["REMOTE_TRACK_ADDED"] = "rtc.remote_track_added";
    // FIXME get rid of this event in favour of NO_DATA_FROM_SOURCE event
    // (currently implemented for local tracks only)
    RTCEvents["REMOTE_TRACK_MUTE"] = "rtc.remote_track_mute";
    /**
     * Indicates that the remote track has been removed from the conference.
     * 1st event argument is the removed {@link JitsiRemoteTrack} instance.
     */
    RTCEvents["REMOTE_TRACK_REMOVED"] = "rtc.remote_track_removed";
    // FIXME get rid of this event in favour of NO_DATA_FROM_SOURCE event
    // (currently implemented for local tracks only)
    RTCEvents["REMOTE_TRACK_UNMUTE"] = "rtc.remote_track_unmute";
    /**
     * Designates an event indicating that the local ICE username fragment of the jingle session has changed.
     * The first argument of the vent is <tt>TraceablePeerConnection</tt> which is the source of the event.
     * The second argument is the actual "ufrag" string.
     */
    RTCEvents["REMOTE_UFRAG_CHANGED"] = "rtc.remote_ufrag_changed";
    /**
     * Indicates that sender constraints requested by the bridge for this endpoint have changed.
     */
    RTCEvents["SENDER_VIDEO_CONSTRAINTS_CHANGED"] = "rtc.sender_video_constraints_changed";
    /**
     * Designates an event indicating that some video SSRCs that have already been signaled will now map to new remote
     * sources.
     */
    RTCEvents["VIDEO_SSRCS_REMAPPED"] = "rtc.video_ssrcs_remapped";
})(RTCEvents || (RTCEvents = {}));
//# sourceMappingURL=RTCEvents.js.map