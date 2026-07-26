import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const binary = process.env.POCKETBASE_BINARY;
if (!binary) throw new Error("Set POCKETBASE_BINARY to a PocketBase executable.");

const packageRoot = resolve(import.meta.dirname, "..");
const dataDir = await mkdtemp(resolve(tmpdir(), "thiscord-pocketbase-smoke-"));
const port = 18090 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${port}`;
const output = [];
let child;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} returned ${response.status}: ${JSON.stringify(body)}\n`
      + output.join("").slice(-4_000),
    );
  }
  return body;
}

async function expectFailure(path, expectedStatuses, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${options.method ?? "GET"} ${path} unexpectedly returned ${response.status}.`);
  }
}

async function requestForm(path, form, headers = {}, method = "POST") {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: form,
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      await request("/api/health");
      return;
    } catch {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }
  throw new Error(`PocketBase did not start.\n${output.join("")}`);
}

async function createAuthenticatedUser(prefix, stamp, password) {
  const email = `${prefix}-${stamp}@example.test`;
  const user = await request("/api/collections/users/records", {
    method: "POST",
    body: {
      email,
      emailVisibility: false,
      handle: `${prefix}${stamp}`,
      displayName: `${prefix} user`,
      password,
      passwordConfirm: password,
    },
  });
  const auth = await request("/api/collections/users/auth-with-password", {
    method: "POST",
    body: { identity: email, password },
  });
  return { email, user, headers: { authorization: auth.token } };
}

function startServer() {
  child = spawn(binary, [
    "serve",
    "--dev=true",
    `--http=127.0.0.1:${port}`,
    `--dir=${dataDir}`,
    `--migrationsDir=${resolve(packageRoot, "pb_migrations")}`,
    `--hooksDir=${resolve(packageRoot, "pb_hooks")}`,
  ], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      JITSI_DOMAIN: "meet.example.test",
      JITSI_APP_ID: "thiscord",
      JITSI_APP_SECRET: "validation-secret-that-is-long-enough",
      THISCORD_PUBLIC_URL: baseUrl,
    },
  });
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));
}

async function stopServer() {
  if (child && child.exitCode === null) {
    const exited = new Promise((resolvePromise) => child.once("exit", resolvePromise));
    child.kill();
    await exited;
  }
}

try {
  startServer();
  await waitUntilReady();

  const stamp = Date.now();
  const email = `smoke-${stamp}@example.test`;
  const password = "Production-Test-Password-123";
  const user = await request("/api/collections/users/records", {
    method: "POST",
    body: {
      email,
      emailVisibility: false,
      handle: `smoke${stamp}`,
      displayName: "Smoke User",
      password,
      passwordConfirm: password,
    },
  });
  const auth = await request("/api/collections/users/auth-with-password", {
    method: "POST",
    body: { identity: email, password },
  });
  const headers = { authorization: auth.token };
  const community = await request("/api/thiscord/communities", {
    method: "POST",
    headers,
    body: { name: "Smoke Community", slug: `smoke-${stamp}`, description: "" },
  });
  const communityIconForm = new FormData();
  communityIconForm.append(
    "icon",
    new Blob([
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    ], { type: "image/png" }),
    "smoke-icon.png",
  );
  const communityWithIcon = await requestForm(
    `/api/thiscord/communities/${community.id}`,
    communityIconForm,
    { authorization: auth.token },
    "PATCH",
  );
  if (!communityWithIcon.icon) throw new Error("Community icon upload did not persist.");
  const communityWithoutIcon = await request(`/api/thiscord/communities/${community.id}`, {
    method: "PATCH",
    headers,
    body: { icon: null },
  });
  if (communityWithoutIcon.icon) throw new Error("Community icon removal did not persist.");
  const channels = await request(
    `/api/collections/channels/records?filter=${encodeURIComponent(`community = '${community.id}'`)}`,
    { headers },
  );
  const textChannel = channels.items.find((channel) => channel.kind === "text");
  const voiceChannel = channels.items.find((channel) => channel.kind === "voice");
  if (!textChannel || !voiceChannel) throw new Error("Default channels were not created.");
  const disposableCategory = await request(`/api/thiscord/communities/${community.id}/channels`, {
    method: "POST",
    headers,
    body: { name: "Disposable category", kind: "category" },
  });
  const categoryChild = await request(`/api/thiscord/communities/${community.id}/channels`, {
    method: "POST",
    headers,
    body: { name: "category-child", kind: "text", parent: disposableCategory.id },
  });
  await request(`/api/thiscord/channels/${disposableCategory.id}`, { method: "DELETE", headers });
  const unparentedChild = await request(`/api/collections/channels/records/${categoryChild.id}`, { headers });
  if (unparentedChild.parent) throw new Error("Deleting a category did not keep and unparent its channels.");
  await request(`/api/thiscord/channels/${categoryChild.id}`, { method: "DELETE", headers });
  const message = await request("/api/thiscord/messages", {
    method: "POST",
    headers,
    body: { channel: textChannel.id, content: "PocketBase smoke test" },
  });
  const attachmentForm = new FormData();
  attachmentForm.set("channel", textChannel.id);
  attachmentForm.set("content", "Attachment smoke test");
  attachmentForm.append("attachments", new Blob(["smoke attachment"], { type: "text/plain" }), "smoke.txt");
  const attachmentMessage = await requestForm("/api/thiscord/messages", attachmentForm, {
    authorization: auth.token,
  });
  if (attachmentMessage.attachments?.length !== 1) throw new Error("Message attachment upload did not persist.");
  const pinned = await request(`/api/thiscord/messages/${message.id}`, {
    method: "PATCH",
    headers,
    body: { pinned: true },
  });
  const jitsi = await request(`/api/thiscord/channels/${voiceChannel.id}/jitsi-token`, { headers });
  const role = await request(`/api/thiscord/communities/${community.id}/roles`, {
    method: "POST",
    headers,
    body: {
      name: "Maintainer",
      color: "#8b7cff",
      position: 50,
      permissions: ["manage_messages", "manage_roles", "send_messages"],
    },
  });
  const disposableRole = await request(`/api/thiscord/communities/${community.id}/roles`, {
    method: "POST",
    headers,
    body: { name: "Disposable", color: "#aeb4c0", position: 2, permissions: [] },
  });
  await request(`/api/thiscord/roles/${disposableRole.id}`, { method: "DELETE", headers });
  const invite = await request(`/api/thiscord/communities/${community.id}/invites`, {
    method: "POST",
    headers,
    body: { expiresInHours: 1, maxUses: 1 },
  });
  const secondEmail = `second-${stamp}@example.test`;
  const secondUser = await request("/api/collections/users/records", {
    method: "POST",
    body: {
      email: secondEmail,
      emailVisibility: false,
      handle: `second${stamp}`,
      displayName: "Second User",
      password,
      passwordConfirm: password,
    },
  });
  const secondAuth = await request("/api/collections/users/auth-with-password", {
    method: "POST",
    body: { identity: secondEmail, password },
  });
  const secondHeaders = { authorization: secondAuth.token };
  const secondMembership = await request(`/api/thiscord/invites/${invite.code}/accept`, {
    method: "POST",
    headers: secondHeaders,
  });
  const repeatedMembership = await request(`/api/thiscord/invites/${invite.code}/accept`, {
    method: "POST",
    headers: secondHeaders,
  });
  if (repeatedMembership.id !== secondMembership.id) throw new Error("Invite acceptance was not idempotent.");
  const inviteAfterRepeat = await request(`/api/collections/invites/records/${invite.id}`, { headers });
  if (inviteAfterRepeat.uses !== 1) throw new Error("Repeated invite acceptance consumed another use.");
  const secondDefaultChannels = await request(
    `/api/collections/channels/records?filter=${encodeURIComponent(`community = '${community.id}'`)}`,
    { headers: secondHeaders },
  );
  if (secondDefaultChannels.totalItems !== channels.totalItems) {
    throw new Error("A normal member could not see the community's default channels.");
  }
  await request("/api/thiscord/messages", {
    method: "POST",
    headers: secondHeaders,
    body: { channel: textChannel.id, content: "Normal member message" },
  });
  await request(`/api/thiscord/memberships/${secondMembership.id}/roles`, {
    method: "PUT",
    headers,
    body: { roleIds: [role.id] },
  });
  const adminRole = (await request(
    `/api/collections/roles/records?filter=${encodeURIComponent(`community = '${community.id}' && name = 'Administrator'`)}`,
    { headers },
  )).items[0];
  await expectFailure(`/api/thiscord/memberships/${secondMembership.id}/roles`, [403], {
    method: "PUT",
    headers: secondHeaders,
    body: { roleIds: [adminRole.id] },
  });
  const roleManagedPin = await request(`/api/thiscord/messages/${message.id}`, {
    method: "PATCH",
    headers: secondHeaders,
    body: { pinned: false },
  });
  if (roleManagedPin.pinned) throw new Error("An assigned manage_messages role was not applied.");
  await request(`/api/thiscord/channels/${textChannel.id}/permissions`, {
    method: "PUT",
    headers,
    body: {
      targetType: "member",
      targetId: secondMembership.id,
      allow: ["view_channels"],
      deny: ["read_history"],
    },
  });
  const historyDeniedMessages = await request(
    `/api/collections/messages/records?filter=${encodeURIComponent(`channel = '${textChannel.id}'`)}`,
    { headers: secondHeaders },
  );
  if (historyDeniedMessages.items.length) throw new Error("read_history denial exposed message records.");
  await request(`/api/thiscord/channels/${textChannel.id}/permissions`, {
    method: "PUT",
    headers,
    body: {
      targetType: "member",
      targetId: secondMembership.id,
      allow: [],
      deny: ["view_channels"],
    },
  });
  const secondVisibleChannels = await request(
    `/api/collections/channels/records?filter=${encodeURIComponent(`community = '${community.id}'`)}`,
    { headers: secondHeaders },
  );
  if (secondVisibleChannels.items.some((channel) => channel.id === textChannel.id)) {
    throw new Error("Channel permission overwrite did not hide the denied channel.");
  }
  const secondVisibleMessages = await request(
    `/api/collections/messages/records?filter=${encodeURIComponent(`channel = '${textChannel.id}'`)}`,
    { headers: secondHeaders },
  );
  if (secondVisibleMessages.items.length) {
    throw new Error("A denied channel exposed message records.");
  }
  const conversation = await request("/api/thiscord/conversations", {
    method: "POST",
    headers,
    body: { userIds: [secondUser.id] },
  });
  const directMessage = await request("/api/thiscord/direct-messages", {
    method: "POST",
    headers,
    body: { conversation: conversation.id, content: "Direct smoke test" },
  });
  await request(`/api/thiscord/direct-messages/${directMessage.id}`, {
    method: "PATCH",
    headers,
    body: { content: "Edited direct smoke test" },
  });
  await request(`/api/thiscord/direct-messages/${directMessage.id}/reactions`, {
    method: "POST",
    headers: secondHeaders,
    body: { emoji: "✅" },
  });
  await request(`/api/thiscord/conversations/${conversation.id}/read`, {
    method: "POST",
    headers: secondHeaders,
    body: { lastMessage: directMessage.id },
  });
  const pinnedDirectMessage = await request(`/api/thiscord/direct-messages/${directMessage.id}`, {
    method: "PATCH",
    headers: secondHeaders,
    body: { pinned: true },
  });
  if (!pinnedDirectMessage.pinned) throw new Error("Direct-message pinning did not persist.");
  await request(`/api/thiscord/conversations/${conversation.id}/typing`, {
    method: "POST",
    headers: secondHeaders,
  });
  const directTyping = await request(
    `/api/collections/direct_typing/records?filter=${encodeURIComponent(`conversation = '${conversation.id}' && user = '${secondUser.id}'`)}`,
    { headers },
  );
  if (directTyping.totalItems !== 1) throw new Error("Direct-message typing was not visible to conversation members.");
  const unreadDirectNotifications = await request(
    `/api/collections/notifications/records?filter=${encodeURIComponent(`user = '${secondUser.id}' && readAt = ''`)}`,
    { headers: secondHeaders },
  );
  if (!unreadDirectNotifications.totalItems) throw new Error("Direct messages did not create a notification.");
  const readAll = await request("/api/thiscord/notifications/read-all", {
    method: "POST",
    headers: secondHeaders,
  });
  if (readAll.updated < 1) throw new Error("Bulk notification read did not update records.");
  const remainingUnreadNotifications = await request(
    `/api/collections/notifications/records?filter=${encodeURIComponent(`user = '${secondUser.id}' && readAt = ''`)}`,
    { headers: secondHeaders },
  );
  if (remainingUnreadNotifications.totalItems) throw new Error("Bulk notification read left unread records.");

  const updatedMembership = await request(`/api/thiscord/memberships/${secondMembership.id}`, {
    method: "PATCH",
    headers,
    body: { nickname: "Smoke nickname" },
  });
  if (updatedMembership.nickname !== "Smoke nickname") throw new Error("Member nickname did not persist.");
  const unreadSummary = await request(`/api/thiscord/communities/${community.id}/unread-summary`, { headers });
  if (!Array.isArray(unreadSummary.items)) throw new Error("Unread summary did not return a bounded item list.");
  const globalSearch = await request(
    `/api/thiscord/search?q=${encodeURIComponent("smoke")}`,
    { headers },
  );
  if (
    !Array.isArray(globalSearch.channels)
    || !Array.isArray(globalSearch.messages)
    || !Array.isArray(globalSearch.directMessages)
    || !Array.isArray(globalSearch.people)
  ) {
    throw new Error("Global search returned an invalid result shape.");
  }

  const callPresence = await request(`/api/thiscord/channels/${voiceChannel.id}/call-presence`, {
    method: "POST",
    headers,
    body: { state: "joined", muted: true, camera: false, sharing: false },
  });
  if (!callPresence.active || !callPresence.participant?.expiresAt) {
    throw new Error("Voice occupancy heartbeat was not persisted.");
  }
  const activeParticipants = await request(
    `/api/collections/call_participants/records?filter=${encodeURIComponent(`call = '${callPresence.call.id}' && leftAt = ''`)}`,
    { headers },
  );
  if (activeParticipants.totalItems !== 1) throw new Error("Active voice occupancy was not queryable.");
  await request(`/api/thiscord/channels/${voiceChannel.id}/call-presence`, {
    method: "POST",
    headers,
    body: { state: "left" },
  });
  const endedCall = await request(`/api/collections/call_sessions/records/${callPresence.call.id}`, { headers });
  if (!endedCall.endedAt) throw new Error("Empty voice call session did not end.");
  await Promise.all([
    request("/api/thiscord/presence", {
      method: "POST",
      headers,
      body: { deviceId: "smoke-concurrent-device", status: "online" },
    }),
    request("/api/thiscord/presence", {
      method: "POST",
      headers,
      body: { deviceId: "smoke-concurrent-device", status: "online" },
    }),
  ]);
  const concurrentPresence = await request(
    `/api/collections/presence/records?filter=${encodeURIComponent(`user = '${user.id}' && deviceId = 'smoke-concurrent-device'`)}`,
    { headers },
  );
  if (concurrentPresence.totalItems !== 1) throw new Error("Concurrent presence heartbeats created duplicate records.");

  const raceInvite = await request(`/api/thiscord/communities/${community.id}/invites`, {
    method: "POST",
    headers,
    body: { expiresInHours: 1, maxUses: 1 },
  });
  const raceA = await createAuthenticatedUser("racea", stamp, password);
  const raceB = await createAuthenticatedUser("raceb", stamp, password);
  const raceResults = await Promise.allSettled([
    request(`/api/thiscord/invites/${raceInvite.code}/accept`, { method: "POST", headers: raceA.headers }),
    request(`/api/thiscord/invites/${raceInvite.code}/accept`, { method: "POST", headers: raceB.headers }),
  ]);
  if (raceResults.filter((result) => result.status === "fulfilled").length !== 1) {
    throw new Error("A one-use invite did not admit exactly one concurrent request.");
  }
  const raceInviteAfter = await request(`/api/collections/invites/records/${raceInvite.id}`, { headers });
  if (raceInviteAfter.uses !== 1) throw new Error("Concurrent invite acceptance recorded an invalid use count.");
  const acceptedRace = raceResults[0].status === "fulfilled" ? raceA : raceB;
  const rejectedRace = raceResults[0].status === "rejected" ? raceA : raceB;
  await request("/api/thiscord/account", { method: "DELETE", headers: acceptedRace.headers });
  await request("/api/thiscord/account", { method: "DELETE", headers: rejectedRace.headers });
  await expectFailure("/api/collections/users/auth-with-password", [400], {
    method: "POST",
    body: { identity: acceptedRace.email, password },
  });

  const deletionUser = await createAuthenticatedUser("deleteowner", stamp, password);
  const deletionCommunity = await request("/api/thiscord/communities", {
    method: "POST",
    headers: deletionUser.headers,
    body: { name: "Delete owner community", slug: `delete-owner-${stamp}`, description: "" },
  });
  const deletionChannels = await request(
    `/api/collections/channels/records?filter=${encodeURIComponent(`community = '${deletionCommunity.id}'`)}`,
    { headers: deletionUser.headers },
  );
  const deletionTextChannel = deletionChannels.items.find((channel) => channel.kind === "text");
  if (!deletionTextChannel) throw new Error("Deletion-test community did not create a text channel.");
  await request("/api/thiscord/messages", {
    method: "POST",
    headers: deletionUser.headers,
    body: { channel: deletionTextChannel.id, content: "Delete owner authored message" },
  });
  const deletionDirect = await request("/api/thiscord/conversations", {
    method: "POST",
    headers: deletionUser.headers,
    body: { userIds: [user.id] },
  });
  await request("/api/thiscord/direct-messages", {
    method: "POST",
    headers: deletionUser.headers,
    body: { conversation: deletionDirect.id, content: "Delete owner direct message" },
  });
  const deletionGroup = await request("/api/thiscord/conversations", {
    method: "POST",
    headers: deletionUser.headers,
    body: { userIds: [user.id, secondUser.id], name: "Deletion transfer group" },
  });

  const deletionMainInvite = await request(`/api/thiscord/communities/${community.id}/invites`, {
    method: "POST",
    headers,
    body: { expiresInHours: 1, maxUses: 0 },
  });
  const deletionMembership = await request(`/api/thiscord/invites/${deletionMainInvite.code}/accept`, {
    method: "POST",
    headers: deletionUser.headers,
  });
  await request(`/api/thiscord/memberships/${deletionMembership.id}/roles`, {
    method: "PUT",
    headers,
    body: { roleIds: [adminRole.id] },
  });
  const moderationTarget = await createAuthenticatedUser("bantarget", stamp, password);
  const moderationTargetMembership = await request(`/api/thiscord/invites/${deletionMainInvite.code}/accept`, {
    method: "POST",
    headers: moderationTarget.headers,
  });
  await request(`/api/thiscord/communities/${community.id}/moderation`, {
    method: "POST",
    headers: deletionUser.headers,
    body: { action: "ban", userId: moderationTarget.user.id, reason: "Account deletion relation test" },
  });
  const deletionCall = await request(`/api/thiscord/channels/${voiceChannel.id}/call-presence`, {
    method: "POST",
    headers: deletionUser.headers,
    body: { state: "joined", muted: true, camera: false, sharing: false },
  });
  await request("/api/thiscord/account", { method: "DELETE", headers: deletionUser.headers });
  await expectFailure("/api/collections/users/auth-with-password", [400], {
    method: "POST",
    body: { identity: deletionUser.email, password },
  });
  await expectFailure(`/api/collections/communities/records/${deletionCommunity.id}`, [404], { headers });
  await expectFailure(`/api/collections/conversations/records/${deletionDirect.id}`, [404], { headers });
  const transferredGroup = await request(`/api/collections/conversations/records/${deletionGroup.id}`, { headers });
  if (transferredGroup.owner === deletionUser.user.id) throw new Error("Group ownership was not transferred during account deletion.");
  const transferredBan = (await request(
    `/api/thiscord/communities/${community.id}/bans`,
    { headers },
  )).items.find((ban) => ban.user === moderationTarget.user.id);
  if (!transferredBan || transferredBan.moderator !== user.id) {
    throw new Error("Ban moderation ownership was not preserved during account deletion.");
  }
  const closedDeletionCall = await request(`/api/collections/call_sessions/records/${deletionCall.call.id}`, { headers });
  if (!closedDeletionCall.endedAt || closedDeletionCall.startedBy !== user.id) {
    throw new Error("A deleted account left an active or invalid call session.");
  }
  await request("/api/thiscord/account", { method: "DELETE", headers: moderationTarget.headers });

  await expectFailure("/api/collections/users/records", [400], {
    method: "POST",
    body: {
      email: `duplicate-${stamp}@example.test`,
      emailVisibility: false,
      handle: user.handle,
      displayName: "Duplicate Handle",
      password,
      passwordConfirm: password,
    },
  });
  const search = await request(
    `/api/thiscord/communities/${community.id}/search?q=${encodeURIComponent("PocketBase")}`,
    { headers },
  );

  await stopServer();
  child = undefined;
  startServer();
  await waitUntilReady();
  const persistedSecondAuth = await request("/api/collections/users/auth-with-password", {
    method: "POST",
    body: { identity: secondEmail, password },
  });
  const persistedHeaders = { authorization: persistedSecondAuth.token };
  const persistedPermissions = await request(`/api/thiscord/communities/${community.id}/permissions`, {
    headers: persistedHeaders,
  });
  if (!persistedPermissions.permissions.includes("view_channels")) {
    throw new Error("Persisted JSON role permissions were not decoded after restart.");
  }
  const persistedChannels = await request(
    `/api/collections/channels/records?filter=${encodeURIComponent(`community = '${community.id}'`)}`,
    { headers: persistedHeaders },
  );
  if (persistedChannels.totalItems !== channels.totalItems - 1) {
    throw new Error("Normal-member channel access changed after a PocketBase restart.");
  }

  process.stdout.write(`${JSON.stringify({
    user: user.handle,
    community: community.slug,
    communityImageRemoval: true,
    categoryDeletionUnparentsChannels: true,
    channelCount: channels.totalItems,
    messagePinned: pinned.pinned,
    attachmentUpload: attachmentMessage.attachments.length === 1,
    jitsiRoom: jitsi.roomName,
    jwtIssued: Boolean(jitsi.jwt),
    assignedRole: role.name,
    normalMemberChannels: secondDefaultChannels.totalItems,
    normalMemberMessageSent: true,
    assignedRoleApplied: true,
    escalationBlocked: true,
    readHistoryDenied: true,
    deniedChannelHidden: true,
    inviteIdempotent: true,
    inviteAccepted: secondMembership.state === "active",
    directConversation: conversation.kind,
    directReactionTypingPinAndReadState: true,
    notificationReadAll: true,
    globalSearchAndUnreadSummary: true,
    memberNickname: updatedMembership.nickname,
    callOccupancyLifecycle: true,
    concurrentPresenceIdempotent: true,
    concurrentInviteLimit: true,
    accountDeletionRelations: true,
    duplicateHandleRejected: true,
    persistedPermissionsAfterRestart: true,
    searchResults: search.items.length,
  }, null, 2)}\n`);
} finally {
  await stopServer();
  await rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
