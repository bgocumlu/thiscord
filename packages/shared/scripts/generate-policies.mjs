import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sharedRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(sharedRoot, "../..");
const manifestPath = resolve(sharedRoot, "policies/manifest.json");
const typescriptPath = resolve(sharedRoot, "src/policies.generated.ts");
const pocketBasePath = resolve(repositoryRoot, "packages/pocketbase/pb_hooks/lib/policies.generated.js");
const schemaPath = resolve(repositoryRoot, "packages/pocketbase/pb_migrations/1785031200_v2_baseline.js");
const check = process.argv.includes("--check");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
validateManifest(manifest);
await validateSchemaSnapshot(manifest);

const banner = "// Generated from packages/shared/policies/manifest.json. Do not edit.\n";
const serialized = JSON.stringify(manifest, null, 2);
const typescript = `${banner}export const policyManifest = ${serialized} as const\n\n`
  + "export const permissionDefinitions = policyManifest.permissions\n"
  + "export const permissionGroups = policyManifest.permissionGroups\n"
  + "export const permissions = permissionDefinitions.map((permission) => permission.id)\n"
  + "export const defaultMemberPermissions = policyManifest.defaultMemberPermissions\n"
  + "export const permissionImplications = policyManifest.permissionImplications\n"
  + "export const permissionRestrictions = policyManifest.permissionRestrictions\n"
  + "export const channelCapabilities = policyManifest.channelCapabilities\n"
  + "export const channelKinds = Object.keys(channelCapabilities) as (keyof typeof channelCapabilities)[]\n"
  + "export const policyLimits = policyManifest.limits\n"
  + "export const transientTimings = policyManifest.transientTimings\n";
const pocketBase = `${banner}const POLICY_MANIFEST = ${serialized};\n\n`
  + "const PERMISSION_DEFINITIONS = POLICY_MANIFEST.permissions;\n"
  + "const PERMISSION_GROUPS = POLICY_MANIFEST.permissionGroups;\n"
  + "const ALL_PERMISSIONS = PERMISSION_DEFINITIONS.map((permission) => permission.id);\n"
  + "const DEFAULT_MEMBER_PERMISSIONS = POLICY_MANIFEST.defaultMemberPermissions;\n"
  + "const PERMISSION_IMPLICATIONS = POLICY_MANIFEST.permissionImplications;\n"
  + "const PERMISSION_RESTRICTIONS = POLICY_MANIFEST.permissionRestrictions;\n"
  + "const CHANNEL_CAPABILITIES = POLICY_MANIFEST.channelCapabilities;\n"
  + "const CHANNEL_KINDS = Object.keys(CHANNEL_CAPABILITIES);\n"
  + "const POLICY_LIMITS = POLICY_MANIFEST.limits;\n"
  + "const TRANSIENT_TIMINGS = POLICY_MANIFEST.transientTimings;\n\n"
  + "module.exports = {\n"
  + "  POLICY_MANIFEST,\n"
  + "  PERMISSION_DEFINITIONS,\n"
  + "  PERMISSION_GROUPS,\n"
  + "  ALL_PERMISSIONS,\n"
  + "  DEFAULT_MEMBER_PERMISSIONS,\n"
  + "  PERMISSION_IMPLICATIONS,\n"
  + "  PERMISSION_RESTRICTIONS,\n"
  + "  CHANNEL_CAPABILITIES,\n"
  + "  CHANNEL_KINDS,\n"
  + "  POLICY_LIMITS,\n"
  + "  TRANSIENT_TIMINGS,\n"
  + "};\n";

if (check) {
  await assertCurrent(typescriptPath, typescript);
  await assertCurrent(pocketBasePath, pocketBase);
} else {
  await Promise.all([
    writeFile(typescriptPath, typescript),
    writeFile(pocketBasePath, pocketBase),
  ]);
}

