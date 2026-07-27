import { getLogger } from '@jitsi/logger';
import { isEqual } from 'lodash-es';
import { ReceiverAudioSubscription } from '../../service/RTC/ReceiverAudioSubscription';
const logger = getLogger('qc:ReceiveAudioController');
/**
 * Controller for managing audio subscriptions in a Jitsi conference. It allows subscribing to remote audio streams
 * based on different modes such as ALL, EXCLUDE, INCLUDE, and NONE.
 */
export class ReceiverAudioController {
    /**
     * Creates a new instance of the ReceiverAudioController.
     */
    constructor(conference) {
        this._rtc = conference.rtc;
        this._sourceList = [];
        this._subscriptionMode = ReceiverAudioSubscription.ALL;
    }
    /**
     * Gets the current audio subscription option.
     *
     * @returns {ReceiverAudioSubscription} The current audio subscription option.
     */
    get audioSubscription() {
        return this._subscriptionMode;
    }
    /**
     * Mutes or unmutes the remote audio streams based on the provided parameter.
     *
     * @param {boolean} muted - Indicates whether the remote audio should be muted or not.
     * @returns {void}
     */
    muteRemoteAudio(muted) {
        this.setAudioSubscriptionMode({
            mode: muted ? ReceiverAudioSubscription.NONE : ReceiverAudioSubscription.ALL
        });
    }
    /**
     * Sets the audio subscription options.
     *
     * @param message The audio subscription message containing the mode and optional source list.
     * @returns {void}
     */
    setAudioSubscriptionMode(message) {
        if ((message.mode == ReceiverAudioSubscription.NONE || message.mode == ReceiverAudioSubscription.ALL)
            && this._subscriptionMode == message.mode) {
            logger.debug(`Ignoring ReceiverAudioSubscription with mode: ${message.mode}, no change needed.`);
            return;
        }
        this._subscriptionMode = message.mode;
        if (message.mode == ReceiverAudioSubscription.INCLUDE
            || message.mode == ReceiverAudioSubscription.EXCLUDE) {
            if (!message.list?.length) {
                this._subscriptionMode = message.mode == ReceiverAudioSubscription.INCLUDE
                    ? ReceiverAudioSubscription.NONE : ReceiverAudioSubscription.ALL;
            }
            else if (this._subscriptionMode == message.mode && isEqual(this._sourceList, message.list)) {
                logger.debug(`Ignoring ReceiverAudioSubscription with mode: ${message.mode},`
                    + ` sourceList: ${message.list.join(', ')}, no change needed.`);
                return;
            }
            this._sourceList = message.list || [];
        }
        else {
            // Clear the source list for ALL or NONE modes.
            this._sourceList = [];
        }
        this._rtc.sendReceiverAudioSubscriptionMessage({
            list: this._sourceList,
            mode: this._subscriptionMode
        });
    }
}
//# sourceMappingURL=ReceiveAudioController.js.map