import { getLogger } from '@jitsi/logger';
import { $iq } from 'strophe.js';
import { handleStropheError } from '../xmpp/StropheErrorHandler';
import { getSessionIdFromIq } from './recordingXMLUtils';
const logger = getLogger('recording:JibriSession');
/**
 * Represents a recording session.
 */
export default class JibriSession {
    /**
     * Initializes a new JibriSession instance.
     *
     * @constructor
     */
    constructor(options = {}) {
        this._jibriJid = null;
        this._statusFromJicofo = '';
        this._connection = options.connection;
        this._mode = options.mode;
        this._jibriJid = null;
        this._statusFromJicofo = '';
        this._setSessionID(options.sessionID);
        this.setStatus(options.status);
        this._focusMucJid = options.focusMucJid;
    }
    /**
     * Returns the error related to the session instance, if any.
     *
     * @returns {Optional<string>}
     */
    getError() {
        return this._error;
    }
    /**
     * Returns the session ID of the session instance.
     *
     * @returns {Optional<string>}
     */
    getID() {
        return this._sessionID;
    }
    /**
     * Returns the initiator of the session instance.
     *
     * @returns {JitsiParticipant|string} The participant that started the session.
     */
    getInitiator() {
        return this._initiator;
    }
    /**
     * Returns the streaming URL of the session.
     *
     * @returns {Optional<string>}
     */
    getLiveStreamViewURL() {
        return this._liveStreamViewURL;
    }
    /**
     * Returns the current status of the session.
     *
     * @returns {Optional<string>}
     */
    getStatus() {
        // If _status is not set fallback to the status reported by jicofo.
        if (this._status) {
            return this._status;
        }
        return this._statusFromJicofo;
    }
    /**
     * @returns {Optional<string>}
     */
    getJibriJid() {
        return this._jibriJid;
    }
    /**
     * Returns the jid of the participant that stopped the session.
     *
     * @returns {JitsiParticipant|string} The participant that stopped the session.
     */
    getTerminator() {
        return this._terminator;
    }
    /**
     * Returns the current recording mode of the session, such as "file".
     *
     * @returns {string}
     */
    getMode() {
        return this._mode;
    }
    /**
     * Sets the last known error message related to the session.
     *
     * @param {string} error - The error string explaining why the session
     * entered an error state.
     * @returns {void}
     */
    setError(error) {
        this._error = error;
    }
    /**
     * Sets the last live stream URL for the session instance. Usually this is
     * a YouTube URL and usually this is only set for "stream" sessions.
     *
     * @param {string} url - The live stream URL associated with the session.
     * @returns {void}
     */
    setLiveStreamViewURL(url) {
        this._liveStreamViewURL = url;
    }
    /**
     * Sets the last known status for this recording session.
     *
     * @param {string} status - The new status to set.
     * @returns {void}
     */
    setStatus(status) {
        this._status = status;
    }
    /**
     * Set the session status reported by jicofo. If a jibri is present in the room,
     * the status is always 'on'. Otherwise, we fallback to the status reported by jicofo.
     *
     * @param {string} status
     */
    setStatusFromJicofo(status) {
        this._statusFromJicofo = status;
    }
    /**
     * Set the JID of the jibri associated with this session.
     *
     * @param {*} jibriJid
     */
    setJibriJid(jibriJid) {
        this._jibriJid = jibriJid;
    }
    /**
     * Sets the participant that started the session.
     * @param {JitsiParticipant | string} participant - The participant or resource id
     * if local participant.
     */
    setInitiator(participant) {
        this._initiator = participant;
    }
    /**
     * Sets the participant that stopped the session.
     * @param {JitsiParticipant | string} participant - The participant or the resource id
     * if local participant.
     */
    setTerminator(participant) {
        this._terminator = participant;
    }
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
    start({ appData, broadcastId, focusMucJid, streamId }) {
        logger.info('Starting recording session');
        return new Promise((resolve, reject) => {
            this._connection?.sendIQ(JibriSession._createIQ({
                action: 'start',
                appData,
                broadcastId,
                focusMucJid,
                mode: this._mode,
                streamId
            }), (result) => {
                this.setStatus('pending');
                this._setSessionID(getSessionIdFromIq(result));
                resolve();
            }, (error) => {
                this._setErrorFromIq(error);
                handleStropheError(error, {
                    operation: 'start Jibri session request',
                    userJid: this._connection?.jid,
                });
                reject(error);
            });
        });
    }
    /**
     * Sends a message to actually stop the recording session.
     *
     * @param {Object} options - Additional arguments for stopping the recording.
     * @param {XmppConnection} [options.connection] - The XMPP connection to use.
     * @param {Object} options.focusMucJid - The JID of the focus participant that controls recording.
     * @param {string} [options.mode] - The recording mode of the session.
     * @returns Promise
     */
    static stop({ connection, focusMucJid, mode }) {
        logger.info('Stopping recording session');
        return new Promise((resolve, reject) => {
            connection?.sendIQ(JibriSession._createIQ({
                action: 'stop',
                focusMucJid,
                mode
            }), resolve, (error) => {
                handleStropheError(error, {
                    operation: 'stop Jibri session request',
                    userJid: connection?.jid
                });
                reject(error);
            });
        });
    }
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
    static _createIQ({ action, appData, broadcastId, focusMucJid, mode, streamId }) {
        return $iq({
            to: focusMucJid,
            type: 'set'
        })
            .c('jibri', {
            'action': action,
            'app_data': appData,
            'recording_mode': mode,
            'streamid': streamId,
            'xmlns': 'http://jitsi.org/protocol/jibri',
            'you_tube_broadcast_id': broadcastId
        })
            .up();
    }
    /**
     * Handles the error from an iq and stores the error.
     *
     * @param {Node} errorIq - The error response from an Iq.
     * @private
     * @returns {void}
     */
    _setErrorFromIq(errorIq) {
        let error;
        if (errorIq) {
            if (typeof errorIq === 'string') {
                error = errorIq;
            }
            else if (errorIq.nodeType === 1) {
                const errors = errorIq.getElementsByTagName('error');
                if (errors?.length > 0) {
                    const errorChildren = errors[0].children;
                    error = errorChildren?.length > 0 ? errorChildren[0].tagName : undefined;
                }
            }
        }
        else {
            error = 'timeout';
        }
        this.setError(error ?? 'unknown');
    }
    /**
     * Sets the known session ID for this recording session.
     *
     * @param {string} sessionID
     * @private
     * @returns {void}
     */
    _setSessionID(sessionID) {
        this._sessionID = sessionID;
    }
}
//# sourceMappingURL=JibriSession.js.map