function validateManifest(value) {
  const permissionIds = value.permissions.map((permission) => permission.id);
  const permissionSet = new Set(permissionIds);
  if (permissionSet.size !== permissionIds.length) fail("permission identifiers must be unique");
  if (!permissionSet.has("administrator")) fail("administrator permission is required");

  const groupSet = new Set(value.permissionGroups.map((group) => group.id));
  for (const permission of value.permissions) {
    if (!groupSet.has(permission.group)) fail(`unknown permission group: ${permission.group}`);
  }
  for (const list of [
    value.defaultMemberPermissions,
    value.permissionRestrictions.hiddenChannelRemoves,
    value.permissionRestrictions.timeoutRemoves,
  ]) {
    for (const permission of list) {
      if (!permissionSet.has(permission)) fail(`unknown permission reference: ${permission}`);
    }
  }
  for (const [kind, capabilities] of Object.entries(value.channelCapabilities)) {
    if (!capabilities.container && !capabilities.messages && !capabilities.calls) {
      fail(`channel kind ${kind} has no supported behavior`);
    }
    for (const group of capabilities.permissionGroups) {
      if (!groupSet.has(group)) fail(`unknown channel permission group: ${group}`);
    }
    for (const permission of capabilities.postingPermissions) {
      if (!permissionSet.has(permission)) fail(`unknown posting permission: ${permission}`);
    }
  }
  if (value.limits.conversation.membersMin !== 2) fail("direct conversations require two total members");
  if (value.transientTimings.callHeartbeatMs >= value.transientTimings.callParticipantExpiryMs) {
    fail("call heartbeat must be shorter than participant expiry");
  }
  if (value.transientTimings.presenceHeartbeatMs >= value.transientTimings.presenceExpiryMs) {
    fail("presence heartbeat must be shorter than presence expiry");
  }
}

async function validateSchemaSnapshot(value) {
  const schema = (await readFile(schemaPath, "utf8")).replace(/\r\n/g, "\n");
  const limits = value.limits;
  const expected = [
    `name: "handle",\n    required: true,\n    min: ${limits.profile.handleMin},\n    max: ${limits.profile.handleMax},`,
    `new TextField({ name: "displayName", required: true, min: 1, max: ${limits.profile.displayNameMax}, presentable: true })`,
    `new TextField({ name: "bio", max: ${limits.profile.bioMax} })`,
    `new TextField({ name: "customStatus", max: ${limits.profile.customStatusMax} })`,
    `name: "preferences",\n    maxSize: ${limits.profile.preferencesBytesMax / 1024} * 1024,\n    hidden: true,`,
    `{ type: "text", name: "name", required: true, min: 1, max: ${limits.community.nameMax}, presentable: true }`,
    `{ type: "text", name: "slug", required: true, min: ${limits.community.slugMin}, max: ${limits.community.slugMax},`,
    `{ type: "text", name: "description", max: ${limits.community.descriptionMax} }`,
    `{ type: "text", name: "nickname", max: ${limits.membership.nicknameMax} }`,
    `{ type: "text", name: "name", required: true, max: ${limits.role.nameMax}, presentable: true }`,
    `{ type: "text", name: "color", max: ${limits.role.colorMax} }`,
    `{ type: "text", name: "topic", max: ${limits.channel.topicMax} }`,
    `{ type: "select", name: "kind", required: true, maxSelect: 1, values: [${Object.keys(value.channelCapabilities).map((kind) => `"${kind}"`).join(", ")}] }`,
    `{ type: "number", name: "slowmodeSeconds", min: 0, max: ${limits.channel.slowmodeSecondsMax}, onlyInt: true }`,
    `{ type: "select", name: "kind", required: true, maxSelect: 1, values: ["direct", "group"] }`,
    `{ type: "text", name: "name", max: ${limits.conversation.nameMax} }`,
    `const conversationMemberLimit = ${limits.conversation.membersMax};`,
    `{ type: "text", name: "content", max: ${limits.message.contentMax} }`,
    `{ type: "file", name: "attachments", maxSelect: ${limits.message.attachmentsMax}, maxSize: ${limits.message.attachmentBytesMax / 1024 / 1024} * 1024 * 1024 }`,
  ];
  for (const snippet of expected) {
    if (!schema.includes(snippet)) fail(`schema snapshot does not match policy: ${snippet}`);
  }
}

async function assertCurrent(path, expected) {
  let actual = "";
  try {
    actual = await readFile(path, "utf8");
  } catch {
    fail(`missing generated artifact: ${path}`);
  }
  if (actual !== expected) fail(`generated policy drift: ${path}`);
}

function fail(message) {
  console.error(`Policy manifest error: ${message}`);
  process.exit(1);
}
