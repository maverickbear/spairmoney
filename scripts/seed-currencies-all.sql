-- Seed all display currencies. Only CAD, USD and BRL (Real) are active by default.
-- Run in Supabase SQL Editor after add-currencies-table.sql.
-- Admin can only toggle is_active; no add/edit of code/name/locale.

INSERT INTO public.currencies (code, name, locale, is_active, sort_order)
VALUES
  ('CAD', 'Canadian Dollar', 'en-CA', true, 0),
  ('USD', 'US Dollar', 'en-US', true, 1),
  ('BRL', 'Brazilian Real', 'pt-BR', true, 2),
  ('EUR', 'Euro', 'de-DE', false, 10),
  ('GBP', 'British Pound', 'en-GB', false, 11),
  ('JPY', 'Japanese Yen', 'ja-JP', false, 12),
  ('CHF', 'Swiss Franc', 'de-CH', false, 13),
  ('MXN', 'Mexican Peso', 'es-MX', false, 14),
  ('AUD', 'Australian Dollar', 'en-AU', false, 15),
  ('NZD', 'New Zealand Dollar', 'en-NZ', false, 16),
  ('ARS', 'Argentine Peso', 'es-AR', false, 17),
  ('CLP', 'Chilean Peso', 'es-CL', false, 18),
  ('COP', 'Colombian Peso', 'es-CO', false, 19),
  ('PEN', 'Peruvian Sol', 'es-PE', false, 20),
  ('UYU', 'Uruguayan Peso', 'es-UY', false, 21),
  ('CNY', 'Chinese Yuan', 'zh-CN', false, 22),
  ('INR', 'Indian Rupee', 'en-IN', false, 23),
  ('KRW', 'South Korean Won', 'ko-KR', false, 24),
  ('ZAR', 'South African Rand', 'en-ZA', false, 25),
  ('TRY', 'Turkish Lira', 'tr-TR', false, 26),
  ('RUB', 'Russian Ruble', 'ru-RU', false, 27),
  ('PLN', 'Polish Zloty', 'pl-PL', false, 28),
  ('SEK', 'Swedish Krona', 'sv-SE', false, 29),
  ('NOK', 'Norwegian Krone', 'nb-NO', false, 30),
  ('DKK', 'Danish Krone', 'da-DK', false, 31),
  ('CZK', 'Czech Koruna', 'cs-CZ', false, 32),
  ('HUF', 'Hungarian Forint', 'hu-HU', false, 33),
  ('ILS', 'Israeli New Shekel', 'he-IL', false, 34),
  ('EGP', 'Egyptian Pound', 'ar-EG', false, 35),
  ('NGN', 'Nigerian Naira', 'en-NG', false, 36),
  ('PHP', 'Philippine Peso', 'en-PH', false, 37),
  ('IDR', 'Indonesian Rupiah', 'id-ID', false, 38),
  ('THB', 'Thai Baht', 'th-TH', false, 39),
  ('MYR', 'Malaysian Ringgit', 'ms-MY', false, 40),
  ('SGD', 'Singapore Dollar', 'en-SG', false, 41),
  ('HKD', 'Hong Kong Dollar', 'zh-HK', false, 42),
  ('AED', 'UAE Dirham', 'ar-AE', false, 43)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  locale = EXCLUDED.locale,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
-- Note: is_active is not updated on conflict so admin toggles are preserved on re-run.
