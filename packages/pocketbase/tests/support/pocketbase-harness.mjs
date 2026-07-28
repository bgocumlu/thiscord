import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const packageRoot = resolve(import.meta.dirname, '../..')
const hooksRoot = resolve(packageRoot, 'pb_hooks')

let nextId = 1

class FakeRecord {
  constructor(collection, values = {}) {
    this._collection = typeof collection === 'string'
      ? { name: collection, id: collection }
      : collection
    this.id = values.id || `record_${nextId++}`
    this.values = { ...values }
    delete this.values.id
  }

  collection() {
    return this._collection
  }

  get(field) {
    if (field === 'id') return this.id
    return this.values[field]
  }

  getString(field) {
    if (field === 'id') return this.id
    const value = this.values[field]
    return value === undefined || value === null ? '' : String(value)
  }

  getStringSlice(field) {
    const value = this.values[field]
    return Array.isArray(value) ? value.map(String) : []
  }

  getBool(field) {
    return Boolean(this.values[field])
  }

  getInt(field) {
    return Number(this.values[field] || 0)
  }

  set(field, value) {
    this.values[field] = value
  }

  email() {
    return this.getString('email')
  }
}

export class MemoryApp {
  constructor(seed = {}) {
    this.records = new Map()
    for (const [collection, records] of Object.entries(seed)) {
      this.records.set(collection, records)
    }
  }

  collection(name) {
    if (!this.records.has(name)) this.records.set(name, [])
    return this.records.get(name)
  }

  findCollectionByNameOrId(name) {
    this.collection(name)
    return { name, id: name }
  }

  findRecordById(collection, id) {
    const record = this.collection(collection).find((item) => item.id === id)
    if (!record) throw new Error(`Missing ${collection}/${id}`)
    return record
  }

  findRecordsByFilter(collection, filter, sort = '', limit = 0, offset = 0, params = {}) {
    let records = [...this.collection(collection)]
    if (params.beforeCreated !== undefined && params.beforeId !== undefined) {
      records = records.filter((record) => {
        const created = record.getString('created')
        return created < String(params.beforeCreated)
          || (created === String(params.beforeCreated) && record.id < String(params.beforeId))
      })
    }
    const orParameters = new Set()
    for (const [, group] of filter.matchAll(/\(([^()]*(?:\|\|)[^()]*)\)/g)) {
      const clauses = [...group.matchAll(
        /([A-Za-z][A-Za-z0-9]*)\s*(=|!=)\s*\{:(\w+)\}/g,
      )]
      if (clauses.length < 2) continue
      for (const [, , , parameter] of clauses) orParameters.add(parameter)
      records = records.filter((record) => clauses.some(([, field, operator, parameter]) => {
        const actual = record.getString(field)
        const expected = String(params[parameter])
        return operator === '!=' ? actual !== expected : actual === expected
      }))
    }
    for (const [parameter, expected] of Object.entries(params)) {
      if (parameter === 'beforeCreated' || parameter === 'beforeId') continue
      if (orParameters.has(parameter)) continue
      const escaped = parameter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const comparedFields = [...filter.matchAll(
        new RegExp(`([A-Za-z][A-Za-z0-9]*)\\s*(!=|>=|<=|=|>)\\s*\\{:${escaped}\\}`, 'g'),
      )]
      for (const [, field, operator] of comparedFields) {
        records = records.filter((record) => {
          const actual = record.getString(field)
          const expectedText = String(expected)
          const comparableActual = /^\d{4}-\d{2}-\d{2}T/.test(actual)
            ? actual.replace('T', ' ')
            : actual
          const comparableExpected = /^\d{4}-\d{2}-\d{2}T/.test(expectedText)
            ? expectedText.replace('T', ' ')
            : expectedText
          if (operator === '!=') return comparableActual !== comparableExpected
          if (operator === '>=') return comparableActual >= comparableExpected
          if (operator === '<=') return comparableActual <= comparableExpected
          if (operator === '>') return comparableActual > comparableExpected
          return comparableActual === comparableExpected
        })
      }
    }
    for (const [, field, expected] of filter.matchAll(/([A-Za-z][A-Za-z0-9]*)\s*=\s*'([^']*)'/g)) {
      records = records.filter((record) => record.getString(field) === expected)
    }
    if (sort) {
      const fields = sort.split(',').map((item) => ({
        direction: item.startsWith('-') ? -1 : 1,
        field: item.replace(/^[+-]/, ''),
      }))
      records.sort((left, right) => {
        for (const { direction, field } of fields) {
          const leftValue = field === 'id' ? left.id : left.getString(field)
          const rightValue = field === 'id' ? right.id : right.getString(field)
          const compared = leftValue.localeCompare(rightValue) * direction
          if (compared) return compared
        }
        return 0
      })
    }
    return limit > 0 ? records.slice(offset, offset + limit) : records.slice(offset)
  }

  findFirstRecordByFilter(collection, filter, params = {}) {
    const record = this.findRecordsByFilter(collection, filter, '', 1, 0, params)[0]
    if (!record) throw new Error(`No ${collection} record matched ${filter}`)
    return record
  }

  findFirstRecordByData(collection, field, value) {
    const record = this.collection(collection).find((item) => item.getString(field) === String(value))
    if (!record) throw new Error(`No ${collection} record matched ${field}`)
    return record
  }

  save(record) {
    const records = this.collection(record.collection().name)
    const index = records.findIndex((item) => item.id === record.id)
    if (index === -1) records.push(record)
    else records[index] = record
    return record
  }

  delete(record) {
    const records = this.collection(record.collection().name)
    const index = records.findIndex((item) => item.id === record.id)
    if (index !== -1) records.splice(index, 1)
  }

  runInTransaction(callback) {
    return callback(this)
  }
}

