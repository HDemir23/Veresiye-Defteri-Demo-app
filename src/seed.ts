import type { AppData, Category } from './types';

const menu: [string, string, number, Category][] = [
  ['m1', 'Mercimek Çorbası', 90, 'yemek'],
  ['m2', 'Ezogelin Çorbası', 90, 'yemek'],
  ['m3', 'Et Döner Porsiyon', 280, 'yemek'],
  ['m4', 'Tavuk Döner Porsiyon', 220, 'yemek'],
  ['m5', 'Adana Kebap', 260, 'yemek'],
  ['m6', 'Tavuk Şiş', 220, 'yemek'],
  ['m7', 'İskender', 320, 'yemek'],
  ['m8', 'Lahmacun', 90, 'yemek'],
  ['m9', 'Pilav', 80, 'yemek'],
  ['m10', 'Ayran', 40, 'içecek'],
  ['m11', 'Kola', 55, 'içecek'],
  ['m12', 'Çay', 20, 'içecek'],
  ['m13', 'Türk Kahvesi', 65, 'içecek'],
  ['m14', 'Şalgam', 45, 'içecek'],
  ['m15', 'Sütlaç', 100, 'diğer'],
  ['m16', 'Künefe', 180, 'diğer'],
];

export function createSeedData(): AppData {
  const now = new Date().toISOString();
  const hoursAgo = (hours: number) =>
    new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  const today = now.slice(0, 10);
  const yesterday = daysAgo(1).slice(0, 10);

  return {
    version: 1,
    customers: [
      {
        id: 'c1',
        name: 'Ahmet Yılmaz',
        phone: '0532 111 22 33',
        note: 'Esnaf, cuma günü kapatır',
        createdAt: now,
      },
      { id: 'c2', name: 'Mehmet Usta', phone: '', note: '', createdAt: now },
      { id: 'c3', name: 'Zeynep Hanım', phone: '', note: '', createdAt: now },
      {
        id: 'c4',
        name: 'Derya Aksoy',
        phone: '0541 286 41 90',
        note: 'Ödemeyi haftalık yapar',
        createdAt: now,
      },
      {
        id: 'c5',
        name: 'Murat Çelik',
        phone: '0538 704 18 26',
        note: '',
        createdAt: now,
      },
    ],
    menuItems: menu.map(([id, name, price, category]) => ({
      id,
      name,
      price,
      category,
      active: true,
    })),
    orders: [
      { id: 'o1', customerId: 'c1', status: 'open', createdAt: hoursAgo(2) },
      { id: 'o2', customerId: 'c2', status: 'open', createdAt: hoursAgo(4) },
      { id: 'o3', customerId: 'c3', status: 'open', createdAt: hoursAgo(6) },
      { id: 'o4', customerId: 'c4', status: 'open', createdAt: daysAgo(1) },
    ],
    orderLines: [
      {
        id: 'l1',
        orderId: 'o1',
        menuItemId: 'm3',
        nameSnapshot: 'Et Döner Porsiyon',
        priceSnapshot: 280,
        qty: 1,
        createdAt: hoursAgo(2),
      },
      {
        id: 'l2',
        orderId: 'o1',
        menuItemId: 'm10',
        nameSnapshot: 'Ayran',
        priceSnapshot: 40,
        qty: 2,
        createdAt: hoursAgo(2),
      },
      {
        id: 'l3',
        orderId: 'o2',
        menuItemId: 'm5',
        nameSnapshot: 'Adana Kebap',
        priceSnapshot: 260,
        qty: 1,
        createdAt: hoursAgo(4),
      },
      {
        id: 'l4',
        orderId: 'o2',
        menuItemId: 'm10',
        nameSnapshot: 'Ayran',
        priceSnapshot: 40,
        qty: 1,
        createdAt: hoursAgo(4),
      },
      {
        id: 'l5',
        orderId: 'o3',
        menuItemId: 'm6',
        nameSnapshot: 'Tavuk Şiş',
        priceSnapshot: 220,
        qty: 1,
        createdAt: hoursAgo(6),
      },
      {
        id: 'l6',
        orderId: 'o4',
        menuItemId: 'm7',
        nameSnapshot: 'İskender',
        priceSnapshot: 320,
        qty: 1,
        createdAt: daysAgo(1),
      },
      {
        id: 'l7',
        orderId: 'o4',
        menuItemId: 'm15',
        nameSnapshot: 'Sütlaç',
        priceSnapshot: 100,
        qty: 1,
        createdAt: daysAgo(1),
      },
    ],
    payments: [
      {
        id: 'p1',
        customerId: 'c1',
        orderId: 'o1',
        amount: 150,
        paidAt: hoursAgo(1),
        note: 'Kısmi ödeme',
      },
      {
        id: 'p2',
        customerId: 'c3',
        orderId: 'o3',
        amount: 310,
        paidAt: hoursAgo(3),
        note: 'Hesaba avans',
      },
      {
        id: 'p3',
        customerId: 'c4',
        orderId: 'o4',
        amount: 200,
        paidAt: hoursAgo(8),
        note: 'Kısmi ödeme',
      },
    ],
    purchases: [
      {
        id: 'a1',
        name: 'Dana eti',
        qty: 8,
        unitCost: 415,
        date: today,
        supplierNote: 'Kasap Ali',
      },
      {
        id: 'a2',
        name: 'Ayran',
        qty: 4,
        unitCost: 190,
        date: today,
        supplierNote: '4 koli',
      },
      {
        id: 'a3',
        name: 'Sebze',
        qty: 1,
        unitCost: 680,
        date: yesterday,
        supplierNote: 'Hal alışverişi',
      },
    ],
  };
}

export const STORAGE_KEY = 'restoran-veresiye-web-data';
