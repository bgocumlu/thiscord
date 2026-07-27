import { XMPPEvents } from '../../service/xmpp/XMPPEvents';
export const IDENTITY_TYPE = 'file-sharing';
/**
 * The FileSharing logic.
 */
export default class FileSharing {
    /**
     * Constructs File sharing manager for a room.
     *
     * @param {ChatRoom} room the main room.
     */
    constructor(room) {
        this._mainRoom = room;
        this._xmpp = room.xmpp;
        this._handleMessages = this._handleMessages.bind(this);
        this._mainRoom.xmpp.addListener(XMPPEvents.FILE_SHARING_EVENT, this._handleMessages);
    }
    /**
     * Stops listening for events.
     */
    dispose() {
        this._mainRoom.xmpp.removeListener(XMPPEvents.FILE_SHARING_EVENT, this._handleMessages);
    }
    /**
     * Whether file sharing is supported on backend.
     *
     * @returns {boolean} whether file sharing is supported on backend.
     */
    isSupported() {
        return Boolean(this._xmpp.fileSharingComponentAddress);
    }
    /**
     * Returns the file sharing identity type (service name).
     *
     * @returns {string} the file sharing service name.
     */
    getIdentityType() {
        return IDENTITY_TYPE;
    }
    /**
     * Adds a file to the file sharing component after the file has been uploaded.
     * @param metadata - The metadata of the file to be added.
     */
    addFile(metadata) {
        const message = {
            type: 'add',
            xmlns: 'http://jitsi.org/jitmeet'
        };
        this._sendMessage(message, metadata);
    }
    /**
     * Removes a file from the file sharing component after the file was deleted.
     * @param fileId - The file ID of the file to be removed.
     */
    removeFile(fileId) {
        const message = {
            fileId,
            type: 'remove',
            xmlns: 'http://jitsi.org/jitmeet'
        };
        this._sendMessage(message);
    }
    /**
     * Helper to send a file sharing message to the component.
     *
     * @param {Object} message - Command that needs to be sent.
     * @param {Object} content - The content to add to the element created if any.
     */
    _sendMessage(message, content) {
        const msg = $msg({ to: this._xmpp.fileSharingComponentAddress });
        msg.c(IDENTITY_TYPE, message, content ? JSON.stringify(content) : undefined).up();
        this._xmpp.connection.send(msg);
    }
    /**
     * Handles a message for file sharing.
     *
     * @param {object} payload - Arbitrary data.
     */
    _handleMessages(payload) {
        switch (payload.event) {
            case 'add':
                this._mainRoom.eventEmitter.emit(XMPPEvents.FILE_SHARING_FILE_ADDED, payload.file);
                break;
            case 'remove': {
                this._mainRoom.eventEmitter.emit(XMPPEvents.FILE_SHARING_FILE_REMOVED, payload.fileId);
                break;
            }
            case 'list': {
                this._mainRoom.eventEmitter.emit(XMPPEvents.FILE_SHARING_FILES_RECEIVED, payload.files);
                break;
            }
        }
    }
}
//# sourceMappingURL=FileSharing.js.map