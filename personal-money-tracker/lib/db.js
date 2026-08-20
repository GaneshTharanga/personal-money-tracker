import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getDb() {
  return getCloudflareContext().env.DB;
}
