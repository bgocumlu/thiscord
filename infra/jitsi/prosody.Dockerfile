FROM jitsi/prosody:stable-10978

COPY --chown=prosody:prosody prosody-plugins/mod_thiscord_call_control.lua \
  /prosody-plugins/mod_thiscord_call_control.lua
