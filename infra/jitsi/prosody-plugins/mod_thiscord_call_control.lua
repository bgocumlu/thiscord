-- Internal Thiscord call-control endpoint.
--
-- PocketBase uses this endpoint to remove an already-connected Jitsi occupant
-- when product authorization is revoked. The endpoint is reachable only on the
-- private Compose network and requires the same high-entropy secret used to
-- sign Jitsi login tokens.

module:set_global();

local json = require "cjson.safe";
local jid = require "util.jid";
local id = require "util.id";
local st = require "util.stanza";
local array = require "util.array";
local jitsi_util = module:require "util";
local get_room_from_jid = jitsi_util.get_room_from_jid;
local is_focus = jitsi_util.is_focus;
local internal_room_jid_match_rewrite = jitsi_util.internal_room_jid_match_rewrite;
local process_host_module = jitsi_util.process_host_module;
local sessions = prosody.full_sessions;

local control_secret = os.getenv("THISCORD_CALL_CONTROL_SECRET") or "";
local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
local muc_domain_prefix = module:get_option_string("muc_mapper_domain_prefix", "muc");
local muc_domain = muc_domain_prefix.."."..muc_domain_base;
local av_moderation_domain = "avmoderation."..muc_domain_base;
local revocation_store;

local function response(status_code, body)
    return {
        status_code = status_code;
        headers = { content_type = "application/json" };
        body = json.encode(body);
    };
end

local function authorized(request)
    local authorization = request.headers["authorization"] or "";
    return control_secret ~= ""
        and authorization == "Bearer "..control_secret;
end

local media_types = { "audio", "video", "desktop" };
local mute_namespaces = {
    audio = "http://jitsi.org/jitmeet/audio";
    video = "http://jitsi.org/jitmeet/video";
    desktop = "http://jitsi.org/jitmeet/desktop";
};

local function send_json_message(to_jid, body)
    local encoded = json.encode(body);
    if not encoded then
        module:log("error", "Could not encode Thiscord media policy message");
        return;
    end
    module:send(st.message({ from = av_moderation_domain; to = to_jid; })
        :tag("json-message", { xmlns = "http://jitsi.org/jitmeet" }):text(encoded):up());
end

local function occupant_policy(occupant)
    if is_focus(occupant.nick) then
        return true, true;
    end
    local session = sessions[occupant.jid];
    local context_user = session and session.jitsi_meet_context_user;
    return context_user and context_user.thiscordCanSpeak == true,
        context_user and context_user.thiscordCanStreamVideo == true;
end

local function stored_policy(room, occupant)
    if is_focus(occupant.nick) then return false, true, true; end
    if not revocation_store then
        return true, false, false, "revocation store unavailable";
    end
    local session = sessions[occupant.jid];
    local context_user = session and session.jitsi_meet_context_user;
    local user_id = context_user and context_user.id;
    if not user_id then return true, false, false, "missing token user"; end
    local entry, err = revocation_store:get(jid.node(room.jid), user_id);
    if err then return true, false, false, err; end
    if not entry then return false; end
    local now = os.time() * 1000;
    local expires_at = tonumber(entry.expiresAt);
    if not expires_at or expires_at <= now then
        local ok, cleanup_err = revocation_store:set(jid.node(room.jid), user_id, nil);
        if not ok then
            module:log("warn", "Could not remove expired Thiscord token policy: %s", cleanup_err);
        end
        return false;
    end
    local token_version = tonumber(context_user.thiscordTokenVersion);
    local revoked_through = tonumber(entry.revokedThroughVersion);
    if token_version and revoked_through and token_version > revoked_through then return false; end
    return true, false, false;
end

local function whitelist_contains(whitelist, occupant_jid)
    for _, current in ipairs(whitelist) do
        if current == occupant_jid then return true; end
    end
    return false;
end

local function set_whitelist(whitelist, occupant_jid, allowed)
    for index = #whitelist, 1, -1 do
        if whitelist[index] == occupant_jid and not allowed then
            table.remove(whitelist, index);
        end
    end
    if allowed and not whitelist_contains(whitelist, occupant_jid) then
        table.insert(whitelist, occupant_jid);
    end
end

