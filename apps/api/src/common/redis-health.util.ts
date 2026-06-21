import IORedis from 'ioredis';

export async function pingRedis(redisUrl: string): Promise<boolean> {
  const client = new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    return pong === 'PONG';
  } finally {
    client.disconnect();
  }
}
