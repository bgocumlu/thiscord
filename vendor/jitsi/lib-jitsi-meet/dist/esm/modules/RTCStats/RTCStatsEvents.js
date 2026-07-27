/**
 * Events emitted by the RTCStats module.
 */
export var RTCStatsEvents;
(function (RTCStatsEvents) {
    /**
     * Event that indicates that the microphone has been muted or unmuted.
     *
     * @param {boolean} muted - Whether microphone was muted.
     */
    RTCStatsEvents["AUDIO_MUTE_CHANGED_EVENT"] = "audioMutedChanged";
    /**
     * Event that indicates that the video codec on the sender has changed.
     *
     * @param {object} data - The data.
     * @param {CodecMimeType} data.camera - The codec used for camera source.
     * @param {CodecMimeType} data.screenshare - The codec used for screenshare.
     */
    RTCStatsEvents["CODEC_CHANGED_EVENT"] = "codecChanged";
    /**
     * Event that indicates that the conference start timestamp has been received from MUC.
     */
    RTCStatsEvents["CONFERENCE_START_TIMESTAMP_EVENT"] = "conferenceStartTimestamp";
    /**
     * Event that indicates that the current user has become the dominant speaker for the conference.
     */
    RTCStatsEvents["DOMINANT_SPEAKER_CHANGED_EVENT"] = "dominantSpeakerChanged";
    /**
     * Event that indicates that the encode resolution is being restricted by CPU.
     *
     * @param {boolean} restricted - Whether CPU restriction was detected or removed.
     */
    RTCStatsEvents["ENCODER_CPU_RESTRICTED_EVENT"] = "cpuRestricted";
    /**
     * Event that indicates that a getUserMedia call has failed.
     *
     * @param {object} data - The data.
     * @param {string} data.name - The error name (e.g. 'NotAllowedError', 'NotFoundError', 'OverconstrainedError').
     * @param {string} data.message - The error message.
     * @param {string} [data.constraint] - The failed constraint name, when applicable (OverconstrainedError).
     * @param {Array<string>} data.devices - The media types that were requested (e.g. ['audio', 'video', 'desktop']).
     */
    RTCStatsEvents["GET_USER_MEDIA_ERROR_EVENT"] = "getUserMediaError";
    /**
     * Event that indicates that the JVB media session is restarted because of ICE failure.
     */
    RTCStatsEvents["JVB_ICE_RESTARTED_EVENT"] = "jvbIceRestarted";
    /**
     * Event for logging.
     */
    RTCStatsEvents["LOG_EVENT"] = "logs";
    /**
     * Event that indicates that a remote video source's media stream has been interrupted.
     */
    RTCStatsEvents["REMOTE_SOURCE_INTERRUPTED_EVENT"] = "remoteSourceInterrupted";
    /**
     * Event that indicates that a remote video source is suspended by the JVB because of BWE issues.
     */
    RTCStatsEvents["REMOTE_SOURCE_SUSPENDED_EVENT"] = "remoteSourceSuspended";
    /**
     * Event that indicates a change in the decoding state of a remote video stream that is receiving media bytes.
     *
     * @param {object} data - The event data.
     * @param {boolean} data.stopped - True when frame decoding has stopped while bytes are still received,
     * false when decoding resumes.
     * @param {string} data.participantId - The participant whose video stream is affected.
     * @param {number} data.ssrc - The SSRC of the affected stream.
     */
    RTCStatsEvents["REMOTE_VIDEO_DECODING_EVENT"] = "remoteVideoDecoding";
    /**
     * Event emitted when any PeerConnection event is triggered.
     *
     * @param {object} event - The PeerConnection event.
     * @param {string} event.type - The event type.
     * @param {object} event.body - Event body.
     * @param {string} event.body.isP2P - PeerConnection type.
     * @param {string} event.body.state - PeerConnection state change which triggered the event.
     */
    RTCStatsEvents["RTC_STATS_PC_EVENT"] = "rtstats_pc_event";
    /**
     * Event emitted when the websocket connection to the rtcstats server is disconnected.
     */
    RTCStatsEvents["RTC_STATS_WC_DISCONNECTED"] = "rtcstats_ws_disconnected";
    /**
     * Event that indicates that the screenshare has started or stopped.
     *
     * @param {object} data - The data.
     * @param {boolean} data.muted - Whether screenshare was toggled off or on.
     */
    RTCStatsEvents["SCREENSHARE_MUTE_CHANGED_EVENT"] = "screenshareToggled";
    /**
     * Event that indicates that the strophe connection has disconnected.
     */
    RTCStatsEvents["STROPHE_DISCONNECTED_EVENT"] = "stropheDisconnected";
    /**
     * Event that indicates that a strophe error has occurred.
     *
     * @param {object} data - The data.
     */
    RTCStatsEvents["STROPHE_ERROR_EVENT"] = "strophe.error";
    /**
     * Event that indicates that the strophe connection has been re-established.
     */
    RTCStatsEvents["STROPHE_RECONNECTED_EVENT"] = "stropheReconnected";
    /**
     * Event that indicates that the camera has been muted or unmuted.
     *
     * @param {boolean} muted - Whether camera was muted.
     */
    RTCStatsEvents["VIDEO_MUTE_CHANGED_EVENT"] = "videoMutedChanged";
})(RTCStatsEvents || (RTCStatsEvents = {}));
//# sourceMappingURL=RTCStatsEvents.js.map