local function public_occupant_jid(occupant)
    return internal_room_jid_match_rewrite(occupant.nick);
end

local function public_whitelists(room)
    local result = {};
    for _, media_type in ipairs(media_types) do
        local current = room.av_moderation[media_type];
        if current and #current > 0 then result[media_type] = current; end
    end
    return result;
end

local function notify_media_policy(room, occupant, focus)
    local public_room_jid = internal_room_jid_match_rewrite(room.jid);
    for _, media_type in ipairs(media_types) do
        send_json_message(occupant.jid, {
            type = "av_moderation";
            room = public_room_jid;
            enabled = true;
            actor = focus and public_occupant_jid(focus) or nil;
            mediaType = media_type;
        });
        local allowed = whitelist_contains(
            room.av_moderation[media_type],
            public_occupant_jid(occupant)
        );
        send_json_message(occupant.jid, {
            type = "av_moderation";
            room = public_room_jid;
            approved = allowed or nil;
            removed = allowed and nil or true;
            mediaType = media_type;
        });
        if focus then
            send_json_message(focus.jid, {
                type = "av_moderation";
                room = public_room_jid;
                enabled = true;
                actor = public_occupant_jid(focus);
                mediaType = media_type;
            });
            send_json_message(focus.jid, {
                type = "av_moderation";
                room = public_room_jid;
                whitelists = public_whitelists(room);
                removed = allowed and nil or true;
                mediaType = media_type;
            });
        end
    end
end

local function find_focus(room)
    for _, occupant in room:each_occupant() do
        if is_focus(occupant.nick) then return occupant; end
    end
    return nil;
end

local function force_mute(occupant, focus, media_type)
    if not focus then return false; end
    module:send(st.iq({
        from = occupant.nick;
        to = focus.nick;
        type = "set";
        id = "thiscord-mute-"..id.medium();
    }):tag("mute", {
        jid = occupant.nick;
        xmlns = mute_namespaces[media_type];
    }):text("true"));
    return true;
end

local function ensure_media_policy(room)
    if room.av_moderation then return; end
    room.av_moderation = {
        audio = array();
        video = array();
        desktop = array();
    };
    room.av_moderation_actors = {};
    local focus = find_focus(room);
    for _, media_type in ipairs(media_types) do
        room.av_moderation_actors[media_type] = focus and focus.nick or room.jid;
    end
    room.jitsiMetadata = room.jitsiMetadata or {};
    room.jitsiMetadata.startMuted = room.jitsiMetadata.startMuted or {};
    for _, media_type in ipairs(media_types) do
        room.jitsiMetadata.startMuted[media_type] = true;
    end
    for _, occupant in room:each_occupant() do
        local can_speak, can_stream_video = occupant_policy(occupant);
        local occupant_jid = public_occupant_jid(occupant);
        set_whitelist(room.av_moderation.audio, occupant_jid, can_speak);
        set_whitelist(room.av_moderation.video, occupant_jid, can_stream_video);
        set_whitelist(room.av_moderation.desktop, occupant_jid, can_stream_video);
    end
end

local function apply_media_policy(room, occupant, can_speak, can_stream_video)
    if not room.av_moderation and can_speak and can_stream_video then return; end
    ensure_media_policy(room);
    local occupant_jid = public_occupant_jid(occupant);
    set_whitelist(room.av_moderation.audio, occupant_jid, can_speak);
    set_whitelist(room.av_moderation.video, occupant_jid, can_stream_video);
    set_whitelist(room.av_moderation.desktop, occupant_jid, can_stream_video);
    local focus = find_focus(room);
    notify_media_policy(room, occupant, focus);
    if not can_speak then force_mute(occupant, focus, "audio"); end
    if not can_stream_video then
        force_mute(occupant, focus, "video");
        force_mute(occupant, focus, "desktop");
    end
end

local function occupant_joined(event)
    local denied, stored_can_speak, stored_can_stream_video, err
        = stored_policy(event.room, event.occupant);
    if denied then
        if err then module:log("error", "Rejecting occupant after token-policy lookup failed: %s", err); end
        event.room:set_role(true, event.occupant.nick, nil);
        return;
    end
    local can_speak, can_stream_video;
    if stored_can_speak ~= nil then
        can_speak, can_stream_video = stored_can_speak, stored_can_stream_video;
    else
        can_speak, can_stream_video = occupant_policy(event.occupant);
    end
    apply_media_policy(event.room, event.occupant, can_speak, can_stream_video);
