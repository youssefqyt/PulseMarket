const { createClient } = require("redis");
const config = require("./index");

/**
 * Redis is used for caching and rate-limit storage.
 * In development it is OPTIONAL: if Redis is unreachable the API keeps
 * running and simply skips the cache. This keeps `npm run dev` friction-free.
 *
 * `initRedis` NEVER throws and NEVER hangs: it fails fast (no endless
 * reconnect loop) and falls back to a no-op cache.
 */
let client = null;
let connected = false;

const CONNECT_TIMEOUT_MS = 3000;

async function initRedis() {
  if (client) return client;

  client = createClient({
    url: config.redis.url,
    // Fail fast instead of retrying forever when Redis is down.
    socket: {
      reconnectStrategy: () => false,
      connectTimeout: CONNECT_TIMEOUT_MS,
    },
  });
  client.on("error", (err) => {
    if (connected) console.warn("[redis] error:", err.message);
    connected = false;
  });
  client.on("connect", () => {
    connected = true;
    console.log("[redis] connected");
  });

  try {
    // Belt-and-braces: even if the driver misbehaves, never block startup.
    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("connect timeout")), CONNECT_TIMEOUT_MS + 500)
      ),
    ]);
  } catch (err) {
    console.warn("[redis] not available, continuing without cache:", err.message);
    connected = false;
    try {
      await client.destroy?.();
    } catch {
      /* ignore */
    }
    client = null;
  }
  return client;
}

function isConnected() {
  return connected;
}

async function get(key) {
  if (!connected) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  if (!connected) return;
  try {
    if (ttlSeconds) await client.set(key, value, { EX: ttlSeconds });
    else await client.set(key, value);
  } catch {
    /* ignore cache write failures */
  }
}

async function del(key) {
  if (!connected) return;
  try {
    await client.del(key);
  } catch {
    /* ignore */
  }
}

/** Delete every key matching a prefix (e.g. invalidate "products:*"). */
async function delByPrefix(prefix) {
  if (!connected) return;
  try {
    for await (const key of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      await client.del(key);
    }
  } catch {
    /* ignore */
  }
}

async function closeRedis() {
  if (client && connected) {
    try {
      await client.quit();
    } catch {
      /* ignore */
    }
  }
  client = null;
  connected = false;
}

module.exports = {
  initRedis,
  isConnected,
  get,
  set,
  del,
  delByPrefix,
  closeRedis,
  getClient: () => client,
};
