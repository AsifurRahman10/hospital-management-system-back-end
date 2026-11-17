/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, RedisClientType } from 'redis'
import { envConfig } from '../config'
class RedisService {
  private client: RedisClientType | null = null
  private isConnected: boolean = false

  async connect() {
    try {
      const redisUrl = envConfig.REDIS_URL

      if (!redisUrl) {
        throw new Error('REDIS_URL is not set in .env')
      }
      this.client = createClient({
        url: redisUrl
      })
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })
      this.client.on('connect', () => {
        console.log('Redis Client Connected')
        this.isConnected = true
      })

      this.client.on('ready', () => {
        console.log('Redis Client Ready')
        this.isConnected = true
      })

      this.client.on('end', () => {
        console.log('Redis Client Disconnected')
        this.isConnected = false
      })
      this.client.on('reconnecting', () => {
        console.log('Redis Client Reconnecting')
      })
      await this.client.connect()
    } catch (error) {
      console.log(error)
    }
  }

  private ensureConnection(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.')
    }
    if (!this.isConnected) {
      throw new Error('Redis client not connected.')
    }
    return this.client
  }

  async get(key: string) {
    try {
      const client = this.ensureConnection()
      return await client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttlInSeconds?: number) {
    try {
      const client = this.ensureConnection()
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value)

      await client.set(key, stringValue, { EX: ttlInSeconds })
    } catch (error) {
      console.log(error)
      return null
    }
  }

  async update(key: string, value: any, ttlInSeconds: number): Promise<void> {
    // Update is the same as set in Redis
    await this.set(key, value, ttlInSeconds)
  }

  async delete(key: string): Promise<void> {
    try {
      const client = this.ensureConnection()
      await client.del(key)
    } catch (error) {
      console.error('Redis DELETE error:', error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.ensureConnection()
      await client.ping()
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit()
      this.isConnected = false
    }
  }
}

export const redisService = new RedisService()
