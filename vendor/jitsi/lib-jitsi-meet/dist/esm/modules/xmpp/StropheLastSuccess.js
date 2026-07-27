/**
 * Attaches to the {@link Strophe.Connection.rawInput} which is called whenever any data is received from the server.
 */
export default class LastRequestTracker {
    /**
     * Initializes new instance.
     */
    constructor() {
        this._lastSuccess = null;
        this._lastFailedMessage = null;
    }
    /**
     * Starts tracking requests on the given connection.
     *
     * @param {XmppConnection} xmppConnection - The XMPP connection which manages the given {@code stropheConnection}.
     * @param {Strophe.Connection} stropheConnection - Strophe connection instance.
     */
    startTracking(xmppConnection, stropheConnection) {
        const originalRawInput = stropheConnection.rawInput;
        stropheConnection.rawInput = (...args) => {
            const rawMessage = args[0];
            if (rawMessage.includes('failure')) {
                this._lastFailedMessage = rawMessage;
            }
            // It's okay to use rawInput callback only once the connection has been established, otherwise it will
            // treat 'item-not-found' or other connection error on websocket reconnect as successful stanza received.
            if (xmppConnection.connected) {
                this._lastSuccess = Date.now();
            }
            originalRawInput.apply(stropheConnection, args);
        };
    }
    /**
     * Returns the last raw failed incoming message on the xmpp connection.
     *
     * @returns {Nullable<string>}
     */
    getLastFailedMessage() {
        return this._lastFailedMessage;
    }
    /**
     * Returns how many milliseconds have passed since the last successful BOSH request.
     *
     * @returns {Nullable<number>}
     */
    getTimeSinceLastSuccess() {
        return this._lastSuccess
            ? Date.now() - this._lastSuccess
            : null;
    }
}
//# sourceMappingURL=StropheLastSuccess.js.map