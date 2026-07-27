import { getLogger } from '@jitsi/logger';
import { default as SignalingLayer } from '../../service/RTC/SignalingLayer';
const logger = getLogger('proxyconnection:CustomSignalingLayer');
/**
 * Custom semi-mock implementation for the Proxy connection service.
 */
export default class CustomSignalingLayer extends SignalingLayer {
    /**
     * Creates new instance.
     */
    constructor() {
        super();
        this.ssrcOwners = new Map();
        this.chatRoom = null;
    }
    /**
     * @inheritDoc
     */
    getPeerMediaInfo(_owner, _mediaType, _sourceName) {
        return {};
    }
    /**
     * @inheritDoc
     */
    getPeerSourceInfo(_owner, _sourceName) {
        return undefined;
    }
    /**
     * @inheritDoc
     */
    getSSRCOwner(ssrc) {
        return this.ssrcOwners.get(ssrc);
    }
    /**
     * @inheritDoc
     */
    getTrackSourceName(_ssrc) {
        return undefined;
    }
    /**
     * @inheritDoc
     */
    removeSSRCOwners(ssrcList) {
        if (!ssrcList?.length) {
            return;
        }
        for (const ssrc of ssrcList) {
            this.ssrcOwners.delete(ssrc);
        }
    }
    /**
     * Sets the <tt>ChatRoom</tt> instance used.
     * @param {ChatRoom} room
     */
    setChatRoom(room) {
        this.chatRoom = room;
    }
    /**
     * @inheritDoc
     */
    setSSRCOwner(ssrc, endpointId) {
        if (typeof ssrc !== 'number') {
            throw new TypeError(`SSRC(${ssrc}) must be a number`);
        }
        // Now signaling layer instance is shared between different JingleSessionPC instances, so although very unlikely
        // an SSRC conflict could potentially occur. Log a message to make debugging easier.
        const existingOwner = this.ssrcOwners.get(ssrc);
        if (existingOwner && existingOwner !== endpointId) {
            logger.error(`SSRC owner re-assigned from ${existingOwner} to ${endpointId}`);
        }
        this.ssrcOwners.set(ssrc, endpointId);
    }
    /**
     * @inheritDoc
     */
    setTrackMuteStatus(_sourceName, _muted) {
        return false;
    }
    /**
     * @inheritDoc
     */
    setTrackVideoType(_sourceName, _videoType) {
        return false;
    }
    /**
     * @inheritDoc
     */
    updateSsrcOwnersOnLeave(id) {
        const ssrcs = Array.from(this.ssrcOwners)
            .filter((entry) => entry[1] === id)
            .map((entry) => entry[0]);
        if (!ssrcs?.length) {
            return;
        }
        this.removeSSRCOwners(ssrcs);
    }
}
//# sourceMappingURL=CustomSignalingLayer.js.map