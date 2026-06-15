import { prisma } from "@/lib/prisma";
import Redis from "ioredis";

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000, // Fail fast if Redis is down
    });
    redisClient.on("error", (err) => {
      console.error("[rate-limit] Redis connection error:", err);
    });
    return redisClient;
  } catch (err) {
    console.error("[rate-limit] Failed to initialize Redis client:", err);
    return null;
  }
}

let isTableInitialized = false;

async function ensureRateLimitTable() {
  if (isTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RateLimit" (
        "key" TEXT PRIMARY KEY,
        "points" INTEGER NOT NULL,
        "expireAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    isTableInitialized = true;
  } catch (err) {
    console.error("Failed to initialize RateLimit table:", err);
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ success: boolean; limit: number; remaining: number }> {
  // 1. Try standard Redis first if REDIS_URL is configured
  const redis = getRedisClient();
  if (redis) {
    try {
      const pipeline = redis.multi();
      pipeline.incr(key);
      pipeline.pttl(key);
      const results = await pipeline.exec();

      if (results && results.length === 2) {
        const countErr = results[0][0];
        const count = results[0][1] as number;
        const ttlErr = results[1][0];
        let ttl = results[1][1] as number;

        if (countErr || ttlErr) {
          throw new Error(String(countErr || ttlErr));
        }

        if (count === 1 || ttl < 0) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
          ttl = windowMs;
        }

        const remaining = Math.max(0, limit - count);
        return {
          success: count <= limit,
          limit,
          remaining,
        };
      }
    } catch (err) {
      console.error("[rate-limit] Redis rate limiting failed, falling back to DB:", err);
    }
  }

  // 2. Fallback to PostgreSQL rate limiting (atomic upsert + returning)
  await ensureRateLimitTable();

  const now = new Date();
  try {
    // Prune expired records
    await prisma.$executeRawUnsafe(
      `DELETE FROM "RateLimit" WHERE "expireAt" < $1`,
      now,
    );

    const expireAt = new Date(now.getTime() + windowMs);

    // Atomic insert or increment, returning the current points count
    const result = await prisma.$queryRawUnsafe<Array<{ points: number }>>(
      `INSERT INTO "RateLimit" ("key", "points", "expireAt")
       VALUES ($1, $2, $3)
       ON CONFLICT ("key") DO UPDATE
       SET "points" = "RateLimit"."points" + 1
       RETURNING "points"`,
      key,
      1,
      expireAt,
    );

    const points = result[0]?.points ?? 1;
    const remaining = Math.max(0, limit - points);

    return {
      success: points <= limit,
      limit,
      remaining,
    };
  } catch (err) {
    console.error("PostgreSQL rate limiting failed, falling back to in-memory:", err);
    return inMemoryRateLimit(key, limit, windowMs);
  }
}

// 3. Fallback to in-memory cache
const memoryCache = new Map<string, { points: number; expireAt: number }>();

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();

  // Clean expired items
  for (const [k, v] of memoryCache.entries()) {
    if (v.expireAt < now) {
      memoryCache.delete(k);
    }
  }

  const cached = memoryCache.get(key);
  if (cached) {
    cached.points += 1;
    const remaining = Math.max(0, limit - cached.points);
    return {
      success: cached.points <= limit,
      limit,
      remaining,
    };
  } else {
    memoryCache.set(key, { points: 1, expireAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
    };
  }
}
