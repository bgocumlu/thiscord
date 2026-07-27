import { getLogger } from '@jitsi/logger';
import { $iq } from 'strophe.js';
import { findFirst, getAttribute } from '../util/XMLUtils';
import ConnectionPlugin from './ConnectionPlugin';
import { handleStropheError } from './StropheErrorHandler';
const logger = getLogger('xmpp:strophe.rayo');
const RAYO_XMLNS = 'urn:xmpp:rayo:1';
/**
 *
 */
export default class RayoConnectionPlugin extends ConnectionPlugin {
    constructor() {
        super(...arguments);
        this.callResource = null;
    }
    /**
     *
     * @param connection
     */
    init(connection) {
        super.init(connection);
        connection.addHandler(this.onRayo.bind(this), RAYO_XMLNS, 'iq', 'set', null, null);
    }
    /**
     *
     * @param iq
     */
    onRayo(iq) {
        logger.info('Rayo IQ', iq);
    }
    /* eslint-disable max-params */
    /**
     *
     * @param to
     * @param from
     * @param roomName
     * @param roomPass
     * @param focusMucJid
     */
    dial(to, from, roomName, roomPass, focusMucJid) {
        return new Promise((resolve, reject) => {
            if (!focusMucJid) {
                reject(new Error('Internal error!'));
                return;
            }
            const req = $iq({
                to: focusMucJid,
                type: 'set',
            });
            req.c('dial', {
                from,
                to,
                xmlns: RAYO_XMLNS,
            });
            req.c('header', {
                name: 'JvbRoomName',
                value: roomName,
            }).up();
            if (roomPass?.length) {
                req.c('header', {
                    name: 'JvbRoomPassword',
                    value: roomPass,
                }).up();
            }
            this.connection.sendIQ(req, result => {
                logger.info('Dial result ', result);
                const resource = getAttribute(findFirst(result, 'ref'), 'uri');
                this.callResource = resource.substr('xmpp:'.length);
                logger.info(`Received call resource: ${this.callResource}`);
                resolve();
            }, error => {
                handleStropheError(error, {
                    from,
                    operation: 'dial (Rayo)',
                    roomName,
                    to,
                    userJid: this.connection.jid
                });
                reject(error);
            });
        });
    }
    /* eslint-enable max-params */
    /**
     *
     */
    hangup() {
        return new Promise((resolve, reject) => {
            if (!this.callResource) {
                reject(new Error('No call in progress'));
                logger.warn('No call in progress');
                return;
            }
            const req = $iq({
                to: this.callResource,
                type: 'set',
            });
            req.c('hangup', {
                xmlns: RAYO_XMLNS,
            });
            this.connection.sendIQ(req, result => {
                logger.info('Hangup result ', result);
                this.callResource = null;
                resolve();
            }, error => {
                handleStropheError(error, {
                    callResource: this.callResource,
                    operation: 'hangup (Rayo)',
                    userJid: this.connection.jid
                });
                this.callResource = null;
                reject(new Error('Hangup error '));
            });
        });
    }
}
//# sourceMappingURL=strophe.rayo.js.map