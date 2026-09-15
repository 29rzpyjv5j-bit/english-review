import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 프로젝트 주소와 공개(anon) 키는 .env 에 둔다. 공개 키는 앱에 실려도 되는 값이고,
// 누가 무엇을 볼 수 있는지는 supabase/schema.sql 의 권한 규칙이 정한다.
const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

let client: SupabaseClient | null | undefined;

export function cloudConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getClient(): SupabaseClient {
  if (client === undefined) client = cloudConfigured() ? createClient(url, anonKey) : null;
  if (!client) throw new Error('친구 기능이 아직 연결되지 않았어요.');
  return client;
}
