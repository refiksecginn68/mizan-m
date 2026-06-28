-- Emsal karar cache tablosu
-- Railway/Bedesten sonuçlarını önbelleğe alır (24 saat TTL)

create table if not exists emsal_cache (
  id            uuid primary key default gen_random_uuid(),
  query_hash    text not null unique,   -- md5(q + court + page)
  query_text    text not null,
  results       jsonb not null,
  total         int default 0,
  created_at    timestamptz default now()
);

-- 24 saatten eski kayıtları otomatik sil
create index if not exists idx_emsal_cache_hash    on emsal_cache(query_hash);
create index if not exists idx_emsal_cache_created on emsal_cache(created_at);

-- Belge tam metin cache tablosu (7 gün TTL)
create table if not exists emsal_documents (
  id            uuid primary key default gen_random_uuid(),
  document_id   text not null unique,
  content       text not null,
  source_url    text,
  created_at    timestamptz default now()
);

create index if not exists idx_emsal_docs_docid on emsal_documents(document_id);

-- Cache temizleme fonksiyonu (cron ile çağrılabilir)
create or replace function cleanup_emsal_cache()
returns void language plpgsql as $$
begin
  delete from emsal_cache    where created_at < now() - interval '24 hours';
  delete from emsal_documents where created_at < now() - interval '7 days';
end;
$$;