export function record(collection, id, values = {}) {
  return new FakeRecord(collection, { id, ...values })
}

function installPocketBaseGlobals() {
  globalThis.__hooks = hooksRoot
  globalThis.Record = FakeRecord
  for (const name of [
    'BadRequestError',
    'ForbiddenError',
    'InternalServerError',
    'NotFoundError',
    'TooManyRequestsError',
  ]) {
    globalThis[name] = class extends Error {
      constructor(message) {
        super(message)
        this.name = name
      }
    }
  }
}

export function loadPermissions() {
  installPocketBaseGlobals()
  const path = resolve(hooksRoot, 'lib/permissions.js')
  delete require.cache[require.resolve(path)]
  return require(path)
}

export function loadChannelAccess() {
  installPocketBaseGlobals()
  const permissionsPath = resolve(hooksRoot, 'lib/permissions.js')
  const path = resolve(hooksRoot, 'lib/channelAccess.js')
  delete require.cache[require.resolve(permissionsPath)]
  delete require.cache[require.resolve(path)]
  return require(path)
}

export function loadCallAccess() {
  installPocketBaseGlobals()
  const permissionsPath = resolve(hooksRoot, 'lib/permissions.js')
  const path = resolve(hooksRoot, 'lib/callAccess.js')
  delete require.cache[require.resolve(permissionsPath)]
  delete require.cache[require.resolve(path)]
  return require(path)
}

export function loadAccessRequestHooks() {
  installPocketBaseGlobals()
  const listHandlers = []
  const realtimeHandlers = []
  globalThis.onRecordsListRequest = (handler, ...collections) => {
    listHandlers.push({ handler, collections })
  }
  globalThis.onRecordViewRequest = () => undefined
  globalThis.onFileDownloadRequest = () => undefined
  globalThis.onRealtimeMessageSend = (handler) => {
    realtimeHandlers.push(handler)
  }
  const path = resolve(hooksRoot, '03_channel_access.pb.js')
  delete require.cache[require.resolve(path)]
  require(path)
  return { listHandlers, realtimeHandlers }
}

