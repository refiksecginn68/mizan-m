-- clients tablosuna UYAP/MERNİS entegrasyon alanları eklenir.
-- tc_no zaten mevcut. Yeni alanlar ileride gerçek API ile doldurulacak.

alter table public.clients
  add column if not exists vekalet_no     text,          -- Vekaletname numarası
  add column if not exists dosya_no       text,          -- UYAP dosya/esas no
  add column if not exists vekalet_tarihi date,          -- Vekaletname tarihi
  add column if not exists noter          text,          -- Vekaleti düzenleyen noter
  add column if not exists uyap_synced    boolean not null default false,  -- Gerçek UYAP'tan geldi mi?
  add column if not exists uyap_synced_at timestamptz;   -- Son UYAP senkronizasyon zamanı

comment on column public.clients.vekalet_no     is 'Vekaletname numarası — elle veya UYAP API ile';
comment on column public.clients.dosya_no       is 'UYAP esas/dosya no — elle veya UYAP API ile';
comment on column public.clients.uyap_synced    is 'true = gerçek UYAP API ile doğrulandı';
comment on column public.clients.uyap_synced_at is 'Son UYAP sorgulama zamanı';