end

process_host_module(muc_domain, function(host_module)
    module:log("info", "Hooking Thiscord media policy into %s", muc_domain);
    host_module:hook("muc-occupant-joined", occupant_joined, 100);
end);

local function handle_control(event)
    local request = event.request;
    if not authorized(request) then
        return response(403, { error = "forbidden" });
    end
    if request.headers.content_type ~= "application/json" or not request.body then
        return response(400, { error = "application/json body required" });
    end

    local payload = json.decode(request.body);
    if type(payload) ~= "table"
            or type(payload.roomName) ~= "string"
            or type(payload.userIds) ~= "table"
            or (payload.action ~= "kick"
                and payload.action ~= "mute"
                and payload.action ~= "policy"
                and payload.action ~= "revoke")
            or (payload.action == "policy"
                and (type(payload.canSpeak) ~= "boolean"
                    or type(payload.canStreamVideo) ~= "boolean"))
            or (payload.action == "revoke"
                and (type(payload.tokenVersion) ~= "number"
                    or type(payload.expiresAt) ~= "number"
                    or payload.tokenVersion < 1)) then
        return response(400, { error = "invalid call-control payload" });
    end

    local requested = {};
    for _, user_id in ipairs(payload.userIds) do
        if type(user_id) == "string" and user_id ~= "" then
            requested[user_id] = true;
        end
    end

    if payload.action == "revoke" then
        if not revocation_store then
            return response(503, { error = "revocation store unavailable" });
        end
        for user_id in pairs(requested) do
            local existing, read_err = revocation_store:get(payload.roomName, user_id);
            if read_err then
                module:log("error", "Could not read Thiscord token revision: %s", read_err);
                return response(503, { error = "token revision persistence failed" });
            end
            local entry = existing or {};
            entry.revokedThroughVersion = math.max(
                tonumber(entry.revokedThroughVersion) or 0,
                payload.tokenVersion
            );
            entry.expiresAt = math.max(tonumber(entry.expiresAt) or 0, payload.expiresAt);
            local ok, err = revocation_store:set(payload.roomName, user_id, entry);
            if not ok then
                module:log("error", "Could not persist Thiscord token policy: %s", err);
                return response(503, { error = "token policy persistence failed" });
            end
        end
    end

    local room = get_room_from_jid(jid.join(payload.roomName, muc_domain));
    if not room then
        return response(200, { affected = 0 });
    end
    if payload.action == "revoke" then
        return response(200, { affected = 0 });
    end

    local focus;
    if payload.action == "mute"
            or (payload.action == "policy"
                and (not payload.canSpeak or not payload.canStreamVideo)) then
        focus = find_focus(room);
        if not focus then
            return response(503, { error = "conference focus unavailable" });
        end
    end

    local affected = 0;
    for _, occupant in room:each_occupant() do
        local session = sessions[occupant.jid];
        local context_user = session and session.jitsi_meet_context_user;
        local user_id = context_user and context_user.id;
        if user_id and requested[user_id] then
            if payload.action == "kick" then
                room:set_role(true, occupant.nick, nil);
            elseif payload.action == "mute" then
                -- Submit the standard self-mute IQ on the target occupant's
                -- behalf. Jicofo accepts self-mute without granting that
                -- browser any moderator capability.
                force_mute(occupant, focus, "audio");
            else
                apply_media_policy(
                    room,
                    occupant,
                    payload.canSpeak,
                    payload.canStreamVideo
                );
            end
            affected = affected + 1;
        end
    end
    return response(200, { affected = affected });
end

function module.add_host(host_module)
    if host_module.host ~= muc_domain_base then
        return;
    end
    revocation_store = assert(host_module:open_store("thiscord_call_token_policy", "map"));
    host_module:depends("http");
    host_module:provides("http", {
        default_path = "/";
        route = {
            ["PUT thiscord-call-control"] = handle_control;
        };
    });
end
