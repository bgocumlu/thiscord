import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const binary = process.env.POCKETBASE_BINARY;
if (!binary) throw new Error("Set POCKETBASE_BINARY to a PocketBase executable.");

const packageRoot = resolve(import.meta.dirname, "..");
const dataDir = await mkdtemp(resolve(tmpdir(), "thiscord-pocketbase-smoke-"));
const port = 18090 + Math.floor(Math.random() * 500);
const controlPort = port + 1_000;
const baseUrl = `http://127.0.0.1:${port}`;
const output = [];
const callControlRequests = [];
let child;
const callControlServer = createServer((request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    let body = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (
      request.method !== "PUT"
      || request.url !== "/thiscord-call-control"
      || request.headers.authorization !== "Bearer validation-secret-that-is-long-enough"
    ) {
      response.writeHead(403).end();
      return;
    }
    callControlRequests.push(body);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ kicked: body.userIds?.length ?? 0 }));
  });
});

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
      + output.join("").slice(-20_000),
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
    const body = await response.text();
    throw new Error(
      `${options.method ?? "GET"} ${path} unexpectedly returned ${response.status}: ${body}\n`
      + output.join("").slice(-20_000),
    );
  }
}

async function findInvite(communityId, inviteId, headers) {
  let page = 1;
  while (true) {
    const result = await request(
      `/api/thiscord/communities/${communityId}/invites?perPage=100&page=${page}`,
      { headers },
    );
    const invite = result.items.find((item) => item.id === inviteId);
    if (invite) return invite;
    if (!result.hasMore) throw new Error(`Invite ${inviteId} was not returned by the protected list route.`);
    page += 1;
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
      JITSI_CONTROL_URL: `http://127.0.0.1:${controlPort}/thiscord-call-control`,
      THISCORD_PUBLIC_URL: baseUrl,
      POCKETBASE_PUBLIC_URL: baseUrl,
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
  await new Promise((resolvePromise, reject) => {
    callControlServer.once("error", reject);
    callControlServer.listen(controlPort, "127.0.0.1", resolvePromise);
  });
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
  if ("preferences" in auth.record) throw new Error("Authentication exposed hidden user preferences.");
  await request("/api/thiscord/account/preferences", {
    method: "PATCH",
    headers,
    body: {
      preferences: {
        theme: "dark",
        compactMode: false,
        reduceMotion: false,
        notificationSound: true,
        mutedConversations: ["private-conversation-id"],
      },
    },
  });
  const privatePreferences = await request("/api/thiscord/account/preferences", { headers });
  if (privatePreferences.preferences.mutedConversations?.[0] !== "private-conversation-id") {
    throw new Error("Owner-only preferences did not round-trip.");
  }
  const publicOwnUser = await request(`/api/collections/users/records/${user.id}`, { headers });
  if ("preferences" in publicOwnUser) throw new Error("Standard user serialization exposed preferences.");
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
    `/api/thiscord/communities/${community.id}/channels?page=1&perPage=100`,
    { headers },
  );
  const textChannel = channels.items.find((channel) => channel.kind === "text");
  const voiceChannel = channels.items.find((channel) => channel.kind === "voice");
  if (!textChannel || !voiceChannel) throw new Error("Default channels were not created.");
  if (channels.hasMore) {
    throw new Error("Paginated channel directory did not return all visible default channels.");
  }
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
  const communityBeforeCategoryDelete = await request(
    `/api/collections/communities/records/${community.id}`,
    { headers },
  );
  await request(`/api/thiscord/channels/${disposableCategory.id}`, { method: "DELETE", headers });
  const communityAfterCategoryDelete = await request(
    `/api/collections/communities/records/${community.id}`,
    { headers },
  );
  if (communityAfterCategoryDelete.accessRevision <= communityBeforeCategoryDelete.accessRevision) {
    throw new Error("Category reparenting did not advance the community access revision.");
  }
  const unparentedChild = await request(`/api/collections/channels/records/${categoryChild.id}`, { headers });
  if (unparentedChild.parent) throw new Error("Deleting a category did not keep and unparent its channels.");
  await request(`/api/thiscord/channels/${categoryChild.id}`, { method: "DELETE", headers });
  const message = await request("/api/thiscord/messages", {
    method: "POST",
    headers,
    body: { channel: textChannel.id, content: "PocketBase smoke test" },
  });
  const messagePage = await request(
    `/api/thiscord/channels/${textChannel.id}/messages?page=1&perPage=50`,
    { headers },
  );
  if (messagePage.items?.[0]?.id !== message.id || messagePage.hasMore) {
    throw new Error("Paginated channel messages did not return the created message.");
  }
  const focusedMessage = await request(`/api/thiscord/messages/${message.id}`, { headers });
  if (focusedMessage.id !== message.id || focusedMessage.channel !== textChannel.id) {
    throw new Error("A focused channel message could not be loaded independently of its page.");
  }
  await request(`/api/thiscord/channels/${textChannel.id}/typing`, {
    method: "POST",
    headers,
  });
  const channelTyping = await request(`/api/thiscord/channels/${textChannel.id}/typing`, { headers });
  if (!channelTyping.items?.some((item) => item.user === user.id)) {
    throw new Error("Aggregated channel typing did not return the active author.");
  }
  await request(`/api/thiscord/messages/${message.id}/reactions`, {
    method: "POST",
    headers,
    body: { emoji: "✅" },
  });
  const channelReactions = await request(`/api/thiscord/channels/${textChannel.id}/reactions/query`, {
    method: "POST",
    headers,
    body: { messageIds: [message.id] },
  });
  if (channelReactions.reactions?.length !== 1) {
    throw new Error("Aggregated channel reactions did not return the visible message reaction.");
  }
  const attachmentForm = new FormData();
  attachmentForm.set("channel", textChannel.id);
  attachmentForm.set("content", "Attachment smoke test");
  attachmentForm.append("attachments", new Blob(["smoke attachment"], { type: "text/plain" }), "smoke.txt");
  const attachmentMessage = await requestForm("/api/thiscord/messages", attachmentForm, {
    authorization: auth.token,
  });
  if (attachmentMessage.attachments?.length !== 1) throw new Error("Message attachment upload did not persist.");
  const firstHistoryPage = await request(
    `/api/thiscord/channels/${textChannel.id}/messages?perPage=1`,
    { headers },
  );
  const secondHistoryPage = await request(
    `/api/thiscord/channels/${textChannel.id}/messages?perPage=1&beforeCreated=${encodeURIComponent(firstHistoryPage.nextCursor.created)}&beforeId=${encodeURIComponent(firstHistoryPage.nextCursor.id)}`,
    { headers },
  );
  if (
    firstHistoryPage.items.length !== 1
    || secondHistoryPage.items.length !== 1
    || firstHistoryPage.items[0].id === secondHistoryPage.items[0].id
  ) {
    throw new Error("Channel message cursor did not advance without overlap.");
  }
  const attachmentFilePath = `/api/files/${attachmentMessage.collectionId}/${attachmentMessage.id}/${encodeURIComponent(attachmentMessage.attachments[0])}`;
  await expectFailure(attachmentFilePath, [403]);
  const ownerFileToken = await request("/api/files/token", { method: "POST", headers });
  const ownerAttachment = await request(`${attachmentFilePath}?token=${encodeURIComponent(ownerFileToken.token)}`);
  if (ownerAttachment !== "smoke attachment") throw new Error("An authorized member could not download a channel attachment.");
  const pinned = await request(`/api/thiscord/messages/${message.id}`, {
    method: "PATCH",
    headers,
    body: { pinned: true },
  });
  if ("jitsiRoom" in voiceChannel) throw new Error("Voice channels still expose a legacy Jitsi room field.");
  const callJoin = await request(`/api/thiscord/calls/channel/${voiceChannel.id}/join`, { headers });
  if (!callJoin.roomName) throw new Error("The voice channel does not have a private call room.");
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
  const invitePreview = await request(`/api/thiscord/invites/${invite.code}/preview`);
  if (invitePreview.community.id !== community.id || invitePreview.memberCount !== 1) {
    throw new Error("Public invite preview did not return the community and member count.");
  }
  await expectFailure("/api/collections/invites/records", [403], { headers });
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
  const secondFileToken = await request("/api/files/token", { method: "POST", headers: secondHeaders });
  const secondMembership = await request(`/api/thiscord/invites/${invite.code}/accept`, {
    method: "POST",
    headers: secondHeaders,
  });
  const repeatedMembership = await request(`/api/thiscord/invites/${invite.code}/accept`, {
    method: "POST",
    headers: secondHeaders,
  });
  if (repeatedMembership.id !== secondMembership.id) throw new Error("Invite acceptance was not idempotent.");
  const inviteAfterRepeat = await findInvite(community.id, invite.id, headers);
  if (inviteAfterRepeat.uses !== 1) throw new Error("Repeated invite acceptance consumed another use.");
  await request("/api/thiscord/account/preferences", {
    method: "PATCH",
    headers: secondHeaders,
    body: { preferences: { mutedChannels: [textChannel.id] } },
  });
  const mutedMention = await request("/api/thiscord/messages", {
    method: "POST",
    headers,
    body: { channel: textChannel.id, content: `Muted mention @second${stamp}` },
  });
  const mutedMentionNotifications = await request(
    `/api/collections/notifications/records?filter=${encodeURIComponent(
      `user = '${secondUser.id}' && message = '${mutedMention.id}'`,
    )}`,
    { headers: secondHeaders },
  );
  if (mutedMentionNotifications.totalItems) {
    throw new Error("A muted channel generated a notification.");
  }
  await request("/api/thiscord/account/preferences", {
    method: "PATCH",
    headers: secondHeaders,
    body: { preferences: { mutedChannels: [] } },
  });
  const secondAttachment = await request(`${attachmentFilePath}?token=${encodeURIComponent(secondFileToken.token)}`);
  if (secondAttachment !== "smoke attachment") throw new Error("A channel member could not download an attachment.");
  const secondDefaultChannels = await request(
    `/api/thiscord/communities/${community.id}/channels?page=1&perPage=100`,
    { headers: secondHeaders },
  );
  if (secondDefaultChannels.items.length !== channels.items.length) {
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
  const channelOverwrites = await request(`/api/thiscord/channels/${textChannel.id}/permissions`, { headers });
  if (!channelOverwrites.items?.some((item) => item.targetId === secondMembership.id)) {
    throw new Error("Aggregated channel permissions did not include the member overwrite.");
  }
  const revisionCommunity = await request(`/api/collections/communities/records/${community.id}`, { headers });
  if (!(revisionCommunity.accessRevision > 0)) {
    throw new Error("Channel overwrite did not advance the community access revision.");
  }
  await expectFailure(
    `/api/collections/messages/records?filter=${encodeURIComponent(`channel = '${textChannel.id}'`)}`,
    [403],
    { headers: secondHeaders },
  );
  await expectFailure(
    `/api/thiscord/channels/${textChannel.id}/messages?page=1&perPage=50`,
    [403],
    { headers: secondHeaders },
  );
  await expectFailure(
    `/api/thiscord/channels/${textChannel.id}/reactions/query`,
    [403],
    { method: "POST", headers: secondHeaders, body: { messageIds: [message.id] } },
  );
  await expectFailure(`${attachmentFilePath}?token=${encodeURIComponent(secondFileToken.token)}`, [403]);
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
    `/api/thiscord/communities/${community.id}/channels?page=1&perPage=100`,
    { headers: secondHeaders },
  );
  if (secondVisibleChannels.items.some((channel) => channel.id === textChannel.id)) {
    throw new Error("Channel permission overwrite did not hide the denied channel.");
  }
  const secondChannelDirectory = await request(
    `/api/thiscord/communities/${community.id}/channels?page=1&perPage=100`,
    { headers: secondHeaders },
  );
  if (secondChannelDirectory.items.some((channel) => channel.id === textChannel.id)) {
    throw new Error("Paginated channel directory exposed a hidden channel.");
  }
  await expectFailure(
    `/api/collections/messages/records?filter=${encodeURIComponent(`channel = '${textChannel.id}'`)}`,
    [403],
    { headers: secondHeaders },
  );
  const conversation = await request("/api/thiscord/conversations", {
    method: "POST",
    headers,
    body: { kind: "direct", userIds: [secondUser.id] },
  });
  const conversationDirectory = await request("/api/thiscord/conversations?perPage=1", { headers });
  if (
    conversationDirectory.conversations?.[0]?.id !== conversation.id
    || conversationDirectory.members?.length !== 2
  ) {
    throw new Error("Paginated conversation directory did not aggregate authorized members.");
  }
  const directMessage = await request("/api/thiscord/direct-messages", {
    method: "POST",
    headers,
    body: { conversation: conversation.id, content: "Direct smoke test" },
  });
  const focusedDirectMessage = await request(
    `/api/collections/direct_messages/records/${directMessage.id}?expand=author%2CreplyTo%2CreplyTo.author`,
    { headers },
  );
  if (focusedDirectMessage.id !== directMessage.id || focusedDirectMessage.conversation !== conversation.id) {
    throw new Error("A focused direct message could not be loaded independently of its page.");
  }
  const directAttachmentForm = new FormData();
  directAttachmentForm.set("conversation", conversation.id);
  directAttachmentForm.set("content", "Direct attachment smoke test");
  directAttachmentForm.append("attachments", new Blob(["direct smoke attachment"], { type: "text/plain" }), "direct-smoke.txt");
  const directAttachmentMessage = await requestForm("/api/thiscord/direct-messages", directAttachmentForm, {
    authorization: auth.token,
  });
  if (directAttachmentMessage.attachments?.length !== 1) throw new Error("Direct-message attachment upload did not persist.");
  const firstDirectHistoryPage = await request(
    `/api/thiscord/conversations/${conversation.id}/messages?perPage=1`,
    { headers },
  );
  const secondDirectHistoryPage = await request(
    `/api/thiscord/conversations/${conversation.id}/messages?perPage=1&beforeCreated=${encodeURIComponent(firstDirectHistoryPage.nextCursor.created)}&beforeId=${encodeURIComponent(firstDirectHistoryPage.nextCursor.id)}`,
    { headers },
  );
  if (
    firstDirectHistoryPage.items.length !== 1
    || secondDirectHistoryPage.items.length !== 1
    || firstDirectHistoryPage.items[0].id === secondDirectHistoryPage.items[0].id
  ) {
    throw new Error("Direct-message cursor did not advance without overlap.");
  }
  const directAttachmentFilePath = `/api/files/${directAttachmentMessage.collectionId}/${directAttachmentMessage.id}/${encodeURIComponent(directAttachmentMessage.attachments[0])}`;
  await expectFailure(directAttachmentFilePath, [403]);
  const currentDirectFileToken = await request("/api/files/token", { method: "POST", headers });
  const memberDirectFileToken = await request("/api/files/token", { method: "POST", headers: secondHeaders });
  const directAttachment = await request(`${directAttachmentFilePath}?token=${encodeURIComponent(currentDirectFileToken.token)}`);
  if (directAttachment !== "direct smoke attachment") throw new Error("A conversation member could not download a direct attachment.");
  const secondDirectAttachment = await request(`${directAttachmentFilePath}?token=${encodeURIComponent(memberDirectFileToken.token)}`);
  if (secondDirectAttachment !== "direct smoke attachment") throw new Error("The other conversation member could not download a direct attachment.");
  const fileOutsider = await createAuthenticatedUser("fileoutsider", stamp, password);
  const outsiderFileToken = await request("/api/files/token", { method: "POST", headers: fileOutsider.headers });
  await expectFailure(`${directAttachmentFilePath}?token=${encodeURIComponent(outsiderFileToken.token)}`, [403]);
  await expectFailure(
    `/api/thiscord/conversations/${conversation.id}/reactions/query`,
    [403],
    { method: "POST", headers: fileOutsider.headers, body: { messageIds: [directMessage.id] } },
  );
  await expectFailure(
    `/api/thiscord/communities/${community.id}/members?page=1&perPage=50`,
    [403],
    { headers: fileOutsider.headers },
  );
  const secondConversation = await request("/api/thiscord/conversations", {
    method: "POST",
    headers,
    body: { kind: "direct", userIds: [fileOutsider.user.id] },
  });
  const firstConversationPage = await request("/api/thiscord/conversations?perPage=1", { headers });
  if (!firstConversationPage.nextCursor) {
    throw new Error("Conversation activity pagination did not return a cursor.");
  }
  const secondConversationPage = await request(
    `/api/thiscord/conversations?perPage=1&beforeActivity=${encodeURIComponent(firstConversationPage.nextCursor.activity)}&beforeId=${encodeURIComponent(firstConversationPage.nextCursor.id)}`,
    { headers },
  );
  if (
    firstConversationPage.conversations[0].id !== secondConversation.id
    || secondConversationPage.conversations[0].id !== conversation.id
  ) {
    throw new Error("Conversation activity cursor did not advance without overlap.");
  }
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
  const directReactions = await request(`/api/thiscord/conversations/${conversation.id}/reactions/query`, {
    method: "POST",
    headers,
    body: { messageIds: [directMessage.id] },
  });
  if (directReactions.reactions?.length !== 1) {
    throw new Error("Aggregated conversation reactions did not return the visible message reaction.");
  }
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
  const authoritativeUnreadCount = await request(
    "/api/thiscord/notifications/unread-count",
    { headers: secondHeaders },
  );
  if (authoritativeUnreadCount.count !== unreadDirectNotifications.totalItems) {
    throw new Error("Notification unread count did not match persisted unread records.");
  }
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

  const conversationCallJoin = await request(
    `/api/thiscord/calls/conversation/${conversation.id}/join`,
    { headers },
  );
  if (
    !conversationCallJoin.jwt
    || !conversationCallJoin.canSpeak
    || !conversationCallJoin.canStreamVideo
    || conversationCallJoin.moderator
  ) {
    throw new Error("Conversation call policy was not reflected in its media token.");
  }
  await expectFailure(
    `/api/thiscord/calls/conversation/${conversation.id}/join`,
    [403],
    { headers: fileOutsider.headers },
  );
  const firstConversationPresence = await request(
    `/api/thiscord/calls/conversation/${conversation.id}/presence`,
    {
      method: "POST",
      headers,
      body: {
        state: "joined",
        leaseId: "conversation-laptop",
        sequence: 1,
        muted: true,
        camera: false,
        sharing: false,
      },
    },
  );
  const secondConversationPresence = await request(
    `/api/thiscord/calls/conversation/${conversation.id}/presence`,
    {
      method: "POST",
      headers,
      body: {
        state: "joined",
        leaseId: "conversation-phone",
        sequence: 1,
        muted: true,
        camera: false,
        sharing: false,
      },
    },
  );
  if (
    firstConversationPresence.call.id !== secondConversationPresence.call.id
    || firstConversationPresence.participant.id !== secondConversationPresence.participant.id
  ) {
    throw new Error("Simultaneous devices did not share one conversation occupant.");
  }
  const conversationParticipants = await request("/api/thiscord/calls/occupancy", {
    method: "POST",
    headers: secondHeaders,
    body: { targets: [{ kind: "conversation", id: conversation.id }] },
  });
  const conversationRoom = conversationParticipants.participants[0]?.expand?.call?.expand?.room;
  if (
    conversationParticipants.participants.length !== 1
    || conversationRoom?.conversation !== conversation.id
    || "roomName" in conversationRoom
  ) {
    throw new Error("Conversation occupancy was not private and target-scoped.");
  }
  const conversationCallNotifications = await request(
    `/api/collections/notifications/records?filter=${encodeURIComponent(`user = '${secondUser.id}' && type = 'conversation_call' && readAt = ''`)}`,
    { headers: secondHeaders },
  );
  if (conversationCallNotifications.totalItems !== 1) {
    throw new Error("Conversation call initiation did not notify an eligible member once.");
  }
  const oneDeviceLeft = await request(
    `/api/thiscord/calls/conversation/${conversation.id}/presence`,
    {
      method: "POST",
      headers,
      body: { state: "left", leaseId: "conversation-laptop", sequence: 2 },
    },
  );
  if (!oneDeviceLeft.active) throw new Error("One device leaving removed another active device.");
  const finalConversationPresence = await request(`/api/thiscord/calls/conversation/${conversation.id}/presence`, {
    method: "POST",
    headers,
    body: { state: "left", leaseId: "conversation-phone", sequence: 2 },
  });
  if (finalConversationPresence.active) {
    throw new Error(`Final conversation device remained active: ${JSON.stringify(finalConversationPresence)}`);
  }
  const endedConversationCall = await request(
    `/api/collections/call_sessions/records/${firstConversationPresence.call.id}`,
    { headers },
  );
  if (!endedConversationCall.endedAt) throw new Error("The empty conversation call did not end.");
  const membershipCallGroup = await request("/api/thiscord/conversations", {
    method: "POST",
    headers,
    body: {
      kind: "group",
      userIds: [secondUser.id, fileOutsider.user.id],
      name: "Call membership smoke",
    },
  });
  const removedMemberJoin = await request(
    `/api/thiscord/calls/conversation/${membershipCallGroup.id}/join`,
    { headers: secondHeaders },
  );
  if (!removedMemberJoin.jwt) {
    throw new Error("The membership-revocation fixture did not issue a media token.");
  }
  const removedMemberTokenClaims = JSON.parse(
    Buffer.from(removedMemberJoin.jwt.split(".")[1], "base64url").toString("utf8"),
  );
  const removedMemberTokenVersion = removedMemberTokenClaims.context?.user?.thiscordTokenVersion;
  if (removedMemberTokenVersion !== 1) {
    throw new Error(`The first issued media token had version ${removedMemberTokenVersion}.`);
  }
  const refreshedRemovedMemberJoin = await request(
    `/api/thiscord/calls/conversation/${membershipCallGroup.id}/join`,
    { headers: secondHeaders },
  );
  const refreshedRemovedMemberClaims = JSON.parse(
    Buffer.from(refreshedRemovedMemberJoin.jwt.split(".")[1], "base64url").toString("utf8"),
  );
  const refreshedRemovedMemberVersion = refreshedRemovedMemberClaims.context?.user?.thiscordTokenVersion;
  if (refreshedRemovedMemberVersion !== 2) {
    throw new Error(`The refreshed media token had version ${refreshedRemovedMemberVersion}.`);
  }
  const removedMemberPresence = await request(
    `/api/thiscord/calls/conversation/${membershipCallGroup.id}/presence`,
    {
      method: "POST",
      headers: secondHeaders,
      body: {
        state: "joined",
        leaseId: "removed-member-device",
        sequence: 1,
      },
    },
  );
  await request(
    `/api/thiscord/conversations/${membershipCallGroup.id}/members/${secondUser.id}`,
    { method: "DELETE", headers },
  );
  await expectFailure(
    `/api/thiscord/calls/conversation/${membershipCallGroup.id}/join`,
    [403],
    { headers: secondHeaders },
  );
  const revokedMemberCall = await request(
    `/api/collections/call_sessions/records/${removedMemberPresence.call.id}`,
    { headers },
  );
  if (!revokedMemberCall.endedAt) {
    throw new Error("Removing a group member did not end their final active call presence.");
  }
  if (!callControlRequests.some((item) => (
    item.action === "revoke"
    && item.roomName
    && item.userIds?.includes(secondUser.id)
    && item.tokenVersion === refreshedRemovedMemberVersion
    && item.expiresAt > Date.now()
  ))) {
    throw new Error(
      `Removing a group member did not invalidate their issued media token: ${JSON.stringify(callControlRequests)}\n`
      + output.join("").slice(-20_000),
    );
  }
  if (!callControlRequests.some((item) => (
    item.action === "kick" && item.roomName && item.userIds?.includes(secondUser.id)
  ))) {
    throw new Error("Removing a group member did not eject their live media participant.");
  }

  const updatedMembership = await request(`/api/thiscord/memberships/${secondMembership.id}`, {
    method: "PATCH",
    headers,
    body: { nickname: "Smoke nickname" },
  });
  if (updatedMembership.nickname !== "Smoke nickname") throw new Error("Member nickname did not persist.");
  const memberDirectory = await request(
    `/api/thiscord/communities/${community.id}/members?page=1&perPage=1`,
    { headers },
  );
  if (
    memberDirectory.items?.length !== 1
    || memberDirectory.hasMore !== true
    || !Array.isArray(memberDirectory.memberRoles)
    || !Array.isArray(memberDirectory.presence)
  ) {
    throw new Error("Paginated member directory did not return a bounded aggregate.");
  }
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

  const callPresence = await request(`/api/thiscord/calls/channel/${voiceChannel.id}/presence`, {
    method: "POST",
    headers,
    body: {
      state: "joined",
      leaseId: "voice-smoke-device",
      sequence: 1,
      muted: true,
      camera: false,
      sharing: false,
    },
  });
  if (!callPresence.active || !callPresence.participant?.expiresAt) {
    throw new Error("Voice occupancy heartbeat was not persisted.");
  }
  const occupancy = await request("/api/thiscord/calls/occupancy", {
    method: "POST",
    headers,
    body: { targets: [{ kind: "channel", id: voiceChannel.id }] },
  });
  if (occupancy.participants?.length !== 1) {
    throw new Error(`Aggregated call occupancy did not return the active participant: ${JSON.stringify(occupancy)}`);
  }
  const activeParticipants = occupancy.participants;
  if (activeParticipants.length !== 1) throw new Error("Active voice occupancy was not queryable.");
  const expandedRoom = activeParticipants[0]?.expand?.call?.expand?.room;
  if (expandedRoom?.channel !== voiceChannel.id || "roomName" in expandedRoom) {
    throw new Error("Voice occupancy did not resolve through its private call room.");
  }
  await request(`/api/thiscord/calls/channel/${voiceChannel.id}/presence`, {
    method: "POST",
    headers,
    body: { state: "left", leaseId: "voice-smoke-device", sequence: 2 },
  });
  const endedCall = await request(`/api/collections/call_sessions/records/${callPresence.call.id}`, { headers });
  if (!endedCall.endedAt) throw new Error("Empty voice call session did not end.");
  await Promise.all([
    request("/api/thiscord/presence", {
      method: "POST",
      headers,
      body: { leaseId: "smoke-concurrent-device", sequence: 1, status: "online" },
    }),
    request("/api/thiscord/presence", {
      method: "POST",
      headers,
      body: { leaseId: "smoke-concurrent-device", sequence: 1, status: "online" },
    }),
  ]);
  const concurrentPresence = await request(
    `/api/collections/presence/records?filter=${encodeURIComponent(`user = '${user.id}'`)}`,
    { headers },
  );
  if (concurrentPresence.totalItems !== 1 || concurrentPresence.items[0]?.status !== "online") {
    throw new Error("Concurrent presence heartbeats did not produce one online aggregate.");
  }
  const communityPresence = await request(
    `/api/collections/presence/records?filter=${encodeURIComponent(`user.memberships_via_user.community ?= '${community.id}'`)}`,
    { headers },
  );
  if (!communityPresence.items.some((item) => item.user === user.id)) {
    throw new Error("Community-scoped presence filtering did not include the active member.");
  }

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
  const raceInviteAfter = await findInvite(community.id, raceInvite.id, headers);
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
    `/api/thiscord/communities/${deletionCommunity.id}/channels?page=1&perPage=100`,
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
    body: { kind: "direct", userIds: [user.id] },
  });
  await request("/api/thiscord/direct-messages", {
    method: "POST",
    headers: deletionUser.headers,
    body: { conversation: deletionDirect.id, content: "Delete owner direct message" },
  });
  const deletionGroup = await request("/api/thiscord/conversations", {
    method: "POST",
    headers: deletionUser.headers,
    body: { kind: "group", userIds: [user.id, secondUser.id], name: "Deletion transfer group" },
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
  const ownBannedTombstone = await request(
    `/api/collections/memberships/records/${moderationTargetMembership.id}`,
    { headers: moderationTarget.headers },
  );
  if (ownBannedTombstone.state !== "banned") {
    throw new Error("A revoked user could not read their own membership tombstone.");
  }
  const deletionCall = await request(`/api/thiscord/calls/channel/${voiceChannel.id}/presence`, {
    method: "POST",
    headers: deletionUser.headers,
    body: {
      state: "joined",
      leaseId: "deletion-smoke-device",
      sequence: 1,
      muted: true,
      camera: false,
      sharing: false,
    },
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
  if (!callControlRequests.some((item) => item.userIds?.includes(deletionUser.user.id))) {
    throw new Error("Account deletion did not eject the user's live media participant.");
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
    `/api/thiscord/communities/${community.id}/channels?page=1&perPage=100`,
    { headers: persistedHeaders },
  );
  if (persistedChannels.items.length !== channels.items.length - 1) {
    throw new Error("Normal-member channel access changed after a PocketBase restart.");
  }

  process.stdout.write(`${JSON.stringify({
    user: user.handle,
    community: community.slug,
    communityImageRemoval: true,
    categoryDeletionUnparentsChannels: true,
    categoryDeletionSignalsAccessChange: true,
    privatePreferences: true,
    mutedChannelNotifications: true,
    revocationTombstones: true,
    channelCount: channels.items.length,
    messagePinned: pinned.pinned,
    focusedMessageLookup: true,
    channelAttachmentAccess: true,
    stableChannelHistoryCursor: true,
    callRoomBacked: Boolean(callJoin.roomName),
    jwtIssued: Boolean(callJoin.jwt),
    assignedRole: role.name,
    normalMemberChannels: secondDefaultChannels.items.length,
    normalMemberMessageSent: true,
    assignedRoleApplied: true,
    escalationBlocked: true,
    readHistoryDenied: true,
    deniedChannelHidden: true,
    inviteIdempotent: true,
    invitePreview: true,
    inviteAccepted: secondMembership.state === "active",
    directConversation: conversation.kind,
    focusedDirectMessageLookup: true,
    directAttachmentAccess: true,
    stableDirectHistoryCursor: true,
    stableConversationDirectoryCursor: true,
    directReactionTypingPinAndReadState: true,
    notificationReadAll: true,
    authoritativeNotificationCount: true,
    conversationCallLifecycle: true,
    conversationCallNotifications: true,
    simultaneousCallDevices: true,
    conversationCallMembershipRevocation: true,
    prePresenceCallTokenRevocation: true,
    mediaServerRevocation: true,
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
  await new Promise((resolvePromise) => callControlServer.close(resolvePromise));
  await rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
