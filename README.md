# Lokanta Veresiye Defteri (Web)

Restoran, dönerci ve lokantalar için tarayıcıda çalışan veresiye ve alım takip uygulaması. Masaüstü Electron sürümünden bağımsız, saf Vite + React + TypeScript web uygulamasıdır. Arayüz Türkçedir.

## Özellikler

- Ana Sayfa: açık hesaplar, bugünkü veresiye / tahsilat / alım özeti, hızlı veresiye
- Müşteriler: arama, ekleme/düzenleme, bakiye ve hesap defteri
- Menü: fiyat, kategori (yemek / içecek / diğer), aktif-pasif
- Raporlar: gün sonu, haftalık ve aylık; müşteri ve kategori dökümü
- Seçili dönem raporunu PDF olarak yazdırma veya çok sayfalı Excel dosyası indirme
- Alımlar: malzeme / tedarik giderleri
- Hızlı veresiye, ürün ekleme, kısmi ödeme ve hesap kapatma
- İlk açılışta örnek Türk menüsü (döner, kebap, çorba, içecekler…) ve demo müşteriler
- Veriler yalnızca tarayıcı `localStorage` içinde saklanır (çevrimdışı kullanılabilir)

## Tema

Sade ve güven veren lokanta yönetimi hissi:

- Petrol yeşili (`#276C5B`) birincil renk ve butonlar
- Serin kırık beyaz arka plan (`#F3F6F4`)
- Koyu yeşil metin, borç ve silme işlemlerinde anlamlı kırmızı
- Yuvarlatılmış kartlar, yumuşak gradientler, kalın başlıklar

Mobilde alt navigasyon + hamburger menü; tablolar yatay kaydırılır veya kartlara dönüşür.

## Gereksinimler

- Node.js 18 veya üzeri
- npm

## Kurulum ve çalıştırma

```bash
cd /workspace/restoran-veresiye-web
npm install
npm run dev
```

Geliştirme sunucusu varsayılan olarak `http://localhost:5174` adresinde açılır.

## Üretim derlemesi

```bash
npm run build
npm run preview
```

Derleme çıktısı `dist/` klasörüne yazılır.

## Veri saklama

Anahtar: `restoran-veresiye-web-data` (`localStorage`). İnternet, hesap veya bulut gerekmez. Tarayıcı verilerini temizlerseniz kayıtlar silinir.

## Masaüstü sürümü

Electron masaüstü uygulaması ayrı bir projedir (`/workspace/restoran-veresiye`) ve bu web sürümü onu değiştirmez.

## Teknik yapı

Vite + React 18 + TypeScript + lucide-react. Electron veya native bağımlılık yoktur.
