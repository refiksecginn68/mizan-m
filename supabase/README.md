# Veritabanı Kurulumu

## SQL Migration Uygulama

Supabase Dashboard > SQL Editor'a gidin ve aşağıdaki dosyayı yapıştırıp çalıştırın:

`supabase/migrations/001_schema.sql`

Bu dosya şunları oluşturur:
- 20 tablo (bağımlılık sırasına göre)
- Tüm RLS politikaları
- pgvector extension + semantic_search() fonksiyonu
- spend_credits() atomik fonksiyonu
- handle_new_user() trigger (otomatik profil + bonus kredi)
- Seed data: 14 hukuk alanı, 3 kredi paketi, 3 abonelik planı
