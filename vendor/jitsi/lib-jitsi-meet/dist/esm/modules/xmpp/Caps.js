import { Strophe } from 'strophe.js'; // eslint-disable-line camelcase
import { XMPPEvents } from '../../service/xmpp/XMPPEvents';
import Listenable from '../util/Listenable';
import { findAll, getAttribute } from '../util/XMLUtils';
import sha1 from './sha1';
/**
 * The property
 */
const IDENTITY_PROPERTIES = ['category', 'type', 'lang', 'name'];
const IDENTITY_PROPERTIES_FOR_COMPARE = ['category', 'type', 'lang'];
const HASH = 'sha-1';
/**
 *
 * @param a
 * @param b
 */
function compareIdentities(a, b) {
    let res = 0;
    IDENTITY_PROPERTIES_FOR_COMPARE.some(key => (res = ((a[key] > b[key]) && 1) || ((a[key] < b[key]) && -1)) !== 0);
    return res;
}
/**
 * Produces a sha-1 from provided identity and features values.
 *
 * @param {Array<Object>} identities - The identity objects.
 * @param {Array<string>} features - The features.
 * @returns {string}
 */
function generateSha(identities, features) {
    const sortedIdentities = identities.sort(compareIdentities).reduce((accumulatedValue, identity) => `${IDENTITY_PROPERTIES.reduce((tmp, key, idx) => tmp
        + (idx === 0 ? '' : '/')
        + (identity[key] ? identity[key] : ''), '')}<`, '');
    const sortedFeatures = features.sort().reduce((tmp, feature) => `${tmp + feature}<`, '');
    return sha1.b64_sha1(sortedIdentities + sortedFeatures);
}
/**
 * Parses the disco-info node and returns the sets of features and identities.
 * @param {String} node The node with results to parse.
 * @returns {{features: Set<string>, identities: Set<Identity>}}
 */
export function parseDiscoInfo(node) {
    const features = new Set();
    const identities = new Set();
    findAll(node, ':scope>query>feature').forEach(el => features.add(getAttribute(el, 'var')));
    findAll(node, ':scope>query>identity').forEach(el => identities.add({
        category: getAttribute(el, 'category'),
        name: getAttribute(el, 'name'),
        type: getAttribute(el, 'type')
    }));
    return {
        features,
        identities
    };
}
/**
 * Implements xep-0115 ( http://xmpp.org/extensions/xep-0115.html )
 */
export default class Caps extends Listenable {
    /**
     * Constructs new Caps instance.
     * @param {Strophe.Connection} connection the strophe connection object
     * @param {String} node the value of the node attribute of the "c" xml node
     * that will be sent to the other participants
     */
    constructor(connection = {}, node = 'http://jitsi.org/jitsimeet') {
        super();
        this.node = node;
        this.disco = connection.disco;
        if (!this.disco) {
            throw new Error('Missing strophe-plugins '
                + '(disco plugin is required)!');
        }
        this.version = '';
        this.rooms = new Set();
        // We keep track of features added outside the library and we publish them
        // in the presence of the participant for simplicity, avoiding the disco info request-response.
        this.externalFeatures = new Set();
        const emuc = connection.emuc;
        emuc.addListener(XMPPEvents.EMUC_ROOM_ADDED, (room) => this._addChatRoom(room));
        emuc.addListener(XMPPEvents.EMUC_ROOM_REMOVED, (room) => this._removeChatRoom(room));
        Object.keys(emuc.rooms).forEach((jid) => {
            this._addChatRoom(emuc.rooms[jid]);
        });
        Strophe.addNamespace('CAPS', 'http://jabber.org/protocol/caps');
        this.disco.addFeature(Strophe.NS.CAPS);
    }
    /**
     * Returns a set with the features and identities for a host.
     * @param {String} jid the jid of the host
     * @param {String|null} node the node to query
     * @param {int} timeout the timeout in ms for reply from the host.
     * @returns {Promise<{features: Set<string>, identities: Set<Identity>}>}
     * @private
     */
    _getDiscoInfo(jid, node, timeout) {
        return new Promise((resolve, reject) => this.disco.info(jid, node, (response) => {
            resolve(parseDiscoInfo(response));
        }, reject, timeout));
    }
    /**
     * Adds ChatRoom instance to the list of rooms. Adds listeners to the room
     * and adds "c" element to the presences of the room.
     * @param {ChatRoom} room the room.
     */
    _addChatRoom(room) {
        this.rooms.add(room);
        this._fixChatRoomPresenceMap(room);
        this._updateRoomWithExternalFeatures(room);
    }
    /**
     * Creates/updates the "c" xml node into the presence of the passed room.
     * @param {ChatRoom} room the room.
     */
    _fixChatRoomPresenceMap(room) {
        room.addOrReplaceInPresence('c', {
            attributes: {
                hash: HASH,
                node: this.node,
                ver: this.version,
                xmlns: Strophe.NS.CAPS
            }
        });
    }
    /**
     * Generates the value for the "ver" attribute.
     */
    _generateVersion() {
        this.version
            = generateSha(this.disco._identities, this.disco._features);
        this._notifyVersionChanged();
    }
    /**
     * Handles this.version changes.
     */
    _notifyVersionChanged() {
        // update the version for all rooms
        this.rooms.forEach(room => this._fixChatRoomPresenceMap(room));
    }
    /**
     * Removes ChatRoom instance from the list of rooms. Removes listeners
     * added from the Caps class.
     * @param {ChatRoom} room the room.
     */
    _removeChatRoom(room) {
        this.rooms.delete(room);
    }
    /**
     * Updates the presences in the room based on the current values in externalFeatures.
     * @param {ChatRoom} room the room to update.
     * @private
     */
    _updateRoomWithExternalFeatures(room) {
        if (this.externalFeatures.size === 0) {
            room.removeFromPresence('features');
        }
        else {
            const children = [];
            this.externalFeatures.forEach(f => {
                children.push({
                    attributes: { 'var': f },
                    'tagName': 'feature'
                });
            });
            room.addOrReplaceInPresence('features', { children });
        }
    }
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
    addFeature(feature, submit = false, external = false) {
        this.disco.addFeature(feature);
        this._generateVersion();
        if (external && !this.externalFeatures.has(feature)) {
            this.externalFeatures.add(feature);
            this.rooms.forEach(room => this._updateRoomWithExternalFeatures(room));
        }
        if (submit) {
            this.submit();
        }
    }
    /**
     * Returns a set with the features for a host.
     * @param {String} jid the jid of the host
     * @param {int} timeout the timeout in ms for reply from the host.
     * @returns {Promise<{features: Set<string>, identities: Set<Identity>}>}
     */
    getFeaturesAndIdentities(jid, node, timeout = 5000) {
        return this._getDiscoInfo(jid, node, timeout);
    }
    /**
     * Removes a feature from the list of supported features for the local
     * participant
     * @param {String} feature the name of the feature.
     * @param {boolean} submit if true - new presence with updated "c" node
     * will be sent.
     * @param {boolean} external whether this feature was added externally to the library.
     */
    removeFeature(feature, submit = false, external = false) {
        this.disco.removeFeature(feature);
        this._generateVersion();
        if (external && this.externalFeatures.has(feature)) {
            this.externalFeatures.delete(feature);
            this.rooms.forEach(room => this._updateRoomWithExternalFeatures(room));
        }
        if (submit) {
            this.submit();
        }
    }
    /**
         * Sends new presence stanza for every room from the list of rooms.
         */
    submit() {
        this.rooms.forEach(room => room.sendPresence(undefined));
    }
}
//# sourceMappingURL=Caps.js.map