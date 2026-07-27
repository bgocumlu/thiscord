import { XMPPEvents } from '../../service/xmpp/XMPPEvents';
export const COMMAND_ANSWER_POLL = 'answer-poll';
export const COMMAND_NEW_POLL = 'new-poll';
export const COMMAND_OLD_POLLS = 'old-polls';
export default class Polls {
    /**
     * Constructs polls for a room.
     *
     * @param {ChatRoom} room the main room.
     */
    constructor(room) {
        this._mainRoom = room;
        this._xmpp = room.xmpp;
        this._handleMessages = this._handleMessages.bind(this);
        this._mainRoom.xmpp.addListener(XMPPEvents.POLLS_EVENT, this._handleMessages);
    }
    /**
     * Whether polls is supported on backend.
     *
     * @returns {boolean} whether polls is supported on backend.
     */
    isSupported() {
        return Boolean(this._xmpp.pollsComponentAddress);
    }
    /**
     * Stops listening for events.
     */
    dispose() {
        this._mainRoom.xmpp.removeListener(XMPPEvents.POLLS_EVENT, this._handleMessages);
    }
    /**
     * Creates and sends a new poll.
     *
     * @param pollId
     * @param question
     * @param answers
     */
    createPoll(pollId, question, answers) {
        this._mainRoom.sendPrivateMessage(this._xmpp.pollsComponentAddress, JSON.stringify({
            answers: answers,
            command: COMMAND_NEW_POLL,
            pollId,
            question,
            type: 'polls'
        }), 'json-message', true);
    }
    /**
     * Sends answers for a poll.
     *
     * @param pollId
     * @param answers
     */
    answerPoll(pollId, answers) {
        this._mainRoom.sendPrivateMessage(this._xmpp.pollsComponentAddress, JSON.stringify({
            answers,
            command: COMMAND_ANSWER_POLL,
            pollId,
            type: 'polls'
        }), 'json-message', true);
    }
    /**
     * Handles a message for polls.
     *
     * @param {object} payload - Arbitrary data.
     */
    _handleMessages(payload) {
        switch (payload.command) {
            case COMMAND_NEW_POLL:
                this._mainRoom.eventEmitter.emit(XMPPEvents.POLLS_RECEIVE_EVENT, payload);
                break;
            case COMMAND_OLD_POLLS: {
                payload?.polls?.forEach((poll) => {
                    this._mainRoom.eventEmitter.emit(XMPPEvents.POLLS_RECEIVE_EVENT, {
                        history: true,
                        ...poll
                    });
                });
                break;
            }
            case COMMAND_ANSWER_POLL: {
                this._mainRoom.eventEmitter.emit(XMPPEvents.POLLS_ANSWER_EVENT, payload);
                break;
            }
        }
    }
}
//# sourceMappingURL=Polls.js.map