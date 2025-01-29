
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 300000) { // 5 minutes in milliseconds
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}

export const apiCache = new Cache();
