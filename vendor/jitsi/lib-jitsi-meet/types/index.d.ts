declare module "JitsiConferenceErrors" {
    /**
     * The errors for the conference.
     */
    export enum JitsiConferenceErrors {
        /**
         * Indicates that client must be authenticated to create the conference.
         */
        AUTHENTICATION_REQUIRED = "conference.authenticationRequired",
        /**
         * Indicates that chat error occurred.
         */
        CHAT_ERROR = "conference.chatError",
        /**
         * Indicates that a connection error is due to denied access to the room,
         * occurred after joining a lobby room and access is denied by the room moderators.
         */
        CONFERENCE_ACCESS_DENIED = "conference.connectionError.accessDenied",
        /**
         * Indicates that conference has been destroyed.
         */
        CONFERENCE_DESTROYED = "conference.destroyed",
        /**
         * Indicates that max users limit has been reached.
         */
        CONFERENCE_MAX_USERS = "conference.max_users",
        /**
         * Indicates that a connection error occurred when trying to join a conference.
         */
        CONNECTION_ERROR = "conference.connectionError",
        /**
         * Indicates that the display name is required when joining the room.
         * There are cases like lobby room where display name is required.
         * @param {boolean|null} lobby whether the error is because lobby is enabled.
         */
        DISPLAY_NAME_REQUIRED = "conference.display_name_required",
        /**
         * Indicates that focus error happened.
         */
        FOCUS_DISCONNECTED = "conference.focusDisconnected",
        /**
         * Indicates that focus left the conference.
         */
        FOCUS_LEFT = "conference.focusLeft",
        /**
         * Indicates that graceful shutdown happened.
         */
        GRACEFUL_SHUTDOWN = "conference.gracefulShutdown",
        /**
         * Indicates that the media connection has failed.
         */
        ICE_FAILED = "conference.iceFailed",
        /**
         * Indicates that the versions of the server side components are incompatible
         * with the client side.
         */
        INCOMPATIBLE_SERVER_VERSIONS = "conference.incompatible_server_versions",
        /**
         * Indicates that a connection error is due to not allowed,
         * occurred when trying to join a conference, only approved members are allowed to join.
         */
        MEMBERS_ONLY_ERROR = "conference.connectionError.membersOnly",
        /**
         * Indicates that a connection error is due to not allowed,
         * occurred when trying to join a conference.
         */
        NOT_ALLOWED_ERROR = "conference.connectionError.notAllowed",
        /**
         * Indicates that offer/answer had failed.
         */
        OFFER_ANSWER_FAILED = "conference.offerAnswerFailed",
        /**
         * Indicates that password cannot be set for this conference.
         */
        PASSWORD_NOT_SUPPORTED = "conference.passwordNotSupported",
        /**
         * Indicates that a password is required in order to join the conference.
         */
        PASSWORD_REQUIRED = "conference.passwordRequired",
        /**
         * Indicates that reservation system returned error.
         */
        RESERVATION_ERROR = "conference.reservationError",
        /**
         * Indicates that a settings error occurred.
         */
        SETTINGS_ERROR = "conference.settingsError",
        /**
         * Indicates that there is no available videobridge.
         */
        VIDEOBRIDGE_NOT_AVAILABLE = "conference.videobridgeNotAvailable"
    }
    /**
     * Types that are passed for NOT_ALLOWED_ERROR.
     */
    export enum AUTH_ERROR_TYPES {
        GENERAL = "general",
        NO_MAIN_PARTICIPANTS = "no-main-participants",
        NO_VISITORS_LOBBY = "no-visitors-lobby",
        PROMOTION_NOT_ALLOWED = "promotion-not-allowed",
        ROOM_CREATION_RESTRICTION = "room-creation-restriction",
        ROOM_UNAUTHENTICATED_ACCESS_DISABLED = "authentication-required"
    }
    export const AUTHENTICATION_REQUIRED = JitsiConferenceErrors.AUTHENTICATION_REQUIRED;
    export const CHAT_ERROR = JitsiConferenceErrors.CHAT_ERROR;
    export const SETTINGS_ERROR = JitsiConferenceErrors.SETTINGS_ERROR;
    export const CONFERENCE_DESTROYED = JitsiConferenceErrors.CONFERENCE_DESTROYED;
    export const CONFERENCE_MAX_USERS = JitsiConferenceErrors.CONFERENCE_MAX_USERS;
    export const CONNECTION_ERROR = JitsiConferenceErrors.CONNECTION_ERROR;
    export const NOT_ALLOWED_ERROR = JitsiConferenceErrors.NOT_ALLOWED_ERROR;
    export const MEMBERS_ONLY_ERROR = JitsiConferenceErrors.MEMBERS_ONLY_ERROR;
    export const CONFERENCE_ACCESS_DENIED = JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED;
    export const DISPLAY_NAME_REQUIRED = JitsiConferenceErrors.DISPLAY_NAME_REQUIRED;
    export const FOCUS_DISCONNECTED = JitsiConferenceErrors.FOCUS_DISCONNECTED;
    export const FOCUS_LEFT = JitsiConferenceErrors.FOCUS_LEFT;
    export const GRACEFUL_SHUTDOWN = JitsiConferenceErrors.GRACEFUL_SHUTDOWN;
    export const ICE_FAILED = JitsiConferenceErrors.ICE_FAILED;
    export const INCOMPATIBLE_SERVER_VERSIONS = JitsiConferenceErrors.INCOMPATIBLE_SERVER_VERSIONS;
    export const OFFER_ANSWER_FAILED = JitsiConferenceErrors.OFFER_ANSWER_FAILED;
    export const PASSWORD_NOT_SUPPORTED = JitsiConferenceErrors.PASSWORD_NOT_SUPPORTED;
    export const PASSWORD_REQUIRED = JitsiConferenceErrors.PASSWORD_REQUIRED;
    export const RESERVATION_ERROR = JitsiConferenceErrors.RESERVATION_ERROR;
    export const VIDEOBRIDGE_NOT_AVAILABLE = JitsiConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE;
}
declare module "JitsiConferenceEvents" {
    export enum JitsiConferenceEvents {
        /**
         * Event indicates that the current conference audio input switched between audio
         * input states,i.e. with or without audio input.
         */
        AUDIO_INPUT_STATE_CHANGE = "conference.audio_input_state_changed",
        /**
         * Event indicates that the permission for unmuting audio has changed based on the number of audio senders in the
         * call and the audio sender limit configured in Jicofo.
         */
        AUDIO_UNMUTE_PERMISSIONS_CHANGED = "conference.audio_unmute_permissions_changed",
        /**
         * Indicates that authentication status changed.
         */
        AUTH_STATUS_CHANGED = "conference.auth_status_changed",
        /**
         * The local participant was approved to be able to unmute.
         * @param {options} event - {
         *     {MediaType} mediaType
         * }.
         */
        AV_MODERATION_APPROVED = "conference.av_moderation.approved",
        /**
         * AV Moderation was enabled/disabled. The actor is the participant that is currently in the meeting,
         * or undefined if that participant has left the meeting.
         *
         * @param {options} event - {
         *     {boolean} enabled,
         *     {MediaType} mediaType,
         *     {JitsiParticipant} actor
         * }.
         */
        AV_MODERATION_CHANGED = "conference.av_moderation.changed",
        /**
         * AV Moderation, report for user being approved to unmute.
         * @param {options} event - {
         *     {JitsiParticipant} participant,
         *     {MediaType} mediaType
         * }.
         */
        AV_MODERATION_PARTICIPANT_APPROVED = "conference.av_moderation.participant.approved",
        /**
         * AV Moderation, report for user being blocked to unmute.
         * @param {options} event - {
         *     {JitsiParticipant} participant,
         *     {MediaType} mediaType
         * }.
         */
        AV_MODERATION_PARTICIPANT_REJECTED = "conference.av_moderation.participant.rejected",
        /**
         * The local participant was blocked to be able to unmute.
         * @param {options} event - {
         *     {MediaType} mediaType
         * }.
         */
        AV_MODERATION_REJECTED = "conference.av_moderation.rejected",
        /**
         * Fired just before the statistics module is disposed and it's the last chance
         * to submit some logs to the statistics service before it's disconnected.
         */
        BEFORE_STATISTICS_DISPOSED = "conference.beforeStatisticsDisposed",
        /**
         * Event indicates that the bot participant type changed.
         */
        BOT_TYPE_CHANGED = "conference.bot_type_changed",
        /**
         * Event fired when a participant is requested to join a given (breakout) room.
         */
        BREAKOUT_ROOMS_MOVE_TO_ROOM = "conference.breakout-rooms.move-to-room",
        /**
         * Event fired when the breakout rooms data was updated.
         */
        BREAKOUT_ROOMS_UPDATED = "conference.breakout-rooms.updated",
        /**
         * Event fired when the bandwidth estimation stats are received from the bridge.
         */
        BRIDGE_BWE_STATS_RECEIVED = "conference.bridgeBweStatsReceived",
        /**
         * UTC conference timestamp when first participant joined.
         */
        CONFERENCE_CREATED_TIMESTAMP = "conference.createdTimestamp",
        /**
         * Indicates that an error occurred.
         */
        CONFERENCE_ERROR = "conference.error",
        /**
         * Indicates that conference failed.
         */
        CONFERENCE_FAILED = "conference.failed",
        /**
         * Indicates that conference has been joined. The event does NOT provide any
         * parameters to its listeners.
         */
        CONFERENCE_JOINED = "conference.joined",
        /**
         * Indicates that conference is in progress of joining.
         */
        CONFERENCE_JOIN_IN_PROGRESS = "conference.join_in_progress",
        /**
         * Indicates that conference has been left.
         */
        CONFERENCE_LEFT = "conference.left",
        /**
         * Indicates that the conference unique identifier has been set.
         */
        CONFERENCE_UNIQUE_ID_SET = "conference.unique_id_set",
        /**
         * Indicates that the aggregate set of codecs supported by the visitors has changed.
         */
        CONFERENCE_VISITOR_CODECS_CHANGED = "conference.visitor_codecs_changed",
        /**
         * Indicates that the connection to the conference has been established
         * XXX This is currently fired when the *ICE* connection enters 'connected'
         * state for the first time.
         */
        CONNECTION_ESTABLISHED = "conference.connectionEstablished",
        /**
         * Indicates that the connection to the conference has been interrupted for some
         * reason.
         * XXX This is currently fired when the *ICE* connection is interrupted.
         */
        CONNECTION_INTERRUPTED = "conference.connectionInterrupted",
        /**
         * Indicates that the connection to the conference has been restored.
         * XXX This is currently fired when the *ICE* connection is restored.
         */
        CONNECTION_RESTORED = "conference.connectionRestored",
        /**
         * A connection to the video bridge's data channel has been closed.
         * This event is only emitted in
         */
        DATA_CHANNEL_CLOSED = "conference.dataChannelClosed",
        /**
         * A connection to the video bridge's data channel has been established.
         */
        DATA_CHANNEL_OPENED = "conference.dataChannelOpened",
        /**
         * A user has changed it display name
         */
        DISPLAY_NAME_CHANGED = "conference.displayNameChanged",
        /**
         * The dominant speaker was changed.
         */
        DOMINANT_SPEAKER_CHANGED = "conference.dominantSpeaker",
        /**
         * Indicates that DTMF support changed.
         */
        DTMF_SUPPORT_CHANGED = "conference.dtmfSupportChanged",
        E2EE_VERIFICATION_AVAILABLE = "conference.e2ee.verification.available",
        E2EE_VERIFICATION_COMPLETED = "conference.e2ee.verification.completed",
        E2EE_VERIFICATION_READY = "conference.e2ee.verification.ready",
        /**
         * Indicates that the encode time stats for the local video sources has been received.
         */
        ENCODE_TIME_STATS_RECEIVED = "conference.encode_time_stats_received",
        /**
         * Indicates that a message from another participant is received on data
         * channel.
         */
        ENDPOINT_MESSAGE_RECEIVED = "conference.endpoint_message_received",
        /**
         * Indicates that a message for the remote endpoint statistics has been received on the bridge channel.
         */
        ENDPOINT_STATS_RECEIVED = "conference.endpoint_stats_received",
        /**
         * Event emitted when a list file is received in the conference. This event is fired when a participant joins
         * and the file list is sent to them.
         * @param {Map<String, IFileMetadata>} files - The map of files received in the conference with key the file ID.
         */
        FILE_SHARING_FILES_RECEIVED = "conference.file_sharing.files_received",
        /**
         * Event emitted when a file is added to the conference.
         * @param {IFileMetadata} file - The file object containing metadata about the file.
         */
        FILE_SHARING_FILE_ADDED = "conference.file_sharing.file_added",
        /**
         * Event emitted when a file is removed from the conference.
         * @param {String} fileId - The ID of the file that was removed.
         */
        FILE_SHARING_FILE_REMOVED = "conference.file_sharing.file_removed",
        /**
         * The forwarded sources set is changed.
         *
         * @param {Array<string>} leavingForwardedSources the sourceNames of all the tracks which are leaving forwarded
         * sources
         * @param {Array<string>} enteringForwardedSources the sourceNames of all the tracks which are entering forwarded
         * sources
         */
        FORWARDED_SOURCES_CHANGED = "conference.forwardedSourcesChanged",
        /**
         * Indicates that inbound video stats have been received for remote video streams that are receiving
         * media bytes but decoding no frames. Fired when at least one such stream exists, and once more with an
         * empty map when all previously-failing streams have recovered (all-clear signal).
         *
         * @param {TraceablePeerConnection} tpc - The peer connection.
         * @param {Map<number, { bitrateDownload: number, fps: number, participantId: string }>} stats - Stats per SSRC.
         */
        INBOUND_VIDEO_STATS_RECEIVED = "conference.inbound_video_stats_received",
        /**
         * You are kicked from the conference.
         * @param {JitsiParticipant} the participant that initiated the kick.
         */
        KICKED = "conference.kicked",
        /**
         * The Last N set is changed.
         *
         * @param {Array<string>|null} leavingEndpointIds the ids of all the endpoints
         * which are leaving Last N
         * @param {Array<string>|null} enteringEndpointIds the ids of all the endpoints
         * which are entering Last N
         */
        LAST_N_ENDPOINTS_CHANGED = "conference.lastNEndpointsChanged",
        /**
         * A new user joined the lobby room.
         */
        LOBBY_USER_JOINED = "conference.lobby.userJoined",
        /**
         * A user left the lobby room.
         */
        LOBBY_USER_LEFT = "conference.lobby.userLeft",
        /**
         * A user from the lobby room has been update.
         */
        LOBBY_USER_UPDATED = "conference.lobby.userUpdated",
        /**
         * Indicates that the room has been locked or unlocked.
         */
        LOCK_STATE_CHANGED = "conference.lock_state_changed",
        /**
         * Indicates that the conference had changed to members only enabled/disabled.
         * The first argument of this event is a <tt>boolean</tt> which when set to
         * <tt>true</tt> means that the conference is running in members only mode.
         * You may need to use Lobby if supported to ask for permissions to enter the conference.
         */
        MEMBERS_ONLY_CHANGED = "conference.membersOnlyChanged",
        /**
         * New text message was received.
         */
        MESSAGE_RECEIVED = "conference.messageReceived",
        /**
         * Event fired when the conference metadata is updated.
         */
        METADATA_UPDATED = "conference.metadata.updated",
        /**
         * Event indicates that the current microphone used by the conference is noisy.
         */
        NOISY_MIC = "conference.noisy_mic",
        /**
         * Indicates that a message from the local user or from the Prosody backend
         * was received on the data channel.
         */
        NON_PARTICIPANT_MESSAGE_RECEIVED = "conference.non_participant_message_received",
        /**
         * Event indicates that the current selected input device has no signal
         */
        NO_AUDIO_INPUT = "conference.no_audio_input",
        /**
         * Indicates that the conference has switched between JVB and P2P connections.
         * The first argument of this event is a <tt>boolean</tt> which when set to
         * <tt>true</tt> means that the conference is running on the P2P connection.
         */
        P2P_STATUS = "conference.p2pStatus",
        /**
         * Indicates that the features of the participant has been changed.
         * TODO: there is a spelling mistake in this event name and associated constants
         */
        PARTCIPANT_FEATURES_CHANGED = "conference.partcipant_features_changed",
        /**
         * Participant was kicked from the conference.
         * @param {JitsiParticipant} the participant that initiated the kick.
         * @param {JitsiParticipant} the participant that was kicked.
         */
        PARTICIPANT_KICKED = "conference.participant_kicked",
        /**
         * Indicates that a value of a specific property of a specific participant
         * has changed.
         */
        PARTICIPANT_PROPERTY_CHANGED = "conference.participant_property_changed",
        /**
         * Indicates the state of sources attached to a given remote participant has changed.
         */
        PARTICIPANT_SOURCE_UPDATED = "conference.participant_source_updated",
        /**
         * Indicates that the permissions for the local participant were updated.
         */
        PERMISSIONS_RECEIVED = "conference.permissions_received",
        /**
         * Indicates that phone number changed.
         */
        PHONE_NUMBER_CHANGED = "conference.phoneNumberChanged",
        /**
         * An answer for a pool was received.
         */
        POLL_ANSWER_RECEIVED = "conference.pollAnswerReceived",
        /**
         * A new poll was received or a poll is loaded from the history.
         */
        POLL_RECEIVED = "conference.pollReceived",
        /**
         * New private text message was received.
         */
        PRIVATE_MESSAGE_RECEIVED = "conference.privateMessageReceived",
        /**
         * The conference properties changed.
         */
        PROPERTIES_CHANGED = "conference.propertiesChanged",
        /**
         * New reaction was received.
         */
        REACTION_RECEIVED = "conference.reactionReceived",
        /**
         * Indicates that recording state changed.
         */
        RECORDER_STATE_CHANGED = "conference.recorderStateChanged",
        /**
         * Indicates that the region of the media server (jitsi-videobridge) that we
         * are connected to changed (or was initially set).
         */
        SERVER_REGION_CHANGED = "conference.server_region_changed",
        /**
         * Indicates a user has joined without audio
         */
        SILENT_STATUS_CHANGED = "conference.silentStatusChanged",
        /**
         * Indicates that start muted settings changed.
         */
        START_MUTED_POLICY_CHANGED = "conference.start_muted_policy_changed",
        /**
         * Indicates that subject of the conference has changed.
         */
        SUBJECT_CHANGED = "conference.subjectChanged",
        /**
         * Indicates that DTMF support changed.
         */
        SUSPEND_DETECTED = "conference.suspendDetected",
        /**
         * Event indicates that local user is talking while he muted himself
         */
        TALK_WHILE_MUTED = "conference.talk_while_muted",
        /**
         * A new media track was added to the conference. The event provides the
         * following parameters to its listeners:
         *
         * @param {JitsiTrack} track the added JitsiTrack
         */
        TRACK_ADDED = "conference.trackAdded",
        /**
         * Audio levels of a media track ( attached to the conference) was changed.
         */
        TRACK_AUDIO_LEVEL_CHANGED = "conference.audioLevelsChanged",
        /**
         * A media track ( attached to the conference) mute status was changed.
         * @param {JitsiParticipant|null} the participant that initiated the mute
         * if it is a remote mute.
         */
        TRACK_MUTE_CHANGED = "conference.trackMuteChanged",
        /**
         * The media track was removed from the conference. The event provides the
         * following parameters to its listeners:
         *
         * @param {JitsiTrack} track the removed JitsiTrack
         */
        TRACK_REMOVED = "conference.trackRemoved",
        /**
         * The source-add for unmuting of a media track was rejected by Jicofo.
         *
         */
        TRACK_UNMUTE_REJECTED = "conference.trackUnmuteRejected",
        /**
         * Notifies for transcription status changes. The event provides the
         * following parameters to its listeners:
         *
         * @param {String} status - The new status.
         */
        TRANSCRIPTION_STATUS_CHANGED = "conference.transcriptionStatusChanged",
        /**
         * A new user joined the conference.
         */
        USER_JOINED = "conference.userJoined",
        /**
         * A user has left the conference.
         */
        USER_LEFT = "conference.userLeft",
        /**
         * User role changed.
         */
        USER_ROLE_CHANGED = "conference.roleChanged",
        /**
         * User status changed.
         */
        USER_STATUS_CHANGED = "conference.statusChanged",
        /**
         * Indicates that the video codec of the local video track has changed.
         */
        VIDEO_CODEC_CHANGED = "conference.videoCodecChanged",
        /**
         * Indicates that video SIP GW state changed.
         * @param {VideoSIPGWConstants} status.
         */
        VIDEO_SIP_GW_AVAILABILITY_CHANGED = "conference.videoSIPGWAvailabilityChanged",
        /**
         * Indicates that video SIP GW Session state changed.
         * @param {options} event - {
         *     {string} address,
         *     {VideoSIPGWConstants} oldState,
         *     {VideoSIPGWConstants} newState,
         *     {string} displayName
         * }.
         */
        VIDEO_SIP_GW_SESSION_STATE_CHANGED = "conference.videoSIPGWSessionStateChanged",
        /**
         * Event indicates that the permission for unmuting video has changed based on the number of video senders in the
         * call and the video sender limit configured in Jicofo.
         */
        VIDEO_UNMUTE_PERMISSIONS_CHANGED = "conference.video_unmute_permissions_changed",
        /**
         * Event indicating we have received a message from the visitors component.
         */
        VISITORS_MESSAGE = "conference.visitors_message",
        /**
         * Event indicating that our request for promotion was rejected.
         */
        VISITORS_REJECTION = "conference.visitors_rejection",
        /**
         * Indicates that the conference has support for visitors.
         */
        VISITORS_SUPPORTED_CHANGED = "conference.visitorsSupported",
        /**
         * An event(library-private) fired when the conference switches the currently active media session.
         * @private
         */
        _MEDIA_SESSION_ACTIVE_CHANGED = "conference.media_session.active_changed",
        /**
         * An event(library-private) fired when a new media session is added to the conference.
         * @private
         */
        _MEDIA_SESSION_STARTED = "conference.media_session.started"
    }
}
declare module "JitsiTrackEvents" {
    export enum JitsiTrackEvents {
        /**
         * The media track was removed to the conference.
         */
        LOCAL_TRACK_STOPPED = "track.stopped",
        /**
         * Indicates that the local audio track is not receiving any audio input from
         * the microphone that is currently selected.
         */
        NO_AUDIO_INPUT = "track.no_audio_input",
        /**
         * Indicates that the track is not receiving any data even though we expect it
         * to receive data (i.e. the stream is not stopped).
         */
        NO_DATA_FROM_SOURCE = "track.no_data_from_source",
        /**
         * Audio levels of a this track was changed.
         * The first argument is a number with audio level value in range [0, 1].
         * The second argument is a <tt>TraceablePeerConnection</tt> which is the peer
         * connection which measured the audio level (one audio track can be added
         * to multiple peer connection at the same time). This argument is optional for
         * local tracks for which we can measure audio level without the peer
         * connection (the value will be <tt>undefined</tt>).
         *
         * NOTE The second argument should be treated as library internal and can be
         * removed at any time.
         */
        TRACK_AUDIO_LEVEL_CHANGED = "track.audioLevelsChanged",
        /**
         * The audio output of the track was changed.
         */
        TRACK_AUDIO_OUTPUT_CHANGED = "track.audioOutputChanged",
        /**
         * A media track mute status was changed.
         */
        TRACK_MUTE_CHANGED = "track.trackMuteChanged",
        /**
         * Indicates that a new owner has been assigned to a remote track when SSRC rewriting is enabled.
         */
        TRACK_OWNER_SET = "track.owner_set",
        /**
         * Event fired whenever video track's streaming changes.
         * First argument is the sourceName of the track and the second is a string indicating if the connection is
         * currently
         * - active - the connection is active.
         * - inactive - the connection is inactive, was intentionally interrupted by the bridge because of low BWE or
         *   because of the endpoint falling out of last N.
         * - interrupted - a network problem occurred.
         * - restoring - the connection was inactive and is restoring now.
         *
         * The current status value can be obtained by calling JitsiRemoteTrack.getTrackStreamingStatus().
         */
        TRACK_STREAMING_STATUS_CHANGED = "track.streaming_status_changed",
        /**
         * The video type("camera" or "desktop") of the track was changed.
         */
        TRACK_VIDEOTYPE_CHANGED = "track.videoTypeChanged"
    }
}
declare module "service/RTC/MediaType" {
    export enum MediaType {
        /**
         * The application type (data over bridge channel).
         */
        APPLICATION = "application",
        /**
         * The audio type.
         */
        AUDIO = "audio",
        /**
         * The desktop video type.
         */
        DESKTOP = "desktop",
        /**
         * The video type.
         */
        VIDEO = "video"
    }
}
declare module "service/RTC/RTCEvents" {
    export enum RTCEvents {
        /**
         * Designates an event indicating that the audio output device has changed.
         */
        AUDIO_OUTPUT_DEVICE_CHANGED = "rtc.audio_output_device_changed",
        /**
         * Designates an event indicating that some audio SSRCs that have already been signaled will now map to new remote
         * sources.
         */
        AUDIO_SSRCS_REMAPPED = "rtc.audio_ssrcs_remapped",
        /**
         * Designates an event indicating that the bridge bandwidth estimation stats have been received.
         */
        BRIDGE_BWE_STATS_RECEIVED = "rtc.bridge_bwe_stats_received",
        /**
         * Indicates that the data channel has been closed.
         */
        DATA_CHANNEL_CLOSED = "rtc.data_channel_closed",
        /**
         * Indicates that the data channel has been opened.
         */
        DATA_CHANNEL_OPEN = "rtc.data_channel_open",
        /**
         * Indicates that the list with available devices is now available.
         */
        DEVICE_LIST_AVAILABLE = "rtc.device_list_available",
        /**
         * Indicates that the list with available devices has changed.
         */
        DEVICE_LIST_CHANGED = "rtc.device_list_changed",
        /**
         * Indicates that the list with available devices will change.
         */
        DEVICE_LIST_WILL_CHANGE = "rtc.device_list_will_change",
        /**
         * Indicates that the dominant speaker has changed.
         */
        DOMINANT_SPEAKER_CHANGED = "rtc.dominant_speaker_changed",
        /**
         * Indicates that the connection status of the endpoint has changed.
         */
        ENDPOINT_CONN_STATUS_CHANGED = "rtc.endpoint_conn_status_changed",
        /**
         * Indicates that a message from another participant is received on data channel.
         */
        ENDPOINT_MESSAGE_RECEIVED = "rtc.endpoint_message_received",
        /**
         * Indicates that the remote endpoint stats have been received on data channel.
         */
        ENDPOINT_STATS_RECEIVED = "rtc.endpoint_stats_received",
        /**
         * Indicates that the list of sources currently being forwarded by the bridge has changed.
         */
        FORWARDED_SOURCES_CHANGED = "rtc.forwarded_sources_changed",
        /**
         * Event emitted when {@link RTC.setLastN} method is called to update with the new value set.
         * The first argument is the value passed to {@link RTC.setLastN}.
         */
        LASTN_VALUE_CHANGED = "rtc.lastn_value_changed",
        /**
         * The max enabled resolution of a local video track was changed.
         */
        LOCAL_TRACK_MAX_ENABLED_RESOLUTION_CHANGED = "rtc.local_track_max_enabled_resolution_changed",
        /**
         * Designates an event indicating that the local ICE username fragment of
         * the jingle session has changed.
         * The first argument of the vent is <tt>TraceablePeerConnection</tt> which
         * is the source of the event.
         * The second argument is the actual "ufrag" string.
         */
        LOCAL_UFRAG_CHANGED = "rtc.local_ufrag_changed",
        /**
         * Event emitted when the user granted/blocked a permission for the camera / mic.
         * Used to keep track of the granted permissions on browsers which don't
         * support the Permissions API.
         */
        PERMISSIONS_CHANGED = "rtc.permissions_changed",
        /**
         * Event fired when we remote track is added to the conference.
         * 1st event argument is the added <tt>JitsiRemoteTrack</tt> instance.
         **/
        REMOTE_TRACK_ADDED = "rtc.remote_track_added",
        REMOTE_TRACK_MUTE = "rtc.remote_track_mute",
        /**
         * Indicates that the remote track has been removed from the conference.
         * 1st event argument is the removed {@link JitsiRemoteTrack} instance.
         */
        REMOTE_TRACK_REMOVED = "rtc.remote_track_removed",
        REMOTE_TRACK_UNMUTE = "rtc.remote_track_unmute",
        /**
         * Designates an event indicating that the local ICE username fragment of the jingle session has changed.
         * The first argument of the vent is <tt>TraceablePeerConnection</tt> which is the source of the event.
         * The second argument is the actual "ufrag" string.
         */
        REMOTE_UFRAG_CHANGED = "rtc.remote_ufrag_changed",
        /**
         * Indicates that sender constraints requested by the bridge for this endpoint have changed.
         */
        SENDER_VIDEO_CONSTRAINTS_CHANGED = "rtc.sender_video_constraints_changed",
        /**
         * Designates an event indicating that some video SSRCs that have already been signaled will now map to new remote
         * sources.
         */
        VIDEO_SSRCS_REMAPPED = "rtc.video_ssrcs_remapped"
    }
}
declare module "service/RTC/VideoType" {
    /**
     * Enumeration of the video types
     */
    export enum VideoType {
        /**
         * The camera video type.
         */
        CAMERA = "camera",
        /**
         * The desktop video type.
         */
        DESKTOP = "desktop",
        /**
         * The high fps desktop video type.
         */
        DESKTOP_HIGH_FPS = "desktop_high_fps"
    }
}
declare module "service/statistics/AnalyticsEvents" {
    /**
     * This class exports constants and factory methods related to the analytics
     * API provided by AnalyticsAdapter. In order for entries in a database to be
     * somewhat easily traceable back to the code which produced them, events sent
     * through analytics should be defined here.
     *
     * Since the AnalyticsAdapter API can be used in different ways, for some events
     * it is more convenient to just define the event name as a constant. For other
     * events a factory function is easier.
     *
     * A general approach for adding a new event:
     * 1. Determine the event type: track, UI, page, or operational. If in doubt use
     * operational.
     * 2. Determine whether the event is related to other existing events, and
     * which fields are desired to be set: name, action, actionSubject, source.
     * 3. If the name is sufficient (the other fields are not important), use a
     * constant. Otherwise use a factory function.
     *
     * Note that the AnalyticsAdapter uses the events passed to its functions for
     * its own purposes, and might modify them. Because of this, factory functions
     * should create new objects.
     *
     */
    export enum AnalyticsEvents {
        /**
         * The "action" value for Jingle events which indicates that the Jingle session
         * was restarted (TODO: verify/fix the documentation)
         */
        ACTION_JINGLE_RESTART = "restart",
        /**
         * The "action" value for Jingle events which indicates that a session-accept
         * timed out (TODO: verify/fix the documentation)
         */
        ACTION_JINGLE_SA_TIMEOUT = "session-accept.timeout",
        /**
         * The "action" value for Jingle events which indicates that a session-initiate
         * was received.
         */
        ACTION_JINGLE_SI_RECEIVED = "session-initiate.received",
        /**
         * The "action" value for Jingle events which indicates that a session-initiate
         * not arrived within a timeout (the value is specified in
         * the {@link JingleSessionPC}.
         */
        ACTION_JINGLE_SI_TIMEOUT = "session-initiate.timeout",
        /**
         * A constant for the "terminate" action for Jingle events. TODO: verify/fix
         * the documentation)
         */
        ACTION_JINGLE_TERMINATE = "terminate",
        /**
         * The "action" value for JVB events which indicates that the ICE connection has failed after 3 restart attempts
         */
        ACTION_JVB_ICE_FAILED = "jvb.ice.failed",
        /**
         * The "action" value for P2P events which indicates that P2P session initiate message has been rejected by the
         * client because the mandatory requirements were not met.
         */
        ACTION_P2P_DECLINED = "decline",
        /**
         * The "action" value for P2P events which indicates that a connection was
         * established (TODO: verify/fix the documentation)
         */
        ACTION_P2P_ESTABLISHED = "established",
        /**
         * The "action" value for P2P events which indicates that something failed.
         */
        ACTION_P2P_FAILED = "failed",
        /**
         * The "action" value for P2P events which indicates that a switch to
         * jitsi-videobridge happened.
         */
        ACTION_P2P_SWITCH_TO_JVB = "switch.to.jvb",
        /**
         * The name of an event which indicates an available device. We send one such
         * event per available device once when the available devices are first known,
         * and every time that they change
         *
         * Properties:
         *      audio_input_device_count: the number of audio input devices available at
         *          the time the event was sent.
         *      audio_output_device_count: the number of audio output devices available
         *          at the time the event was sent.
         *      video_input_device_count: the number of video input devices available at
         *          the time the event was sent.
         *      video_output_device_count: the number of video output devices available
         *          at the time the event was sent.
         *      device_id: an identifier of the device described in this event.
         *      device_group_id:
         *      device_kind: one of 'audioinput', 'audiooutput', 'videoinput' or
         *          'videooutput'.
         *      device_label: a string which describes the device.
         */
        AVAILABLE_DEVICE = "available.device",
        /**
         * This appears to be fired only in certain cases when the XMPP connection
         * disconnects (and it was intentional?). It is currently never observed to
         * fire in production.
         *
         * TODO: document
         *
         * Properties:
         *      message: an error message
         */
        CONNECTION_DISCONNECTED = "connection.disconnected",
        /**
         * Indicates that the user of the application provided feedback in terms of a
         * rating (an integer from 1 to 5) and an optional comment.
         * Properties:
         *      value: the user's rating (an integer from 1 to 5)
         *      comment: the user's comment
         */
        FEEDBACK = "feedback",
        /**
         * Indicates the duration of a particular phase of the ICE connectivity
         * establishment.
         *
         * Properties:
         *      phase: the ICE phase (e.g. 'gathering', 'checking', 'establishment')
         *      value: the duration in milliseconds.
         *      p2p: whether the associated ICE connection is p2p or towards a
         *          jitsi-videobridge
         *      initiator: whether the local Jingle peer is the initiator or responder
         *          in the Jingle session. XXX we probably actually care about the ICE
         *          role (controlling vs controlled), and we assume that this correlates
         *          with the Jingle initiator.
         */
        ICE_DURATION = "ice.duration",
        /**
         * Indicates the difference in milliseconds between the ICE establishment time
         * for the P2P and JVB connections (e.g. a value of 10 would indicate that the
         * P2P connection took 10ms more than JVB connection to establish).
         *
         * Properties:
         *      value: the difference in establishment durations in milliseconds.
         *
         */
        ICE_ESTABLISHMENT_DURATION_DIFF = "ice.establishment.duration.diff",
        /**
         * Indicates that the ICE state has changed.
         *
         * Properties:
         *      state: the ICE state which was entered (e.g. 'checking', 'connected',
         *          'completed', etc).
         *      value: the time in milliseconds (as reported by
         *          window.performance.now()) that the state change occurred.
         *      p2p: whether the associated ICE connection is p2p or towards a
         *          jitsi-videobridge
         *      signalingState: The signaling state of the associated PeerConnection
         *      reconnect: whether the associated Jingle session is in the process of
         *          reconnecting (or is it ICE? TODO: verify/fix the documentation)
         */
        ICE_STATE_CHANGED = "ice.state.changed",
        /**
         * Indicates that no bytes have been sent for the track.
         *
         * Properties:
         *      mediaType: the media type of the local track ('audio' or 'video').
         */
        NO_BYTES_SENT = "track.no-bytes-sent",
        /**
         * Indicates a change in the decoding state of a remote video stream that is receiving media bytes.
         * Fired after the condition persists for at least 3 consecutive stats polling cycles (~30 seconds),
         * and again when the condition resolves.
         *
         * Properties:
         *      stopped: true when frame decoding has stopped while bytes are still received,
         *               false when decoding resumes.
         *      participantId: the ID of the participant whose video stream is affected.
         *      ssrc: the SSRC of the affected stream.
         */
        REMOTE_VIDEO_DECODING = "remote.video.decoding",
        /**
         * Indicates that a track was unmuted (?).
         *
         * Properties:
         *      mediaType: the media type of the local track ('audio' or 'video').
         *      trackType: the type of the track ('local' or 'remote').
         *      value: TODO: document
         */
        TRACK_UNMUTED = "track.unmuted",
        /**
         * The constant which identifies an event of type "operational".
         */
        TYPE_OPERATIONAL = "operational",
        /**
         * The constant which identifies an event of type "page".
         */
        TYPE_PAGE = "page",
        /**
         * The constant which identifies an event of type "track".
         */
        TYPE_TRACK = "track",
        /**
         * The constant which identifies an event of type "ui".
         */
        TYPE_UI = "ui",
        /**
         * Indicates that the video codec changed for a local track.
         *
         * Properties:
         *      value: the video codec mimeType.
         *      videoType: the videoType of local track, whether its 'camera' or 'desktop'.
         */
        VIDEO_CODEC_CHANGED = "quality.video-codec-changed"
    }
    /**
     * Creates an operational event which indicates that we have received a
     * "bridge down" event from jicofo.
     */
    export const createBridgeDownEvent: () => {
        action: string;
        actionSubject: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which indicates that the XMPP connection failed
     * @param errorType TODO
     * @param errorMessage TODO
     * @param detail connection failed details.
     */
    export const createConnectionFailedEvent: (errorType: unknown, errorMessage: unknown, details: object) => {
        action: string;
        attributes: {
            error_message: unknown;
            error_type: unknown;
        };
        type: AnalyticsEvents;
    };
    /**
     * Creates a conference event.
     *
     * @param action - The action of the event.
     * @param attributes - The attributes to be added to the event.
     */
    export const createConferenceEvent: (action: string, attributes: object) => {
        action: string;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an operational event which indicates that a particular connection
     * stage was reached (i.e. the XMPP connection transitioned to the "connected"
     * state).
     *
     * @param stage the stage which was reached
     * @param attributes additional attributes for the event. This should be an
     * object with a "value" property indicating a timestamp in milliseconds
     * relative to the beginning of the document's lifetime.
     *
     */
    export const createConnectionStageReachedEvent: (stage: unknown, attributes: object) => {
        action: string;
        actionSubject: unknown;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an operational event for the end-to-end round trip time to a
     * specific remote participant.
     * @param participantId the ID of the remote participant.
     * @param region the region of the remote participant
     * @param rtt the rtt
     */
    export const createE2eRttEvent: (participantId: unknown, region: unknown, rtt: unknown) => {
        attributes: {
            participant_id: unknown;
            region: unknown;
            rtt: unknown;
        };
        name: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which indicates that the focus has left the MUC.
     */
    export const createFocusLeftEvent: () => {
        action: string;
        actionSubject: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event related to a getUserMedia call.
     *
     * @param action the type of the result that the event represents: 'error',
     * 'success', 'warning', etc.
     * @param attributes the attributes to attach to the event.
     */
    export const createGetUserMediaEvent: (action: "error" | "success" | "warning" | string, attributes?: object) => {
        action: string;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which indicates that the JVB ICE connection has failed event after 3 retries.
     *
     * @param action - The action type of the event.
     * @param attributes - The attributes to be added to the event.
     * @returns - The event object.
     */
    export const createJvbIceFailedEvent: (action: unknown, attributes?: object) => {
        action: unknown;
        attributes: object;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event related to remote participant connection status changes.
     *
     * @param attributes the attributes to attach to the event.
     */
    export const createParticipantConnectionStatusEvent: (attributes?: object) => {
        action: string;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event related to remote track streaming status changes.
     *
     * @param attributes the attributes to attach to the event.
     */
    export const createTrackStreamingStatusEvent: (attributes?: object) => {
        action: string;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event for a Jingle-related event.
     * @param action the action of the event
     * @param attributes attributes to add to the event.
     */
    export const createJingleEvent: (action: unknown, attributes?: object) => {
        action: unknown;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which indicates that a local track was not able to read
     * data from its source (a camera or a microphone).
     *
     * @param mediaType the media type of the local track ('audio' or
     * 'video').
     */
    export const createNoDataFromSourceEvent: (mediaType: "audio" | "video" | string, value: unknown) => {
        action: string;
        attributes: {
            media_type: string;
            value: unknown;
        };
        type: AnalyticsEvents;
    };
    /**
     * Creates an event for a p2p-related event.
     * @param action the action of the event
     * @param attributes attributes to add to the event.
     */
    export const createP2PEvent: (action: unknown, attributes?: object) => {
        action: unknown;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
    /**
     * Indicates that we received a remote command to mute.
     */
    export const createRemotelyMutedEvent: (mediaType: unknown) => {
        action: string;
        mediaType: unknown;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which contains RTP statistics such as RTT and packet loss.
     *
     * All average RTP stats are currently reported under 1 event name, but with
     * different properties that allows to distinguish between a P2P call, a
     * call relayed through TURN or the JVB, and multiparty vs 1:1.
     *
     * The structure of the event is:
     *
     * {
     *      p2p: true,
     *      conferenceSize: 2,
     *      localCandidateType: "relay",
     *      remoteCandidateType: "relay",
     *      transportType: "udp",
     *
     *      // Average RTT of 200ms
     *      "rtt.avg": 200,
     *      "rtt.samples": "[100, 200, 300]",
     *
     *      // Average packet loss of 10%
     *      "packet.loss.avg": 10,
     *      "packet.loss.samples": '[5, 10, 15]'
     *
     *      // Difference in milliseconds in the end-to-end RTT between p2p and jvb.
     *      // The e2e RTT through jvb is 15ms shorter:
     *      "rtt.diff": 15,
     *
     *      // End-to-end RTT through JVB is ms.
     *      "end2end.rtt.avg" = 100
     * }
     *
     * Note that the value of the "samples" properties are (JSON encoded) strings,
     * and not JSON arrays, as events' attributes can not be nested. The samples are
     * currently included for debug purposes only and can be removed anytime soon
     * from the structure.
     *
     * Also note that not all of values are present in each event, as values are
     * obtained and calculated as part of different process/event pipe. For example
     * {@link ConnectionAvgStats} instances are doing the reports for each
     * {@link TraceablePeerConnection} and work independently from the main stats
     * pipe.
     */
    export const createRtpStatsEvent: (attributes: object) => {
        action: string;
        attributes: object;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which contains the round trip time (RTT) to a set of
     * regions.
     *
     * @param attributes
     */
    export const createRttByRegionEvent: (attributes: object) => {
        action: string;
        attributes: object;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which contains the local and remote ICE candidate types
     * for the transport that is currently selected.
     *
     * @param attributes
     */
    export const createTransportStatsEvent: (attributes: object) => {
        action: string;
        attributes: object;
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which contains information about the audio output problem (the user id of the affected participant,
     * the local audio levels and the remote audio levels that triggered the event).
     *
     * @param userID - The user id of the affected participant.
     * @param localAudioLevels - The local audio levels.
     * @param remoteAudioLevels - The audio levels received from the participant.
     */
    export const createAudioOutputProblemEvent: (userID: string, localAudioLevels: unknown, remoteAudioLevels: unknown) => {
        action: string;
        attributes: {
            localAudioLevels: unknown;
            remoteAudioLevels: unknown;
            userID: string;
        };
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which contains an information related to the bridge channel close event.
     *
     * @param code - A code from {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
     * @param reason - A string which describes the reason for closing the bridge channel.
     */
    export const createBridgeChannelClosedEvent: (code: string, reason: string) => {
        action: string;
        attributes: {
            code: string;
            reason: string;
        };
        type: AnalyticsEvents;
    };
    /**
     * Creates an event which indicates the Time To First Media (TTFM).
     * It is measured in milliseconds relative to the beginning of the document's
     * lifetime (i.e. the origin used by window.performance.now()), and it excludes
     * the following:
     * 1. The delay due to getUserMedia()
     * 2. The period between the MUC being joined and the reception of the Jingle
     * session-initiate from jicofo. This is because jicofo will not start a Jingle
     * session until there are at least 2 participants in the room.
     *
     * @param attributes the attributes to add to the event. Currently used fields:
     *      mediaType: the media type of the local track ('audio' or 'video').
     *      muted: whether the track has ever been muted (?)
     *      value: the TTMF in milliseconds.
     */
    export const createTtfmEvent: (attributes: object) => {
        action: string;
        actionSubject: unknown;
        attributes: object;
        source: string;
        type: AnalyticsEvents;
    };
}
declare module "modules/browser/BrowserCapabilities" {
    import { BrowserDetection } from '@jitsi/js-utils/browser-detection';
    /**
     * Implements browser capabilities for lib-jitsi-meet.
     */
    export default class BrowserCapabilities extends BrowserDetection {
        /**
         * Returns the version of an ios browser.
         *
         * @returns {Number}
         */
        _getIOSVersion(): number;
        /**
         * Returns the version of a Safari browser.
         *
         * @returns {Number}
         */
        _getSafariVersion(): number;
        /**
         * Tells whether or not the <tt>MediaStream/tt> is removed from the <tt>PeerConnection</tt> and disposed on video
         * mute (in order to turn off the camera device). This is needed on Firefox because of the following bug
         * https://bugzilla.mozilla.org/show_bug.cgi?id=1735951
         *
         * @return {boolean} <tt>true</tt> if the current browser supports this strategy or <tt>false</tt> otherwise.
         */
        doesVideoMuteByStreamRemove(): boolean;
        /**
         * Checks if the client is running on an Android browser.
         *
         * @returns {boolean}
         */
        isAndroidBrowser(): boolean;
        /**
         * Checks if the current platform is iOS.
         *
         * @returns {boolean}
         */
        isIosBrowser(): boolean;
        /**
         * Checks if the client is running on a mobile device.
         *
         * @returns {boolean}
         */
        isMobileDevice(): boolean;
        /**
         * Checks whether current running context is a Trusted Web Application.
         *
         * @returns {boolean} Whether the current context is a TWA.
         */
        isTwa(): boolean;
        /**
         * Checks if the current browser is supported.
         *
         * @returns {boolean} true if the browser is supported, false otherwise.
         */
        isSupported(): boolean;
        /**
         * Returns whether the browser is supported for Android.
         *
         * @returns {boolean} true if the browser is supported for Android devices.
         */
        isSupportedAndroidBrowser(): boolean;
        /**
         * Returns whether the browser is supported for iOS.
         *
         * @returns {boolean} true if the browser is supported for iOS devices.
         */
        isSupportedIOSBrowser(): boolean;
        /**
         * Returns whether or not the current environment needs a user interaction
         * with the page before any unmute can occur.
         *
         * @returns {boolean}
         */
        isUserInteractionRequiredForUnmute(): boolean;
        /**
         * Checks if the current browser triggers 'onmute'/'onunmute' events when
         * user's connection is interrupted and the video stops playback.
         *
         * Chrome M144+ regression: mute/unmute events no longer fire for video tracks
         * when frames stop flowing. See: https://issues.chromium.org/issues/489023910
         *
         * @returns {boolean} 'true' if the event is supported or 'false' otherwise.
         */
        supportsVideoMuteOnConnInterrupted(): boolean;
        /**
         * Checks if the current browser reports upload and download bandwidth statistics.
         *
         * @return {boolean}
         */
        supportsBandwidthStatistics(): boolean;
        /**
         * Checks if the current browser supports setting codec preferences on the transceiver.
         *
         * @returns {boolean}
         */
        supportsCodecPreferences(): boolean;
        /**
         * Checks if the browser supports the new codec selection API, i.e., checks if dictionary member
         * RTCRtpEncodingParameters.codec as defined in
         * https://w3c.github.io/webrtc-extensions/#dom-rtcrtpencodingparameters-codec is supported by the browser. It
         * allows the application to change the current codec used by each RTCRtpSender without a renegotiation.
         *
         * @returns {boolean}
         */
        supportsCodecSelectionAPI(): boolean;
        /**
         * Returns true if the browser supports Dependency Descriptor header extension.
         *
         * @returns {boolean}
         */
        supportsDDExtHeaders(): boolean;
        /**
         * Checks if the current browser support the device change event.
         * @return {boolean}
         */
        supportsDeviceChangeEvent(): boolean;
        /**
         * Checks if the current browser supports audio level stats on the receivers.
         *
         * @return {boolean}
         */
        supportsReceiverStats(): boolean;
        /**
         * Checks if the current browser reports round trip time statistics for the ICE candidate pair.
         *
         * @return {boolean}
         */
        supportsRTTStatistics(): boolean;
        /**
         * Returns true on Firefox 110+, where RTCRtpTransceiverInit.sendEncodings is honored.
         *
         * @returns {boolean}
         */
        supportsEncodingsConfig(): boolean;
        /**
         * Returns true if the browser supports the new Scalability Mode API for VP9/AV1 simulcast and full SVC. H.264
         * simulcast will also be supported by the jvb for this version because the bridge is able to read the Dependency
         * Descriptor RTP header extension to extract layers information for H.264 as well.
         *
         * @returns {boolean}
         */
        supportsScalabilityModeAPI(): boolean;
        /**
         * Returns true if the browser supports track based statistics for the local video track. Otherwise,
         * track resolution and framerate will be calculated based on the 'outbound-rtp' statistics.
         *
         * @returns {boolean}
         */
        supportsTrackBasedStats(): boolean;
        /**
         * Returns true if VP9 is supported by the client on the browser. VP9 is currently disabled on Safari
         * and older versions of Firefox because of issues. Please check https://bugs.webkit.org/show_bug.cgi?id=231074 for
         * details.
         *
         * @returns {boolean}
         */
        supportsVP9(): boolean;
        /**
         * Returns true if SVC is supported.
         *
         * @returns {boolean}
         */
        supportsSVC(): boolean;
        /**
         * Checks if the browser uses SDP munging for turning on simulcast.
         *
         * @returns {boolean}
         */
        usesSdpMungingForSimulcast(): boolean;
        /**
         * Checks if the browser uses RIDs/MIDs for siganling the simulcast streams
         * to the bridge instead of the ssrcs.
         *
         * @returns {boolean}
         */
        usesRidsForSimulcast(): boolean;
        /**
         * Checks if the browser supports getDisplayMedia.
         *
         * @returns {boolean} {@code true} if the browser supports getDisplayMedia.
         */
        supportsGetDisplayMedia(): boolean;
        /**
         * Checks if the browser supports WebRTC Encoded Transform, an alternative
         * to insertable streams.
         *
         * NOTE: At the time of this writing the only browser supporting this is
         * Safari / WebKit, behind a flag.
         *
         * @returns {boolean} {@code true} if the browser supports it.
         */
        supportsEncodedTransform(): boolean;
        /**
         * Checks if the browser supports insertable streams, needed for E2EE.
         *
         * @returns {boolean} {@code true} if the browser supports insertable streams.
         */
        supportsInsertableStreams(): boolean;
        /**
         * Whether the browser supports the RED format for audio.
         *
         * @returns {boolean} {@code true} if the browser supports RED.
         */
        supportsAudioRed(): boolean;
        /**
         * Checks if the browser supports voice activity detection via the @type {VADAudioAnalyser} service.
         *
         * @returns {boolean}
         */
        supportsVADDetection(): boolean;
        /**
         * Check if the browser supports the RTP RTX feature (and it is usable).
         *
         * @returns {boolean}
         */
        supportsRTX(): boolean;
    }
}
declare module "modules/browser/index" {
    const _default: BrowserCapabilities;
    export default _default;
    import BrowserCapabilities from "modules/browser/BrowserCapabilities";
}
declare module "modules/util/EventEmitter" {
    import { EventEmitter as NodeEventEmitter } from 'events';
    export type EventListener = (...args: any[]) => void;
    /**
     * The class creates our own EventEmitter instance
     */
    export default class EventEmitter extends NodeEventEmitter {
        addEventListener: typeof NodeEventEmitter.prototype.addListener;
        removeEventListener: typeof NodeEventEmitter.prototype.removeListener;
        /**
         * Creates new instance.
         * @constructor
         */
        constructor();
    }
}
declare module "modules/util/Listenable" {
    import EventEmitter, { EventListener } from "modules/util/EventEmitter";
    /**
     * The class implements basic event operations - add/remove listener.
     * NOTE: The purpose of the class is to be extended in order to add
     * this functionality to other classes.
     */
    export default class Listenable {
        /**
         * Creates new instance.
         */
        constructor();
        /**
       * Attaches a handler for events (e.g., "participant joined") in the conference.
       * All possible events are defined in JitsiConferenceEvents.
       * @param {string} eventId - The event ID.
       * @param {Function} handler - Handler for the event.
       */
        on(eventId: string, handler: EventListener): void;
        /**
       * Removes event listener.
       * @param {string} eventId - The event ID.
       * @param {Function} [handler] - Optional, the specific handler to unbind.
       */
        off(eventId: string, handler?: EventListener): void;
        /**
       * Adds a one-time listener function for the event.
       * @param {string} eventId - The event ID.
       * @param {Function} handler - Handler for the event.
       */
        once(eventId: string, handler: EventListener): void;
        /**
         * Alias for on method.
         * @param {string} eventId - The event ID.
         * @param {Function} handler - Handler for the event.
         */
        addEventListener(eventId: string, handler: EventListener): void;
        /**
         * Alias for off method.
         * @param {string} eventId - The event ID.
         * @param {Function} [handler] - Optional, the specific handler to unbind.
         */
        removeEventListener(eventId: string, handler?: EventListener): void;
        /**
         * Adds new cancellable listener.
         * @param {String} eventName the name of the event
         * @param {Function} listener the listener.
         * @returns {Function} - The unsubscribe function.
         */
        addCancellableListener(eventName: string, listener: EventListener): () => void;
        /**
         * Adds new listener.
         * @param {String} eventName the name of the event
         * @param {Function} listener the listener.
         * @returns {EventEmitter} - The emitter, so that calls can be chained.
         */
        addListener(eventName: string, listener: EventListener): EventEmitter;
        /**
         * Removes listener.
         * @param {String} eventName the name of the event that triggers the
         * listener
         * @param {Function} listener the listener.
         * @returns {EventEmitter} - The emitter, so that calls can be chained.
         */
        removeListener(eventName: string, listener: EventListener): EventEmitter;
        /**
         * Emits an event.
         * @param {string} event - event name
         */
        emit(event: string, ...args: any[]): void;
        /**
         * Removes all listeners for the event emitter.
         */
        removeAllListeners(): void;
        /**
         * Returns the number of listeners for the specified event.
         * @param {string} [eventName] - The name of the event.
         * @returns {number} - The number of listeners for the event.
         */
        listenerCount(eventName?: string): number;
    }
}
declare module "modules/util/MathUtil" {
    /**
     * The method will increase the given number by 1. If the given counter is equal
     * or greater to {@link Number.MAX_SAFE_INTEGER} then it will be rolled back to
     * 1.
     * @param {number} number - An integer counter value to be incremented.
     * @return {number} the next counter value increased by 1 (see the description
     * above for exception).
     */
    export function safeCounterIncrement(number: number): number;
    /**
     * Calculates the average value of an Array of numbers.
     *
     * @param {Float32Array} valueArray - Array of numbers.
     * @returns {number} - Number array average.
     */
    export function calculateAverage(valueArray: Float32Array): number;
    /**
     * Calculates a unique hash for a given string similar to Java's
     * implementation of String.hashCode()
     *
     * @param {string} string - String whose hash has to be calculated.
     * @returns {number} - Unique hash code calculated.
     */
    export function hashString(string: string): number;
    /**
     * Returns only the positive values from an array of numbers.
     *
     * @param {Float32Array} valueArray - Array of vad scores.
     * @returns {number[]} - Array of positive numbers.
     */
    export function filterPositiveValues(valueArray: Float32Array): number[];
    /**
     * This class calculates a simple running average that continually changes
     * as more data points are collected and added.
     */
    export class RunningAverage {
        private average;
        private n;
        /**
         * Creates an instance of the running average calculator.
         */
        constructor();
        /**
         * Adds a new data point to the existing set of values and recomputes
         * the running average.
         * @param {number} value
         * @returns {void}
         */
        addNext(value: number): void;
        /**
         * Obtains the average value for the current subset of values.
         * @returns {number} - computed average.
         */
        getAverage(): number;
    }
    /**
     * Subtracts the two numbers passed or returns 0 if any of the arguments are not a number.
     *
     * @param {*} x - The number we subtract from.
     * @param {*} y - The number we subtract.
     * @returns {number} - x - y or 0 if x or y is not a number.
     */
    export function safeSubtract(x: any, y: any): number;
    /**
     * Checks if the given value is a valid number.
     *
     * @param n - The value to check.
     * @returns - `true` if the value is a valid number, `false` otherwise.
     */
    export function isValidNumber(n: any): boolean;
}
declare module "service/RTC/BridgeVideoType" {
    /**
     * Enumeration of the video types that are signaled to the bridge
     * @type {{CAMERA: string, DESKTOP: string, DESKTOP_HIGH_FPS: string, NONE: string}}
     */
    export enum BridgeVideoType {
        /**
         * The camera video type.
         */
        CAMERA = "camera",
        /**
         * The low fps desktop video type.
         */
        DESKTOP = "desktop",
        /**
         * The high fps desktop video type.
         */
        DESKTOP_HIGH_FPS = "desktop_high_fps",
        /**
         * Video type when no local source is present.
         */
        NONE = "none"
    }
}
declare module "service/RTC/ReceiverAudioSubscription" {
    /**
     * Enum representing the audio subscription options for remote audio streams. The Jitsi Vide Bridge will forward the
     * remote audio streams to the client based on the selected subscription option and also based on the route loudest
     * configuration described at
     * https://github.com/jitsi/jitsi-videobridge/blob/master/jvb/src/main/resources/reference.conf#L344
     */
    export enum ReceiverAudioSubscription {
        /**
         * Subscribe to all remote audio streams signaled in the conference.
         */
        ALL = "All",
        /**
         * Subscribe to all remote audio streams signaled in the conference, except for the one that are explicitly
         * excluded.
         */
        EXCLUDE = "Exclude",
        /**
         * Subscribe only to the remote audio streams that are explicitly included in the subscription.
         */
        INCLUDE = "Include",
        /**
         * Do not subscribe to any remote audio streams signaled in the conference.
         */
        NONE = "None"
    }
    /**
     * Interface representing a message for audio subscription updates.
     */
    export interface IReceiverAudioSubscriptionMessage {
        list?: string[];
        mode: ReceiverAudioSubscription;
    }
}
declare module "service/RTC/SignalingLayer" {
    import Listenable from "modules/util/Listenable";
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    export type EndpointId = string;
    export type SourceName = string;
    export interface ISourceInfo {
        muted?: boolean;
        sourceName: SourceName;
        videoType?: string;
    }
    export interface IPeerMediaInfo {
        codecList?: string[];
        codecType?: string;
        muted?: boolean;
        videoType?: string;
    }
    /**
     * Generates a source name.
     *
     * @param {EndpointId} endpointId - Jitsi Endpoint Id.
     * @param {MediaType} mediaType - the media type string.
     * @param {number} trackIdx - Track index (or sender idx? - to be figured out) starting from 0.
     * @returns {SourceName} eg. endpointA-v0
     */
    export function getSourceNameForJitsiTrack(endpointId: EndpointId, mediaType: MediaType, trackIdx: number): SourceName;
    /**
     * Extracts MediaType from give source name (must be in the correct format as generated by
     * {@link getSourceNameForJitsiTrack}).
     *
     * @param {SourceName} sourceName - the source name.
     * @returns {MediaType}
     */
    export function getMediaTypeFromSourceName(sourceName: SourceName): MediaType;
    /**
     * Extracts source index (zero based) from a given source name (must be in the correct format as generated by
     * {@link getSourceNameForJitsiTrack}).
     *
     * @param {SourceName} sourceName - the source name, eg. endpointA-v0.
     * @returns {number}
     */
    export function getSourceIndexFromSourceName(sourceName: SourceName): number;
    /**
     * An object that carries the info about specific media type advertised by
     * participant in the signaling channel.
     * @typedef {Object} IPeerMediaInfo
     * @property {boolean} muted indicates if the media is currently muted
     * @property {VideoType|undefined} videoType the type of the video if applicable
     */
    /**
     * Interface used to expose the information carried over the signaling channel
     * which is not available to the RTC module in the media SDP.
     *
     * @interface SignalingLayer
     */
    export default class SignalingLayer extends Listenable {
        /**
         * Obtains the info about given media advertised in the MUC presence of
         * the participant identified by the given MUC JID.
         * @param {string} owner the MUC jid of the participant for whom
         * {@link PeerMediaInfo} will be obtained.
         * @param {MediaType} mediaType the type of the media for which presence
         * @param {SourceName} sourceName - The name of the source for which the info is to be obtained.
         * info will be obtained.
         * @return {Nullable<IPeerMediaInfo>} presenceInfo an object with media presence
         * info or <tt>null</tt> either if there is no presence available for given
         * JID or if the media type given is invalid.
         *
         * @deprecated This method is to be replaced with getPeerSourceInfo.
         */
        getPeerMediaInfo(owner: string, mediaType: MediaType, sourceName: SourceName): Nullable<IPeerMediaInfo>;
        /**
         * Obtains the info about a source for given name and endpoint ID.
         * @param {EndpointId} owner - The owner's endpoint ID.
         * @param {SourceName} sourceName - The name of the source for which the info is to be obtained.
         * @returns {Optional<ITPCSourceInfo>}
         */
        getPeerSourceInfo(owner: EndpointId, sourceName: SourceName): Optional<ISourceInfo>;
        /**
         * Obtains the endpoint ID for given SSRC.
         * @param {number} ssrc the SSRC number.
         * @return {Nullable<string>} the endpoint ID for given media SSRC.
         */
        getSSRCOwner(ssrc: number): Nullable<string>;
        /**
         * Obtains the source name for given SSRC.
         * @param {number} ssrc the track's SSRC identifier.
         * @returns {Optional<SourceName>} the track's source name.
         */
        getTrackSourceName(ssrc: number): Optional<SourceName>;
        /**
         * Removes the association between a given SSRC and its current owner so that it can re-used when the SSRC gets
         * remapped to another source from a different endpoint.
         * @param {number} ssrc a list of SSRCs.
         */
        removeSSRCOwners(ssrcList: number[]): void;
        /**
         * Set an SSRC owner.
         *
         * @param {number} ssrc - An SSRC to be owned.
         * @param {string} endpointId - Owner's ID (MUC nickname).
         * @param {SourceName} sourceName - The related source name.
         * @throws TypeError if <tt>ssrc</tt> is not a number.
         */
        setSSRCOwner(ssrc: number, endpointId: string, sourceName: SourceName): void;
        /**
         * Adjusts muted status of given track.
         *
         * @param {SourceName} sourceName - the name of the track's source.
         * @param {boolean} muted - the new muted status.
         * @returns {boolean}
         */
        setTrackMuteStatus(sourceName: SourceName, muted: boolean): void;
        /**
         * Sets track's video type.
         * @param {SourceName} sourceName - the track's source name.
         * @param {VideoType} videoType - the new video type.
         * @returns {boolean}
         */
        setTrackVideoType(sourceName: SourceName, videoType: VideoType): void;
        /**
         * Removes the SSRCs associated with a given endpoint from the SSRC owners.
         *
         * @param {string} id endpoint id of the participant leaving the call.
         * @returns {void}
         */
        updateSsrcOwnersOnLeave(id: string): void;
    }
}
declare module "service/RTC/CodecMimeType" {
    /**
     * Enumeration of the codec mime types
     * @type {{AV1: string, H264: string, OPUS: string, RED: string, ULPFEC: string, VP8: string, VP9: string}}
     */
    export enum CodecMimeType {
        /**
         * AV1 codec mime type.
         */
        AV1 = "av1",
        /**
         * The h264 codec mime type.
         */
        H264 = "h264",
        /**
         * The opus codec mime type.
         */
        OPUS = "opus",
        /**
         * The red codec mime type.
         */
        RED = "red",
        /**
         * The ulpfec codec mime type.
         */
        ULPFEC = "ulpfec",
        /**
         * The vp8 codec mime type.
         */
        VP8 = "vp8",
        /**
         * The vp9 codec mime type.
         */
        VP9 = "vp9"
    }
}
declare module "service/RTC/StandardVideoQualitySettings" {
    import { CodecMimeType } from "service/RTC/CodecMimeType";
    export const ASSUMED_BANDWIDTH_BPS = -1;
    export const DEFAULT_LAST_N = 25;
    export const LAST_N_UNLIMITED = -1;
    export const SIM_LAYERS: {
        rid: string;
        scaleFactor: number;
    }[];
    /**
     * The ssrc-group semantics for SSRCs related to the video streams.
     */
    export enum SSRC_GROUP_SEMANTICS {
        FID = "FID",
        SIM = "SIM"
    }
    /**
     * Standard scalability mode settings for different video codecs and the default bitrates.
     */
    export const STANDARD_CODEC_SETTINGS: {
        av1: {
            maxBitratesVideo: {
                fullHd: number;
                high: number;
                low: number;
                none: number;
                ssHigh: number;
                standard: number;
                ultraHd: number;
            };
            scalabilityModeEnabled: boolean;
            useKSVC: boolean;
            useSimulcast: boolean;
        };
        h264: {
            maxBitratesVideo: {
                fullHd: number;
                high: number;
                low: number;
                none: number;
                ssHigh: number;
                standard: number;
                ultraHd: number;
            };
            scalabilityModeEnabled: boolean;
        };
        vp8: {
            maxBitratesVideo: {
                fullHd: number;
                high: number;
                low: number;
                none: number;
                ssHigh: number;
                standard: number;
                ultraHd: number;
            };
            scalabilityModeEnabled: boolean;
        };
        vp9: {
            maxBitratesVideo: {
                fullHd: number;
                high: number;
                low: number;
                none: number;
                ssHigh: number;
                standard: number;
                ultraHd: number;
            };
            scalabilityModeEnabled: boolean;
            useKSVC: boolean;
            useSimulcast: boolean;
        };
    };
    /**
     * Video codecs in descending order of complexity for camera and desktop video types based on the results of manual
     * performance tests on different platforms. When a CPU limitation is encountered, client switches the call to use the
     * next codec in the list.
     */
    export const VIDEO_CODECS_BY_COMPLEXITY: {
        camera: CodecMimeType[];
        desktop: CodecMimeType[];
    };
    /**
     * Standard video resolutions and the corresponding quality level that will be picked for the given resolution.
     * For quality levels:
     * 'high' and above - the encoder will be configured to encode 3 spatial layers.
     * 'standard' - the encoder will be configured to encode 2 spatial laters.
     * 'low' - the encoder will be configured to encode only 1 spatial layer.
     * In all the above cases, each of the layers will again have 3 temporal layers, except for VP8 codec for which only
     * 2 temporal layers are configured by default.
     */
    export const VIDEO_QUALITY_LEVELS: {
        height: number;
        level: string;
    }[];
    /**
     * Enumerate the supported video resolutions.
     */
    export enum VIDEO_QUALITY_SETTINGS {
        FULL = "fullHd",
        HIGH = "high",
        LOW = "low",
        NONE = "none",
        STANDARD = "standard",
        ULTRA = "ultraHd"
    }
}
declare module "service/RTC/MediaDirection" {
    /**
     * Enumeration of the media direction types.
     */
    export enum MediaDirection {
        /**
         * Media is send and receive is suspended.
         */
        INACTIVE = "inactive",
        /**
         * Media is only received from remote peer.
         */
        RECVONLY = "recvonly",
        /**
         * Media is only sent to the remote peer.
         */
        SENDONLY = "sendonly",
        /**
         * Media is sent and received.
         */
        SENDRECV = "sendrecv"
    }
}
declare module "service/xmpp/XMPPEvents" {
    export enum XMPPEvents {
        /**
         * Indicates error while adding ice candidate.
         */
        ADD_ICE_CANDIDATE_FAILED = "xmpp.add_ice_candidate_failed",
        AUDIO_MUTED_BY_FOCUS = "xmpp.audio_muted_by_focus",
        AUTHENTICATION_REQUIRED = "xmpp.authentication_required",
        /**
         * Event fired when we receive a message for AV moderation approved for the local participant.
         */
        AV_MODERATION_APPROVED = "xmpp.av_moderation.approved",
        /**
         * Event fired when the moderation enable/disable changes.
         */
        AV_MODERATION_CHANGED = "xmpp.av_moderation.changed",
        /**
         * Event fired when we receive message that a new jid was approved.
         */
        AV_MODERATION_PARTICIPANT_APPROVED = "xmpp.av_moderation.participant.approved",
        /**
         * Event fired when we receive message that a new jid was rejected.
         */
        AV_MODERATION_PARTICIPANT_REJECTED = "xmpp.av_moderation.participant.rejected",
        /**
         * Event fired when we receive a message for AV moderation.
         */
        AV_MODERATION_RECEIVED = "xmpp.av_moderation.received",
        /**
        * Event fired when we receive a message for AV moderation rejected for the local participant.
        */
        AV_MODERATION_REJECTED = "xmpp.av_moderation.rejected",
        /**
         * Event fired when we receive a message for breakout rooms.
         */
        BREAKOUT_ROOMS_EVENT = "xmpp.breakout-rooms.event",
        /**
         * Event fired when a participant is requested to join a given (breakout) room.
         */
        BREAKOUT_ROOMS_MOVE_TO_ROOM = "xmpp.breakout-rooms.move-to-room",
        /**
         * Event fired when the breakout rooms data was updated.
         */
        BREAKOUT_ROOMS_UPDATED = "xmpp.breakout-rooms.updated",
        BRIDGE_DOWN = "xmpp.bridge_down",
        /**
         * Triggered when 'session-accept' is received from the responder.
         */
        CALL_ACCEPTED = "xmpp.callaccepted.jingle",
        CALL_ENDED = "xmpp.callended.jingle",
        CALL_INCOMING = "xmpp.callincoming.jingle",
        CHAT_ERROR_RECEIVED = "xmpp.chat_error_received",
        CONFERENCE_PROPERTIES_CHANGED = "xmpp.conference_properties_changed",
        /**
         * Event fired when conference creation timestamp is received.
         */
        CONFERENCE_TIMESTAMP_RECEIVED = "xmpp.conference_timestamp_received",
        /**
         * This event is triggered when the ICE connects for the first time.
         */
        CONNECTION_ESTABLISHED = "xmpp.connection.connected",
        CONNECTION_FAILED = "xmpp.connection.failed",
        CONNECTION_ICE_FAILED = "xmpp.connection.ice.failed",
        CONNECTION_INTERRUPTED = "xmpp.connection.interrupted",
        CONNECTION_RESTORED = "xmpp.connection.restored",
        /**
         * Designates an event indicating connection status changes.
         */
        CONNECTION_STATUS_CHANGED = "xmpp.connection.status.changed",
        /**
         * Designates an event indicating that the focus has asked us to disable our
         * desktop share.
         */
        DESKTOP_MUTED_BY_FOCUS = "xmpp.desktop_muted_by_focus",
        DISPLAY_NAME_CHANGED = "xmpp.display_name_changed",
        /**
         * Event for incoming presence error which is for required display name.
         */
        DISPLAY_NAME_REQUIRED = "xmpp.display_name_required",
        /**
         * Chat room instance have been added to Strophe.emuc plugin.
         */
        EMUC_ROOM_ADDED = "xmpp.emuc_room_added",
        /**
         * Chat room instance have been removed from Strophe.emuc plugin.
         */
        EMUC_ROOM_REMOVED = "xmpp.emuc_room_removed",
        ETHERPAD = "xmpp.etherpad",
        /**
         * Event fired when we receive a message for files sharing.
         */
        FILE_SHARING_EVENT = "xmpp.files-sharing.event",
        /**
         * Event emitted when a list file is received in the conference.
         */
        FILE_SHARING_FILES_RECEIVED = "xmpp.files-sharing.list",
        /**
         * Event emitted when a file is added to the conference.
         */
        FILE_SHARING_FILE_ADDED = "xmpp.files-sharing.add",
        /**
         * Event emitted when a file is removed from the conference.
         */
        FILE_SHARING_FILE_REMOVED = "xmpp.files-sharing.remove",
        FOCUS_DISCONNECTED = "xmpp.focus_disconnected",
        FOCUS_LEFT = "xmpp.focus_left",
        GRACEFUL_SHUTDOWN = "xmpp.graceful_shutdown",
        ICE_CONNECTION_STATE_CHANGED = "xmpp.ice_connection_state_changed",
        INVITE_MESSAGE_RECEIVED = "xmpp.invite_message_received",
        /**
         * Event which is emitted when the body in an XMPP message in the MUC
         * contains JSON
         * TODO: this event contains a typo (xmmp vs xmpp) but it's unlikely this can be changed now
         */
        JSON_MESSAGE_RECEIVED = "xmmp.json_message_received",
        /**
         * Designates an event indicating that we were kicked from the XMPP MUC.
         * @param {boolean} isSelfPresence - whether it is for local participant
         * or another participant.
         * @param {string} actorJid - the jid of the participant who was initiator
         * of the kick.
         * @param {?string} participantJid - when it is not a kick for local participant,
         * this is the jid of the participant which was kicked.
         */
        KICKED = "xmpp.kicked",
        LOCAL_ROLE_CHANGED = "xmpp.localrole_changed",
        /**
         * Event fired when the unique meeting id is set.
         */
        MEETING_ID_SET = "xmpp.meeting_id_set",
        MESSAGE_RECEIVED = "xmpp.message_received",
        MUC_DENIED_ACCESS = "xmpp.muc_denied access",
        MUC_DESTROYED = "xmpp.muc_destroyed",
        MUC_JOINED = "xmpp.muc_joined",
        MUC_JOIN_IN_PROGRESS = "xmpp.muc_join_in_progress",
        MUC_LEFT = "xmpp.muc_left",
        MUC_LOBBY_MEMBER_JOINED = "xmpp.muc_lobby_member_joined",
        MUC_LOBBY_MEMBER_LEFT = "xmpp.muc_lobby_member_left",
        MUC_LOBBY_MEMBER_UPDATED = "xmpp.muc_lobby_member_updated",
        MUC_LOCK_CHANGED = "xmpp.muc_lock_changed",
        MUC_MEMBERS_ONLY_CHANGED = "xmpp.muc_members_only_changed",
        MUC_MEMBER_BOT_TYPE_CHANGED = "xmpp.muc_member_bot_type_changed",
        MUC_MEMBER_JOINED = "xmpp.muc_member_joined",
        MUC_MEMBER_LEFT = "xmpp.muc_member_left",
        MUC_ROLE_CHANGED = "xmpp.muc_role_changed",
        MUC_VISITORS_SUPPORTED_CHANGED = "xmpp.muc_visitors_supported_changed",
        P2P_TERMINATION_REQUIRED = "xmpp.p2p.termination_required",
        PARTICIPANT_AUDIO_MUTED = "xmpp.audio_muted",
        /**
         * Indicates that the features of the participant has been changed.
         */
        PARTICIPANT_FEATURES_CHANGED = "xmpp.participant_features_changed",
        PARTICIPANT_VIDEO_MUTED = "xmpp.video_muted",
        PARTICIPANT_VIDEO_TYPE_CHANGED = "xmpp.video_type",
        PASSWORD_REQUIRED = "xmpp.password_required",
        /**
         * Event fired when we receive a self-presence with permissions.
         */
        PERMISSIONS_RECEIVED = "xmpp.permissions_received",
        /**
         * Indicates that phone number changed.
         */
        PHONE_NUMBER_CHANGED = "conference.phoneNumberChanged",
        /**
         * Event fired when we receive an answer for a poll.
         */
        POLLS_ANSWER_EVENT = "xmpp.polls.answer.event",
        /**
         * Event fired when we receive a message for polls.
         */
        POLLS_EVENT = "xmpp.polls.event",
        /**
         * Event fired when we received a poll or polls history event (old-polls).
         */
        POLLS_RECEIVE_EVENT = "xmpp.polls.received.event",
        PRESENCE_RECEIVED = "xmpp.presence_received",
        PRESENCE_STATUS = "xmpp.presence_status",
        PRIVATE_MESSAGE_RECEIVED = "xmpp.private_message_received",
        PROMPT_FOR_LOGIN = "xmpp.prompt_for_login",
        REACTION_RECEIVED = "xmpp.reaction_received",
        READY_TO_JOIN = "xmpp.ready_to_join",
        /**
         * Indicates that recording state changed.
         */
        RECORDER_STATE_CHANGED = "xmpp.recorderStateChanged",
        REMOTE_STATS = "xmpp.remote_stats",
        RESERVATION_ERROR = "xmpp.room_reservation_error",
        ROOM_CONNECT_ERROR = "xmpp.room_connect_error",
        ROOM_CONNECT_MEMBERS_ONLY_ERROR = "xmpp.room_connect_error.members_only",
        ROOM_CONNECT_NOT_ALLOWED_ERROR = "xmpp.room_connect_error.not_allowed",
        ROOM_DISCO_INFO_FAILED = "xmpp.room_disco_info_failed",
        /**
         * Indicates that we have received a reply to our disco-info request for the room.
         */
        ROOM_DISCO_INFO_UPDATED = "xmpp.room_disco_info_updated",
        ROOM_JOIN_ERROR = "xmpp.room_join_error",
        /**
         * Indicates that max users limit has been reached.
         */
        ROOM_MAX_USERS_ERROR = "xmpp.room_max_users_error",
        /**
         * Event fired when we receive a message related to room metadata.
         */
        ROOM_METADATA_EVENT = "xmpp.room-metadata.event",
        /**
         * Event fired when we receive a message related to room metadata.
         */
        ROOM_METADATA_UPDATED = "xmpp.room-metadata.updated",
        SENDING_CHAT_MESSAGE = "xmpp.sending_chat_message",
        SENDING_PRIVATE_CHAT_MESSAGE = "xmpp.sending_private_chat_message",
        /**
         * Event fired after receiving the confirmation about session accept.
         */
        SESSION_ACCEPT = "xmpp.session_accept",
        /**
         * Event fired if we receive an error after sending the session accept.
         */
        SESSION_ACCEPT_ERROR = "xmpp.session_accept_error",
        /**
         * Event fired when we do not get our 'session-accept' acknowledged by
         * Jicofo. It most likely means that there is serious problem with our
         * connection or XMPP server and we should reload the conference.
         *
         * We have seen that to happen in BOSH requests race condition when the BOSH
         * request table containing the 'session-accept' was discarded by Prosody.
         * Jicofo does send the RESULT immediately without any condition, so missing
         * packets means that most likely it has never seen our IQ.
         */
        SESSION_ACCEPT_TIMEOUT = "xmpp.session_accept_timeout",
        SETTINGS_ERROR_RECEIVED = "xmpp.settings_error_received",
        /**
         * Event fired when participant joins a meeting without audio.
         */
        SILENT_STATUS_CHANGED = "xmpp.silent_status_changed",
        /**
         * Event fired after successful sending of jingle source-add.
         */
        SOURCE_ADD = "xmpp.source_add",
        /**
         * Event fired after receiving an error sending of jingle source-add.
         */
        SOURCE_ADD_ERROR = "xmpp.source_add_error",
        /**
         * Event fired after successful sending of jingle source-remove.
         */
        SOURCE_REMOVE = "xmpp.source_remove",
        /**
         * Event fired after receiving an error sending of jingle source-remove.
         */
        SOURCE_REMOVE_ERROR = "xmpp.source_remove_error",
        /**
         * Event fired when speaker stats update message is received.
         */
        SPEAKER_STATS_RECEIVED = "xmpp.speaker_stats_received",
        SUBJECT_CHANGED = "xmpp.subject_changed",
        SUSPEND_DETECTED = "xmpp.suspend_detected",
        /**
         * Notifies for transcription status changes. The event provides the
         * following parameters to its listeners:
         *
         * @param {String} status - The new status.
         */
        TRANSCRIPTION_STATUS_CHANGED = "xmpp.transcription_status_changed",
        /**
         * Event fired when 'transport-info' with new ICE candidates is received.
         */
        TRANSPORT_INFO = "xmpp.transportinfo.jingle",
        VIDEO_MUTED_BY_FOCUS = "xmpp.video_muted_by_focus",
        /**
         * Indicates that video SIP GW state changed.
         *
         * @param {VideoSIPGWStatusConstants} status - Any of the following statuses:
         * STATUS_BUSY, STATUS_AVAILABLE or STATUS_UNDEFINED.
         */
        VIDEO_SIP_GW_AVAILABILITY_CHANGED = "xmpp.videoSIPGWAvailabilityChanged",
        /**
         * Indicates that video SIP GW Session state changed.
         * The statuses are any of the following statuses:
         * STATE_ON, STATE_OFF, STATE_PENDING, STATE_RETRYING, STATE_FAILED.
         * {@see VideoSIPGWStateConstants}
         *
         * @param {options} event - {address, oldState, newState, displayName}.
         */
        VIDEO_SIP_GW_SESSION_STATE_CHANGED = "xmpp.videoSIPGWSessionStateChanged",
        /**
         * Event indicating we have received a message from the visitors component.
         */
        VISITORS_MESSAGE = "xmpp.visitors_message",
        /**
         * Event indicating that our request for promotion was rejected.
         */
        VISITORS_REJECTION = "xmpp.visitors_rejection"
    }
}
declare module "service/xmpp/XMPPExtensioProtocols" {
    export enum XEP {
        /**
         * XEP-0338 - Signals the usage of bundled media, i.e., allows the use of a single set of ICE candidates for
         * multiple media descriptions.
         * https://xmpp.org/extensions/attic/xep-0338-1.0.0.html
         */
        BUNDLE_MEDIA = "urn:xmpp:jingle:apps:grouping:0",
        /**
         * XEP-0320 - Signals the use of DTLS-SRTP in Jingle session.
         * https://xmpp.org/extensions/xep-0320.html
         */
        DTLS_SRTP = "urn:xmpp:jingle:apps:dtls:0",
        /**
         * XEP-0176 - Signaling ICE-UDP transport method.
         * https://xmpp.org/extensions/xep-0176.html
         */
        ICE_UDP_TRANSPORT = "urn:xmpp:jingle:transports:ice-udp:1",
        /**
         * XEP-0166 - Jingle.
         * https://xmpp.org/extensions/xep-0166.html
         */
        JINGLE = "urn:xmpp:jingle:1",
        /**
         * XEP-0327 - Rayo for allowing third-party control over media sessions.
         */
        RAYO = "urn:xmpp:rayo:client:1",
        /**
         * XEP-0167 - Signals support for RTP audio.
         * https://xmpp.org/extensions/xep-0167.html#support
         */
        RTP_AUDIO = "urn:xmpp:jingle:apps:rtp:audio",
        /**
         * XEP-0293 - Signals the use of RTP Feedback Negotiation.
         * https://xmpp.org/extensions/xep-0293.html
         */
        RTP_FEEDBACK = "urn:xmpp:jingle:apps:rtp:rtcp-fb:0",
        /**
         * XEP-0294 - Signals the use of RTP Header Extensions.
         * https://xmpp.org/extensions/xep-0294.html
         */
        RTP_HEADER_EXTENSIONS = "urn:xmpp:jingle:apps:rtp:rtp-hdrext:0",
        /**
         * XEP-0167 - Signals parameters necessary for media sessions using RTP.
         * https://xmpp.org/extensions/xep-0167.html
         */
        RTP_MEDIA = "urn:xmpp:jingle:apps:rtp:1",
        /**
         * XEP-0167 - Signals support for RTP video.
         * https://xmpp.org/extensions/xep-0167.html#support
         */
        RTP_VIDEO = "urn:xmpp:jingle:apps:rtp:video",
        /**
         * XEP-0343 - Signaling WebRTC datachannels (bridge channel) in Jingle that uses DTLS/SCTP on top of ICE.
         * https://xmpp.org/extensions/xep-0343.html
         */
        SCTP_DATA_CHANNEL = "urn:xmpp:jingle:transports:dtls-sctp:1",
        /**
         * XEP-0339 - Signals Source-Specific Media Attributes in Jingle.
         * https://xmpp.org/extensions/xep-0339.html
         */
        SOURCE_ATTRIBUTES = "urn:xmpp:jingle:apps:rtp:ssma:0"
    }
}
declare module "JitsiTrackErrors" {
    /**
     * The errors for the JitsiTrack objects.
     */
    export enum JitsiTrackErrors {
        /**
         * An error which indicates that some of requested constraints in
         * getUserMedia call were not satisfied.
         */
        CONSTRAINT_FAILED = "gum.constraint_failed",
        /**
         * A generic error which indicates an error occurred while selecting
         * a DesktopCapturerSource from the electron app.
         */
        ELECTRON_DESKTOP_PICKER_ERROR = "gum.electron_desktop_picker_error",
        /**
         * An error which indicates a custom desktop picker could not be detected
         * for the electron app.
         */
        ELECTRON_DESKTOP_PICKER_NOT_FOUND = "gum.electron_desktop_picker_not_found",
        /**
         * Generic getUserMedia error.
         */
        GENERAL = "gum.general",
        /**
         * An error which indicates that requested device was not found.
         */
        NOT_FOUND = "gum.not_found",
        /**
         * An error which indicates that user denied permission to share requested
         * device.
         */
        PERMISSION_DENIED = "gum.permission_denied",
        /**
         * Generic error for screensharing failure.
         */
        SCREENSHARING_GENERIC_ERROR = "gum.screensharing_generic_error",
        /**
         * Error in getDisplayMedia when not supported. Can happen in Electron if no
         * permission handler was set.
         */
        SCREENSHARING_NOT_SUPPORTED_ERROR = "gdm.screen_sharing_not_supported",
        /**
         * An error which indicates that user canceled screen sharing window
         * selection dialog.
         */
        SCREENSHARING_USER_CANCELED = "gum.screensharing_user_canceled",
        /**
         * Indicates that the timeout passed to the obtainAudioAndVideoPermissions has expired without GUM resolving.
         */
        TIMEOUT = "gum.timeout",
        /**
         * An error which indicates that track has been already disposed and cannot
         * be longer used.
         */
        TRACK_IS_DISPOSED = "track.track_is_disposed",
        /**
         * An error which indicates that track has no MediaStream associated.
         */
        TRACK_NO_STREAM_FOUND = "track.no_stream_found",
        /**
         * An error which indicates that no tracks were found in the media stream
         */
        TRACK_NO_STREAM_TRACKS_FOUND = "track.no_stream_tracks_found",
        /**
         * An error which indicates that there are too many tracks in the provided media stream
         */
        TRACK_TOO_MANY_TRACKS_IN_STREAM = "track.too_many_tracks_in_stream",
        /**
         * An error which indicates that requested video resolution is not supported
         * by a webcam.
         */
        UNSUPPORTED_RESOLUTION = "gum.unsupported_resolution"
    }
    export const CONSTRAINT_FAILED = JitsiTrackErrors.CONSTRAINT_FAILED;
    export const ELECTRON_DESKTOP_PICKER_ERROR = JitsiTrackErrors.ELECTRON_DESKTOP_PICKER_ERROR;
    export const ELECTRON_DESKTOP_PICKER_NOT_FOUND = JitsiTrackErrors.ELECTRON_DESKTOP_PICKER_NOT_FOUND;
    export const GENERAL = JitsiTrackErrors.GENERAL;
    export const NOT_FOUND = JitsiTrackErrors.NOT_FOUND;
    export const PERMISSION_DENIED = JitsiTrackErrors.PERMISSION_DENIED;
    export const SCREENSHARING_GENERIC_ERROR = JitsiTrackErrors.SCREENSHARING_GENERIC_ERROR;
    export const SCREENSHARING_NOT_SUPPORTED_ERROR = JitsiTrackErrors.SCREENSHARING_NOT_SUPPORTED_ERROR;
    export const SCREENSHARING_USER_CANCELED = JitsiTrackErrors.SCREENSHARING_USER_CANCELED;
    export const TIMEOUT = JitsiTrackErrors.TIMEOUT;
    export const TRACK_IS_DISPOSED = JitsiTrackErrors.TRACK_IS_DISPOSED;
    export const TRACK_NO_STREAM_FOUND = JitsiTrackErrors.TRACK_NO_STREAM_FOUND;
    export const UNSUPPORTED_RESOLUTION = JitsiTrackErrors.UNSUPPORTED_RESOLUTION;
    export const TRACK_TOO_MANY_TRACKS_IN_STREAM = JitsiTrackErrors.TRACK_TOO_MANY_TRACKS_IN_STREAM;
    export const TRACK_NO_STREAM_TRACKS_FOUND = JitsiTrackErrors.TRACK_NO_STREAM_TRACKS_FOUND;
}
declare module "JitsiTrackError" {
    export interface IGumError {
        constraint?: string;
        constraintName?: string;
        message?: string;
        name?: string;
        stack?: string;
    }
    export interface IVideoConstraints {
        mandatory?: {
            [key: string]: string | number;
        };
    }
    export interface IGumOptions {
        video?: IVideoConstraints;
    }
    export interface IGum {
        constraints?: IGumOptions | string;
        devices?: ('audio' | 'video' | 'desktop' | 'screen' | 'audiooutput')[];
        error: IGumError;
    }
    export type DeviceType = 'audio' | 'video' | 'desktop' | 'screen' | 'audiooutput';
    /**
     *
     * Represents an error that occurred to a JitsiTrack. Can represent various
     * types of errors. For error descriptions (@see JitsiTrackErrors).
     */
    export default class JitsiTrackError extends Error {
        gum?: IGum;
        /**
         * @param {IGumError|string} error - error object or error name
         * @param {IGumOptions|string} [options] - getUserMedia constraints object or error message
         * @param {DeviceType[]} [devices] - list of getUserMedia requested devices
         */
        constructor(error: IGumError | string, options?: IGumOptions | string, devices?: DeviceType[]);
        /**
         * Gets failed resolution constraint from corresponding object.
         * @param failedConstraintName - The name of the failed constraint
         * @param constraints - The constraints object
         * @returns The resolution value or empty string
         */
        private getResolutionFromFailedConstraint;
    }
}
declare module "service/RTC/CameraFacingMode" {
    /**
     * The possible camera facing modes. For now support only 'user' and
     * 'environment' because 'left' and 'right' are not used anywhere in our
     * projects at the time of this writing. For more information please refer to
     * https://w3c.github.io/mediacapture-main/getusermedia.html
     * #def-constraint-facingMode.
     *
     * @enum {string}
     */
    export enum CameraFacingMode {
        /**
         * The mode which specifies the environment-facing camera.
         */
        ENVIRONMENT = "environment",
        /**
         * The mode which specifies the user-facing camera.
         */
        USER = "user"
    }
}
declare module "JitsiConnectionEvents" {
    /**
     * The events for the connection.
     */
    export enum JitsiConnectionEvents {
        /**
         * Indicates that the connection has been disconnected. The event provides
         * the following parameters to its listeners:
         *
         * @param msg {string} a message associated with the disconnect such as the
         * last (known) error message
         */
        CONNECTION_DISCONNECTED = "connection.connectionDisconnected",
        /**
         * Indicates that the connection has been established. The event provides
         * the following parameters to its listeners:
         *
         * @param id {string} the ID of the local endpoint/participant/peer (within
         * the context of the established connection)
         */
        CONNECTION_ESTABLISHED = "connection.connectionEstablished",
        /**
         * Indicates that the connection has been failed for some reason. The event
         * provides the following parameters to its listeners:
         *
         * @param errType {JitsiConnectionErrors} the type of error associated with
         * the failure
         * @param errReason {string} the error (message) associated with the failure
         * @param credentials {object} the credentials used to connect (if any)
         * @param errReasonDetails {object} an optional object with details about
         * the error, like shard moving, suspending. Used for analytics purposes.
         */
        CONNECTION_FAILED = "connection.connectionFailed",
        /**
         * The connection is redirected to a visitor node.
         */
        CONNECTION_REDIRECTED = "connection.redirected",
        /**
         * The connection is trying to resume, but token is expired.
         */
        CONNECTION_TOKEN_EXPIRED = "connection.token_expired",
        /**
         * Indicates that the display name is required over this connection and need to be supplied when
         * joining the room.
         * There are cases like lobby room where display name is required.
         */
        DISPLAY_NAME_REQUIRED = "connection.display_name_required",
        /**
         * Indicates that the connection properties have been updated.
         * @param properties {object} - All available connection properties (e.g. shard, region).
         */
        PROPERTIES_UPDATED = "connection.propertiesUpdated"
    }
    export const CONNECTION_DISCONNECTED = JitsiConnectionEvents.CONNECTION_DISCONNECTED;
    export const CONNECTION_ESTABLISHED = JitsiConnectionEvents.CONNECTION_ESTABLISHED;
    export const CONNECTION_FAILED = JitsiConnectionEvents.CONNECTION_FAILED;
    export const CONNECTION_REDIRECTED = JitsiConnectionEvents.CONNECTION_REDIRECTED;
    export const CONNECTION_TOKEN_EXPIRED = JitsiConnectionEvents.CONNECTION_TOKEN_EXPIRED;
    export const DISPLAY_NAME_REQUIRED = JitsiConnectionEvents.DISPLAY_NAME_REQUIRED;
    export const PROPERTIES_UPDATED = JitsiConnectionEvents.PROPERTIES_UPDATED;
}
declare module "modules/flags/FeatureFlags" {
    /**
     * A global module for accessing information about different feature flags state.
     */
    class FeatureFlags {
        private _runInLiteMode;
        private _ssrcRewriting;
        /**
         * Configures the module.
         *
         * @param {object} flags - The feature flags.
         * @param {Optional<boolean>} flags.runInLiteMode - Enables lite mode for testing to disable media decoding.
         * @param {Optional<boolean>} flags.ssrcRewritingEnabled - Use SSRC rewriting.
         */
        init(flags: {
            runInLiteMode?: Optional<boolean>;
            ssrcRewritingEnabled?: Optional<boolean>;
        }): void;
        /**
         * Checks if the run in lite mode is enabled.
         * This will cause any media to be received and not decoded. (Insertable streams are used to discard
         * all media before it is decoded). This can be used for various test scenarios.
         *
         * @returns {boolean}
         */
        isRunInLiteModeEnabled(): boolean;
        /**
         * Checks if the clients supports re-writing of the SSRCs on the media streams by the bridge.
         * @returns {boolean}
         */
        isSsrcRewritingSupported(): boolean;
    }
    const _default: FeatureFlags;
    export default _default;
}
declare module "service/statistics/Events" {
    export enum StatisticsEvents {
        /**
         * Notifies about audio level in RTP statistics by SSRC.
         *
         * @param ssrc - The synchronization source identifier (SSRC) of the
         * endpoint/participant whose audio level is being reported.
         * @param {number} audioLevel - The audio level of <tt>ssrc</tt> according to
         * RTP statistics.
         * @param {boolean} isLocal - <tt>true</tt> if <tt>ssrc</tt> identifies the
         * local endpoint/participant; otherwise, <tt>false</tt>.
         */
        AUDIO_LEVEL = "statistics.audioLevel",
        /**
         * An event fired just before the statistics module gets disposes and it's
         * the last chance to submit logs.
         */
        BEFORE_DISPOSED = "statistics.before_disposed",
        /**
         * An event carrying all statistics by ssrc.
         */
        BYTE_SENT_STATS = "statistics.byte_sent_stats",
        /**
         * An event carrying connection statistics.
         *
         * @param {object} connectionStats - The connection statistics carried by the
         * event such as <tt>bandwidth</tt>, <tt>bitrate</tt>, <tt>packetLoss</tt>,
         * <tt>resolution</tt>, and <tt>transport</tt>.
         */
        CONNECTION_STATS = "statistics.connectionstats",
        /**
         * An event carrying the encode time stats for all the local video sources.
         */
        ENCODE_TIME_STATS = "statistics.encode_time_stats",
        /**
         * An event carrying per-SSRC inbound video stats for remote video streams that are receiving bytes but
         * decoding no frames. Fired in two situations:
         *   1. When at least one such stream exists (stats map is non-empty).
         *   2. Once more with an empty map when the set of failing streams transitions from non-empty to empty,
         *      giving consumers the opportunity to fire resolution events and clean up state.
         * No event is emitted while all remote streams are healthy.
         *
         * @param {TraceablePeerConnection} tpc - The peer connection.
         * @param {Map<number, { bitrateDownload: number, fps: number, participantId: string }>} stats - Stats per SSRC.
         */
        INBOUND_VIDEO_STATS = "statistics.inbound_video_stats"
    }
}
declare module "service/statistics/constants" {
    export const LOCAL_JID = "local";
}
declare module "service/RTC/Resolutions" {
    const Resolutions: {
        '1080': {
            height: number;
            width: number;
        };
        '180': {
            height: number;
            width: number;
        };
        '2160': {
            height: number;
            width: number;
        };
        '240': {
            height: number;
            width: number;
        };
        '360': {
            height: number;
            width: number;
        };
        '480': {
            height: number;
            width: number;
        };
        '4k': {
            height: number;
            width: number;
        };
        '540': {
            height: number;
            width: number;
        };
        '720': {
            height: number;
            width: number;
        };
        fullhd: {
            height: number;
            width: number;
        };
        hd: {
            height: number;
            width: number;
        };
        qhd: {
            height: number;
            width: number;
        };
        vga: {
            height: number;
            width: number;
        };
    };
    export default Resolutions;
}
declare module "modules/RTCStats/RTCStatsEvents" {
    /**
     * Events emitted by the RTCStats module.
     */
    export enum RTCStatsEvents {
        /**
         * Event that indicates that the microphone has been muted or unmuted.
         *
         * @param {boolean} muted - Whether microphone was muted.
         */
        AUDIO_MUTE_CHANGED_EVENT = "audioMutedChanged",
        /**
         * Event that indicates that the video codec on the sender has changed.
         *
         * @param {object} data - The data.
         * @param {CodecMimeType} data.camera - The codec used for camera source.
         * @param {CodecMimeType} data.screenshare - The codec used for screenshare.
         */
        CODEC_CHANGED_EVENT = "codecChanged",
        /**
         * Event that indicates that the conference start timestamp has been received from MUC.
         */
        CONFERENCE_START_TIMESTAMP_EVENT = "conferenceStartTimestamp",
        /**
         * Event that indicates that the current user has become the dominant speaker for the conference.
         */
        DOMINANT_SPEAKER_CHANGED_EVENT = "dominantSpeakerChanged",
        /**
         * Event that indicates that the encode resolution is being restricted by CPU.
         *
         * @param {boolean} restricted - Whether CPU restriction was detected or removed.
         */
        ENCODER_CPU_RESTRICTED_EVENT = "cpuRestricted",
        /**
         * Event that indicates that a getUserMedia call has failed.
         *
         * @param {object} data - The data.
         * @param {string} data.name - The error name (e.g. 'NotAllowedError', 'NotFoundError', 'OverconstrainedError').
         * @param {string} data.message - The error message.
         * @param {string} [data.constraint] - The failed constraint name, when applicable (OverconstrainedError).
         * @param {Array<string>} data.devices - The media types that were requested (e.g. ['audio', 'video', 'desktop']).
         */
        GET_USER_MEDIA_ERROR_EVENT = "getUserMediaError",
        /**
         * Event that indicates that the JVB media session is restarted because of ICE failure.
         */
        JVB_ICE_RESTARTED_EVENT = "jvbIceRestarted",
        /**
         * Event for logging.
         */
        LOG_EVENT = "logs",
        /**
         * Event that indicates that a remote video source's media stream has been interrupted.
         */
        REMOTE_SOURCE_INTERRUPTED_EVENT = "remoteSourceInterrupted",
        /**
         * Event that indicates that a remote video source is suspended by the JVB because of BWE issues.
         */
        REMOTE_SOURCE_SUSPENDED_EVENT = "remoteSourceSuspended",
        /**
         * Event that indicates a change in the decoding state of a remote video stream that is receiving media bytes.
         *
         * @param {object} data - The event data.
         * @param {boolean} data.stopped - True when frame decoding has stopped while bytes are still received,
         * false when decoding resumes.
         * @param {string} data.participantId - The participant whose video stream is affected.
         * @param {number} data.ssrc - The SSRC of the affected stream.
         */
        REMOTE_VIDEO_DECODING_EVENT = "remoteVideoDecoding",
        /**
         * Event emitted when any PeerConnection event is triggered.
         *
         * @param {object} event - The PeerConnection event.
         * @param {string} event.type - The event type.
         * @param {object} event.body - Event body.
         * @param {string} event.body.isP2P - PeerConnection type.
         * @param {string} event.body.state - PeerConnection state change which triggered the event.
         */
        RTC_STATS_PC_EVENT = "rtstats_pc_event",
        /**
         * Event emitted when the websocket connection to the rtcstats server is disconnected.
         */
        RTC_STATS_WC_DISCONNECTED = "rtcstats_ws_disconnected",
        /**
         * Event that indicates that the screenshare has started or stopped.
         *
         * @param {object} data - The data.
         * @param {boolean} data.muted - Whether screenshare was toggled off or on.
         */
        SCREENSHARE_MUTE_CHANGED_EVENT = "screenshareToggled",
        /**
         * Event that indicates that the strophe connection has disconnected.
         */
        STROPHE_DISCONNECTED_EVENT = "stropheDisconnected",
        /**
         * Event that indicates that a strophe error has occurred.
         *
         * @param {object} data - The data.
         */
        STROPHE_ERROR_EVENT = "strophe.error",
        /**
         * Event that indicates that the strophe connection has been re-established.
         */
        STROPHE_RECONNECTED_EVENT = "stropheReconnected",
        /**
         * Event that indicates that the camera has been muted or unmuted.
         *
         * @param {boolean} muted - Whether camera was muted.
         */
        VIDEO_MUTE_CHANGED_EVENT = "videoMutedChanged"
    }
}
declare module "modules/RTC/ScreenObtainer" {
    import JitsiTrackError from "JitsiTrackError";
    /**
     * Interface for screen capture result.
     */
    interface IScreenCaptureResult {
        sourceId: string;
        sourceType?: string;
        stream: MediaStream;
    }
    /**
     * The default frame rate for Screen Sharing.
     */
    export const SS_DEFAULT_FRAME_RATE = 5;
    /**
     * Handles obtaining a stream from a screen capture on different browsers.
     */
    class ScreenObtainer {
        private _electronSkipDisplayMedia;
        obtainStream: Nullable<((onSuccess: (result: IScreenCaptureResult) => void, onFailure: (error: JitsiTrackError) => void, options?: any) => void)>;
        constructor();
        /**
         * Initializes the function used to obtain a screen capture
         * (this.obtainStream).
         *
         * @param {object} options
         */
        private init;
        /**
         * Returns a method which will be used to obtain the screen sharing stream
         * (based on the browser type).
         *
         * @returns {Function}
         * @private
         */
        private _createObtainStreamMethod;
        /**
         * Gets the appropriate constraints for audio sharing.
         *
         * @returns {IAudioQuality | boolean}
         */
        private _getAudioConstraints;
        /**
         * Obtains a screen capture stream on Electron.
         *
         * @param onSuccess - Success callback.
         * @param onFailure - Failure callback.
         * @param {Object} options - Optional parameters.
         */
        private _obtainScreenOnElectron;
        /**
         * Obtains a screen capture stream using getDisplayMedia.
         *
         * @param callback - The success callback.
         * @param errorCallback - The error callback.
         * @param {Object} options - Optional parameters.
         */
        private _obtainScreenFromGetDisplayMedia;
        /** Sets the contentHint on the transmitted MediaStreamTrack to indicate charaterstics in the video stream, which
         * informs RTCPeerConnection on how to encode the track (to prefer motion or individual frame detail).
         *
         * @param {MediaStream} stream - The captured desktop stream.
         * @returns {void}
         */
        setContentHint(stream: MediaStream): void;
        /**
         * Checks whether obtaining a screen capture is supported in the current
         * environment.
         * @returns {boolean}
         */
        isSupported(): boolean;
        /**
         * Sets the max frame rate to be used for a desktop track capture.
         *
         * @param {number} maxFps capture frame rate to be used for desktop tracks.
         * @returns {void}
         */
        setDesktopSharingFrameRate(maxFps: number): void;
    }
    const _default_1: ScreenObtainer;
    export default _default_1;
}
declare module "modules/RTC/RTCUtils" {
    const _default: RTCUtils;
    export default _default;
    /**
     *
     */
    class RTCUtils extends Listenable {
        _initOnce: boolean;
        /**
         * Depending on the browser, sets difference instance methods for
         * interacting with user media and adds methods to native WebRTC-related
         * objects. Also creates an instance variable for peer connection
         * constraints.
         *
         * @param {Object} options
         * @returns {void}
         */
        init(options?: any): void;
        /**
         * Attaches the given media stream to the given element.
         *
         * @param {*} element DOM element.
         * @param {*} stream MediaStream.
         * @returns Promise<void>
         */
        attachMediaStream(element: any, stream: any): any;
        /**
         *
         * @param {Function} callback
         */
        enumerateDevices(callback: Function): void;
        /**
         * Acquires a media stream via getUserMedia that
         * matches the given constraints
         *
         * @param {array} umDevices which devices to acquire (e.g. audio, video)
         * @param {Object} constraints - Stream specifications to use.
         * @param {number} timeout - The timeout in ms for GUM.
         * @returns {Promise}
         */
        _getUserMedia(umDevices: any[], constraints?: any, timeout?: number): Promise<any>;
        /**
         * Acquire a display stream via the screenObtainer. This requires extra
         * logic compared to use screenObtainer versus normal device capture logic
         * in RTCUtils#_getUserMedia.
         *
         * @param {Object} options - Optional parameters.
         * @returns {Promise} A promise which will be resolved with an object which
         * contains the acquired display stream. If desktop sharing is not supported
         * then a rejected promise will be returned.
         */
        _getDesktopMedia(options: any): Promise<any>;
        /**
         * Private utility for determining if the passed in MediaStream contains
         * tracks of the type(s) specified in the requested devices.
         *
         * @param {string[]} requestedDevices - The track types that are expected to
         * be includes in the stream.
         * @param {MediaStream} stream - The MediaStream to check if it has the
         * expected track types.
         * @returns {string[]} An array of string with the missing track types. The
         * array will be empty if all requestedDevices are found in the stream.
         */
        _getMissingTracks(requestedDevices: string[], stream: MediaStream): string[];
        /**
         * Event handler for the 'devicechange' event.
         *
         * @param {MediaDeviceInfo[]} devices - list of media devices.
         * @emits RTCEvents.DEVICE_LIST_CHANGED
         */
        _onMediaDevicesListChanged(devicesReceived: any): void;
        /**
         * Update known devices.
         *
         * @param {Array<Object>} pds - The new devices.
         * @returns {void}
         *
         * NOTE: Use this function as a shared callback to handle both the devicechange event and the
         * polling implementations.
         * This prevents duplication and works around a chrome bug (verified to occur on 68) where devicechange
         * fires twice in a row, which can cause async post devicechange processing to collide.
         */
        _updateKnownDevices(pds: Array<any>): void;
        /**
         * Updates the granted permissions based on the options we requested and the
         * streams we received.
         * @param um the options we requested to getUserMedia.
         * @param stream the stream we received from calling getUserMedia.
         */
        _updateGrantedPermissions(um: any, stream: any): void;
        /**
         * Gets streams from specified device types. This function intentionally
         * ignores errors for upstream to catch and handle instead.
         *
         * @param {Object} options - A hash describing what devices to get and
         * relevant constraints.
         * @param {string[]} options.devices - The types of media to capture. Valid
         * values are "desktop", "audio", and "video".
         * @param {Object} [options.desktopSharingFrameRate]
         * @param {Object} [options.desktopSharingFrameRate.min] - Minimum fps
         * @param {Object} [options.desktopSharingFrameRate.max] - Maximum fps
         * @param {string} [options.desktopSharingSourceDevice] - The device id or
         * label for a video input source that should be used for screensharing.
         * @param {string[]} [options.desktopSharingSources] - The types of sources ("screen", "window", etc)
         * from which the user can select what to share.
         * @param {string} [options.cameraDeviceId] - Camera device id
         * @param {string} [options.micDeviceId] - Microphone device id
         * @param {string} [options.resolution] - Resolution constraints
         * @param {IStreamEffect[]} [options.effects] - Optional effects array for the track
         * @param {ITrackConstraints} [options.constraints] - The constraints to use for
         * the audio and video tracks.
         * @returns {Promise<IStreamInfo[]>} The promise, when successful, will return an array of
         * meta data for the requested device type, which includes the stream and
         * track. If an error occurs, it will be deferred to the caller for
         * handling.
         */
        obtainAudioAndVideoPermissions(options: {
            devices: string[];
            desktopSharingFrameRate?: {
                min?: any;
                max?: any;
            };
            desktopSharingSourceDevice?: string;
            desktopSharingSources?: string[];
            cameraDeviceId?: string;
            micDeviceId?: string;
            resolution?: string;
            effects?: IStreamEffect[];
            constraints?: ITrackConstraints;
        }): Promise<IStreamInfo[]>;
        /**
         * Returns true if changing the input (camera / microphone) or output
         * (audio) device is supported and false if not.
         * @params {string} [deviceType] - type of device to change. Default is
         *      undefined or 'input', 'output' - for audio output device change.
         * @returns {boolean} true if available, false otherwise.
         */
        isDeviceChangeAvailable(deviceType: any): boolean;
        /**
         * A method to handle stopping of the stream.
         * One point to handle the differences in various implementations.
         * @param mediaStream MediaStream object to stop.
         */
        stopMediaStream(mediaStream: any): void;
        /**
         * Returns whether the desktop sharing is enabled or not.
         * @returns {boolean}
         */
        isDesktopSharingEnabled(): boolean;
        /**
         * Sets current audio output device.
         * @param {string} deviceId - id of 'audiooutput' device from
         *      navigator.mediaDevices.enumerateDevices(), 'default' for default
         *      device
         * @returns {Promise} - resolves when audio output is changed, is rejected
         *      otherwise
         */
        setAudioOutputDevice(deviceId: string): Promise<any>;
        /**
         * Sets the capture frame rate for desktop tracks.
         *
         * @param {number} maxFps - max fps to be used as the capture frame rate.
         * @returns {void}
         */
        setDesktopSharingFrameRate(maxFps: number): void;
        /**
         * Returns currently used audio output device id, '' stands for default
         * device
         * @returns {string}
         */
        getAudioOutputDevice(): string;
        /**
         * Returns list of available media devices if its obtained, otherwise an
         * empty array is returned/
         * @returns {Array} list of available media devices.
         */
        getCurrentlyAvailableMediaDevices(): any[];
        /**
         * Returns event data for device to be reported to stats.
         * @returns {MediaDeviceInfo} device.
         */
        getEventDataForActiveDevice(device: any): MediaDeviceInfo;
        /**
         * Returns <tt>true<tt/> if a WebRTC MediaStream identified by given stream
         * ID is considered a valid "user" stream which means that it's not a
         * "receive only" stream nor a "mixed" JVB stream.
         *
         * Clients that implement Unified Plan, such as Firefox use recvonly
         * "streams/channels/tracks" for receiving remote stream/tracks, as opposed
         * to Plan B where there are only 3 channels: audio, video and data.
         *
         * @param {string} streamId The id of WebRTC MediaStream.
         * @returns {boolean}
         */
        isUserStreamById(streamId: string): boolean;
    }
    import Listenable from "modules/util/Listenable";
}
declare module "service/RTC/SignalingEvents" {
    export enum SignalingEvents {
        /**
         * Event triggered when participant's muted status changes.
         *
         * @param {string} endpointId the track owner's identifier (MUC nickname)
         * @param {MediaType} mediaType "audio" or "video"
         * @param {boolean} isMuted the new muted state
         */
        PEER_MUTED_CHANGED = "signaling.peerMuted",
        /**
         * Event triggered when participant's video type changes.
         *
         * @param {string} endpointId the video owner's ID (MUC nickname)
         * @param {VideoType} videoType the new value
         */
        PEER_VIDEO_TYPE_CHANGED = "signaling.peerVideoType",
        /**
         * Event triggered when source's muted status changes.
         *
         * @param {string} sourceName - The name of the source.
         * @param {boolean} isMuted - The new muted state.
         */
        SOURCE_MUTED_CHANGED = "signaling.sourceMuted",
        /**
         * Event triggered when presence for a source is received.
         *
         * @param {string} sourceName - The name of the source.
         * @param {string} endpointId - The endpoint id.
         * @param {boolean} muted - The new muted state.
         * @param {string} videoType - The video type of the source.
         */
        SOURCE_UPDATED = "signaling.sourceUpdated",
        /**
         * Event triggered when source's video type changes.
         *
         * @param {string} source - The name of the source.
         * @param {VideoType} videoType - The new value.
         */
        SOURCE_VIDEO_TYPE_CHANGED = "signaling.sourceVideoType"
    }
}
declare module "service/RTC/VideoEncoderScalabilityMode" {
    /**
     * Enumeration of the scalability modes supported by the video encoders.
     * For more information, check https://www.w3.org/TR/webrtc-svc/#dependencydiagrams*
     *
     * enum VideoEncoderScalabilityMode {
     *  L1T3: string;
     *  L2T3: string;
     *  L2T3_KEY: string;
     *  L3T3: string;
     *  L3T3_KEY: string;
     * }
     */
    export enum VideoEncoderScalabilityMode {
        /**
         * L1T3 mode: 1-layer spatial and 3-layer temporal scalabilty encoding.
         */
        L1T3 = "L1T3",
        /**
         * L2T2 mode: 2-layer spatial and 3-layer temporal scalability encoding.
         */
        L2T3 = "L2T3",
        /**
         * L2T3_KEY mode: 2-layer spatial and 3-layer temporal scalability K-SVC encoding.
         */
        L2T3_KEY = "L2T3_KEY",
        /**
         * L3T3 mode: -layer spatial and 3-layer temporal scalability encoding.
         */
        L3T3 = "L3T3",
        /**
         * L3T3_Key mode: 3-layer spatial and 3-layer temporal scalability K-SVC encoding.
         */
        L3T3_KEY = "L3T3_KEY"
    }
}
declare module "modules/sdp/SdpTransformUtil" {
    import { type MediaDescription } from 'sdp-transform';
    import { MediaDirection } from "service/RTC/MediaDirection";
    /**
     * Parses the primary SSRC of given SSRC group.
     * @param {object} group the SSRC group object as defined by the 'sdp-transform'
     * @return {Number} the primary SSRC number
     */
    export function parsePrimarySSRC(group: {
        ssrcs: string;
    }): number;
    /**
     * Parses the secondary SSRC of given SSRC group.
     * @param {object} group the SSRC group object as defined by the 'sdp-transform'
     * @return {Number} the secondary SSRC number
     */
    export function parseSecondarySSRC(group: {
        ssrcs: string;
    }): number;
    /**
     * A wrapper around 'sdp-transform' media description object which provides
     * utility methods for common SDP/SSRC related operations.
     */
    export class MLineWrap {
        /**
         * Creates new <tt>MLineWrap</t>>
         * @param {Object} _mLine the media line object as defined by 'sdp-transform'
         * lib.
         */
        constructor(mLine: MediaDescription);
        /**
         * Getter for the mLine's "ssrcs" array. If the array was undefined an empty
         * one will be preassigned.
         *
         * @return {Array<Object>} an array of 'sdp-transform' SSRC attributes
         * objects.
         */
        get ssrcs(): MediaDescription['ssrcs'];
        /**
         * Setter for the mLine's "ssrcs" array.
         *
         * @param {Array<Object>} ssrcs an array of 'sdp-transform' SSRC attributes
         * objects.
         */
        set ssrcs(ssrcs: MediaDescription['ssrcs']);
        /**
         * Returns the direction of the underlying media description.
         * @return {Optional<string>} the media direction name as defined in the SDP.
         */
        get direction(): Optional<string>;
        /**
         * Modifies the direction of the underlying media description.
         * @param {Optional<string>} direction the new direction to be set
         */
        set direction(direction: Optional<MediaDirection>);
        /**
         * Exposes the SSRC group array of the underlying media description object.
         * @return {MediaDescription['ssrcGroups']}
         */
        get ssrcGroups(): MediaDescription['ssrcGroups'];
        /**
         * Modifies the SSRC groups array of the underlying media description
         * object.
         * @param {MediaDescription['ssrcGroups']} ssrcGroups
         */
        set ssrcGroups(ssrcGroups: MediaDescription['ssrcGroups']);
        /**
         * Obtains value from SSRC attribute.
         * @param {number} ssrcNumber the SSRC number for which attribute is to be
         * found
         * @param {string} attrName the name of the SSRC attribute to be found.
         * @return {Optional<string>} the value of SSRC attribute or
         * <tt>undefined</tt> if no such attribute exists.
         */
        getSSRCAttrValue(ssrcNumber: number, attrName: string): Optional<string>;
        /**
         * Removes all attributes for given SSRC number.
         * @param {number} ssrcNum the SSRC number for which all attributes will be
         * removed.
         */
        removeSSRC(ssrcNum: number): void;
        /**
         * Adds SSRC attribute
         * @param {object} ssrcObj the SSRC attribute object as defined in
         * the 'sdp-transform' lib.
         */
        addSSRCAttribute(ssrcObj: MediaDescription['ssrcs'][number]): void;
        /**
         * Finds a SSRC group matching both semantics and SSRCs in order.
         * @param {string} semantics the name of the semantics
         * @param {string} [ssrcs] group SSRCs as a string (like it's defined in
         * SSRC group object of the 'sdp-transform' lib) e.g. "1232546 342344 25434"
         * @return {Optional<MediaDescription['ssrcGroups'][number]>} the SSRC group object or <tt>undefined</tt> if not found.
         */
        findGroup(semantics: string, ssrcs?: string): Optional<MediaDescription['ssrcGroups'][number]>;
        /**
         * Finds all groups matching given semantic's name.
         * @param {string} semantics the name of the semantics
         * @return {MediaDescription['ssrcGroups']} an array of SSRC group objects as defined by the 'sdp-transform' lib.
         */
        findGroups(semantics: string): MediaDescription['ssrcGroups'];
        /**
         * Finds all groups matching given semantic's name and group's primary SSRC.
         * @param {string} semantics the name of the semantics
         * @param {number} primarySSRC the primary SSRC number to be matched
         * @return {Optional<MediaDescription['ssrcGroups'][number]>} SSRC group object as defined by the 'sdp-transform' lib.
         */
        findGroupByPrimarySSRC(semantics: string, primarySSRC: number): Optional<MediaDescription['ssrcGroups'][number]>;
        /**
         * Gets the SSRC count for the underlying media description.
         * @return {number}
         */
        getSSRCCount(): number;
        /**
         * Checks whether the underlying media description contains any SSRC groups.
         * @return {boolean} <tt>true</tt> if there are any SSRC groups or
         * <tt>false</tt> otherwise.
         */
        containsAnySSRCGroups(): boolean;
        /**
         * Finds the primary video SSRC.
         * @returns {Optional<number>} the primary video ssrc
         * @throws Error if the underlying media description is not a video
         */
        getPrimaryVideoSsrc(): Optional<number>;
        /**
         * Obtains RTX SSRC from the underlying video description (the
         * secondary SSRC of the first "FID" group found)
         * @param {number} primarySsrc the video ssrc for which to find the
         * corresponding rtx ssrc
         * @returns {Optional<number>} the rtx ssrc (or undefined if there isn't
         * one)
         */
        getRtxSSRC(primarySsrc: number): Optional<number>;
        /**
         * Obtains all SSRCs contained in the underlying media description.
         * @return {Array.<number>} an array with all SSRC as numbers.
         */
        getSSRCs(): number[];
        /**
         * Obtains primary video SSRCs.
         * @return {Array.<number>} an array of all primary video SSRCs as numbers.
         * @throws Error if the wrapped media description is not a video.
         */
        getPrimaryVideoSSRCs(): number[];
        /**
         * Removes all SSRC groups which contain given SSRC number at any position.
         * @param {number} ssrc the SSRC for which all matching groups are to be
         * removed.
         */
        removeGroupsWithSSRC(ssrc: number): void;
        /**
         * Removes groups that match given semantics.
         * @param {string} semantics e.g. "SIM" or "FID"
         */
        removeGroupsBySemantics(semantics: string): void;
        /**
         * Adds given SSRC group to this media description.
         * @param {object} group the SSRC group object as defined by
         * the 'sdp-transform' lib.
         */
        addSSRCGroup(group: MediaDescription['ssrcGroups'][number]): void;
    }
    /**
     * Utility class for SDP manipulation using the 'sdp-transform' library.
     *
     * Typical use usage scenario:
     *
     * const transformer = new SdpTransformWrap(rawSdp);
     * const videoMLine = transformer.selectMedia('video);
     * if (videoMLine) {
     *     videoMLiner.addSSRCAttribute({
     *         id: 2342343,
     *         attribute: "cname",
     *         value: "someCname"
     *     });
     *     rawSdp = transformer.toRawSdp();
     * }
     */
    export class SdpTransformWrap {
        private parsedSDP;
        /**
         * Creates new instance and parses the raw SDP into objects using
         * 'sdp-transform' lib.
         * @param {string} rawSDP the SDP in raw text format.
         */
        constructor(rawSDP: string);
        /**
         * Selects all the m-lines from the SDP for a given media type.
         *
         * @param {string} mediaType the name of the media e.g. 'audio', 'video', 'data'.
         * @return {MLineWrap|null} return {@link MLineWrap} instance for the media line or <tt>null</tt> if not found. The
         * object returned references the underlying SDP state held by this <tt>SdpTransformWrap</tt> instance (it's not a
         * copy).
         */
        selectMedia(mediaType: string): Nullable<MLineWrap[]>;
        /**
         * Converts the currently stored SDP state in this instance to raw text SDP
         * format.
         * @return {string}
         */
        toRawSDP(): string;
    }
}
declare module "modules/sdp/constants" {
    import { MediaType } from "service/RTC/MediaType";
    export interface ISsrcGroupInfo {
        semantics: string;
        ssrcs: number[];
    }
    export interface ISsrcInfo {
        groups: Array<ISsrcGroupInfo>;
        msid: string;
        ssrcs: Array<number>;
    }
    export interface IICECandidate {
        component: string;
        foundation: string;
        generation?: string;
        hasOwnAttribute?: (attr: string) => boolean;
        id?: string;
        ip: string;
        network?: string;
        port: string;
        priority: string;
        protocol: string;
        'rel-addr'?: string;
        'rel-port'?: string;
        tcptype?: string;
        type: string;
    }
    export interface IMediaLine {
        fmt: string[];
        media: string | MediaType;
        port: string;
        proto: string;
    }
    export interface ICryptoData {
        'crypto-suite': string;
        'key-params': string;
        'session-params'?: string;
        tag: string;
    }
    export interface IExtmapData {
        direction: string;
        params: string[];
        uri: string;
        value: string;
    }
    export interface IFingerprintData {
        cryptex?: string;
        fingerprint: string;
        hash: string;
        required: boolean;
        setup?: string;
        xmlns?: string;
    }
    export interface IFmtpParameter {
        name: string;
        value: string;
    }
    export interface IRTCPFBData {
        params: string[];
        pt: string;
        type: string;
    }
    export interface IRTPMapData {
        channels: string;
        clockrate: string;
        id: string;
        name: string;
    }
    export interface IICEParams {
        pwd: string;
        ufrag: string;
        xmlns?: string;
    }
    export interface IRTPInfo {
        codec?: string;
        payload: number;
    }
    export interface IFMTPInfo {
        config: string;
        payload: number;
    }
    export interface IMediaInfo {
        mediaType: MediaType;
        mediaindex: number;
        mid: string;
        ssrcGroups: ISsrcGroup[];
        ssrcs: {
            [ssrc: string]: IMediaSsrc;
        };
    }
    export interface IMediaSsrc {
        lines: string[];
        ssrc: string;
    }
    export interface ISsrcGroup {
        semantics: string;
        ssrcs: string[];
    }
    export interface IMediaSource {
        mediaType: string;
        mid?: string;
        ssrcGroups: ISsrcGroup[];
        ssrcs: {
            [ssrcNum: string]: IMediaSsrc;
        };
    }
    export interface IDiffSourceInfo {
        [index: string]: IMediaSource;
    }
}
declare module "modules/sdp/LocalSdpMunger" {
    import TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    import { ISsrcInfo } from "modules/sdp/constants";
    /**
     * Fakes local SDP exposed to {@link JingleSessionPC} through the local description getter. Modifies the SDP, so that
     * the stream identifiers are unique across all of the local PeerConnections and that the source names and video types
     * are injected so that Jicofo can use them to identify the sources.
     */
    export default class LocalSdpMunger {
        private _localEndpointId;
        private _tpc;
        /**
         * Creates new <tt>LocalSdpMunger</tt> instance.
         *
         * @param {TraceablePeerConnection} tpc
         * @param {string} localEndpointId - The endpoint id of the local user.
         */
        constructor(tpc: TraceablePeerConnection, localEndpointId: string);
        /**
         * Updates or adds a 'msid' attribute for the local sources in the SDP. Also adds 'sourceName' and 'videoType'
         * (if applicable) attributes. All other source attributes like 'cname', 'label' and 'mslabel' are removed since
         * these are not processed by Jicofo.
         *
         * @param {MLineWrap} mediaSection - The media part (audio or video) of the session description which will be
         * modified in place.
         * @returns {void}
         * @private
         */
        private _transformMediaIdentifiers;
        /**
         * This transformation will make sure that stream identifiers are unique across all of the local PeerConnections
         * even if the same stream is used by multiple instances at the same time. It also injects 'sourceName' and
         * 'videoType' attribute.
         *
         * @param {RTCSessionDescription} sessionDesc - The local session description (this instance remains unchanged).
         * @param {Map<string, TPCSSRCInfo>} ssrcMap - The SSRC and source map for the local tracks.
         * @return {RTCSessionDescription} - Transformed local session description
         * (a modified copy of the one given as the input).
         */
        transformStreamIdentifiers(sessionDesc: RTCSessionDescription, ssrcMap: Map<string, ISsrcInfo>): RTCSessionDescription;
    }
}
declare module "modules/util/RandomUtil" {
    /**
     * Generates random int within the range [min, max]
     * @param min the minimum value for the generated number
     * @param max the maximum value for the generated number
     * @returns random int number
     */
    export function randomInt(min: number, max: number): number;
    /**
     * Get random element from array or string.
     * @param {Array|string} arr source
     * @returns array element or string character
     */
    export function randomElement<T>(arr: T[] | string): T | string;
    /**
     * Generate random alphanumeric string.
     * @param {number} length expected string length
     * @returns {string} random string of specified length
     */
    export function randomAlphanumStr(length: number): string;
    /**
     * Exported interface.
     */
    const RandomUtil: {
        /**
         * Returns a random hex digit.
         * @returns {*}
         */
        randomAlphanumStr: typeof randomAlphanumStr;
        randomElement: typeof randomElement;
        randomHexDigit(): string;
        /**
         * Returns a random string of hex digits with length 'len'.
         * @param len the length.
         */
        randomHexString(len: number): string;
        randomInt: typeof randomInt;
    };
    export default RandomUtil;
}
declare module "modules/sdp/SDPUtil" {
    import type { MediaDescription } from 'sdp-transform';
    import { ICryptoData, IExtmapData, IFingerprintData, IFmtpParameter, IICECandidate, IICEParams, IMediaLine, IRTCPFBData, IRTPMapData, ISsrcGroup } from "modules/sdp/constants";
    const SDPUtil: {
        /**
         * Builds an ICE candidate line for SDP.
         *
         * @param {IICECandidate} cand - The ICE candidate object.
         * @returns {string} - The SDP line for the ICE candidate.
         */
        buildICECandidate(cand: IICECandidate): string;
        /**
         * Builds an ICE password line for SDP.
         *
         * @param {string} pwd - The ICE password.
         * @returns {string} - The SDP line for the ICE password.
         */
        buildICEPwd(pwd: string): string;
        /**
         * Builds an ICE ufrag line for SDP.
         *
         * @param {string} frag - The ICE ufrag.
         * @returns {string} - The SDP line for the ICE ufrag.
         */
        buildICEUfrag(frag: string): string;
        /**
         * Builds an SDP media line.
         *
         * @param {IMediaLine} mline - The media line object.
         * @returns {string} - The SDP media line.
         */
        buildMLine(mline: IMediaLine): string;
        /**
         * Builds an RTP map line for SDP.
         *
         * @param {Element} el - The RTP map element.
         * @returns {String} - The SDP line for the RTP map.
         */
        buildRTPMap(el: Element): string;
        /**
         * Builds an ICE candidate line for SDP.
         *
         * @param {Element} cand - The ICE candidate object.
         * @returns {string} - The SDP line for the ICE candidate.
         */
        candidateFromJingle(cand: Element): string;
        /**
         * Builds an ICE candidate from SDP.
         *
         * @param {string} line - The SDP line for the ICE candidate.
         * @returns {Nullable<IICECandidate>} - The Jingle XML representation of the ICE candidate.
         */
        candidateToJingle(line: string): Nullable<IICECandidate>;
        filterSpecialChars(text: Nullable<Optional<string>>): Nullable<Optional<string>>;
        /**
         * Finds a line in the SDP that starts with the given search pattern.
         *
         * @param {string} haystack - The SDP string to search.
         * @param {string} needle - The line prefix to find.
         * @param {string} sessionpart - The session part to search within.
         * @returns {Optional<string>} - The found line or false if not found.
         */
        findLine(haystack: string, needle: string, sessionpart?: string): Optional<string>;
        /**
         * Finds all lines in the SDP that start with the given search pattern.
         *
         * @param {string} haystack - The SDP string to search.
         * @param {string} needle - The line prefix to find.
         * @param {string} sessionpart - The session part to search within.
         * @returns {string[]} - An array of found lines.
         */
        findLines(haystack: string, needle: string, sessionpart?: string): string[];
        /**
         * Generates a random SSRC value.
         *
         * @returns {number} - A random SSRC value.
         */
        generateSsrc(): number;
        /**
         * Gets the SSRC attribute value from the media line.
         *
         * @param {MediaDescription} mLine - The media line object.
         * @param {number} ssrc - The SSRC value to search for.
         * @param {string} attributeName - The attribute name to search for.
         * @returns {string|null} - The attribute value or null if not found.
         */
        getSsrcAttribute(mLine: MediaDescription, ssrc: number, attributeName: string): Nullable<string>;
        /**
         * Gets the ICE ufrag from the SDP.
         *
         * @param {string} sdp - The SDP string to search.
         * @returns {Optional<string>} - The ICE ufrag value or undefined if not found.
         */
        getUfrag(sdp: string): Optional<string>;
        /**
         * Gets the ICE parameters from the media description and session description.
         *
         * @param {string} mediadesc - The media description string.
         * @param {string} sessiondesc - The session description string.
         * @returns {Nullable<IICEParams>} - The ICE parameters object or null if not found.
         */
        iceparams(mediadesc: string, sessiondesc: string): Nullable<IICEParams>;
        /**
         * Parses a crypto line from the SDP.
         *
         * @param {string} line - The crypto line to parse.
         * @returns {ICryptoData} - The parsed crypto parameters.
         */
        parseCrypto(line: string): ICryptoData;
        /**
         * Parses an extmap line from the SDP.
         *
         * @param {string} line - The extmap line to parse.
         * @returns {IExtmapData} - The parsed extmap parameters.
         */
        parseExtmap(line: string): IExtmapData;
        /**
         * Parses a fingerprint line from the SDP.
         *
         * @param {string} line - The fingerprint line to parse.
         * @returns {IFingerprintData} - The parsed fingerprint parameters.
         */
        parseFingerprint(line: string): IFingerprintData;
        /**
         * Parses a fmtp line from the SDP.
         *
         * @param {string} line - The fmtp line to parse.
         * @returns {IFmtpParameter[]} - The parsed fmtp parameters.
         */
        parseFmtp(line: string): IFmtpParameter[];
        /**
         * Parses the SSRCs from a group description.
         *
         * @param {MediaDescription['ssrcGroups'][number]} ssrcGroup - The SSRC group object.
         * @returns {number[]} - The list of SSRCs in the group.
         */
        parseGroupSsrcs(ssrcGroup: MediaDescription["ssrcGroups"][number]): number[];
        /**
         * Parses an ICE candidate line from the SDP.
         *
         * @param {string} line - The ICE candidate line to parse.
         * @returns {IICECandidate} - The parsed ICE candidate parameters.
         */
        parseICECandidate(line: string): IICECandidate;
        /**
         * Parses an ICE password line from the SDP.
         *
         * @param {string} line - The ICE password line to parse.
         * @returns {string} - The parsed ICE password.
         */
        parseICEPwd(line: string): string;
        /**
         * Parses an ICE ufrag line from the SDP.
         *
         * @param {string} line - The ICE ufrag line to parse.
         * @returns {string} - The parsed ICE ufrag.
         */
        parseICEUfrag(line: string): string;
        /**
         * Parses a media ID line from the SDP.
         *
         * @param {string} line - The media ID line to parse.
         * @returns {string} - The parsed media ID.
         */
        parseMID(line: string): string;
        /**
         * Parses a media line from the SDP.
         *
         * @param {string} line - The media line to parse.
         * @returns {IMediaLine} - The parsed media line data.
         */
        parseMLine(line: string): IMediaLine;
        /**
         * Parses the MSID attribute from the given SSRC lines.
         *
         * @param {string[]} ssrcLines - The SSRC lines to search.
         * @returns {Optional<string>} - The parsed MSID or undefined if not found.
         */
        parseMSIDAttribute(ssrcLines: string[]): Optional<string>;
        /**
         * Parse the 'most' primary video ssrc from the given m line
         * @param {MediaDescription} videoMLine object as parsed from transform.parse
         * @return {Optional<number>} the primary video ssrc from the given m line
         */
        parsePrimaryVideoSsrc(videoMLine: MediaDescription): Optional<number>;
        /**
         * Parses an RTCP feedback line from the SDP.
         *
         * @param {string} line - The RTCP feedback line to parse.
         * @returns {IRTCPFBData} - The parsed RTCP feedback data.
         */
        parseRTCPFB(line: string): IRTCPFBData;
        /**
         * Parses an RTP map line from the SDP.
         *
         * @param {string} line - The RTP map line to parse.
         * @returns {IRTPMapData} - The parsed RTP map data.
         */
        parseRTPMap(line: string): IRTPMapData;
        /**
         * Parses SDP line "a=sctpmap:..." and extracts SCTP port from it.
         *
         * @param {string} line eg. "a=sctpmap:5000 webrtc-datachannel"
         * @returns {[string, string, Nullable<string>]} [SCTP port number, protocol, streams]
         */
        parseSCTPMap(line: string): [string, string, Nullable<string>];
        /**
         * Parses the SCTP port line from the SDP.
         *
         * @param {string} line - The SCTP port line to parse.
         * @returns {string} - The parsed SCTP port.
         */
        parseSCTPPort(line: string): string;
        /**
         * Parses the SSRC lines from the SDP.
         *
         * @param {string} desc - The SDP description to parse.
         * @returns {Map<string, string[]>} - A map of SSRCs to their corresponding lines.
         */
        parseSSRC(desc: string): Map<string, string[]>;
        /**
         * Parses the 'a=ssrc-group' line.
         *
         * @param {string} line - The media line to parse.
         * @returns {ISsrcGroup}
         */
        parseSSRCGroupLine(line: string): ISsrcGroup;
        /**
         * Gets the source name out of the name attribute "a=ssrc:254321 name:name1".
         *
         * @param {string[]} ssrcLines
         * @returns {Optional<string>}
         */
        parseSourceNameLine(ssrcLines: string[]): Optional<string>;
        /**
         * Parse the "videoType" attribute encoded in a set of SSRC attributes (e.g.
         * "a=ssrc:1234 videoType:desktop")
         *
         * @param {string[]} ssrcLines
         * @returns {Optional<string>}
         */
        parseVideoTypeLine(ssrcLines: string[]): Optional<string>;
        /**
         * Sets the given codecName as the preferred codec by moving it to the beginning
         * of the payload types list (modifies the given mline in place). All instances
         * of the codec are moved up.
         * @param {MediaDescription} mLine the mline object from an sdp as parsed by transform.parse.
         * @param {string} codecName the name of the preferred codec.
         * @param {boolean} sortPayloadTypes whether the payloadtypes need to be sorted for a given codec.
         */
        preferCodec(mline: MediaDescription, codecName: string, sortPayloadTypes?: boolean): void;
        /**
         * Strips the given codec from the given mline. All related RTX payload
         * types are also stripped. If the resulting mline would have no codecs,
         * it's disabled.
         *
         * @param {MediaDescription} mLine the mline object from an sdp as parsed by transform.parse.
         * @param {string} codecName the name of the codec which will be stripped.
         * @param {boolean} highProfile determines if only the high profile codec needs to be stripped from the sdp for a
         * given codec type.
         */
        stripCodec(mLine: MediaDescription, codecName: string, highProfile?: boolean): void;
    };
    export default SDPUtil;
}
declare module "modules/sdp/RtxModifier" {
    /**
     * End helper functions
     */
    /**
     * Adds any missing RTX streams for video streams
     *  and makes sure that they remain consistent
     */
    export default class RtxModifier {
        /**
         * Map of video ssrc to corresponding RTX
         *  ssrc
         */
        correspondingRtxSsrcs: Map<any, any>;
        /**
         * Clear the cached map of primary video ssrcs to
         *  their corresponding rtx ssrcs so that they will
         *  not be used for the next call to modifyRtxSsrcs
         */
        clearSsrcCache(): void;
        /**
         * Explicitly set the primary video ssrc -> rtx ssrc
         *  mapping to be used in modifyRtxSsrcs
         * @param {Map} ssrcMapping a mapping of primary video
         *  ssrcs to their corresponding rtx ssrcs
         */
        setSsrcCache(ssrcMapping: Map<any, any>): void;
        /**
         * Adds RTX ssrcs for any video ssrcs that don't already have them.  If the video ssrc has been seen before, and
         * already had an RTX ssrc generated, the same RTX ssrc will be used again.
         *
         * @param {string} sdpStr sdp in raw string format
         * @returns {string} The modified sdp in raw string format.
         */
        modifyRtxSsrcs(sdpStr: string): string;
        /**
         * Does the same thing as {@link modifyRtxSsrcs}, but takes the {@link MLineWrap} instance wrapping video media as
         * an argument.
         * @param {MLineWrap} videoMLine
         * @return {boolean} <tt>true</tt> if the SDP wrapped by {@link SdpTransformWrap} has been modified or
         * <tt>false</tt> otherwise.
         */
        modifyRtxSsrcs2(videoMLine: MLineWrap): boolean;
        /**
         * Strip all rtx streams from the given sdp.
         *
         * @param {string} sdpStr sdp in raw string format
         * @returns {string} sdp string with all rtx streams stripped
         */
        stripRtx(sdpStr: string): string;
    }
}
declare module "modules/util/XMLUtils" {
    /**
     * Parses an XML string into a Document.
     * @param xmlString - The XML string to parse.
     * @returns Parsed XML Document or null if parsing fails.
     */
    export function parseXML(xmlString: string): Nullable<Document>;
    /**
     * Finds all elements matching the CSS selector within the given element.
     * @param element - The element or document to search within.
     * @param selector - CSS selector string.
     * @returns Array of matching elements.
     */
    export function findAll(element: Element | Document, selector: string): Element[];
    /**
     * Gets the value of an attribute from an element.
     * @param element - The element to get the attribute from.
     * @param name - The attribute name.
     * @returns The attribute value or null if not found.
     */
    export function getAttribute(element: Element | null, name: string): string | null;
    /**
     * Sets an attribute on an element.
     * @param element - The element to set the attribute on.
     * @param name - The attribute name.
     * @param value - The attribute value.
     */
    export function setAttribute(element: Element | null, name: string, value: string): void;
    /**
     * Gets the text content of an element.
     * @param element - The element to get text from.
     * @returns The text content or empty string if element is null.
     */
    export function getText(element: Element | null): string;
    /**
     * Sets the text content of an element.
     * @param element - The element to set text on.
     * @param text - The text content to set.
     */
    export function setText(element: Element | null, text: string): void;
    /**
     * Gets the child elements of an element (excluding text nodes).
     * @param element - The parent element.
     * @returns Array of child elements.
     */
    export function getChildren(element: Element): Element[];
    /**
     * Checks if any elements match the selector within the given element.
     * @param element - The element or document to search within.
     * @param selector - CSS selector string.
     * @returns True if at least one element matches the selector.
     */
    export function exists(element: Element | Document, selector: string): boolean;
    /**
     * Gets the first element matching the selector, or null if none found.
     * This is a convenience function equivalent to findAll(...)[0] || null.
     * @param element - The element or document to search within.
     * @param selector - CSS selector string.
     * @returns The first matching element or null.
     */
    export function findFirst(element: Element | Document, selector: string): Element | null;
}
declare module "modules/sdp/SDP" {
    import { MediaType } from "service/RTC/MediaType";
    import { SourceName } from "service/RTC/SignalingLayer";
    import { ITPCSourceInfo } from "modules/RTC/TraceablePeerConnection";
    import { IMediaInfo } from "modules/sdp/constants";
    /**
     * A class that translates the Jingle messages received from the signaling server into SDP format that the
     * browser understands and vice versa. This is needed for media session establishment and for signaling local and
     * remote sources across peers.
     */
    export default class SDP {
        raw: string;
        session: string;
        media: string[];
        isP2P: boolean;
        failICE: boolean;
        removeTcpCandidates: boolean;
        removeUdpCandidates: boolean;
        initialLastN?: number;
        /**
         * Constructor.
         *
         * @param {string} sdp - The SDP generated by the browser when SDP->Jingle conversion is needed, an empty string
         * when Jingle->SDP conversion is needed.
         * @param {boolean} isP2P - Whether this SDP belongs to a p2p peerconnection.
         */
        constructor(sdp: string, isP2P?: boolean);
        /**
         * Adjusts the msid semantic for a remote source based on the media type and the index of the m-line.
         * This is needed for browsers that need both the streamId and trackId to be reported in the msid attribute.
         *
         * @param {String} msid - The msid attribute value.
         * @param {MediaType} mediaType - The media type.
         * @param {Number|String} idx - The index of the m-line in the SDP.
         * @returns {String} - The adjusted msid semantic.
         */
        private _adjustMsidSemantic;
        /**
         * Updates the media and session sections of the SDP based on the raw SDP string.
         *
         * @param {string} sdp - The SDP generated by the browser.
         * @returns {void}
         * @private
         */
        private _updateSessionAndMediaSections;
        /**
         * Adds or removes the sources from the SDP.
         *
         * @param {Map<SourceName, ITPCSourceInfo>} sourceMap - The map of the sources that are being added/removed.
         * @param {boolean} isAdd - Whether the sources are being added or removed.
         * @returns {Array<number>} - The indices of the new m-lines that were added/modifed in the SDP.
         */
        updateRemoteSources(sourceMap: Map<SourceName, ITPCSourceInfo>, isAdd?: boolean): number[];
        /**
         * Adds a new m-line to the description so that a new local or remote source can be added to the conference.
         *
         * @param {MediaType} mediaType media type of the new source that is being added.
         * @param {boolean} isRemote - Whether this is for a remote source.
         * @returns {void}
         */
        addMlineForNewSource(mediaType: MediaType, isRemote?: boolean): void;
        /**
         * Converts the Jingle message element to SDP.
         *
         * @param {*} jingle - The Jingle message element.
         * @returns {void}
         */
        fromJingle(jingle: any): void;
        /**
         * Returns an SSRC Map by extracting SSRCs and SSRC groups from all the m-lines in the SDP.
         *
         * @returns {Map<number, IMediaInfo>}
         */
        getMediaSsrcMap(): Map<number, IMediaInfo>;
        /**
         * Converts the content section from Jingle to a media section that can be appended to the SDP.
         *
         * @param {Element} content - The content section from the Jingle message element.
         * @returns {string} - The constructed media sections.
         */
        jingle2media(content: Element): string;
        /**
         * Coverts the RTCP attributes for the session from XMPP format to SDP.
         * https://xmpp.org/extensions/xep-0293.html
         *
         * @param {*} elem - Jingle message element.
         * @param {*} payloadtype - Payload type for the codec.
         * @returns {string}
         */
        rtcpFbFromJingle(elem: any, payloadtype: any): string;
        /**
         * Converts the RTCP attributes for the session from SDP to XMPP format.
         * https://xmpp.org/extensions/xep-0293.html
         *
         * @param {number} mediaIndex - The index of the media section in the SDP.
         * @param {*} elem - The Jingle message element.
         * @param {string} payloadtype - payload type for the codec.
         */
        rtcpFbToJingle(mediaIndex: number, elem: any, payloadtype: string): void;
        /**
         * Converts the current SDP to a Jingle message that can be sent over the wire to a signaling server.
         *
         * @param {*} elem - The Jingle message element.
         * @param {*} thecreator - Sender role, whether it is an 'initiator' or 'responder'.
         * @returns - The updated Jingle message element.
         */
        toJingle(elem: any, thecreator: any): any;
        /**
         * Converts the session transport information from SDP to XMPP format.
         *
         * @param {*} mediaIndex The index for the m-line in the SDP.
         * @param {*} elem The transport element.
         */
        transportToJingle(mediaIndex: number, elem: any): void;
    }
}
declare module "modules/sdp/SdpSimulcast" {
    import * as transform from 'sdp-transform';
    /**
     * This class handles SDP munging for enabling simulcast for local video streams in Unified plan. A set of random SSRCs
     * are generated for the higher layer streams and they are cached for a given mid. The cached SSRCs are then reused on
     * the subsequent iterations while munging the local description. This class also handles imploding of the simulcast
     * SSRCs for remote endpoints into the primary FID group in remote description since Jicofo signals all SSRCs relevant
     * to a given endpoint.
     */
    export default class SdpSimulcast {
        private _numOfLayers;
        private _ssrcCache;
        /**
         * Creates a new instance.
         *
         * @param options
         */
        constructor();
        /**
         * Updates the given media description using the SSRCs that were cached for the mid associated
         * with the media description and returns the modified media description.
         *
         * @param mLine
         * @returns
         */
        _fillSsrcsFromCache(mLine: transform.MediaDescription): any;
        /**
         * Generates a new set of SSRCs for the higher simulcast layers/streams and adds the attributes and SIM group to
         * the given media description and returns the modified media description.
         *
         * @param mLine
         * @param primarySsrc
         * @returns
         */
        _generateNewSsrcsForSimulcast(mLine: transform.MediaDescription, primarySsrc: number): any;
        /**
         * Returns a random number to be used for the SSRC.
         *
         * @returns
         */
        _generateSsrc(): number;
        /**
         * Returns the requested attribute value for a SSRC from a given media description.
         *
         * @param mLine
         * @param ssrc
         * @param attributeName
         * @returns
         */
        _getSsrcAttribute(mLine: transform.MediaDescription, ssrc: number, attributeName: string): Optional<string>;
        /**
         * Returns an array of all the primary SSRCs in the SIM group for a given media description.
         *
         * @param mLine
         * @returns
         */
        _parseSimLayers(mLine: transform.MediaDescription): Nullable<Array<number>>;
        /**
         * Munges the given media description to enable simulcast for the video media sections that are in either have
         * SENDRECV or SENDONLY as the media direction thereby ignoring all the RECVONLY transceivers created for remote
         * endpoints.
         * NOTE: This needs to be called only when simulcast is enabled.
         *
         * @param description
         * @returns
         */
        mungeLocalDescription(description: RTCSessionDescription): RTCSessionDescription;
    }
}
declare module "modules/RTC/TPCUtils" {
    import TraceablePeerConnection, { IAudioQuality, IVideoQuality } from "modules/RTC/TraceablePeerConnection";
    export interface ICodecConfig {
        maxBitratesVideo?: {
            [key: string]: number;
        };
        scalabilityModeEnabled?: boolean;
        useKSVC?: boolean;
        useSimulcast?: boolean;
    }
    export interface ITPCUtilsOptions {
        audioQuality?: IAudioQuality;
        isP2P?: boolean;
        videoQuality?: IVideoQuality;
    }
    /**
     * Handles all the utility functions for the TraceablePeerConnection class, like calculating the encoding parameters,
     * determining the media direction, calculating bitrates based on the current codec settings, etc.
     */
    export class TPCUtils {
        private pc;
        private options;
        /**
         * Creates a new instance for a given TraceablePeerConnection
         *
         * @param peerconnection - the tpc instance for which we have utility functions.
         * @param options - additional options that can be passed to the utility functions.
         * @param options.audioQuality - the audio quality settings that are used to calculate the audio codec parameters.
         * @param options.isP2P - whether the connection is a P2P connection.
         * @param options.videoQuality - the video quality settings that are used to calculate the encoding parameters.
         */
        constructor(peerconnection: TraceablePeerConnection, options?: ITPCUtilsOptions);
        /**
         * Calculates the configuration of the active encoding when the browser sends only one stream, i,e,, when there is
         * no spatial scalability configure (p2p) or when it is running in full SVC mode.
         *
         * @param {JitsiLocalTrack} localVideoTrack - The local video track.
         * @param {CodecMimeType} codec - The video codec.
         * @param {number} newHeight - The resolution that needs to be configured for the local video track.
         * @returns {Object} configuration.
         * @private
         */
        private _calculateActiveEncodingParams;
        /**
         * Returns the codecs in the current order of preference in the SDP provided.
         *
         * @param {SessionDescription} parsedSdp the parsed SDP object.
         * @returns {Array<CodecMimeType>}
         * @private
         */
        private _getConfiguredVideoCodecsImpl;
        /**
         * The startup configuration for the stream encodings that are applicable to the video stream when a new sender is
         * created on the peerconnection. The initial config takes into account the differences in browser's simulcast
         * implementation.
         *
         * Encoding parameters:
         * active - determine the on/off state of a particular encoding.
         * maxBitrate - max. bitrate value to be applied to that particular encoding based on the encoding's resolution and
         *  config.js videoQuality settings if applicable.
         * rid - Rtp Stream ID that is configured for a particular simulcast stream.
         * scaleResolutionDownBy - the factor by which the encoding is scaled down from the original resolution of the
         *  captured video.
         *
         * @param {JitsiLocalTrack} localTrack - The local video track.
         * @param {String} codec - The codec currently in use.
         * @returns {Array<Object>} - The initial configuration for the stream encodings.
         * @private
         */
        private _getVideoStreamEncodings;
        /**
         * Returns a boolean indicating whether the video encoder is running in full SVC mode, i.e., it sends only one
         * video stream that has both temporal and spatial scalability.
         *
         * @param {CodecMimeType} codec - The video codec in use.
         * @returns boolean - true if the video encoder is running in full SVC mode, false otherwise.
         * @private
         */
        private _isRunningInFullSvcMode;
        /**
         * Returns a boolean indicating whether the bitrate needs to be capped for the local video track if it happens to
         * be a screenshare track. The lower spatial layers for screensharing are disabled when low fps screensharing is in
         * progress. Sending all three streams often results in the browser suspending the high resolution in low b/w and
         * and low cpu conditions, especially on the low end machines. Suspending the low resolution streams ensures that
         * the highest resolution stream is available always. Safari is an exception here since it does not send the
         * desktop stream at all if only the high resolution stream is enabled.
         *
         * @param {JitsiLocalTrack} localVideoTrack - The local video track.
         * @returns {boolean} - true if the bitrate needs to be capped for the screenshare track, false otherwise.
         * @private
         */
        private _isScreenshareBitrateCapped;
    }
}
declare module "modules/RTC/TraceablePeerConnection" {
    import { CodecMimeType } from "service/RTC/CodecMimeType";
    import { MediaType } from "service/RTC/MediaType";
    import SignalingLayer from "service/RTC/SignalingLayer";
    import { VideoEncoderScalabilityMode } from "service/RTC/VideoEncoderScalabilityMode";
    import { VideoType } from "service/RTC/VideoType";
    import LocalSdpMunger from "modules/sdp/LocalSdpMunger";
    import RtxModifier from "modules/sdp/RtxModifier";
    import SdpSimulcast from "modules/sdp/SdpSimulcast";
    import { ISsrcGroupInfo, ISsrcInfo } from "modules/sdp/constants";
    import EventEmitter from "modules/util/EventEmitter";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import JitsiRemoteTrack from "modules/RTC/JitsiRemoteTrack";
    import RTC from "modules/RTC/RTC";
    import { ICodecConfig, TPCUtils } from "modules/RTC/TPCUtils";
    /**
     * Interface for legacy WebRTC stats report (pre-standard)
     */
    interface ILegacyStatsReport {
        id: string;
        names: () => string[];
        stat: (name: string) => string | number;
    }
    export interface IRTCRtpEncodingParameters extends RTCRtpEncodingParameters {
        codec?: RTCRtpCodec;
        degradationPreference?: string;
        rid: string;
        scalabilityMode?: VideoEncoderScalabilityMode;
    }
    export interface ITPCSourceInfo {
        groups?: Array<ISsrcGroupInfo>;
        mediaType?: MediaType;
        msid?: string;
        ssrcList?: Array<string>;
        ssrcs?: Array<string>;
        videoType?: VideoType;
    }
    export interface ITPCOptions {
        audioQuality: IAudioQuality;
        capScreenshareBitrate: boolean;
        codecSettings: ICodecSettings;
        disableRtx: boolean;
        disableSimulcast: boolean;
        maxstats: number;
        startSilent: boolean;
        usesCodecSelectionAPI: boolean;
        videoQuality: IVideoQuality;
    }
    export interface IAudioQuality {
        enableOpusDtx?: boolean;
        opusMaxAverageBitrate?: number;
        opusMaxAverageBitrateMono?: number;
        opusMaxAverageBitrateStereo?: number;
        stereo?: boolean;
    }
    export interface IAppliedAudioQuality {
        enableOpusDtx?: boolean;
        opusMaxAverageBitrate?: number;
        stereo?: boolean;
    }
    export interface IVideoQuality {
        desktopbitrate?: number;
        maxBitratesVideo?: Record<string, number>;
        preferredCodec?: CodecMimeType;
        [CodecMimeType.AV1]?: ICodecConfig;
        [CodecMimeType.H264]?: ICodecConfig;
        [CodecMimeType.VP8]?: ICodecConfig;
        [CodecMimeType.VP9]?: ICodecConfig;
        maxbitratesvideo?: {
            [codec: string]: {
                [quality: string]: number;
            };
        };
    }
    export interface ICodecSettings {
        codecList: CodecMimeType[];
        mediaType?: MediaType;
        screenshareCodec?: CodecMimeType;
    }
    interface IUpdateLogEntry {
        time: Date;
        type: string;
        value: string;
    }
    interface IStatsEntry {
        endTime: Date;
        startTime: Date;
        times: number[];
        values: any[];
    }
    interface ITraceFunction {
        (what: string, info?: string, opts?: any): void;
    }
    /**
     * Creates new instance of 'TraceablePeerConnection'.
     */
    export default class TraceablePeerConnection {
        private _dtmfSender?;
        private _dtmfTonesQueue;
        private _dtlsTransport?;
        private _usesCodecSelectionAPI;
        private _senderMaxHeights;
        private _localSsrcMap?;
        private _remoteSsrcMap;
        private _lastVideoSenderUpdatePromise;
        private _localUfrag;
        private _pcId;
        private _remoteUfrag;
        private _signalingLayer;
        audioTransferActive: boolean;
        audioQualityLocal: Optional<IAppliedAudioQuality>;
        audioQualityRemote: Optional<IAppliedAudioQuality>;
        videoTransferActive: boolean;
        id: number;
        isP2P: boolean;
        remoteTracksBySsrc: Map<number, JitsiRemoteTrack>;
        remoteTracks: Map<string, Map<MediaType, Set<JitsiRemoteTrack>>>;
        localTracks: Map<number, JitsiLocalTrack>;
        localSSRCs: Map<number, ISsrcInfo>;
        remoteSSRCs: Set<number>;
        remoteSources: Map<string, number>;
        options: ITPCOptions;
        peerconnection: RTCPeerConnection;
        tpcUtils: TPCUtils;
        updateLog: Array<IUpdateLogEntry>;
        stats: Record<string, IStatsEntry>;
        statsinterval?: number;
        simulcast: SdpSimulcast;
        localSdpMunger: LocalSdpMunger;
        eventEmitter: EventEmitter;
        rtxModifier: RtxModifier;
        localTrackTransceiverMids: Map<number, string>;
        codecSettings: ICodecSettings;
        maxstats: number;
        rtc: RTC;
        trace: ITraceFunction;
        onicecandidate?: ((event: RTCPeerConnectionIceEvent) => void);
        onTrack: (evt: RTCTrackEvent) => void;
        onsignalingstatechange?: ((event: Event) => void);
        oniceconnectionstatechange?: ((event: Event) => void);
        onnegotiationneeded?: ((event: Event) => void);
        onconnectionstatechange?: ((event: Event) => void);
        ondatachannel?: ((event: RTCDataChannelEvent) => void);
        /**
         * @param {RTC} rtc the instance of <tt>RTC</tt> service
         * @param {number} id the peer connection id assigned by the parent RTC module.
         * @param {SignalingLayer} signalingLayer the signaling layer instance
         * @param {object} pcConfig The {@code RTCConfiguration} to use for the WebRTC peer connection.
         * @param {object} constraints WebRTC 'PeerConnection' constraints
         * @param {boolean} isP2P indicates whether or not the new instance will be used in a peer to peer connection.
         * @param {object} options <tt>TracablePeerConnection</tt> config options.
         * @param {Object} options.audioQuality - Quality settings to applied on the outbound audio stream.
         * @param {boolean} options.capScreenshareBitrate if set to true, lower layers will be disabled for screenshare.
         * @param {Array<CodecMimeType>} options.codecSettings - codec settings to be applied for video streams.
         * @param {boolean} options.disableSimulcast if set to 'true' will disable the simulcast.
         * @param {boolean} options.disableRtx if set to 'true' will disable the RTX.
         * @param {boolean} options.enableInsertableStreams set to true when the insertable streams constraints is to be
         * enabled on the PeerConnection.
         * @param {boolean} options.forceTurnRelay If set to true, the browser will generate only Relay ICE candidates.
         * @param {boolean} options.startSilent If set to 'true' no audio will be sent or received.
         * @param {Object} options.videoQuality - Quality settings to applied on the outbound video streams.
         *
         * FIXME: initially the purpose of TraceablePeerConnection was to be able to
         * debug the peer connection. Since many other responsibilities have been added
         * it would make sense to extract a separate class from it and come up with
         * a more suitable name.
         *
         * @constructor
         */
        constructor(rtc: RTC, id: number, signalingLayer: SignalingLayer, pcConfig: RTCConfiguration, constraints: {
            optional?: any[];
        }, isP2P: boolean, options: ITPCOptions);
        /**
         * Returns a string representation of a SessionDescription object.
         */
        static dumpSDP: (description: Optional<Nullable<RTCSessionDescription>>) => string;
        /**
         * Handles remote track mute / unmute events.
         * @param {string} endpointId the track owner's identifier (MUC nickname)
         * @param {MediaType} mediaType "audio" or "video"
         * @param {boolean} isMuted the new mute state
         * @private
         */
        private _peerMutedChanged;
        /**
         * Handles remote source videoType changed events.
         *
         * @param {string} sourceName - The name of the remote source.
         * @param {boolean} isMuted - The new value.
         */
        private _sourceVideoTypeChanged;
        /**
         * Configures the RTCRtpEncodingParameters of the outbound rtp stream associated with the given track.
         *
         * @param {JitsiLocalTracj} localTrack - The local track whose outbound stream needs to be configured.
         * @returns {Promise} - A promise that resolves when the operation is successful, rejected otherwise.
         */
        private _configureSenderEncodings;
        /**
         * Enables/disables the streams by changing the active field on RTCRtpEncodingParameters for a given RTCRtpSender.
         *
         * @param {RTCRtpSender} sender - the sender associated with a MediaStreamTrack.
         * @param {boolean} enable - whether the streams needs to be enabled or disabled.
         * @returns {Promise} - A promise that resolves when the operation is successful, rejected otherwise.
         */
        private _enableSenderEncodings;
        /**
         * Returns the list of RTCRtpReceivers created for the source of the given media type associated with
         * the set of remote endpoints specified.
         * @param {Array<string>} endpoints list of the endpoints
         * @param {string} mediaType 'audio' or 'video'
         * @returns {Array<RTCRtpReceiver>} list of receivers created by the peerconnection.
         */
        private _getReceiversByEndpointIds;
        /**
         * Handles {@link SignalingEvents.PEER_VIDEO_TYPE_CHANGED}
         * @param {string} endpointId the video owner's ID (MUC nickname)
         * @param {VideoType} videoType the new value
         * @private
         */
        private _peerVideoTypeChanged;
        /**
         * Adjusts the media direction on the remote description based on availability of local and remote sources in a p2p
         * media connection.
         *
         * @param {RTCSessionDescription} remoteDescription the WebRTC session description
         *  instance for the remote description.
         * @returns the transformed remoteDescription.
         * @private
         */
        private _adjustRemoteMediaDirection;
        /**
         * Returns the codec to be used for screenshare based on the supported codecs and the preferred codec requested
         * through config.js setting.
         *
         * @param {CodecMimeType} defaultCodec - the preferred codec for video tracks.
         * @returns {CodecMimeType}
         */
        private _getPreferredCodecForScreenshare;
        /**
         * Sets up the _dtlsTransport object and initializes callbacks for it.
         */
        private _initializeDtlsTransport;
        /**
         * Set the simulcast stream encoding properties on the RTCRtpSender.
         *
         * @param {JitsiLocalTrack} localTrack - the current track in use for which the encodings are to be set.
         * @returns {Promise<void>} - resolved when done.
         */
        private _setEncodings;
        /**
         * Munges the provided description to update the codec order, set the max bitrates (for VP9 K-SVC), set stereo flag
         * and update the DD Header extensions for AV1.
         *
         * @param {RTCSessionDescription} description - The description to be munged.
         * @param {boolean} isLocal - Whether the description is local or remote.
         * @returns {RTCSessionDescription} - The munged description.
         */
        private _mungeDescription;
        /**
         * Returns a wrapped-up promise so that the setParameters() call on the RTCRtpSender
         * for video sources are chained.
         * This is needed on Chrome as it resets the transaction id after
         * executing setParameters() and can affect the next on
         * the fly updates if they are not chained.
         * https://chromium.googlesource.com/external/webrtc/+/master/pc/rtp_sender.cc#340
         * @param {Function} nextFunction - The function to be called when the last video sender update promise is settled.
         * @returns {Promise}
         */
        private _updateVideoSenderParameters;
        /**
         * Configures the video stream with resolution / degradation / maximum bitrates
         *
         * @param {number} frameHeight - The max frame height to be imposed on the outgoing video stream.
         * @param {JitsiLocalTrack} - The local track for which the sender constraints have to be applied.
         * @param {preferredCodec} - The video codec that needs to be configured on
         * the sender associated with the video source.
         * @returns {Promise} promise that will be resolved when the operation is successful and rejected otherwise.
         */
        private _updateVideoSenderEncodings;
        /**
         * Callback ivoked by {@code this._dtmfSender} when it has finished playing
         * a single tone.
         *
         * @param {Object} event - The tonechange event which indicates what characters
         * are left to be played for the current tone.
         * @private
         * @returns {void}
         */
        private _onToneChange;
        /**
         * Internal method to create an SDP offer or answer for the peer connection.
         * Handles codec preferences, SDP munging for simulcast and RTX, and source information extraction.
         * @private
         */
        private _createOfferOrAnswer;
        /**
         * Extract primary SSRC from given {@link ITPCSSRCInfo} object.
         * @param {ITPCSSRCInfo} ssrcObj
         * @return {Nullable<number>} the primary SSRC or <tt>null</tt>
         */
        private _extractPrimarySSRC;
        /**
         * Sends a stats entry to the rtcstats server about the mute state change for local track.
         *
         * @param {JitsiLocalTrack} track - The local track.
         * @param {boolean} muted - muted state.
         */
        _sendRtcStatsEvent(track: JitsiLocalTrack, muted: boolean): void;
        /**
         * Process stat and adds it to the array of stats we store.
         * @param report the current stats report.
         * @param name the name of the report, if available
         * @param statValue the value to add.
         * @private
         */
        _processStat(report: RTCStats | ILegacyStatsReport, name: string, statValue: string | number | RTCStats): void;
        /**
         * Forwards the {@link peerconnection.iceConnectionState} state except that it
         * will convert "completed" into "connected" where both mean that the ICE has
         * succeeded and is up and running. We never see "completed" state for
         * the JVB connection, but it started appearing for the P2P one. This method
         * allows to adapt old logic to this new situation.
         * @return {RTCIceConnectionState}
         */
        getConnectionState(): RTCIceConnectionState;
        /**
         * Tells whether or not this TPC instance has spatial scalability enabled.
         * @return {boolean} <tt>true</tt> if spatial scalability is enabled and active or
         * <tt>false</tt> if it's turned off.
         */
        isSpatialScalabilityOn(): boolean;
        /**
         * Obtains audio levels of the remote audio tracks by getting the source information on the RTCRtpReceivers.
         * The information relevant to the ssrc is updated each time a RTP packet constaining the ssrc is received.
         * @param {Array<string>} speakerList list of endpoint ids for which audio levels are to be gathered.
         * @returns {Object} containing ssrc and audio level information as a key-value pair.
         */
        getAudioLevels(speakerList?: string[]): Record<string, number>;
        /**
         * Checks if the browser is currently doing true simulcast where in three
         * different media streams are being sent to the
         * bridge. Currently this happens always for VP8 and only if simulcast is enabled for VP9/AV1/H264.
         *
         * @param {JitsiLocalTrack} localTrack - The local video track.
         * @returns {boolean}
         */
        doesTrueSimulcast(localTrack: JitsiLocalTrack): boolean;
        /**
         * Returns the SSRCs associated with a given local video track.
         *
         * @param {JitsiLocalTrack} localTrack
         * @returns
         */
        getLocalVideoSSRCs(localTrack: JitsiLocalTrack): number[];
        /**
         * Obtains local tracks for given {@link MediaType}. If the <tt>mediaType</tt>
         * argument is omitted the list of all local tracks will be returned.
         * @param {MediaType} [mediaType]
         * @return {Array<JitsiLocalTrack>}
         */
        getLocalTracks(mediaType?: Optional<MediaType>): JitsiLocalTrack[];
        /**
         * Retrieves the local video tracks.
         *
         * @returns {Array<JitsiLocalTrack>} - local video tracks.
         */
        getLocalVideoTracks(): JitsiLocalTrack[];
        /**
         * Obtains all remote tracks currently known to this PeerConnection instance.
         *
         * @param {optional<string>} [endpointId] - The track owner's identifier (MUC nickname)
         * @param {optional<MediaType>} [mediaType] - The remote tracks will be filtered by their media type if this argument is
         * specified.
         * @return {Array<JitsiRemoteTrack>}
         */
        getRemoteTracks(endpointId?: Optional<string>, mediaType?: Optional<MediaType>): JitsiRemoteTrack[];
        /**
         * Returns the remote sourceInfo for a given source name.
         *
         * @param {string} sourceName - The source name.
         * @returns {TPCSourceInfo}
         */
        getRemoteSourceInfoBySourceName(sourceName: string): ITPCSourceInfo;
        /**
         * Returns a map of source names and their associated SSRCs for the remote participant.
         *
         * @param {string} id Endpoint id of the remote participant.
         * @returns {Map<string, TPCSourceInfo>} The map of source names and their associated SSRCs.
         */
        getRemoteSourceInfoByParticipant(id: string): Map<string, ITPCSourceInfo>;
        /**
         * Returns the target bitrates configured for the local video source.
         *
         * @param {JitsiLocalTrack} - The local video track.
         * @returns {Object}
         */
        getTargetVideoBitrates(localTrack: JitsiLocalTrack): any;
        /**
         * Tries to find {@link JitsiTrack} for given SSRC number. It will search both local and remote tracks bound to this
         * instance.
         * @param {number} ssrc
         * @return {Nullable<JitsiRemoteTrack | JitsiLocalTrack>}
         */
        getTrackBySSRC(ssrc: number): Nullable<JitsiRemoteTrack | JitsiLocalTrack>;
        /**
         * Tries to find SSRC number for given {@link JitsiTrack} id. It will search
         * both local and remote tracks bound to this instance.
         * @param {string} id
         * @return {Nullable<number>}
         */
        getSsrcByTrackId(id: string): Nullable<number>;
        /**
         * Called on "track added" and "stream added" PeerConnection events (because we
         * handle streams on per track basis). Finds the owner and the SSRC for
         * the track and passes that to ChatRoom for further processing.
         * @param {MediaStream} stream the WebRTC MediaStream instance which is
         * the parent of the track
         * @param {MediaStreamTrack} track the WebRTC MediaStreamTrack added for remote
         * participant.
         * @param {RTCRtpTransceiver} transceiver the WebRTC transceiver that is created
         * for the remote participant in unified plan.
         */
        _remoteTrackAdded(stream: MediaStream, track: MediaStreamTrack, transceiver?: Nullable<RTCRtpTransceiver>): void;
        /**
         * Initializes a new JitsiRemoteTrack instance with the data provided by the signaling layer and SDP.
         *
         * @param {string} ownerEndpointId - The owner's endpoint ID (MUC nickname)
         * @param {String} sourceName - The track's source name
         * @param {Object} trackDetails - The track's details.
         * @param {MediaType} trackDetails.mediaType - media type, 'audio' or 'video'.
         * @param {boolean} trackDetails.muted - The initial muted status.
         * @param {number} trackDetails.ssrc - The track's main SSRC number.
         * @param {MediaStream} trackDetails.stream - The WebRTC stream instance.
         * @param {MediaStreamTrack} trackDetails.track - The WebRTC track instance.
         * @param {VideoType} trackDetails.videoType - The track's type of the video (if applicable).
         */
        _createRemoteTrack(ownerEndpointId: any, sourceName: any, trackDetails: any): void;
        /**
         * Handles remote media track removal.
         *
         * @param {MediaStream} stream - WebRTC MediaStream instance which is the parent of the track.
         * @param {MediaStreamTrack} track - WebRTC MediaStreamTrack which has been removed from the PeerConnection.
         * @returns {void}
         */
        _remoteTrackRemoved(stream: MediaStream, track: MediaStreamTrack): void;
        /**
         * Removes and disposes given <tt>JitsiRemoteTrack</tt> instance. Emits {@link RTCEvents.REMOTE_TRACK_REMOVED}.
         *
         * @param {JitsiRemoteTrack} toBeRemoved - The remote track to be removed.
         * @returns {void}
         */
        _removeRemoteTrack(toBeRemoved: JitsiRemoteTrack): void;
        /**
         * Processes the local SDP and creates an SSRC map for every local track.
         *
         * @param {string} localSDP - SDP from the local description.
         * @returns {void}
         */
        _processAndExtractSourceInfo(localSDP: string): void;
        /**
         * @param {JitsiLocalTrack} localTrack
         * @returns {Nullable<number>}
         */
        getLocalSSRC(localTrack: JitsiLocalTrack): Nullable<number>;
        /**
         * Gets the signaling state of the peer connection.
         */
        get signalingState(): string;
        /**
         * Gets the ICE connection state of the peer connection.
         */
        get iceConnectionState(): string;
        /**
         * Gets the connection state of the peer connection.
         */
        get connectionState(): string;
        /**
         * Gets the local description of the peer connection, with optional transformations for
         * simulcast and stream identifiers.
         */
        get localDescription(): RTCSessionDescription;
        /**
         * Gets the remote description of the peer connection, with optional adjustments for media direction in P2P mode.
         */
        get remoteDescription(): RTCSessionDescription;
        /**
         * Retrieves the SSRC (Synchronization Source) identifier associated with the given RTC ID.
         * @private
         */
        _getSSRC(rtcId: string): Nullable<ISsrcInfo>;
        /**
         * Checks if low fps screensharing is in progress.
         *
         * @private
         * @returns {boolean} Returns true if 5 fps screensharing is in progress, false otherwise.
         */
        isSharingLowFpsScreen(): boolean;
        /**
         * Checks if screensharing is in progress.
         *
         * @returns {boolean}  Returns true if a desktop track has been added to the peerconnection, false otherwise.
         */
        _isSharingScreen(): boolean;
        /**
         * Add {@link JitsiLocalTrack} to this TPC.
         * @param {JitsiLocalTrack} track
         * @param {boolean} isInitiator indicates if the endpoint is the offerer.
         * @returns {Promise<void>} - resolved when done.
         */
        addTrack: (track: JitsiLocalTrack, isInitiator?: boolean) => Promise<void>;
        /**
         * Adds local track to the RTCPeerConnection.
         *
         * @param {JitsiLocalTrack} track the track to be added to the pc.
         * @return {Promise<boolean>} Promise that resolves to true if the underlying PeerConnection's state has changed and
         * renegotiation is required, false if no renegotiation is needed or Promise is rejected when something goes wrong.
         */
        addTrackToPc(track: JitsiLocalTrack): Promise<boolean>;
        /**
         * This method when called will check if given <tt>localTrack</tt> belongs to
         * this TPC (that it has been previously added using {@link addTrack}). If the
         * track does not belong an error message will be logged.
         * @param {string} methodName the method name that will be logged in an error
         * message
         * @param {JitsiLocalTrack} localTrack
         * @return {boolean} <tt>true</tt> if given local track belongs to this TPC or
         * <tt>false</tt> otherwise.
         * @private
         */
        _assertTrackBelongs(methodName: string, localTrack: JitsiLocalTrack): boolean;
        /**
         * Returns the codecs in the current order of preference as configured on the peerconnection.
         *
         * @param {RTCSessionDescription} - The local description to be used.
         * @returns {Array}
         */
        getConfiguredVideoCodecs(description?: RTCSessionDescription): CodecMimeType[];
        /**
         * Enables or disables simulcast for screenshare based on the frame rate requested for desktop track capture.
         *
         * @param {number} maxFps framerate to be used for desktop track capture.
         */
        setDesktopSharingFrameRate(maxFps: number): void;
        /**
         * Sets the codec preference on the peerconnection. The codec preference goes into effect when
         * the next renegotiation happens for older clients that do not support the codec selection API.
         *
         * @param {Array<CodecMimeType>} codecList - Preferred codecs for video.
         * @param {CodecMimeType} screenshareCodec - The preferred codec for screenshare.
         * @returns {boolean} - Returns true if the codec settings were updated, false otherwise.
         */
        setVideoCodecs(codecList: CodecMimeType[], screenshareCodec: CodecMimeType): boolean;
        /**
         * Remove local track from this TPC.
         * @param {JitsiLocalTrack} localTrack the track to be removed from this TPC.
         *
         * FIXME It should probably remove a boolean just like {@link removeTrackFromPc}
         *       The same applies to addTrack.
         */
        removeTrack(localTrack: JitsiLocalTrack): void;
        /**
         * Returns the receiver corresponding to the given MediaStreamTrack.
         *
         * @param {MediaSreamTrack} track - The media stream track used for the search.
         * @returns {Optional<RTCRtpReceiver>} - The found receiver or undefined if no receiver
         * was found.
         */
        findReceiverForTrack(track: MediaStreamTrack): Optional<RTCRtpReceiver>;
        /**
         * Returns the sender corresponding to the given MediaStreamTrack.
         *
         * @param {MediaSreamTrack} track - The media stream track used for the search.
         * @returns {Optional<RTCRtpSender>} - The found sender or undefined if no sender
         * was found.
         */
        findSenderForTrack(track: MediaStreamTrack): Optional<RTCRtpSender>;
        /**
         * Processes the local description SDP and caches the mids of the mlines associated with the given tracks.
         *
         * @param {Array<JitsiLocalTrack>} localTracks - local tracks that are added to the peerconnection.
         * @returns {void}
         */
        processLocalSdpForTransceiverInfo(localTracks: JitsiLocalTrack[]): void;
        /**
         * Replaces <tt>oldTrack</tt> with <tt>newTrack</tt> from the peer connection.
         * Either <tt>oldTrack</tt> or <tt>newTrack</tt> can be null; replacing a valid
         * <tt>oldTrack</tt> with a null <tt>newTrack</tt> effectively just removes
         * <tt>oldTrack</tt>
         *
         * @param {Nullable<JitsiLocalTrack>} oldTrack - The current track in use to be replaced on the pc.
         * @param {Nullable<JitsiLocalTrack>} newTrack - The new track to be used.
         * @param {boolean} isMuteOperation - Whether the operation is a mute/unmute operation.
         * @returns {Promise<boolean>} - If the promise resolves with true, renegotiation will be needed.
         * Otherwise no renegotiation is needed.
         */
        replaceTrack(oldTrack: Nullable<JitsiLocalTrack>, newTrack: Nullable<JitsiLocalTrack>, isMuteOperation?: boolean): Promise<boolean>;
        /**
         * Removes local track from the RTCPeerConnection.
         *
         * @param {JitsiLocalTrack} localTrack the local track to be removed.
         * @return {Promise<boolean>} Promise that resolves to true if the underlying PeerConnection's state has changed and
         * renegotiation is required, false if no renegotiation is needed or Promise is rejected when something goes wrong.
         */
        removeTrackFromPc(localTrack: JitsiLocalTrack): Promise<boolean>;
        /**
         * Updates the remote source map with the given source map for adding or removing sources.
         *
         * @param {Map<string, TPCSourceInfo>} sourceMap - The map of source names to their corresponding SSRCs.
         * @param {boolean} isAdd - Whether the sources are being added or removed.
         * @returns {void}
         */
        updateRemoteSources(sourceMap: Map<string, ITPCSourceInfo>, isAdd: boolean): void;
        /**
         * Returns true if the codec selection API is used for switching between codecs for the video sources.
         *
         * @returns {boolean}
         */
        usesCodecSelectionAPI(): boolean;
        /**
         * Creates a new data channel on the peer connection with the specified label and options.
         */
        createDataChannel(label: string, opts: RTCDataChannelInit): RTCDataChannel;
        /**
         * Returns the expected send resolution for a local video track based on what encodings are currently active.
         *
         * @param {JitsiLocalTrack} localTrack - The local video track.
         * @returns {number}
         */
        calculateExpectedSendResolution(localTrack: JitsiLocalTrack): number;
        /**
         * Configures the stream encodings for the audio tracks that are added to the peerconnection.
         *
         * @param {Nullable<JitsiLocalTrack>} localAudioTrack - The local audio track.
         * @returns {Promise} promise that will be resolved when the operation is successful and rejected otherwise.
         */
        configureAudioSenderEncodings(localAudioTrack?: Nullable<JitsiLocalTrack>): Promise<PromiseSettledResult<void>[]> | Promise<void>;
        /**
         * Configures the stream encodings depending on the video type,
         * scalability mode and the bitrate settings for the codec
         * that is currently selected.
         *
         * @param {Nullable<JitsiLocalTrack>} - The local track for which the sender encodings have to configured.
         * @param {CodecMimeType} - The preferred codec for the video track.
         * @returns {Promise} promise that will be resolved when the operation is successful and rejected otherwise.
         */
        configureVideoSenderEncodings(localVideoTrack?: Nullable<JitsiLocalTrack>, codec?: Nullable<CodecMimeType>): Promise<PromiseSettledResult<void>[]> | Promise<void>;
        /**
         * Sets the local description on the peerconnection.
         *
         * @param {RTCSessionDescription} description - The local description to be set.
         * @returns {Promise<void>} - Resolved when the operation is successful and rejected with an error otherwise.
         */
        setLocalDescription(description: RTCSessionDescription): Promise<void>;
        /**
         * Sets the remote description on the peerconnection.
         *
         * @param {RTCSessionDescription} description - The remote description to be set.
         * @returns {Promise<void>} - Resolved when the operation is successful and rejected with an error otherwise.
         */
        setRemoteDescription(description: RTCSessionDescription): Promise<void>;
        /**
         * Changes the resolution of the video stream that is sent to the peer based on the resolution requested by the peer
         * and user preference, sets the degradation preference on the sender
         * based on the video type, configures the maximum
         * bitrates on the send stream.
         *
         * @param {number} frameHeight - The max frame height to be imposed on the outgoing video stream.
         * @param {JitsiLocalTrack} - The local track for which the sender constraints have to be applied.
         * @param {preferredCodec} - The video codec that needs to be configured on the
         * sender associated with the video source.
         * @returns {Promise} promise that will be resolved when the operation is successful and rejected otherwise.
         */
        setSenderVideoConstraints(frameHeight: number, localVideoTrack: JitsiLocalTrack, preferredCodec?: Optional<CodecMimeType>): Promise<void>;
        /**
         * Resumes or suspends media on the peerconnection by setting the active state on RTCRtpEncodingParameters
         * associated with all the senders that have a track attached to it.
         *
         * @param {boolean} enable - whether outgoing media needs to be enabled or disabled.
         * @param {string} mediaType - media type, 'audio' or 'video', if neither is passed, all outgoing media will either
         * be enabled or disabled.
         * @returns {Promise} - A promise that is resolved when the change is succesful on all the senders, rejected
         * otherwise.
         */
        setMediaTransferActive(enable: boolean, mediaType?: Optional<MediaType>): Promise<void>;
        /**
         * Enables/disables outgoing video media transmission on this peer connection. When disabled the stream encoding's
         * active state is enabled or disabled to send or stop the media.
         * @param {boolean} active <tt>true</tt> to enable video media transmission
         * or <tt>false</tt> to disable. If the value
         * is not a boolean the call will have no effect.
         * @return {Promise} A promise that is resolved when the change is succesful, rejected otherwise.
         * @public
         */
        setVideoTransferActive(active: boolean): Promise<void>;
        /**
         * Sends DTMF tones if possible.
         *
         * @param {string} tones - The DTMF tones string as defined by {@code RTCDTMFSender.insertDTMF}, 'tones' argument.
         * @param {number} duration - The amount of time in milliseconds that each DTMF should last. It's 200ms by default.
         * @param {number} interToneGap - The length of time in miliseconds to wait between tones. It's 200ms by default.
         *
         * @returns {void}
         */
        sendTones(tones: string, duration?: number, interToneGap?: number): void;
        /**
         * Closes underlying WebRTC PeerConnection instance and removes all remote
         * tracks by emitting {@link RTCEvents.REMOTE_TRACK_REMOVED} for each one of
         * them.
         */
        close(): void;
        /**
         * Creates an SDP answer for the peer connection based on the provided constraints.
         */
        createAnswer(constraints: Optional<RTCOfferOptions>): Promise<RTCSessionDescription>;
        /**
         * Creates an SDP offer for the peer connection based on the provided constraints.
         */
        createOffer(constraints: Optional<RTCOfferOptions>): Promise<RTCSessionDescription>;
        /**
         * Track the SSRCs seen so far.
         * @param {number} ssrc - SSRC.
         * @return {boolean} - Whether this is a new SSRC.
         */
        addRemoteSsrc(ssrc: number): boolean;
        /**
         * Adds an ICE candidate to the peer connection.
         */
        addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
        /**
         * Obtains call-related stats from the peer connection.
         *
         * @returns {Promise<Object>} Promise which resolves with data providing statistics about
         * the peerconnection.
         */
        getStats(): Promise<RTCStatsReport>;
        /**
         * Creates a text representation of this <tt>TraceablePeerConnection</tt>
         * instance.
         * @return {string}
         */
        toString(): string;
    }
}
declare module "modules/RTC/JitsiTrack" {
    import JitsiConference from "JitsiConference";
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    import Listenable from "modules/util/Listenable";
    import TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    /**
     * Type for MediaStreamTrack event handler functions.
     */
    type MediaStreamTrackEventHandler = Optional<((this: MediaStreamTrack, ev: Event) => void)>;
    /**
     * Extended MediaStreamTrack interface that includes mobile-specific camera methods.
     */
    export interface IExtendedMediaStreamTrack extends MediaStreamTrack {
        _switchCamera?: () => void;
    }
    /**
     * Extended MediaStream interface that allows setting the muted property.
     */
    export interface IExtendedMediaStream extends MediaStream {
        muted?: boolean;
    }
    /**
     * Represents a single media track (either audio or video).
     *
     * @noInheritDoc
     */
    export default class JitsiTrack extends Listenable {
        private _streamInactiveHandler;
        private audioLevel;
        private type;
        private handlers;
        protected containers: HTMLElement[];
        conference: JitsiConference;
        videoType: Optional<VideoType>;
        disposed: boolean;
        /**
         * Represents a single media track (either audio or video).
         * @param conference the rtc instance
         * @param stream the WebRTC MediaStream instance
         * @param track the WebRTC MediaStreamTrack instance, must be part of
         * the given <tt>stream</tt>.
         * @param streamInactiveHandler the function that will handle
         *        onended/oninactive events of the stream.
         * @param trackMediaType the media type of the JitsiTrack
         * @param videoType the VideoType for this track if any
         */
        constructor(conference: JitsiConference, stream: MediaStream, track: MediaStreamTrack, streamInactiveHandler: MediaStreamTrackEventHandler, trackMediaType: MediaType, videoType?: VideoType);
        /**
         * Adds onended/oninactive handler to a MediaStream or a MediaStreamTrack.
         * Firefox doesn't fire a inactive event on the MediaStream, instead it fires
         * a onended event on the MediaStreamTrack.
         * @param {Function} handler the handler
         */
        private _addMediaStreamInactiveHandler;
        /**
         * Called when the track has been attached to a new container.
         *
         * @param {HTMLElement} container the HTML container which can be 'video' or
         * 'audio' element.
         */
        protected _onTrackAttach(_container: HTMLElement): void;
        /**
         * Called when the track has been detached from a container.
         *
         * @param {HTMLElement} container the HTML container which can be 'video' or
         * 'audio' element.
         */
        protected _onTrackDetach(_container: HTMLElement): void;
        /**
         * Sets the stream property of JitsiTrack object and sets all stored
         * handlers to it.
         *
         * @param {MediaStream} stream the new stream.
         */
        protected _setStream(stream: MediaStream): void;
        /**
         * Unregisters all event handlers bound to the underlying media stream/track.
         */
        protected _unregisterHandlers(): void;
        /**
         * Attaches the MediaStream of this track to an HTML container.
         * Adds the container to the list of containers that are displaying the
         * track.
         *
         * @param container the HTML container which can be 'video' or 'audio'
         * element.
         *
         * @returns {void}
         */
        attach(container: HTMLElement): Promise<void>;
        /**
         * Removes this JitsiTrack from the passed HTML container.
         *
         * @param container the HTML container to detach from this JitsiTrack. If
         * <tt>null</tt> or <tt>undefined</tt>, all containers are removed. A
         * container can be a 'video', 'audio' or 'object' HTML element instance to
         * which this JitsiTrack is currently attached.
         */
        detach(container?: HTMLElement): void;
        /**
         * Removes attached event listeners.
         *
         * @returns {Promise}
         */
        dispose(): Promise<void>;
        /**
         * Returns id of the track.
         * @returns {string|null} id of the track or null if this is fake track.
         */
        getId(): Nullable<string>;
        /**
         * Returns the WebRTC MediaStream instance.
         */
        getOriginalStream(): MediaStream;
        /**
         * Returns the source name of the track.
         * @returns {String|undefined}
         */
        getSourceName(): Optional<string>;
        /**
         * Returns the primary SSRC associated with the track.
         * @returns {number}
         */
        getSsrc(): Optional<number>;
        /**
         * Returns the ID of the underlying WebRTC Media Stream(if any)
         * @returns {String|null}
         */
        getStreamId(): Nullable<string>;
        /**
         * Return the underlying WebRTC MediaStreamTrack
         * @returns {MediaStreamTrack}
         */
        getTrack(): MediaStreamTrack;
        /**
         * Return the underlying WebRTC MediaStreamTrack label
         * @returns {string}
         */
        getTrackLabel(): string;
        /**
         * Returns the ID of the underlying WebRTC MediaStreamTrack(if any)
         * @returns {String|null}
         */
        getTrackId(): Nullable<string>;
        /**
         * Returns the type (audio or video) of this track.
         */
        getType(): MediaType;
        /**
         * Return meaningful usage label for this track depending on it's media and
         * eventual video type.
         * @returns {string}
         */
        getUsageLabel(): string;
        /**
         * Returns the video type (camera or desktop) of this track.
         */
        getVideoType(): Optional<VideoType>;
        /**
         * Returns the height of the track in normalized landscape format.
         */
        getHeight(): number;
        /**
         * Returns the width of the track in normalized landscape format.
         */
        getWidth(): number;
        /**
         * Checks whether the MediaStream is active/not ended.
         * When there is no check for active we don't have information and so
         * will return that stream is active (in case of FF).
         * @returns {boolean} whether MediaStream is active.
         */
        isActive(): boolean;
        /**
         * Check if this is an audio track.
         */
        isAudioTrack(): boolean;
        /**
         * Checks whether this is a local track.
         * @abstract
         * @return {boolean} 'true' if it's a local track or 'false' otherwise.
         */
        isLocal(): boolean;
        /**
         * Check whether this is a local audio track.
         *
         * @return {boolean} -  true if track represents a local audio track, false otherwise.
         */
        isLocalAudioTrack(): boolean;
        /**
         * Check if this is a video track.
         */
        isVideoTrack(): boolean;
        /**
         * Checks whether this track is muted.
         * @abstract
         * @return {boolean}
         */
        isMuted(): boolean;
        /**
         * Sets the audio level for the stream
         * @param {number} audioLevel value between 0 and 1
         * @param {TraceablePeerConnection} [tpc] the peerconnection instance which
         * is source for the audio level. It can be <tt>undefined</tt> for
         * a local track if the audio level was measured outside of the
         * peerconnection (see /modules/statistics/LocalStatsCollector.js).
         */
        setAudioLevel(audioLevel: number, tpc?: TraceablePeerConnection): void;
        /**
         * Sets new audio output device for track's DOM elements. Video tracks are
         * ignored. Emits `JitsiTrackEvents.TRACK_AUDIO_OUTPUT_CHANGED`.
         * @param {string} audioOutputDeviceId - id of 'audiooutput' device from
         *      navigator.mediaDevices.enumerateDevices(), '' for default device
         * @returns {Promise}
         */
        setAudioOutput(audioOutputDeviceId: string): Promise<void>;
        /**
         * Assigns the source name to a track.
         * @param {String} _name - The name to be assigned to the track.
         * @returns {void}
         */
        setSourceName(_name: string): void;
    }
}
declare module "modules/watchRTC/functions" {
    /**
     * Checks whether analytics is enabled or not.
     *
     * @param {Object} options - Init options.
     * @returns {boolean}
     */
    export function isAnalyticsEnabled(options: any): boolean;
    /**
     * Checks whether rtcstats is enabled or not.
     *
     * @param {Object} options - Init options.
     * @returns {boolean}
     */
    export function isRtcstatsEnabled(options: any): boolean;
    /**
     * Checks whether watchrtc is enabled or not.
     *
     * @param {Object} options - Init options.
     * @returns {boolean}
     */
    export function isWatchRTCEnabled(options: any): boolean;
}
declare module "modules/watchRTC/interfaces" {
    export interface IWatchRTCConfiguration {
        allowBrowserLogCollection?: boolean;
        collectionInterval?: number;
        console?: {
            level: string;
            override: boolean;
        };
        debug?: boolean;
        keys?: any;
        logGetStats?: boolean;
        proxyUrl?: string;
        rtcApiKey: string;
        rtcPeerId?: string;
        rtcRoomId?: string;
        rtcTags?: string[];
        rtcToken?: string;
        wsUrl?: string;
    }
}
declare module "modules/watchRTC/WatchRTC" {
    import { IWatchRTCConfiguration } from "modules/watchRTC/interfaces";
    /**
     * Class that controls the watchRTC flow, because it overwrites and proxies global function it should only be
     * initialized once.
     */
    class WatchRTCHandler {
        options?: IWatchRTCConfiguration;
        /**
         * Initialize watchRTC, it overwrites GUM and PeerConnection global functions and adds a proxy over them
         * used to capture stats.
         *
         * @param {Object} options - Init options.
         * @returns {void}
         */
        init(options: any): void;
        /**
         * Begin watchRTC session considering roomName and userName if already not available
         *
         * @param {string} roomName - The room name we are currently in.
         * @param {string} userName - The user name. This value is obtained from
         * JitsiConference.prototype.myUserId
         * @returns {void}
         */
        start(roomName: string, userName: string): void;
    }
    const _default_2: WatchRTCHandler;
    export default _default_2;
}
declare module "JitsiConnectionErrors" {
    /**
     * The errors for the connection.
     */
    export enum JitsiConnectionErrors {
        /**
         * When the conference-request to jicofo fails.
         */
        CONFERENCE_REQUEST_FAILED = "connection.conferenceRequestFailed",
        /**
         * Indicates that the connection was dropped with an error which was most likely
         * caused by some networking issues. The dropped term in this context means that
         * the connection was closed unexpectedly (not on user's request).
         *
         * One example is 'item-not-found' error thrown by Prosody when the BOSH session
         * times out after 60 seconds of inactivity. On the other hand 'item-not-found'
         * could also happen when BOSH request is sent to the server with the session-id
         * that is not know to the server. But this should not happen in lib-jitsi-meet
         * case as long as the service is configured correctly (there is no bug).
         */
        CONNECTION_DROPPED_ERROR = "connection.droppedError",
        /**
         * Not ready error. When the conference error is not ready according to jicofo.
         */
        NOT_LIVE_ERROR = "connection.notLiveError",
        /**
         * Not specified errors.
         */
        OTHER_ERROR = "connection.otherError",
        /**
         * Indicates that a password is required in order to join the conference.
         */
        PASSWORD_REQUIRED = "connection.passwordRequired",
        /**
         * Indicates that the connection was dropped, because of too many 5xx HTTP
         * errors on BOSH requests.
         */
        SERVER_ERROR = "connection.serverError",
        /**
         * Indicates that the connection was dropped, because of conference being moved to a new shard.
         */
        SHARD_CHANGED_ERROR = "connection.shardChangedError"
    }
    export const CONFERENCE_REQUEST_FAILED = JitsiConnectionErrors.CONFERENCE_REQUEST_FAILED;
    export const CONNECTION_DROPPED_ERROR = JitsiConnectionErrors.CONNECTION_DROPPED_ERROR;
    export const NOT_LIVE_ERROR = JitsiConnectionErrors.NOT_LIVE_ERROR;
    export const OTHER_ERROR = JitsiConnectionErrors.OTHER_ERROR;
    export const PASSWORD_REQUIRED = JitsiConnectionErrors.PASSWORD_REQUIRED;
    export const SERVER_ERROR = JitsiConnectionErrors.SERVER_ERROR;
    export const SHARD_CHANGED_ERROR = JitsiConnectionErrors.SHARD_CHANGED_ERROR;
}
declare module "modules/util/Deferred" {
    /**
     * Promise-like object which can be passed around for resolving it later. It
     * implements the "thenable" interface, so it can be used wherever a Promise
     * could be used.
     *
     * In addition a "reject on timeout" functionality is provided.
     */
    export default class Deferred<T = any> {
        private _timeout?;
        promise: Promise<T>;
        resolve: (value: T | PromiseLike<T>) => void;
        reject: (reason?: any) => void;
        then: Promise<T>['then'];
        catch: Promise<T>['catch'];
        /**
         * Instantiates a Deferred object.
         */
        constructor();
        /**
         * Clears the reject timeout.
         */
        clearRejectTimeout(): void;
        /**
         * Rejects the promise after the given timeout.
         */
        setRejectTimeout(ms: number): void;
    }
}
declare module "modules/e2ee/E2EEContext" {
    /**
     * Context encapsulating the cryptography bits required for E2EE.
     * This uses the WebRTC Insertable Streams API which is explained in
     *   https://github.com/alvestrand/webrtc-media-streams/blob/master/explainer.md
     * that provides access to the encoded frames and allows them to be transformed.
     *
     * The encoded frame format is explained below in the _encodeFunction method.
     * High level design goals were:
     * - do not require changes to existing SFUs and retain (VP8) metadata.
     * - allow the SFU to rewrite SSRCs, timestamp, pictureId.
     * - allow for the key to be rotated frequently.
     */
    export default class E2EEcontext {
        /**
         * Build a new E2EE context instance, which will be used in a given conference.
         * @param {boolean} [options.sharedKey] - whether there is a uniques key shared amoung all participants.
         */
        constructor({ sharedKey }?: boolean);
        _worker: Worker;
        /**
         * Cleans up all state associated with the given participant. This is needed when a
         * participant leaves the current conference.
         *
         * @param {string} participantId - The participant that just left.
         */
        cleanup(participantId: string): void;
        /**
         * Cleans up all state associated with all participants in the conference. This is needed when disabling e2ee.
         *
         */
        cleanupAll(): void;
        /**
         * Handles the given {@code RTCRtpReceiver} by creating a {@code TransformStream} which will inject
         * a frame decoder.
         *
         * @param {RTCRtpReceiver} receiver - The receiver which will get the decoding function injected.
         * @param {string} kind - The kind of track this receiver belongs to.
         * @param {string} participantId - The participant id that this receiver belongs to.
         */
        handleReceiver(receiver: RTCRtpReceiver, kind: string, participantId: string): void;
        /**
         * Handles the given {@code RTCRtpSender} by creating a {@code TransformStream} which will inject
         * a frame encoder.
         *
         * @param {RTCRtpSender} sender - The sender which will get the encoding function injected.
         * @param {string} kind - The kind of track this sender belongs to.
         * @param {string} participantId - The participant id that this sender belongs to.
         */
        handleSender(sender: RTCRtpSender, kind: string, participantId: string): void;
        /**
         * Set the E2EE enabled state.
         *
         * @param {boolean} enabled - whether E2EE is enabled or not.
         */
        setEnabled(enabled: boolean): void;
        /**
         * Set the E2EE key for the specified participant.
         *
         * @param {string} participantId - the ID of the participant who's key we are setting.
         * @param {Uint8Array | boolean} key - they key for the given participant.
         * @param {Number} keyIndex - the key index.
         */
        setKey(participantId: string, key: Uint8Array | boolean, keyIndex: number): void;
    }
}
declare module "modules/e2ee/KeyHandler" {
    /**
     * Abstract class that integrates {@link E2EEContext} with a key management system.
     */
    export class KeyHandler extends Listenable {
        /**
         * Build a new KeyHandler instance, which will be used in a given conference.
         * @param {JitsiConference} conference - the current conference.
         * @param {object} options - the options passed to {E2EEContext}, see implemention.
         */
        constructor(conference: JitsiConference, options?: object);
        conference: JitsiConference;
        e2eeCtx: E2EEContext;
        enabled: boolean;
        _enabling: Deferred<any>;
        _firstEnable: boolean;
        /**
         * Indicates whether E2EE is currently enabled or not.
         *
         * @returns {boolean}
         */
        isEnabled(): boolean;
        /**
         * Enables / disables End-To-End encryption.
         *
         * @param {boolean} enabled - whether E2EE should be enabled or not.
         * @returns {void}
         */
        setEnabled(enabled: boolean): void;
        /**
         * Setup E2EE on the new track that has been added to the conference, apply it on all the open peerconnections.
         * @param {JitsiLocalTrack} track - the new track that's being added to the conference.
         * @private
         */
        private _onLocalTrackAdded;
        /**
         * Setups E2E encryption for the new session.
         * @param {JingleSessionPC} session - the new media session.
         * @private
         */
        private _onMediaSessionStarted;
        /**
         * Setup E2EE for the receiving side.
         *
         * @private
         */
        private _setupReceiverE2EEForTrack;
        /**
         * Setup E2EE for the sending side.
         *
         * @param {JingleSessionPC} session - the session which sends the media produced by the track.
         * @param {JitsiLocalTrack} track - the local track for which e2e encoder will be configured.
         * @private
         */
        private _setupSenderE2EEForTrack;
        /**
         * Setup E2EE on the sender that is created for the unmuted local video track.
         * @param {JitsiLocalTrack} track - the track for which muted status has changed.
         * @private
         */
        private _trackMuteChanged;
    }
    import Listenable from "modules/util/Listenable";
    import E2EEContext from "modules/e2ee/E2EEContext";
    import Deferred from "modules/util/Deferred";
}
declare module "modules/e2ee/ExternallyManagedKeyHandler" {
    /**
     * This module integrates {@link E2EEContext} with {external} in order to set the keys for encryption.
     */
    export class ExternallyManagedKeyHandler extends KeyHandler {
        /**
         * Build a new ExternallyManagedKeyHandler instance, which will be used in a given conference.
         * @param conference - the current conference.
         */
        constructor(conference: any);
        /**
         * Sets the key and index for End-to-End encryption.
         *
         * @param {CryptoKey} [keyInfo.encryptionKey] - encryption key.
         * @param {Number} [keyInfo.index] - the index of the encryption key.
         * @returns {void}
         */
        setKey(keyInfo: any): void;
    }
    import { KeyHandler } from "modules/e2ee/KeyHandler";
}
declare module "modules/e2ee/E2EEErrors" {
    export enum E2EEErrors {
        E2EE_OLM_NO_ONE_TIME_KEYS = "e2ee.olm.no-one-time-keys",
        E2EE_OLM_SESSION_ALREADY_EXISTS = "e2ee.olm.session-already-exists",
        E2EE_OLM_SESSION_INIT_PENDING = "e2ee.olm.session-init-pending",
        E2EE_SAS_CHANNEL_VERIFICATION_FAILED = "e2ee.sas.channel-verification-failed",
        E2EE_SAS_COMMITMENT_MISMATCHED = "e2ee.sas.commitment-mismatched",
        E2EE_SAS_INVALID_SAS_VERIFICATION = "e2ee.sas.invalid-sas-verification",
        E2EE_SAS_KEYS_MAC_MISMATCH = "e2ee.sas.keys-mac-mismatch",
        E2EE_SAS_MAC_MISMATCH = "e2ee.sas.mac-mismatch",
        E2EE_SAS_MISSING_KEY = "e2ee.sas.missing-key"
    }
}
declare module "modules/e2ee/SAS" {
    export interface ISas {
        [key: string]: number[] | [string, string][];
    }
    /**
     * Generates multiple SAS for the given bytes.
     *
     * @param {Uint8Array} sasBytes - The bytes from sas.generate_bytes.
     * @returns {ISas}
     */
    export function generateSas(sasBytes: Uint8Array): ISas;
}
declare module "modules/e2ee/OlmAdapter" {
    /**
     * This class implements an End-to-End Encrypted communication channel between every two peers
     * in the conference. This channel uses libolm to achieve E2EE.
     *
     * The created channel is then used to exchange the secret key that each participant will use
     * to encrypt the actual media (see {@link E2EEContext}).
     *
     * A simple JSON message based protocol is implemented, which follows a request - response model:
     * - session-init: Initiates an olm session establishment procedure. This message will be sent
     *                 by the participant who just joined, to everyone else.
     * - session-ack: Completes the olm session etablishment. This messsage may contain ancilliary
     *                encrypted data, more specifically the sender's current key.
     * - key-info: Includes the sender's most up to date key information.
     * - key-info-ack: Acknowledges the reception of a key-info request. In addition, it may contain
     *                 the sender's key information, if available.
     * - error: Indicates a request processing error has occurred.
     *
     * These requessts and responses are transport independent. Currently they are sent using XMPP
     * MUC private messages.
     */
    export class OlmAdapter extends Listenable {
        /**
         * Indicates if olm is supported on the current platform.
         *
         * @returns {boolean}
         */
        static isSupported(): boolean;
        /**
         * Creates an adapter instance for the given conference.
         */
        constructor(conference: any);
        _conf: any;
        _init: Deferred<any>;
        _mediaKey: boolean | Uint8Array<ArrayBufferLike>;
        _mediaKeyIndex: number;
        _reqs: Map<any, any>;
        _sessionInitialization: Deferred<any>;
        _sessionReadyCallbacks: Map<any, any>;
        /**
         * Returns the current participants conference ID.
         *
         * @returns {string}
         */
        get myId(): string;
        /**
         * Starts new olm sessions with every other participant and waits for all sessions to be established.
         * This includes both outgoing sessions (initiated by us to participants with higher IDs) and
         * incoming sessions (initiated by participants with lower IDs).
         */
        initSessions(): Promise<void>;
        /**
         * Updates the current participant key and distributes it to all participants in the conference
         * by sending a key-info message.
         *
         * @param {Uint8Array|boolean} key - The new key.
         * @retrns {Promise<Number>}
         */
        updateKey(key: Uint8Array | boolean): Promise<number>;
        /**
         * Updates the current participant key.
         * @param {Uint8Array|boolean} key - The new key.
         * @returns {number}
        */
        updateCurrentMediaKey(key: Uint8Array | boolean): number;
        /**
         * Frees the olmData session for the given participant and clears all session-related state.
         *
         */
        clearParticipantSession(participant: any): void;
        /**
         * Frees the olmData sessions for all participants.
         *
         */
        clearAllParticipantsSessions(): void;
        /**
         * Sends sacMac if channel verification waas successful.
         *
         */
        markParticipantVerified(participant: any, isVerified: any): void;
        /**
         * Internal helper to bootstrap the olm library.
         *
         * @returns {Promise<void>}
         * @private
         */
        private _bootstrapOlm;
        _olmAccount: any;
        _idKeys: any;
        /**
         * Starts the verification process for the given participant as described here
         * https://spec.matrix.org/latest/client-server-api/#short-authentication-string-sas-verification
         *
         *    |                                 |
              | m.key.verification.start        |
              |-------------------------------->|
              |                                 |
              |       m.key.verification.accept |
              |<--------------------------------|
              |                                 |
              | m.key.verification.key          |
              |-------------------------------->|
              |                                 |
              |          m.key.verification.key |
              |<--------------------------------|
              |                                 |
              | m.key.verification.mac          |
              |-------------------------------->|
              |                                 |
              |          m.key.verification.mac |
              |<--------------------------------|
              |                                 |
         *
         * @param {JitsiParticipant} participant - The target participant.
         * @returns {Promise<void>}
         * @private
         */
        private startVerification;
        /**
         * Publishes our own Olmn id key in presence.
         * @private
         */
        private _onIdKeysReady;
        /**
         * Event posted when the E2EE signalling channel has been established with the given participant.
         * @private
         */
        private _onParticipantE2EEChannelReady;
        /**
         * Internal helper for encrypting the current key information for a given participant.
         *
         * @param {Olm.Session} session - Participant's session.
         * @returns {string} - The encrypted text with the key information.
         * @private
         */
        private _encryptKeyInfo;
        /**
         * Internal helper for getting the olm related data associated with a participant.
         *
         * @param {JitsiParticipant} participant - Participant whose data wants to be extracted.
         * @returns {Object}
         * @private
         */
        private _getParticipantOlmData;
        /**
         * Handles leaving the conference, cleaning up olm sessions.
         *
         * @private
         */
        private _onConferenceLeft;
        /**
         * Main message handler. Handles 1-to-1 messages received from other participants
         * and send the appropriate replies.
         *
         * @private
         */
        private _onEndpointMessageReceived;
        /**
         * Handles a participant leaving. When a participant leaves their olm session is destroyed.
         *
         * @private
         */
        private _onParticipantLeft;
        /**
        * Handles an update in a participant's presence property.
        *
        * @param {JitsiParticipant} participant - The participant.
        * @param {string} name - The name of the property that changed.
        * @param {*} oldValue - The property's previous value.
        * @param {*} newValue - The property's new value.
        * @private
        */
        private _onParticipantPropertyChanged;
        /**
         * Builds and sends an error message to the target participant.
         *
         * @param {JitsiParticipant} participant - The target participant.
         * @param {string} error - The error message.
         * @returns {void}
         */
        _sendError(participant: JitsiParticipant, error: string): void;
        /**
         * Internal helper to send the given object to the given participant ID.
         * This function merely exists so the transport can be easily swapped.
         * Currently messages are transmitted via XMPP MUC private messages.
         *
         * @param {object} data - The data that will be sent to the target participant.
         * @param {string} participantId - ID of the target participant.
         */
        _sendMessage(data: object, participantId: string): void;
        /**
         * Builds and sends the session-init request to the target participant.
         *
         * @param {JitsiParticipant} participant - Participant to whom we'll send the request.
         * @returns {Promise} - The promise will be resolved when the session-ack is received.
         * @private
         */
        private _sendSessionInit;
        /**
         * Builds and sends the SAS MAC message to the given participant.
         * The second phase of the verification process, the Key verification phase
            https://spec.matrix.org/latest/client-server-api/#short-authentication-string-sas-verification
         */
        _sendSasMac(participant: any): void;
        /**
         * Computes the commitment.
         */
        _computeCommitment(pubKey: any, data: any): any;
    }
    export namespace OlmAdapter {
        export { OlmAdapterEvents as events };
    }
    import Listenable from "modules/util/Listenable";
    import Deferred from "modules/util/Deferred";
    namespace OlmAdapterEvents {
        let PARTICIPANT_E2EE_CHANNEL_READY: string;
        let PARTICIPANT_KEY_UPDATED: string;
        let PARTICIPANT_SAS_AVAILABLE: string;
        let PARTICIPANT_SAS_READY: string;
        let PARTICIPANT_VERIFICATION_COMPLETED: string;
    }
    export {};
}
declare module "modules/e2ee/crypto-utils" {
    /**
     * Derives a set of keys from the master key.
     * @param {CryptoKey} material - master key to derive from
     *
     * See https://tools.ietf.org/html/draft-omara-sframe-00#section-4.3.1
     */
    export function deriveKeys(material: CryptoKey): Promise<{
        encryptionKey: CryptoKey;
        material: CryptoKey;
    }>;
    /**
     * Ratchets a key. See
     * https://tools.ietf.org/html/draft-omara-sframe-00#section-4.3.5.1
     * @param {CryptoKey} material - base key material
     * @returns {Promise<ArrayBuffer>} - ratcheted key material
     */
    export function ratchet(material: CryptoKey): Promise<ArrayBuffer>;
    /**
     * Converts a raw key into a WebCrypto key object with default options
     * suitable for our usage.
     * @param {ArrayBuffer} keyBytes - raw key
     * @param {Array} keyUsages - key usages, see importKey documentation
     * @returns {Promise<CryptoKey>} - the WebCrypto key.
     */
    export function importKey(keyBytes: ArrayBuffer): Promise<CryptoKey>;
}
declare module "modules/e2ee/ManagedKeyHandler" {
    /**
     * This module integrates {@link E2EEContext} with {@link OlmAdapter} in order to distribute the keys for encryption.
     */
    export class ManagedKeyHandler extends KeyHandler {
        /**
         * Build a new AutomaticKeyHandler instance, which will be used in a given conference.
         */
        constructor(conference: any);
        _key: boolean | Uint8Array<ArrayBufferLike> | Uint8Array<ArrayBuffer>;
        _conferenceJoined: boolean;
        _olmAdapter: OlmAdapter;
        _rotateKey: import("lodash").DebouncedFunc<() => Promise<void>>;
        _ratchetKey: import("lodash").DebouncedFunc<() => Promise<void>>;
        /**
         * Returns the sasVerficiation object.
         *
         * @returns {Object}
         */
        get sasVerification(): any;
        /**
         * When E2EE is enabled it initializes sessions and sets the key.
         * Cleans up the sessions when disabled.
         *
         * @param {boolean} enabled - whether E2EE should be enabled or not.
         * @returns {void}
         */
        _setEnabled(enabled: boolean): void;
        /**
         * Handles an update in a participant's presence property.
         *
         * @param {JitsiParticipant} participant - The participant.
         * @param {string} name - The name of the property that changed.
         * @param {*} oldValue - The property's previous value.
         * @param {*} newValue - The property's new value.
         * @private
         */
        private _onParticipantPropertyChanged;
        /**
         * Advances (using ratcheting) the current key when a new participant joins the conference.
         * @private
         */
        private _onParticipantJoined;
        /**
         * Rotates the current key when a participant leaves the conference.
         * @private
         */
        private _onParticipantLeft;
        /**
         * Rotates the local key. Rotating the key implies creating a new one, then distributing it
         * to all participants and once they all received it, start using it.
         *
         * @private
         */
        private _rotateKeyImpl;
        /**
         * Advances the current key by using ratcheting.
         *
         * @private
         */
        private _ratchetKeyImpl;
        /**
         * Handles an update in a participant's key.
         *
         * @param {string} id - The participant ID.
         * @param {Uint8Array | boolean} key - The new key for the participant.
         * @param {Number} index - The new key's index.
         * @private
         */
        private _onParticipantKeyUpdated;
        /**
         * Handles the SAS ready event.
         *
         * @param {string} pId - The participant ID.
         * @param {Uint8Array} sas - The bytes from sas.generate_bytes..
         * @private
         */
        private _onParticipantSasReady;
        /**
         * Handles the sas available event.
         *
         * @param {string} pId - The participant ID.
         * @private
         */
        private _onParticipantSasAvailable;
        /**
         * Handles the SAS completed event.
         *
         * @param {string} pId - The participant ID.
         * @param {boolean} success - Wheter the verification was succesfull.
         * @private
         */
        private _onParticipantVerificationCompleted;
        /**
         * Generates a new 256 bit random key.
         *
         * @returns {Uint8Array}
         * @private
         */
        private _generateKey;
    }
    import { KeyHandler } from "modules/e2ee/KeyHandler";
    import { OlmAdapter } from "modules/e2ee/OlmAdapter";
}
declare module "modules/e2ee/E2EEncryption" {
    /**
     * This module integrates {@link KeyHandler} with {@link JitsiConference} in order to enable E2E encryption.
     */
    export class E2EEncryption {
        /**
         * Indicates if E2EE is supported in the current platform.
         *
         * @param {object} config - Global configuration.
         * @returns {boolean}
         */
        static isSupported(config: object): boolean;
        /**
         * A constructor.
         * @param {JitsiConference} conference - The conference instance for which E2E encryption is to be enabled.
         */
        constructor(conference: JitsiConference);
        _externallyManaged: any;
        _keyHandler: ExternallyManagedKeyHandler | ManagedKeyHandler;
        /**
         * Indicates whether E2EE is currently enabled or not.
         *
         * @returns {boolean}
         */
        isEnabled(): boolean;
        /**
         * Enables / disables End-To-End encryption.
         *
         * @param {boolean} enabled - whether E2EE should be enabled or not.
         * @returns {void}
         */
        setEnabled(enabled: boolean): void;
        /**
         * Sets the key and index for End-to-End encryption.
         *
         * @param {CryptoKey} [keyInfo.encryptionKey] - encryption key.
         * @param {Number} [keyInfo.index] - the index of the encryption key.
         * @returns {void}
         */
        setEncryptionKey(keyInfo: any): void;
        /**
         * Starts the verification process of the participant
         *
         * @param {Participant} - participant to be verified.
         * @returns {void}
         */
        startVerification(participant: any): void;
        /**
         * Marks the channel as verified
         *
         * @param {Participant} - participant to be verified.
         * @param {boolean} isVerified - whether the verification was succesfull.
         * @returns {void}
         */
        markParticipantVerified(participant: any, isVerified: boolean): void;
    }
    import { ExternallyManagedKeyHandler } from "modules/e2ee/ExternallyManagedKeyHandler";
    import { ManagedKeyHandler } from "modules/e2ee/ManagedKeyHandler";
}
declare module "JitsiTranscriptionStatus" {
    export enum JitsiTranscriptionStatus {
        /**
         * The transcription is off.
         */
        OFF = "OFF",
        /**
         * The transcription is on.
         */
        ON = "ON"
    }
    export const ON = JitsiTranscriptionStatus.ON;
    export const OFF = JitsiTranscriptionStatus.OFF;
}
declare module "service/authentication/AuthenticationEvents" {
    export enum AuthenticationEvents {
        /**
         * Event callback arguments:
         * function(authenticationEnabled, userIdentity)
         * authenticationEnabled - indicates whether authentication has been enabled
         *                         in this session
         * userIdentity - if user has been logged in then it contains user name. If
         *                contains 'null' or 'undefined' then user is not logged in.
         */
        IDENTITY_UPDATED = "authentication.identity_updated"
    }
}
declare module "modules/util/UsernameGenerator" {
    /**
     * Generate random username.
     * @returns {string} random username
     */
    function generateUsername(): string;
    export { generateUsername };
}
declare module "modules/settings/Settings" {
    /**
     *
     */
    export interface ISettings {
        _storage: Storage;
        readonly callStatsUserName: string;
        init: (externalStorage?: Storage) => void;
        readonly machineId: string;
        sessionId: string;
    }
    const Settings: ISettings;
    export default Settings;
}
declare module "modules/util/EventEmitterForwarder" {
    /**
     * Implements utility to forward events from one eventEmitter to another.
     * @param src {object} instance of EventEmitter or another class that implements
     * addListener method which will register listener to EventEmitter instance.
     * @param dest {object} instance of EventEmitter or another class that
     * implements emit method which will emit an event.
     */
    export default class EventEmitterForwarder {
        src: any;
        dest: any;
        listeners: Map<any, any>;
        /**
         * @constructor
         */
        constructor(src: any, dest: any);
        /**
         * Adds event to be forwarded from src to dest.
         * @param srcEvent {string} the event that EventEmitterForwarder is listening
         * for.
         * @param dstEvent {string} the event that will be fired from dest.
         * @param arguments all other passed arguments are going to be fired with
         * dstEvent.
         */
        forward(...args: any[]): void;
        /**
         * Clears the listeners for the supplied events.
         *
         * @param args all the events which listeners to be cleaned.
         */
        removeListeners(...args: any[]): void;
    }
}
declare module "modules/util/Retry" {
    /**
     * Gets next timeout using the full jitter pattern.
     *
     * NOTE that there are no checks for argument correctness, so either do the math or use defaults.
     *
     * @param {number} retry - The retry number.
     * @param {number} minDelay - The minimal delay in milliseconds.
     * @param {number} base - The exponent base.
     * @returns {number} - The amount of waiting before trying another time given in milliseconds.
     * @private
     */
    export function getJitterDelay(retry: number, minDelay?: number, base?: number): number;
}
declare module "modules/xmpp/AVModeration" {
    import { MediaType } from "service/RTC/MediaType";
    import ChatRoom from "modules/xmpp/ChatRoom";
    export interface IModerationEnabledByType {
        audio: boolean;
        desktop: boolean;
        video: boolean;
    }
    export interface IMessageObject {
        actor: string;
        approved: boolean;
        enabled: boolean;
        mediaType: MediaType;
        removed: boolean;
        whitelists: {
            audio: string[];
            video: string[];
        };
    }
    /**
     * The AVModeration logic.
     */
    export default class AVModeration {
        private _xmpp;
        private _mainRoom;
        private _moderationEnabledByType;
        private _whitelistAudio;
        private _whitelistDesktop;
        private _whitelistVideo;
        /**
         * Constructs AV moderation room.
         *
         * @param {ChatRoom} room the main room.
         */
        constructor(room: ChatRoom);
        /**
         * Stops listening for events.
         */
        dispose(): void;
        /**
         * Whether AV moderation is supported on backend.
         *
         * @returns {boolean} whether AV moderation is supported on backend.
         */
        isSupported(): boolean;
        /**
         * Enables or disables AV Moderation by sending a msg with command to the component.
         */
        enable(state: boolean, mediaType: MediaType): void;
        /**
         * Approves that a participant can unmute by sending a msg with its jid to the component.
         */
        approve(mediaType: MediaType, jid: string): void;
        /**
         * Rejects that a participant can unmute by sending a msg with its jid to the component.
         */
        reject(mediaType: MediaType, jid: string): void;
        /**
         * Receives av_moderation parsed messages as json.
         * @param obj the parsed json content of the message to process.
         * @private
         */
        _onMessage(obj: IMessageObject): void;
    }
}
declare module "modules/xmpp/BreakoutRooms" {
    /**
     * Helper class for handling breakout rooms.
     */
    export default class BreakoutRooms {
        /**
         * Constructs breakout room.
         *
         * @param {ChatRoom} room the room we are in.
         */
        constructor(room: ChatRoom);
        room: ChatRoom;
        /**
         * Handles a message for managing breakout rooms.
         *
         * @param {object} payload - Arbitrary data.
         */
        _handleMessages(payload: object): void;
        _rooms: {};
        /**
         * Stops listening for events.
         */
        dispose(): void;
        /**
         * Creates a breakout room with the given subject.
         *
         * @param {string} subject - A subject for the breakout room.
         */
        createBreakoutRoom(subject: string): void;
        /**
         * Removes a breakout room.
         *
         * @param {string} breakoutRoomJid - JID of the room to be removed.
         */
        removeBreakoutRoom(breakoutRoomJid: string): void;
        /**
         * Changes the subject of a breakout room.
         *
         * @param {string} breakoutRoomJid - JID of the room to be removed.
         * @param {string} subject - A new subject for the breakout room.
         */
        renameBreakoutRoom(breakoutRoomJid: string, subject: string): void;
        /**
         * Sends the given participant to the given room.
         *
         * @param {string} participantJid - JID of the participant to be sent to a room.
         * @param {string} roomJid - JID of the target room.
         */
        sendParticipantToRoom(participantJid: string, roomJid: string): void;
        /**
         * Retrieves whether a breakout room feature is supported.
         *
         * @param {string} feature - Feature to check.
         * @returns Wether the feature is supported.
         */
        isFeatureSupported(feature: string): boolean;
        /**
         * Whether Breakout Rooms support is enabled in the backend or not.
         */
        isSupported(): boolean;
        /**
         * Gets the address of the Breakout Rooms XMPP component.
         *
         * @returns The address of the component.
         */
        getComponentAddress(): any;
        /**
         * Stores if the current room is a breakout room.
         *
         * @param {boolean} isBreakoutRoom - Whether this room is a breakout room.
         */
        _setIsBreakoutRoom(isBreakoutRoom: boolean): void;
        _isBreakoutRoom: boolean;
        /**
         * Checks whether this room is a breakout room.
         *
         * @returns True if the room is a breakout room, false otherwise.
         */
        isBreakoutRoom(): boolean;
        /**
         * Sets the main room JID associated with this breakout room. Only applies when
         * in a breakout room.
         *
         * @param {string} jid - The main room JID.
         */
        _setMainRoomJid(jid: string): void;
        _mainRoomJid: string;
        /**
         * Gets the main room's JID associated with this breakout room.
         *
         * @returns The main room JID.
         */
        getMainRoomJid(): string;
        /**
         * Filters the hidden participants from the payload.
         *
         * @param {Object} payload - The payload of the update message.
         * @return {Object} - The filtered payload.
         */
        _filterUpdatePayload(payload: any): any;
        /**
         * Helper to send a breakout rooms message to the component.
         *
         * @param {Object} message - Command that needs to be sent.
         */
        _sendMessage(message: any): void;
    }
}
declare module "modules/xmpp/FileSharing" {
    import ChatRoom from "modules/xmpp/ChatRoom";
    export const IDENTITY_TYPE = "file-sharing";
    /**
     * The file metadata used in file sharing.
     * Fields like `authorParticipantId`, `authorParticipantJid`, and `authorParticipantName` and `conferenceFullName` will
     * be set by the backend, so passing them is optional.
     */
    export type IFileMetadata = {
        /**
         * The ID of the participant who uploaded the file.
         */
        authorParticipantId?: string;
        /**
         * The connection JID of the participant who uploaded the file.
         */
        authorParticipantJid?: string;
        /**
         * The name of the participant who uploaded the file.
         */
        authorParticipantName?: string;
        /**
         * The jid of the conference where the file was uploaded.
         */
        conferenceFullName?: string;
        /**
         * The unique ID of the file.
         */
        fileId: string;
        /**
         * The name of the file.
         */
        fileName: string;
        /**
         * The size of the file in bytes.
         */
        fileSize: number;
        /**
         * The file type (file extension).
         */
        fileType: string;
        /**
         * The time when it was uploaded.
         */
        timestamp: number;
    };
    /**
     * The FileSharing logic.
     */
    export default class FileSharing {
        private _mainRoom;
        private _xmpp;
        /**
         * Constructs File sharing manager for a room.
         *
         * @param {ChatRoom} room the main room.
         */
        constructor(room: ChatRoom);
        /**
         * Stops listening for events.
         */
        dispose(): void;
        /**
         * Whether file sharing is supported on backend.
         *
         * @returns {boolean} whether file sharing is supported on backend.
         */
        isSupported(): boolean;
        /**
         * Returns the file sharing identity type (service name).
         *
         * @returns {string} the file sharing service name.
         */
        getIdentityType(): string;
        /**
         * Adds a file to the file sharing component after the file has been uploaded.
         * @param metadata - The metadata of the file to be added.
         */
        addFile(metadata: IFileMetadata): void;
        /**
         * Removes a file from the file sharing component after the file was deleted.
         * @param fileId - The file ID of the file to be removed.
         */
        removeFile(fileId: string): void;
        /**
         * Helper to send a file sharing message to the component.
         *
         * @param {Object} message - Command that needs to be sent.
         * @param {Object} content - The content to add to the element created if any.
         */
        _sendMessage(message: object, content?: object): void;
        /**
         * Handles a message for file sharing.
         *
         * @param {object} payload - Arbitrary data.
         */
        _handleMessages(payload: any): void;
    }
}
declare module "modules/xmpp/StropheErrorHandler" {
    export interface IStropheErrorContext {
        [key: string]: any;
        operation?: string;
        roomJid?: string;
        userJid?: string;
    }
    export function handleStropheError(errResponse: any, context?: IStropheErrorContext): void;
}
declare module "modules/xmpp/Lobby" {
    /**
     * The Lobby room implementation. Setting a room to members only, joining the lobby room
     * approving or denying access to participants from the lobby room.
     */
    export default class Lobby {
        /**
         * Constructs lobby room.
         *
         * @param {ChatRoom} room the main room.
         */
        constructor(room: ChatRoom);
        xmpp: any;
        mainRoom: ChatRoom;
        lobbyRoomJid: any;
        /**
         * Whether lobby is supported on backend.
         *
         * @returns {boolean} whether lobby is supported on backend.
         */
        isSupported(): boolean;
        /**
         * Enables lobby by setting the main room to be members only and joins the lobby chat room.
         *
         * @returns {Promise}
         */
        enable(): Promise<any>;
        /**
         * Disable lobby by setting the main room to be non members only and levaes the lobby chat room if joined.
         *
         * @returns {void}
         */
        disable(): void;
        /**
         * Broadcast a message to all participants in the lobby room
         * @param {Object} message The message to send
         *
         * @returns {void}
         */
        sendMessage(message: any): void;
        /**
         * Sends a private message to a participant in a lobby room.
         * @param {string} id The message to send
         * @param {Object} message The message to send
         *
         * @returns {void}
         */
        sendPrivateMessage(id: string, message: any): void;
        /**
         * Gets the local id for a participant in a lobby room.
         * This is used for lobby room private chat messages.
         *
         * @returns {string}
         */
        getLocalId(): string;
        /**
         * Adds a message listener to the lobby room.
         * @param {Function} listener The listener function,
         * called when a new message is received in the lobby room.
         *
         * @returns {Function} Handler returned to be able to remove it later.
         */
        addMessageListener(listener: Function): Function;
        /**
         * Remove a message handler from the lobby room.
         * @param {Function} handler The handler function to remove.
         *
         * @returns {void}
         */
        removeMessageHandler(handler: Function): void;
        /**
         * Leaves the lobby room.
         *
         * @returns {Promise}
         */
        leave(): Promise<any>;
        lobbyRoom: any;
        /**
         * We had received a jid for the lobby room.
         *
         * @param jid the lobby room jid to join.
         */
        setLobbyRoomJid(jid: any): void;
        /**
         * Checks the state of mainRoom, lobbyRoom and current user role to decide whether to join lobby room.
         * @private
         */
        private _maybeJoinLobbyRoom;
        /**
         * Joins a lobby room setting display name and eventually avatar(using the email provided).
         *
         * @param {string} username is required.
         * @param {string} email is optional.
         * @returns {Promise} resolves once we join the room.
         */
        join(displayName: any, email: string): Promise<any>;
        /**
         * Should be possible only for moderators.
         * @param id
         */
        denyAccess(id: any): void;
        /**
         * Should be possible only for moderators.
         * @param param or an array of ids.
         */
        approveAccess(param: any): void;
    }
}
declare module "modules/xmpp/Polls" {
    import ChatRoom from "modules/xmpp/ChatRoom";
    export const COMMAND_ANSWER_POLL = "answer-poll";
    export const COMMAND_NEW_POLL = "new-poll";
    export const COMMAND_OLD_POLLS = "old-polls";
    export default class Polls {
        private _mainRoom;
        private _xmpp;
        /**
         * Constructs polls for a room.
         *
         * @param {ChatRoom} room the main room.
         */
        constructor(room: ChatRoom);
        /**
         * Whether polls is supported on backend.
         *
         * @returns {boolean} whether polls is supported on backend.
         */
        isSupported(): boolean;
        /**
         * Stops listening for events.
         */
        dispose(): void;
        /**
         * Creates and sends a new poll.
         *
         * @param pollId
         * @param question
         * @param answers
         */
        createPoll(pollId: string, question: string, answers: Array<{
            name: string;
        }>): void;
        /**
         * Sends answers for a poll.
         *
         * @param pollId
         * @param answers
         */
        answerPoll(pollId: string, answers: Array<boolean>): void;
        /**
         * Handles a message for polls.
         *
         * @param {object} payload - Arbitrary data.
         */
        _handleMessages(payload: any): void;
    }
}
declare module "modules/xmpp/RoomMetadata" {
    /**
     * Helper class for handling room metadata.
     */
    export default class RoomMetadata {
        room: any;
        _metadata: any;
        /**
         * Constructs lobby room.
         *
         * @param {ChatRoom} room the room we are in.
         */
        constructor(room: any);
        /**
         * Stops listening for events.
         */
        dispose(): void;
        /**
         * Sets metadata for the given key.
         *
         * @param {string} key - key under which the metadata will be stored.
         * @param {object} data - data to be stored.
         */
        setMetadata(key: any, data: any): void;
        /**
         * Gets the stored metadata (all of it).
         *
         * @returns The stored metadata.
         */
        getMetadata(): any;
        /**
         * Whether Breakout Rooms support is enabled in the backend or not.
         */
        isSupported(): boolean;
        /**
         * Gets the address of the Breakout Rooms XMPP component.
         *
         * @returns The address of the component.
         */
        getComponentAddress(): any;
        /**
         * Handles a message with metadata updates.
         *
         * @param {object} payload - Arbitrary data.
         */
        _handleMessages(payload: any): void;
        /**
         * Helper to send a breakout rooms message to the component.
         *
         * @param {Object} message - Command that needs to be sent.
         */
        _sendMessage(message: any): void;
    }
}
declare module "service/connectivity/Constants" {
    export const MAX_CONNECTION_RETRIES = 3;
}
declare module "modules/connectivity/NetworkInfo" {
    import Listenable from "modules/util/Listenable";
    export const NETWORK_INFO_EVENT = "NETWORK_INFO_CHANGED";
    export interface ICurrentNetworkInfo {
        isOnline: boolean;
    }
    /**
     * Module provides information about the current status of the internet
     * connection. Lib-jitsi-meet doesn't have any logic for detecting internet
     * online/offline, but rather it relies on the information supplied by the app
     * that uses it. By default the online state is assumed and the lib acts as if
     * it was connected. See {@link JitsiMeetJS.setNetworkInfo}.
     */
    export class NetworkInfo extends Listenable {
        private _current;
        /**
         * Creates new {@link NetworkInfo} instance.
         */
        constructor();
        /**
         * Updates the network info state.
         *
         * @param {object} state - The network info state.
         * @param {boolean} state.isOnline - {@code true} if the internet connectivity is online or {@code false}
         * otherwise.
         */
        updateNetworkInfo({ isOnline }: {
            isOnline: boolean;
        }): void;
        /**
         * Returns the online/offline internet status. By default the value is {@code true} and changes only if
         * the lib's user wires the state through {@link JitsiMeetJS.setNetworkInfo} like the jitsi-meet does. Because of
         * that any logic should still assume that the internet may be offline and should handle the failure gracefully.
         * It's only a good hint in the other way around: to pause internet operations until it comes back online.
         * @returns {boolean}
         */
        isOnline(): boolean;
    }
    const networkInfo: NetworkInfo;
    export default networkInfo;
}
declare module "modules/xmpp/ResumeTask" {
    import Strophe from 'strophe.js';
    export interface INetworkInfoEvent {
        isOnline: boolean;
    }
    /**
     * The class contains the logic for triggering connection resume via XEP-0198 stream management.
     * It does two things, the first one is it tracks the internet online/offline status and it makes sure that
     * the reconnect is attempted only while online. The seconds thing is that it tracks the retry attempts and extends
     * the retry interval using the full jitter pattern.
     */
    export default class ResumeTask {
        private _stropheConn;
        private _resumeRetryN;
        private _retryDelay;
        private _resumeTimeout;
        private _networkOnlineListener;
        /**
         * Initializes new {@code RetryTask}.
         * @param {Strophe.Connection} stropheConnection - The Strophe connection instance.
         */
        constructor(stropheConnection: Strophe.Connection);
        /**
         * @returns {number} - The amount of retries.
         */
        get retryCount(): number;
        /**
         * @returns {number|undefined} - How much the app will wait before trying to resume the XMPP connection. When
         * 'undefined' it means that no resume task was not scheduled.
         */
        get retryDelay(): Optional<number>;
        /**
         * Removes network online listener for the NETWORK_INFO_EVENT event.
         *
         * @private
         * @returns {void}
         */
        private _removeNetworkOnlineListener;
        /**
         * Schedules a delayed timeout which will execute the resume action.
         * @private
         * @returns {void}
         */
        private _scheduleResume;
        /**
         * Cancels the delayed resume task.
         *
         * @returns {void}
         */
        cancelResume(): void;
        /**
         * Resumes the XMPP connection using the stream management plugin.
         *
         * @returns {void}
         */
        resumeConnection(): void;
        /**
         * Cancels the retry task. It's called by {@link XmppConnection} when it's no longer interested in reconnecting for
         * example when the disconnect method is called.
         *
         * @returns {void}
         */
        cancel(): void;
        /**
         * Called by {@link XmppConnection} when the connection drops and it's a signal it wants to schedule a reconnect.
         *
         * @returns {void}
         */
        schedule(): void;
    }
}
declare module "modules/xmpp/StropheLastSuccess" {
    /**
     * Attaches to the {@link Strophe.Connection.rawInput} which is called whenever any data is received from the server.
     */
    import { Strophe } from 'strophe.js';
    import XmppConnection from "modules/xmpp/XmppConnection";
    export default class LastRequestTracker {
        private _lastSuccess;
        private _lastFailedMessage;
        /**
         * Initializes new instance.
         */
        constructor();
        /**
         * Starts tracking requests on the given connection.
         *
         * @param {XmppConnection} xmppConnection - The XMPP connection which manages the given {@code stropheConnection}.
         * @param {Strophe.Connection} stropheConnection - Strophe connection instance.
         */
        startTracking(xmppConnection: XmppConnection, stropheConnection: Strophe.Connection): void;
        /**
         * Returns the last raw failed incoming message on the xmpp connection.
         *
         * @returns {Nullable<string>}
         */
        getLastFailedMessage(): Nullable<string>;
        /**
         * Returns how many milliseconds have passed since the last successful BOSH request.
         *
         * @returns {Nullable<number>}
         */
        getTimeSinceLastSuccess(): Nullable<number>;
    }
}
declare module "modules/xmpp/strophe.stream-management" { }
declare module "modules/xmpp/ConnectionPlugin" {
    import Listenable from "modules/util/Listenable";
    import XmppConnection from "modules/xmpp/XmppConnection";
    /**
     * ConnectionPlugin class.
     */
    const _default_3: {
        new (...args: any[]): {
            connection: Nullable<XmppConnection>;
            /**
             *
             * @param connection
             */
            init(connection: XmppConnection): void;
        };
    } & (new (...args: any[]) => {});
    export default _default_3;
    /**
     * ConnectionPlugin class that extends Listenable.
     */
    export const ConnectionPluginListenable: {
        new (...args: any[]): {
            connection: Nullable<XmppConnection>;
            /**
             *
             * @param connection
             */
            init(connection: XmppConnection): void;
        };
    } & typeof Listenable;
}
declare module "modules/xmpp/strophe.emuc" {
    import ChatRoom, { IChatRoomOptions } from "modules/xmpp/ChatRoom";
    import { ConnectionPluginListenable } from "modules/xmpp/ConnectionPlugin";
    import XmppConnection from "modules/xmpp/XmppConnection";
    import XMPP from "modules/xmpp/xmpp";
    /**
     * MUC connection plugin.
     */
    export default class MucConnectionPlugin extends ConnectionPluginListenable {
        /**
         * XMPP connection instance
         */
        private xmpp;
        /**
         * Map of room JIDs to ChatRoom instances
         */
        private rooms;
        /**
         *
         * @param xmpp
         */
        constructor(xmpp: XMPP);
        /**
         *
         * @param connection
         */
        init(connection: XmppConnection): void;
        /**
         *
         * @param jid
         * @param password
         * @param options
         */
        createRoom(jid: string, password: string, options: IChatRoomOptions): ChatRoom;
        /**
         *  Check if a room with the passed JID is already created.
         *
         * @param {string} roomJid - The JID of the room.
         * @returns {boolean}
         */
        isRoomCreated(roomJid: string): boolean;
        /**
         *
         * @param jid
         */
        doLeave(jid: string): void;
        /**
         *
         * @param pres
         */
        onPresence(pres: Element): boolean;
        /**
         *
         * @param pres
         */
        onPresenceUnavailable(pres: Element): boolean;
        /**
         *
         * @param pres
         */
        onPresenceError(pres: Element): boolean;
        /**
         *
         * @param msg
         */
        onMessage(msg: Element): boolean;
        /**
         * Handle remote mute request from focus.
         *
         * @param iq
         */
        onMute(iq: Element): boolean;
        /**
         * Handle remote video mute request from focus.
         *
         * @param iq
         */
        onMuteVideo(iq: Element): boolean;
        /**
         * Handle remote desktop sharing mute request from focus.
         *
         * @param iq
         */
        onMuteDesktop(iq: any): boolean;
        /**
         * A visitor IQ is received, pass it to the room.
         * @param iq The received iq.
         * @returns {boolean}
         */
        onVisitors(iq: Element): boolean;
    }
}
declare module "modules/xmpp/JingleHelperFunctions" {
    export interface ISourceCompactJson {
        m?: string;
        n: string;
        s: string;
        v?: any;
    }
    export interface ICompactSsrcGroup extends Array<string> {
    }
    export interface IJsonMessage {
        sources: {
            [owner: string]: [ISourceCompactJson[], ICompactSsrcGroup[], ISourceCompactJson[], ICompactSsrcGroup[]];
        };
    }
    /**
     * Reads a JSON-encoded message (from a "json-message" element) and extracts source descriptions. Adds the extracted
     * source descriptions to the given Jingle IQ in the standard Jingle format.
     *
     * Encoding sources in this compact JSON format instead of standard Jingle was introduced in order to reduce the
     * network traffic and load on the XMPP server. The format is described in Jicofo [TODO: insert link].
     *
     * @param {*} iq the IQ to which source descriptions will be added.
     * @param {*} jsonMessageXml The XML node for the "json-message" element.
     * @returns {Map<string, Array<string>} The audio and video ssrcs extracted from the JSON-encoded message with remote
     * endpoint id as the key.
     */
    export function expandSourcesFromJson(iq: Element, jsonMessageXml: Element): Nullable<Map<string, string[]>>;
}
declare module "modules/xmpp/strophe.jingle" {
    const JingleConnectionPlugin_base: {
        new (...args: any[]): {
            connection: Nullable<import("modules/xmpp/XmppConnection").default>;
            init(connection: import("modules/xmpp/XmppConnection").default): void;
        };
    } & (new (...args: any[]) => {});
    /**
     *
     */
    export default class JingleConnectionPlugin extends JingleConnectionPlugin_base {
        /**
         * Creates new <tt>JingleConnectionPlugin</tt>
         * @param {XMPP} xmpp
         * @param {EventEmitter} eventEmitter
         * @param {Object} iceConfig an object that holds the iceConfig to be passed
         * to the p2p and the jvb <tt>PeerConnection</tt>.
         */
        constructor(xmpp: XMPP, eventEmitter: EventEmitter, iceConfig: any);
        xmpp: XMPP;
        eventEmitter: EventEmitter;
        sessions: {};
        jvbIceConfig: any;
        p2pIceConfig: any;
        mediaConstraints: {
            offerToReceiveAudio: boolean;
            offerToReceiveVideo: boolean;
        };
        /**
         *
         * @param connection
         */
        init(connection: any): void;
        /**
         *
         * @param iq
         */
        onJingle(iq: any): boolean;
        /**
         * Creates new <tt>JingleSessionPC</tt> meant to be used in a direct P2P
         * connection, configured as 'initiator'.
         * @param {string} me our JID
         * @param {string} peer remote participant's JID
         * @return {JingleSessionPC}
         */
        newP2PJingleSession(me: string, peer: string): JingleSessionPC;
        /**
         *
         * @param sid
         * @param reasonCondition
         * @param reasonText
         */
        terminate(sid: any, reasonCondition?: any, reasonText?: any): void;
        /**
         *
         */
        getStunAndTurnCredentials(): void;
        /**
         * Parses response when querying for services using urn:xmpp:extdisco:1 or urn:xmpp:extdisco:2.
         * Stores results in jvbIceConfig and p2pIceConfig.
         * @param res The response iq.
         * @return {boolean} Whether something was processed from the supplied message.
         */
        onReceiveStunAndTurnCredentials(res: any): boolean;
        /**
         * Returns the data saved in 'updateLog' in a format to be logged.
         * @returns {Record<string, unknown>} An object containing the data to be logged.
         */
        getLog(): Record<string, unknown>;
    }
    import JingleSessionPC from "modules/xmpp/JingleSessionPC";
    export {};
}
declare module "modules/xmpp/strophe.ping" {
    import { Strophe } from 'strophe.js';
    import ConnectionPlugin from "modules/xmpp/ConnectionPlugin";
    export interface IPingOptions {
        interval?: number;
        threshold?: number;
        timeout?: number;
    }
    export interface IPingConnectionPluginOptions {
        getTimeSinceLastServerResponse: () => number;
        onPingThresholdExceeded: () => void;
        pingOptions?: IPingOptions;
    }
    /**
     * XEP-0199 ping plugin.
     *
     * Registers "urn:xmpp:ping" namespace under Strophe.NS.PING.
     */
    export default class PingConnectionPlugin extends ConnectionPlugin {
        failedPings: number;
        _onPingThresholdExceeded: () => void;
        _getTimeSinceLastServerResponse: () => number;
        pingInterval: number;
        pingTimeout: number;
        pingThreshold: number;
        pingTimestampsToKeep: number;
        pingExecIntervals: number[];
        intervalId: Nullable<number>;
        _lastServerCheck: number;
        /**
         * Constructs new object
         * @param {Object} options
         * @param {Function} options.onPingThresholdExceeded - Callback called when ping fails too many times (controlled
         * by the {@link PING_THRESHOLD} constant).
         * @param {Function} options.getTimeSinceLastServerResponse - A function to obtain the last seen
         * response from the server.
         * @param {Object} options.pingOptions - The ping options if any.
         * @constructor
         */
        constructor({ getTimeSinceLastServerResponse, onPingThresholdExceeded, pingOptions }: IPingConnectionPluginOptions);
        /**
         * Initializes the plugin. Method called by Strophe.
         * @param connection Strophe connection instance.
         */
        init(connection: Strophe.Connection): void;
        /**
         * Sends "ping" to given <tt>jid</tt>
         * @param jid the JID to which ping request will be sent.
         * @param success callback called on success.
         * @param error callback called on error.
         * @param timeout ms how long are we going to wait for the response. On
         * timeout <tt>error<//t> callback is called with undefined error argument.
         */
        ping(jid: string, success: (result: any) => void, error: (err: any) => void, timeout: number): void;
        /**
         * Starts to send ping in given interval to specified remote JID.
         * This plugin supports only one such task and <tt>stopInterval</tt>
         * must be called before starting a new one.
         * @param remoteJid remote JID to which ping requests will be sent to.
         */
        startInterval(remoteJid: string): void;
        /**
         * Stops current "ping"  interval task.
         */
        stopInterval(): void;
        /**
         * Adds the current time to the array of send ping timestamps.
         * @private
         */
        _addPingExecutionTimestamp(): void;
        /**
         * Returns the maximum time between the recent sent pings, if there is a
         * big value it means the computer was inactive for some time(suspended).
         * Checks the maximum gap between sending pings, considering and the
         * current time. Trying to detect computer inactivity (sleep).
         *
         * @returns {int} the time ping was suspended, if it was not 0 is returned.
         */
        getPingSuspendTime(): number;
    }
}
declare module "modules/xmpp/strophe.rayo" {
    import { type Connection } from 'strophe.js';
    import ConnectionPlugin from "modules/xmpp/ConnectionPlugin";
    /**
     *
     */
    export default class RayoConnectionPlugin extends ConnectionPlugin {
        private callResource;
        /**
         *
         * @param connection
         */
        init(connection: Connection): void;
        /**
         *
         * @param iq
         */
        onRayo(iq: any): any;
        /**
         *
         * @param to
         * @param from
         * @param roomName
         * @param roomPass
         * @param focusMucJid
         */
        dial(to: string, from: string, roomName: string, roomPass: string, focusMucJid: string): Promise<void>;
        /**
         *
         */
        hangup(): Promise<void>;
    }
}
declare module "modules/xmpp/XmppConnection" {
    import "modules/xmpp/strophe.stream-management";
    /**
     * IQ result callback type - result is typically an XML Element
     */
    export type IQResultCallback = (result: Element) => void;
    /**
     * IQ error callback type - error can be a string, Element, Error object, or undefined (timeout)
     */
    export type ErrorCallback = (error: string | Element | Error | undefined) => void;
}
declare module "modules/xmpp/ChatRoom" {
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    import Listenable from "modules/util/Listenable";
    import AVModeration from "modules/xmpp/AVModeration";
    import BreakoutRooms from "modules/xmpp/BreakoutRooms";
    import FileSharing from "modules/xmpp/FileSharing";
    import Lobby from "modules/xmpp/Lobby";
    import Polls from "modules/xmpp/Polls";
    import RoomMetadata from "modules/xmpp/RoomMetadata";
    import XmppConnection, { ErrorCallback } from "modules/xmpp/XmppConnection";
    import XMPP from "modules/xmpp/xmpp";
    type SuccessCallback = () => void;
    type ParticipantPropertyListener = (participantId: string, key: string, value: string) => void;
    export type PresenceHandler = (node: IPresenceNode, participantId: string, from: string) => void;
    interface IPresenceNode {
        attributes?: Record<string, string>;
        children?: IPresenceNode[];
        tagName: string;
        value?: string;
    }
    export interface IChatRoomOptions {
        deploymentInfo?: any;
        disableDiscoInfo?: boolean;
        disableFocus?: boolean;
        disableRoomCreationRetry?: boolean;
        enableLobby?: boolean;
        hiddenDomain?: string;
        hiddenFromRecorderFeatureEnabled?: boolean;
        statsId?: string;
    }
    interface IPresenceMap {
        length?: number;
        nodes: IPresenceNode[];
        to?: string;
        xns?: string;
    }
    interface IPeerMediaInfo {
        codecType?: string;
        muted: boolean;
        videoType?: VideoType | string;
    }
    export const parser: {
        json2packet(nodes: IPresenceNode[], packet: any): void;
        packet2JSON(xmlElement: Element, nodes: IPresenceNode[]): void;
    };
    /**
     * Returns array of JS objects from the presence JSON associated with the passed
     / nodeName
     * @param pres the presence JSON
     * @param nodeName the name of the node (videomuted, audiomuted, etc)
     */
    export function filterNodeFromPresenceJSON(pres: IPresenceNode[], nodeName: string): IPresenceNode[];
    /**
     *
     */
    export default class ChatRoom extends Listenable {
        private password?;
        private replaceParticipant;
        private members;
        private presHandlers;
        private _removeConnListeners;
        private inProgressEmitted;
        private noBridgeAvailable;
        private options;
        private eventsForwarder;
        private lobby?;
        private avModeration;
        private breakoutRooms;
        private fileSharing;
        private polls;
        private roomMetadata;
        private lastPresences;
        private phoneNumber;
        private phonePin;
        private participantPropertyListener?;
        private locked;
        private initialDiscoRoomInfoReceived;
        private presenceUpdateTime;
        private presenceSyncTime?;
        private meetingId?;
        private focusFeatures?;
        private subject?;
        private _roomCreationRetries?;
        private cachedShortTermCredentials?;
        xmpp: XMPP;
        connection: XmppConnection;
        roomjid: string;
        myroomjid: string;
        joined: boolean;
        presMap: IPresenceMap;
        role: Nullable<string>;
        focusMucJid: Nullable<string>;
        connectionTimes: Record<string, number>;
        transcriptionStatus: string;
        membersOnlyEnabled?: boolean;
        visitorsSupported?: boolean;
        /**
         *
         * @param {XmppConnection} connection - The XMPP connection instance.
         * @param jid
         * @param password
         * @param XMPP
         * @param options
         * @param {boolean} options.disableFocus - when set to {@code false} will
         * not invite Jicofo into the room.
         * @param {boolean} options.disableDiscoInfo - when set to {@code false} will skip disco info.
         * This is intended to be used only for lobby rooms.
         * @param {boolean} options.enableLobby - when set to {@code false} will skip creating lobby room.
         * @param {boolean} options.hiddenFromRecorderFeatureEnabled - when set to {@code true} we will check identity tag
         * for node presence.
         */
        constructor(connection: XmppConnection, jid: string, password: Optional<string>, xmpp: XMPP, options?: IChatRoomOptions);
        /**
         *
         */
        private initPresenceMap;
        /**
         * Extracts the features from the presence.
         * @param node the node to process.
         * @return features the Set of features where extracted data is added.
         * @private
         */
        private _extractFeatures;
        /**
         * Initialize some properties when the focus participant is verified.
         * @param from jid of the focus
         * @param features the features reported in jicofo presence
         */
        private _initFocus;
        /**
         * Handles Xmpp Connection status updates.
         *
         * @param {Strophe.Status} status - The Strophe connection status.
         */
        private _onConnStatusChanged;
        /**
         *
         * @param node
         * @param from
         */
        private _processNode;
        /**
         * Clean any listeners or resources, executed on leaving.
         */
        private clean;
        /**
         * Parses XEP-0461 reply message information from a message stanza.
         * @param {Element} msg - The message stanza.
         * @returns {string|null} The ID of the message being replied to, or null if not a reply.
         * @private
         */
        private _parseReplyMessage;
        /**
         * Joins the chat room.
         * @param {string} password - Password to unlock room on joining.
         * @returns {Promise} - resolved when join completes. At the time of this
         * writing it's never rejected.
         */
        join(password?: string, replaceParticipant?: boolean): Promise<void>;
        /**
         *
         * @param fromJoin - Whether this is initial presence to join the room.
         */
        sendPresence(fromJoin?: boolean): void;
        /**
         * Sends the presence unavailable, signaling the server
         * we want to leave the room.
         */
        doLeave(reason?: string): void;
        /**
         *
         */
        discoRoomInfo(): void;
        /**
         * Sets the meeting unique Id (received from the backend).
         *
         * @param {string} meetingId - The new meetings id.
         * @returns {void}
         */
        setMeetingId(meetingId: string): void;
        /**
         *
         */
        createNonAnonymousRoom(): void;
        /**
         * Sets the special listener to be used for "command"s whose name starts
         * with "jitsi_participant_".
         */
        setParticipantPropertyListener(listener: ParticipantPropertyListener): void;
        /**
         * Send text message to the other participants in the conference
         * @param message
         * @param elementName
         * @param replyToId
         */
        sendMessage(message: string, elementName: string, replyToId?: string): void;
        /**
         * Sends a reaction message to the other participants in the conference.
         * @param {string} reaction - The reaction being sent.
         * @param {string} messageId - The id of the message being sent.
         * @param {string} receiverId - The receiver of the message if it is private.
         */
        sendReaction(reaction: string, messageId: string, receiverId?: string): void;
        /**
         * Send private text message to another participant of the conference
         * @param id id/muc resource of the receiver
         * @param message
         * @param elementName
         * @param useDirectJid
         * @param replyToId
         */
        sendPrivateMessage(id: string, message: string, elementName: string, useDirectJid?: boolean, replyToId?: string): void;
        /**
         *
         * @param subject
         */
        setSubject(subject: string): void;
        /**
         *
         * @param jid
         * @param affiliation
         */
        setAffiliation(jid: string, affiliation: string): void;
        /**
         *
         * @param jid
         * @param reason
         */
        kick(jid: string, reason?: string): void;
        /**
         *
         * @param key
         * @param onSuccess
         * @param onError
         * @param onNotSupported
         */
        lockRoom(key: Nullable<string>, onSuccess: SuccessCallback, onError: ErrorCallback, onNotSupported: () => void): void;
        /**
         * Turns off or on the members only config for the main room.
         *
         * @param {boolean} enabled - Whether to turn it on or off.
         * @param onSuccess - optional callback.
         * @param onError - optional callback.
         */
        setMembersOnly(enabled: boolean, onSuccess: SuccessCallback, onError: ErrorCallback): void;
        /**
         * Checks if the user identified by given <tt>mucJid</tt> is the conference
         * focus.
         * @param mucJid the full MUC address of the user to be checked.
         * @returns {boolean|null} <tt>true</tt> if MUC user is the conference focus
         * or <tt>false</tt> if is not. When given <tt>mucJid</tt> does not exist in
         * the MUC then <tt>null</tt> is returned.
         */
        isFocus(mucJid: string): Nullable<boolean>;
        /**
         *
         */
        isModerator(): boolean;
        /**
         * Obtains the info about given media advertised (in legacy format) in the MUC presence of the participant
         * identified by the given endpoint JID. This is for mantining interop with endpoints that do not support
         * source-name signaling (Jigasi and very old mobile clients).
         *
         * @param {string} endpointId the endpoint ID mapped to the participant which corresponds to MUC nickname.
         * @param {MediaType} mediaType the type of the media for which presence info will be obtained.
         * @return {PeerMediaInfo} presenceInfo an object with media presence info or <tt>null</tt> either if there
         * is no presence available or if the media type given is invalid.
         */
        getMediaPresenceInfo(endpointId: string, mediaType: MediaType): Nullable<IPeerMediaInfo>;
        /**
         *
         * @param peerJid
         */
        getMemberRole(peerJid: string): Nullable<string>;
        /**
         * Dials a number.
         * @param number the number
         */
        dial(number: string): Promise<void>;
        /**
         * Hangup an existing call
         */
        hangup(): Promise<void>;
        /**
         *
         * @returns {Lobby}
         */
        getLobby(): Optional<Lobby>;
        /**
         * @returns {AVModeration}
         */
        getAVModeration(): AVModeration;
        /**
         * @returns {BreakoutRooms}
         */
        getBreakoutRooms(): BreakoutRooms;
        /**
         * @returns {FileSharing}
         */
        getFileSharing(): FileSharing;
        /**
         * @returns {RoomMetadata}
         */
        getMetadataHandler(): RoomMetadata;
        /**
         * @returns {Polls}
         */
        getPolls(): Polls;
        /**
         * Returns the phone number for joining the conference.
         */
        getPhoneNumber(): Nullable<string>;
        /**
         * Returns the pin for joining the conference with phone.
         */
        getPhonePin(): Nullable<string>;
        /**
         * Returns the meeting unique ID if any came from backend.
         *
         * @returns {string} - The meeting ID.
         */
        getMeetingId(): Optional<string>;
        /**
         * Mutes remote participant.
         * @param jid of the participant
         * @param mute
         * @param mediaType
         */
        muteParticipant(jid: string, mute: boolean, mediaType: string): void;
        /**
         * Leaves the room. Closes the jingle session.
         * @returns {Promise} which is resolved if XMPPEvents.MUC_LEFT is received
         * less than 5s after sending presence unavailable. Otherwise the promise is
         * rejected.
         */
        leave(reason?: string): Promise<any>;
        /**
         * Ends the conference for all participants.
         */
        end(): void;
        /**
         * Requests short-lived credentials for a service.
         * The function does not use anything from the room, but the backend requires the sender
         * to be in the room as the credentials contain the meeting ID and are valid only for the room.
         * @param service
         */
        getShortTermCredentials(service: string): Promise<string>;
    }
    export { ChatRoom };
}
declare module "modules/xmpp/sha1" {
    function core_hmac_sha1(key: string, data: string): number[];
    function binb2str(bin: number[]): string;
    const SHA1: {
        b64_hmac_sha1: (key: string, data: string) => string;
        b64_sha1: (s: string) => string;
        binb2str: typeof binb2str;
        core_hmac_sha1: typeof core_hmac_sha1;
        str_hmac_sha1: (key: string, data: string) => string;
        str_sha1: (s: string) => string;
    };
    export { SHA1 as default };
}
declare module "modules/xmpp/Caps" {
    import { Strophe } from 'strophe.js';
    import Listenable from "modules/util/Listenable";
    import ChatRoom from "modules/xmpp/ChatRoom";
    type Identity = {
        category: string;
        lang?: string;
        name?: string;
        type: string;
    };
    /**
     * Parses the disco-info node and returns the sets of features and identities.
     * @param {String} node The node with results to parse.
     * @returns {{features: Set<string>, identities: Set<Identity>}}
     */
    export function parseDiscoInfo(node: Element): {
        features: Set<string>;
        identities: Set<Identity>;
    };
    /**
     * Implements xep-0115 ( http://xmpp.org/extensions/xep-0115.html )
     */
    export default class Caps extends Listenable {
        node: string;
        disco: any;
        version: string;
        rooms: Set<ChatRoom>;
        externalFeatures: Set<string>;
        /**
         * Constructs new Caps instance.
         * @param {Strophe.Connection} connection the strophe connection object
         * @param {String} node the value of the node attribute of the "c" xml node
         * that will be sent to the other participants
         */
        constructor(connection?: Strophe.Connection, node?: string);
        /**
         * Returns a set with the features and identities for a host.
         * @param {String} jid the jid of the host
         * @param {String|null} node the node to query
         * @param {int} timeout the timeout in ms for reply from the host.
         * @returns {Promise<{features: Set<string>, identities: Set<Identity>}>}
         * @private
         */
        private _getDiscoInfo;
        /**
         * Adds ChatRoom instance to the list of rooms. Adds listeners to the room
         * and adds "c" element to the presences of the room.
         * @param {ChatRoom} room the room.
         */
        private _addChatRoom;
        /**
         * Creates/updates the "c" xml node into the presence of the passed room.
         * @param {ChatRoom} room the room.
         */
        private _fixChatRoomPresenceMap;
        /**
         * Generates the value for the "ver" attribute.
         */
        private _generateVersion;
        /**
         * Handles this.version changes.
         */
        private _notifyVersionChanged;
        /**
         * Removes ChatRoom instance from the list of rooms. Removes listeners
         * added from the Caps class.
         * @param {ChatRoom} room the room.
         */
        private _removeChatRoom;
        /**
         * Updates the presences in the room based on the current values in externalFeatures.
         * @param {ChatRoom} room the room to update.
         * @private
         */
        private _updateRoomWithExternalFeatures;
        /**
         * Adds new feature to the list of supported features for the local
         * participant
         * @param {String} feature the name of the feature.
         * @param {boolean} submit if true - new presence with updated "c" node
         * will be sent.
         * @param {boolean} external whether this feature was added externally to the library.
         * We put features used directly by the clients (is jibri, remote-control enabled etc.) in the presence
         * to avoid additional disco-info queries by those clients.
         */
        addFeature(feature: string, submit?: boolean, external?: boolean): void;
        /**
         * Returns a set with the features for a host.
         * @param {String} jid the jid of the host
         * @param {int} timeout the timeout in ms for reply from the host.
         * @returns {Promise<{features: Set<string>, identities: Set<Identity>}>}
         */
        getFeaturesAndIdentities(jid: string, node: string, timeout?: number): Promise<{
            features: Set<string>;
            identities: Set<Identity>;
        }>;
        /**
         * Removes a feature from the list of supported features for the local
         * participant
         * @param {String} feature the name of the feature.
         * @param {boolean} submit if true - new presence with updated "c" node
         * will be sent.
         * @param {boolean} external whether this feature was added externally to the library.
         */
        removeFeature(feature: string, submit?: boolean, external?: boolean): void;
        /**
             * Sends new presence stanza for every room from the list of rooms.
             */
        submit(): void;
    }
}
declare module "modules/xmpp/moderator" {
    /**
     * The moderator/focus responsible for direct communication with jicofo
     */
    export default class Moderator extends Listenable {
        /**
         * Constructs moderator.
         * @param xmpp The xmpp.
         */
        constructor(xmpp: any);
        getNextTimeout: (reset: any) => number;
        getNextErrorTimeout: (reset: any) => number;
        options: any;
        sipGatewayEnabled: boolean;
        visitorsSupported: boolean;
        xmpp: any;
        connection: any;
        targetJid: any;
        targetUrl: any;
        mode: string;
        focusUserJids: Set<any>;
        /**
         * Check whether the supplied jid is a known jid for focus.
         * @param jid
         * @returns {boolean}
         */
        isFocusJid(jid: any): boolean;
        /**
         * Is sip gw enabled.
         * @returns {boolean}
         */
        isSipGatewayEnabled(): boolean;
        /**
         * Create a conference request based on the configured options and saved Settings.
         *
         * A conference request has the following format:
         * {
         *   room: "room@example.com",
         *   sessionId: "foo", // optional
         *   machineUdi: "bar", // optional
         *   identity: "baz", // optional
         *   properties: { } // map string to string
         * }
         *
         * It can be encoded in either JSON or and IQ.
         *
         * @param roomJid - The room jid for which to send conference request.
         *
         * @returns the created conference request.
         */
        _createConferenceRequest(roomJid: any): {
            machineUid: string;
            properties: {
                startAudioMuted: any;
                startVideoMuted: any;
                rtcstatsEnabled: boolean;
            };
            room: any;
        };
        /**
         * Create a conference request and encode it as an IQ.
         *
         * @param roomJid - The room jid for which to send conference request.
         */
        _createConferenceIq(roomJid: any): any;
        /**
         * Parses a conference IQ.
         * @param resultIq the result IQ that is received.
         * @returns {{properties: {}}} Returns an object with the parsed properties.
         * @private
         */
        private _parseConferenceIq;
        /**
         * Allocates the conference focus.
         * @param roomJid - The room jid for which to send conference request.
         * @returns {Promise} - Resolved when Jicofo allows to join the room. It's never
         * rejected, and it'll keep on pinging Jicofo forever.
         */
        sendConferenceRequest(roomJid: any): Promise<any>;
        conferenceRequestSent: boolean;
        /**
         * Handles success response for conference IQ.
         * @param roomJid
         * @param conferenceRequest
         * @param callback
         * @param errorCallback
         * @private
         */
        private _handleSuccess;
        /**
         * Handles error response for conference IQ.
         * @param roomJid
         * @param sessionError
         * @param notAuthorized
         * @param callback
         * @param errorCallback
         * @private
         */
        private _handleError;
        /**
         * Invoked by {@link #sendConferenceRequest} upon its request receiving an xmpp error result.
         *
         * @param roomJid - The room jid used to send conference request.
         * @param error - the error result of the request that {@link sendConferenceRequest} sent
         * @param {Function} callback - the function to be called back upon the
         * successful allocation of the conference focus
         * @param errorCallback
         */
        _handleIqError(roomJid: any, error: any, callback: Function, errorCallback: any): void;
        /**
         * Invoked by {@link #sendConferenecRequest} upon its request receiving a
         * success (i.e. non-error) result.
         *
         * @param roomJid - The room jid used to send conference request.
         * @param result - the success (i.e. non-error) result of the request that {@link #sendConferenecRequest} sent
         * @param {Function} callback - the function to be called back upon the
         * successful allocation of the conference focus
         * @param errorCallback
         */
        _handleIqSuccess(roomJid: any, result: any, callback: Function, errorCallback: any): void;
        /**
         * Authenticate by sending a conference IQ.
         * @param roomJid The room jid.
         * @returns {Promise<unknown>}
         */
        authenticate(roomJid: any): Promise<unknown>;
        /**
         * Logout by sending conference IQ.
         * @param callback
         */
        logout(callback: any): void;
    }
    import Listenable from "modules/util/Listenable";
}
declare module "modules/xmpp/strophe.disco" {
    export {};
}
declare module "modules/xmpp/strophe.logger" {
    /**
     *
     */
    export default function (): void;
}
declare module "modules/xmpp/strophe.util" {
    /**
     *
     */
    export default function (): void;
}
declare module "modules/xmpp/xmpp" {
    import "modules/xmpp/strophe.disco";
    /**
     * Deployment info interface
     */
    interface IDeploymentInfo {
        backendRelease?: string;
        region?: string;
        shard?: string;
    }
    /**
     * Hosts configuration interface
     */
    interface IHostsConfig {
        anonymousdomain?: string;
        domain?: string;
        muc?: string;
    }
    /**
     * Testing configuration interface
     */
    interface ITestingConfig {
        enableGracefulReconnect?: boolean;
    }
    /**
     * P2P configuration interface
     */
    interface IP2PConfig {
        iceTransportPolicy?: string;
        stunServers?: Array<{
            urls: string;
        }>;
    }
    /**
     * XMPP options interface
     */
    export interface IXMPPOptions {
        bosh?: string;
        deploymentInfo?: IDeploymentInfo;
        disableBeforeUnloadHandlers?: boolean;
        disableRtx?: boolean;
        enableOpusRed?: boolean;
        enableRemb?: boolean;
        enableTcc?: boolean;
        enableWebsocketResume?: boolean;
        hosts?: IHostsConfig;
        p2p?: IP2PConfig;
        p2pStunServers?: Array<{
            urls: string;
        }>;
        serviceUrl?: string;
        testing?: ITestingConfig;
        websocketKeepAlive?: number;
        websocketKeepAliveUrl?: string;
        xmppPing?: Record<string, unknown>;
    }
    export interface IFaceLandmarksPayload {
        duration: number;
        faceExpression: string;
        timestamp: number;
    }
    /**
     * Identity interface for disco info
     */
    export interface IIdentity {
        name?: string;
        type: string;
    }
    /**
     * A list of ice servers to use by default for P2P.
     */
    export const DEFAULT_STUN_SERVERS: Array<{
        urls: string;
    }>;
    /**
     * The name of the field used to recognize a chat message as carrying a JSON
     * payload from another endpoint.
     * If the json-message of a chat message contains a valid JSON object, and
     * the JSON has this key, then it is a valid json-message to be sent.
     */
    export const JITSI_MEET_MUC_TYPE: string;
    /**
     * The feature used by jigasi participants.
     * @type {string}
     */
    export const FEATURE_JIGASI: string;
    /**
     * The feature used by jibri participants.
     * @type {string}
     */
    export const FEATURE_JIBRI: string;
    /**
     * The feature used by jigasi transcriber participants.
     * @type {string}
     */
    export const FEATURE_TRANSCRIBER: string;
    /**
     * The feature used by the lib to mark support for e2ee. We use the feature by putting it in the presence
     * to avoid additional signaling (disco-info).
     * @type {string}
     */
    export const FEATURE_E2EE: string;
}
declare module "modules/statistics/AnalyticsAdapter" {
    /**
     * Type for analytics event objects.
     */
    export interface IAnalyticsEvent {
        action?: string;
        actionSubject?: string;
        actionSubjectId?: string;
        attributes?: Record<string, unknown>;
        categories?: string[];
        containerId?: string;
        containerType?: string;
        name?: string;
        objectId?: string;
        objectType?: string;
        source?: string;
        tags?: string[];
        type: string;
    }
    /**
     * Type for analytics handler objects.
     */
    export interface IAnalyticsHandler {
        dispose?: () => void;
        sendEvent: (event: IAnalyticsEvent) => void;
        setUserProperties: (properties: Record<string, unknown>) => void;
    }
    /**
     * This class provides an API to lib-jitsi-meet and its users for sending
     * analytics events. It serves as a bridge to different backend implementations
     * ("analytics handlers") and a cache for events attempted to be sent before
     * the analytics handlers were enabled.
     *
     * The API is designed to be an easy replacement for the previous version of
     * this adapter, and is meant to be extended with more convenience methods.
     *
     *
     * The API calls are translated to objects with the following structure, which
     * are then passed to the sendEvent(event) function of the underlying handlers:
     *
     * {
     *    type,
     *
     *    action,
     *    actionSubject,
     *    actionSubjectId,
     *    attributes,
     *    categories,
     *    containerId,
     *    containerType,
     *    name,
     *    objectId,
     *    objectType,
     *    source,
     *    tags
     * }
     *
     * The 'type' is one of 'operational', 'page', 'track' or 'ui', and some of the
     * other properties are considered required according to the type.
     *
     * For events with type 'page', the required properties are: name.
     *
     * For events with type 'operational' and 'ui', the required properties are:
     * action, actionSubject, source
     *
     * For events with type 'page', the required properties are:
     * action, actionSubject, source, containerType, containerId, objectType,
     * objectId
     */
    class AnalyticsAdapter {
        /**
         * Whether this AnalyticsAdapter has been disposed of or not. Once this
         * is set to true, the AnalyticsAdapter is disabled and does not accept
         * any more events, and it can not be re-enabled.
         * @type {boolean}
         */
        private disposed;
        /**
         * The set of handlers to which events will be sent.
         * @type {Set<AnalyticsHandler>}
         */
        private analyticsHandlers;
        /**
         * The cache of events which are not sent yet. The cache is enabled
         * while this field is truthy, and disabled otherwise.
         * @type {AnalyticsEvent[] | null}
         */
        private cache;
        /**
         * Map of properties that will be added to every event. Note that the
         * keys will be prefixed with "permanent.".
         */
        private permanentProperties;
        /**
         * The name of the conference that this AnalyticsAdapter is associated
         * with.
         * @type {string}
         */
        private conferenceName;
        /**
         * Creates new AnalyticsAdapter instance.
         */
        constructor();
        /**
         * Saves an event to the cache, if the cache is enabled.
         * @param event the event to save.
         * @returns {boolean} true if the event was saved, and false otherwise (i.e.
         * if the cache was disabled).
         * @private
         */
        private _maybeCacheEvent;
        /**
         *
         * @param event
         * @private
         */
        private _sendEvent;
        /**
         * Set the user properties to the analytics handlers.
         *
         * @returns {void}
         */
        private _setUserProperties;
        /**
         * Checks whether an event has all of the required fields set, and tries
         * to fill in some of the missing fields with reasonable default values.
         * Returns true if after this operation the event has all of the required
         * fields set, and false otherwise (if some of the required fields were not
         * set and the attempt to fill them in with a default failed).
         *
         * @param event the event object.
         * @return {boolean} true if the event (after the call to this function)
         * contains all of the required fields, and false otherwise.
         * @private
         */
        private _verifyRequiredFields;
        /**
         * Adds a set of permanent properties to this this AnalyticsAdapter.
         * Permanent properties will be added as "attributes" to events sent to
         * the underlying "analytics handlers", and their keys will be prefixed
         * by "permanent_", i.e. adding a permanent property {key: "value"} will
         * result in {"permanent_key": "value"} object to be added to the
         * "attributes" field of events.
         *
         * @param {Record<string, unknown>} properties the properties to add
         */
        addPermanentProperties(properties: Record<string, unknown>): void;
        /**
             * Dispose analytics. Clears all handlers.
             */
        dispose(): void;
        /**
         * Reset the state to the initial one.
         *
         * @returns {void}
         */
        reset(): void;
        /**
         * Sends an event with a given name and given properties. The first
         * parameter is either a string or an object. If it is a string, it is used
         * as the event name and the second parameter is used at the attributes to
         * attach to the event. If it is an object, it represents the whole event,
         * including any desired attributes, and the second parameter is ignored.
         *
         * @param {String|IAnalyticsEvent} eventName either a string to be used as the name
         * of the event, or an event object. If an event object is passed, the
         * properties parameters is ignored.
         * @param {Record<string, unknown>} properties the properties/attributes to attach to the
         * event, if eventName is a string.
         */
        sendEvent(eventName: string | IAnalyticsEvent, properties?: Record<string, unknown>): void;
        /**
             * Sets the handlers that are going to be used to send analytics. Sends any
             * cached events.
             * @param {IAnalyticsHandler[]} handlers the handlers
             */
        setAnalyticsHandlers(handlers: IAnalyticsHandler[]): void;
        /**
         * Sets the name of the conference that this AnalyticsAdapter is associated
         * with.
         * @param name the name to set.
         */
        setConferenceName(name: string): void;
    }
    const _default_4: AnalyticsAdapter;
    export default _default_4;
}
declare module "modules/statistics/LocalStatsCollector" {
    /**
     * Provides statistics for the local stream.
     */
    export default class LocalStatsCollector {
        stream: MediaStream;
        intervalId: Nullable<Timeout>;
        intervalMilis: number;
        audioLevel: number;
        callback: (audioLevel: number) => void;
        source: Nullable<MediaStreamAudioSourceNode>;
        analyser: Nullable<AnalyserNode>;
        /**
         * Creates a new instance of LocalStatsCollector.
         *
         * @param {MediaStream} stream - the local stream
         * @param {number} interval - stats refresh interval given in ms.
         * @param {Function} callback - function that receives the audio levels.
         * @constructor
         */
        constructor(stream: MediaStream, interval: number, callback: (audioLevel: number) => void);
        /**
         * Starts the collecting the statistics.
         */
        start(): void;
        /**
         * Stops collecting the statistics.
         */
        stop(): void;
        /**
         * Initialize collector.
         */
        static init(): void;
        /**
         * Checks if the environment has the necessary conditions to support
         * collecting stats from local streams.
         *
         * @returns {boolean}
         */
        static isLocalStatsSupported(): boolean;
        /**
         * Disconnects the audio context.
         */
        static disconnectAudioContext(): Promise<void>;
        /**
         * Connects the audio context.
         */
        static connectAudioContext(): void;
    }
}
declare module "modules/statistics/RTPStatsCollector" {
    /**
     * <tt>StatsCollector</tt> registers for stats updates of given
     * <tt>peerconnection</tt> in given <tt>interval</tt>. On each update particular
     * stats are extracted and put in {@link SsrcStats} objects. Once the processing
     * is done <tt>audioLevelsUpdateCallback</tt> is called with <tt>this</tt>
     * instance as an event source.
     */
    export default class StatsCollector {
        /**
         * Creates new <tt>StatsCollector</tt> instance.
         * @param peerconnection WebRTC PeerConnection object.
         * @param audioLevelsInterval
         * @param statsInterval stats refresh interval given in ms.
         * @param eventEmitter
         * @constructor
         */
        constructor(peerconnection: any, audioLevelsInterval: any, statsInterval: any, eventEmitter: any);
        peerconnection: any;
        currentStatsReport: any;
        previousStatsReport: any;
        audioLevelsIntervalId: NodeJS.Timer;
        eventEmitter: any;
        conferenceStats: ConferenceStats;
        audioLevelsIntervalMilis: any;
        speakerList: any[];
        statsIntervalId: NodeJS.Timer;
        statsIntervalMilis: any;
        /**
         * Maps SSRC numbers to {@link SsrcStats}.
         * @type {Map<number,SsrcStats}
         */
        ssrc2stats: Map<number, SsrcStats>;
        /**
         * Tracks whether the previous stats cycle had any inbound video SSRCs in the bad state
         * (bytes received, no frames decoded). Used to emit a final all-clear call to QualityController
         * when the set transitions from non-empty to empty.
         * @type {boolean}
         */
        _hadBadInboundSsrcs: boolean;
        /**
         * Set the list of the remote speakers for which audio levels are to be calculated.
         *
         * @param {Array<string>} speakerList - Endpoint ids.
         * @returns {void}
         */
        setSpeakerList(speakerList: Array<string>): void;
        /**
         * Stops stats updates.
         */
        stop(): void;
        /**
         * Callback passed to <tt>getStats</tt> method.
         * @param error an error that occurred on <tt>getStats</tt> call.
         */
        errorCallback(error: any): void;
        /**
         * Starts stats updates.
         */
        start(startAudioLevelStats: any): void;
        /**
         * Process and emit statistics report.
         * @private
         */
        private _processAndEmitReport;
        /**
         * Converts the value to a non-negative number.
         * If the value is either invalid or negative then 0 will be returned.
         * @param {*} v
         * @return {number}
         * @private
         */
        private getNonNegativeValue;
        /**
         * Calculates bitrate between before and now using a supplied field name and its
         * value in the stats.
         * @param {RTCInboundRtpStreamStats|RTCSentRtpStreamStats} now the current stats
         * @param {RTCInboundRtpStreamStats|RTCSentRtpStreamStats} before the
         * previous stats.
         * @param fieldName the field to use for calculations.
         * @return {number} the calculated bitrate between now and before.
         * @private
         */
        private _calculateBitrate;
        /**
         * Calculates the frames per second rate between before and now using a supplied field name and its value in stats.
         * @param {RTCOutboundRtpStreamStats|RTCSentRtpStreamStats} now the current stats
         * @param {RTCOutboundRtpStreamStats|RTCSentRtpStreamStats} before the previous stats
         * @param {string} fieldName the field to use for calculations.
         * @returns {number} the calculated frame rate between now and before.
         */
        _calculateFps(now: RTCOutboundRtpStreamStats | RTCSentRtpStreamStats, before: RTCOutboundRtpStreamStats | RTCSentRtpStreamStats, fieldName: string): number;
        /**
         * Stats processing for spec-compliant RTCPeerConnection#getStats.
         */
        processStatsReport(): void;
    }
    /**
     * Conference statistics.
     */
    class ConferenceStats {
        /**
         * The bandwidth
         * @type {{}}
         */
        bandwidth: {};
        /**
         * The bit rate
         * @type {{}}
         */
        bitrate: {};
        /**
         * The packet loss rate
         * @type {{}}
         */
        packetLoss: {};
        /**
         * Array with the transport information.
         * @type {Array}
         */
        transport: any[];
    }
    /**
     * Holds "statistics" for a single SSRC.
     */
    class SsrcStats {
        loss: {};
        bitrate: {
            download: number;
            upload: number;
        };
        resolution: {};
        framerate: number;
        codec: string;
        /**
         * Sets the "loss" object.
         * @param loss the value to set.
         */
        setLoss(loss: any): void;
        /**
         * Sets resolution that belong to the ssrc represented by this instance.
         * @param resolution new resolution value to be set.
         */
        setResolution(resolution: any): void;
        /**
         * Adds the "download" and "upload" fields from the "bitrate" parameter to
         * the respective fields of the "bitrate" field of this object.
         * @param bitrate an object holding the values to add.
         */
        addBitrate(bitrate: any): void;
        /**
         * Resets the bit rate for given <tt>ssrc</tt> that belong to the peer
         * represented by this instance.
         */
        resetBitrate(): void;
        /**
         * Sets the "framerate".
         * @param framerate the value to set.
         */
        setFramerate(framerate: any): void;
        /**
         * Sets the codec.
         * @param codec the value to set.
         */
        setCodec(codec: any): void;
        /**
         * Sets the encode stats.
         * @param encodeStats the value to set.
         */
        setEncodeStats(encodeStats: any): void;
        encodeStats: any;
        /**
         * Sets the framesDecoded counter for inbound video streams.
         * @param {number} framesDecoded the value to set.
         */
        setFramesDecoded(framesDecoded: number): void;
        framesDecoded: number;
    }
    export {};
}
declare module "modules/statistics/statistics" {
    import JitsiConference from "JitsiConference";
    import JitsiTrack from "modules/RTC/JitsiTrack";
    import TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    import EventEmitter from "modules/util/EventEmitter";
    import XMPP from "modules/xmpp/xmpp";
    import LocalStats from "modules/statistics/LocalStatsCollector";
    import RTPStats from "modules/statistics/RTPStatsCollector";
    export type IStatisticsOptions = {
        aliasName?: string;
        applicationName?: string;
        callStatsID?: string;
        callStatsSecret?: string;
        confID?: string;
        customScriptUrl?: string;
        roomName?: string;
        userName?: string;
    };
    /**
     * Statistics class provides various functionality related to collecting and reporting statistics.
     */
    export default class Statistics {
        /**
         * Stores all active Statistics instances.
         * @type {Set<Statistics>}
         */
        static _instances: Set<Statistics>;
        /**
         * Static getter for instances property
         * Returns the Set holding all active Statistics instances. Lazily
         * initializes the Set to allow any Set polyfills to be applied.
         * @type {Set<Statistics>}
         */
        static get instances(): Set<Statistics>;
        /**
         * Flag indicating whether audio levels are enabled or not.
         * @static
         * @type {boolean}
         */
        static audioLevelsEnabled: boolean;
        /**
         * The interval for audio levels stats collection.
         * @static
         * @type {number}
         */
        static audioLevelsInterval: number;
        /**
         * The interval for peer connection stats collection.
         * @static
         * @type {number}
         */
        static pcStatsInterval: number;
        /**
         * Flag indicating whether third party requests are disabled.
         * @static
         * @type {boolean}
         */
        static disableThirdPartyRequests: boolean;
        /**
         * Analytics adapter for sending events.
         * @static
         * @type {Object}
         */
        static analytics: {
            addPermanentProperties: (properties: Record<string, any>) => void;
            sendEvent: (eventName: string | Record<string, any>, properties?: Record<string, any>) => void;
        };
        /**
         * Array holding local statistics collectors.
         * @static
         * @type {Array}
         */
        static localStats: LocalStats[];
        /**
         * Local JID constant.
         * @static
         * @type {string}
         */
        static LOCAL_JID: string;
        /**
         * Init statistic options
         * @static
         * @param {Object} options - The options to initialize statistics with
         */
        static init(options: {
            audioLevelsInterval?: number;
            disableAudioLevels?: boolean;
            disableThirdPartyRequests?: boolean;
            pcStatsInterval?: number;
        }): void;
        /**
         * Starts collecting local statistics for a track.
         * @static
         * @param {JitsiTrack} track - The track to collect statistics for
         * @param {Function} callback - The callback to invoke with audio levels
         */
        static startLocalStats(track: JitsiTrack, callback: (audioLevel: number) => void): void;
        /**
         * Stops collecting local statistics for a track.
         * @static
         * @param {JitsiTrack} track - The track to stop collecting statistics for
         */
        static stopLocalStats(track: JitsiTrack): void;
        /**
         * Sends event to analytics and logs a message to the logger/console.
         * @static
         * @param {string | Object} event - The event name, or an object which represents the entire event
         * @param {Object} properties - Properties to attach to the event
         */
        static sendAnalyticsAndLog(event: string | Record<string, any>, properties?: Record<string, any>): void;
        /**
         * Sends event to analytics.
         * @static
         * @param {string | Object} eventName - The event name, or an object which represents the entire event
         * @param {Object} properties - Properties to attach to the event
         */
        static sendAnalytics(eventName: string | Record<string, any>, properties?: Record<string, any>): void;
        /**
         * The options to configure Statistics.
         * @typedef {Object} StatisticsOptions
         * @property {string} userName - The user name to use
         * @property {string} roomName - The room name we are currently in.
         *
         * @param {JitsiConference} conference - The conference instance from which the statistics were initialized.
         * @param {StatisticsOptions} options - The options to use creating the
         * Statistics.
         */
        rtpStatsMap: Map<string, RTPStats>;
        eventEmitter: EventEmitter;
        conference: JitsiConference;
        xmpp: XMPP;
        options: IStatisticsOptions;
        constructor(conference: JitsiConference, options: IStatisticsOptions);
        /**
         * Starts collecting RTP stats for given peerconnection.
         * @param {TraceablePeerConnection} peerconnection
         */
        startRemoteStats(peerconnection: TraceablePeerConnection): void;
        /**
         * Adds a listener for audio level events.
         * @param {Function} listener - The listener to add
         */
        addAudioLevelListener(listener: (...args: any[]) => void): void;
        /**
         * Removes an audio level listener.
         * @param {Function} listener - The listener to remove
         */
        removeAudioLevelListener(listener: (...args: any[]) => void): void;
        /**
         * Adds a listener for before disposed events.
         * @param {Function} listener - The listener to add
         */
        addBeforeDisposedListener(listener: (...args: any[]) => void): void;
        /**
         * Removes a before disposed listener.
         * @param {Function} listener - The listener to remove
         */
        removeBeforeDisposedListener(listener: (...args: any[]) => void): void;
        /**
         * Adds a listener for connection stats events.
         * @param {Function} listener - The listener to add
         */
        addConnectionStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Removes a connection stats listener.
         * @param {Function} listener - The listener to remove
         */
        removeConnectionStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Adds a listener for encode time stats events.
         * @param {Function} listener - The listener to add
         */
        addEncodeTimeStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Removes an encode time stats listener.
         * @param {Function} listener - The listener to remove
         */
        removeEncodeTimeStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Adds a listener for inbound video stats events. The event fires when at least one remote video stream is
         * receiving bytes but decoding no frames, and once more with an empty map when all such streams recover.
         * @param {Function} listener - The listener to add
         */
        addInboundVideoStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Removes an inbound video stats listener.
         * @param {Function} listener - The listener to remove
         */
        removeInboundVideoStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Adds a listener for byte sent stats events.
         * @param {Function} listener - The listener to add
         */
        addByteSentStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Removes a byte sent stats listener.
         * @param {Function} listener - The listener to remove
         */
        removeByteSentStatsListener(listener: (...args: any[]) => void): void;
        /**
         * Updates the list of speakers for which the audio levels are to be calculated. This is needed for the jvb pc only.
         *
         * @param {Array<string>} speakerList The list of remote endpoint ids.
         * @returns {void}
         */
        setSpeakerList(speakerList: string[]): void;
        /**
         * Disposes of this instance, stopping any ongoing stats collection.
         */
        dispose(): void;
        /**
         * Stops remote RTP stats for given peerconnection ID.
         * @param {string} tpcId {@link TraceablePeerConnection.id}
         * @private
         */
        _stopRemoteStats(tpcId: string): void;
        /**
         * Stops collecting RTP stats for given peerconnection
         * @param {TraceablePeerConnection} tpc
         */
        stopRemoteStats(tpc: TraceablePeerConnection): void;
        /**
         * Sends the given feedback
         *
         * @param {number} overall an integer between 1 and 5 indicating the user's rating.
         * @param {string} comment the comment from the user.
         * @returns {Promise} Resolves immediately.
         */
        sendFeedback(overall: number, comment: string): Promise<void>;
    }
}
declare module "JitsiConnection" {
    import JitsiConference from "JitsiConference";
    import { JitsiConnectionEvents } from "JitsiConnectionEvents";
    export interface IConnectionOptions {
        analytics?: any;
        bridgeChannel?: {
            ignoreDomain?: string;
            preferSctp?: boolean;
        };
        disableFocus?: boolean;
        enableWebsocketResume: boolean;
        flags?: Record<string, any>;
        hosts: {
            domain: string;
        };
        name?: string;
        p2pStunServers: any[];
        serviceUrl: string;
        websocketKeepAlive?: number;
        websocketKeepAliveUrl?: string;
        xmppPing?: any;
    }
    export interface IConnectOptions {
        id?: string;
        name?: string;
        password?: string;
    }
    export interface IAttachOptions {
        jid: string;
        rid: string;
        sid: string;
    }
    /**
     * Creates a new connection object for the Jitsi Meet server side video
     * conferencing service. Provides access to the JitsiConference interface.
     */
    export default class JitsiConnection {
        private appID?;
        private token?;
        private _xmpp;
        readonly options: IConnectionOptions;
        /**
         * Creates a new JitsiConnection instance.
         * @param appID - Identification for the provider of Jitsi Meet video conferencing services.
         * @param token - The JWT token used to authenticate with the server (optional).
         * @param options - Object with properties / settings related to connection with the server.
         */
        constructor(appID: string, token: Nullable<string>, options: IConnectionOptions);
        /**
         * Connect the client with the server.
         * @param options - Connecting options (for example authentications parameters).
         * @param options.id - The username to use when connecting, if any.
         * @param options.password - The password to use when connecting with username, if any.
         * @param options.name - The name of the room/conference we will be connecting to. This is needed on connection
         * time to be able to send conference-request over http. If missing the flow where we send conference-iq to jicofo over
         * the established xmpp connection will be used, even in the case where we have configured conference http request url
         * to be used.
         */
        connect(options?: IConnectOptions): void;
        /**
         * Attach to existing connection. Can be used for optimizations. For example:
         * if the connection is created on the server we can attach to it and start
         * using it.
         *
         * @param options - Connecting options - rid, sid and jid.
         */
        attach(options: IAttachOptions): void;
        /**
         * Disconnect the client from the server.
         * @param args - Optional arguments to be passed to XMPP.disconnect
         * @returns Promise that resolves when the disconnect process is finished or rejects with an error.
         */
        disconnect(...args: any): boolean | Promise<void>;
        /**
         * Returns the jid of the participant associated with the XMPP connection.
         *
         * @returns The jid of the participant.
         */
        getJid(): string;
        /**
         * This method allows renewal of the tokens if they are expiring.
         * @param token - The new token.
         */
        refreshToken(token: string): Promise<void>;
        /**
         * Creates and joins new conference.
         * @param name - The name of the conference; if null - a generated name will be
         * provided from the api
         * @param options - Object with properties / settings related to the conference
         * that will be created.
         * @returns The new conference object.
         */
        initJitsiConference(name: Nullable<string>, options: Record<string, any>): JitsiConference;
        /**
         * Subscribes the passed listener to the event.
         * @param event - The connection event.
         * @param listener - The function that will receive the event
         */
        addEventListener(event: JitsiConnectionEvents, listener: (...args: any[]) => void): void;
        /**
         * Unsubscribes the passed handler.
         * @param event - The connection event.
         * @param listener - The function that will receive the event
         */
        removeEventListener(event: JitsiConnectionEvents, listener: (...args: any[]) => void): void;
        /**
         * Returns measured connectionTimes.
         * @returns Object containing connection timing information
         */
        getConnectionTimes(): Record<string, any>;
        /**
         * Adds new feature to the list of supported features for the local
         * participant.
         * @param feature - The name of the feature.
         * @param submit - If true - the new list of features will be
         * immediately submitted to the others.
         */
        addFeature(feature: string, submit?: boolean): void;
        /**
         * Removes a feature from the list of supported features for the local
         * participant
         * @param feature - The name of the feature.
         * @param submit - If true - the new list of features will be
         * immediately submitted to the others.
         */
        removeFeature(feature: string, submit?: boolean): void;
        /**
         * Get object with internal logs.
         * @returns Object containing connection logs and metadata
         */
        getLogs(): Record<string, any>;
    }
}
declare module "modules/RTCStats/DefaulLogStorage" {
    /**
     * The default log storage implementation.
     */
    export default class DefaultLogStorage {
        private rtcStats;
        /**
         * Creates new instance of <tt>DefaultLogStorage</tt>.
         * @param rtcStats - The RTCStats instance.
         */
        constructor(rtcStats: any);
        /**
         * The DefaultLogStorage is ready when the RTCStats is ready.
         *
         * @returns {boolean} <tt>true</tt> when this storage is ready or
         * <tt>false</tt> otherwise.
         */
        isReady(): any;
        /**
         * Called by the <tt>LogCollector</tt> to store a series of log lines into
         * batch.
         *
         * @param {Array<string|Object>} logEntries - An array containing strings
         * representing log lines or aggregated lines objects.
         * @returns {void}
         */
        storeLogs(logEntries: Array<string | any>): void;
    }
}
declare module "modules/RTCStats/interfaces" {
    export interface ITraceOptions {
        endpoint: string;
        isBreakoutRoom: boolean;
        meetingFqn: string;
    }
}
declare module "modules/RTCStats/RTCStats" {
    import JitsiConference from "JitsiConference";
    import JitsiConnection from "JitsiConnection";
    import EventEmitter from "modules/util/EventEmitter";
    import { RTCStatsEvents } from "modules/RTCStats/RTCStatsEvents";
    import { ITraceOptions } from "modules/RTCStats/interfaces";
    /**
     * RTCStats Singleton that is initialized only once for the lifetime of the app, subsequent calls to init will be
     * ignored. Config and conference changes are handled by the start method.
     * RTCStats "proxies" WebRTC functions such as GUM and RTCPeerConnection by rewriting the global objects.
     * The proxies will then send data to the rtcstats server via the trace object.
     * The initialization procedure must be called once after lib-jitsi-meet is loaded.
     */
    class RTCStats {
        private _defaultLogCollector;
        private _initialized;
        private _startedWithNewConnection;
        private _trace;
        events: EventEmitter;
        isTraceAvailable(): boolean;
        /**
         * A JitsiConnection instance is created before the conference is joined, so even though
         * we don't have any conference specific data yet, we can initialize the trace module and
         * send any logs that might of otherwise be missed in case an error occurs between the connection
         * and conference initialization.
         *
         * @param connection - The JitsiConnection instance.
         * @returns {void}
         */
        startWithConnection(connection: JitsiConnection): void;
        /**
         * When a conference is about to start, we need to reset the trace module, and initialize it with the
         * new conference's config. On a normal conference flow this wouldn't be necessary, as the whole page is
         * reloaded, but in the case of breakout rooms or react native the js context doesn't reload, hence the
         * RTCStats singleton and its config persists between conferences.
         *
         * @param conference - JitsiConference instance that's about to start.
         * @returns {void}
         */
        attachToConference(conference: JitsiConference): void;
        /**
         * Reset and connects the trace module to the s server.
         *
         * @param traceOptions - Options for the trace module.
         * @returns {void}
         */
        _connectTrace(traceOptions: ITraceOptions): void;
        /**
         * Sends the identity data to the rtcstats server.
         *
         * @param identityData - Identity data to send.
         * @returns {void}
         */
        sendIdentity(identityData: any): void;
        /**
         * Resets the trace module by closing the websocket and deleting the object.
         * After reset, the rtcstats proxy module that tries to send data via `sendStatsEntry`, will no longer
         * send any data, until the trace module is initialized again. This comes in handy on react-native
         * where ljm doesn't get reloaded, so we need to switch the trace module between conferences.
         *
         * @returns {void}
         */
        reset(): void;
        /**
         * Sends a stats entry to the rtcstats server. This is called by the rtcstats proxy module,
         * or any other app that wants to send custom stats.
         *
         * @param entry - Stats entry to send.
         * @returns {void}
         */
        sendStatsEntry(statsType: RTCStatsEvents, pcId?: Optional<string>, data?: Optional<any>): void;
        /**
         * Creates a new log collector with the default log storage.
         */
        getDefaultLogCollector(maxEntryLength?: number): void;
    }
    const _default_5: RTCStats;
    export default _default_5;
}
declare module "modules/detection/DetectionEvents" {
    export enum DetectionEvents {
        /** Event triggered by {@link NoAudioSignalDetector} when the local audio device associated with a JitsiConference
         * starts receiving audio levels with the value of 0 meaning no audio is being captured on that device, or when
         * it starts receiving audio levels !== 0 after being in a state of no audio.
         * @event
         * @type {boolean} - true when the current conference audio track has audio input false otherwise.
         */
        AUDIO_INPUT_STATE_CHANGE = "audio_input_state_changed",
        /**
         * Event triggered by a audio detector indicating that its active state has changed from active to inactive or vice
         * versa.
         * @event
         * @type {boolean} - true when service has changed to active false otherwise.
         */
        DETECTOR_STATE_CHANGE = "detector_state_change",
        /** Event triggered by NoAudioSignalDetector when the local audio device associated with a JitsiConference goes
         * silent for a period of time, meaning that the device is either broken or hardware/software muted.
         * @event
         * @type {void}
         */
        NO_AUDIO_INPUT = "no_audio_input_detected",
        /**
         *  Event generated by {@link VADNoiseDetection} when the tracked device is considered noisy.
         *  @event
         *  @type {Object}
         */
        VAD_NOISY_DEVICE = "detection.vad_noise_device",
        /**
         * Event generated by VADReportingService when if finishes creating a VAD report for the monitored devices.
         * The generated objects are of type Array<Object>, one score for each monitored device.
         * @event VAD_REPORT_PUBLISHED
         * @type Array<Object> with the following structure:
         * @property {Date} timestamp - Timestamp at which the compute took place.
         * @property {number} avgVAD - Average VAD score over monitored period of time.
         * @property {string} deviceId - Associate local audio device ID.
         */
        VAD_REPORT_PUBLISHED = "vad-report-published",
        /**
         * Event generated by {@link TrackVADEmitter} when PCM sample VAD score is available.
         *
         * @event
         * @type {Object}
         * @property {Date}   timestamp - Exact time at which processed PCM sample was generated.
         * @property {number} score - VAD score on a scale from 0 to 1 (i.e. 0.7)
         * @property {Float32Array} pcmData - Raw PCM data with which the VAD score was calculated.
         * @property {string} deviceId - Device id of the associated track.
         */
        VAD_SCORE_PUBLISHED = "detection.vad_score_published",
        /**
         *  Event generated by {@link VADTalkMutedDetection} when a user is talking while the mic is muted.
         *
         *  @event
         *  @type {Object}
         */
        VAD_TALK_WHILE_MUTED = "detection.vad_talk_while_muted"
    }
}
declare module "modules/webaudio/WebAudioUtils" {
    /**
     * Adapter that creates AudioContext objects depending on the browser.
     *
     * @returns {Optional<AudioContext>} - Return a new AudioContext or undefined if the browser does not support it.
     */
    export function createAudioContext(options?: AudioContextOptions): Optional<AudioContext>;
}
declare module "modules/detection/TrackVADEmitter" {
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import EventEmitter from "modules/util/EventEmitter";
    export interface IVadProcessor {
        calculateAudioFrameVAD: (pcmSample: Float32Array | number[]) => number;
        getRequiredPCMFrequency: () => number;
        getSampleLength: () => number;
    }
    export type AudioContextType = AudioContext;
    export type ScriptProcessorNodeType = ScriptProcessorNode;
    export type MediaStreamAudioSourceNodeType = MediaStreamAudioSourceNode;
    /**
     * Connects an audio JitsiLocalTrack to a vadProcessor using WebAudio ScriptProcessorNode.
     * Once an object is created audio from the local track flows through the ScriptProcessorNode as raw PCM.
     * The PCM is processed by the injected vad module and a voice activity detection score is obtained, the
     * score is published to consumers via an EventEmitter.
     * After work is done with this service the destroy method needs to be called for a proper cleanup.
     *
     * @fires VAD_SCORE_PUBLISHED
     */
    export default class TrackVADEmitter extends EventEmitter {
        private _procNodeSampleRate;
        private _vadProcessor;
        private _localTrack;
        private _bufferResidue;
        private _audioContext;
        private _vadSampleSize;
        private _audioSource;
        private _audioProcessingNode;
        private _destroyed?;
        /**
         * Constructor.
         *
         * @param {number} procNodeSampleRate - Sample rate of the ScriptProcessorNode. Possible values  256, 512, 1024,
         *  2048, 4096, 8192, 16384. Passing other values will default to closes neighbor.
         * @param {Object} vadProcessor - VAD processor that allows us to calculate VAD score for PCM samples.
         * @param {JitsiLocalTrack} jitsiLocalTrack - JitsiLocalTrack corresponding to micDeviceId.
         */
        constructor(procNodeSampleRate: number, vadProcessor: IVadProcessor, jitsiLocalTrack: JitsiLocalTrack);
        /**
         * Factory method that sets up all the necessary components for the creation of the TrackVADEmitter.
         *
         * @param {string} micDeviceId - Target microphone device id.
         * @param {number} procNodeSampleRate - Sample rate of the proc node.
         * @param {Object} vadProcessor -Module that calculates the voice activity score for a certain audio PCM sample.
         * The processor needs to implement the following functions:
         * - <tt>getSampleLength()</tt> - Returns the sample size accepted by getSampleLength.
         * - <tt>getRequiredPCMFrequency()</tt> - Returns the PCM frequency at which the processor operates.
         * - <tt>calculateAudioFrameVAD(pcmSample)</tt> - Process a 32 float pcm sample of getSampleLength size.
         * @returns {Promise<TrackVADEmitter>} - Promise resolving in a new instance of TrackVADEmitter.
         */
        static create(micDeviceId: string, procNodeSampleRate: number, vadProcessor: IVadProcessor): Promise<TrackVADEmitter>;
        /**
         * Sets up the audio graph in the AudioContext.
         *
         * @returns {void}
         */
        _initializeAudioContext(): void;
        /**
         * ScriptProcessorNode callback, the input parameters contains the PCM audio that is then sent to rnnoise.
         * Rnnoise only accepts PCM samples of 480 bytes whereas the webaudio processor node can't sample at a multiple
         * of 480 thus after each _onAudioProcess callback there will remain and PCM buffer residue equal
         * to _procNodeSampleRate / 480 which will be added to the next sample buffer and so on.\
         *
         *
         * @param {AudioProcessingEvent} audioEvent - Audio event.
         * @returns {void}
         * @fires VAD_SCORE_PUBLISHED
         */
        _onAudioProcess(audioEvent: AudioProcessingEvent): void;
        /**
         * Connects the nodes in the AudioContext to start the flow of audio data.
         *
         * @returns {void}
         */
        _connectAudioGraph(): void;
        /**
         * Disconnects the nodes in the AudioContext.
         *
         * @returns {void}
         */
        _disconnectAudioGraph(): void;
        /**
         * Cleanup potentially acquired resources.
         *
         * @returns {void}
         */
        _cleanupResources(): void;
        /**
         * Start the emitter by connecting the audio graph.
         *
         * @returns {void}
         */
        start(): void;
        /**
         * Stops the emitter by disconnecting the audio graph.
         *
         * @returns {void}
         */
        stop(): void;
        /**
         * Destroy TrackVADEmitter instance (release resources and stop callbacks).
         *
         * @returns {void}
         */
        destroy(): void;
    }
}
declare module "modules/detection/VADAudioAnalyser" {
    import JitsiConference from "JitsiConference";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import EventEmitter from "modules/util/EventEmitter";
    export interface IVADProcessor {
        calculateAudioFrameVAD: (pcmSample: Float32Array | number[]) => number;
        getRequiredPCMFrequency: () => number;
        getSampleLength: () => number;
    }
    export interface IVADDetectionService {
        changeMuteState: (isMuted: boolean) => void;
        isActive: () => boolean;
        on: (event: string, handler: () => void) => void;
        processVADScore: (vadScore: IVADScore) => void;
        reset: () => void;
    }
    export interface IVADScore {
        deviceId: string;
        pcmData: Float32Array | number[];
        score: number;
        timestamp: number;
    }
    /**
     * Connects a TrackVADEmitter to the target conference local audio track and manages various services that use
     * the data to produce audio analytics (VADTalkMutedDetection and VADNoiseDetection).
     */
    export default class VADAudioAnalyser extends EventEmitter {
        private _createVADProcessor;
        private _vadEmitter;
        private _isVADEmitterRunning;
        private _detectionServices;
        private _vadInitTracker;
        /**
         * Creates <tt>VADAudioAnalyser</tt>
         * @param {JitsiConference} conference - JitsiConference instance that created us.
         * @param {Object} createVADProcessor - Function that creates a Voice activity detection processor. The processor
         * needs to implement the following functions:
         * - <tt>getSampleLength()</tt> - Returns the sample size accepted by getSampleLength.
         * - <tt>getRequiredPCMFrequency()</tt> - Returns the PCM frequency at which the processor operates.
         * - <tt>calculateAudioFrameVAD(pcmSample)</tt> - Process a 32 float pcm sample of getSampleLength size.
         * @constructor
         */
        constructor(conference: JitsiConference, createVADProcessor: () => IVADProcessor);
        /**
         * Attach a VAD detector service to the analyser and handle it's state changes.
         *
         * @param {Object} vadTMDetector
         */
        addVADDetectionService(vadService: IVADDetectionService): void;
        /**
         * Start the {@link TrackVADEmitter} and attach the event listener.
         * @returns {void}
         */
        _startVADEmitter(): void;
        /**
         * Stop the {@link TrackVADEmitter} and detach the event listener.
         * @returns {void}
         */
        _stopVADEmitter(): void;
        /**
         * Listens for {@link TrackVADEmitter} events and directs them to attached services as needed.
         *
         * @param {Object} vadScore -VAD score emitted by {@link TrackVADEmitter}
         * @param {Date}   vadScore.timestamp - Exact time at which processed PCM sample was generated.
         * @param {number} vadScore.score - VAD score on a scale from 0 to 1 (i.e. 0.7)
         * @param {Float32Array} pcmData - Raw PCM data with which the VAD score was calculated.
         * @param {string} vadScore.deviceId - Device id of the associated track.
         * @listens VAD_SCORE_PUBLISHED
         */
        _processVADScore(vadScore: IVADScore): void;
        /**
         * Change the isMuted state of all attached detection services.
         *
         * @param {boolean} isMuted
         */
        _changeDetectorsMuteState(isMuted: boolean): void;
        /**
         * Notifies the detector that a track was added to the associated {@link JitsiConference}.
         * Only take into account local audio tracks.
         * @param {JitsiLocalTrack} track - The added track.
         * @returns {void}
         * @listens TRACK_ADDED
         */
        _trackAdded(track: JitsiLocalTrack): void;
        /**
         * Notifies the detector that the mute state of a {@link JitsiConference} track has changed. Only takes into account
         * local audio tracks.
         * @param {JitsiLocalTrack} track - The track whose mute state has changed.
         * @returns {void}
         * @listens TRACK_MUTE_CHANGED
         */
        _trackMuteChanged(track: JitsiLocalTrack): void;
        /**
         * Notifies the detector that a track associated with the {@link JitsiConference} was removed. Only takes into
         * account local audio tracks. Cleans up resources associated with the track and resets the processing context.
         *
         * @param {JitsiLocalTrack} track - The removed track.
         * @returns {void}
         * @listens TRACK_REMOVED
         */
        _trackRemoved(track: JitsiLocalTrack): void;
    }
}
declare module "modules/RTC/JitsiLocalTrack" {
    import JitsiConference from "JitsiConference";
    import { CameraFacingMode } from "service/RTC/CameraFacingMode";
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    import JitsiTrack from "modules/RTC/JitsiTrack";
    import TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    export interface IStreamEffect {
        isEnabled: (track: JitsiLocalTrack) => boolean;
        isMuted?: () => boolean;
        setMuted?: (muted: boolean) => void;
        startEffect: (stream: MediaStream) => MediaStream;
        stopEffect: () => void;
    }
    export interface ITrackMetadata {
        displaySurface?: string;
        timestamp: number;
    }
    export interface ITrackConstraints {
        [key: string]: any;
        height?: any;
        width?: any;
    }
    export interface ITrackInfo {
        constraints: ITrackConstraints;
        deviceId: string;
        effects?: IStreamEffect[];
        facingMode?: CameraFacingMode;
        mediaType: MediaType;
        rtcId: number;
        sourceId?: string;
        sourceType?: string;
        stream: MediaStream;
        track: MediaStreamTrack;
        videoType?: VideoType;
    }
    export interface IStreamInfo {
        stream: MediaStream;
        track: MediaStreamTrack;
        videoType?: VideoType;
    }
    export interface IAudioConstraints {
        autoGainControl?: boolean;
        channelCount?: number;
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
    }
    /**
     * Represents a single media track(either audio or video).
     * One <tt>JitsiLocalTrack</tt> corresponds to one WebRTC MediaStreamTrack.
     */
    export default class JitsiLocalTrack extends JitsiTrack {
        private _setEffectInProgress;
        private _constraints;
        private _prevSetMuted;
        private _facingMode?;
        private _trackEnded;
        private _hasSentData;
        private _testDataSent;
        private _realDeviceId?;
        private _sourceName?;
        private _ssrc?;
        private _trackMutedTS;
        private _onDeviceListWillChange;
        private _onAudioOutputDeviceChanged?;
        private _streamEffect?;
        private _originalStream?;
        private _stopStreamInProgress;
        private _effectEnabled?;
        metadata: ITrackMetadata;
        rtcId: number;
        sourceId?: string;
        sourceType?: string;
        deviceId: string;
        resolution?: number;
        maxEnabledResolution?: number;
        /**
         * Constructs a new JitsiLocalTrack instance.
         *
         * @param {Object} trackInfo
         * @param {Object} trackInfo.constraints - The contraints used for creating the track.
         * @param {number} trackInfo.rtcId - The ID assigned by the RTC module.
         * @param {Object} trackInfo.stream - The WebRTC MediaStream, parent of the track.
         * @param {Object} trackInfo.track - The underlying WebRTC MediaStreamTrack for new JitsiLocalTrack.
         * @param {string} trackInfo.mediaType - The MediaType of the JitsiLocalTrack.
         * @param {string} trackInfo.videoType - The VideoType of the JitsiLocalTrack.
         * @param {Array<Object>} trackInfo.effects - The effects to be applied to the JitsiLocalTrack.
         * @param {string} trackInfo.deviceId - The ID of the local device for this track.
         * @param {string} trackInfo.facingMode - Thehe camera facing mode used in getUserMedia call (for mobile only).
         * @param {string} trackInfo.sourceId - The id of the desktop sharing source, which is the Chrome media source ID,
         * returned by Desktop Picker on Electron. NOTE: defined for desktop sharing tracks only.
         * @param {string} trackInfo.sourceType - The type of source the track originates from.
         *
         * @noInheritDoc
         */
        constructor({ constraints, deviceId, facingMode, mediaType, rtcId, sourceId, sourceType, stream, track, videoType, effects }: ITrackInfo);
        /**
         * Adds stream to conference and marks it as "unmute" operation.
         *
         * @private
         * @returns {Promise}
         */
        private _addStreamToConferenceAsUnmute;
        /**
         * Fires NO_DATA_FROM_SOURCE event and logs it to analytics
         *
         * @private
         * @returns {void}
         */
        private _fireNoDataFromSourceEvent;
        /**
         * Sets handlers to the MediaStreamTrack object that will detect camera issues.
         *
         * @private
         * @returns {void}
         */
        private _initNoDataFromSourceHandlers;
        /**
         * Returns true if no data from source events are enabled for this JitsiLocalTrack and false otherwise.
         *
         * @private
         * @returns {boolean} - True if no data from source events are enabled for this JitsiLocalTrack and false otherwise.
         */
        private _isNoDataFromSourceEventsEnabled;
        /**
         * Initializes a new Promise to execute {@link #_setMuted}. May be called multiple times in a row and the
         * invocations of {@link #_setMuted} and, consequently, {@link #mute} and/or {@link #unmute} will be resolved in a
         * serialized fashion.
         *
         * @param {boolean} muted - The value to invoke <tt>_setMuted</tt> with.
         * @private
         * @returns {Promise}
         */
        private _queueSetMuted;
        /**
         * Removes stream from conference and marks it as "mute" operation.
         *
         * @param {Function} successCallback - Callback that will be called when the operation is successful.
         * @param {Function} errorCallback - Callback that will be called when the operation fails.
         * @private
         * @returns {Promise}
         */
        private _removeStreamFromConferenceAsMute;
        /**
         * Mutes / unmutes this track.
         *
         * @param {boolean} muted - If <tt>true</tt>, this track will be muted; otherwise, this track will be unmuted.
         * @private
         * @returns {Promise}
         */
        private _setMuted;
        /**
         * Sets real device ID by comparing track information with device information. This is temporary solution until
         * getConstraints() method will be implemented in browsers.
         *
         * @param {MediaDeviceInfo[]} devices - The list of devices obtained from enumerateDevices() call.
         * @private
         * @returns {void}
         */
        private _setRealDeviceIdFromDeviceList;
        /**
         * Starts the effect process and returns the modified stream.
         *
         * @param {Object} effect - Represents effect instance
         * @private
         * @returns {void}
         */
        private _startStreamEffect;
        /**
         * Stops the effect process and returns the original stream.
         *
         * @private
         * @returns {void}
         */
        private _stopStreamEffect;
        /**
         * Switches the camera facing mode if the WebRTC implementation supports the custom MediaStreamTrack._switchCamera
         * method. Currently, the method in question is implemented in react-native-webrtc only. When such a WebRTC
         * implementation is executing, the method is the preferred way to switch between the front/user-facing and the
         * back/environment-facing cameras because it will likely be (as is the case of react-native-webrtc) noticeably
         * faster that creating a new MediaStreamTrack via a new getUserMedia call with the switched facingMode constraint
         * value. Moreover, the approach with a new getUserMedia call may not even work: WebRTC on Android and iOS is
         * either very slow to open the camera a second time or plainly freezes attempting to do that.
         *
         * @returns {void}
         */
        private _switchCamera;
        /**
         * Stops the currently used effect (if there is one) and starts the passed effect (if there is one).
         *
         * @param {Object|undefined} effect - The new effect to be set.
         * @private
         * @returns {void}
         */
        private _switchStreamEffect;
        /**
         * @inheritdoc
         *
         * Stops sending the media track. And removes it from the HTML. NOTE: Works for local tracks only.
         *
         * @returns {Promise}
         */
        dispose(): Promise<void>;
        /**
         * Returns facing mode for video track from camera. For other cases (e.g. audio track or 'desktop' video track)
         * returns undefined.
         *
         * @returns {Optional<CameraFacingMode>}
         */
        getCameraFacingMode(): Optional<CameraFacingMode>;
        /**
         * Returns the capture resolution of the video track.
         *
         * @returns {Number}
         */
        getCaptureResolution(): number;
        /**
         * Returns device id associated with track.
         *
         * @returns {string}
         */
        getDeviceId(): string;
        /**
         * Get the duration of the track.
         *
         * @returns {Number} the duration of the track in seconds
         */
        getDuration(): number;
        /**
         * Returns the participant id which owns the track.
         *
         * @returns {string} the id of the participants. It corresponds to the
         * Colibri endpoint id/MUC nickname in case of Jitsi-meet.
         */
        getParticipantId(): string;
        /**
         * Returns the source name associated with the jitsi track.
         *
         * @returns {Nullable<string>} source name
         */
        getSourceName(): Nullable<string>;
        /**
         * Returns the primary SSRC associated with the track.
         * @returns {Nullable<number>}
         */
        getSsrc(): Nullable<number>;
        /**
         * Returns if associated MediaStreamTrack is in the 'ended' state
         *
         * @returns {boolean}
         */
        isEnded(): boolean;
        /**
         * Returns <tt>true</tt>.
         *
         * @returns {boolean} <tt>true</tt>
         */
        isLocal(): boolean;
        /**
         * Returns <tt>true</tt> - if the stream is muted and <tt>false</tt> otherwise.
         *
         * @returns {boolean} <tt>true</tt> - if the stream is muted and <tt>false</tt> otherwise.
         */
        isMuted(): boolean;
        /**
         * Checks whether the attached MediaStream is receiving data from source or not. If the stream property is null
         * (because of mute or another reason) this method will return false.
         * NOTE: This method doesn't indicate problem with the streams directly. For example in case of video mute the
         * method will return false or if the user has disposed the track.
         *
         * @returns {boolean} true if the stream is receiving data and false this otherwise.
         */
        isReceivingData(): boolean;
        /**
         * Asynchronously mutes this track.
         *
         * @returns {Promise}
         */
        mute(): Promise<void>;
        /**
         * Handles bytes sent statistics. NOTE: used only for audio tracks to detect audio issues.
         *
         * @param {TraceablePeerConnection} tpc - The peerconnection that is reporting the bytes sent stat.
         * @param {number} bytesSent - The new value.
         * @returns {void}
         */
        onByteSentStatsReceived(tpc: TraceablePeerConnection, bytesSent: number): void;
        /**
         * Sets the JitsiConference object associated with the track. This is temp solution.
         *
         * @param conference - JitsiConference object.
         * @returns {void}
         */
        setConference(conference: JitsiConference): void;
        /**
         * Sets the effect and switches between the modified stream and original one.
         *
         * @param {Object} effect - Represents the effect instance to be used.
         * @returns {Promise}
         */
        setEffect(effect?: IStreamEffect): Promise<void>;
        /**
         * Sets the primary SSRC for the track.
         *
         * @param {number} ssrc The SSRC.
         */
        setSsrc(ssrc: number): void;
        /**
         * Stops the associated MediaStream.
         *
         * @returns {void}
         */
        stopStream(): void;
        /**
         * Creates a text representation of this local track instance.
         *
         * @return {string}
         */
        toString(): string;
        /**
         * Asynchronously unmutes this track.
         *
         * @returns {Promise}
         */
        unmute(): Promise<void>;
        /**
         * Applies media constraints to the current MediaStreamTrack.
         *
         * @param {IAudioConstraints} constraints - Media constraints to apply.
         * @returns {Promise<void>}
         */
        applyConstraints(constraints: IAudioConstraints): Promise<void>;
    }
}
declare module "modules/sdp/SDPDiffer" {
    import Strophe from 'strophe';
    import SDP from "modules/sdp/SDP";
    import { IDiffSourceInfo } from "modules/sdp/constants";
    /**
     * A class that provides methods for comparing the source information present in two different SDPs so that the delta
     * can be signaled to Jicofo via 'source-remove' or 'source-add'.
     */
    export class SDPDiffer {
        private isP2P;
        private mySdp;
        private othersSdp;
        /**
         * Constructor.
         *
         * @param {SDP} mySdp - the new SDP.
         * @param {SDP} othersSdp - the old SDP.
         * @param {boolean} isP2P - Whether the SDPs belong to a p2p peerconnection.
         */
        constructor(mySdp: SDP, othersSdp: SDP, isP2P: boolean);
        /**
         * Returns a map of the sources that are present in 'othersSdp' but not in 'mySdp'.
         *
         * @returns {*}
         */
        getNewMedia(): IDiffSourceInfo;
        /**
         * Adds the diff source info to the provided IQ stanza.
         *
         * @param {Strophe.Builder} modify - Stanza IQ.
         * @returns {boolean}
         */
        toJingle(modify: Strophe.Builder): boolean;
    }
}
declare module "modules/util/AsyncQueue" {
    /**
     * Error to be passed to a callback of a queued task when the queue is cleared.
     */
    export class ClearedQueueError extends Error {
        /**
         * Creates new instance.
         */
        constructor(message: string);
    }
    export type Task = (callback: (err?: Error) => void) => void;
    export type TaskCallback = (err?: Error) => void;
    /**
     * A queue for async task execution.
     */
    export default class AsyncQueue {
        private _queue;
        private _stopped;
        private _taskCallbacks;
        /**
         * Creates new instance.
         */
        constructor();
        /**
         * Internal task processing implementation which makes things work.
         */
        private _processQueueTasks;
        /**
         * Removes any pending tasks from the queue.
         */
        clear(): void;
        /**
         * Pauses the execution of the tasks on the queue.
         */
        pause(): void;
        /**
         * The 'task' function will be given a callback it MUST call with either:
         *  1) No arguments if it was successful or
         *  2) An error argument if there was an error
         * If the task wants to process the success or failure of the task, it
         * should pass the {@code callback} to the push function, e.g.:
         * queue.push(task, (err) => {
         *     if (err) {
         *         // error handling
         *     } else {
         *         // success handling
         *     }
         * });
         *
         * @param {Task} task - The task to be executed. See the description above.
         * @param {TaskCallback} [callback] - Optional callback to be called after the task has been executed.
         */
        push(task: Task, callback?: TaskCallback): void;
        /**
         * Resumes the execution of the tasks on the queue.
         */
        resume(): void;
        /**
         * Shutdowns the queue. All already queued tasks will execute, but no future tasks can be added. If a task is added
         * after the queue has been shutdown then the callback will be called with an error.
         */
        shutdown(): void;
    }
}
declare module "modules/xmpp/JingleSessionState" {
    export enum JingleSessionState {
        /**
         * The active Jingle session state as defined in XEP-0166
         * (after 'session-invite'/'session-accept').
         */
        ACTIVE = "active",
        /**
         * The ended Jingle session state as defined in XEP-0166
         * (after 'session-terminate').
         */
        ENDED = "ended",
        /**
         * The pending Jingle session state which means the session as defined in
         * XEP-0166(before 'session-invite/session-accept' took place).
         */
        PENDING = "pending"
    }
    export const PENDING = JingleSessionState.PENDING;
    export const ACTIVE = JingleSessionState.ACTIVE;
    export const ENDED = JingleSessionState.ENDED;
}
declare module "modules/xmpp/SignalingLayerImpl" {
    import { MediaType } from "service/RTC/MediaType";
    import SignalingLayer, { EndpointId, IPeerMediaInfo, ISourceInfo, SourceName } from "service/RTC/SignalingLayer";
    import { VideoType } from "service/RTC/VideoType";
    import ChatRoom from "modules/xmpp/ChatRoom";
    export const SOURCE_INFO_PRESENCE_ELEMENT = "SourceInfo";
    export interface IPresenceNode {
        [key: string]: any;
        tagName: string;
        value?: string;
    }
    /**
     * Default XMPP implementation of the {@link SignalingLayer} interface. Obtains
     * the data from the MUC presence.
     */
    export default class SignalingLayerImpl extends SignalingLayer {
        /**
         * A map that stores SSRCs of remote streams and the corresponding jid and source name.
         * @type {Map<number, { endpointId: EndpointId, sourceName: SourceName }>}
         */
        private _ssrcOwners;
        /**
         * @type {ChatRoom|null}
         */
        private _chatRoom?;
        /**
         * @type {Record<SourceName, Partial<ISourceInfo>>}
         * @private
         */
        private _localSourceState;
        /**
         * @type {Record<EndpointId, Record<SourceName, ISourceInfo>>}
         * @private
         */
        private _remoteSourceState;
        private _audioMuteHandler?;
        private _videoMuteHandler?;
        private _videoTypeHandler?;
        private _sourceInfoHandler?;
        private _memberLeftHandler?;
        /**
         * Creates new instance.
         */
        constructor();
        /**
         * Adds <SourceInfo> element to the local presence.
         *
         * @returns {boolean}
         * @private
         */
        private _addLocalSourceInfoToPresence;
        /**
         * Binds event listeners to the chat room instance.
         * @param {ChatRoom} room
         * @private
         * @returns {void}
         */
        private _bindChatRoomEventHandlers;
        /**
         * Check is given endpoint has advertised <SourceInfo/> in it's presence which means that the source name signaling
         * is used by this endpoint.
         *
         * @param {EndpointId} endpointId
         * @returns {boolean}
         */
        private _doesEndpointSendNewSourceInfo;
        /**
         * Logs a debug or error message to console depending on whether SSRC rewriting is enabled or not.
         * Owner changes are permitted only when SSRC rewriting is enabled.
         *
         * @param {string} message - The message to be logged.
         * @returns {void}
         */
        private _logOwnerChangedMessage;
        /**
         * @inheritDoc
         */
        getPeerMediaInfo(owner: string, mediaType: MediaType, sourceName?: SourceName): Optional<IPeerMediaInfo>;
        /**
         * @inheritDoc
         */
        getPeerSourceInfo(owner: EndpointId, sourceName: SourceName): Optional<ISourceInfo>;
        /**
         * @inheritDoc
         */
        getSSRCOwner(ssrc: number): Optional<string>;
        /**
         * @inheritDoc
         */
        getTrackSourceName(ssrc: number): Optional<SourceName>;
        /**
         * @inheritDoc
         */
        removeSSRCOwners(ssrcList: number[]): void;
        /**
         * Sets the <tt>ChatRoom</tt> instance used and binds presence listeners.
         * @param {ChatRoom} room
         */
        setChatRoom(room: ChatRoom): void;
        /**
         * @inheritDoc
         */
        setSSRCOwner(ssrc: number, newEndpointId: string, newSourceName: string): void;
        /**
         * @inheritDoc
         */
        setTrackMuteStatus(sourceName: SourceName, muted: boolean): boolean;
        /**
         * @inheritDoc
         */
        setTrackVideoType(sourceName: SourceName, videoType: VideoType): boolean;
        /**
         * @inheritDoc
         */
        updateSsrcOwnersOnLeave(id: string): void;
    }
}
declare module "modules/xmpp/JingleSession" {
    import RTC from "modules/RTC/RTC";
    import Listenable from "modules/util/Listenable";
    import ChatRoom from "modules/xmpp/ChatRoom";
    import { JingleSessionState } from "modules/xmpp/JingleSessionState";
    import SignalingLayerImpl from "modules/xmpp/SignalingLayerImpl";
    import XmppConnection from "modules/xmpp/XmppConnection";
    /**
     * JingleSession provides an API to manage a single Jingle session. We will
     * have different implementations depending on the underlying interface used
     * (i.e. WebRTC and ORTC) and here we hold the code common to all of them.
     */
    export default class JingleSession extends Listenable {
        /**
         * The Jingle session identifier.
         */
        sid: string;
        /**
         * Our JID.
         */
        localJid: string;
        /**
         * The JID of the remote peer.
         */
        remoteJid: string;
        /**
         * The XMPP connection.
         */
        connection: XmppConnection;
        /**
         * The media constraints object passed to the PeerConnection onCreateAnswer/Offer.
         */
        mediaConstraints: object;
        /**
         * The {@code RTCConfiguration} object passed to the PeerConnection's constructor.
         */
        pcConfig: object;
        /**
         * Indicates whether this instance is an initiator or an answerer of
         * the Jingle session.
         */
        isInitiator: boolean;
        /**
         * Whether to use dripping or not. Dripping is sending trickle
         * candidates not one-by-one.
         */
        usedrip: boolean;
        /**
         *  When dripping is used, stores ICE candidates which are to be sent.
         */
        dripContainer: RTCIceCandidate[];
        /**
         * Jingle session state - uninitialized until {@link initialize} is
         * called
         */
        state: Nullable<JingleSessionState>;
        /**
         * Creates new <tt>JingleSession</tt>.
         * @param {string} sid the Jingle session identifier
         * @param {string} localJid our JID
         * @param {string} remoteJid the JID of the remote peer
         * @param {XmppConnection} connection the XMPP connection
         * @param {Object} mediaConstraints the media constraints object passed to the PeerConnection onCreateAnswer/Offer.
         * @param {Object} pcConfig The {@code RTCConfiguration} object passed to the PeerConnection's constructor.
         * @param {boolean} isInitiator indicates if it will be the side which initiates the session.
         */
        constructor(sid: string, localJid: string, remoteJid: string, connection: XmppConnection, mediaConstraints: object, pcConfig: object, isInitiator: boolean);
        /**
         * Returns XMPP address of this session's initiator.
         * @return {string}
         */
        get initiatorJid(): string;
        /**
         * Returns XMPP address of this session's responder.
         * @return {string}
         */
        get responderJid(): string;
        /**
         * The implementing class finishes initialization here. Called at the end of
         * {@link initialize}.
         * @param {Object} options - The options specific to the implementing class.
         * @protected
         */
        protected doInitialize(options: object): void;
        /**
         * Prepares this object to initiate a session.
         * @param {ChatRoom} room the chat room for the conference associated with
         * this session
         * @param {RTC} rtc the RTC service instance
         * @param {SignalingLayerImpl} signalingLayer - The signaling layer instance.
         * @param {object} options - the options, see implementing class's
         * {@link #doInitialize} description for more details.
         */
        initialize(room: ChatRoom, rtc: RTC, signalingLayer: SignalingLayerImpl, options: object): void;
        /**
         * Adds the ICE candidates found in the 'contents' array as remote
         * candidates?
         * Note: currently only used on transport-info
         *
         * @param contents
         */
        addIceCandidates(contents: unknown): void;
        /**
         * Returns current state of this <tt>JingleSession</tt> instance.
         * @returns {Nullable<JingleSessionState>} the current state of this session instance.
         */
        getState(): Nullable<JingleSessionState>;
        /**
         * Handles an 'add-source' event.
         *
         * @param contents an array of Jingle 'content' elements.
         */
        addSources(contents: unknown): void;
        /**
         * Handles a 'remove-source' event.
         *
         * @param contents an array of Jingle 'content' elements.
         */
        removeSources(contents: unknown): void;
        /**
         * Terminates this Jingle session by sending session-terminate
         * @param success a callback called once the 'session-terminate' packet has
         * been acknowledged with RESULT.
         * @param failure a callback called when either timeout occurs or ERROR
         * response is received.
         * @param {Object} options
         * @param {string} [options.reason] XMPP Jingle error condition
         * @param {string} [options.reasonDescription] some meaningful error message
         * @param {boolean} [options.requestRestart=false] set to true to ask Jicofo to start a new session one this once is
         * terminated.
         * @param {boolean} [options.sendSessionTerminate=true] set to false to skip
         * sending session-terminate. It may not make sense to send it if the XMPP
         * connection has been closed already or if the remote peer has disconnected
         */
        terminate(success: Optional<(() => void)>, failure: Optional<(() => void)>, options: {
            reason?: string;
            reasonDescription?: string;
            requestRestart?: boolean;
            sendSessionTerminate?: boolean;
        }): void;
        /**
         * Handles an offer from the remote peer (prepares to accept a session).
         * @param jingle the 'jingle' XML element.
         * @param success callback called when we the incoming session has been
         * accepted
         * @param failure callback called when we fail for any reason, will supply
         * error object with details(which is meant more to be printed to the logger
         * than analysed in the code, as the error is unrecoverable anyway)
         */
        acceptOffer(jingle: unknown, success: Optional<(() => void)>, failure: Optional<((error: unknown) => void)>): void;
    }
}
declare module "modules/xmpp/MediaSessionEvents" {
    export enum MediaSessionEvents {
        /**
         * Event triggered when the remote party signals video max frame heights for its local sources.
         */
        REMOTE_SOURCE_CONSTRAINTS_CHANGED = "media_session.REMOTE_SOURCE_CONSTRAINTS_CHANGED",
        /**
         * Event triggered when the video codec of the local video track has changed.
         */
        VIDEO_CODEC_CHANGED = "media_session.VIDEO_CODEC_CHANGED"
    }
}
declare module "modules/xmpp/JingleSessionPC" {
    import { CodecMimeType } from "service/RTC/CodecMimeType";
    import { MediaType } from "service/RTC/MediaType";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import TraceablePeerConnection, { IAudioQuality, IVideoQuality } from "modules/RTC/TraceablePeerConnection";
    import AsyncQueue from "modules/util/AsyncQueue";
    import JingleSession from "modules/xmpp/JingleSession";
    import XmppConnection from "modules/xmpp/XmppConnection";
    /**
     * @typedef {Object} JingleSessionPCOptions
     * video test ?(ask George).
     * @property {boolean} disableRtx - Described in the config.js[1].
     * @property {boolean} disableSimulcast - Described in the config.js[1].
     * @property {boolean} enableInsertableStreams - Set to true when the insertable streams constraints is to be enabled
     * on the PeerConnection.
     * @property {boolean} failICE - it's an option used in the tests. Set to
     * <tt>true</tt> to block any real candidates and make the ICE fail.
     * @property {boolean} gatherStats - Described in the config.js[1].
     * @property {object} p2p - Peer to peer related options (FIXME those could be
     * fetched from config.p2p on the upper level).
     * @property {Object} testing - Testing and/or experimental options.
     * @property {boolean} webrtcIceUdpDisable - Described in the config.js[1].
     * @property {boolean} webrtcIceTcpDisable - Described in the config.js[1].
     *
     * [1]: https://github.com/jitsi/jitsi-meet/blob/master/config.js
     */
    interface IJingleSessionPCOptions {
        audioQuality?: IAudioQuality;
        channelLastN?: number;
        codecSettings?: CodecMimeType[];
        desktopSharingFrameRate?: {
            max?: number;
        };
        disableRtx?: boolean;
        disableSimulcast?: boolean;
        enableInsertableStreams?: boolean;
        failICE?: boolean;
        forceTurnRelay?: boolean;
        gatherStats?: boolean;
        p2p?: object;
        startSilent?: boolean;
        testing?: {
            enableCodecSelectionAPI?: boolean;
            failICE?: boolean;
        };
        videoQuality?: IVideoQuality;
        webrtcIceTcpDisable?: boolean;
        webrtcIceUdpDisable?: boolean;
    }
    /**
     * Interface for Jingle error objects returned by the error handler.
     */
    interface IJingleError {
        code?: string;
        msg?: string;
        reason?: string;
        session?: string;
    }
    /**
     * Interface for remote source frame height constraints.
     */
    interface ISourceFrameHeight {
        maxHeight: string;
        sourceName: string;
    }
    /**
     * Interface for Jingle session termination options.
     */
    export interface ITerminateOptions {
        reason?: string;
        reasonDescription?: string;
        requestRestart?: boolean;
        sendSessionTerminate?: boolean;
    }
    /**
     *
     */
    export default class JingleSessionPC extends JingleSession {
        private _bridgeSessionId;
        private _cachedOldLocalSdp;
        private _cachedNewLocalSdp;
        private _iceCheckingStartedTimestamp;
        private _gatheringStartedTimestamp;
        private _sourceReceiverConstraints;
        private _localSendReceiveVideoActive;
        private _remoteSendReceiveVideoActive;
        private _gatheringReported;
        private _xmppListeners;
        private _removeSenderVideoConstraintsChangeListener;
        private usesCodecSelectionAPI;
        private wasConnected;
        private isReconnect;
        private wasstable;
        private webrtcIceUdpDisable;
        private webrtcIceTcpDisable;
        private remoteSourceMaxFrameHeights;
        lasticecandidate: boolean;
        numRemoteVideoSources: number;
        numRemoteAudioSources: number;
        modificationQueue: AsyncQueue;
        establishmentDuration: Nullable<number>;
        options: IJingleSessionPCOptions;
        peerconnection: TraceablePeerConnection;
        failICE: boolean;
        /**
         * Parses 'senders' attribute of the video content.
         * @param {Element} jingleContents
         * @return {Nullable<string>} one of the values of content "senders" attribute
         * defined by Jingle. If there is no "senders" attribute or if the value is
         * invalid then <tt>null</tt> will be returned.
         * @private
         */
        static parseVideoSenders(jingleContents: Element): Nullable<string>;
        /**
         * Parses the source-name and max frame height value of the 'content-modify' IQ when source-name signaling
         * is enabled.
         *
         * @param {Element} jingleContents - An element pointing to the '>jingle' element.
         * @returns {Nullable<Object>}
         */
        static parseSourceMaxFrameHeight(jingleContents: Element): Nullable<ISourceFrameHeight[]>;
        /**
         * Creates new <tt>JingleSessionPC</tt>
         * @param {string} sid the Jingle Session ID - random string which identifies the session
         * @param {string} localJid our JID
         * @param {string} remoteJid remote peer JID
         * @param {XmppConnection} connection - The XMPP connection instance.
         * @param mediaConstraints the media constraints object passed to createOffer/Answer, as defined
         * by the WebRTC standard
         * @param pcConfig The {@code RTCConfiguration} to use for the WebRTC peer connection.
         * @param {boolean} isP2P indicates whether this instance is meant to be used in a direct, peer to
         * peer connection or <tt>false</tt> if it's a JVB connection.
         * @param {boolean} isInitiator indicates if it will be the side which initiates the session.
         * @constructor
         *
         * @implements {SignalingLayer}
         */
        constructor(sid: string, localJid: string, remoteJid: string, connection: XmppConnection, mediaConstraints: MediaStreamConstraints, pcConfig: RTCConfiguration, isP2P: boolean, isInitiator: boolean);
        /**
         * Handles either Jingle 'source-add' or 'source-remove' message for this Jingle session.
         *
         * @param {boolean} isAdd <tt>true</tt> for 'source-add' or <tt>false</tt> otherwise.
         * @param {Array<Element>} elem an array of Jingle "content" elements.
         * @returns {Promise} resolved when the operation is done or rejected with an error.
         */
        private _addOrRemoveRemoteStream;
        /**
         * See {@link addTrackToPc} and {@link removeTrackFromPc}.
         *
         * @param {boolean} isRemove <tt>true</tt> for "remove" operation or <tt>false</tt> for "add" operation.
         * @param {JitsiLocalTrack} track the track that will be added/removed.
         * @returns {Promise} resolved when the operation is done or rejected with an error.
         */
        private _addRemoveTrack;
        /**
         * Checks whether or not this session instance is still operational.
         *
         * @returns {boolean} {@code true} if operation or {@code false} otherwise.
         */
        private _assertNotEnded;
        /**
         * Takes in a jingle offer iq, returns the new sdp offer that can be set as remote description in the
         * peerconnection.
         *
         * @param {Element} offerIq the incoming offer.
         * @returns {SDP object} the jingle offer translated to SDP.
         */
        private _processNewJingleOfferIq;
        /**
         * Parses the SSRC information from the source-add/source-remove element passed and updates the SSRC owners.
         *
         * @param {Object} sourceElement the source-add/source-remove element from jingle.
         * @param {boolean} isAdd true if the sources are being added, false if they are to be removed.
         * @returns {Map<string, Object>} - The map of source name to ssrcs, msid and groups.
         */
        private _processSourceMapFromJingle;
        /**
         * Does a new offer/answer flow using the existing remote description (if not provided) and signals any new sources
         * to Jicofo or the remote peer.
         *
         * @param {string} [optionalRemoteSdp] optional, raw remote sdp to use.  If not provided, the remote sdp from the
         * peerconnection will be used.
         * @returns {Promise} promise which resolves when the o/a flow is complete with no arguments or rejects with an
         * error {string}
         */
        private _renegotiate;
        /**
         * Sends 'content-modify' IQ in order to ask the remote peer to either stop or resume sending video media or to
         * adjust sender's video constraints.
         *
         * @returns {void}
         */
        private _sendContentModify;
        /**
         * Sends given candidate in Jingle 'transport-info' message.
         *
         * @param {RTCIceCandidate} candidate the WebRTC ICE candidate instance
         * @returns {void}
         */
        private _sendIceCandidate;
        /**
         * Sends given candidates in Jingle 'transport-info' message.
         *
         * @param {Array<RTCIceCandidate>} candidates an array of the WebRTC ICE candidate instances.
         * @returns {void}
         */
        private _sendIceCandidates;
        /**
         * Sends Jingle 'session-accept' message.
         *
         * @param {function()} success callback called when we receive 'RESULT' packet for the 'session-accept'.
         * @param {function(error)} failure called when we receive an error response or when the request has timed out.
         * @returns {void}
         */
        private _sendSessionAccept;
        /**
         * Sends 'session-initiate' to the remote peer.
         *
         * NOTE this method is synchronous and we're not waiting for the RESULT
         * response which would delay the startup process.
         *
         * @param {string} offerSdp  - The local session description which will be used to generate an offer.
         * @returns {void}
         */
        private _sendSessionInitiate;
        /**
         * Method returns function(errorResponse) which is a callback to be passed to Strophe connection.sendIQ method. An
         * 'error' structure is created that is passed as 1st argument to given <tt>failureCb</tt>. The format of this
         * structure is as follows:
         * {
         *  code: {XMPP error response code}
         *  reason: {the name of XMPP error reason element or 'timeout' if the
          *          request has timed out within <tt>IQ_TIMEOUT</tt> milliseconds}
         *  source: {request.tree() that provides original request}
         *  session: {this JingleSessionPC.toString()}
         * }
         * @param failureCb function(error) called when error response was returned or when a timeout has occurred.
         * @returns {function(this:JingleSessionPC)}
         */
        private newJingleErrorHandler;
        /**
         * Figures out added/removed ssrcs and sends updated IQs to the remote peer or Jicofo.
         *
         * @param oldSDP SDP object for old description.
         * @param newSDP SDP object for new description.
         * @returns {void}
         */
        private notifyMySSRCUpdate;
        /**
         * Handles XMPP connection state changes. Resends any session updates that were cached while the XMPP connection
         * was down.
         *
         * @param {Strophe.Status} status - The new status.
         * @returns {void}
         */
        private onXmppStatusChanged;
        /**
         * This is a setRemoteDescription/setLocalDescription cycle which starts at converting Strophe Jingle IQ into
         * remote offer SDP. Once converted, setRemoteDescription, createAnswer and setLocalDescription calls follow.
         *
         * @param jingleOfferAnswerIq element pointing to the jingle element of the offer (or answer) IQ
         * @param success callback called when sRD/sLD cycle finishes successfully.
         * @param failure callback called with an error object as an argument if we fail at any point during setRD,
         * createAnswer, setLD.
         * @param {Array<JitsiLocalTrack>} [localTracks] the optional list of the local tracks that will be added, before
         * the offer/answer cycle executes (for the local track addition to be an atomic operation together with the
         * offer/answer).
         * @returns {void}
         */
        private setOfferAnswerCycle;
        /**
         * Accepts incoming Jingle 'session-initiate' and should send 'session-accept' in result.
         *
         * @param jingleOffer element pointing to the jingle element of the offer IQ
         * @param success callback called when we accept incoming session successfully and receive RESULT packet to
         * 'session-accept' sent.
         * @param failure function(error) called if for any reason we fail to accept the incoming offer. 'error' argument
         * can be used to log some details about the error.
         * @param {Array<JitsiLocalTrack>} [localTracks] the optional list of the local tracks that will be added, before
         * the offer/answer cycle executes. We allow the localTracks to optionally be passed in so that the addition of the
         * local tracks and the processing of the initial offer can all be done atomically. We want to make sure that any
         * other operations which originate in the XMPP Jingle messages related with this session to be executed with an
         * assumption that the initial offer/answer cycle has been executed already.
         */
        acceptOffer(jingleOffer: Element, success: () => void, failure: (error: any) => void, localTracks?: JitsiLocalTrack[]): void;
        /**
         * {@inheritDoc}
         */
        addIceCandidates(elem: Element): void;
        /**
         * Handles a Jingle source-add message for this Jingle session.
         *
         * @param {Array<Element>} elem an array of Jingle "content" elements.
         * @returns {Promise} resolved when the operation is done or rejected with an error.
         */
        addRemoteStream(elem: Element[]): void;
        /**
         * Adds a new track to the peerconnection. This method needs to be called only when a secondary JitsiLocalTrack is
         * being added to the peerconnection for the first time.
         *
         * @param {Array<JitsiLocalTrack>} localTracks - Tracks to be added to the peer connection.
         * @returns {Promise<void>} that resolves when the track is successfully added to the peerconnection, rejected
         * otherwise.
         */
        addTracks(localTracks?: Nullable<JitsiLocalTrack[]>): Promise<void>;
        /**
         * Adds local track back to the peerconnection associated with this session.
         *
         * @param {JitsiLocalTrack} track - the local track to be added back to the peerconnection.
         * @return {Promise} a promise that will resolve once the local track is added back to this session and
         * renegotiation succeeds (if its warranted). Will be rejected with a <tt>string</tt> that provides some error
         * details in case something goes wrong.
         * @returns {Promise<void>}
         */
        addTrackToPc(track: JitsiLocalTrack): Promise<void>;
        /**
         * Closes the underlying peerconnection and shuts down the modification queue.
         *
         * @returns {void}
         */
        close(): void;
        /**
         * @inheritDoc
         * @param {JingleSessionPCOptions} options  - a set of config options.
         * @returns {void}
         */
        doInitialize(options: IJingleSessionPCOptions): void;
        /**
         * Returns the ice connection state for the peer connection.
         *
         * @returns the ice connection state for the peer connection.
         */
        getIceConnectionState(): RTCIceConnectionState;
        /**
         * Returns the preference for max frame height for the remote video sources.
         *
         * @returns {Optional<$Map<string, number>>}
         */
        getRemoteSourcesRecvMaxFrameHeight(): Optional<ISourceFrameHeight[]>;
        /**
         * Creates an offer and sends Jingle 'session-initiate' to the remote peer.
         *
         * @param {Array<JitsiLocalTrack>} localTracks the local tracks that will be added, before the offer/answer cycle
         * executes (for the local track addition to be an atomic operation together with the offer/answer).
         * @returns {Promise<void>} that resolves when the offer is sent to the remote peer, rejected otherwise.
         */
        invite(localTracks?: JitsiLocalTrack[]): Promise<void>;
        /**
         * Enables/disables local video based on 'senders' attribute of the video conent in 'content-modify' IQ sent by the
         * remote peer. Also, checks if the sourceMaxFrameHeight (as requested by the p2p peer) or the senders attribute of
         * the video content has changed and modifies the local video resolution accordingly.
         *
         * @param {Element} jingleContents - The content of the 'content-modify' IQ sent by the remote peer.
         * @returns {void}
         */
        modifyContents(jingleContents: Element): void;
        /**
         * Handles the termination of the session.
         *
         * @param {string} reasonCondition - The XMPP Jingle reason condition.
         * @param {string} reasonText - The XMPP Jingle reason text.
         * @returns {void}
         */
        onTerminated(reasonCondition: string, reasonText: string): void;
        /**
         * Processes the source map message received from the bridge and creates a new remote track for newly signaled
         * SSRCs or updates the source-name and owner on the remote track for an existing SSRC.
         *
         * @param {Object} message - The source map message.
         * @param {string} mediaType - The media type, 'audio' or 'video'.
         * @returns {void}
         */
        processSourceMap(message: any, mediaType: MediaType): void;
        /**
         * Handles a Jingle source-remove message for this Jingle session.
         *
         * @param {Array<Element>} contents - An array of content elements from the source-remove message.
         * @returns {void}
         */
        removeRemoteStream(elem: Element[]): void;
        /**
         * Handles the deletion of SSRCs associated with a remote user from the remote description when the user leaves.
         *
         * @param {string} id Endpoint id of the participant that has left the call.
         * @returns {void}
         */
        removeRemoteStreamsOnLeave(id: string): void;
        /**
         * Removes local track from the peerconnection as part of the mute operation.
         *
         * @param {JitsiLocalTrack} track the local track to be removed.
         * @return {Promise} a promise which will be resolved once the local track is removed from this session or rejected
         * with a <tt>string</tt> that the describes the error if anything goes wrong.
         */
        removeTrackFromPc(track: JitsiLocalTrack): Promise<void>;
        /**
         * Replaces <tt>oldTrack</tt> with <tt>newTrack</tt> and performs a single offer/answer cycle (if needed) after
         * both operations are done.
         * <tt>oldTrack</tt> or <tt>newTrack</tt> can be null; replacing a valid <tt>oldTrack</tt> with a null
         * <tt>newTrack</tt> effectively just removes <tt>oldTrack</tt>.
         *
         * @param {Nullable<JitsiLocalTrack>} oldTrack the current track in use to be replaced.
         * @param {Nullable<JitsiLocalTrack>} newTrack the new track to use.
         * @returns {Promise} which resolves once the replacement is complete with no arguments or rejects with an error.
         */
        replaceTrack(oldTrack: Nullable<JitsiLocalTrack>, newTrack: Nullable<JitsiLocalTrack>): Promise<void>;
        /**
         * Sets the answer received from the remote peer as the remote description.
         *
         * @param {Element} jingleAnswer - The jingle answer element.
         * @returns {Promise<void>} that resolves when the answer is set as the remote description, rejected otherwise.
         */
        setAnswer(jingleAnswer: Element): Promise<void>;
        /**
         * Resumes or suspends media transfer over the underlying peer connection.
         *
         * @param {boolean} active - <tt>true</tt> to enable media transfer or <tt>false</tt> to suspend media transmission.
         * @returns {Promise<void>}
         */
        setMediaTransferActive(active: boolean): Promise<void>;
        /**
         * Resumes or suspends video media transfer over the p2p peer connection.
         *
         * @param {boolean} videoActive <tt>true</tt> to enable video media transfer or <tt>false</tt> to suspend video
         * media transmission.
         * @return {Promise} a <tt>Promise</tt> which will resolve once the operation is done. It will be rejected with
         * an error description as a string in case anything goes wrong.
         */
        setP2pVideoTransferActive(videoActive: boolean): Promise<void>;
        /**
         * Adjust the preference for max video frame height that the local party is willing to receive. Signals
         * the remote p2p peer.
         *
         * @param {Map<string, number>} sourceReceiverConstraints - The receiver constraints per source.
         * @returns {void}
         */
        setReceiverVideoConstraint(sourceReceiverConstraints: Map<string, number>): void;
        /**
         * Sets the resolution constraint on the local video tracks.
         *
         * @param {number} maxFrameHeight - The user preferred max frame height.
         * @param {string} sourceName - The source name of the track.
         * @returns {Promise} promise that will be resolved when the operation is
         * successful and rejected otherwise.
         */
        setSenderVideoConstraint(maxFrameHeight: number, sourceName?: Nullable<string>): Promise<void>;
        /**
         * Updates the codecs on the peerconnection and initiates a renegotiation (if needed) for the
         * new codec config to take effect.
         *
         * @param {Array<CodecMimeType>} codecList - Preferred codecs for video.
         * @param {CodecMimeType} screenshareCodec - The preferred screenshare codec.
         * @returns {void}
         */
        setVideoCodecs(codecList: CodecMimeType[], screenshareCodec: Optional<CodecMimeType>): void;
        /**
         * @inheritDoc
         */
        terminate(success: () => void, failure: (error: IJingleError) => void, options?: ITerminateOptions): void;
        /**
         * Converts to string with minor summary.
         *
         * @return {string}
         */
        toString(): string;
    }
}
declare module "modules/qualitycontrol/ReceiveVideoController" {
    import JitsiConference from "JitsiConference";
    import JingleSessionPC from "modules/xmpp/JingleSessionPC";
    export interface IReceiverVideoConstraint {
        maxHeight: number;
    }
    export interface IReceiverVideoConstraints {
        assumedBandwidthBps?: number;
        constraints?: {
            [sourceName: string]: IReceiverVideoConstraint;
        };
        defaultConstraints?: IReceiverVideoConstraint;
        lastN?: number;
    }
    /**
     * This class manages the receive video contraints for a given {@link JitsiConference}. These constraints are
     * determined by the application based on how the remote video streams need to be displayed. This class is responsible
     * for communicating these constraints to the bridge over the bridge channel.
     */
    export default class ReceiveVideoController {
        private _conference;
        private _rtc;
        private _lastN;
        private _maxFrameHeight;
        /**
         * The map that holds the max frame height requested per remote source for p2p connection.
         *
         * @type Map<string, number>
         */
        private _sourceReceiverConstraints;
        /**
         * The number of bps requested from the bridge.
         */
        private _assumedBandwidthBps;
        private _lastNLimitedByCpu;
        private _receiveResolutionLimitedByCpu;
        private _receiverVideoConstraints;
        /**
         * Creates a new instance for a given conference.
         *
         * @param {JitsiConference} conference the conference instance for which the new instance will be managing
         * the receive video quality constraints.
         */
        constructor(conference: JitsiConference);
        /**
         * Returns a map of all the remote source names and the corresponding max frame heights.
         *
         * @param {JingleSessionPC} mediaSession - the media session.
         * @param {number} maxFrameHeight - the height to be requested for remote sources.
         * @returns
         */
        _getDefaultSourceReceiverConstraints(mediaSession: JingleSessionPC, maxFrameHeight?: number): Map<string, number>;
        /**
         * Updates the source based constraints based on the maxHeight set.
         *
         * @param {number} maxFrameHeight - the height to be requested for remote sources.
         * @returns {void}
         */
        _updateIndividualConstraints(maxFrameHeight?: number): void;
        /**
         * Returns the last set of receiver constraints that were set on the bridge channel.
         *
         * @returns {IReceiverVideoConstraints}
         */
        getCurrentReceiverConstraints(): IReceiverVideoConstraints;
        /**
         * Returns the lastN value for the conference.
         *
         * @returns {number}
         */
        getLastN(): number;
        /**
         * Checks whether last-n was lowered because of a cpu limitation.
         *
         * @returns {boolean}
         */
        isLastNLimitedByCpu(): boolean;
        /**
         * Handles the {@link JitsiConferenceEvents.MEDIA_SESSION_STARTED}, that is when the conference creates new media
         * session. The preferred receive frameHeight is applied on the media session.
         *
         * @param {JingleSessionPC} mediaSession - the started media session.
         * @returns {void}
         */
        onMediaSessionStarted(mediaSession: JingleSessionPC): void;
        /**
         * Sets the assumed bandwidth bps the local participant should receive from remote participants.
         *
         * @param {number|undefined} assumedBandwidthBps - the new value.
         * @returns {void}
         */
        setAssumedBandwidthBps(assumedBandwidthBps?: number): void;
        /**
         * Selects a new value for "lastN". The requested amount of videos are going to be delivered after the value is
         * in effect. Set to -1 for unlimited or all available videos.
         *
         * @param {number} value the new value for lastN.
         * @returns {void}
         */
        setLastN(value: number): void;
        /**
         * Updates the lastNLimitedByCpu field.
         *
         * @param {boolean} enabled
         * @returns {void}
         */
        setLastNLimitedByCpu(enabled: boolean): void;
        /**
         * Sets the maximum video resolution the local participant should receive from remote participants.
         *
         * @param {number|undefined} maxFrameHeight - the new value.
         * @returns {void}
         */
        setPreferredReceiveMaxFrameHeight(maxFrameHeight?: number): void;
        /**
         * Sets the receiver constraints for the conference.
         *
         * @param {IReceiverVideoConstraints} constraints The video constraints.
         */
        setReceiverConstraints(constraints: IReceiverVideoConstraints): void;
        /**
         * Updates the receivedResolutioLimitedByCpu field.
         *
         * @param {boolean} enabled
         * @return {void}
         */
        setReceiveResolutionLimitedByCpu(enabled: boolean): void;
    }
}
declare module "modules/RTC/BridgeChannel" {
    import { EventEmitter } from 'events';
    import JitsiConference from "JitsiConference";
    import { BridgeVideoType } from "service/RTC/BridgeVideoType";
    import { IReceiverAudioSubscriptionMessage } from "service/RTC/ReceiverAudioSubscription";
    import { SourceName } from "service/RTC/SignalingLayer";
    import ReceiverVideoConstraints from "modules/qualitycontrol/ReceiveVideoController";
    /**
     * Handles a WebRTC RTCPeerConnection or a WebSocket instance to communicate
     * with the videobridge.
     */
    export default class BridgeChannel {
        private _channel;
        private _conference;
        private _connected;
        private _eventEmitter;
        private _mode;
        private _areRetriesEnabled;
        private _closedFromClient;
        private _wsUrl?;
        private _retryTimeout?;
        /**
         * Binds "ondatachannel" event listener on the given RTCPeerConnection
         * instance, or creates a WebSocket connection with the videobridge.
         * At least one of both, peerconnection or wsUrl parameters, must be
         * given.
         * @param {Nullable<RTCPeerConnection>} [peerconnection] WebRTC peer connection
         * instance.
         * @param {Nullable<string>} [wsUrl] WebSocket URL.
         * @param {EventEmitter} emitter the EventEmitter instance to use for event emission.
         * @param {JitsiConference} conference the conference instance.
         */
        constructor(peerconnection: Nullable<RTCPeerConnection>, wsUrl: Nullable<string>, emitter: EventEmitter, conference: JitsiConference);
        /**
         * Initializes the web socket channel.
         *
         * @returns {void}
         */
        _initWebSocket(): void;
        /**
         * Starts the websocket connection retries.
         *
         * @returns {void}
         */
        _startConnectionRetries(): void;
        /**
         * Stops the websocket connection retries.
         *
         * @returns {void}
         */
        _stopConnectionRetries(): void;
        /**
         * Retries to establish the websocket connection after the connection was closed by the server.
         *
         * @param {CloseEvent} closeEvent - The close event that triggered the retries.
         * @returns {void}
         */
        _retryWebSocketConnection(closeEvent: CloseEvent): void;
        /**
         * The channel mode.
         * @return {string} "datachannel" or "websocket" (or null if not yet set).
         */
        get mode(): string;
        /**
         * Closes the currently opened channel.
         */
        close(): void;
        /**
         * Whether there is an underlying RTCDataChannel or WebSocket and it's
         * open.
         * @return {boolean}
         */
        isOpen(): boolean;
        /**
         * Sends local stats via the bridge channel.
         * @param {Object} payload The payload of the message.
         * @throws NetworkError/InvalidStateError/Error if the operation fails or if there is no data channel created.
         */
        sendEndpointStatsMessage(payload: Record<string, unknown>): void;
        /**
         * Sends message via the channel.
         * @param {string} to The id of the endpoint that should receive the
         * message. If "" the message will be sent to all participants.
         * @param  {object} payload The payload of the message.
         * @throws NetworkError or InvalidStateError from RTCDataChannel#send (@see
         * {@link https://developer.mozilla.org/docs/Web/API/RTCDataChannel/send})
         * or from WebSocket#send or Error with "No opened channel" message.
         */
        sendMessage(to: string, payload: Record<string, unknown>): void;
        /**
         * Sends a "lastN value changed" message via the channel.
         * @param {number} value The new value for lastN. -1 means unlimited.
         */
        sendSetLastNMessage(value: number): void;
        /**
         * Sends a message for audio subscription updates.
         *
         * @param {IReceiverAudioSubscriptionMessage} message - The audio subscription message.
         * @returns {void}
         */
        sendReceiverAudioSubscriptionMessage(message: IReceiverAudioSubscriptionMessage): void;
        /**
         * Sends a 'ReceiverVideoConstraints' message via the bridge channel.
         *
         * @param {ReceiverVideoConstraints} constraints video constraints.
         */
        sendReceiverVideoConstraintsMessage(constraints: ReceiverVideoConstraints): void;
        /**
         * Sends a 'SourceVideoTypeMessage' message via the bridge channel.
         *
         * @param {BridgeVideoType} videoType - the video type.
         * @param {SourceName} sourceName - the source name of the video track.
         * @returns {void}
         */
        sendSourceVideoTypeMessage(sourceName: SourceName, videoType: BridgeVideoType): void;
        /**
         * Set events on the given RTCDataChannel or WebSocket instance.
         */
        _handleChannel(channel: RTCDataChannel | WebSocket): void;
        /**
         * Sends passed object via the channel.
         * @param {object} jsonObject The object that will be sent.
         * @throws NetworkError or InvalidStateError from RTCDataChannel#send (@see
         * {@link https://developer.mozilla.org/docs/Web/API/RTCDataChannel/send})
         * or from WebSocket#send or Error with "No opened channel" message.
         */
        _send(jsonObject: Record<string, unknown>): void;
    }
}
declare module "modules/RTC/RTC" {
    /**
     *
     */
    export default class RTC extends Listenable {
        /**
         * Exposes the private helper for converting a WebRTC MediaStream to a
         * JitsiLocalTrack.
         *
         * @param {Array<Object>} tracksInfo
         * @returns {Array<JitsiLocalTrack>}
         */
        static createLocalTracks(tracksInfo: Array<any>): Array<JitsiLocalTrack>;
        /**
         * Creates the local MediaStreams.
         * @param {object} [options] Optional parameters.
         * @param {Array=} options.devices The devices that will be requested.
         * @param {string=} options.resolution Resolution constraints.
         * @param {string=} options.cameraDeviceId
         * @param {string=} options.micDeviceId
         * @returns {*} Promise object that will receive the new JitsiTracks
         */
        static obtainAudioAndVideoPermissions(options?: {
            devices?: any[] | undefined;
            resolution?: string | undefined;
            cameraDeviceId?: string | undefined;
            micDeviceId?: string | undefined;
        }): any;
        /**
         *
         * @param eventType
         * @param listener
         */
        static addListener(eventType: any, listener: any): void;
        /**
         *
         * @param eventType
         * @param listener
         */
        static removeListener(eventType: any, listener: any): void;
        /**
         *
         * @param options
         */
        static init(options?: {}): void;
        /**
         *
         * @param elSelector
         * @param stream
         */
        static attachMediaStream(elSelector: any, stream: any): any;
        /**
         * Returns true if changing the input (camera / microphone) or output
         * (audio) device is supported and false if not.
         * @param {string} [deviceType] Type of device to change. Default is
         *      undefined or 'input', 'output' - for audio output device change.
         * @returns {boolean} true if available, false otherwise.
         */
        static isDeviceChangeAvailable(deviceType?: string): boolean;
        /**
         * Returns whether the current execution environment supports WebRTC (for
         * use within this library).
         *
         * @returns {boolean} {@code true} if WebRTC is supported in the current
         * execution environment (for use within this library); {@code false},
         * otherwise.
         */
        static isWebRtcSupported(): boolean;
        /**
         * Returns currently used audio output device id, '' stands for default
         * device
         * @returns {string}
         */
        static getAudioOutputDevice(): string;
        /**
         * Returns list of available media devices if its obtained, otherwise an
         * empty array is returned/
         * @returns {array} list of available media devices.
         */
        static getCurrentlyAvailableMediaDevices(): any[];
        /**
         * Returns event data for device to be reported to stats.
         * @returns {MediaDeviceInfo} device.
         */
        static getEventDataForActiveDevice(device: any): MediaDeviceInfo;
        /**
         * Sets current audio output device.
         * @param {string} deviceId Id of 'audiooutput' device from
         *      navigator.mediaDevices.enumerateDevices().
         * @returns {Promise} resolves when audio output is changed, is rejected
         *      otherwise
         */
        static setAudioOutputDevice(deviceId: string): Promise<any>;
        /**
         * Allows to receive list of available cameras/microphones.
         * @param {function} callback Would receive array of devices as an
         *      argument.
         */
        static enumerateDevices(callback: Function): void;
        /**
         * A method to handle stopping of the stream.
         * One point to handle the differences in various implementations.
         * @param {MediaStream} mediaStream MediaStream object to stop.
         */
        static stopMediaStream(mediaStream: MediaStream): void;
        /**
         * Returns whether the desktop sharing is enabled or not.
         * @returns {boolean}
         */
        static isDesktopSharingEnabled(): boolean;
        /**
         *
         * @param conference
         * @param options
         */
        constructor(conference: any, options?: {});
        conference: any;
        /**
         * A map of active <tt>TraceablePeerConnection</tt>.
         * @type {Map.<number, TraceablePeerConnection>}
         */
        peerConnections: Map<number, TraceablePeerConnection>;
        localTracks: any[];
        options: {};
        _channel: BridgeChannel;
        /**
         * The value specified to the last invocation of setLastN before the
         * channel completed opening. If non-null, the value will be sent
         * through a channel (once) as soon as it opens and will then be
         * discarded.
         * @private
         * @type {number}
         */
        private _lastN;
        /**
         * Defines the forwarded sources list. It can be null or an array once initialised with a channel forwarded
         * sources event.
         *
         * @type {Array<string>|null}
         * @private
         */
        private _forwardedSources;
        _forwardedSourcesChangeListener: any;
        /**
         * Callback invoked when the list of known audio and video devices has
         * been updated. Attempts to update the known available audio output
         * devices.
         *
         * @private
         * @returns {void}
         */
        private _onDeviceListChanged;
        /**
         * Updates the target audio output device for all remote audio tracks.
         *
         * @param {string} deviceId - The device id of the audio ouput device to
         * use for all remote tracks.
         * @private
         * @returns {void}
         */
        private _updateAudioOutputForAudioTracks;
        /**
         * Removes any listeners and stored state from this {@code RTC} instance.
         *
         * @returns {void}
         */
        destroy(): void;
        /**
         * Initializes the bridge channel of this instance.
         * At least one of both, peerconnection or wsUrl parameters, must be
         * given.
         * @param {RTCPeerConnection} [peerconnection] WebRTC peer connection
         * instance.
         * @param {string} [wsUrl] WebSocket URL.
         */
        initializeBridgeChannel(peerconnection?: RTCPeerConnection, wsUrl?: string): void;
        _channelOpenListener: () => void;
        /**
         * Receives events when forwarded sources had changed.
         *
         * @param {array} forwardedSources The new forwarded sources.
         * @private
         */
        private _onForwardedSourcesChanged;
        /**
         * Should be called when current media session ends and after the
         * PeerConnection has been closed using PeerConnection.close() method.
         */
        onCallEnded(): void;
        /**
         * Sets the capture frame rate to be used for desktop tracks.
         *
         * @param {number} maxFps framerate to be used for desktop track capture.
         */
        setDesktopSharingFrameRate(maxFps: number): void;
        /**
         * Sets the receiver video constraints that determine how bitrate is allocated to each of the video streams
         * requested from the bridge. The constraints are cached and sent through the bridge channel once the channel
         * is established.
         * @param {*} constraints
         */
        setReceiverVideoConstraints(constraints: any): void;
        _receiverVideoConstraints: any;
        /**
         * Sends the track's  video type to the JVB.
         * @param {SourceName} sourceName - the track's source name.
         * @param {BridgeVideoType} videoType - the track's video type.
         */
        sendSourceVideoType(sourceName: SourceName, videoType: BridgeVideoType): void;
        /**
         * Creates new <tt>TraceablePeerConnection</tt>
         * @param {SignalingLayer} signaling The signaling layer that will provide information about the media or
         * participants which is not carried over SDP.
         * @param {object} pcConfig The {@code RTCConfiguration} to use for the WebRTC peer connection.
         * @param {boolean} isP2P Indicates whether or not the new TPC will be used in a peer to peer type of session.
         * @param {object} options The config options.
         * @param {Object} options.audioQuality - Quality settings to applied on the outbound audio stream.
         * @param {boolean} options.capScreenshareBitrate if set to true, lower layers will be disabled for screenshare.
         * @param {Array<CodecMimeType>} options.codecSettings - codec settings to be applied for video streams.
         * @param {boolean} options.disableSimulcast if set to 'true' will disable the simulcast.
         * @param {boolean} options.disableRtx if set to 'true' will disable the RTX.
         * @param {boolean} options.enableInsertableStreams set to true when the insertable streams constraints is to be
         * enabled on the PeerConnection.
         * @param {boolean} options.forceTurnRelay If set to true, the browser will generate only Relay ICE candidates.
         * @param {boolean} options.startSilent If set to 'true' no audio will be sent or received.
         * @param {Object} options.videoQuality - Quality settings to applied on the outbound video streams.
         * @return {TraceablePeerConnection}
         */
        createPeerConnection(signaling: SignalingLayer, pcConfig: object, isP2P: boolean, options: {
            audioQuality: any;
            capScreenshareBitrate: boolean;
            codecSettings: Array<CodecMimeType>;
            disableSimulcast: boolean;
            disableRtx: boolean;
            enableInsertableStreams: boolean;
            forceTurnRelay: boolean;
            startSilent: boolean;
            videoQuality: any;
        }): TraceablePeerConnection;
        /**
         * Removed given peer connection from this RTC module instance.
         * @param {TraceablePeerConnection} traceablePeerConnection
         * @return {boolean} <tt>true</tt> if the given peer connection was removed
         * successfully or <tt>false</tt> if there was no peer connection mapped in
         * this RTC instance.
         */
        _removePeerConnection(traceablePeerConnection: TraceablePeerConnection): boolean;
        /**
         *
         * @param track
         */
        addLocalTrack(track: any): void;
        /**
         * Get forwarded sources list.
         * @returns {Array<string>|null}
         */
        getForwardedSources(): Array<string> | null;
        /**
         * Get local video track.
         * @returns {JitsiLocalTrack|undefined}
         */
        getLocalVideoTrack(): JitsiLocalTrack | undefined;
        /**
         * Returns all the local video tracks.
         * @returns {Array<JitsiLocalTrack>}
         */
        getLocalVideoTracks(): Array<JitsiLocalTrack>;
        /**
         * Get local audio track.
         * @returns {JitsiLocalTrack|undefined}
         */
        getLocalAudioTrack(): JitsiLocalTrack | undefined;
        /**
         * Returns the endpoint id for the local user.
         * @returns {string}
         */
        getLocalEndpointId(): string;
        /**
         * Returns the local tracks of the given media type, or all local tracks if
         * no specific type is given.
         * @param {MediaType} [mediaType] Optional media type filter.
         * (audio or video).
         */
        getLocalTracks(mediaType?: MediaType): any[];
        /**
         * Obtains all remote tracks currently known to this RTC module instance.
         * @param {MediaType} [mediaType] The remote tracks will be filtered
         *      by their media type if this argument is specified.
         * @return {Array<JitsiRemoteTrack>}
         */
        getRemoteTracks(mediaType?: MediaType): Array<JitsiRemoteTrack>;
        /**
         * Set mute for all local audio streams attached to the conference.
         * @returns {Promise}
         */
        setAudioMute(): Promise<any>;
        /**
        * Set mute for all local video streams attached to the conference.
        * @returns {Promise}
        */
        setVideoMute(): Promise<any>;
        /**
        * Set mute for all local desktop video streams attached to the conference.
        * @returns {Promise}
        */
        setDesktopMute(): Promise<any>;
        /**
         *
         * @param track
         */
        removeLocalTrack(track: any): void;
        /**
         * Closes the currently opened bridge channel.
         */
        closeBridgeChannel(): void;
        /**
         *
         * @param {TraceablePeerConnection} tpc
         * @param {number} ssrc
         * @param {number} audioLevel
         * @param {boolean} isLocal
         */
        setAudioLevel(tpc: TraceablePeerConnection, ssrc: number, audioLevel: number, isLocal: boolean): void;
        /**
         * Sends message via the bridge channel.
         * @param {string} to The id of the endpoint that should receive the
         *      message. If "" the message will be sent to all participants.
         * @param {object} payload The payload of the message.
         * @throws NetworkError or InvalidStateError or Error if the operation
         * fails or there is no data channel created.
         */
        sendChannelMessage(to: string, payload: object): void;
        /**
         * Sends the local stats via the bridge channel.
         * @param {Object} payload The payload of the message.
         * @throws NetworkError/InvalidStateError/Error if the operation fails or if there is no data channel created.
         */
        sendEndpointStatsMessage(payload: any): void;
        /**
         * Sends a receiver audio subscription message.
         * @param {*} message
         */
        sendReceiverAudioSubscriptionMessage(message: any): void;
        /**
         * Selects a new value for "lastN". The requested amount of videos are going
         * to be delivered after the value is in effect. Set to -1 for unlimited or
         * all available videos.
         * @param {number} value the new value for lastN.
         */
        setLastN(value: number): void;
        /**
         * Indicates if the source name is currently included in the forwarded sources.
         *
         * @param {string} sourceName The source name that we check for forwarded sources.
         * @returns {boolean} true if the source name is in the forwarded sources or if we don't have bridge channel
         * support, otherwise we return false.
         */
        isInForwardedSources(sourceName: string): boolean;
    }
    import Listenable from "modules/util/Listenable";
    import TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    import BridgeChannel from "modules/RTC/BridgeChannel";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import { MediaType } from "service/RTC/MediaType";
}
declare module "modules/connectivity/TrackStreamingStatus" {
    import JitsiConference from "JitsiConference";
    import { VideoType } from "service/RTC/VideoType";
    import JitsiRemoteTrack from "modules/RTC/JitsiRemoteTrack";
    import RTC from "modules/RTC/RTC";
    /** Track streaming statuses. */
    export enum TrackStreamingStatus {
        /**
         * Status indicating that streaming is currently active.
         */
        ACTIVE = "active",
        /**
         * Status indicating that streaming is currently inactive.
         * Inactive means the streaming was stopped on purpose from the bridge, like exiting forwarded sources or
         * adaptivity decided to drop video because of not enough bandwidth.
         */
        INACTIVE = "inactive",
        /**
         * Status indicating that streaming is currently interrupted.
         */
        INTERRUPTED = "interrupted",
        /**
         * Status indicating that streaming is currently restoring.
         */
        RESTORING = "restoring"
    }
    type StreamingStatusMap = {
        p2p?: boolean;
        startedMs?: number;
        streamingStatus?: string;
        value?: number;
        videoType?: VideoType;
    };
    /**
     * Class is responsible for emitting JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED events.
     */
    export class TrackStreamingStatusImpl {
        rtc: RTC;
        conference: JitsiConference;
        track: JitsiRemoteTrack;
        /**  This holds the timeout callback ID scheduled using window.setTimeout. */
        trackTimer: Nullable<number>;
        /**
         * If video track frozen detection through RTC mute event is supported, we wait some time until video track is
         * considered frozen. But because when the track falls out of forwarded sources it is expected for the video to
         * freeze this timeout must be significantly reduced in "out of forwarded sources" case.
         *
         * Basically this value is used instead of {@link rtcMuteTimeout} when track is not in forwarded sources.
         */
        outOfForwardedSourcesTimeout: number;
        /**
         * How long we are going to wait for the corresponding signaling mute event after the RTC video track muted
         * event is fired on the Media stream, before the connection interrupted is fired. The default value is
         * {@link DEFAULT_P2P_RTC_MUTE_TIMEOUT}.
         */
        p2pRtcMuteTimeout: number;
        /**
         * How long we're going to wait after the RTC video track muted event for the corresponding signalling mute
         * event, before the connection interrupted is fired. The default value is {@link DEFAULT_RTC_MUTE_TIMEOUT}.
         *
         * @returns amount of time in milliseconds
         */
        rtcMuteTimeout: number;
        /**
         * This holds a timestamp indicating  when remote video track was RTC muted. The purpose of storing the
         * timestamp is to avoid the transition to disconnected status in case of legitimate video mute operation where
         * the signalling video muted event can arrive shortly after RTC muted event.
         *
         * The timestamp is measured in milliseconds obtained with <tt>Date.now()</tt>.
         *
         * FIXME merge this logic with NO_DATA_FROM_SOURCE event implemented in JitsiLocalTrack by extending the event
         * to the remote track and allowing to set different timeout for local and remote tracks.
         */
        rtcMutedTimestamp: Nullable<number>;
        /** This holds the restoring timeout callback ID scheduled using window.setTimeout. */
        restoringTimer: Nullable<ReturnType<typeof setTimeout>>;
        /**
         * This holds the current streaming status (along with all the internal events that happen while in that
         * state).
         *
         * The goal is to send this information to the analytics backend for post-mortem analysis.
         */
        streamingStatusMap: StreamingStatusMap;
        _onP2PStatus: () => void;
        _onUserLeft: () => void;
        _onTrackRtcMuted: () => void;
        _onTrackRtcUnmuted: () => void;
        _onSignallingMuteChanged: () => void;
        _onTrackVideoTypeChanged: () => void;
        _onLastNValueChanged: () => void;
        _onForwardedSourcesChanged: () => void;
        _onConnectionStats: (tpc: any, data: any) => void;
        /**
         * The framesDecoded value from the most recent CONNECTION_STATS event for this track's SSRC.
         * Used by the stats-based freeze detection path.
         */
        _lastFramesDecoded: Nullable<number>;
        /**
         * Timestamp (ms) of the last time framesDecoded was observed to have increased.
         * Used to measure how long the track has been frozen.
         */
        _lastFramesDecodedAt: Nullable<number>;
        /**
         * True when the stats-based logic has concluded the video is currently frozen.
         * Cleared when framesDecoded resumes advancing.
         */
        _statsTrackFrozen: boolean;
        /**
         * Calculates the new {@link TrackStreamingStatus} based on the values given for some specific remote track. It is
         * assumed that the conference is currently in the JVB mode (in contrary to the P2P mode)
         * @param isInForwardedSources - indicates whether the track is in the forwarded sources set. When set to
         * false it means that JVB is not sending any video for the track.
         * @param isRestoringTimedout - if true it means that the track has been outside of forwarded sources too
         * long to be considered {@link TrackStreamingStatus.RESTORING}.
         * @param isVideoMuted - true if the track is video muted and we should not expect to receive any video.
         * @param isVideoTrackFrozen - if the current browser support video frozen detection then it will be set to
         * true when the video track is frozen. If the current browser does not support frozen detection the it's always
         * false.
         * @return {TrackStreamingStatus} the new streaming status for the track for whom the values above were provided.
         * @private
         */
        static _getNewStateForJvbMode(isInForwardedSources: boolean, isRestoringTimedout: boolean, isVideoMuted: boolean, isVideoTrackFrozen: boolean): TrackStreamingStatus;
        /**
         * In P2P mode we don't care about any values coming from the JVB and the streaming status can be only active or
         * interrupted.
         * @param isVideoMuted - true if video muted
         * @param isVideoTrackFrozen - true if the video track for the remote track is currently frozen. If the
         * current browser does not support video frozen detection then it's always false.
         * @return {TrackStreamingStatus}
         * @private
         */
        static _getNewStateForP2PMode(isVideoMuted: boolean, isVideoTrackFrozen: boolean): TrackStreamingStatus;
        /**
         * Creates new instance of <tt>TrackStreamingStatus</tt>.
         *
         * @constructor
         * @param rtc - the RTC service instance
         * @param conference - parent conference instance // TODO: Needs JitsiConference Type
         * @param {Object} options
         * @param {number} [options.p2pRtcMuteTimeout=2500] custom value for
         * {@link TrackStreamingStatusImpl.p2pRtcMuteTimeout}.
         * @param {number} [options.rtcMuteTimeout=2000] custom value for
         * {@link TrackStreamingStatusImpl.rtcMuteTimeout}.
         * @param {number} [options.outOfForwardedSourcesTimeout=500] custom value for
         * {@link TrackStreamingStatusImpl.outOfForwardedSourcesTimeout}.
         */
        constructor(rtc: RTC, conference: JitsiConference, track: JitsiRemoteTrack, options: {
            outOfForwardedSourcesTimeout: number;
            p2pRtcMuteTimeout: number;
            rtcMuteTimeout: number;
        });
        /**
         * Gets the video frozen timeout for given source name.
         * @return how long are we going to wait since RTC video muted even, before a video track is considered
         * frozen.
         * @private
         */
        _getVideoFrozenTimeout(): number;
        /**
         * Initializes <tt>TrackStreamingStatus</tt> and bind required event listeners.
         */
        init(): void;
        /**
         * Removes all event listeners and disposes of all resources held by this instance.
         */
        dispose(): void;
        /**
         * Changes streaming status.
         * @param newStatus
         */
        _changeStreamingStatus(newStatus: TrackStreamingStatus): void;
        /**
         * Reset the postponed "streaming interrupted" event which was previously scheduled as a timeout on RTC 'onmute'
         * event.
         */
        clearTimeout(): void;
        /**
         * Clears the timestamp of the RTC muted event for remote video track.
         */
        clearRtcMutedTimestamp(): void;
        /**
         * Checks if track is considered frozen.
         * @return <tt>true</tt> if the video has frozen or <tt>false</tt> when it's either not considered frozen
         * (yet) or if freeze detection is not supported by the current browser.
         *
         * FIXME merge this logic with NO_DATA_FROM_SOURCE event implemented in JitsiLocalTrack by extending the event to
         *       the remote track and allowing to set different timeout for local and remote tracks.
         */
        isVideoTrackFrozen(): boolean;
        /**
         * Handles per-SSRC framesDecoded data from the CONNECTION_STATS event emitted by RTPStatsCollector.
         * Used as a freeze-detection fallback on browsers where MediaStreamTrack mute/unmute events are
         * unreliable (Chrome >= M144, Firefox, Safari).
         *
         * Detection logic: record the timestamp of the last framesDecoded increment. If the counter stops
         * advancing for longer than the configured frozen timeout, declare the track frozen. Clear the frozen
         * state as soon as frames start advancing again.
         *
         * @param data - The CONNECTION_STATS event payload.
         */
        _handleFramesDecodedUpdate(data: any): void;
        /**
         * Figures out (and updates) the current streaming status for the track identified by the source name.
         */
        figureOutStreamingStatus(): void;
        /**
         * Computes the duration of the current streaming status for the track (i.e. 15 seconds in the INTERRUPTED state)
         * and sends a track streaming status event.
         * @param nowMs - The current time (in millis).
         */
        maybeSendTrackStreamingStatusEvent(nowMs: number): void;
        /**
         * On change in forwarded sources set check all leaving and entering track to change their corresponding statuses.
         *
         * @param leavingForwardedSources - The array of sourceName leaving forwarded sources.
         * @param enteringForwardedSources - The array of sourceName entering forwarded sources.
         * @param timestamp - The time in millis
         * @private
         */
        onForwardedSourcesChanged(leavingForwardedSources: string[], enteringForwardedSources: string[], timestamp: number): void;
        /**
         * Clears the restoring timer for video track and the timestamp for entering forwarded sources.
         */
        _clearRestoringTimer(): void;
        /**
         * Checks whether a track had stayed enough in restoring state, compares current time and the time the track
         * entered in forwarded sources. If it hasn't timedout and there is no timer added, add new timer in order to give
         * it more time to become active or mark it as interrupted on next check.
         *
         * @returns <tt>true</tt> if the track was in restoring state more than the timeout
         * ({@link DEFAULT_RESTORING_TIMEOUT}.) in order to set its status to interrupted.
         * @private
         */
        _isRestoringTimedout(): boolean;
        /** Checks whether a track is the current track. */
        _isCurrentTrack(track: JitsiRemoteTrack): boolean;
        /**
         * Sends a last/final track streaming status event for the track of the user that left the conference.
         * @param id - The id of the participant that left the conference.
         */
        onUserLeft(id: string): void;
        /**
         * Handles RTC 'onmute' event for the video track.
         *
         * @param track - The video track for which 'onmute' event will be processed.
         */
        onTrackRtcMuted(track: JitsiRemoteTrack): void;
        /**
         * Handles RTC 'onunmute' event for the video track.
         *
         * @param track - The video track for which 'onunmute' event will be processed.
         */
        onTrackRtcUnmuted(track: JitsiRemoteTrack): void;
        /**
         * Here the signalling "mute"/"unmute" events are processed.
         *
         * @param track - The remote video track for which the signalling mute/unmute event will be
         * processed.
         */
        onSignallingMuteChanged(track: JitsiRemoteTrack): void;
        /**
         * Sends a track streaming status event as a result of the video type changing.
         * @deprecated this will go away with full multiple streams support
         * @param type - The video type.
         */
        onTrackVideoTypeChanged(type: VideoType): void;
    }
    export default TrackStreamingStatusImpl;
}
declare module "modules/RTC/JitsiRemoteTrack" {
    import JitsiConference from "JitsiConference";
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    import { TrackStreamingStatus } from "modules/connectivity/TrackStreamingStatus";
    import JitsiTrack from "modules/RTC/JitsiTrack";
    import RTC from "modules/RTC/RTC";
    /**
     * Represents a single media track (either audio or video).
     *
     * @noInheritDoc
     */
    export default class JitsiRemoteTrack extends JitsiTrack {
        private _sourceName;
        private _trackStreamingStatus;
        private _trackStreamingStatusImpl;
        /**
         * This holds the timestamp indicating when remote video track entered forwarded sources set. Track entering
         * forwardedSources will have streaming status restoring and when we start receiving video will become active,
         * but if video is not received for certain time {@link DEFAULT_RESTORING_TIMEOUT} that track streaming status
         * will become interrupted.
         */
        private _enteredForwardedSourcesTimestamp;
        private _containerHandlers;
        private _rtc;
        private _muted;
        private _hasBeenMuted;
        private _ssrc;
        ownerEndpointId: string;
        isP2P: boolean;
        rtcId: Nullable<string>;
        /**
         * Creates new JitsiRemoteTrack instance.
         * @param {RTC} rtc the RTC service instance.
         * @param {JitsiConference} conference the conference to which this track
         *        belongs to
         * @param {string} ownerEndpointId the endpoint ID of the track owner
         * @param {MediaStream} stream WebRTC MediaStream, parent of the track
         * @param {MediaStreamTrack} track underlying WebRTC MediaStreamTrack for
         *        the new JitsiRemoteTrack
         * @param {MediaType} mediaType the type of the media
         * @param {VideoType} videoType the type of the video if applicable
         * @param {number} ssrc the SSRC number of the Media Stream
         * @param {boolean} muted the initial muted state
         * @param {boolean} isP2P indicates whether or not this track belongs to a
         * P2P session
         * @param {String} sourceName the source name signaled for the track
         * @throws {TypeError} if <tt>ssrc</tt> is not a number.
         */
        constructor(rtc: RTC, conference: JitsiConference, ownerEndpointId: string, stream: MediaStream, track: MediaStreamTrack, mediaType: MediaType, videoType: VideoType, ssrc: number, muted: boolean, isP2P: boolean, sourceName: string);
        /**
         * Attaches the track handlers.
         *
         * @returns {void}
         */
        private _bindTrackHandlers;
        /**
         * Overrides addEventListener method to init TrackStreamingStatus instance when there are listeners for the
         * {@link JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED} event.
         *
         * @param {string} event - event name
         * @param {function} handler - event handler
         */
        private _addEventListener;
        /**
         * Overrides removeEventListener method to dispose TrackStreamingStatus instance.
         *
         * @param {string} event - event name
         * @param {function} handler - event handler
         */
        private _removeEventListener;
        /**
         * Callback invoked when the track is muted. Emits an event notifying
         * listeners of the mute event.
         *
         * @private
         * @returns {void}
         */
        private _onTrackMute;
        /**
         * Callback invoked when the track is unmuted. Emits an event notifying
         * listeners of the mute event.
         *
         * @private
         * @returns {void}
         */
        private _onTrackUnmute;
        /**
         * Handles track play events.
         */
        private _playCallback;
        /**
         * An event handler for events triggered by the attached container.
         *
         * @param {string} type - The type of the event.
         */
        private _containerEventHandler;
        /**
         * Returns a string with a description of the current status of the track.
         *
         * @returns {string}
         */
        private _getStatus;
        /**
         * Initializes trackStreamingStatusImpl.
         */
        private _initTrackStreamingStatus;
        /**
         * Disposes trackStreamingStatusImpl and clears trackStreamingStatus.
         */
        private _disposeTrackStreamingStatus;
        /**
         * Attach time to first media tracker only if there is conference and only
         * for the first element.
         * @param container the HTML container which can be 'video' or 'audio'
         * element.
         */
        protected _attachTTFMTracker(container: HTMLElement): void;
        /**
         * Removes attached event listeners and dispose TrackStreamingStatus .
         *
         * @returns {Promise}
         */
        dispose(): Promise<void>;
        /**
         * Returns the current muted status of the track.
         * @returns {boolean|*|JitsiRemoteTrack.muted} <tt>true</tt> if the track is
         * muted and <tt>false</tt> otherwise.
         */
        isMuted(): boolean;
        /**
         * Returns the participant id which owns the track.
         *
         * @returns {string} the id of the participants. It corresponds to the
         * Colibri endpoint id/MUC nickname in case of Jitsi-meet.
         */
        getParticipantId(): string;
        /**
         * Returns the synchronization source identifier (SSRC) of this remote
         * track.
         *
         * @override
         * @returns {number} the SSRC of this remote track.
         */
        getSsrc(): number;
        /**
         * Returns the tracks source name
         *
         * @override
         * @returns {string} the track's source name
         */
        getSourceName(): string;
        /**
         * Returns track's streaming status.
         *
         * @returns {string} the streaming status <tt>TrackStreamingStatus</tt> of the track. Returns null
         * if trackStreamingStatusImpl hasn't been initialized.
         *
         * {@link TrackStreamingStatus}.
         */
        getTrackStreamingStatus(): Nullable<TrackStreamingStatus>;
        /**
         * Creates a text representation of this remote track instance.
         * @return {string}
         */
        toString(): string;
    }
}
declare module "modules/qualitycontrol/CodecSelection" {
    import JitsiConference from "JitsiConference";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import JingleSessionPC from "modules/xmpp/JingleSessionPC";
    export interface ICodecSelectionOptions {
        [connectionType: string]: {
            disabledCodec?: string;
            enableAV1ForFF?: boolean;
            preferenceOrder?: string[];
            preferredCodec?: string;
            screenshareCodec?: string;
        };
    }
    export type CodecPreferenceOrder = {
        [connectionType: string]: string[];
    };
    export type ScreenshareCodec = {
        [connectionType: string]: string;
    };
    /**
     * This class handles the codec selection mechanism for the conference based on the config.js settings.
     * The preferred codec is selected based on the settings and the list of codecs supported by the browser.
     * The preferred codec is published in presence which is then used by the other endpoints in the
     * conference to pick a supported codec at join time and when the call transitions between p2p and jvb
     * connections.
     */
    export class CodecSelection {
        private codecPreferenceOrder;
        private conference;
        private encodeTimeStats;
        private options;
        private screenshareCodec;
        private visitorCodecs;
        /**
         * Creates a new instance for a given conference.
         *
         * @param {JitsiConference} conference the conference instance
         * @param {*} options
         * @param {string} options.jvb settings (codec list, preferred and disabled) for the jvb connection.
         * @param {string} options.p2p settings (codec list, preferred and disabled) for the p2p connection.
         */
        constructor(conference: JitsiConference, options: ICodecSelectionOptions);
        /**
         * Returns a list of video codecs that are supported by the browser.
         *
         * @param {string} connectionType - media connection type, p2p or jvb.
         * @returns {Array}
         */
        _getSupportedVideoCodecs(connectionType: string): string[];
        /**
         * Returns the current codec preference order for the given connection type.
         *
         * @param {String} connectionType The media connection type, 'p2p' or 'jvb'.
         * @returns {Array<string>}
         */
        getCodecPreferenceList(connectionType: string): string[];
        /**
         * Returns the preferred screenshare codec for the given connection type.
         *
         * @param {Optional} connectionType The media connection type, 'p2p' or 'jvb'.
         * @returns CodecMimeType
         */
        getScreenshareCodec(connectionType: string): Optional<string>;
        /**
         * Sets the codec on the media session based on the codec preference order configured in config.js and the supported
         * codecs published by the remote participants in their presence.
         *
         * @param {JingleSessionPC} mediaSession session for which the codec selection has to be made.
         */
        selectPreferredCodec(mediaSession?: JingleSessionPC): void;
        /**
         * Changes the codec preference order.
         *
         * @param {JitsiLocalTrack} localTrack - The local video track.
         * @param {CodecMimeType} codec - The codec used for encoding the given local video track.
         * @returns boolean - Returns true if the codec order has been updated, false otherwise.
         */
        changeCodecPreferenceOrder(localTrack: JitsiLocalTrack, codec: string): boolean;
        /**
         * Updates the aggregate list of the codecs supported by all the visitors in the call and calculates the
         * selected codec if needed.
         * @param {Array} codecList - visitor codecs.
         * @returns {void}
         */
        updateVisitorCodecs(codecList: string[]): void;
    }
}
declare module "modules/qualitycontrol/ReceiveAudioController" {
    import JitsiConference from "JitsiConference";
    import { IReceiverAudioSubscriptionMessage, ReceiverAudioSubscription } from "service/RTC/ReceiverAudioSubscription";
    /**
     * Controller for managing audio subscriptions in a Jitsi conference. It allows subscribing to remote audio streams
     * based on different modes such as ALL, EXCLUDE, INCLUDE, and NONE.
     */
    export class ReceiverAudioController {
        private _rtc;
        /**
         * The list of remote audio sources that the local endpoint is subscribed/unsubscribed to.
         * This is used when the subscription mode is set to INCLUDE or EXCLUDE.
         */
        private _sourceList;
        /**
         * The audio subscription options for remote audio streams.
         */
        private _subscriptionMode;
        /**
         * Creates a new instance of the ReceiverAudioController.
         */
        constructor(conference: JitsiConference);
        /**
         * Gets the current audio subscription option.
         *
         * @returns {ReceiverAudioSubscription} The current audio subscription option.
         */
        get audioSubscription(): ReceiverAudioSubscription;
        /**
         * Mutes or unmutes the remote audio streams based on the provided parameter.
         *
         * @param {boolean} muted - Indicates whether the remote audio should be muted or not.
         * @returns {void}
         */
        muteRemoteAudio(muted: boolean): void;
        /**
         * Sets the audio subscription options.
         *
         * @param message The audio subscription message containing the mode and optional source list.
         * @returns {void}
         */
        setAudioSubscriptionMode(message: IReceiverAudioSubscriptionMessage): void;
    }
}
declare module "modules/qualitycontrol/SendVideoController" {
    import JitsiConference from "JitsiConference";
    import JingleSessionPC from "modules/xmpp/JingleSessionPC";
    export interface IVideoConstraint {
        maxHeight: number;
        sourceName: string;
    }
    /**
     * The class manages send video constraints across media sessions({@link JingleSessionPC}) which belong to
     * {@link JitsiConference}. It finds the lowest common value, between the local user's send preference and
     * the remote party's receive preference. Also this module will consider only the active session's receive value,
     * because local tracks are shared and while JVB may have no preference, the remote p2p may have and they may be totally
     * different.
     */
    export default class SendVideoController {
        private _conference;
        private _preferredSendMaxFrameHeight;
        /**
         * Per-session source-name sender constraints. WeakMap so ended sessions are released by the GC without
         * explicit cleanup. Keyed by session, value is a map of sourceName -> maxHeight.
         */
        private _sessionSenderConstraints;
        /**
         * Creates new instance for a given conference.
         *
         * @param {JitsiConference} conference - the conference instance for which the new instance will be managing
         * the send video quality constraints.
         */
        constructor(conference: JitsiConference);
        /**
         * Returns the constraint map for the currently active session, or undefined when there is no active session.
         *
         * @returns {Map<string, number> | undefined}
         * @private
         */
        private _activeSessionMap;
        /**
         * Figures out the send video constraint as specified by {@link _selectSendMaxFrameHeight} and sets it on all media
         * sessions for the reasons mentioned in this class description.
         *
         * @param {string} sourceName - The source for which sender constraints have changed.
         * @returns {Promise<void>}
         * @private
         */
        _propagateSendMaxFrameHeight(sourceName: string): Promise<void>;
        /**
         * Selects the lowest common value for the local video send constraint by looking at local user's preference and
         * the active media session's receive preference set by the remote party.
         *
         * @param {string} sourceName - The source for which sender constraints have changed.
         * @returns {Optional<number>}
         * @private
         */
        _selectSendMaxFrameHeight(sourceName: string): Optional<number>;
        /**
         * Configures the video encodings on the local sources when a media connection is established or becomes active.
         *
         * @returns {void}
         */
        configureConstraintsForLocalSources(): void;
        /**
         * Handles the {@link JitsiConferenceEvents.MEDIA_SESSION_STARTED}, that is when the conference creates new media
         * session. It doesn't mean it's already active though. For example the JVB connection may be created after
         * the conference has entered the p2p mode already.
         *
         * @param {JingleSessionPC} mediaSession - the started media session.
         */
        onMediaSessionStarted(mediaSession: JingleSessionPC): void;
        /**
         * Propagates the video constraints if they have changed.
         *
         * @param {IVideoConstraint} videoConstraints - The sender video constraints received from the bridge.
         * @returns {Promise<void>}
         */
        onSenderConstraintsReceived(videoConstraints: IVideoConstraint): Promise<void>;
        /**
         * Sets local preference for max send video frame height.
         *
         * @param {number} maxFrameHeight - the new value to set.
         * @returns {Promise<void>} - resolved when the operation is complete.
         */
        setPreferredSendMaxFrameHeight(maxFrameHeight: number): Promise<void>;
    }
}
declare module "modules/qualitycontrol/QualityController" {
    import JitsiConference from "JitsiConference";
    import { CodecMimeType } from "service/RTC/CodecMimeType";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    import { CodecSelection } from "modules/qualitycontrol/CodecSelection";
    import { ReceiverAudioController } from "modules/qualitycontrol/ReceiveAudioController";
    import ReceiveVideoController from "modules/qualitycontrol/ReceiveVideoController";
    import SendVideoController from "modules/qualitycontrol/SendVideoController";
    export const NOT_DECODING_THRESHOLD_CYCLES = 6;
    enum QualityLimitationReason {
        BANDWIDTH = "bandwidth",
        CPU = "cpu",
        NONE = "none"
    }
    interface IResolution {
        height: number;
        width: number;
    }
    interface IOutboundRtpStats {
        codec: CodecMimeType;
        encodeTime: number;
        qualityLimitationReason: QualityLimitationReason;
        resolution: IResolution;
        timestamp: number;
    }
    export interface ISourceStats {
        avgEncodeTime: number;
        codec: CodecMimeType;
        encodeResolution: number;
        localTrack: JitsiLocalTrack;
        qualityLimitationReason: QualityLimitationReason;
        timestamp: number;
        tpc: TraceablePeerConnection;
    }
    export interface IInboundVideoStats {
        bitrateDownload: number;
        fps: number;
        participantId: string;
    }
    export class FixedSizeArray {
        private _data;
        private _maxSize;
        constructor(size: number);
        add(item: ISourceStats): void;
        get(index: number): Optional<ISourceStats>;
        size(): number;
    }
    /**
     * QualityController class that is responsible for maintaining optimal video quality experience on the local endpoint
     * by controlling the codec, encode resolution and receive resolution of the remote video streams. It also makes
     * adjustments based on the outbound and inbound rtp stream stats reported by the underlying peer connection.
     */
    export class QualityController {
        private _audioController;
        private _codecController;
        private _conference;
        private _enableAdaptiveMode;
        private _encodeTimeStats;
        private _isLastNRampupBlocked;
        private _lastNRampupTime;
        private _lastNRampupTimeout;
        private _limitedByCpuTimeout;
        private _notDecodingVideoTracker;
        private _receiveVideoController;
        private _sendVideoController;
        private _timer;
        /**
         *
         * @param {JitsiConference} conference - The JitsiConference instance.
         * @param {Object} options - video quality settings passed through config.js.
         */
        constructor(conference: JitsiConference, options: {
            enableAdaptiveMode: boolean;
            jvb: object;
            lastNRampupTime: number;
            p2p: object;
        });
        /**
         * Creates a debounced function that delays the execution of the provided function until after the specified delay
         * has elapsed. Unlike typical debounce implementations, the timer does not reset when the function is called again
         * within the delay period.
         *
         * @param {Function} func - The function to be debounced.
         * @param {number} delay - The delay in milliseconds.
         * @returns {Function} - The debounced function.
         */
        _debounce(func: Function, delay: number): (...args: any) => void;
        /**
         * Adjusts the lastN value so that fewer remote video sources are received from the bridge in an attempt to improve
         * encode resolution of the outbound video streams based on cpuLimited parameter passed. If cpuLimited is false,
         * the lastN value will slowly be ramped back up to the channelLastN value set in config.js.
         *
         * @param {boolean} cpuLimited - whether the endpoint is cpu limited or not.
         * @returns boolean - Returns true if an action was taken, false otherwise.
         */
        _lowerOrRaiseLastN(cpuLimited: boolean): boolean;
        /**
         * Adjusts the requested resolution for remote video sources by updating the receiver constraints in an attempt to
         * improve the encode resolution of the outbound video streams.
         * @return {void}
         */
        _maybeLowerReceiveResolution(): void;
        /**
         * Updates the codec preference order for the local endpoint on the active media session and switches the video
         * codec if needed.
         *
         * @param {number} trackId - The track ID of the local video track for which stats have been captured.
         * @returns {boolean} - Returns true if video codec was changed.
         */
        _maybeSwitchVideoCodec(trackId: number): boolean;
        /**
         * Adjusts codec, lastN or receive resolution based on the send resolution (of the outbound streams) and limitation
         * reported by the browser in the WebRTC stats. Recovery is also attempted if the limitation goes away. No action
         * is taken if the adaptive mode has been disabled through config.js.
         *
         * @param {ISourceStats} sourceStats - The outbound-rtp stats for a local video track.
         * @returns {void}
         */
        _performQualityOptimizations(sourceStats: ISourceStats): void;
        /**
         * Processes inbound video stats for remote streams that are receiving bytes but decoding no frames.
         * Only SSRCs already filtered to the problematic condition (bitrateDownload > 0, fps === 0) are passed in.
         * Tracks each affected SSRC across consecutive polling cycles and fires RTCStats + Amplitude analytics events
         * after NOT_DECODING_THRESHOLD_CYCLES consecutive bad cycles. Fires again with stopped=false when resolved.
         *
         * @param {TraceablePeerConnection} tpc - The peer connection where stats were captured.
         * @param {Map<number, IInboundVideoStats>} stats - Per-SSRC stats for streams currently failing the check.
         * @returns {void}
         */
        _processInboundVideoStats(tpc: TraceablePeerConnection, stats: Map<number, IInboundVideoStats>): void;
        /**
         * Processes the outbound RTP stream stats as reported by the WebRTC peerconnection and makes runtime adjustments
         * to the client for better quality experience if the adaptive mode is enabled.
         *
         * @param {TraceablePeerConnection} tpc - The underlying WebRTC peerconnection where stats have been captured.
         * @param {Map<number, IOutboundRtpStats>} stats - Outbound-rtp stream stats per SSRC.
         * @returns void
         */
        _processOutboundRtpStats(tpc: TraceablePeerConnection, stats: Map<number, IOutboundRtpStats>): void;
        /**
         * Gets the audio controller instance.
         */
        get audioController(): ReceiverAudioController;
        /**
         * Gets the codec controller instance.
         */
        get codecController(): CodecSelection;
        /**
         * Gets the receive video controller instance.
         */
        get receiveVideoController(): ReceiveVideoController;
        /**
         * Gets the send video controller instance.
         */
        get sendVideoController(): SendVideoController;
        /**
         * Cleans up the QualityController by clearing all active timeouts and disposing of controllers.
         * This prevents memory leaks and ensures proper cleanup when the controller is no longer needed.
         */
        dispose(): void;
    }
}
declare module "JitsiParticipant" {
    import JitsiConference from "JitsiConference";
    import JitsiRemoteTrack from "modules/RTC/JitsiRemoteTrack";
    import { MediaType } from "service/RTC/MediaType";
    import { SourceName } from "service/RTC/SignalingLayer";
    import { VideoType } from "service/RTC/VideoType";
    export interface ISourceInfo {
        muted: boolean;
        videoType: string;
    }
    /**
     * Represents a participant in (i.e. a member of) a conference.
     */
    export default class JitsiParticipant {
        private _jid;
        private _id;
        private _conference;
        private _role;
        private _hidden;
        private _statsID?;
        private _properties;
        private _identity?;
        private _isReplacing?;
        private _isReplaced?;
        private _isSilent?;
        private _features;
        private _sources;
        private _botType?;
        private _connectionJid?;
        /**
         * Initializes a new JitsiParticipant instance.
         *
         * @param jid the conference XMPP jid
         * @param conference
         * @param displayName
         * @param {Boolean} hidden - True if the new JitsiParticipant instance is to
         * represent a hidden participant; otherwise, false.
         * @param {string} statsID - optional participant statsID
         * @param {string} status - the initial status if any.
         * @param {object} identity - the xmpp identity
         * @param {boolean?} isReplacing - whether this is a participant replacing another into the meeting.
         * @param {boolean?} isReplaced - whether this is a participant to be kicked and replaced into the meeting.
         * @param {boolean?} isSilent - whether participant has joined without audio
         */
        constructor(jid: string, conference: JitsiConference, displayName: string, hidden: boolean, statsID?: string, status?: string, identity?: object, isReplacing?: boolean, isReplaced?: boolean, isSilent?: boolean);
        /**
         * Determines whether all JitsiTracks which are of a specific MediaType and which belong to this
         * JitsiParticipant are muted.
         *
         * @param {MediaType} mediaType - The MediaType of the JitsiTracks to be checked.
         * @private
         * @returns {Boolean} True if all JitsiTracks which are of the specified mediaType and which belong to this
         * JitsiParticipant are muted; otherwise, false.
         */
        _isMediaTypeMuted(mediaType: MediaType): boolean;
        /**
         * Sets source info.
         * @param {MediaType} mediaType The media type, 'audio' or 'video'.
         * @param {boolean} muted The new muted state.
         * @param {SourceName} sourceName The name of the source.
         * @param {string} videoType The video type of the source.
         * @returns {void}
         */
        _setSources(mediaType: MediaType, muted: boolean, sourceName: SourceName, videoType: VideoType): void;
        /**
         * Returns the bot type for the participant.
         *
         * @returns {Optional<string>} - The bot type of the participant.
         */
        getBotType(): Optional<string>;
        /**
         * @returns {JitsiConference} The conference that this participant belongs
         * to.
         */
        getConference(): JitsiConference;
        /**
         * Returns the connection jid for the participant.
         *
         * @returns {Optional<string>} - The connection jid of the participant.
         */
        getConnectionJid(): Optional<string>;
        /**
         * @returns {String} The human-readable display name of this participant.
         */
        getDisplayName(): string;
        /**
         * Returns a set with the features for the participant.
         * @returns {Promise<Set<String>>}
         */
        getFeatures(): Promise<Set<string>>;
        /**
         * @returns {String} The ID of this participant.
         */
        getId(): string;
        /**
         * Returns the XMPP identity. This is defined by your application in the
         * JWT `context` claims section.
         *
         * @returns {Optional<object>} - XMPP user identity.
         */
        getIdentity(): Optional<object>;
        /**
         * @returns {String} The JID of this participant.
         */
        getJid(): string;
        /**
         * Gets the value of a property of this participant.
         */
        getProperty(name: string): any;
        /**
         * @returns {String} The role of this participant.
         */
        getRole(): string;
        /**
         * Returns the sources associated with this participant.
         * @returns Map<string, Map<string, Object>>
         */
        getSources(): Map<MediaType, Map<string, ISourceInfo>>;
        /**
         * @returns {String} The stats ID of this participant.
         */
        getStatsID(): string;
        /**
         * @returns {String} The status of the participant.
         */
        getStatus(): string;
        /**
         * @returns {Array.<JitsiRemoteTrack>} The list of media tracks for this
         * participant.
         */
        getTracks(): (JitsiRemoteTrack)[];
        /**
         * @param {MediaType} mediaType
         * @returns {Array.<JitsiRemoteTrack>} an array of media tracks for this
         * participant, for given media type.
         */
        getTracksByMediaType(mediaType: MediaType): (JitsiRemoteTrack)[];
        /**
         * Checks current set features.
         * @param {String} feature - the feature to check.
         * @return {boolean} <tt>true</tt> if this <tt>participant</tt> contains the
         * <tt>feature</tt>.
         */
        hasFeature(feature: string): boolean;
        /**
         * @returns {Boolean} Whether this participant has muted their audio.
         */
        isAudioMuted(): boolean;
        /**
         * @returns {Boolean} Whether this participant is a hidden participant. Some
         * special system participants may want to join hidden (like for example the
         * recorder).
         */
        isHidden(): boolean;
        /**
         * @returns {Boolean} Whether this participant is a hidden participant. Some
         * special system participants may want to join hidden (like for example the
         * recorder).
         */
        isHiddenFromRecorder(): boolean;
        /**
         * @returns {Boolean} Whether this participant is a moderator or not.
         */
        isModerator(): boolean;
        /**
         * @returns {Boolean} Wheter this participants will be replaced by another
         * participant in the meeting.
         */
        isReplaced(): boolean;
        /**
         * @returns {Boolean} Whether this participant replaces another participant
         * from the meeting.
         */
        isReplacing(): boolean;
        /**
         * @returns {Boolean} Whether this participant has joined without audio.
         */
        isSilent(): boolean;
        /**
         * @returns {Boolean} Whether this participant has muted their video.
         */
        isVideoMuted(): boolean;
        /**
         * Sets the bot type for the participant.
         * @param {String} newBotType - The new bot type to set.
         */
        setBotType(newBotType: string): void;
        /**
         * Sets the connection jid for the participant.
         * @param {String} newJid - The connection jid to set.
         */
        setConnectionJid(newJid: string): void;
        /**
         * Set new features.
         * @param {Set<String>|undefined} newFeatures - Sets new features.
         */
        setFeatures(newFeatures?: Set<string>): void;
        /**
         * Sets whether participant is being replaced by another based on jwt.
         * @param {boolean} newIsReplaced - whether is being replaced.
         */
        setIsReplaced(newIsReplaced: boolean): void;
        /**
         * Sets whether participant is replacing another based on jwt.
         * @param {boolean} newIsReplacing - whether is replacing.
         */
        setIsReplacing(newIsReplacing: boolean): void;
        /**
         * Sets whether participant has joined without audio.
         * @param {boolean} newIsSilent - whether is silent.
         */
        setIsSilent(newIsSilent: boolean): void;
        /**
         * Sets the value of a property of this participant, and fires an event if
         * the value has changed.
         * @param {string} name the name of the property.
         * @param {any} value the value to set.
         */
        setProperty(name: string, value: any): void;
        /**
         * Sets a new participant role.
         * @param {String} newRole - the new role.
         */
        setRole(newRole: string): void;
        /**
         *
         */
        supportsDTMF(): boolean;
    }
}
declare module "modules/recording/recordingXMLUtils" {
    /**
     * A collection of utility functions for taking in XML and parsing it to return
     * certain values.
     */
    export interface IFocusRecordingUpdate {
        error?: string;
        initiator?: string;
        recordingMode?: string;
        sessionID?: string;
        status?: string;
    }
    export interface IHiddenDomainUpdate {
        liveStreamViewURL?: string;
        mode?: string;
        sessionID?: string;
    }
    /**
     * Parses the presence update of the focus and returns an object with the
     * statuses related to recording.
     *
     * @param {Element} presence - An XMPP presence update.
     * @returns {Optional<Object>} The current presence values related to recording.
     */
    export function getFocusRecordingUpdate(presence: Element): Optional<IFocusRecordingUpdate>;
    /**
     * Parses the presence update from a hidden domain participant and returns
     * an object with the statuses related to recording.
     *
     * @param {Element} presence - An XMPP presence update.
     * @returns {Object} The current presence values related to recording.
     */
    export function getHiddenDomainUpdate(presence: Element): IHiddenDomainUpdate;
    /**
     * Returns the recording session ID from a successful IQ.
     *
     * @param {Element} response - The response from the IQ.
     * @returns {string} The session ID of the recording session.
     */
    export function getSessionIdFromIq(response: Element): Nullable<string>;
    /**
     * Returns the recording session ID from a presence, if it exists.
     *
     * @param {Element} presence - An XMPP presence update.
     * @returns {string|null|undefined} The session ID of the recording session.
     */
    export function getSessionId(presence: Element): Optional<Nullable<string>>;
    /**
     * Returns whether or not a presence is from the focus.
     *
     * @param {Element} presence - An XMPP presence update.
     * @returns {boolean} True if the presence is from the focus.
     */
    export function isFromFocus(presence: Element): boolean;
}
declare module "modules/recording/JibriSession" {
    import JitsiParticipant from "JitsiParticipant";
    import XmppConnection from "modules/xmpp/XmppConnection";
    export interface IJibriSessionOptions {
        connection?: XmppConnection;
        focusMucJid?: string;
        mode?: string;
        sessionID?: string;
        status?: string;
    }
    export interface IStartOptions {
        appData?: string;
        broadcastId?: string;
        focusMucJid: string;
        streamId?: string;
    }
    export interface IStopOptions {
        connection?: XmppConnection;
        focusMucJid: string;
        mode?: string;
    }
    export interface IQOptions {
        action?: 'start' | 'stop';
        appData?: string;
        broadcastId?: string;
        focusMucJid: string;
        mode?: string;
        streamId?: string;
    }
    /**
     * Represents a recording session.
     */
    export default class JibriSession {
        private _connection?;
        private _mode?;
        private _jibriJid;
        private _statusFromJicofo;
        private _sessionID?;
        private _status?;
        private _error?;
        private _liveStreamViewURL?;
        private _initiator?;
        private _terminator?;
        private _focusMucJid?;
        /**
         * Initializes a new JibriSession instance.
         *
         * @constructor
         */
        constructor(options?: IJibriSessionOptions);
        /**
         * Returns the error related to the session instance, if any.
         *
         * @returns {Optional<string>}
         */
        getError(): Optional<string>;
        /**
         * Returns the session ID of the session instance.
         *
         * @returns {Optional<string>}
         */
        getID(): Optional<string>;
        /**
         * Returns the initiator of the session instance.
         *
         * @returns {JitsiParticipant|string} The participant that started the session.
         */
        getInitiator(): JitsiParticipant | string;
        /**
         * Returns the streaming URL of the session.
         *
         * @returns {Optional<string>}
         */
        getLiveStreamViewURL(): Optional<string>;
        /**
         * Returns the current status of the session.
         *
         * @returns {Optional<string>}
         */
        getStatus(): Optional<string>;
        /**
         * @returns {Optional<string>}
         */
        getJibriJid(): Optional<string>;
        /**
         * Returns the jid of the participant that stopped the session.
         *
         * @returns {JitsiParticipant|string} The participant that stopped the session.
         */
        getTerminator(): JitsiParticipant | string;
        /**
         * Returns the current recording mode of the session, such as "file".
         *
         * @returns {string}
         */
        getMode(): string;
        /**
         * Sets the last known error message related to the session.
         *
         * @param {string} error - The error string explaining why the session
         * entered an error state.
         * @returns {void}
         */
        setError(error: string): void;
        /**
         * Sets the last live stream URL for the session instance. Usually this is
         * a YouTube URL and usually this is only set for "stream" sessions.
         *
         * @param {string} url - The live stream URL associated with the session.
         * @returns {void}
         */
        setLiveStreamViewURL(url: string): void;
        /**
         * Sets the last known status for this recording session.
         *
         * @param {string} status - The new status to set.
         * @returns {void}
         */
        setStatus(status?: string): void;
        /**
         * Set the session status reported by jicofo. If a jibri is present in the room,
         * the status is always 'on'. Otherwise, we fallback to the status reported by jicofo.
         *
         * @param {string} status
         */
        setStatusFromJicofo(status: string): void;
        /**
         * Set the JID of the jibri associated with this session.
         *
         * @param {*} jibriJid
         */
        setJibriJid(jibriJid: Nullable<string>): void;
        /**
         * Sets the participant that started the session.
         * @param {JitsiParticipant | string} participant - The participant or resource id
         * if local participant.
         */
        setInitiator(participant: JitsiParticipant | string): void;
        /**
         * Sets the participant that stopped the session.
         * @param {JitsiParticipant | string} participant - The participant or the resource id
         * if local participant.
         */
        setTerminator(participant: JitsiParticipant | string): void;
        /**
         * Sends a message to start the actual recording.
         *
         * @param {Object} options - Additional arguments for starting therecording.
         * @param {string} [options.appData] - Data specific to the app/service that the result file will be uploaded.
         * @param {string} [options.broadcastId] - The broadcast ID of an associated YouTube stream, used for knowing the
         * URL from which the stream can be viewed.
         * @param {string} options.focusMucJid - The JID of the focus participant that controls recording.
         * @param {streamId} options.streamId - Necessary for live streaming, this is the stream key needed to start a live
         * streaming session with the streaming service provider.
         * @returns Promise
         */
        start({ appData, broadcastId, focusMucJid, streamId }: IStartOptions): Promise<void>;
        /**
         * Sends a message to actually stop the recording session.
         *
         * @param {Object} options - Additional arguments for stopping the recording.
         * @param {XmppConnection} [options.connection] - The XMPP connection to use.
         * @param {Object} options.focusMucJid - The JID of the focus participant that controls recording.
         * @param {string} [options.mode] - The recording mode of the session.
         * @returns Promise
         */
        static stop({ connection, focusMucJid, mode }: IStopOptions): Promise<any>;
        /**
         * Generates the message to change the status of the recording session.
         *
         * @param {string} [options.action] - The action to set the IQ
         * @param {string} [options.appData] - Data specific to the app/service that
         * the result file will be uploaded.
         * @param {string} [options.broadcastId] - The broadcast ID of an
         * associated YouTube stream, used for knowing the URL from which the stream
         * can be viewed.
         * @param {string} options.focusMucJid - The JID of the focus participant
         * that controls recording.
         * @param {string} options.mode - The recording mode for the session we create this IQ for.
         * @param {streamId} options.streamId - Necessary for live streaming, this
         * is the stream key needed to start a live streaming session with the
         * streaming service provider.
         * @returns Object - The XMPP IQ message.
         */
        static _createIQ({ action, appData, broadcastId, focusMucJid, mode, streamId }: IQOptions): any;
        /**
         * Handles the error from an iq and stores the error.
         *
         * @param {Node} errorIq - The error response from an Iq.
         * @private
         * @returns {void}
         */
        _setErrorFromIq(errorIq: any): void;
        /**
         * Sets the known session ID for this recording session.
         *
         * @param {string} sessionID
         * @private
         * @returns {void}
         */
        _setSessionID(sessionID?: string): void;
    }
}
declare module "modules/statistics/constants" {
    /**
     * The number of remote speakers for which the audio levels will be calculated using
     * RTCRtpReceiver#getSynchronizationSources. Limit the number of endpoints to save cpu on the client as this API call
     * is known to take longer to execute when there are many audio receivers.
     */
    export const SPEAKERS_AUDIO_LEVELS: number;
}
declare module "JitsiConferenceEventManager" {
    import JitsiConference from "JitsiConference";
    /**
     * Setups all event listeners related to conference
     */
    export default class JitsiConferenceEventManager {
        private conference;
        private xmppListeners;
        private chatRoomForwarder?;
        /**
         * Setups all event listeners related to conference
         * @param conference {JitsiConference} the conference
         */
        constructor(conference: JitsiConference);
        /**
         * Add XMPP listener and save its reference for remove on leave conference.
         * @param {string} eventName - The event name.
         * @param {Function} listener - The listener function.
         * @private
         */
        private _addConferenceXMPPListener;
        /**
         * Setups event listeners related to conference.chatRoom
         */
        setupChatRoomListeners(): void;
        /**
         * Setups event listeners related to conference.rtc
         */
        setupRTCListeners(): void;
        /**
         * Setups event listeners related to conference.statistics
         */
        setupStatisticsListeners(): void;
        /**
         * Setups event listeners related to conference.xmpp
         */
        setupXMPPListeners(): void;
        /**
         * Removes event listeners related to conference.xmpp
         */
        removeXMPPListeners(): void;
    }
}
declare module "service/connectivity/ConnectionQualityEvents" {
    export enum ConnectionQualityEvents {
        /**
         * Indicates that the local connection statistics were updated.
         */
        LOCAL_STATS_UPDATED = "cq.local_stats_updated",
        /**
         * Indicates that the connection statistics for a particular remote participant
         * were updated.
         */
        REMOTE_STATS_UPDATED = "cq.remote_stats_updated"
    }
}
declare module "modules/connectivity/ConnectionQuality" {
    import JitsiConference, { IConferenceOptions } from "JitsiConference";
    import EventEmitter from "modules/util/EventEmitter";
    export interface ILocalStats {
        bandwidth?: {
            download?: number;
            upload?: number;
        };
        bitrate?: {
            upload: number;
        };
        bridgeCount?: number;
        connectionQuality: number;
        jvbRTT?: number;
        maxEnabledResolution?: {
            height: number;
            width: number;
        };
        packetLoss?: {
            upload?: number;
        };
        serverRegion?: string;
    }
    export type IRemoteStats = Pick<ILocalStats, 'bitrate' | 'connectionQuality' | 'jvbRTT' | 'maxEnabledResolution' | 'packetLoss' | 'serverRegion'>;
    /**
     * A class which monitors the local statistics coming from the RTC modules, and
     * calculates a "connection quality" value, in percent, for the media
     * connection. A value of 100% indicates a very good network connection, and a
     * value of 0% indicates a poor connection.
     */
    export default class ConnectionQuality {
        private eventEmitter;
        private _conference;
        private _localStats;
        private _lastConnectionQualityUpdate;
        private _options;
        private _remoteStats;
        private _timeIceConnected;
        private _timeVideoUnmuted;
        /**
         *
         * @param conference
         * @param eventEmitter
         * @param options
         */
        constructor(conference: JitsiConference, eventEmitter: EventEmitter, options: IConferenceOptions);
        /**
         * Broadcasts the local statistics to all other participants in the
         * conference.
         */
        private _broadcastLocalStats;
        /**
         * Calculates a new "connection quality" value.
         * @param videoType {VideoType} the type of the video source (camera or a screen capture).
         * @param isMuted {boolean} whether the local video is muted.
         * @param resolutionName {Resolution} the input resolution used by the camera.
         * @returns {*} the newly calculated connection quality.
         */
        private _calculateConnectionQuality;
        /**
         * Sets _timeVideoUnmuted if it was previously unset. If it was already set,
         * doesn't change it.
         */
        private _maybeUpdateUnmuteTime;
        /**
         * Resets the time video was unmuted and triggers a new ramp-up.
         *
         * @private
         * @returns {void}
         */
        private _resetVideoUnmuteTime;
        /**
         * Updates the localConnectionQuality value
         * @param values {number} the new value. Should be in [0, 100].
         */
        private _updateLocalConnectionQuality;
        /**
         * Updates the local statistics
         * @param {TraceablePeerConnection} tpc the peerconnection which emitted
         * the stats
         * @param data new statistics
         */
        private _updateLocalStats;
        /**
         * Updates remote statistics
         * @param id the id of the remote participant
         * @param data the statistics received
         */
        private _updateRemoteStats;
        /**
         * Returns the local statistics.
         * Exported only for use in jitsi-meet-torture.
         */
        getStats(): ILocalStats;
    }
}
declare module "modules/connectivity/IceFailedHandling" {
    import JitsiConference from "JitsiConference";
    /**
     * This class deals with shenanigans around JVB media session's ICE failed status handling.
     *
     * If ICE connection is not re-established within 2 secs after the internet comes back online, the client will initiate
     * a session restart via 'session-terminate'. This results in Jicofo re-inviting the participant into the conference by
     * recreating the jvb media session so that there is minimla disruption to the user by default.
     */
    export default class IceFailedHandling {
        private _conference;
        private _canceled;
        private _iceFailedTimeout?;
        /**
         * Creates new {@code DelayedIceFailed} task.
         * @param {JitsiConference} conference
         */
        constructor(conference: JitsiConference);
        /**
         * After making sure there's no way for the ICE connection to recover this method either sends ICE failed
         * notification to Jicofo or emits the ice failed conference event.
         * @private
         * @returns {void}
         */
        _actOnIceFailed(): void;
        /**
         * Starts the task.
         * @returns {void}
         */
        start(): void;
        /**
         * Cancels the task.
         * @returns {void}
         */
        cancel(): void;
    }
}
declare module "modules/detection/NoAudioSignalDetection" {
    import type JitsiConference from "JitsiConference";
    import EventEmitter from "modules/util/EventEmitter";
    /**
     * Detect if there is no audio input on the current TraceAblePeerConnection selected track. The no audio
     * state must be constant for a configured amount of time in order for the event to be triggered.
     * @fires DetectionEvents.AUDIO_INPUT_STATE_CHANGE
     * @fires DetectionEvents.NO_AUDIO_INPUT
     */
    export default class NoAudioSignalDetection extends EventEmitter {
        private _conference;
        private _timeoutTrigger;
        private _hasAudioInput;
        private _audioTrack;
        private _eventFired;
        /**
         * Creates new NoAudioSignalDetection.
         *
         * @param conference the JitsiConference instance that created us.
         * @constructor
         */
        constructor(conference: JitsiConference);
        /**
         * Clear the timeout state.
         */
        private _clearTriggerTimeout;
        /**
         * Generated event triggered by a change in the current conference audio input state.
         *
         * @param {number} audioLevel - The audio level of the ssrc.
         * @fires DetectionEvents.AUDIO_INPUT_STATE_CHANGE
         */
        private _handleAudioInputStateChange;
        /**
         * Generate event triggered by a prolonged period of no audio input.
         *
         * @param {number} audioLevel - The audio level of the ssrc.
         * @fires DetectionEvents.NO_AUDIO_INPUT
         */
        private _handleNoAudioInputDetection;
        /**
         * Receives audio level events for all send and receive streams on the current TraceablePeerConnection.
         *
         * @param {TraceablePeerConnection} tpc - TraceablePeerConnection of the owning conference.
         * @param {number} ssrc - The synchronization source identifier (SSRC) of the endpoint/participant/stream
         * being reported.
         * @param {number} audioLevel - The audio level of the ssrc.
         * @param {boolean} isLocal - true for local/send streams or false for remote/receive streams.
         */
        private _audioLevel;
        /**
         * Notifies NoAudioSignalDetection that a JitsiTrack was added to the associated JitsiConference.
         * Only take into account local audio tracks.
         *
         * @param {JitsiTrack} track - The added JitsiTrack.
         */
        private _trackAdded;
    }
}
declare module "modules/detection/P2PDominantSpeakerDetection" {
    import JitsiConference from "JitsiConference";
    /**
     * The <tt>P2PDominantSpeakerDetection</tt> is activated only when p2p is
     * currently used.
     * Listens for changes in the audio level changes of the local p2p audio track
     * or remote p2p one and fires dominant speaker events to be able to use
     * features depending on those events (speaker stats), to make them work without
     * the video bridge.
     */
    export default class P2PDominantSpeakerDetection {
        private conference;
        private myUserID;
        /**
         * Creates P2PDominantSpeakerDetection
         * @param conference the JitsiConference instance that created us.
         * @constructor
         */
        constructor(conference: JitsiConference);
        /**
         * Receives audio level events for all streams in the conference.
         *
         * @param {String} id - The participant id
         * @param {number} audioLevel - The audio level.
         */
        private _audioLevel;
    }
}
declare module "modules/detection/VADNoiseDetection" {
    import EventEmitter from "modules/util/EventEmitter";
    import { IVADScore } from "modules/detection/VADAudioAnalyser";
    /**
     * Detect if provided VAD score and PCM data is considered noise.
     */
    export default class VADNoiseDetection extends EventEmitter {
        /**
         * Flag which denotes the current state of the detection service i.e.if there is already a processing operation
         * ongoing.
         */
        private _processing;
        /**
         * Buffer that keeps the VAD scores for a period of time.
         */
        private _scoreArray;
        /**
         * Buffer that keeps audio level samples for a period of time.
         */
        private _audioLvlArray;
        /**
         * Current state of the service, if it's not active no processing will occur.
         */
        private _active;
        /**
         * Timeout reference for processing VAD scores.
         */
        private _processTimeout?;
        /**
         * Creates <tt>VADNoiseDetection</tt>
         *
         * @constructor
         */
        constructor();
        /**
         * Compute cumulative VAD score and PCM audio levels once the PROCESS_TIME_FRAME_SPAN_MS timeout has elapsed.
         * If the score is above the set threshold fire the event.
         * @returns {void}
         * @fires VAD_NOISY_DEVICE
         */
        private _calculateNoisyScore;
        /**
         * Set the active state of the detection service and notify any listeners.
         *
         * @param {boolean} active
         * @fires DETECTOR_STATE_CHANGE
         */
        private _setActiveState;
        /**
         * Record the vad score and average volume in the appropriate buffers.
         *
         * @param {number} vadScore
         * @param {number} avgAudioLvl - average audio level of the PCM sample associated with the VAD score.s
         */
        private _recordValues;
        /**
         * Change the state according to the muted status of the tracked device.
         *
         * @param {boolean} isMuted - Is the device muted or not.
         */
        changeMuteState(isMuted: boolean): void;
        /**
         * Check whether or not the service is active or not.
         *
         * @returns {boolean}
         */
        isActive(): boolean;
        /**
         * Listens for {@link TrackVADEmitter} events and processes them.
         *
         * @param {Object} vadScore -VAD score emitted by {@link TrackVADEmitter}
         * @param {number}   vadScore.timestamp - Exact time at which processed PCM sample was generated.
         * @param {number} vadScore.score - VAD score on a scale from 0 to 1 (i.e. 0.7)
         * @param {Float32Array} vadScore.pcmData - Raw PCM Data associated with the VAD score.
         * @param {string} vadScore.deviceId - Device id of the associated track.
         * @listens VAD_SCORE_PUBLISHED
         */
        processVADScore(vadScore: IVADScore): void;
        /**
         * Reset the processing context, clear buffers, cancel the timeout trigger.
         *
         * @returns {void}
         */
        reset(): void;
    }
}
declare module "modules/detection/VADTalkMutedDetection" {
    import EventEmitter from "modules/util/EventEmitter";
    export interface IVADScore {
        deviceId: string;
        score: number;
        timestamp: number;
    }
    /**
     * Detect if provided VAD score which is generated on a muted device is voice and fires an event.
     */
    export default class VADTalkMutedDetection extends EventEmitter {
        private _processing;
        private _scoreArray;
        private _active;
        private _processTimeout?;
        /**
         * Creates <tt>VADTalkMutedDetection</tt>
         * @constructor
         */
        constructor();
        /**
         * Compute cumulative VAD score function called once the PROCESS_TIME_FRAME_SPAN_MS timeout has elapsed.
         * @returns {void}
         * @fires VAD_TALK_WHILE_MUTED
         */
        private _calculateVADScore;
        /**
         * Set the active state of the detection service and notify any listeners.
         *
         * @param {boolean} active
         * @fires DETECTOR_STATE_CHANGE
         */
        private _setActiveState;
        /**
         * Change the state according to the muted status of the tracked device.
         *
         * @param {boolean} isMuted - Is the device muted or not.
         */
        changeMuteState(isMuted: boolean): void;
        /**
         * Check whether or not the service is active or not.
         *
         * @returns {boolean}
         */
        isActive(): boolean;
        /**
         * Listens for {@link TrackVADEmitter} events and processes them.
         *
         * @param {Object} vadScore -VAD score emitted by {@link TrackVADEmitter}
         * @param {number}   vadScore.timestamp - Exact time at which processed PCM sample was generated.
         * @param {number} vadScore.score - VAD score on a scale from 0 to 1 (i.e. 0.7)
         * @param {string} vadScore.deviceId - Device id of the associated track.
         * @listens VAD_SCORE_PUBLISHED
         */
        processVADScore(vadScore: IVADScore): void;
        /**
         * Reset the processing context, clear buffer, cancel the timeout trigger.
         *
         * @returns {void}
         */
        reset(): void;
    }
}
declare module "service/e2eping/E2ePingEvents" {
    export enum E2ePingEvents {
        /**
         * Indicates that the end-to-end round-trip-time for a participant has changed.
         */
        E2E_RTT_CHANGED = "e2eping.e2e_rtt_changed"
    }
}
declare module "modules/e2eping/e2eping" {
    import JitsiConference from "JitsiConference";
    import JitsiParticipant from "JitsiParticipant";
    export interface IPingMessage {
        id: number;
        type: string;
    }
    export interface IE2ePingOptions {
        e2eping?: {
            enabled?: boolean;
            maxConferenceSize?: number;
            maxMessagesPerSecond?: number;
            numRequests?: number;
        };
    }
    export interface IRequest {
        id: number;
        rtt?: number;
        timeSent: number;
    }
    /**
     * Saves e2e ping related state for a single JitsiParticipant.
     */
    class ParticipantWrapper {
        participant: JitsiParticipant;
        e2eping: E2ePing;
        id: string;
        requests: {
            [key: number]: IRequest;
        };
        lastRequestId: number;
        timeout: Nullable<number>;
        /**
         * Creates a ParticipantWrapper
         * @param {JitsiParticipant} participant - The remote participant that this
         * object wraps.
         * @param {E2ePing} e2eping
         */
        constructor(participant: JitsiParticipant, e2eping: E2ePing);
        /**
         * Schedule the next ping to be sent.
         */
        scheduleNext(): number;
        /**
         * Stop pinging this participant, canceling a scheduled ping, if any.
         */
        stop(): void;
        /**
         * Get the delay until the next ping in milliseconds.
         */
        getDelay(): number;
        /**
         * Sends the next ping request.
         * @type {*}
         */
        sendRequest(): void;
        /**
         * Handles a response from this participant.
         * @type {*}
         */
        handleResponse(response: any): void;
        /**
         * Check if we've received the pre-configured number of responses, and if
         * so log the measured RTT and stop sending requests.
         * @type {*}
         */
        maybeLogRttAndStop(): void;
    }
    /**
     * Implements end-to-end ping (from one conference participant to another) via
     * the jitsi-videobridge channel (either WebRTC data channel or web socket).
     *
     * TODO: use a broadcast message instead of individual pings to each remote
     * participant.
     *
     * This class:
     * 1. Sends periodic ping requests to all other participants in the
     * conference.
     * 2. Responds to ping requests from other participants.
     * 3. Fires events with the end-to-end RTT to each participant whenever a
     * response is received.
     * 4. Fires analytics events with the end-to-end RTT periodically.
     */
    export default class E2ePing {
        conference: JitsiConference;
        eventEmitter: any;
        sendMessage: (message: IPingMessage, participantId: string) => void;
        participants: {
            [key: string]: ParticipantWrapper;
        };
        numRequests: number;
        maxConferenceSize: number;
        maxMessagesPerSecond: number;
        /**
         * @param {JitsiConference} conference - The conference.
         * @param {Function} sendMessage - The function to use to send a message.
         * @param {Object} options
         */
        constructor(conference: JitsiConference, options: IE2ePingOptions, sendMessage: (message: IPingMessage, participantId: string) => void);
        /**
         * Delay processing USER_JOINED events until the MUC is fully joined,
         * otherwise the apparent conference size will be wrong.
         */
        conferenceJoined(): void;
        /**
         * Handles a message that was received.
         *
         * @param participant - The message sender.
         * @param payload - The payload of the message.
         */
        messageReceived(participant: JitsiParticipant, payload: IPingMessage): void;
        /**
         * Handles a participant joining the conference. Starts to send ping
         * requests to the participant.
         *
         * @param {String} id - The ID of the participant.
         * @param {JitsiParticipant} participant - The participant that joined.
         */
        participantJoined(id: string, participant: JitsiParticipant): void;
        /**
         * Remove a participant without calling "stop".
         */
        removeParticipant(id: string): void;
        /**
         * Handles a participant leaving the conference. Stops sending requests.
         *
         * @param {String} id - The ID of the participant.
         */
        participantLeft(id: string): void;
        /**
         * Handles a ping request coming from another participant.
         *
         * @param {string} participantId - The ID of the participant who sent the
         * request.
         * @param {Object} request - The request.
         */
        handleRequest(participantId: string, request: {
            id: number;
        }): void;
        /**
         * Handles a ping response coming from another participant
         * @param {string} participantId - The ID of the participant who sent the
         * response.
         * @param {Object} response - The response.
         */
        handleResponse(participantId: string, response: {
            id: number;
        }): void;
        /**
         * Stops this E2ePing (i.e. stop sending requests).
         */
        stop(): void;
    }
}
declare module "modules/litemode/LiteModeContext" {
    import JitsiConference from "JitsiConference";
    /**
     * This module implements a discard-all insertable stream.  Use to reduce decoder CPU load for testing.
     */
    export class LiteModeContext {
        private enabled;
        /**
         * A constructor.
         * @param {JitsiConference} conference - The conference instance for which lite mode is to be enabled.
         */
        constructor(conference: JitsiConference);
        /**
         * Setup Lite Mode for a track.
         *
         * @private
         */
        private _setupLiteModeForTrack;
    }
}
declare module "modules/recording/RecordingManager" {
    import ChatRoom from "modules/xmpp/ChatRoom";
    import JibriSession from "modules/recording/JibriSession";
    export interface IRecordingOptions {
        appData?: string;
        broadcastId?: string;
        mode: string;
        streamId?: string;
    }
    /**
     * A class responsible for starting and stopping recording sessions and emitting
     * state updates for them.
     */
    class RecordingManager {
        private _sessions;
        private _chatRoom;
        /**
         * Initialize {@code RecordingManager} with other objects that are necessary
         * for starting a recording.
         *
         * @param {ChatRoom} chatRoom - The chat room to handle.
         * @returns {void}
         */
        constructor(chatRoom: ChatRoom);
        /**
         * Finds an existing recording session by session ID.
         *
         * @param {string} sessionID - The session ID associated with the recording.
         * @returns {Optional<JibriSession>}
         */
        getSession(sessionID: string): Optional<JibriSession>;
        /**
         * Find a session with a specific jibri JID.
         *
         * @param {string} jibriJid the JID to search for.
         * @returns
         */
        getSessionByJibriJid(jibriJid: string): Optional<JibriSession>;
        /**
         * Callback to invoke to parse through a presence update to find recording
         * related updates (from Jibri participant doing the recording and the
         * focus which controls recording).
         *
         * @param {Object} event - The presence data from the pubsub event.
         * @param {Element} event.presence - An XMPP presence update.
         * @param {boolean} event.fromHiddenDomain - Whether or not the update comes
         * from a participant that is trusted but not visible, as would be the case
         * with the Jibri recorder participant.
         * @returns {void}
         */
        onPresence({ fromHiddenDomain, presence }: {
            fromHiddenDomain: boolean;
            presence: Element;
        }): void;
        /**
         * Handle a participant leaving the room.
         * @param {string} jid the JID of the participant that left.
         */
        onMemberLeft(jid: string): void;
        /**
         * Start a recording session.
         *
         * @param {Object} options - Configuration for the recording.
         * @param {string} [options.appData] - Data specific to the app/service that
         * the result file will be uploaded.
         * @param {string} [optional] options.broadcastId - The channel on which a
         * live stream will occur.
         * @param {string} options.mode - The mode in which recording should be
         * started. Recognized values are "file" and "stream".
         * @param {string} [optional] options.streamId - The stream key to be used
         * for live stream broadcasting. Required for live streaming.
         * @returns {Promise} A promise for starting a recording, which will pass
         * back the session on success. The promise resolves after receiving an
         * acknowledgment of the start request success or fail.
         */
        startRecording(options: IRecordingOptions): Promise<JibriSession>;
        /**
         * Stop a recording session.
         *
         * @param {string} sessionID - The ID associated with the recording session
         * to be stopped.
         * @returns {Promise} The promise resolves after receiving an
         * acknowledgment of the stop request success or fail.
         */
        stopRecording(sessionID: string): Promise<any>;
        /**
         * Stores a reference to the passed in JibriSession.
         *
         * @param {string} session - The JibriSession instance to store.
         * @returns {void}
         */
        _addSession(session: JibriSession): void;
        /**
         * Create a new instance of a recording session and stores a reference to
         * it.
         *
         * @param {string} sessionID - The session ID of the recording in progress.
         * @param {string} status - The current status of the recording session.
         * @param {string} mode - The recording mode of the session.
         * @returns {JibriSession}
         */
        _createSession(sessionID: string, status: string, mode: string): JibriSession;
        /**
         * Notifies listeners of an update to a recording session.
         *
         * @param {JibriSession} session - The session that has been updated.
         * @param {string|undefined} initiator - The jid of the initiator of the update.
         */
        _emitSessionUpdate(session: JibriSession, initiator?: string): void;
        /**
         * Parses presence to update an existing JibriSession or to create a new
         * JibriSession.
         *
         * @param {Element} presence - An XMPP presence update.
         * @returns {void}
         */
        _handleFocusPresence(presence: Element): void;
        /**
         * Handles updates from the Jibri which can broadcast a YouTube URL that
         * needs to be updated in a JibriSession.
         *
         * @param {Element} presence - An XMPP presence update.
         * @returns {void}
         */
        _handleJibriPresence(presence: Element): void;
    }
    export default RecordingManager;
}
declare module "modules/statistics/AvgRTPStatsReporter" {
    import JitsiConference from "JitsiConference";
    import JingleSession from "modules/xmpp/JingleSession";
    /**
     * This will calculate an average for one, named stat and submit it to
     * the analytics module when requested. It automatically counts the samples.
     */
    class AverageStatReport {
        private _name;
        private _count;
        private _sum;
        private _samples;
        /**
         * Creates new <tt>AverageStatReport</tt> for given name.
         * @param {string} name that's the name of the event that will be reported
         * to the analytics module.
         */
        constructor(name: string);
        /**
         * Adds the next value that will be included in the average when
         * {@link calculate} is called.
         * @param {Optional<number>} nextValue
         */
        addNext(nextValue: Optional<number>): void;
        /**
         * Calculates an average for the samples collected using {@link addNext}.
         * @return {number|NaN} an average of all collected samples or <tt>NaN</tt>
         * if no samples were collected.
         */
        calculate(): number;
        /**
         * Appends the report to the analytics "data" object. The object will be
         * set under <tt>prefix</tt> + {@link this.name} key.
         * @param {Object} report the analytics "data" object
         */
        appendReport(report: Record<string, unknown>): void;
        /**
         * Clears all memory of any samples collected, so that new average can be
         * calculated using this instance.
         */
        reset(): void;
    }
    /**
     * Class gathers the stats that are calculated and reported for a
     * {@link TraceablePeerConnection} even if it's not currently active. For
     * example we want to monitor RTT for the JVB connection while in P2P mode.
     */
    class ConnectionAvgStats {
        private _n;
        private _sampleIdx;
        private _avgRTT;
        private _avgRemoteRTTMap;
        private _avgRtpStatsReporter;
        private _avgEnd2EndRTT;
        private _onConnectionStats;
        private _onUserLeft?;
        private _onRemoteStatsUpdated?;
        isP2P: boolean;
        /**
         * Creates new <tt>ConnectionAvgStats</tt>
         * @param {AvgRTPStatsReporter} avgRtpStatsReporter
         * @param {boolean} isP2P
         * @param {number} n the number of samples, before arithmetic mean is to be
         * calculated and values submitted to the analytics module.
         */
        constructor(avgRtpStatsReporter: AvgRTPStatsReporter, isP2P: boolean, n: number);
        /**
         * Processes next batch of stats.
         * @param {go figure} data
         * @private
         */
        private _calculateAvgStats;
        /**
         * Calculates arithmetic mean of all RTTs towards the JVB reported by
         * participants.
         * @return {number|NaN} NaN if not available (not enough data)
         * @private
         */
        private _calculateAvgRemoteRTT;
        /**
         * Processes {@link ConnectionQualityEvents.REMOTE_STATS_UPDATED} to analyse
         * RTT towards the JVB reported by each participant.
         * @param {string} id {@link JitsiParticipant.getId}
         * @param {go figure in ConnectionQuality.js} data
         * @private
         */
        private _processRemoteStats;
        /**
         *
         */
        dispose(): void;
    }
    /**
     * Reports average RTP statistics values (arithmetic mean) to the analytics
     * module for things like bit rate, bandwidth, packet loss etc. It keeps track
     * of the P2P vs JVB conference modes and submits the values under different
     * namespaces (the events for P2P mode have 'p2p.' prefix). Every switch between
     * P2P mode resets the data collected so far and averages are calculated from
     * scratch.
     */
    export default class AvgRTPStatsReporter {
        _n: number;
        _sampleIdx: number;
        _conference: JitsiConference;
        _avgAudioBitrateUp: AverageStatReport;
        _avgAudioBitrateDown: AverageStatReport;
        _avgVideoBitrateUp: AverageStatReport;
        _avgVideoBitrateDown: AverageStatReport;
        _avgBandwidthUp: AverageStatReport;
        _avgBandwidthDown: AverageStatReport;
        _avgPacketLossTotal: AverageStatReport;
        _avgPacketLossUp: AverageStatReport;
        _avgPacketLossDown: AverageStatReport;
        _avgRemoteFPS: AverageStatReport;
        _avgRemoteScreenFPS: AverageStatReport;
        _avgLocalFPS: AverageStatReport;
        _avgLocalScreenFPS: AverageStatReport;
        _avgRemoteCameraPixels: AverageStatReport;
        _avgRemoteScreenPixels: AverageStatReport;
        _avgLocalCameraPixels: AverageStatReport;
        _avgLocalScreenPixels: AverageStatReport;
        _avgCQ: AverageStatReport;
        _cachedTransportStats: Optional<Record<string, unknown>>;
        _onLocalStatsUpdated: (data: any) => void;
        _onP2PStatusChanged: () => void;
        _onJvb121StatusChanged: (activeSession: JingleSession) => void;
        jvbStatsMonitor: ConnectionAvgStats;
        p2pStatsMonitor: ConnectionAvgStats;
        /**
         * Creates new instance of <tt>AvgRTPStatsReporter</tt>
         * @param {JitsiConference} conference
         * @param {number} n the number of samples, before arithmetic mean is to be
         * calculated and values submitted to the analytics module.
         */
        constructor(conference: JitsiConference, n: number);
        /**
         * Processes next batch of stats reported on
         * {@link ConnectionQualityEvents.LOCAL_STATS_UPDATED}.
         * @param {*} data
         * @private
         */
        private _calculateAvgStats;
        /**
         * Calculates average number of pixels for the report
         *
         * @param {map} peerResolutions a map of peer resolutions
         * @param {boolean} isLocal if the average is to be calculated for the local
         * video or <tt>false</tt> if for remote videos.
         * @param {VideoType} videoType
         * @return {number|NaN} average number of pixels or <tt>NaN</tt> if there
         * are no samples.
         * @private
         */
        private _calculateAvgVideoPixels;
        /**
         * Calculate average pixels for either remote or local participant
         * @param {object} videos maps resolution per video SSRC
         * @param {JitsiParticipant|null} participant remote participant or
         * <tt>null</tt> for local video pixels calculation.
         * @param {VideoType} videoType the type of the video for which an average
         * will be calculated.
         * @return {number|NaN} average video pixels of all participant's videos or
         * <tt>NaN</tt> if currently not available
         * @private
         */
        private _calculatePeerAvgVideoPixels;
        /**
         * Calculates average FPS for the report
         * @param {go figure} frameRate
         * @param {boolean} isLocal if the average is to be calculated for the local
         * video or <tt>false</tt> if for remote videos.
         * @param {VideoType} videoType
         * @return {number|NaN} average FPS or <tt>NaN</tt> if there are no samples.
         * @private
         */
        private _calculateAvgVideoFps;
        /**
         * Calculate average FPS for either remote or local participant
         * @param {object} videos maps FPS per video SSRC
         * @param {JitsiParticipant|null} participant remote participant or
         * <tt>null</tt> for local FPS calculation.
         * @param {VideoType} videoType the type of the video for which an average
         * will be calculated.
         * @return {number|NaN} average FPS of all participant's videos or
         * <tt>NaN</tt> if currently not available
         * @private
         */
        private _calculatePeerAvgVideoFps;
        /**
         * Sends the 'transport.stats' analytics event whenever we detect that
         * there is a change in the local or remote candidate type on the transport
         * that is currently selected.
         * @param {*} data
         * @private
         */
        private _maybeSendTransportAnalyticsEvent;
        /**
         * Resets the stats related to JVB connection. Must not be called when in
         * P2P mode, because then the {@link AverageStatReport} instances are
         * tracking P2P stats. Note that this should never happen unless something
         * is wrong with the P2P and JVB121 events.
         * @private
         */
        private _resetAvgJvbStats;
        /**
         * Reset cache of all averages and {@link _sampleIdx}.
         * @private
         */
        private _resetAvgStats;
        /**
         * Unregisters all event listeners and stops working.
         */
        dispose(): void;
    }
}
declare module "modules/statistics/SpeakerStats" {
    /**
     * Interface for face landmarks.
     */
    export interface IFaceLandmarks {
        duration: number;
        faceExpression: string;
    }
    /**
     * A model for keeping track of each user's total
     * time as a dominant speaker. The model also
     * keeps track of the user's last known name
     * in case the user has left the meeting,
     * which is also tracked.
     */
    class SpeakerStats {
        private _userId;
        private displayName;
        private _isLocalStats;
        private totalDominantSpeakerTime;
        private _dominantSpeakerStart;
        private _isDominantSpeaker;
        private _isSilent;
        private _hasLeft;
        private _faceLandmarks;
        /**
         * Initializes a new SpeakerStats instance.
         *
         * @constructor
         * @param {string} userId - The id of the user being tracked.
         * @param {string} displayName - The name of the user being tracked.
         * @param {boolean} isLocalStats - True if the stats model tracks
         * the local user.
         * @returns {void}
         */
        constructor(userId: string, displayName: string, isLocalStats: boolean);
        /**
         * Get the user id being tracked.
         *
         * @returns {string} The user id.
         */
        getUserId(): string;
        /**
         * Get the name of the user being tracked.
         *
         * @returns {string} The user name.
         */
        getDisplayName(): string;
        /**
         * Updates the last known name of the user being tracked.
         *
         * @param {string} newName - The user name.
         * @returns {void}
         */
        setDisplayName(newName: string): void;
        /**
         * Returns true if the stats are tracking the local user.
         *
         * @returns {boolean}
         */
        isLocalStats(): boolean;
        /**
         * Returns true if the tracked user is currently a dominant speaker.
         *
         * @returns {boolean}
         */
        isDominantSpeaker(): boolean;
        /**
         * Returns true if the tracked user is currently a dominant speaker.
         *
         * @param {boolean} isNowDominantSpeaker - If true, the user will be accumulating time
         * as dominant speaker. If false, the user will not accumulate time
         * and will record any time accumulated since starting as dominant speaker.
         * @param {boolean} silence - Indicates whether the dominant speaker is silent or not.
         * @returns {void}
         */
        setDominantSpeaker(isNowDominantSpeaker: boolean, silence: boolean): void;
        /**
         * Get how long the tracked user has been dominant speaker.
         *
         * @returns {number} - The speaker time in milliseconds.
         */
        getTotalDominantSpeakerTime(): number;
        /**
         * Get whether or not the user is still in the meeting.
         *
         * @returns {boolean} True if the user is no longer in the meeting.
         */
        hasLeft(): boolean;
        /**
         * Set the user as having left the meeting.
         *
         * @returns {void}
         */
        markAsHasLeft(): void;
        /**
         * Gets the face landmarks of the user.
         *
         * @returns {IFaceLandmarks[]}
         */
        getFaceLandmarks(): IFaceLandmarks[];
        /**
         * Sets the face landmarks of the user.
         *
         * @param {IFaceLandmarks[]} faceLandmarks - object with face expressions.
         * @returns {void}
         */
        setFaceLandmarks(faceLandmarks: IFaceLandmarks[]): void;
        /**
         * Adds new face landmarks to speaker stats.
         *
         * @param  {IFaceLandmarks} faceLandmarks
         */
        addFaceLandmarks(faceLandmarks: IFaceLandmarks): void;
    }
    export default SpeakerStats;
}
declare module "modules/statistics/SpeakerStatsCollector" {
    import JitsiConference from "JitsiConference";
    import JitsiParticipant from "JitsiParticipant";
    import { type IFaceLandmarks, default as SpeakerStats } from "modules/statistics/SpeakerStats";
    export interface ISpeakerStatsState {
        dominantSpeakerId: Nullable<string>;
        users: {
            [userId: string]: SpeakerStats;
        };
    }
    export interface IFaceLandmarkMessage {
        faceLandmarks: IFaceLandmarks;
        type: string;
    }
    /**
     * A collection for tracking speaker stats. Attaches listeners
     * to the conference to automatically update on tracked events.
     */
    export default class SpeakerStatsCollector {
        stats: ISpeakerStatsState;
        conference: JitsiConference;
        /**
         * Initializes a new SpeakerStatsCollector instance.
         *
         * @constructor
         * @param {JitsiConference} conference - The conference to track.
         * @returns {void}
         */
        constructor(conference: JitsiConference);
        /**
         * Reacts to dominant speaker change events by changing its speaker stats
         * models to reflect the current dominant speaker.
         *
         * @param {string} dominantSpeakerId - The user id of the new dominant speaker.
         * @param {Array[string]} previous - The array with previous speakers.
         * @param {boolean} silence - Indecates whether the dominant speaker is silent or not.
         * @returns {void}
         * @private
         */
        _onDominantSpeaker(dominantSpeakerId: string, previous: string[], silence: boolean): void;
        /**
         * Reacts to user join events by creating a new SpeakerStats model.
         *
         * @param {string} userId - The user id of the new user.
         * @param {JitsiParticipant} - The JitsiParticipant model for the new user.
         * @returns {void}
         * @private
         */
        _onUserJoin(userId: string, participant: JitsiParticipant): void;
        /**
         * Reacts to user leave events by updating the associated user's
         * SpeakerStats model.
         *
         * @param {string} userId - The user id of the user that left.
         * @returns {void}
         * @private
         */
        _onUserLeave(userId: string): void;
        /**
         * Reacts to user name change events by updating the last known name
         * tracked in the associated SpeakerStats model.
         *
         * @param {string} userId - The user id of the user that left.
         * @returns {void}
         * @private
         */
        _onDisplayNameChange(userId: string, newName: string): void;
        /**
         * Processes a new face landmark object of a remote user.
         *
         * @param {string} userId - The user id of the user that left.
         * @param {IFaceLandmarks} data - The face landmark object.
         * @returns {void}
         * @private
         */
        _onFaceLandmarkAdd(userId: string, data: IFaceLandmarks): void;
        /**
         * Return a copy of the tracked SpeakerStats models.
         *
         * @returns {Object} The keys are the user ids and the values are the
         * associated user's SpeakerStats model.
         */
        getStats(): {
            [userId: string]: SpeakerStats;
        };
        /**
         * Updates of the current stats is requested, passing the new values.
         *
         * @param {Object} newStats - The new values used to update current one.
         * @private
         */
        _updateStats(newStats: {
            [userId: string]: any;
        }): void;
    }
}
declare module "modules/version/ComponentsVersions" {
    import JitsiConference from "JitsiConference";
    /**
     * Discovers component versions in a conference.
     */
    export default class ComponentsVersions {
        versions: {
            [key: string]: string;
        };
        conference: JitsiConference;
        /**
         * Creates new instance of <tt>ComponentsVersions</tt> which will be discovering
         * the versions of conferencing system components in given
         * <tt>JitsiConference</tt>.
         * @param conference <tt>JitsiConference</tt> instance which will be used to
         *        listen for focus presence updates.
         * @constructor
         */
        constructor(conference: any);
        /**
         * Processes versions information from presence.
         *
         * @param {*} versions - The versions element.
         * @param {*} mucJid - MUC JID for the sender.
         * @returns {void}
         */
        _processVersions(versions: any, _: any, mucJid: any): void;
        /**
         * Obtains the version of conferencing system component.
         * @param componentName the name of the component for which we want to obtain
         *        the version.
         * @returns {String} which describes the version of the component identified by
         *          given <tt>componentName</tt> or <tt>undefined</tt> if not found.
         */
        getComponentVersion(componentName: any): string;
    }
}
declare module "modules/videosipgw/VideoSIPGWConstants" {
    export enum VideoSIPGWStatusConstants {
        /**
         * Status that video SIP GW service is available.
         */
        STATUS_AVAILABLE = "available",
        /**
         * Status that video SIP GW service is available but there are no free nodes
         * at the moment to serve new requests.
         */
        STATUS_BUSY = "busy",
        /**
         * Status that video SIP GW service is not available.
         */
        STATUS_UNDEFINED = "undefined"
    }
    export enum VideoSIPGWStateConstants {
        /**
         * Video SIP GW session state, tried to start but it failed.
         */
        STATE_FAILED = "failed",
        /**
         * Video SIP GW session state, currently stopped and not running.
         */
        STATE_OFF = "off",
        /**
         * Video SIP GW session state, currently running.
         */
        STATE_ON = "on",
        /**
         * Video SIP GW session state, currently is starting.
         */
        STATE_PENDING = "pending",
        /**
         * Video SIP GW session state, has observed some issues and is retrying at the
         * moment.
         */
        STATE_RETRYING = "retrying"
    }
    export enum VideoSIPGWErrorConstants {
        /**
         * Error on trying to create video SIP GW session in conference where
         * there is no room connection (hasn't joined or has left the room).
         */
        ERROR_NO_CONNECTION = "error_no_connection",
        /**
         * Error on trying to create video SIP GW session with address for which
         * there is an already created session.
         */
        ERROR_SESSION_EXISTS = "error_session_already_exists"
    }
    export const STATUS_AVAILABLE = VideoSIPGWStatusConstants.STATUS_AVAILABLE;
    export const STATUS_UNDEFINED = VideoSIPGWStatusConstants.STATUS_UNDEFINED;
    export const STATUS_BUSY = VideoSIPGWStatusConstants.STATUS_BUSY;
    export const STATE_ON = VideoSIPGWStateConstants.STATE_ON;
    export const STATE_OFF = VideoSIPGWStateConstants.STATE_OFF;
    export const STATE_PENDING = VideoSIPGWStateConstants.STATE_PENDING;
    export const STATE_RETRYING = VideoSIPGWStateConstants.STATE_RETRYING;
    export const STATE_FAILED = VideoSIPGWStateConstants.STATE_FAILED;
    export const ERROR_NO_CONNECTION = VideoSIPGWErrorConstants.ERROR_NO_CONNECTION;
    export const ERROR_SESSION_EXISTS = VideoSIPGWErrorConstants.ERROR_SESSION_EXISTS;
}
declare module "modules/videosipgw/JitsiVideoSIPGWSession" {
    import Listenable from "modules/util/Listenable";
    import ChatRoom from "modules/xmpp/ChatRoom";
    /**
     * Jitsi video SIP GW session. Holding its state and able to start/stop it.
     * When session is in OFF or FAILED stated it cannot be used anymore.
     */
    export default class JitsiVideoSIPGWSession extends Listenable {
        sipAddress: string;
        displayName: string;
        chatRoom: ChatRoom;
        state?: string;
        /**
         * Creates new session with the desired sip address and display name.
         *
         * @param {string} sipAddress - The sip address to use when
         * starting the session.
         * @param {string} displayName - The display name to use for
         * that participant.
         * @param {ChatRoom} chatRoom - The chat room this session is bound to.
         */
        constructor(sipAddress: string, displayName: string, chatRoom: ChatRoom);
        /**
         * Sends a jibri command using an iq.
         *
         * @private
         * @param {string} action - The action to send ('start' or 'stop').
         */
        private _sendJibriIQ;
        /**
         * Stops the current session.
         */
        stop(): void;
        /**
         * Starts a new session. Sends an iq to the focus.
         */
        start(): void;
        /**
         * Changes the state of this session.
         *
         * @param {string} newState - The new {VideoSIPGWConstants} state to set.
         * @param {string} [optional] failureReason - The reason why a failure state
         * was entered.
         * @returns {void}
         */
        setState(newState: string, failureReason?: string): void;
        /**
         * Subscribes the passed listener to the event for state change of this
         * session.
         *
         * @param {EventListener} listener - The function that will receive the event.
         */
        addStateListener(listener: EventListener): void;
        /**
         * Unsubscribes the passed handler.
         *
         * @param {EventListener} listener - The function to be removed.
         */
        removeStateListener(listener: EventListener): void;
    }
}
declare module "modules/videosipgw/VideoSIPGW" {
    import ChatRoom from "modules/xmpp/ChatRoom";
    import JitsiVideoSIPGWSession from "modules/videosipgw/JitsiVideoSIPGWSession";
    export interface ISessionStateChangeEvent {
        address: string;
        displayName?: string;
        newState: string;
        oldState?: string;
    }
    export interface INodeAttributes {
        failure_reason?: string;
        sipaddress?: string;
        state: string;
    }
    /**
     * Main video SIP GW handler. Stores references of all created sessions.
     */
    export default class VideoSIPGW {
        private chatRoom;
        private eventEmitter;
        private sessions;
        private sessionStateChangeListener;
        private state?;
        /**
         * Creates new handler.
         *
         * @param {ChatRoom} chatRoom - Tha chat room to handle.
         */
        constructor(chatRoom: ChatRoom);
        /**
         * Handles presence nodes with name: jibri-sip-call-state.
         *
         * @param {Object} node the presence node Object to handle.
         * Object representing part of the presence received over xmpp.
         */
        handleJibriSIPState(node: {
            attributes?: INodeAttributes;
        }): void;
        /**
         * Creates new session and stores its reference if it does not exist or
         * returns an error otherwise.
         *
         * @param {string} sipAddress - The sip address to use.
         * @param {string} displayName - The display name to use.
         * @returns {JitsiVideoSIPGWSession|Error}
         */
        createVideoSIPGWSession(sipAddress: string, displayName: string): JitsiVideoSIPGWSession | Error;
        /**
         * Listener for session state changed. When a session goes to off or failed
         * we delete its reference.
         *
         * @param {options} event - { address, oldState, newState, displayName }
         */
        sessionStateChanged(event: ISessionStateChangeEvent): void;
    }
}
declare module "JitsiConference" {
    import JitsiConferenceEventManager from "JitsiConferenceEventManager";
    import type JitsiConnection from "JitsiConnection";
    import JitsiParticipant from "JitsiParticipant";
    import type JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import JitsiTrack from "modules/RTC/JitsiTrack";
    import RTC from "modules/RTC/RTC";
    import type TraceablePeerConnection from "modules/RTC/TraceablePeerConnection";
    import ConnectionQuality from "modules/connectivity/ConnectionQuality";
    import P2PDominantSpeakerDetection from "modules/detection/P2PDominantSpeakerDetection";
    import { IVADProcessor } from "modules/detection/VADAudioAnalyser";
    import E2ePing from "modules/e2eping/e2eping";
    import { QualityController } from "modules/qualitycontrol/QualityController";
    import { IReceiverVideoConstraints } from "modules/qualitycontrol/ReceiveVideoController";
    import JibriSession from "modules/recording/JibriSession";
    import RecordingManager, { IRecordingOptions } from "modules/recording/RecordingManager";
    import AvgRTPStatsReporter from "modules/statistics/AvgRTPStatsReporter";
    import SpeakerStats from "modules/statistics/SpeakerStats";
    import SpeakerStatsCollector from "modules/statistics/SpeakerStatsCollector";
    import Statistics from "modules/statistics/statistics";
    import Listenable from "modules/util/Listenable";
    import ComponentsVersions from "modules/version/ComponentsVersions";
    import JitsiVideoSIPGWSession from "modules/videosipgw/JitsiVideoSIPGWSession";
    import VideoSIPGW from "modules/videosipgw/VideoSIPGW";
    import BreakoutRooms from "modules/xmpp/BreakoutRooms";
    import type { ChatRoom, PresenceHandler } from "modules/xmpp/ChatRoom";
    import FileSharing from "modules/xmpp/FileSharing";
    import type JingleSessionPC from "modules/xmpp/JingleSessionPC";
    import Polls from "modules/xmpp/Polls";
    import RoomMetadata from "modules/xmpp/RoomMetadata";
    import { IFaceLandmarksPayload } from "modules/xmpp/xmpp";
    import { MediaType } from "service/RTC/MediaType";
    import { IReceiverAudioSubscriptionMessage } from "service/RTC/ReceiverAudioSubscription";
    export interface IConferenceOptions {
        config: {
            _p2pConnStatusRtcMuteTimeout?: number;
            _peerConnStatusOutOfLastNTimeout?: number;
            _peerConnStatusRtcMuteTimeout?: number;
            analytics?: {
                rtcstatsEnabled?: boolean;
                rtcstatsEndpoint?: string;
            };
            applicationName?: string;
            avgRtpStatsN?: number;
            channelLastN?: number;
            confID?: string;
            createVADProcessor?: () => IVADProcessor;
            deploymentInfo?: {
                userRegion?: string;
            };
            disableAudioLevels?: boolean;
            disableLocalStats?: boolean;
            disableLocalStatsBroadcast?: boolean;
            e2eping?: {
                enabled?: boolean;
            };
            enableNoAudioDetection?: boolean;
            enableNoisyMicDetection?: boolean;
            enableTalkWhileMuted?: boolean;
            hiddenDomain?: string;
            p2p?: {
                backToP2PDelay?: number;
                codecPreferenceOrder?: string[];
                disabledCodec?: string;
                enabled?: boolean;
                mobileCodecPreferenceOrder?: string[];
                mobileScreenshareCodec?: string;
                preferredCodec?: string;
                screenshareCodec?: string;
            };
            pcStatsInterval?: number;
            startAudioMuted?: number;
            startLastN?: number;
            startSilent?: boolean;
            startVideoMuted?: number;
            statisticsDisplayName?: string;
            statisticsId?: string;
            testing?: {
                allowMultipleTracks?: boolean;
                enableAV1ForFF?: boolean;
                enableFirefoxP2p?: boolean;
                forceInitiator?: boolean;
                forceResponder?: boolean;
                lastNRampupTime?: number;
                p2pTestMode?: boolean;
            };
            transcriptionLanguage?: string;
            videoQuality?: {
                codecPreferenceOrder?: string[];
                disabledCodec?: string;
                enableAdaptiveMode?: boolean;
                mobileCodecPreferenceOrder?: string[];
                mobileScreenshareCodec?: string;
                preferredCodec?: string;
                screenshareCodec?: string;
            };
        };
        connection: JitsiConnection;
        customDomain?: string;
        name: string;
    }
    export interface IStartMutedPolicy {
        audio: boolean;
        video: boolean;
    }
    export interface IConferenceProperties {
        'audio-limit-reached'?: string;
        'bridge-count'?: string;
        'video-limit-reached'?: string;
        'visitor-codecs'?: string;
        'visitor-count'?: number;
    }
    export interface IStatisticsOptions {
        aliasName?: string;
        applicationName?: string;
        confID?: string;
        roomName?: string;
        userName?: string;
    }
    export interface IStopSessionOptions {
        reason?: string;
        reasonDescription?: string;
        requestRestart?: boolean;
        sendSessionTerminate?: boolean;
    }
    /**
     * Creates a JitsiConference object with the given name and properties.
     * Note: this constructor is not a part of the public API (objects should be
     * created using JitsiConnection.createConference).
     * @param options.config properties / settings related to the conference that
     * will be created.
     * @param options.name the name of the conference
     * @param options.connection the JitsiConnection object for this
     * JitsiConference.
     * @param {number} [options.config.avgRtpStatsN=15] how many samples are to be
     * collected by `AvgRTPStatsReporter`, before arithmetic mean is
     * calculated and submitted to the analytics module.
     * @param {boolean} [options.config.p2p.enabled] when set to <tt>true</tt>
     * the peer to peer mode will be enabled. It means that when there are only 2
     * participants in the conference an attempt to make direct connection will be
     * made. If the connection succeeds the conference will stop sending data
     * through the JVB connection and will use the direct one instead.
     * @param {number} [options.config.p2p.backToP2PDelay=5] a delay given in
     * seconds, before the conference switches back to P2P, after the 3rd
     * participant has left the room.
     * @param {number} [options.config.channelLastN=-1] The requested amount of
     * videos are going to be delivered after the value is in effect. Set to -1 for
     * unlimited or all available videos.
     *
     * @noInheritDoc
     */
    export default class JitsiConference extends Listenable {
        private _transcribingEnabled?;
        private _visitorCodecs?;
        private _hasVisitors?;
        private _sessionInitiateTimeout?;
        private _desktopSharingFrameRate?;
        private _numberOfParticipantsOnJoin?;
        private _delayedIceFailed?;
        private _audioAnalyser?;
        private _noAudioSignalDetection?;
        private _signalingLayer;
        private _conferenceJoinAnalyticsEventSent?;
        private _e2eEncryption?;
        private _liteModeContext?;
        private _audioSenderLimitReached?;
        private _videoSenderLimitReached?;
        private _firefoxP2pEnabled;
        private _iceRestarts;
        private _unsubscribers;
        private _xmpp;
        options: IConferenceOptions;
        connection: JitsiConnection;
        eventManager: JitsiConferenceEventManager;
        participants: Map<string, JitsiParticipant>;
        componentsVersions: ComponentsVersions;
        jvbJingleSession?: JingleSessionPC;
        lastDominantSpeaker?: string;
        dtmfManager?: object;
        somebodySupportsDTMF: boolean;
        authEnabled: boolean;
        startMutedPolicy: IStartMutedPolicy;
        isMutedByFocus: boolean;
        mutedByFocusActor?: string;
        isVideoMutedByFocus: boolean;
        mutedVideoByFocusActor?: string;
        wasStopped: boolean;
        properties: IConferenceProperties;
        connectionQuality: ConnectionQuality;
        avgRtpStatsReporter?: AvgRTPStatsReporter;
        isJvbConnectionInterrupted: boolean;
        speakerStatsCollector: SpeakerStatsCollector;
        deferredStartP2PTask?: number;
        backToP2PDelay: number;
        isP2PConnectionInterrupted: boolean;
        p2p: boolean;
        p2pJingleSession?: JingleSessionPC;
        videoSIPGWHandler: VideoSIPGW;
        recordingManager: RecordingManager;
        room?: ChatRoom;
        e2eping?: E2ePing;
        rtc?: RTC;
        qualityController?: QualityController;
        statistics?: Statistics;
        p2pDominantSpeakerDetection?: P2PDominantSpeakerDetection;
        authIdentity?: string;
        p2pEstablishmentDuration?: number;
        jvbEstablishmentDuration?: number;
        isDesktopMutedByFocus: boolean;
        mutedDesktopByFocusActor?: string;
        dominantSpeakerIsSilent?: boolean;
        /**
         * @param {IConferenceOptions} options
         */
        constructor(options: IConferenceOptions);
        /**
         * Create a resource for the a jid. We use the room nickname (the resource part
         * of the occupant JID, see XEP-0045) as the endpoint ID in colibri. We require
         * endpoint IDs to be 8 hex digits because in some cases they get serialized
         * into a 32bit field.
         *
         * @param {string} jid - The id set onto the XMPP connection.
         * @param {boolean} isAuthenticatedUser - Whether or not the user has connected
         * to the XMPP service with a password.
         * @returns {string}
         */
        static resourceCreator(jid: string, isAuthenticatedUser: boolean): string;
        /**
         * Initializes the conference object properties
         * @param options {object}
         * @param options.connection {JitsiConnection} overrides this.connection
         */
        private _init;
        /**
       * Registers event listeners on the RTC instance.
       * @param {RTC} rtc - the RTC module instance used by this conference.
       * @private
       * @returns {void}
       */
        private _registerRtcListeners;
        /**
         * Sends a conference.join analytics event.
         *
         * @returns {void}
         */
        private _sendConferenceJoinAnalyticsEvent;
        /**
         * Sends conference.left analytics event.
         * @private
         */
        private _sendConferenceLeftAnalyticsEvent;
        /**
         * Restarts all active media sessions.
         *
         * @returns {void}
         */
        private _restartMediaSessions;
        /**
       * Fires TRACK_AUDIO_LEVEL_CHANGED change conference event (for local tracks).
       * @param {number} audioLevel - The audio level.
       * @param {TraceablePeerConnection} [tpc] - The peer connection.
       * @private
       */
        private _fireAudioLevelChangeEvent;
        /**
       * Fires TRACK_MUTE_CHANGED change conference event.
       * @param {JitsiLocalTrack} track - The JitsiTrack object related to the event.
       */
        private _fireMuteChangeEvent;
        /**
       * Replaces the tracks at the lower level by going through the Jingle session
       * and WebRTC peer connection. The method will resolve immediately if there is
       * currently no JingleSession started.
       * @param {JitsiLocalTrack|null} oldTrack - The track to be removed during
       * the process or <tt>null</t> if the method should act as "add track".
       * @param {JitsiLocalTrack|null} newTrack - The new track to be added or
       * <tt>null</tt> if the method should act as "remove track".
       * @return {Promise} Resolved when the process is done or rejected with a string
       * which describes the error.
       * @private
       */
        private _doReplaceTrack;
        /**
       * Handler for when a source-add for a local source is rejected by Jicofo.
       * @param {JingleSessionPC} jingleSession - The media session.
       * @param {Error} error - The error message.
       * @param {MediaType} mediaType - The media type of the track associated with the source that was rejected.
       * @param {Object} _ctx - Unused context object passed by JingleSessionPC.
       * @param {Array<string>} sourceNames - Source names of the rejected sources, when available.
       * @returns {void}
       */
        private _removeLocalSourceOnReject;
        /**
       * Operations related to creating a new track.
       * @param {JitsiLocalTrack} newTrack - The new track being created.
       */
        private _setupNewTrack;
        /**
       * Sets the video type.
       * @param {JitsiLocalTrack} track - The track.
       * @return {boolean} <tt>true</tt> if video type was changed in presence.
       * @private
       */
        private _setNewVideoType;
        /**
         * Maybe clears the timeout which emits {@link ACTION_JINGLE_SI_TIMEOUT}
         * analytics event.
         * @private
         */
        private _maybeClearSITimeout;
        /**
         * Sets a timeout which will emit {@link ACTION_JINGLE_SI_TIMEOUT} analytics
         * event.
         * @private
         */
        private _maybeSetSITimeout;
        /**
         * Clears the deferred start P2P task if it has been scheduled.
         * @private
         */
        private _maybeClearDeferredStartP2P;
        /**
             * Removes from the conference remote tracks associated with the JVB
         * connection.
         * @private
         */
        private _removeRemoteJVBTracks;
        /**
         * Removes from the conference remote tracks associated with the P2P
         * connection.
         * @private
         */
        private _removeRemoteP2PTracks;
        /**
         * Generates fake "remote track removed" events for given Jingle session.
         * @param {string} sessionNickname the session's nickname which will appear in
         * log messages.
         * @param {Array<JitsiRemoteTrack>} remoteTracks the tracks that will be removed
         * @private
         */
        private _removeRemoteTracks;
        /**
         * Resumes media transfer over the JVB connection.
         * @private
         */
        private _resumeMediaTransferForJvbConnection;
        /**
         * Sets new P2P status and updates some events/states hijacked from
         * the <tt>JitsiConference</tt>.
             * @param {boolean} newStatus the new P2P status value, <tt>true</tt> means that
         * P2P is now in use, <tt>false</tt> means that the JVB connection is now in use
         * @private
         */
        private _setP2PStatus;
        /**
         * Starts new P2P session.
         * @param {string} remoteJid the JID of the remote participant
         * @private
         */
        private _startP2PSession;
        /**
         * Suspends media transfer over the JVB connection.
         * @private
         */
        private _suspendMediaTransferForJvbConnection;
        /**
         * Method when called will decide whether it's the time to start or stop
         * the P2P session.
         * @param {boolean} userLeftEvent if <tt>true</tt> it means that the call
         * originates from the user left event.
         * @private
         */
        private _maybeStartOrStopP2P;
        /**
         * Tells whether or not this conference should be currently in the P2P mode.
         *
         * @private
         * @returns {boolean}
         */
        private _shouldBeInP2PMode;
        /**
         * Stops the current P2P session.
         * @param {Object} options - Options for stopping P2P.
         * @param {string} options.reason - One of the Jingle "reason" element
         * names as defined by https://xmpp.org/extensions/xep-0166.html#def-reason
         * @param {string} options.reasonDescription - Text description that will be
         * included in the session terminate message.
         * @param {boolean} options.requestRestart - Whether this is due to a session restart, in which case
         * media will not be resumed on the JVB.
         * @private
         */
        private _stopP2PSession;
        /**
         * Updates room presence if needed and send the packet in case of a modification.
         * @param {JingleSessionPC} jingleSession the session firing the event, contains the peer connection which
         * tracks we will check.
         * @param {Object|null} ctx a context object we can distinguish multiple calls of the same pass of updating tracks.
         */
        private _updateRoomPresence;
        /**
         * Updates features for a participant.
         * @param {JitsiParticipant} participant - The participant to query for features.
         * @returns {void}
         * @private
         */
        private _updateFeatures;
        /**
         * Accepts an incoming call event for the JVB Jingle session.
         * @param {JingleSessionPC} jingleSession - The Jingle session for the incoming call.
         * @param {Element} jingleOffer - An element pointing to 'jingle' IQ element containing the offer.
         * @param {number} now - The timestamp when the call was received.
         * @private
         */
        private _acceptJvbIncomingCall;
        /**
         * Sets the BridgeChannel.
         *
         * @param {Object} offerIq - An element pointing to the jingle element of
         * the offer IQ which may carry the WebSocket URL for the 'websocket'
         * BridgeChannel mode.
         * @param {TraceablePeerConnection} pc - The peer connection which will be used
         * to listen for new WebRTC Data Channels (in the 'datachannel' mode).
         * @private
         */
        private _setBridgeChannel;
        /**
         * Rejects incoming Jingle call.
         * @param {JingleSessionPC} jingleSession - The session instance to be rejected.
         * @param {object} [options] - Optional parameters for rejection.
         * @param {string} options.reason - The name of the reason element as defined by Jingle.
         * @param {string} options.reasonDescription - The reason description which will be
         *  included in Jingle 'session-terminate' message.
         * @param {string} options.errorMsg - An error message to be logged on global error handler.
         * @private
         */
        private _rejectIncomingCall;
        /**
         * Handles an incoming call event for the P2P Jingle session.
         * @param {JingleSessionPC} jingleSession - The Jingle session for the incoming call.
         * @param {Element} jingleOffer - An element pointing to 'jingle' IQ element containing the offer.
         * @private
         */
        private _onIncomingCallP2P;
        /**
         * Handles CONNECTION_INTERRUPTED event.
         * @param {JingleSessionPC} session - The Jingle session.
         * @private
         */
        private _onIceConnectionInterrupted;
        /**
         * Handles CONNECTION_ICE_FAILED event.
         * @param {JingleSessionPC} session - The Jingle session.
         * @private
         */
        private _onIceConnectionFailed;
        /**
         * Handles P2P_TERMINATION_REQUIRED event. Fired when a source-remove is detected on a P2P connection, which
         * indicates that the browser has regenerated SSRCs for an existing source. The P2P session is stopped so the
         * call falls back to JVB.
         *
         * @param {JingleSessionPC} session - The P2P Jingle session.
         * @private
         */
        private _onP2PTerminationRequired;
        /**
         * Handles CONNECTION_RESTORED event.
         * @param {JingleSessionPC} session - The Jingle session.
         * @private
         */
        private _onIceConnectionRestored;
        /**
         * Accepts an incoming P2P Jingle call.
         * @param {JingleSessionPC} jingleSession - The Jingle session instance.
         * @param {Element} jingleOffer - An element pointing to 'jingle' IQ element containing the offer.
         * @private
         */
        private _acceptP2PIncomingCall;
        /**
         * Adds remote tracks to the conference associated with the JVB session.
         * @private
         * @returns {void}
         */
        private _addRemoteJVBTracks;
        /**
         * Adds remote tracks to the conference associated with the P2P session.
         * @private
         * @returns {void}
         */
        private _addRemoteP2PTracks;
        /**
         * Generates fake "remote track added" events for given Jingle session.
         * @param {string} logName - The session's nickname which will appear in log messages.
         * @param {Array<JitsiRemoteTrack>} remoteTracks - The tracks that will be added.
         * @private
         */
        private _addRemoteTracks;
        /**
         * Handles the ICE connection establishment event for a Jingle session.
         * @private
         * @param {JingleSessionPC} jingleSession - The Jingle session for which ICE connection was established.
         */
        private _onIceConnectionEstablished;
        /**
         * Called when the chat room reads a new list of properties from jicofo's
         * presence. The properties may have changed, but they don't have to.
         *
         * @param {Object} properties - The properties keyed by the property name
         * ('key').
         * @private
         */
        private _updateProperties;
        /**
         * Fires CONFERENCE_FAILED event with INCOMPATIBLE_SERVER_VERSIONS parameter.
         * @returns {void}
         * @private
         */
        private _fireIncompatibleVersionsEvent;
        /**
         * Joins the conference.
         * @param password {string} the password
         * @param replaceParticipant {boolean} whether the current join replaces
         * an existing participant with same jwt from the meeting.
         */
        join(password?: string, replaceParticipant?: boolean): void;
        /**
       * Check if joined to the conference.
       * @returns {boolean} True if joined, false otherwise.
       */
        isJoined(): boolean;
        /**
       * Tells whether or not the P2P mode is enabled in the configuration.
       * @returns {boolean} True if P2P is enabled, false otherwise.
       */
        isP2PEnabled(): boolean;
        /**
       * When in P2P test mode, the conference will not automatically switch to P2P
       * when there are 2 participants.
       * @returns {boolean} True if P2P test mode is enabled, false otherwise.
       */
        isP2PTestModeEnabled(): boolean;
        /**
       * Leaves the conference.
       * @param {string|undefined} reason - The reason for leaving the conference.
       * @returns {Promise}
       */
        leave(reason?: string): Promise<void>;
        /**
       * Disposes of conference resources. This operation is a short-hand for leaving
       * the conference and disconnecting the connection.
       * @returns {Promise}
       */
        dispose(): Promise<void>;
        /**
       * Returns true if end conference support is enabled in the backend.
       * @returns {boolean} whether end conference is supported in the backend.
       */
        isEndConferenceSupported(): boolean;
        /**
       * Ends the conference.
       */
        end(): void;
        /**
       * Returns the currently active media session if any.
       * @returns {Optional<JingleSessionPC>}
       */
        getActiveMediaSession(): Optional<JingleSessionPC>;
        /**
       * Returns an array containing all media sessions existing in this conference.
       * @returns {Array<JingleSessionPC>}
       */
        getMediaSessions(): JingleSessionPC[];
        /**
       * Returns name of this conference.
       * @returns {string}
       */
        getName(): string;
        /**
       * Returns the {@link JitsiConnection} used by this conference.
       * @returns {JitsiConnection}
       */
        getConnection(): JitsiConnection;
        /**
       * Check if authentication is enabled for this conference.
       * @returns {boolean}
       */
        isAuthEnabled(): boolean;
        /**
       * Check if user is logged in.
       * @returns {boolean}
       */
        isLoggedIn(): boolean;
        /**
       * Get authorized login.
       * @returns {string|null}
       */
        getAuthLogin(): Nullable<string>;
        /**
       * Returns the local tracks of the given media type, or all local tracks if no
       * specific type is given.
       * @param {MediaType} [mediaType] Optional media type (audio or video).
       * @returns {Array<JitsiLocalTrack>}
       */
        getLocalTracks(mediaType?: MediaType): JitsiLocalTrack[];
        /**
       * Obtains local audio track.
       * @returns {JitsiLocalTrack|null}
       */
        getLocalAudioTrack(): Nullable<JitsiLocalTrack>;
        /**
       * Obtains local video track.
       * @returns {JitsiLocalTrack|null}
       */
        getLocalVideoTrack(): Nullable<JitsiLocalTrack>;
        /**
       * Returns all the local video tracks.
       * @returns {Array<JitsiLocalTrack>|null}
       */
        getLocalVideoTracks(): Nullable<JitsiLocalTrack[]>;
        /**
       * Receives notifications from other participants about commands / custom events
       * (sent by sendCommand or sendCommandOnce methods).
       * @param {string} command - The name of the command.
       * @param {Function} handler - Handler for the command.
       */
        addCommandListener(command: string, handler: PresenceHandler): void;
        /**
       * Removes command listener.
       * @param {string} command - The name of the command.
       * @param {Function} handler - Handler to remove for the command.
       */
        removeCommandListener(command: string, handler: PresenceHandler): void;
        /**
        /**
       * Sends text message to the other participants in the conference.
       * @param {string} message - The text message.
       * @param {string} [elementName='body'] - The element name to encapsulate the message.
       * @param {string} [replyToId] - The ID of the message being replied to.
       * @deprecated Use 'sendMessage' instead. TODO: this should be private.
       */
        sendTextMessage(message: string, elementName?: string, replyToId?: string): void;
        /**
       * Sends a reaction to the other participants in the conference.
       * @param {string} reaction - The reaction.
       * @param {string} messageId - The ID of the message to attach the reaction to.
       * @param {string} receiverId - The intended recipient, if the message is private.
       */
        sendReaction(reaction: string, messageId: string, receiverId: string): void;
        /**
       * Sends private text message to another participant of the conference.
       * @param {string} id - The ID of the participant to send a private message.
       * @param {string} message - The text message.
       * @param {string} [elementName='body'] - The element name to encapsulate the message.
       * @param {boolean} [useFullJid=false] - Whether to use the full JID.
       * @param {string} [replyToId] - The ID of the message being replied to.
       * @deprecated Use 'sendMessage' instead. TODO: this should be private.
       */
        sendPrivateTextMessage(id: string, message: string, elementName?: string, useFullJid?: boolean, replyToId?: string): void;
        /**
       * Send presence command.
       * @param {string} name - The name of the command.
       * @param {Record<string, unknown>} values - With keys and values that will be sent.
       */
        sendCommand(name: string, values: Record<string, unknown>): void;
        /**
       * Send presence command one time.
       * @param {string} name - The name of the command.
       * @param {Record<string, unknown>} values - With keys and values that will be sent.
       */
        sendCommandOnce(name: string, values: Record<string, unknown>): void;
        /**
       * Removes presence command.
       * @param {string} name - The name of the command.
       */
        removeCommand(name: string): void;
        /**
       * Sets the display name for this conference.
       * @param {string} name - The display name to set.
       */
        setDisplayName(name: string): void;
        /**
       * Set join without audio.
       * @param {boolean} silent - Whether user joined without audio.
       */
        setIsSilent(silent: boolean): void;
        /**
       * Set new subject for this conference. (Available only for moderator)
       * @param {string} subject - New subject.
       */
        setSubject(subject: string): void;
        /**
       * Returns the transcription status.
       * @returns {string} "on" or "off".
       */
        getTranscriptionStatus(): string;
        /**
       * Adds JitsiLocalTrack object to the conference.
       * @param {JitsiLocalTrack} track - The JitsiLocalTrack object.
       * @returns {Promise<void>}
       * @throws {Error} If the specified track is a video track and there is already
       * another video track in the conference.
       */
        addTrack(track: JitsiLocalTrack): Promise<void>;
        /**
       * Removes JitsiLocalTrack from the conference and performs
       * a new offer/answer cycle.
       * @param {JitsiLocalTrack} track - The track to remove.
       * @returns {Promise}
       */
        removeTrack(track: JitsiLocalTrack): Promise<void>;
        /**
       * Replaces oldTrack with newTrack and performs a single offer/answer
       * cycle after both operations are done. Either oldTrack or newTrack
       * can be null; replacing a valid 'oldTrack' with a null 'newTrack'
       * effectively just removes 'oldTrack'
       * @param {JitsiLocalTrack} oldTrack - The current stream in use to be replaced.
       * @param {JitsiLocalTrack} newTrack - The new stream to use.
       * @returns {Promise} Resolves when the replacement is finished.
       */
        replaceTrack(oldTrack?: JitsiLocalTrack, newTrack?: JitsiLocalTrack): Promise<void>;
        /**
       * Get role of the local user.
       * @returns {string} User role: 'moderator' or 'none'.
       */
        getRole(): string;
        /**
         * Returns whether or not the current conference has been joined as a hidden user.
         * @returns {boolean} True if hidden, false otherwise. Will return false if no connection is active.
         */
        isHidden(): boolean;
        /**
         * Check if local user is moderator.
         * @returns {boolean} true if local user is moderator, false otherwise. If
         * we're no longer in the conference room then <tt>false</tt> is returned.
         */
        isModerator(): boolean;
        /**
         * Set password for the room.
         * @param {string} password new password for the room.
         * @returns {Promise}
         */
        lock(password: string): Promise<void>;
        /**
         * Remove password from the room.
         * @returns {Promise}
         */
        unlock(): Promise<void>;
        /**
         * Obtains the current value for "lastN". See {@link setLastN} for more info.
         * @returns {number}
         */
        getLastN(): number;
        /**
         * Sets the audio subscription mode for the local user.
         *
         * @param {IReceiverAudioSubscriptionMessage} message - The audio subscription mode to set.
         * @returns {void}
         */
        setAudioSubscriptionMode(message: IReceiverAudioSubscriptionMessage): void;
        /**
         * Selects a new value for "lastN". The requested amount of videos are going
         * to be delivered after the value is in effect. Set to -1 for unlimited or
         * all available videos.
         * @param lastN the new number of videos the user would like to receive.
         * @throws Error or RangeError if the given value is not a number or is smaller
         * than -1.
         */
        setLastN(lastN: number): void;
        /**
         * @return Array<JitsiParticipant> an array of all participants in this conference.
         */
        getParticipants(): JitsiParticipant[];
        /**
         * Returns the number of participants in the conference, including the local
         * participant.
         * @param countHidden {boolean} Whether or not to include hidden participants
         * in the count. Default: false.
         **/
        getParticipantCount(countHidden?: boolean): number;
        /**
         * @returns {JitsiParticipant} the participant in this conference with the
         * specified id (or undefined if there isn't one).
         * @param id the id of the participant.
         */
        getParticipantById(id: string): Optional<JitsiParticipant>;
        /**
         * Grant owner rights to the participant.
         * @param {string} id id of the participant to grant owner rights to.
         */
        grantOwner(id: string): void;
        /**
         * Revoke owner rights to the participant or local Participant as
         * the user might want to refuse to be a moderator.
         * @param {string} id id of the participant to revoke owner rights to.
         */
        revokeOwner(id: string): void;
        /**
         * Kick participant from this conference.
         * @param {string} id id of the participant to kick
         * @param {string} reason reason of the participant to kick
         */
        kickParticipant(id: string, reason: string): void;
        /**
         * Mutes or unmutes the remote audio streams based on the provided parameter.
         *
         * @param {boolean} muted - Whether the user should stop receiving remote audio.
         * @returns {void}
         */
        muteRemoteAudio(muted: boolean): void;
        /**
         * Mutes a participant.
         * @param {string} id The id of the participant to mute.
         */
        muteParticipant(id: string, mediaType?: MediaType): void;
        /**
         * Updates DTMF support based on participants' capabilities.
         * @returns {void}
         */
        updateDTMFSupport(): void;
        /**
         * Allows to check if there is at least one user in the conference that supports DTMF.
         * @returns {boolean} True if somebody supports DTMF, false otherwise.
         */
        isDTMFSupported(): boolean;
        /**
         * Returns the local user's ID.
         * @returns {string|null} Local user's ID or null if not available.
         */
        myUserId(): Nullable<string>;
        /**
         * Sends DTMF tones to the active peer connection.
         * @param {string} tones - The DTMF tones to send.
         * @param {number} duration - The duration of each tone in milliseconds.
         * @param {number} pause - The pause duration between tones in milliseconds.
         * @returns {void}
         */
        sendTones(tones: string, duration: number, pause: number): void;
        /**
         * Starts recording the current conference.
         *
         * @param {IRecordingOptions} options - Configuration for the recording.
         * @returns {Promise} Resolves when recording starts successfully, rejects otherwise.
         */
        startRecording(options: IRecordingOptions): Promise<JibriSession>;
        /**
         * Stops a recording session.
         *
         * @param {string} sessionID - The ID of the recording session to stop.
         * @returns {Promise} Resolves when recording stops successfully, rejects otherwise.
         */
        stopRecording(sessionID: string): Promise<void>;
        /**
         * Returns true if SIP calls are supported, false otherwise.
         * @returns {boolean} True if SIP calling is supported, false otherwise.
         */
        isSIPCallingSupported(): boolean;
        /**
         * Dials a phone number to join the conference.
         * @param {string} number - The phone number to dial.
         * @returns {Promise} Resolves when the dial is successful, rejects otherwise.
         */
        dial(number: string): Promise<void>;
        /**
         * Hangs up an existing call.
         * @returns {Promise} Resolves when the hangup is successful.
         */
        hangup(): Promise<void>;
        /**
         * Returns the phone number for joining the conference.
         * @returns {string|null} The phone number or null if not available.
         */
        getPhoneNumber(): Nullable<string>;
        /**
         * Returns the PIN for joining the conference via phone.
         * @returns {string|null} The phone PIN or null if not available.
         */
        getPhonePin(): Nullable<string>;
        /**
         * Returns the meeting unique ID if any.
         * @returns {string|undefined} The meeting ID or undefined if not available.
         */
        getMeetingUniqueId(): Optional<string>;
        /**
         * Returns the active peer connection (P2P or JVB).
         * @returns {TraceablePeerConnection|null} The active peer connection or null if none is available.
         * @public
         */
        getActivePeerConnection(): Nullable<TraceablePeerConnection>;
        /**
         * Returns the connection state for the current room.
         * NOTE that "completed" ICE state which can appear on the P2P connection will
         * be converted to "connected".
         * @returns {string|null} The ICE connection state or null if no active peer connection exists.
         */
        getConnectionState(): Nullable<string>;
        /**
         * Sets the start muted policy for new participants.
         * @param {Object} policy - Object with boolean properties for audio and video muting.
         * @param {boolean} policy.audio - Whether audio should be muted for new participants.
         * @param {boolean} policy.video - Whether video should be muted for new participants.
         * @returns {void}
         */
        setStartMutedPolicy(policy: {
            audio: boolean;
            video: boolean;
        }): void;
        /**
         * Returns measured connection times.
         * @returns {Object} The connection times for the room.
         */
        getConnectionTimes(): object;
        /**
         * Sets a property for the local participant.
         * @param {string} name - The name of the property.
         * @param {string} value - The value of the property.
         * @returns {void}
         */
        setLocalParticipantProperty(name: string, value: string | string[]): void;
        /**
         * Removes a property for the local participant and sends the updated presence.
         * @param {string} name - The name of the property to remove.
         * @returns {void}
         */
        removeLocalParticipantProperty(name: string): void;
        /**
         * Sets the transcription language.
         * NB: Unlike _init_ here we don't check for the default value since we want to allow
         * the value to be reset.
         * @param {string} lang - The new transcription language to be used.
         * @returns {void}
         */
        setTranscriptionLanguage(lang: string): void;
        /**
         * Gets a local participant property.
         * @param {string} name - The name of the property to retrieve.
         * @returns {string|undefined} The value of the property if it exists, otherwise undefined.
         */
        getLocalParticipantProperty(name: string): Optional<string>;
        /**
         * Sends feedback if enabled.
         * @param {number} overallFeedback - An integer between 1 and 5 indicating user feedback.
         * @param {string} detailedFeedback - Detailed feedback from the user (not yet used).
         * @returns {Promise} Resolves if feedback is submitted successfully.
         */
        sendFeedback(overallFeedback: number, detailedFeedback: string): Promise<void>;
        /**
         * Finds the SSRC of a given track.
         * @param {JitsiTrack} track - The track to find the SSRC for.
         * @returns {Optional<number>} The SSRC of the specified track, or undefined if not found.
         */
        getSsrcByTrack(track: JitsiTrack): Optional<number>;
        /**
         * Sends an application log (no-op since callstats is no longer supported).
         * @returns {void}
         */
        sendApplicationLog(): void;
        /**
         * Sends a message via the data channel.
         * @param {string} to - The ID of the endpoint to receive the message, or empty string to broadcast.
         * @param {object} payload - The payload of the message.
         * @throws {NetworkError|InvalidStateError|Error} If the operation fails.
         * @deprecated Use 'sendMessage' instead. TODO: this should be private.
         */
        sendEndpointMessage(to: string, payload: object): void;
        /**
         * Sends a broadcast message via the data channel.
         * @param {object} payload - The payload of the message.
         * @throws {NetworkError|InvalidStateError|Error} If the operation fails.
         * @deprecated Use 'sendMessage' instead. TODO: this should be private.
         */
        broadcastEndpointMessage(payload: object): void;
        /**
         * Sends a message to a given endpoint or broadcasts it to all endpoints.
         * @param {string|object} message - The message to send (string for chat, object for JSON).
         * @param {string} [to=''] - The ID of the recipient endpoint, or empty string to broadcast.
         * @param {boolean} [sendThroughVideobridge=false] - Whether to send through jitsi-videobridge.
         * @param {string} [replyToId] - The ID of the message being replied to.
         */
        sendMessage(message: any, to?: string, sendThroughVideobridge?: boolean, replyToId?: string): void;
        /**
         * Checks if the connection is interrupted.
         * @returns {boolean} True if the connection is interrupted, false otherwise.
         */
        isConnectionInterrupted(): boolean;
        /**
         * Gets a conference property with a given key.
         *
         * @param {string} key - The key.
         * @returns {*} The value
         */
        getProperty(key: string): any;
        /**
         * Checks whether or not the conference is currently in the peer to peer mode.
         * Being in peer to peer mode means that the direct connection has been
         * established and the P2P connection is being used for media transmission.
         * @return {boolean} <tt>true</tt> if in P2P mode or <tt>false</tt> otherwise.
         */
        isP2PActive(): boolean;
        /**
         * Returns the current ICE state of the P2P connection.
         * NOTE: method is used by the jitsi-meet-torture tests.
         * @return {string|null} an ICE state or <tt>null</tt> if there's currently
         * no P2P connection.
         */
        getP2PConnectionState(): Nullable<string>;
        /**
         * Configures the peerconnection so that a given framre rate can be achieved for desktop share.
         *
         * @param {number} maxFps The capture framerate to be used for desktop tracks.
         * @returns {boolean} true if the operation is successful, false otherwise.
         */
        setDesktopSharingFrameRate(maxFps: number): boolean;
        /**
         * Get a summary of how long current participants have been the dominant speaker
         * @returns {{[userId: string]: SpeakerStats}} The speaker statistics.
         */
        getSpeakerStats(): {
            [userId: string]: SpeakerStats;
        };
        /**
         * Sends a face landmarks object to the xmpp server.
         * @param {IFaceLandmarksPayload} payload - The face landmarks data to send.
         * @returns {void}
         */
        sendFaceLandmarks(payload: IFaceLandmarksPayload): void;
        /**
         * Sets the constraints for the video that is requested from the bridge.
         *
         * @param {IReceiverVideoConstraints} videoConstraints The constraints which are specified in the following format. The message updates
         * the fields that are present and leaves the rest unchanged on the bridge.
         * Therefore, any field that is not applicable
         * anymore should be cleared by passing an empty object or list (whatever is applicable).
         * {
         *      'lastN': 20,
         *      'selectedSources': ['A', 'B', 'C'],
         *      'onStageSources': ['A'],
         *      'defaultConstraints': { 'maxHeight': 180 },
         *      'constraints': {
         *          'A': { 'maxHeight': 720 }
         *      }
         * }
         * Where A, B and C are source-names of the remote tracks that are being requested from the bridge.
         * @returns {void}
         */
        setReceiverConstraints(videoConstraints: IReceiverVideoConstraints): void;
        /**
         * Sets the assumed bandwidth bps for the video that is requested from the bridge.
         *
         * @param {Number} assumedBandwidthBps - The bandwidth value expressed in bits per second.
         * @returns {void}
         */
        setAssumedBandwidthBps(assumedBandwidthBps: number): void;
        /**
         * Sets the maximum video size the local participant should receive from remote
         * participants.
         *
         * @param {number} maxFrameHeight - the maximum frame height, in pixels,
         * this receiver is willing to receive.
         * @returns {void}
         */
        setReceiverVideoConstraint(maxFrameHeight: number): void;
        /**
         * Sets the maximum video size the local participant should send to remote
         * participants.
         * @param {number} maxFrameHeight - The user preferred max frame height.
         * @returns {Promise} promise that will be resolved when the operation is
         * successful and rejected otherwise.
         */
        setSenderVideoConstraint(maxFrameHeight: number): Promise<void>;
        /**
         * Creates a video SIP GW session and returns it if service is enabled. Before
         * creating a session one need to check whether video SIP GW service is
         * available in the system. Even
         * if there are available nodes to serve this request, after creating the
         * session those nodes can be taken and the request about using the
         * created session can fail.
         *
         * @param {string} sipAddress - The sip address to be used.
         * @param {string} displayName - The display name to be used for this session.
         * @returns {JitsiVideoSIPGWSession|Error} Returns null if conference is not
         * initialised and there is no room.
         */
        createVideoSIPGWSession(sipAddress: string, displayName: string): JitsiVideoSIPGWSession | Error;
        /**
         * Returns whether End-To-End encryption is enabled.
         *
         * @returns {boolean}
         */
        isE2EEEnabled(): boolean;
        /**
         * Returns whether End-To-End encryption is supported. Note that not all participants
         * in the conference may support it.
         *
         * @returns {boolean}
         */
        isE2EESupported(): boolean;
        /**
         * Enables / disables End-to-End encryption.
         *
         * @param {boolean} enabled whether to enable E2EE or not.
         * @returns {void}
         */
        toggleE2EE(enabled: boolean): void;
        /**
         * Sets the key and index for End-to-End encryption.
         *
         * @param {CryptoKey} [keyInfo.encryptionKey] - encryption key.
         * @param {Number} [keyInfo.index] - the index of the encryption key.
         * @returns {void}
         */
        setMediaEncryptionKey(keyInfo: CryptoKey): void;
        /**
         * Starts the participant verification process.
         *
         * @param {string} participantId The participant which will be marked as verified.
         * @returns {void}
         */
        startVerification(participantId: string): void;
        /**
         * Marks the given participant as verified. After this is done, MAC verification will
         * be performed and an event will be emitted with the result.
         *
         * @param {string} participantId The participant which will be marked as verified.
         * @param {boolean} isVerified - whether the verification was succesfull.
         * @returns {void}
         */
        markParticipantVerified(participantId: string, isVerified: boolean): void;
        /**
         * Returns <tt>true</tt> if lobby support is enabled in the backend.
         *
         * @returns {boolean} whether lobby is supported in the backend.
         */
        isLobbySupported(): boolean;
        /**
         * Returns <tt>true</tt> if the room has members only enabled.
         *
         * @returns {boolean} whether conference room is members only.
         */
        isMembersOnly(): boolean;
        /**
         * Returns <tt>true</tt> if the room supports visitors feature.
         *
         * @returns {boolean} whether conference room has visitors support.
         */
        isVisitorsSupported(): boolean;
        /**
         * Enables lobby by moderators
         *
         * @returns {Promise} resolves when lobby room is joined or rejects with the error.
         */
        enableLobby(): Promise<void>;
        /**
         * Disabled lobby by moderators
         *
         * @returns {void}
         */
        disableLobby(): void;
        /**
         * Joins the lobby room with display name and optional email or with a shared password to skip waiting.
         *
         * @param {string} displayName Display name should be set to show it to moderators.
         * @param {string} email Optional email is used to present avatar to the moderator.
         * @returns {Promise<never>}
         */
        joinLobby(displayName: string, email: string): Promise<void>;
        /**
         * Gets the local id for a participant in a lobby room.
         * Returns undefined when current participant is not in the lobby room.
         * This is used for lobby room private chat messages.
         *
         * @returns {string}
         */
        myLobbyUserId(): Optional<string>;
        /**
         * Sends a message to a lobby room.
         * When id is specified it sends a private message.
         * Otherwise it sends the message to all moderators.
         * @param {object} message The message to send
         * @param {string} id The participant id.
         *
         * @returns {void}
         */
        sendLobbyMessage(message: object, id: string): void;
        /**
         * Adds a message listener to the lobby room
         * @param {Function} listener The listener function,
         * called when a new message is received in the lobby room.
         *
         * @returns {Function} Handler returned to be able to remove it later.
         */
        addLobbyMessageListener(listener: (message: object) => void): Optional<EventListener>;
        /**
         * Removes a message handler from the lobby room
         * @param {Function} handler The handler function  to remove.
         *
         * @returns {void}
         */
        removeLobbyMessageHandler(handler: (message: object) => void): void;
        /**
         * Denies an occupant in the lobby room access to the conference.
         * @param {string} id The participant id.
         * @returns {void}
         */
        lobbyDenyAccess(id: string): void;
        /**
         * Approves the request to join the conference to a participant waiting in the lobby.
         *
         * @param {string|Array<string>} param The participant id or an array of ids.
         * @returns {void}
         */
        lobbyApproveAccess(param: string | string[]): void;
        /**
         * Returns <tt>true</tt> if AV Moderation support is enabled in the backend.
         *
         * @returns {boolean} whether AV Moderation is supported in the backend.
         */
        isAVModerationSupported(): boolean;
        /**
         * Enables AV Moderation.
         * @param {MediaType} mediaType "audio", "desktop" or "video"
         * @returns {void}
         */
        enableAVModeration(mediaType: MediaType): void;
        /**
         * Disables AV Moderation.
         * @param {MediaType} mediaType "audio", "desktop" or "video"
         * @returns {void}
         */
        disableAVModeration(mediaType: MediaType): void;
        /**
         * Approve participant access to certain media, allows unmuting audio or video.
         *
         * @param {MediaType} mediaType "audio", "desktop" or "video"
         * @param id the id of the participant.
         * @returns {void}
         */
        avModerationApprove(mediaType: MediaType, id: string): void;
        /**
         * Reject participant access to certain media, blocks unmuting audio or video.
         *
         * @param {MediaType} mediaType "audio", "desktop" or "video"
         * @param id the id of the participant.
         * @returns {void}
         */
        avModerationReject(mediaType: MediaType, id: string): void;
        /**
         * Returns the breakout rooms manager object.
         *
         * @returns {Optional<BreakoutRooms>} the breakout rooms manager.
         */
        getBreakoutRooms(): Optional<BreakoutRooms>;
        /**
         * Returns the file sharing manager object.
         *
         * @returns {Optional<FileSharing>} the file sharing manager.
         */
        getFileSharing(): Optional<FileSharing>;
        /**
         * Returns the metadata handler object.
         *
         * @returns {Optional<RoomMetadata>} the room metadata handler.
         */
        getMetadataHandler(): Optional<RoomMetadata>;
        /**
         * Returns the polls object.
         *
         * @returns {Optional<Polls>} the polls.
         */
        getPolls(): Optional<Polls>;
        /**
         * Requests short-term credentials from the backend if available.
         * @param {string} service - The service for which to request the credentials.
         * @returns {Promise} A promise that resolves with the credentials or rejects with an error.
         */
        getShortTermCredentials(service: string): Promise<string>;
    }
}
declare module "JitsiMediaDevicesEvents" {
    export enum JitsiMediaDevicesEvents {
        /**
         * Indicates that the list of available media devices has been changed. The
         * event provides the following parameters to its listeners:
         *
         * @param {MediaDeviceInfo[]} devices - array of MediaDeviceInfo or
         *  MediaDeviceInfo-like objects that are currently connected.
         *  @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
         */
        DEVICE_LIST_CHANGED = "mediaDevices.devicechange",
        /**
         * Event emitted when the user granted/blocked a permission for the camera / mic.
         * Used to keep track of the granted permissions on browsers which don't
         * support the Permissions API.
         */
        PERMISSIONS_CHANGED = "rtc.permissions_changed",
        /**
         * Indicates that the environment is currently showing permission prompt to
         * access camera and/or microphone. The event provides the following
         * parameters to its listeners:
         *
         * @param {'chrome'|'opera'|'firefox'|'safari'|'nwjs'
         *  |'react-native'|'android'} environmentType - type of browser or
         *  other execution environment.
         */
        PERMISSION_PROMPT_IS_SHOWN = "mediaDevices.permissionPromptIsShown"
    }
}
declare module "JitsiMediaDevices" {
    import Listenable from "modules/util/Listenable";
    import { MediaType } from "service/RTC/MediaType";
    /**
     * Media devices utilities for Jitsi.
     * @noInheritDoc
     */
    export default class JitsiMediaDevices extends Listenable {
        private _initialized;
        private _permissions;
        private _permissionsApiSupported;
        /**
         * Initializes a `JitsiMediaDevices` object. There will be a single
         * instance of this class.
         */
        constructor();
        /**
         * Parses a PermissionState object and returns true for granted and false otherwise.
         *
         * @param {PermissionState} permissionStatus - The PermissionState object retrieved from the Permissions API.
         * @returns {boolean} - True for granted and false for denied.
         * @throws {TypeError}
         */
        private _parsePermissionState;
        /**
         * Updates the local granted/denied permissions cache. A permissions might be
         * granted, denied, or undefined. This is represented by having its media
         * type key set to `true` or `false` respectively.
         *
         * @param {Object} permissions - Object with the permissions.
         */
        private _handlePermissionsChange;
        /**
         * Executes callback with list of media devices connected.
         * @param {function} callback
         */
        enumerateDevices(callback: (devices: MediaDeviceInfo[]) => void): void;
        /**
         * Returns true if changing the input (camera / microphone) or output
         * (audio) device is supported and false if not.
         * @param {string} [deviceType] - type of device to change. Default is
         *      undefined or 'input', 'output' - for audio output device change.
         * @returns {boolean} true if available, false otherwise.
         */
        isDeviceChangeAvailable(deviceType?: string): boolean;
        /**
         * Checks if the permission for the given device was granted.
         *
         * @param {'audio'|'video'} [type] - type of devices to check,
         *      undefined stands for both 'audio' and 'video' together
         * @returns {Promise<boolean>}
         */
        isDevicePermissionGranted(type?: MediaType): Promise<boolean>;
        /**
         * Returns true if it is possible to be simultaneously capturing audio from more than one device.
         *
         * @returns {boolean}
         */
        isMultipleAudioInputSupported(): boolean;
        /**
         * Returns currently used audio output device id, 'default' stands
         * for default device
         * @returns {string}
         */
        getAudioOutputDevice(): string;
        /**
         * Sets current audio output device.
         * @param {string} deviceId - id of 'audiooutput' device from
         *      navigator.mediaDevices.enumerateDevices(), 'default' is for
         *      default device
         * @returns {Promise} - resolves when audio output is changed, is rejected
         *      otherwise
         */
        setAudioOutputDevice(deviceId: string): Promise<void>;
    }
}
declare module "modules/detection/ActiveDeviceDetector" {
    export interface IActiveDeviceInfo {
        deviceId: string;
        deviceLabel: string;
    }
    /**
     * Go through all audio devices on the system and return one that is active, i.e. has audio signal.
     *
     * @returns Promise<IActiveDeviceInfo> - Object containing information about the found device.
     */
    export default function getActiveAudioDevice(): Promise<IActiveDeviceInfo>;
}
declare module "modules/proxyconnection/CustomSignalingLayer" {
    import { MediaType } from "service/RTC/MediaType";
    import { type IPeerMediaInfo, default as SignalingLayer } from "service/RTC/SignalingLayer";
    import ChatRoom from "modules/xmpp/ChatRoom";
    /**
     * Custom semi-mock implementation for the Proxy connection service.
     */
    export default class CustomSignalingLayer extends SignalingLayer {
        /**
         * A map that stores SSRCs of remote streams.
         * @type {Map<number, string>} maps SSRC number to jid
         */
        private ssrcOwners;
        /**
         *
         * @type {ChatRoom|null}
         */
        chatRoom: Nullable<ChatRoom>;
        /**
         * Creates new instance.
         */
        constructor();
        /**
         * @inheritDoc
         */
        getPeerMediaInfo(_owner: string, _mediaType: MediaType, _sourceName: string): IPeerMediaInfo;
        /**
         * @inheritDoc
         */
        getPeerSourceInfo(_owner: string, _sourceName: string): any;
        /**
         * @inheritDoc
         */
        getSSRCOwner(ssrc: number): Optional<string>;
        /**
         * @inheritDoc
         */
        getTrackSourceName(_ssrc: number): Optional<string>;
        /**
         * @inheritDoc
         */
        removeSSRCOwners(ssrcList: number[]): void;
        /**
         * Sets the <tt>ChatRoom</tt> instance used.
         * @param {ChatRoom} room
         */
        setChatRoom(room: ChatRoom): void;
        /**
         * @inheritDoc
         */
        setSSRCOwner(ssrc: number, endpointId: string): void;
        /**
         * @inheritDoc
         */
        setTrackMuteStatus(_sourceName: string, _muted: boolean): boolean;
        /**
         * @inheritDoc
         */
        setTrackVideoType(_sourceName: string, _videoType: string): boolean;
        /**
         * @inheritDoc
         */
        updateSsrcOwnersOnLeave(id: string): void;
    }
}
declare module "modules/proxyconnection/constants" {
    /**
     * The know jingle actions that can be sent and should be acted upon by
     * {@code ProxyConnectionService} and {@code ProxyConnectionPC}.
     */
    export enum ACTIONS {
        ACCEPT = "session-accept",
        CONNECTION_ERROR = "connection-error-encountered",
        INITIATE = "session-initiate",
        TERMINATE = "session-terminate",
        TRANSPORT_INFO = "transport-info",
        UNAVAILABLE = "unavailable"
    }
}
declare module "modules/proxyconnection/ProxyConnectionPC" {
    /**
     * An adapter around {@code JingleSessionPC} so its logic can be re-used without
     * an XMPP connection. It is being re-used for consistency with the rest of the
     * codebase and to leverage existing peer connection event handling. Also
     * this class provides a facade to hide most of the API for
     * {@code JingleSessionPC}.
     */
    export default class ProxyConnectionPC {
        /**
         * Initializes a new {@code ProxyConnectionPC} instance.
         *
         * @param {Object} options - Values to initialize the instance with.
         * @param {Object} [options.pcConfig] - The {@code RTCConfiguration} to use for the WebRTC peer connection.
         * @param {boolean} [options.isInitiator] - If true, the local client should send offers. If false, the local
         * client should send answers. Defaults to false.
         * @param {Function} options.onRemoteStream - Callback to invoke when a remote media stream has been received
         * through the peer connection.
         * @param {string} options.peerJid - The jid of the remote client with which the peer connection is being establish
         * and which should receive direct messages regarding peer connection updates.
         * @param {boolean} [options.receiveVideo] - Whether or not the peer connection should accept incoming video
         * streams. Defaults to false.
         * @param {Function} options.onSendMessage - Callback to invoke when a message has to be sent (signaled) out.
         */
        constructor(options?: {
            pcConfig?: any;
            isInitiator?: boolean;
            onRemoteStream: Function;
            peerJid: string;
            receiveVideo?: boolean;
            onSendMessage: Function;
        });
        _options: {
            pcConfig: any;
            isInitiator: boolean;
            onRemoteStream: Function;
            peerJid: string;
            receiveVideo: boolean;
            onSendMessage: Function;
            receiveAudio: boolean;
        };
        /**
         * Instances of {@code JitsiTrack} associated with this instance of
         * {@code ProxyConnectionPC}.
         *
         * @type {Array<JitsiTrack>}
         */
        _tracks: Array<JitsiTrack>;
        /**
         * The active instance of {@code JingleSessionPC}.
         *
         * @type {JingleSessionPC|null}
         */
        _peerConnection: JingleSessionPC | null;
        /**
         * Invoked when a connection related issue has been encountered.
         *
         * @param {string} errorType - The constant indicating the type of the error
         * that occurred.
         * @param {string} details - Optional additional data about the error.
         * @private
         * @returns {void}
         */
        private _onError;
        /**
         * Callback invoked when the peer connection has received a remote media
         * stream.
         *
         * @param {JitsiRemoteTrack} jitsiRemoteTrack - The remote media stream
         * wrapped in {@code JitsiRemoteTrack}.
         * @private
         * @returns {void}
         */
        private _onRemoteStream;
        /**
         * Callback invoked when {@code JingleSessionPC} needs to signal a message
         * out to the remote peer.
         *
         * @param {XML} iq - The message to signal out.
         * @param {Function} callback - Callback when the IQ was acknowledged.
         * @private
         * @returns {void}
         */
        private _onSendMessage;
        /**
         * Returns the jid of the remote peer with which this peer connection should
         * be established with.
         *
         * @returns {string}
         */
        getPeerJid(): string;
        /**
         * Updates the peer connection based on the passed in jingle.
         *
         * @param {Element} jingleElement - An XML jingle element describing how the peer connection should be updated.
         * @returns {void}
         */
        processMessage(jingleElement: Element): void;
        /**
         * Instantiates a peer connection and starts the offer/answer cycle to
         * establish a connection with a remote peer.
         *
         * @param {Array<JitsiLocalTrack>} localTracks - Initial local tracks to add
         * to add to the peer connection.
         * @returns {void}
         */
        start(localTracks?: Array<JitsiLocalTrack>): void;
        /**
         * Begins the process of disconnecting from a remote peer and cleaning up
         * the peer connection.
         *
         * @returns {void}
         */
        stop(): void;
        /**
         * Instantiates a new {@code JingleSessionPC} by stubbing out the various
         * dependencies of {@code JingleSessionPC}.
         *
         * @private
         * @returns {JingleSessionPC}
         */
        private _createPeerConnection;
        /**
         * Create an instance of {@code RTC} as it is required for peer
         * connection creation by {@code JingleSessionPC}. An existing instance
         * of {@code RTC} from elsewhere should not be re-used because it is
         * a stateful grouping of utilities.
         */
        _rtc: RTC;
        /**
         * Callback invoked in response to an agreement to start a proxy connection.
         * The passed in jingle element should contain an SDP answer to a previously
         * sent SDP offer.
         *
         * @param {Element} jingleElement - The jingle element.
         * @private
         * @returns {void}
         */
        private _onSessionAccept;
        /**
         * Callback invoked in response to a request to start a proxy connection.
         * The passed in jingle element should contain an SDP offer.
         *
         * @param {Element} jingleElement - The jingle element.
         * @private
         * @returns {void}
         */
        private _onSessionInitiate;
        /**
         * Callback invoked in response to a request to disconnect an active proxy
         * connection. Cleans up tracks and the peer connection.
         *
         * @private
         * @returns {void}
         */
        private _onSessionTerminate;
        /**
         * Callback invoked in response to ICE candidates from the remote peer.
         * The passed in jingle element should contain an ICE candidate.
         *
         * @param {Element} jingleElement - The jingle element.
         * @private
         * @returns {void}
         */
        private _onTransportInfo;
    }
    import JingleSessionPC from "modules/xmpp/JingleSessionPC";
    import RTC from "modules/RTC/RTC";
}
declare module "modules/proxyconnection/ProxyConnectionService" {
    /**
     * Instantiates a new ProxyConnectionPC and ensures only one exists at a given
     * time. Currently it assumes ProxyConnectionPC is used only for screensharing
     * and assumes IQs to be used for communication.
     */
    export default class ProxyConnectionService {
        /**
         * Initializes a new {@code ProxyConnectionService} instance.
         *
         * @param {Object} options - Values to initialize the instance with.
         * @param {boolean} [options.convertVideoToDesktop] - Whether or not proxied video should be returned as a desktop
         * stream. Defaults to false.
         * @param {Object} [options.pcConfig] - The {@code RTCConfiguration} to use for the WebRTC peer connection.
         * @param {JitsiConnection} [options.jitsiConnection] - The {@code JitsiConnection} which will be used to fetch
         * TURN credentials for the P2P connection.
         * @param {Function} options.onRemoteStream - Callback to invoke when a remote video stream has been received and
         * converted to a {@code JitsiLocakTrack}. The {@code JitsiLocakTrack} will be passed in.
         * @param {Function} options.onSendMessage - Callback to invoke when a message has to be sent (signaled) out. The
         * arguments passed in are the jid to send the message to and the message.
         */
        constructor(options?: {
            convertVideoToDesktop?: boolean;
            pcConfig?: any;
            jitsiConnection?: JitsiConnection;
            onRemoteStream: Function;
            onSendMessage: Function;
        });
        /**
         * Holds a reference to the collection of all callbacks.
         *
         * @type {Object}
         */
        _options: any;
        /**
         * The active instance of {@code ProxyConnectionService}.
         *
         * @type {ProxyConnectionPC|null}
         */
        _peerConnection: ProxyConnectionPC | null;
        /**
         * Callback invoked when an error occurs that should cause
         * {@code ProxyConnectionPC} to be closed if the peer is currently
         * connected. Sends an error message/reply back to the peer.
         *
         * @param {string} peerJid - The peer jid with which the connection was
         * attempted or started, and to which an iq with error details should be
         * sent.
         * @param {string} errorType - The constant indicating the type of the error
         * that occurred.
         * @param {string} details - Optional additional data about the error.
         * @private
         * @returns {void}
         */
        private _onFatalError;
        /**
         * Formats and forwards a message an iq to be sent to a peer jid.
         *
         * @param {string} peerJid - The jid the iq should be sent to.
         * @param {Object} iq - The iq which would be sent to the peer jid.
         * @private
         * @returns {void}
         */
        private _onSendMessage;
        /**
         * Callback invoked when the remote peer of the {@code ProxyConnectionPC}
         * has offered a media stream. The stream is converted into a
         * {@code JitsiLocalTrack} for local usage if the {@code onRemoteStream}
         * callback is defined.
         *
         * @param {JitsiRemoteTrack} jitsiRemoteTrack - The {@code JitsiRemoteTrack}
         * for the peer's media stream.
         * @private
         * @returns {void}
         */
        private _onRemoteStream;
        /**
         * Parses a message object regarding a proxy connection to create a new
         * proxy connection or update and existing connection.
         *
         * @param {Object} message - A message object regarding establishing or
         * updating a proxy connection.
         * @param {Object} message.data - An object containing additional message
         * details.
         * @param {string} message.data.iq - The stringified iq which explains how
         * and what to update regarding the proxy connection.
         * @param {string} message.from - The message sender's full jid. Used for
         * sending replies.
         * @returns {void}
         */
        processMessage(message: {
            data: {
                iq: string;
            };
            from: string;
        }): void;
        /**
         * Instantiates and initiates a proxy peer connection.
         *
         * @param {string} peerJid - The jid of the remote client that should
         * receive messages.
         * @param {Array<JitsiLocalTrack>} localTracks - Initial media tracks to
         * send through to the peer.
         * @returns {void}
         */
        start(peerJid: string, localTracks?: Array<JitsiLocalTrack>): void;
        /**
         * Terminates any active proxy peer connection.
         *
         * @returns {void}
         */
        stop(): void;
        /**
         * Transforms a stringified xML into a XML element.
         *
         * @param {string} xml - The XML in string form.
         * @private
         * @returns {Object|null} An element version of the xml. Null will be returned
         * if an error is encountered during transformation.
         */
        private _convertStringToXML;
        /**
         * Helper for creating an instance of {@code ProxyConnectionPC}.
         *
         * @param {string} peerJid - The jid of the remote peer with which the
         * {@code ProxyConnectionPC} will be established with.
         * @param {Object} options - Additional defaults to instantiate the
         * {@code ProxyConnectionPC} with. See the constructor of ProxyConnectionPC
         * for more details.
         * @private
         * @returns {ProxyConnectionPC}
         */
        private _createPeerConnection;
        /**
         * Invoked when preemptively closing the {@code ProxyConnectionPC}.
         *
         * @private
         * @returns {void}
         */
        private _selfCloseConnection;
    }
    import ProxyConnectionPC from "modules/proxyconnection/ProxyConnectionPC";
}
declare module "modules/recording/recordingConstants" {
    export interface IRecordingConstants {
        error: {
            BUSY: string;
            ERROR: string;
            POLICY_VIOLATION: string;
            RESOURCE_CONSTRAINT: string;
            SERVICE_UNAVAILABLE: string;
            UNEXPECTED_REQUEST: string;
        };
        mode: {
            FILE: string;
            STREAM: string;
        };
        status: {
            OFF: string;
            ON: string;
            PENDING: string;
        };
    }
    const recordingConstants: IRecordingConstants;
    export default recordingConstants;
}
declare module "modules/statistics/PreCallTest" {
    export interface IPreCallResult {
        fractionalLoss: number;
        jitter: number;
        mediaConnectivity: boolean;
        rtt: number;
        throughput: number;
    }
    export interface IIceServer {
        credential?: string;
        urls: Array<string> | string;
        username?: string;
    }
    /**
     * Run a pre-call test to check the network conditions. It uses a TURN server to establish
     * a connection between two PeerConnections using the server as a relay. Afterwards it sends
     * some test traffic through a data channel to measure the network conditions, these are
     * recorded and returned through a Promise.
     *
     * @param {Array<IIceServer>} - The ICE servers to use for the test, these are passes to the PeerConnection constructor.
     * @returns {Promise<IPreCallResult | any>} - A Promise that resolves with the test results or rejects with an error.
     */
    export default function runPreCallTest(iceServers: Array<IIceServer>): Promise<IPreCallResult | string>;
}
declare module "modules/util/ScriptUtil" {
    export interface ILoadScriptOptions {
        async: boolean;
        errorCallback?: () => void;
        loadCallback?: () => void;
        prepend: boolean;
        relativeURL: boolean;
        src: string;
    }
    /**
     * Implements utility functions which facilitate the dealing with scripts such
     * as the download and execution of a JavaScript file.
     */
    const ScriptUtil: {
        /**
         * Loads a script from a specific source.
         * @param options
         * @param options.src the source from the which the script is to be (down)loaded
         * @param options.async true to asynchronously load the script or false to
         * synchronously load the script
         * @param options.prepend true to schedule the loading of the script as soon as
         * possible or false to schedule the loading of the script at the end of the
         * scripts known at the time
         * @param options.relativeURL whether we need load the library from url relative
         * to the url that lib-jitsi-meet was loaded. Useful when sourcing the
         * library from different location than the app that is using it
         * @param options.loadCallback on load callback function
         * @param options.errorCallback callback to be called on error loading the script
         */
        loadScript({ src, async, prepend, relativeURL, loadCallback, errorCallback }: ILoadScriptOptions): void;
    };
    export default ScriptUtil;
}
declare module "modules/webaudio/AudioMixer" {
    /**
     * The AudioMixer, as the name implies, mixes a number of MediaStreams containing audio tracks into a single
     * MediaStream.
     */
    export default class AudioMixer {
        private _started;
        private _streamsToMix;
        private _streamMSSArray;
        private _audioContext?;
        private _mixedMSD?;
        /**
         * Create AudioMixer instance.
         */
        constructor();
        /**
         * Add audio MediaStream to be mixed, if the stream doesn't contain any audio tracks it will be ignored.
         *
         * @param {MediaStream} stream - MediaStream to be mixed.
         */
        addMediaStream(stream: MediaStream): void;
        /**
         * At this point a WebAudio ChannelMergerNode is created and and the two associated MediaStreams are connected to
         * it; the resulting mixed MediaStream is returned.
         *
         * @returns {Nullable<MediaStream>} - MediaStream containing added streams mixed together, or null if no MediaStream
         * is added.
         */
        start(): Nullable<MediaStream>;
        /**
         * Disconnect MediaStreamAudioSourceNode and clear references.
         *
         * @returns {void}
         */
        reset(): void;
    }
}
declare module "version" {
    export const COMMIT_HASH = "3884dbd5";
}
declare module "JitsiMeetJS" {
    import JitsiConference, { IConferenceOptions } from "JitsiConference";
    import * as JitsiConferenceErrors from "JitsiConferenceErrors";
    import { JitsiConferenceEvents } from "JitsiConferenceEvents";
    import JitsiConnection, { IConnectionOptions } from "JitsiConnection";
    import * as JitsiConnectionErrors from "JitsiConnectionErrors";
    import { JitsiConnectionEvents } from "JitsiConnectionEvents";
    import JitsiMediaDevices from "JitsiMediaDevices";
    import { JitsiMediaDevicesEvents } from "JitsiMediaDevicesEvents";
    import JitsiTrackError from "JitsiTrackError";
    import * as JitsiTrackErrors from "JitsiTrackErrors";
    import { JitsiTrackEvents } from "JitsiTrackEvents";
    import * as JitsiTranscriptionStatus from "JitsiTranscriptionStatus";
    import JitsiLocalTrack from "modules/RTC/JitsiLocalTrack";
    import { RTCStatsEvents } from "modules/RTCStats/RTCStatsEvents";
    import { TrackStreamingStatus } from "modules/connectivity/TrackStreamingStatus";
    import { DetectionEvents } from "modules/detection/DetectionEvents";
    import TrackVADEmitter from "modules/detection/TrackVADEmitter";
    import ProxyConnectionService from "modules/proxyconnection/ProxyConnectionService";
    import { IIceServer, IPreCallResult } from "modules/statistics/PreCallTest";
    import * as VideoSIPGWConstants from "modules/videosipgw/VideoSIPGWConstants";
    import AudioMixer from "modules/webaudio/AudioMixer";
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    import { ConnectionQualityEvents } from "service/connectivity/ConnectionQualityEvents";
    import { E2ePingEvents } from "service/e2eping/E2ePingEvents";
    interface ICreateLocalTrackOptions {
        cameraDeviceId?: string;
        devices?: any[];
        fireSlowPromiseEvent?: boolean;
        micDeviceId?: string;
        resolution?: string;
    }
    type desktopSharingSourceType = 'screen' | 'window';
    interface IJitsiMeetJSOptions {
        analytics?: {
            rtcstatsLogFlushSizeBytes?: number;
            rtcstatsStoreLogs?: boolean;
        };
        audioLevelsInterval?: number;
        desktopSharingSources?: Array<desktopSharingSourceType>;
        disableAudioLevels?: boolean;
        disableThirdPartyRequests?: boolean;
        enableAnalyticsLogging?: boolean;
        enableWindowOnErrorHandler?: boolean;
        externalStorage?: Storage;
        flags?: {
            runInLiteMode?: boolean;
            ssrcRewritingEnabled?: boolean;
        };
        pcStatsInterval?: number;
    }
    interface ICreateLocalTrackFromMediaStreamOptions {
        mediaType: MediaType;
        sourceType: string;
        stream: MediaStream;
        track: MediaStreamTrack;
        videoType?: VideoType;
    }
    export interface IJoinConferenceOptions {
        conferenceOptions?: IConferenceOptions;
        connectionOptions?: IConnectionOptions;
        jaas?: {
            release?: string;
            useStaging?: boolean;
        };
        tracks?: JitsiLocalTrack[];
    }
    /**
     * The public API of the Jitsi Meet library (a.k.a. `JitsiMeetJS`).
     */
    const JitsiMeetJS: {
        JitsiConnection: typeof JitsiConnection;
        /**
         * `ProxyConnectionService` is used to connect a remote peer to a local Jitsi participant without going
         * through a Jitsi conference. It is currently used for room integration development, specifically wireless
         * screensharing. Its API is experimental and will likely change; usage of it is advised against.
         */
        ProxyConnectionService: typeof ProxyConnectionService;
        /**
         * Registers new global logger transport to the library logging framework.
         *
         * @param globalTransport
         * @see Logger.addGlobalTransport
         */
        addGlobalLogTransport(globalTransport: any): void;
        /**
         * Analytics configuration.
         */
        analytics: unknown;
        /**
         * Constants used throughout the library.
         */
        constants: {
            recording: import("modules/recording/recordingConstants").IRecordingConstants;
            sipVideoGW: typeof VideoSIPGWConstants;
            trackStreamingStatus: typeof TrackStreamingStatus;
            transcriptionStatus: typeof JitsiTranscriptionStatus;
        };
        /**
         * Create AudioMixer, which is essentially a wrapper over web audio ChannelMergerNode. It essentially allows the
         * user to mix multiple MediaStreams into a single one.
         *
         * @returns {AudioMixer}
         */
        createAudioMixer(): AudioMixer;
        /**
         * Creates local media tracks.
         *
         * @param options Object with properties / settings specifying the tracks which should be created. should be
         * created or some additional configurations about resolution for example.
         * @param {Array} options.effects optional effects array for the track
         * @param {Array} options.devices the devices that will be requested
         * @param {string} options.resolution resolution constraints
         * @param {string} options.cameraDeviceId
         * @param {string} options.micDeviceId
         *
         * @returns {Promise.<{Array.<JitsiTrack>}, JitsiTrackError>} A promise that returns an array of created
         * JitsiTracks if resolved, or a JitsiTrackError if rejected.
         */
        createLocalTracks(options?: ICreateLocalTrackOptions): Promise<JitsiLocalTrack[] | JitsiTrackError>;
        /**
         * Manually create JitsiLocalTrack's from the provided track info, by exposing the RTC method
         *
         * @param {Array<ICreateLocalTrackFromMediaStreamOptions>} tracksInfo - array of track information
         * @returns {Array<JitsiLocalTrack>} - created local tracks
         */
        createLocalTracksFromMediaStreams(tracksInfo: ICreateLocalTrackFromMediaStreamOptions[]): JitsiLocalTrack[];
        /**
         * Create a TrackVADEmitter service that connects an audio track to an VAD (voice activity detection) processor in
         * order to obtain VAD scores for individual PCM audio samples.
         *
         * @param {string} localAudioDeviceId - The target local audio device.
         * @param {number} sampleRate - Sample rate at which the emitter will operate. Possible values  256, 512, 1024,
         * 4096, 8192, 16384. Passing other values will default to closes neighbor.
         * I.e. Providing a value of 4096 means that the emitter will process 4096 PCM samples at a time, higher values mean
         * longer calls, lowers values mean more calls but shorter.
         * @param {Object} vadProcessor - VAD Processors that does the actual compute on a PCM sample.The processor needs
         * to implement the following functions:
         * - <tt>getSampleLength()</tt> - Returns the sample size accepted by calculateAudioFrameVAD.
         * - <tt>getRequiredPCMFrequency()</tt> - Returns the PCM frequency at which the processor operates.
         * i.e. (16KHz, 44.1 KHz etc.)
         * - <tt>calculateAudioFrameVAD(pcmSample)</tt> - Process a 32 float pcm sample of getSampleLength size.
         * @returns {Promise<TrackVADEmitter>}
         */
        createTrackVADEmitter(localAudioDeviceId: any, sampleRate: any, vadProcessor: any): Promise<TrackVADEmitter>;
        errorTypes: {
            JitsiTrackError: typeof JitsiTrackError;
        };
        errors: {
            conference: typeof JitsiConferenceErrors;
            connection: typeof JitsiConnectionErrors;
            track: typeof JitsiTrackErrors;
        };
        events: {
            conference: typeof JitsiConferenceEvents;
            connection: typeof JitsiConnectionEvents;
            connectionQuality: typeof ConnectionQualityEvents;
            detection: typeof DetectionEvents;
            e2eping: typeof E2ePingEvents;
            mediaDevices: typeof JitsiMediaDevicesEvents;
            rtcstats: typeof RTCStatsEvents;
            track: typeof JitsiTrackEvents;
        };
        /**
         * Go through all audio devices on the system and return one that is active, i.e. has audio signal.
         *
         * @returns Promise<Object> - Object containing information about the found device.
         */
        getActiveAudioDevice(): Promise<import("modules/detection/ActiveDeviceDetector").IActiveDeviceInfo>;
        /**
         * Initializes the library.
         *
         * @param options - The options to use for initializing the library.
         * @returns {void}
         */
        init(options?: IJitsiMeetJSOptions): void;
        /**
         * Checks if local tracks can collect stats and collection is enabled.
         *
         * @returns {boolean} True if local stats are being collected.
         */
        isCollectingLocalStats(): boolean;
        /**
         * Returns whether the desktop sharing is enabled or not.
         *
         * @returns {boolean}
         */
        isDesktopSharingEnabled(): boolean;
        /**
         * Checks if the current environment supports having multiple audio
         * input devices in use simultaneously.
         *
         * @returns {boolean} True if multiple audio input devices can be used.
         */
        isMultipleAudioInputSupported(): any;
        /**
         * Returns whether the current execution environment supports WebRTC (for
         * use within this library).
         *
         * @returns {boolean} `true` if WebRTC is supported in the current
         * execution environment (for use within this library); `false`,
         * otherwise.
         */
        isWebRtcSupported(): boolean;
        /**
         * Simple way to create a {JitsiConference}. All options are optional and sane defaults
         * will be chosen for JaaS users.
         *
         * @param roomName - The name of the conference.
         * @param appId - The application id (also known as tenant).
         * @param token - The token (JWT) to use for authentication.
         * @param options - The options to use for joining the conference.
         */
        joinConference(roomName: string, appId?: string, token?: Nullable<string>, options?: IJoinConferenceOptions): Promise<JitsiConference>;
        logLevels: any;
        mediaDevices: JitsiMediaDevices;
        /**
         * Removes global logging transport from the library logging framework.
         *
         * @param globalTransport
         * @see Logger.removeGlobalTransport
         */
        removeGlobalLogTransport(globalTransport: any): void;
        /**
         * Expose rtcstats to the public API.
         */
        rtcstats: {
            /**
             * Checks if the rtcstats trace is available.
             * The trace is the abstraction for the underlying rtcstats websocket connection.
             *
             * @returns {boolean} <tt>true</tt> if the rtcstats trace is available or
             * <tt>false</tt> otherwise.
             */
            isTraceAvailable(): boolean;
            /**
             * Events generated by rtcstats, such as PeerConnections state,
             * and websocket connection state.
             *
             * @param {RTCStatsEvents} event - The event name.
             * @param {function} handler - The event handler.
             */
            on(event: any, handler: any): void;
            /**
             * Sends identity data to the rtcstats server. This data is used
             * to identify the specifics of a particular client, it can be any object
             * and will show in the generated rtcstats dump under "identity" entries.
             *
             * @param {Object} identityData - Identity data to send.
             * @returns {void}
             */
            sendIdentityEntry(identityData: any): void;
            /**
             * Sends a stats entry to rtcstats server.
             * @param {string} statsType - The type of stats to send.
             * @param {Object} data - The stats data to send.
             */
            sendStatsEntry(statsType: RTCStatsEvents, data?: Optional<any>): void;
        };
        /**
         * Run a pre-call test to check the network conditions.
         *
         * @param {IIceServer} iceServers  - The ICE servers to use for the test,
         * @returns {Promise<PreCallResult | any>} - A Promise that resolves with the test results or rejects with an error
         * message.
         */
        runPreCallTest(iceServers: IIceServer[]): Promise<IPreCallResult | any>;
        /**
        * Sets global options which will be used by all loggers. Changing these
        * works even after other loggers are created.
        *
        * @param options
        * @see Logger.setGlobalOptions
        */
        setGlobalLogOptions(options: any): void;
        /**
         * Sets the log level to the <tt>Logger</tt> instance.
         *
         * @param {Logger.levels} level the logging level to be set
         * @see Logger.setLogLevel
         */
        setLogLevel(level: any): void;
        /**
         * Sets the log level to the <tt>Logger</tt> instance with given id.
         *
         * @param {Logger.levels} level the logging level to be set
         * @param {string} id the logger id to which new logging level will be set.
         * Usually it's the name of the JavaScript source file including the path
         * ex. "modules/xmpp/ChatRoom.js"
         */
        setLogLevelById(level: any, id: any): void;
        /**
         * Informs lib-jitsi-meet about the current network status.
         *
         * @param {object} state - The network info state.
         * @param {boolean} state.isOnline - `true` if the internet connectivity is online or `false`
         * otherwise.
         */
        setNetworkInfo({ isOnline }: {
            isOnline: any;
        }): void;
        /**
         * Represents a hub/namespace for utility functionality which may be of
         * interest to lib-jitsi-meet clients.
         */
        util: {
            ScriptUtil: {
                loadScript({ src, async, prepend, relativeURL, loadCallback, errorCallback }: import("modules/util/ScriptUtil").ILoadScriptOptions): void;
            };
            browser: import("modules/browser/BrowserCapabilities").default;
        };
        version: string;
    };
    export default JitsiMeetJS;
}
declare module "test-setup-polyfill" { }
declare module "modules/RTC/MockClasses" {
    import { MediaType } from "service/RTC/MediaType";
    import { VideoType } from "service/RTC/VideoType";
    import Listenable from "modules/util/Listenable";
    /**
     * Mock {@link TraceablePeerConnection} - add things as needed, but only things useful for all tests.
     */
    export class MockPeerConnection {
        private _usesUnifiedPlan;
        private peerconnection;
        private _simulcast;
        /**
         * Constructor.
         *
         * @param {string} id RTC id
         * @param {boolean} usesUnifiedPlan
         * @param {boolean} simulcast
         */
        constructor(id: string, usesUnifiedPlan: boolean, simulcast: boolean);
        /**
         * {@link TraceablePeerConnection.localDescription}.
         *
         * @returns {Object}
         */
        get localDescription(): {
            sdp: string;
        };
        /**
         * {@link TraceablePeerConnection.remoteDescription}.
         *
         * @returns {Object}
         */
        get remoteDescription(): {
            sdp: string;
        };
        /**
         * {@link TracablePeerConnection.calculateExpectedSendResolution}.
         * @param {JitsiLocalTrack} localTrack
         * @returns {number}
         */
        calculateExpectedSendResolution(localTrack: MockJitsiLocalTrack): number;
        /**
         * {@link TraceablePeerConnection.createAnswer}.
         *
         * @returns {Promise<Object>}
         */
        createAnswer(): Promise<object>;
        /**
         * {@link TraceablePeerConnection.doesTrueSimulcast}.
         * @returns {boolean}
         */
        doesTrueSimulcast(): boolean;
        /**
         * Returns the list of the codecs negotiated.
         * @returns {Array<string>}
         */
        getConfiguredVideoCodecs(): string[];
        /**
         * {@link TraceablePeerConnection.getDesiredMediaDirection}.
         */
        getDesiredMediaDirection(): string;
        /**
         * {@link TraceablePeerConnection.isSpatialScalabilityOn}.
         *
         * @returns {boolean}
         */
        isSpatialScalabilityOn(): boolean;
        /**
         * {@link TraceablePeerConnection.processLocalSdpForTransceiverInfo}.
         *
              * @returns {void}
         */
        processLocalSdpForTransceiverInfo(): void;
        /**
         * {@link TraceablePeerConnection.setLocalDescription}.
         *
         * @returns {Promise<void>}
         */
        setLocalDescription(): Promise<void>;
        /**
         * {@link TraceablePeerConnection.setRemoteDescription}.
         *
         * @returns {Promise<void>}
         */
        setRemoteDescription(): Promise<void>;
        /**
         * {@link TraceablePeerConnection.setSenderVideoConstraints}.
         *
         * Sets the sender video constraints.
         * @returns {void}
         */
        setSenderVideoConstraints(): void;
        /**
         * {@link TraceablePeerConnection.setVideoTransferActive}.
         */
        setVideoTransferActive(): boolean;
        /**
         * {@link TraceablePeerConnection.updateRemoteSources}.
         *
         * Updates the remote sources.
         * @returns {void}
         */
        updateRemoteSources(): void;
        /**
         * {@link TraceablePeerConnection.usesUnifiedPlan}.
         */
        usesUnifiedPlan(): boolean;
        /**
         * {@link TraceablePeerConnection.getLocalVideoTracks}.
         */
        getLocalVideoTracks(): any[];
    }
    /**
     * Mock {@link RTC} - add things as needed, but only things useful for all tests.
     */
    export class MockRTC extends Listenable {
        private pc;
        private forwardedSources;
        /**
         * {@link RTC.createPeerConnection}.
         *
         * @returns {MockPeerConnection}
         */
        createPeerConnection(id: string, usesUnifiedPlan: boolean, simulcast: boolean): MockPeerConnection;
        /**
         * Returns the list of sources that the bridge is forwarding to the client.
         * @returns {Array<string>}
         */
        getForwardedSources(): string[];
    }
    /**
     * MockSignalingLayerImpl
     */
    export class MockSignalingLayerImpl {
        private _remoteSourceState;
        /**
         * A constructor
         */
        constructor();
        /**
         * Returns the muted state, videoType and codec info received in presence.
         * @param {string} endpointId
         * @returns Optional<Object>
         */
        getPeerMediaInfo(endpointId: string): Optional<object>;
        /**
         * Updates the media info for peer on join/leave.
         * @param {boolean} isJoin - whether endpoint is joining or leaving the call
         * @param {string} endpointId - endpoint id
         * @param {Array<string>} codecList - new codec list published in presence
         * @param {string} codecType - legacy codec setting published in presence
         */
        setPeerMediaInfo(isJoin: boolean, endpointId: string, codecList: string[], codecType: string): void;
    }
    /**
     * MockTrack
     */
    export class MockTrack {
        private height;
        /**
         * A constructor
         */
        constructor(height: number);
        /**
         * Returns height.
         * @returns {object}
         */
        getSettings(): {
            height: number;
        };
        /**
         * Gets the height value.
         * @returns {number} The height.
         */
        getHeight(): number;
    }
    /**
     * MockJitsiLocalTrack
     */
    export class MockJitsiLocalTrack {
        private resolution;
        private track;
        private type;
        private videoType;
        /**
         * A constructor
         */
        constructor(height: number, mediaType: MediaType, videoType: VideoType);
        /**
         * Returns the height.
         * @returns {number}
         */
        getHeight(): number;
        /**
         * Returns the capture resolution.
         * @returns {number}
         */
        getCaptureResolution(): number;
        /**
         * Returns track.
         * @returns {MockTrack}
         */
        getTrack(): MockTrack;
        /**
         * Returns media type.
         * @returns {MediaType}
         */
        getType(): MediaType;
        /**
         * Returns video type.
         * @returns {VideoType}
         */
        getVideoType(): VideoType;
    }
}
declare module "modules/detection/VADReportingService" {
    import EventEmitter from "modules/util/EventEmitter";
    import TrackVADEmitter from "modules/detection/TrackVADEmitter";
    export interface IVADScore {
        deviceId: string;
        score: number;
        timestamp: number | Date;
    }
    export interface IVADDeviceContext {
        deviceInfo: MediaDeviceInfo;
        scoreArray: IVADScore[];
        vadEmitter: TrackVADEmitter;
    }
    /**
     * Voice activity detection reporting service. The service create TrackVADEmitters for the provided devices and
     * publishes an average of their VAD score over the specified interval via EventEmitter.
     * The service is not reusable if destroyed a new one needs to be created, i.e. when a new device is added to the system
     * a new service needs to be created and the old discarded.
     */
    export default class VADReportingService extends EventEmitter {
        private _contextMap;
        private _destroyed;
        private _intervalDelay;
        private _intervalId;
        /**
         *
         * @param {number} intervalDelay - Delay at which to publish VAD score for monitored devices.
         *
         * @constructor
         */
        constructor(intervalDelay: number);
        /**
         * Factory methods that creates the TrackVADEmitters for the associated array of devices and instantiates
         * a VADReportingService.
         *
         * @param {Array<MediaDeviceInfo>} micDeviceList - Device list that is monitored inside the service.
         * @param {number} intervalDelay - Delay at which to publish VAD score for monitored devices.
         * @param {Object} createVADProcessor - Function that creates a Voice activity detection processor. The processor
         * needs to implement the following functions:
         * - <tt>getSampleLength()</tt> - Returns the sample size accepted by getSampleLength.
         * - <tt>getRequiredPCMFrequency()</tt> - Returns the PCM frequency at which the processor operates.
         * - <tt>calculateAudioFrameVAD(pcmSample)</tt> - Process a 32 float pcm sample of getSampleLength size.
         *
         * @returns {Promise<VADReportingService>}
         */
        static create(micDeviceList: MediaDeviceInfo[], intervalDelay: number, createVADProcessor: () => Promise<{
            calculateAudioFrameVAD: (pcmSample: Float32Array) => number;
            getRequiredPCMFrequency: () => number;
            getSampleLength: () => number;
        }>): Promise<VADReportingService>;
        /**
         * Destroy TrackVADEmitters and clear the context map.
         *
         * @returns {void}
         */
        _clearContextMap(): void;
        /**
         * Set the watched device contexts.
         *
         * @param {Array<IVADDeviceContext>} vadContextArray - List of mics.
         * @returns {void}
         */
        _setVADContextArray(vadContextArray: IVADDeviceContext[]): void;
        /**
         * Start the setInterval reporting process.
         *
         * @returns {void}.
         */
        _startPublish(): void;
        /**
         * Function called at set interval with selected compute. The result will be published on the set callback.
         *
         * @returns {void}
         * @fires VAD_REPORT_PUBLISHED
         */
        _reportVadScore(): void;
        /**
         * Callback method passed to vad emitters in order to publish their score.
         *
         * @param {Object} vadScore -VAD score emitted by.
         * @param {Date}   vadScore.timestamp - Exact time at which processed PCM sample was generated.
         * @param {number} vadScore.score - VAD score on a scale from 0 to 1 (i.e. 0.7).
         * @param {string} vadScore.deviceId - Device id of the associated track.
         * @returns {void}
         * @listens VAD_SCORE_PUBLISHED
         */
        _devicePublishVADScore(vadScore: IVADScore): void;
        /**
         * Destroy the VADReportingService, stops the setInterval reporting, destroys the emitters and clears the map.
         * After this call the instance is no longer usable.
         *
         * @returns {void}.
         */
        destroy(): void;
    }
}
declare module "modules/e2ee/Context" {
    const UNENCRYPTED_BYTES: {
        delta: number;
        key: number;
        undefined: number;
    };
    export interface IContextOptions {
        sharedKey?: boolean | ArrayBuffer;
    }
    export interface IEncodedFrame {
        data: ArrayBuffer;
        getMetadata: () => {
            synchronizationSource: number;
        };
        timestamp: number;
        type?: keyof typeof UNENCRYPTED_BYTES;
    }
    export interface ITransformStreamDefaultController {
        enqueue: (frame: IEncodedFrame) => void;
    }
    export interface ICryptoKeyData {
        encryptionKey: CryptoKey;
        material: CryptoKey;
    }
    /**
     * Per-participant context holding the cryptographic keys and
     * encode/decode functions
     */
    export class Context {
        private _cryptoKeyRing;
        private _currentKeyIndex;
        private _sendCounts;
        private _sharedKey;
        private _enabled;
        /**
         * @param {Object} options
         */
        constructor({ sharedKey }?: IContextOptions);
        /**
         * Function that will decrypt the given encoded frame. If the decryption fails, it will
         * ratchet the key for up to RATCHET_WINDOW_SIZE times.
         *
         * @param {RTCEncodedVideoFrame|RTCEncodedAudioFrame} encodedFrame - Encoded video frame.
         * @param {number} keyIndex - the index of the decryption data in _cryptoKeyRing array.
         * @param {number} ratchetCount - the number of retries after ratcheting the key.
         * @returns {Promise<RTCEncodedVideoFrame|RTCEncodedAudioFrame>} - The decrypted frame.
         * @private
         */
        private _decryptFrame;
        /**
         * Construct the IV used for AES-GCM and sent (in plain) with the packet similar to
         * https://tools.ietf.org/html/rfc7714#section-8.1
         * It concatenates
         * - the 32 bit synchronization source (SSRC) given on the encoded frame,
         * - the 32 bit rtp timestamp given on the encoded frame,
         * - a send counter that is specific to the SSRC. Starts at a random number.
         * The send counter is essentially the pictureId but we currently have to implement this ourselves.
         * There is no XOR with a salt. Note that this IV leaks the SSRC to the receiver but since this is
         * randomly generated and SFUs may not rewrite this is considered acceptable.
         * The SSRC is used to allow demultiplexing multiple streams with the same key, as described in
         *   https://tools.ietf.org/html/rfc3711#section-4.1.1
         * The RTP timestamp is 32 bits and advances by the codec clock rate (90khz for video, 48khz for
         * opus audio) every second. For video it rolls over roughly every 13 hours.
         * The send counter will advance at the frame rate (30fps for video, 50fps for 20ms opus audio)
         * every second. It will take a long time to roll over.
         *
         * See also https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
         */
        private _makeIV;
        /**
         * Sets a set of keys and resets the sendCount.
         * decryption.
         * @param {Object} keys set of keys.
         * @param {Number} keyIndex optional
         * @private
         */
        private _setKeys;
        /**
         * Enables or disables the E2EE context. When disabled packets are passed through.
         * @param {boolean} enabled True if E2EE is enabled, false otherwise.
         */
        setEnabled(enabled: boolean): void;
        /**
         * Derives the different subkeys and starts using them for encryption or
         * decryption.
         * @param {Uint8Array|ArrayBuffer|false} key bytes. Pass false to disable.
         * @param {Number} keyIndex
         */
        setKey(key: Uint8Array | ArrayBuffer | false, keyIndex?: number): Promise<void>;
        /**
         * Function that will be injected in a stream and will encrypt the given encoded frames.
         *
         * @param {RTCEncodedVideoFrame|RTCEncodedAudioFrame} encodedFrame - Encoded video frame.
         * @param {ITransformStreamDefaultController} controller - TransportStreamController.
         *
         * The VP8 payload descriptor described in
         * https://tools.ietf.org/html/rfc7741#section-4.2
         * is part of the RTP packet and not part of the frame and is not controllable by us.
         * This is fine as the SFU keeps having access to it for routing.
         *
         * The encrypted frame is formed as follows:
         * 1) Leave the first (10, 3, 1) bytes unencrypted, depending on the frame type and kind.
         * 2) Form the GCM IV for the frame as described above.
         * 3) Encrypt the rest of the frame using AES-GCM.
         * 4) Allocate space for the encrypted frame.
         * 5) Copy the unencrypted bytes to the start of the encrypted frame.
         * 6) Append the ciphertext to the encrypted frame.
         * 7) Append the IV.
         * 8) Append a single byte for the key identifier.
         * 9) Enqueue the encrypted frame for sending.
         */
        encodeFunction(encodedFrame: IEncodedFrame, controller: ITransformStreamDefaultController): Promise<void> | void;
        /**
         * Function that will be injected in a stream and will decrypt the given encoded frames.
         *
         * @param {RTCEncodedVideoFrame|RTCEncodedAudioFrame} encodedFrame - Encoded video frame.
         * @param {ITransformStreamDefaultController} controller - TransportStreamController.
         */
        decodeFunction(encodedFrame: IEncodedFrame, controller: ITransformStreamDefaultController): Promise<void>;
    }
}
declare module "modules/e2ee/Worker" { }
declare module "modules/e2ee/utils" {
    /**
     * Compares two byteArrays for equality.
     */
    export function isArrayEqual(a1: Uint8Array, a2: Uint8Array): boolean;
}
declare module "modules/qualitycontrol/MockClasses" {
    import { VideoType } from "service/RTC/VideoType";
    import { MockRTC, MockSignalingLayerImpl } from "modules/RTC/MockClasses";
    import Listenable from "modules/util/Listenable";
    import JingleSessionPC from "modules/xmpp/JingleSessionPC";
    /**
     * MockParticipant
     */
    export class MockParticipant {
        id: string;
        /**
         * A constructor...
         */
        constructor(id: string);
        /**
         * Returns the endpoint id of the participant.
         * @returns <string>
         */
        getId(): string;
    }
    /**
     * MockLocalTrack
     */
    export class MockLocalTrack {
        maxEnabledResolution: number;
        rtcId: string;
        videoType: VideoType;
        captureResolution: number;
        /**
         * Constructor
         * @param {number} resolution
         * @param {VideoType} videoType
         */
        constructor(id: string, resolution: number, videoType: VideoType);
        /**
         * Gets the capture resolution of the mock local track.
         * @returns - The capture resolution.
         */
        getCaptureResolution(): number;
        /**
         * Returns the video type of the mock local track.
         * @returns {VideoType}
         */
        getVideoType(): VideoType;
    }
    /**
     * MockConference
     */
    export class MockConference extends Listenable {
        options: {
            config: {};
        };
        activeMediaSession: JingleSessionPC;
        jvbJingleSession: JingleSessionPC;
        mediaSessions: JingleSessionPC[];
        participants: MockParticipant[];
        rtc: MockRTC;
        _signalingLayer: MockSignalingLayerImpl;
        /**
         * A constructor...
         */
        constructor(rtc: MockRTC);
        /**
         * Add a mock participant to the conference
         * @param {MockParticipant} participant
         * @param {Array<string>} codecList
         * @param {String} codecType
         */
        addParticipant(participant: MockParticipant, codecList: Array<string>, codecType: string): void;
        /**
         * Returns the active media session.
         * @returns {JingleSessionPC}
         */
        getActiveMediaSession(): JingleSessionPC;
        /**
         * Returns a list of forwarded sources.
         * @returns {Array<string>}
         */
        getForwardedSources(): string[];
        /**
         * Returns the list of participants.
         * @returns Array<MockParticipant>
         */
        getParticipants(): Array<MockParticipant>;
        /**
         * Checks if E2EE is enabled.
         * @returns {boolean}
         */
        isE2EEEnabled(): boolean;
        /**
         * Removes the participant from the conference.
         * @param {MockParticipant} endpoint
         */
        removeParticipant(endpoint: MockParticipant): void;
    }
}
declare module "modules/red/red" {
    /**
     * An encoder for RFC 2198 redundancy using WebRTC Insertable Streams.
     */
    export class RFC2198Encoder {
        targetRedundancy: number;
        frameBuffer: any[];
        payloadType: Optional<number>;
        /**
         * @param {number} targetRedundancy the desired amount of redundancy.
         */
        constructor(targetRedundancy?: number);
        /**
         * Set the desired level of redudancy. 4 means "four redundant frames plus current frame.
         * It is possible to reduce this to 0 to minimize the overhead to one byte.
         * @param {number} targetRedundancy the desired amount of redundancy.
         */
        setRedundancy(targetRedundancy: number): void;
        /**
         * Set the "inner opus payload type". This is typically our RED payload type that we tell
         * the other side as our opus payload type. Can be queried from the sender using getParameters()
         * after setting the answer.
         * @param {number} payloadType the payload type to use for opus.
         */
        setPayloadType(payloadType: number): void;
        /**
         * This is the actual transform to add redundancy to a raw opus frame.
         * @param {RTCEncodedAudioFrame} encodedFrame - Encoded audio frame.
         * @param {TransformStreamDefaultController} controller - TransportStreamController.
         */
        addRedundancy(encodedFrame: RTCEncodedAudioFrame, controller: TransformStreamDefaultController): void;
    }
}
declare module "modules/sdp/SampleSdpStrings" {
    import * as transform from 'sdp-transform';
    const _default_6: {
        readonly firefoxP2pSdp: transform.SessionDescription;
        readonly firefoxSdp: transform.SessionDescription;
        readonly flexFecSdp: transform.SessionDescription;
        readonly multiCodecVideoSdp: transform.SessionDescription;
        readonly plainVideoSdp: transform.SessionDescription;
        readonly recvOnlySdp: transform.SessionDescription;
        readonly recvOnlySdpStr: string;
        readonly recvOnlySdpStrChrome: string;
        readonly rtxVideoSdp: transform.SessionDescription;
        readonly simulcastDifferentSsrcSdpStr: string;
        readonly simulcastNoRtxSdp: transform.SessionDescription;
        readonly simulcastRtxSdp: transform.SessionDescription;
        readonly simulcastRtxSdpReplacedTrack: transform.SessionDescription;
        readonly simulcastSdp: transform.SessionDescription;
        readonly simulcastSdpStr: string;
    };
    export default _default_6;
}
declare module "modules/util/StringUtils" {
    /**
     * Implements a simple hash code for a string (see
     * https://en.wikipedia.org/wiki/Java_hashCode()).
     *
     * @param {string} string - The string to return a hash of.
     * @return {number} the integer hash code of the string.
     */
    function integerHash(string: string): number;
    export default integerHash;
}
declare module "modules/util/TestUtils" {
    /**
     * Returns a Promise resolved after {@code process.nextTick} with the option to advance Jasmine timers.
     *
     * @param {number} [advanceTimer] - the value to be passed to Jasmine clock's tick method.
     * @returns {Promise<void>}
     */
    export function nextTick(advanceTimer?: number): Promise<void>;
}
declare module "modules/xmpp/MockClasses" {
    import { Strophe } from 'strophe.js';
    import Listenable from "modules/util/Listenable";
    /**
     * Mock {@link ChatRoom}.
     */
    export class MockChatRoom extends Listenable {
        /**
         * {@link ChatRoom.addPresenceListener}.
         */
        addPresenceListener(): void;
    }
    /**
     * Mock Strophe connection.
     */
    export interface IProto {
        socket?: WebSocket;
    }
    export class MockStropheConnection extends Listenable {
        private _connectCb?;
        private _proto;
        sentIQs: any[];
        /**
         * A constructor...
         */
        constructor();
        /**
         * XMPP service URL.
         *
         * @returns {string}
         */
        get service(): string;
        /**
         * {@see Strophe.Connection.connect}
         */
        connect(jid: string, pass: string, callback: (status: Strophe.Status) => void): void;
        /**
         * {@see Strophe.Connection.disconnect}
         */
        disconnect(): void;
        /**
         * Simulates transition to the new connection status.
         *
         * @param {Strophe.Status} newState - The new connection status to set.
         * @returns {void}
         */
        simulateConnectionState(newState: Strophe.Status): void;
        /**
         * {@see Strophe.Connection.sendIQ}.
         */
        sendIQ(iq: any, resultCb?: () => void): void;
        /**
         * {@see Strophe.Connection.registerSASLMechanisms}.
         */
        registerSASLMechanisms(): void;
    }
}
declare module "tools/gen-version" {
    export {};
}
