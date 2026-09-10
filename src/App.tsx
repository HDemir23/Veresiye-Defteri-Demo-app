import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Home,
  Users,
  UtensilsCrossed,
  BarChart3,
  ShoppingBasket,
  Plus,
  Search,
  X,
  Check,
  Pencil,
  Trash2,
  CreditCard,
  ChevronRight,
  ReceiptText,
  WalletCards,
  Coffee,
  Database,
  CalendarDays,
  Minus,
  Save,
  Menu as MenuIcon,
} from 'lucide-react';
import type {
  AppData,
  Customer,
  MenuItem,
  Order,
  OrderLine,
  Payment,
  Purchase,
  Category,
} from './types';
import { createSeedData, STORAGE_KEY } from './seed';

const emptyData: AppData = {
  customers: [],
  menuItems: [],
  orders: [],
  orderLines: [],
  payments: [],
  purchases: [],
  version: 1,
};

const money = (n: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(n || 0);

/** Internal balance = charges - payments. UI shows debt as negative, credit as positive. */
function balanceLabel(b: number) {
  if (b < -0.009)
    return { text: `+${money(-b)} kredi`, tone: 'credit' as const };
  if (b > 0.009) return { text: `-${money(b)}`, tone: 'due' as const };
  return { text: money(0), tone: 'zero' as const };
}

const dateOnly = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: s.includes('T') ? '2-digit' : undefined,
    minute: s.includes('T') ? '2-digit' : undefined,
  }).format(new Date(s));

const uid = () =>
  crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();
const iso = () => new Date().toISOString();

type Screen = 'home' | 'customers' | 'menu' | 'reports' | 'purchases';
type Period = 'day' | 'week' | 'month';

function startFor(period: Period) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'week') {
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
  }
  if (period === 'month') d.setDate(1);
  return d;
}

function lineTotal(l: OrderLine) {
  return l.priceSnapshot * l.qty;
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.menuItems)) return createSeedData();
    return parsed;
  } catch {
    return createSeedData();
  }
}