export function loadActionRoutes() {
  installPocketBaseGlobals()
  const routes = new Map()
  globalThis.$apis = {
    bodyLimit: () => undefined,
    enrichRecord: () => undefined,
    enrichRecords: () => undefined,
    requireAuth: () => undefined,
  }
  globalThis.routerAdd = (method, path, handler) => {
    routes.set(`${method} ${path}`, handler)
  }
  globalThis.$os = { getenv: () => '' }
  globalThis.$http = {
    send: () => ({ statusCode: 200, raw: '{"kicked":0}' }),
  }
  globalThis.$security = {
    createJWT: () => '',
    randomString: () => 'opaque-room',
  }
  const path = resolve(hooksRoot, '01_actions.pb.js')
  delete require.cache[require.resolve(path)]
  require(path)
  return routes
}

export function loadLifecycleCron() {
  installPocketBaseGlobals()
  let cleanup
  globalThis.onRecordCreateRequest = () => undefined
  globalThis.onRecordUpdateRequest = () => undefined
  globalThis.onRecordAfterCreateSuccess = () => undefined
  globalThis.cronAdd = (name, _schedule, callback) => {
    if (name === 'thiscord-transient-cleanup') cleanup = callback
  }
  const path = resolve(hooksRoot, '02_lifecycle.pb.js')
  delete require.cache[require.resolve(path)]
  require(path)
  return (app) => {
    globalThis.$app = app
    cleanup()
  }
}

export function loadLifecycleHandlers() {
  installPocketBaseGlobals()
  const afterCreate = new Map()
  globalThis.onRecordCreateRequest = () => undefined
  globalThis.onRecordUpdateRequest = () => undefined
  globalThis.onRecordAfterCreateSuccess = (callback, ...collections) => {
    for (const collection of collections) afterCreate.set(collection, callback)
  }
  globalThis.cronAdd = () => undefined
  const path = resolve(hooksRoot, '02_lifecycle.pb.js')
  delete require.cache[require.resolve(path)]
  require(path)
  return {
    afterCreate(collection, app, createdRecord) {
      const callback = afterCreate.get(collection)
      if (!callback) throw new Error(`No after-create handler for ${collection}`)
      callback({
        app,
        record: createdRecord,
        next: () => undefined,
      })
    },
  }
}

export function event({
  app,
  auth,
  body = {},
  files = [],
  path = {},
  query = {},
}) {
  return {
    app,
    auth,
    findUploadedFiles: () => files,
    requestInfo: () => ({ body, query: {} }),
    request: {
      pathValue: (name) => path[name] || '',
      url: {
        query: () => ({
          get: (name) => query[name] ?? '',
        }),
      },
    },
    json: (status, value) => ({ status, value }),
    noContent: (status) => ({ status }),
  }
}

export function communityFixture({
  userId = 'member',
  ownerId = 'owner',
  permissions = [],
  timeoutUntil = '',
  channelKind = 'text',
} = {}) {
  const community = record('communities', 'community', { owner: ownerId })
  const membership = record('memberships', 'membership', {
    community: community.id,
    user: userId,
    state: 'active',
    timeoutUntil,
  })
  const everyone = record('roles', 'everyone', {
    community: community.id,
    managed: true,
    position: 0,
    permissions,
  })
  const channel = record('channels', 'channel', {
    community: community.id,
    kind: channelKind,
    parent: '',
    slowmodeSeconds: 0,
  })
  const callRoom = channelKind === 'voice'
    ? record('call_rooms', 'call-room', {
        channel: channel.id,
        conversation: '',
        roomName: 'opaque-room',
      })
    : null
  const app = new MemoryApp({
    communities: [community],
    memberships: [membership],
    roles: [everyone],
    member_roles: [],
    channel_permissions: [],
    channels: [channel],
    call_rooms: callRoom ? [callRoom] : [],
  })
  return { app, callRoom, channel, community, everyone, membership }
}
