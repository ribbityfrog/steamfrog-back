import cache from '@adonisjs/cache/services/main'

type Namespace = 'global' | 'stats'
type Ttl = `${string}${'ms' | 's' | 'm' | 'h'}`

interface MengOptions {
  namespace: Namespace
  ttl: Ttl
}

class Meng {
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    { namespace, ttl }: MengOptions = { namespace: 'global', ttl: '1h' }
  ) {
    const nsCache = cache.namespace(namespace)

    return await nsCache.getOrSet({ key, factory, ttl })
  }

  async clear(namespace?: Namespace) {
    if (!namespace) await cache.clear()
    else await cache.namespace(namespace).clear()
  }
}

const meng = new Meng()
export { meng as default }