function persist(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function App() {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [ledgerCustomer, setLedgerCustomer] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const d = loadData();
    setData(d);
    if (!localStorage.getItem(STORAGE_KEY)) persist(d);
    setReady(true);
  }, []);

  const update = (fn: (d: AppData) => AppData, msg?: string) => {
    setData((old) => {
      const next = fn(old);
      persist(next);
      return next;
    });
    if (msg) {
      setToast(msg);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(''), 2500);
    }
  };

  const customerBalance = (id: string) => {
    const orderIds = new Set(
      data.orders.filter((o) => o.customerId === id).map((o) => o.id)
    );
    const charges = data.orderLines
      .filter((l) => orderIds.has(l.orderId))
      .reduce((s, l) => s + lineTotal(l), 0);
    const paid = data.payments
      .filter((x) => x.customerId === id)
      .reduce((s, x) => s + x.amount, 0);
    return charges - paid;
  };

  const nav = [
    { id: 'home' as const, label: 'Ana Sayfa', icon: Home },
    { id: 'customers' as const, label: 'Müşteriler', icon: Users },
    { id: 'menu' as const, label: 'Menü', icon: UtensilsCrossed },
    { id: 'reports' as const, label: 'Raporlar', icon: BarChart3 },
    { id: 'purchases' as const, label: 'Alımlar', icon: ShoppingBasket },
  ];

  const go = (id: Screen) => {
    setScreen(id);
    setNavOpen(false);
  };

  if (!ready) {
    return (
      <div className="loading">
        <div className="brand-mark">
          <UtensilsCrossed />
        </div>
        <b>Lokanta Defteri hazırlanıyor…</b>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {navOpen && (
        <button
          className="nav-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className={'sidebar' + (navOpen ? ' open' : '')}>
        <div className="brand">
          <div className="brand-mark">
            <UtensilsCrossed />
          </div>
          <div>
            <strong>Lokanta</strong>
            <span>Veresiye Defteri</span>
          </div>
          <button
            className="close mobile-only sidebar-close"
            onClick={() => setNavOpen(false)}
            aria-label="Kapat"
          >
            <X />
          </button>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={screen === n.id ? 'active' : ''}
              onClick={() => go(n.id)}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <Database size={16} />
          <span>Tarayıcı • localStorage</span>
        </div>
      </aside>

      <main>
        <header>
          <div className="header-left">
            <button
              className="icon-btn hamburger mobile-only"
              onClick={() => setNavOpen(true)}
              aria-label="Menü"
            >
              <MenuIcon size={22} />
            </button>
            <div>
              <p className="eyebrow">RESTORAN YÖNETİMİ</p>
              <h1>{nav.find((n) => n.id === screen)?.label}</h1>
            </div>
          </div>
          <div className="header-date">
            <CalendarDays size={18} />
            <span>
              {new Intl.DateTimeFormat('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </span>
          </div>
        </header>

        <section className="content">
          {screen === 'home' && (
            <Dashboard
              data={data}
              balance={customerBalance}
              onOpen={setLedgerCustomer}
              onQuick={() => setQuickOpen(true)}
            />
          )}
          {screen === 'customers' && (
            <Customers
              data={data}
              update={update}
              balance={customerBalance}
              onOpen={setLedgerCustomer}
            />
          )}
          {screen === 'menu' && <Menu data={data} update={update} />}
          {screen === 'reports' && <Reports data={data} />}
          {screen === 'purchases' && (
            <Purchases data={data} update={update} />
          )}
        </section>
      </main>

      <nav className="bottom-nav mobile-only" aria-label="Alt menü">
        {nav.map((n) => (
          <button
            key={n.id}
            className={screen === n.id ? 'active' : ''}
            onClick={() => go(n.id)}
          >
            <n.icon size={20} />
            <span>{n.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {ledgerCustomer && (
        <Ledger
          customerId={ledgerCustomer}
          data={data}
          update={update}
          onClose={() => setLedgerCustomer(null)}
        />
      )}
      {quickOpen && (
        <QuickAdd
          data={data}
          update={update}
          onClose={() => setQuickOpen(false)}
          onLedger={(id) => {
            setQuickOpen(false);
            setLedgerCustomer(id);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Dashboard({
  data,
  balance,
  onOpen,
  onQuick,
}: {
  data: AppData;
  balance: (id: string) => number;
  onOpen: (id: string) => void;
  onQuick: () => void;
}) {
  const today = dateOnly();
  const openOrders = data.orders.filter((o) => o.status === 'open');
  const owed = data.customers.reduce(
    (s, c) => s + Math.max(0, balance(c.id)),
    0
  );
  const creditTotal = data.customers.reduce(
    (s, c) => s + Math.max(0, -balance(c.id)),
    0
  );
  const todayPayments = data.payments
    .filter((p) => dateOnly(new Date(p.paidAt)) === today)
    .reduce((s, p) => s + p.amount, 0);
  const todayLines = data.orderLines
    .filter((l) => dateOnly(new Date(l.createdAt)) === today)
    .reduce((s, l) => s + lineTotal(l), 0);
  const todayPurchases = data.purchases
    .filter((p) => p.date === today)
    .reduce((s, p) => s + p.qty * p.unitCost, 0);
  const rows = data.customers
    .map((c) => {
      const orders = openOrders.filter((o) => o.customerId === c.id);
      return {
        c,
        orders,
        b: balance(c.id),
        last: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
      };
    })
    .filter((x) => Math.abs(x.b) > 0.009 || x.orders.length)
    .sort((a, b) => Math.abs(b.b) - Math.abs(a.b));

  return (
    <>
      <div className="hero">
        <div>
          <p className="eyebrow light">HIZLI İŞLEM</p>
          <h2>Masadan deftere, iki tıkta.</h2>
          <p>Müşteri seçin, ürünleri ekleyin ve hesabı kaydedin.</p>
        </div>
        <button className="primary xl" onClick={onQuick}>
          <Plus /> Yeni Veresiye Ekle
        </button>
      </div>
      <div className="stats">
        <Stat
          label="Toplam Açık Bakiye"
          value={owed > 0.009 ? `-${money(owed)}` : money(0)}
          icon={WalletCards}
          tone="amber"
        />
        <Stat
          label="Bugünkü Veresiye"
          value={money(todayLines)}
          icon={ReceiptText}
          tone="green"
        />
        <Stat
          label="Bugün Tahsilat / Yükleme"
          value={money(todayPayments)}
          icon={CreditCard}
          tone="blue"
        />
        <Stat
          label="Toplam Artı Bakiye"
          value={creditTotal > 0.009 ? `+${money(creditTotal)}` : money(0)}
          icon={WalletCards}
          tone="green"
        />
      </div>
      <div className="panel">
        <div className="panel-title">
          <div>
            <h2>Açık Hesaplar</h2>
            <p>
              {rows.length} müşteri • Alımlar bugün {money(todayPurchases)}
            </p>
          </div>
          <button className="ghost" onClick={onQuick}>
            <Plus size={18} /> Hızlı Ekle
          </button>
        </div>
        {rows.length ? (
          <>
            <div className="table-wrap desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th>Telefon</th>
                    <th>Son işlem</th>
                    <th className="right">Bakiye</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ c, last, b }) => (
                    <tr
                      key={c.id}
                      onClick={() => onOpen(c.id)}
                      className="clickable"
                    >
                      <td>
                        <Avatar name={c.name} />
                        <b>{c.name}</b>
                      </td>
                      <td className="muted">{c.phone || '-'}</td>
                      <td className="muted">
                        {last ? fmtDate(last.createdAt) : '-'}
                      </td>
                      <td
                        className={
                          'right amount ' +
                          (b < -0.009 ? 'credit' : b > 0.009 ? 'due' : '')
                        }
                      >
                        {balanceLabel(b).text}
                      </td>
                      <td className="right">
                        <button className="icon-btn" aria-label={`${c.name} hesabını aç`}>
                          <ChevronRight />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-list mobile-only">
              {rows.map(({ c, last, b }) => (
                <button
                  key={c.id}
                  className="list-card"
                  onClick={() => onOpen(c.id)}
                >
                  <Avatar name={c.name} />
                  <div className="list-card-body">
                    <b>{c.name}</b>
                    <span>
                      {c.phone || 'Telefon yok'}
                      {last ? ` · ${fmtDate(last.createdAt)}` : ''}
                    </span>
                  </div>
                  <strong
                    className={
                      'amount ' +
                      (b < -0.009 ? 'credit' : b > 0.009 ? 'due' : '')
                    }
                  >
                    {balanceLabel(b).text}
                  </strong>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <Empty
            icon={ReceiptText}
            title="Açık hesap yok"
            text="Yeni veresiye eklemek için üstteki düğmeyi kullanın."
          />
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Home;
  tone: string;
}) {
  return (
    <div className="stat">
      <div className={'stat-icon ' + tone}>
        <Icon />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar">
      {name
        .split(' ')
        .slice(0, 2)
        .map((x) => x[0])
        .join('')
        .toLocaleUpperCase('tr-TR')}
    </span>
  );
}

function Empty({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Home;
  title: string;
  text: string;
}) {
  return (
    <div className="empty">
      <Icon />
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}

function Customers({
  data,
  update,
  balance,
  onOpen,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, msg?: string) => void;
  balance: (id: string) => number;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Customer | null | undefined>();
  const list = data.customers
    .filter((c) =>
      (c.name + ' ' + (c.phone || ''))
        .toLocaleLowerCase('tr')
        .includes(query.toLocaleLowerCase('tr'))
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const save = (c: Customer) => {
    update(
      (d) => ({
        ...d,
        customers: d.customers.some((x) => x.id === c.id)
          ? d.customers.map((x) => (x.id === c.id ? c : x))
          : [...d.customers, c],
      }),
      'Müşteri kaydedildi'
    );
    setEditing(undefined);
  };

  const remove = (id: string) => {
    if (data.orders.some((o) => o.customerId === id)) {
      alert(
        'Bu müşterinin hesap geçmişi olduğu için silinemez. Bilgilerini düzenleyebilirsiniz.'
      );
      return;
    }
    if (confirm('Müşteri silinsin mi?'))
      update(
        (d) => ({
          ...d,
          customers: d.customers.filter((x) => x.id !== id),
        }),
        'Müşteri silindi'
      );
  };

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            autoFocus
            placeholder="İsim veya telefon ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="primary" onClick={() => setEditing(null)}>
          <Plus /> Yeni Müşteri
        </button>
      </div>
      <div className="panel customer-grid">
        {list.map((c) => (
          <article className="customer-card" key={c.id}>
            <div className="customer-top">
              <Avatar name={c.name} />
              <div>
                <h3>{c.name}</h3>
                <span>{c.phone || 'Telefon yok'}</span>
              </div>
              <button
                className="icon-btn"
                onClick={() => setEditing(c)}
                title="Düzenle"
                aria-label={`${c.name} müşterisini düzenle`}
              >
                <Pencil size={17} />
              </button>
            </div>
            {c.note && <p className="note">{c.note}</p>}
            <div className="balance-line">
              <span>Güncel bakiye</span>
              <strong
                className={
                  balance(c.id) > 0.009
                    ? 'due'
                    : balance(c.id) < -0.009
                      ? 'credit'
                      : 'paid'
                }
              >
                {balanceLabel(balance(c.id)).text}
              </strong>
            </div>
            <div className="card-actions">
              <button className="secondary" onClick={() => onOpen(c.id)}>
                Hesabı Aç <ChevronRight size={17} />
              </button>
              <button
                className="danger-text"
                onClick={() => remove(c.id)}
                aria-label={`${c.name} müşterisini sil`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!list.length && (
          <Empty
            icon={Users}
            title="Müşteri bulunamadı"
            text="Aramanızı değiştirin veya yeni müşteri ekleyin."
          />
        )}
      </div>
      {editing !== undefined && (
        <CustomerForm
          initial={editing}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    </>
  );
}

function CustomerForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Customer | null;
  onClose: () => void;
  onSave: (c: Customer) => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [note, setNote] = useState(initial?.note || '');
  return (
    <Modal
      title={initial ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim())
            onSave({
              id: initial?.id || uid(),
              name: name.trim(),
              phone: phone.trim(),
              note: note.trim(),
              createdAt: initial?.createdAt || iso(),
            });
        }}
      >
        <label>Ad Soyad *</label>
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Hasan Demir"
        />
        <label>Telefon</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xx xxx xx xx"
        />
        <label>Not</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Müşteri hakkında kısa not…"
        />
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button className="primary">
            <Save size={18} /> Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Menu({
  data,
  update,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, msg?: string) => void;
}) {
  const [category, setCategory] = useState<'tümü' | Category>('tümü');
  const [editing, setEditing] = useState<MenuItem | null | undefined>();
  const list = data.menuItems
    .filter((m) => category === 'tümü' || m.category === category)
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        a.name.localeCompare(b.name, 'tr')
    );

  const save = (m: MenuItem) => {
    update(
      (d) => ({
        ...d,
        menuItems: d.menuItems.some((x) => x.id === m.id)
          ? d.menuItems.map((x) => (x.id === m.id ? m : x))
          : [...d.menuItems, m],
      }),
      'Menü ürünü kaydedildi'
    );
    setEditing(undefined);
  };

  const remove = (id: string) => {
    if (
      confirm(
        'Bu ürün menüden silinsin mi? Geçmiş hesaplar etkilenmez.'
      )
    )
      update(
        (d) => ({
          ...d,
          menuItems: d.menuItems.filter((x) => x.id !== id),
        }),
        'Ürün silindi'
      );
  };

  return (
    <>
      <div className="toolbar">
        <div className="tabs scroll-tabs">
          {(['tümü', 'yemek', 'içecek', 'diğer'] as const).map((x) => (
            <button
              className={category === x ? 'active' : ''}
              onClick={() => setCategory(x)}
              key={x}
            >
              {x[0].toLocaleUpperCase('tr') + x.slice(1)}
            </button>
          ))}
        </div>
        <button className="primary" onClick={() => setEditing(null)}>
          <Plus /> Ürün Ekle
        </button>
      </div>
      <div className="menu-list">
        {list.map((m) => (
          <article
            className={'menu-row ' + (!m.active ? 'inactive' : '')}
            key={m.id}
          >
            <div className={'food-icon ' + m.category}>
              <Coffee />
            </div>
            <div className="menu-info">
              <h3>{m.name}</h3>
              <span>
                {m.category} • {m.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <strong>{money(m.price)}</strong>
            <button
              className="icon-btn"
              onClick={() => setEditing(m)}
              aria-label={`${m.name} ürününü düzenle`}
            >
              <Pencil size={17} />
            </button>
            <button
              className="icon-btn danger-text"
              onClick={() => remove(m.id)}
              aria-label={`${m.name} ürününü sil`}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>
      {editing !== undefined && (
        <MenuForm
          initial={editing}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    </>
  );
}

function MenuForm({
  initial,
  onClose,
  onSave,
}: {
  initial: MenuItem | null;
  onClose: () => void;
  onSave: (m: MenuItem) => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [category, setCategory] = useState<Category>(
    initial?.category || 'yemek'
  );
  const [active, setActive] = useState(initial?.active ?? true);
  return (
    <Modal
      title={initial ? 'Ürünü Düzenle' : 'Menüye Ürün Ekle'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name && Number(price) > 0)
            onSave({
              id: initial?.id || uid(),
              name: name.trim(),
              price: Number(price),
              category,
              active,
            });
        }}
      >
        <label>Ürün adı *</label>
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Et Döner Porsiyon"
        />
        <div className="form-row">
          <div>
            <label>Fiyat (₺) *</label>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label>Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="yemek">Yemek</option>
              <option value="içecek">İçecek</option>
              <option value="diğer">Diğer</option>
            </select>
          </div>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />{' '}
          Menüde aktif olarak göster
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button className="primary">
            <Save size={18} /> Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Ledger({
  customerId,
  data,
  update,
  onClose,
}: {
  customerId: string;
  data: AppData;
  update: (fn: (d: AppData) => AppData, msg?: string) => void;
  onClose: () => void;
}) {
  const customer = data.customers.find((c) => c.id === customerId)!;
  const orders = data.orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = orders.find((o) => o.status === 'open');
  const orderIds = new Set(orders.map((o) => o.id));
  const lines = data.orderLines
    .filter((l) => orderIds.has(l.orderId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const payments = data.payments
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const charges = lines.reduce((s, l) => s + lineTotal(l), 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = charges - paid;
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState(false);

  const removeLine = (id: string) => {
    if (confirm('Bu kalem hesaptan silinsin mi?'))
      update(
        (d) => ({
          ...d,
          orderLines: d.orderLines.filter((x) => x.id !== id),
        }),
        'Kalem silindi'
      );
  };

  const pay = (amount: number, note: string, close: boolean) => {
    if (amount > 0)
      update(
        (d) => ({
          ...d,
          payments: [
            ...d.payments,
            {
              id: uid(),
              customerId,
              orderId: open?.id,
              amount,
              paidAt: iso(),
              note,
            },
          ],
          orders: close
            ? d.orders.map((o) =>
                o.id === open?.id
                  ? { ...o, status: 'closed' as const, closedAt: iso() }
                  : o
              )
            : d.orders,
        }),
        close
          ? 'Hesap kapatıldı'
          : amount > 0
            ? 'Tahsilat / yükleme kaydedildi'
            : 'Ödeme kaydedildi'
      );
    setPaying(false);
  };

  return (
    <div className="drawer-shade">
      <div className="drawer" role="dialog" aria-modal="true" aria-label={`${customer.name} hesabı`}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">MÜŞTERİ HESABI</p>
            <h2>{customer.name}</h2>
            <span>{customer.phone}</span>
          </div>
          <button className="close" onClick={onClose} aria-label="Hesabı kapat">
            <X />
          </button>
        </div>
        <div
          className={
            'ledger-balance' + (balance < -0.009 ? ' has-credit' : '')
          }
        >
          <span>
            {balance < -0.009 ? 'Kredi Bakiyesi' : 'Borç Bakiyesi'}
          </span>
          <strong className={balance < -0.009 ? 'credit-amount' : ''}>
            {balance < -0.009
              ? `+${money(-balance)}`
              : balance > 0.009
                ? `-${money(balance)}`
                : money(0)}
          </strong>
          <small>
            Toplam veresiye {money(charges)} • Ödenen / yüklenen{' '}
            {money(paid)}
            {balance < -0.009
              ? ' • Yeni siparişlerde kredi düşülür'
              : ''}
          </small>
        </div>
        <div className="ledger-actions">
          <button className="primary" onClick={() => setAdding(true)}>
            <Plus /> Ürün Ekle
          </button>
          <button className="secondary" onClick={() => setPaying(true)}>
            <CreditCard />{' '}
            {balance <= 0.009 ? 'Bakiye Yükle' : 'Ödeme Al'}
          </button>
        </div>
        <div className="ledger-body">
          <div className="section-heading">
            <h3>Hesap Hareketleri</h3>
            <span>{lines.length + payments.length} işlem</span>
          </div>
          {[
            ...lines.map((l) => ({
              kind: 'line' as const,
              date: l.createdAt,
              item: l,
            })),
            ...payments.map((p) => ({
              kind: 'pay' as const,
              date: p.paidAt,
              item: p,
            })),
          ]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((x) =>
              x.kind === 'line' ? (
                <div className="transaction" key={'l' + x.item.id}>
                  <div className="tx-icon charge">
                    <UtensilsCrossed />
                  </div>
                  <div>
                    <b>{x.item.nameSnapshot}</b>
                    <span>
                      {fmtDate(x.date)} • {x.item.qty} ×{' '}
                      {money(x.item.priceSnapshot)}
                    </span>
                  </div>
                  <strong className="due">-{money(lineTotal(x.item))}</strong>
                  <button
                    className="tiny-delete"
                    onClick={() => removeLine(x.item.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              ) : (
                <div className="transaction" key={'p' + x.item.id}>
                  <div className="tx-icon payment">
                    <CreditCard />
                  </div>
                  <div>
                    <b>{x.item.note || 'Ödeme'}</b>
                    <span>{fmtDate(x.date)}</span>
                  </div>
                  <strong className="green-text">+{money(x.item.amount)}</strong>
                </div>
              )
            )}
          {!lines.length && !payments.length && (
            <Empty
              icon={ReceiptText}
              title="Henüz hareket yok"
              text="Ürün ekleyerek hesabı başlatın."
            />
          )}
        </div>
        {adding && (
          <ItemPicker
            data={data}
            customerId={customerId}
            existingOrder={open}
            update={update}
            onClose={() => setAdding(false)}
          />
        )}
        {paying && (
          <PaymentForm
            balance={balance}
            onClose={() => setPaying(false)}
            onPay={pay}
          />
        )}
      </div>
    </div>
  );
}

function ItemPicker({
  data,
  customerId,
  existingOrder,
  update,
  onClose,
}: {
  data: AppData;
  customerId: string;
  existingOrder?: Order;
  update: (fn: (d: AppData) => AppData, msg?: string) => void;
  onClose: () => void;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState<'tümü' | Category>('tümü');
  const items = data.menuItems.filter(
    (m) => m.active && (cat === 'tümü' || m.category === cat)
  );
  const total = Object.entries(cart).reduce(
    (s, [id, q]) =>
      s + (data.menuItems.find((m) => m.id === id)?.price || 0) * q,
    0
  );
  const set = (id: string, n: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, n) }));

  const save = () => {
    const selected = Object.entries(cart).filter(([, q]) => q > 0);
    if (!selected.length) return;
    const orderId = existingOrder?.id || uid();
    const now = iso();
    const newLines = selected.map(([id, qty]) => {
      const m = data.menuItems.find((x) => x.id === id)!;
      return {
        id: uid(),
        orderId,
        menuItemId: id,
        nameSnapshot: m.name,
        priceSnapshot: m.price,
        qty,
        createdAt: now,
      };
    });
    update(
      (d) => ({
        ...d,
        orders: existingOrder
          ? d.orders
          : [
              ...d.orders,
              {
                id: orderId,
                customerId,
                status: 'open',
                createdAt: now,
              },
            ],
        orderLines: [...d.orderLines, ...newLines],
      }),
      'Ürünler hesaba eklendi'
    );
    onClose();
  };

  return (
    <div className="inner-modal" role="dialog" aria-modal="true" aria-label="Hesaba ürün ekle">
      <div className="picker-head">
        <h3>Hesaba Ürün Ekle</h3>
        <button className="close" onClick={onClose} aria-label="Ürün seçimini kapat">
          <X />
        </button>
      </div>
      <div className="tabs compact scroll-tabs">
        {(['tümü', 'yemek', 'içecek', 'diğer'] as const).map((x) => (
          <button
            className={cat === x ? 'active' : ''}
            onClick={() => setCat(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="picker-grid">
        {items.map((m) => (
          <button
            className={cart[m.id] ? 'picked' : ''}
            key={m.id}
            onClick={() => set(m.id, (cart[m.id] || 0) + 1)}
          >
            <span>{m.name}</span>
            <b>{money(m.price)}</b>
            {cart[m.id] > 0 && <em>{cart[m.id]}</em>}
          </button>
        ))}
      </div>
      {Object.values(cart).some((x) => x > 0) && (
        <div className="cart-strip">
          <div className="cart-items">
            {Object.entries(cart)
              .filter(([, q]) => q)
              .map(([id, q]) => (
                <div key={id}>
                  <span>
                    {data.menuItems.find((m) => m.id === id)?.name}
                  </span>
                  <button onClick={() => set(id, q - 1)}>
                    <Minus />
                  </button>
                  <b>{q}</b>
                  <button onClick={() => set(id, q + 1)}>
                    <Plus />
                  </button>
                </div>
              ))}
          </div>
          <button className="primary" onClick={save}>
            Hesaba Ekle • {money(total)}
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentForm({
  balance,
  onClose,
  onPay,
}: {
  balance: number;
  onClose: () => void;
  onPay: (n: number, note: string, close: boolean) => void;
}) {
  const hasDebt = balance > 0.009;
  const [amount, setAmount] = useState(hasDebt ? balance.toFixed(2) : '');
  const [note, setNote] = useState('');
  const n = Number(amount);
  const resulting = balance - (Number.isFinite(n) && n > 0 ? n : 0);
  const surplus = hasDebt && n > balance + 0.009 ? n - balance : 0;
  const isTopUp = !hasDebt;

  const saveNote = (fallback: string) => note.trim() || fallback;

  return (
    <div
      className="inner-modal payment-modal"
      role="dialog"
      aria-modal="true"
      aria-label={isTopUp ? 'Bakiye yükle' : 'Ödeme al'}
    >
      <div className="picker-head">
        <h3>{isTopUp ? 'Bakiye Yükle' : 'Ödeme Al'}</h3>
        <button className="close" onClick={onClose} aria-label="Ödeme formunu kapat">
          <X />
        </button>
      </div>
      <p>
        {hasDebt ? (
          <>
            Açık borç: <b>-{money(balance)}</b>
            <br />
            <small className="muted">
              Borçtan fazla ödeme artı bakiye (kredi) olarak kalır.
            </small>
          </>
        ) : (
          <>
            Güncel artı bakiye:{' '}
            <b className="green-text">
              {balance < -0.009 ? `+${money(-balance)}` : money(0)}
            </b>
            <br />
            <small className="muted">
              Yüklenen tutar sonraki siparişlerde düşülür.
            </small>
          </>
        )}
      </p>
      <label>{isTopUp ? 'Yüklenecek tutar' : 'Ödenen tutar'}</label>
      <div className="money-input">
        <span>₺</span>
        <input
          autoFocus
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
        />
      </div>
      {hasDebt && (
        <div className="quick-amounts">
          <button onClick={() => setAmount((balance / 2).toFixed(2))}>
            Yarısı
          </button>
          <button onClick={() => setAmount(balance.toFixed(2))}>
            Tamamı
          </button>
          <button
            onClick={() => setAmount((Math.ceil(balance / 100) * 100).toFixed(2))}
          >
            Yuvarla
          </button>
        </div>
      )}
      {n > 0 && (
        <div className={'pay-preview' + (resulting < -0.009 ? ' credit' : '')}>
          {resulting < -0.009 ? (
            <>
              İşlem sonrası artı bakiye:{' '}
              <b>+{money(-resulting)}</b>
              {surplus > 0.009 && (
                <span> (fazla ödeme {money(surplus)})</span>
              )}
            </>
          ) : resulting > 0.009 ? (
            <>
              Kalan borç: <b>-{money(resulting)}</b>
            </>
          ) : (
            <>
              Bakiye: <b>{money(0)}</b>, hesap kapanabilir
            </>
          )}
        </div>
      )}
      <label>Not (isteğe bağlı)</label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={isTopUp ? 'Bakiye yükleme, nakit…' : 'Nakit, kart…'}
      />
      <div className="modal-actions">
        {hasDebt ? (
          <>
            <button
              className="secondary"
              disabled={!n || n <= 0}
              onClick={() =>
                onPay(
                  n,
                  saveNote(surplus > 0.009 ? 'Ödeme + bakiye yükleme' : 'Ödeme'),
                  false
                )
              }
            >
              Ödeme Kaydet
            </button>
            <button
              className="primary"
              disabled={!n || n < balance - 0.01}
              onClick={() =>
                onPay(
                  n,
                  saveNote(
                    surplus > 0.009 ? 'Hesap kapama + bakiye yükleme' : 'Hesap kapama'
                  ),
                  true
                )
              }
            >
              <Check /> Ödendi / Kapat
            </button>
          </>
        ) : (
          <button
            className="primary"
            disabled={!n || n <= 0}
            onClick={() => onPay(n, saveNote('Bakiye yükleme'), false)}
          >
            <Check /> Bakiye Yükle
          </button>
        )}
      </div>
    </div>
  );
}

function QuickAdd({
  data,
  update,
  onClose,
  onLedger,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, msg?: string) => void;
  onClose: () => void;
  onLedger: (id: string) => void;
}) {
  const [customer, setCustomer] = useState('');
  const [search, setSearch] = useState('');
  const list = data.customers.filter((c) =>
    c.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))
  );

  if (customer)
    return (
      <div className="drawer-shade">
        <div className="quick-dialog">
          <ItemPicker
            data={data}
            customerId={customer}
            existingOrder={data.orders.find(
              (o) => o.customerId === customer && o.status === 'open'
            )}
            update={(fn, msg) => {
              update(fn, msg);
              onLedger(customer);
            }}
            onClose={onClose}
          />
        </div>
      </div>
    );

  return (
    <Modal title="Veresiye için Müşteri Seç" onClose={onClose} wide>
      <div className="search">
        <Search />
        <input
          autoFocus
          placeholder="Müşteri ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="customer-pick">
        {list.map((c) => (
          <button key={c.id} onClick={() => setCustomer(c.id)}>
            <Avatar name={c.name} />
            <span>
              <b>{c.name}</b>
              <small>{c.phone || 'Telefon yok'}</small>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
      <p className="hint">
        Yeni bir müşteri eklemek için önce Müşteriler bölümünü kullanın.
      </p>
    </Modal>
  );
}

function Reports({ data }: { data: AppData }) {
  const [period, setPeriod] = useState<Period>('day');
  const start = startFor(period);
  const inRange = (s: string) => new Date(s) >= start;
  const lines = data.orderLines.filter((l) => inRange(l.createdAt));
  const payments = data.payments.filter((p) => inRange(p.paidAt));
  const purchases = data.purchases.filter(
    (p) => new Date(p.date + 'T23:59:59') >= start
  );
  const sales = lines.reduce((s, l) => s + lineTotal(l), 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const buy = purchases.reduce((s, p) => s + p.qty * p.unitCost, 0);
  const outstanding = data.customers.reduce((s, c) => {
    const ids = new Set(
      data.orders.filter((o) => o.customerId === c.id).map((o) => o.id)
    );
    const charges = data.orderLines
      .filter((l) => ids.has(l.orderId))
      .reduce((a, l) => a + lineTotal(l), 0);
    const allPaid = data.payments
      .filter((p) => p.customerId === c.id)
      .reduce((a, p) => a + p.amount, 0);
    return s + Math.max(0, charges - allPaid);
  }, 0);
  const creditNow = data.customers.reduce((s, c) => {
    const ids = new Set(
      data.orders.filter((o) => o.customerId === c.id).map((o) => o.id)
    );
    const charges = data.orderLines
      .filter((l) => ids.has(l.orderId))
      .reduce((a, l) => a + lineTotal(l), 0);
    const allPaid = data.payments
      .filter((p) => p.customerId === c.id)
      .reduce((a, p) => a + p.amount, 0);
    return s + Math.max(0, allPaid - charges);
  }, 0);
  const byCustomer = data.customers
    .map((c) => {
      const ids = new Set(
        data.orders.filter((o) => o.customerId === c.id).map((o) => o.id)
      );
      const charge = lines
        .filter((l) => ids.has(l.orderId))
        .reduce((s, l) => s + lineTotal(l), 0);
      const payment = payments
        .filter((p) => p.customerId === c.id)
        .reduce((s, p) => s + p.amount, 0);
      return { c, charge, payment };
    })
    .filter((x) => x.charge || x.payment)
    .sort((a, b) => b.charge + b.payment - (a.charge + a.payment));

  return (
    <>
      <div className="toolbar">
        <div className="tabs scroll-tabs">
          {(
            [
              ['day', 'Günlük'],
              ['week', 'Haftalık'],
              ['month', 'Aylık'],
            ] as const
          ).map(([x, l]) => (
            <button
              className={period === x ? 'active' : ''}
              onClick={() => setPeriod(x)}
              key={x}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="range">
          {fmtDate(start.toISOString())} tarihinden itibaren
        </span>
      </div>
      <div className="stats report">
        <Stat
          label="Yazılan Veresiye"
          value={money(sales)}
          icon={ReceiptText}
          tone="amber"
        />
        <Stat
          label="Tahsilat / Yükleme"
          value={money(paid)}
          icon={CreditCard}
          tone="green"
        />
        <Stat
          label="Dönem Farkı"
          value={money(sales - paid)}
          icon={BarChart3}
          tone="blue"
        />
        <Stat
          label="Restoran Alımları"
          value={money(buy)}
          icon={ShoppingBasket}
          tone="red"
        />
      </div>
      <div className="stats report balance-split">
        <Stat
          label="Güncel Açık Borç"
          value={outstanding > 0.009 ? `-${money(outstanding)}` : money(0)}
          icon={WalletCards}
          tone="amber"
        />
        <Stat
          label="Güncel Artı Bakiye"
          value={creditNow > 0.009 ? `+${money(creditNow)}` : money(0)}
          icon={WalletCards}
          tone="green"
        />
      </div>
      <div className="report-layout">
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Müşteri Dökümü</h2>
              <p>
                Seçili dönemdeki veresiye, tahsilat ve bakiye yüklemeleri
              </p>
            </div>
          </div>
          {byCustomer.length ? (
            <>
              <div className="table-wrap desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Müşteri</th>
                      <th className="right">Veresiye</th>
                      <th className="right">Tahsilat / Yükleme</th>
                      <th className="right">Fark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCustomer.map((x) => (
                      <tr key={x.c.id}>
                        <td>
                          <Avatar name={x.c.name} />
                          <b>{x.c.name}</b>
                        </td>
                        <td className="right">{money(x.charge)}</td>
                        <td className="right green-text">
                          {money(x.payment)}
                        </td>
                        <td
                          className={
                            'right amount ' +
                            (x.charge - x.payment < -0.009
                              ? 'credit'
                              : x.charge - x.payment > 0.009
                                ? 'due'
                                : '')
                          }
                        >
                          {balanceLabel(x.charge - x.payment).text}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-list mobile-only">
                {byCustomer.map((x) => (
                  <div className="list-card static" key={x.c.id}>
                    <Avatar name={x.c.name} />
                    <div className="list-card-body">
                      <b>{x.c.name}</b>
                      <span>
                        Veresiye {money(x.charge)} · Tahsilat / yükleme{' '}
                        {money(x.payment)}
                      </span>
                    </div>
                    <strong
                      className={
                        'amount ' +
                        (x.charge - x.payment < -0.009
                          ? 'credit'
                          : x.charge - x.payment > 0.009
                            ? 'due'
                            : '')
                      }
                    >
                      {balanceLabel(x.charge - x.payment).text}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty
              icon={BarChart3}
              title="Bu dönemde işlem yok"
              text="İşlem eklendikçe burada özetlenir."
            />
          )}
        </div>
        <div className="panel category-report">
          <h2>Kategori Dağılımı</h2>
          {(['yemek', 'içecek', 'diğer'] as Category[]).map((cat) => {
            const ids = new Set(
              data.menuItems
                .filter((m) => m.category === cat)
                .map((m) => m.id)
            );
            const val = lines
              .filter((l) => l.menuItemId && ids.has(l.menuItemId))
              .reduce((s, l) => s + lineTotal(l), 0);
            const pct = sales ? Math.round((val / sales) * 100) : 0;
            return (
              <div className="bar-row" key={cat}>
                <div>
                  <b>{cat[0].toLocaleUpperCase('tr') + cat.slice(1)}</b>
                  <span>
                    {money(val)} • %{pct}
                  </span>
                </div>
                <div className="bar">
                  <i style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Purchases({
  data,
  update,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, msg?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const start = startFor(period);
  const list = data.purchases
    .filter((p) => new Date(p.date + 'T23:59:59') >= start)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = list.reduce((s, p) => s + p.qty * p.unitCost, 0);

  const remove = (id: string) => {
    if (confirm('Alım kaydı silinsin mi?'))
      update(
        (d) => ({
          ...d,
          purchases: d.purchases.filter((x) => x.id !== id),
        }),
        'Alım silindi'
      );
  };

  return (
    <>
      <div className="toolbar">
        <div className="tabs scroll-tabs">
          {(
            [
              ['day', 'Bugün'],
              ['week', 'Bu Hafta'],
              ['month', 'Bu Ay'],
            ] as const
          ).map(([x, l]) => (
            <button
              className={period === x ? 'active' : ''}
              onClick={() => setPeriod(x)}
              key={x}
            >
              {l}
            </button>
          ))}
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <Plus /> Alım Kaydet
        </button>
      </div>
      <div className="purchase-summary">
        <div>
          <span>Seçili dönem toplamı</span>
          <strong>{money(total)}</strong>
          <small>{list.length} alım kaydı</small>
        </div>
        <ShoppingBasket />
      </div>
      <div className="panel">
        <div className="panel-title">
          <div>
            <h2>Restoran Alımları</h2>
            <p>Ürün, malzeme ve tedarik giderleri</p>
          </div>
        </div>
        {list.length ? (
          <>
            <div className="table-wrap">
              <table className="purchases-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Ürün / Malzeme</th>
                    <th>Tedarikçi / Not</th>
                    <th className="right">Miktar</th>
                    <th className="right">Birim Fiyat</th>
                    <th className="right">Toplam</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.date)}</td>
                      <td>
                        <b>{p.name}</b>
                      </td>
                      <td className="muted">{p.supplierNote || '-'}</td>
                      <td className="right">{p.qty}</td>
                      <td className="right">{money(p.unitCost)}</td>
                      <td className="right amount">
                        {money(p.qty * p.unitCost)}
                      </td>
                      <td>
                        <button
                          className="icon-btn danger-text"
                          onClick={() => remove(p.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-list mobile-only purchases-cards">
              {list.map((p) => (
                <div className="list-card static" key={p.id}>
                  <div className="list-card-body">
                    <b>{p.name}</b>
                    <span>
                      {fmtDate(p.date)}
                      {p.supplierNote ? ` · ${p.supplierNote}` : ''}
                    </span>
                    <span>
                      {p.qty} × {money(p.unitCost)}
                    </span>
                  </div>
                  <strong className="amount">
                    {money(p.qty * p.unitCost)}
                  </strong>
                  <button
                    className="icon-btn danger-text"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty
            icon={ShoppingBasket}
            title="Alım kaydı yok"
            text="Sebze, et, içecek veya diğer malzeme alımlarını ekleyin."
          />
        )}
      </div>
      {open && (
        <PurchaseForm
          onClose={() => setOpen(false)}
          onSave={(p) => {
            update(
              (d) => ({ ...d, purchases: [...d.purchases, p] }),
              'Alım kaydedildi'
            );
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function PurchaseForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Purchase) => void;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(dateOnly());
  const [note, setNote] = useState('');
  return (
    <Modal title="Yeni Alım Kaydı" onClose={onClose}>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onSave({
            id: uid(),
            name: name.trim(),
            qty: Number(qty),
            unitCost: Number(cost),
            date,
            supplierNote: note.trim(),
          });
        }}
      >
        <label>Ürün / Malzeme *</label>
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. 10 kg dana kıyma"
        />
        <div className="form-row">
          <div>
            <label>Miktar *</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <label>Birim maliyet (₺) *</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </div>
        <label>Tarih *</label>
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <label>Tedarikçi / Not</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Örn. Hal - Ali Bey"
        />
        <div className="purchase-preview">
          Toplam: <b>{money(Number(qty) * Number(cost))}</b>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button className="primary">
            <Save /> Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-shade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={'modal ' + (wide ? 'wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close" onClick={onClose} aria-label="Formu kapat">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
