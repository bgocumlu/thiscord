import { JitsiConferenceEvents } from '../../JitsiConferenceEvents';
import { MockSignalingLayerImpl } from '../RTC/MockClasses';
import Listenable from '../util/Listenable';
/**
 * MockParticipant
 */
export class MockParticipant {
    /**
     * A constructor...
     */
    constructor(id) {
        this.id = id;
    }
    /**
     * Returns the endpoint id of the participant.
     * @returns <string>
     */
    getId() {
        return this.id;
    }
}
/**
 * MockLocalTrack
 */
export class MockLocalTrack {
    /**
     * Constructor
     * @param {number} resolution
     * @param {VideoType} videoType
     */
    constructor(id, resolution, videoType) {
        this.rtcId = id;
        this.captureResolution = resolution;
        this.maxEnabledResolution = resolution;
        this.videoType = videoType;
    }
    /**
     * Gets the capture resolution of the mock local track.
     * @returns - The capture resolution.
     */
    getCaptureResolution() {
        return this.captureResolution;
    }
    /**
     * Returns the video type of the mock local track.
     * @returns {VideoType}
     */
    getVideoType() {
        return this.videoType;
    }
}
/**
 * MockConference
 */
export class MockConference extends Listenable {
    /**
     * A constructor...
     */
    constructor(rtc) {
        super();
        this.options = {
            config: {}
        };
        this.activeMediaSession = undefined;
        this.jvbJingleSession = null;
        this.mediaSessions = [];
        this.participants = [];
        this.rtc = rtc;
        this._signalingLayer = new MockSignalingLayerImpl();
    }
    /**
     * Add a mock participant to the conference
     * @param {MockParticipant} participant
     * @param {Array<string>} codecList
     * @param {String} codecType
     */
    addParticipant(participant, codecList, codecType) {
        this.participants.push(participant);
        this._signalingLayer.setPeerMediaInfo(true, participant.getId(), codecList, codecType);
        this.eventEmitter.emit(JitsiConferenceEvents.USER_JOINED);
    }
    /**
     * Returns the active media session.
     * @returns {JingleSessionPC}
     */
    getActiveMediaSession() {
        return this.jvbJingleSession;
    }
    /**
     * Returns a list of forwarded sources.
     * @returns {Array<string>}
     */
    getForwardedSources() {
        return this.rtc.getForwardedSources();
    }
    /**
     * Returns the list of participants.
     * @returns Array<MockParticipant>
     */
    getParticipants() {
        return this.participants;
    }
    /**
     * Checks if E2EE is enabled.
     * @returns {boolean}
     */
    isE2EEEnabled() {
        return false;
    }
    /**
     * Removes the participant from the conference.
     * @param {MockParticipant} endpoint
     */
    removeParticipant(endpoint) {
        this.participants = this.participants.filter(p => p !== endpoint);
        this._signalingLayer.setPeerMediaInfo(false, endpoint.getId(), undefined, undefined);
        this.eventEmitter.emit(JitsiConferenceEvents.USER_LEFT);
    }
}
//# sourceMappingURL=MockClasses.js.map