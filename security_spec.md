# Security Specification: BukuKas Pro Realtime Firestore Rules

## 1. Data Invariants
- **Koleksi Transaksi (`/transactions/{transactionId}`)**:
  - `id` harus berupa string alfanumerik valid (panjang maksimal 128 karakter, pola `^[a-zA-Z0-9_\-]+$`) dan cocok dengan document ID.
  - `amount` wajib berupa angka positif (`amount > 0`).
  - `type` hanya boleh bernilai `'pemasukan'` atau `'pengeluaran'`.
  - `date` wajib string format tanggal valid `YYYY-MM-DD` (panjang 10).
  - `categoryId` dan `accountId` wajib string non-kosong.
  - Pengguna terautentikasi dapat membaca dan menulis transaksi dengan validasi skema yang ketat.
- **Koleksi Kategori (`/categories/{categoryId}`)**:
  - `id` harus valid dan cocok dengan path.
  - `name` wajib string berukuran 1..100 karakter.
  - `type` wajib `'pemasukan'` atau `'pengeluaran'`.
  - `icon` dan `color` wajib string valid.
- **Koleksi Akun (`/accounts/{accountId}`)**:
  - `id`, `name`, `icon`, `type` valid (tipe: `'tunai'`, `'bank'`, `'ewallet'`).
- **Koleksi Pengaturan (`/settings/{settingId}`)**:
  - Khusus konfigurasi aplikasi seperti PIN Admin (`settingId == 'adminPin'`).
  - `key` dan `value` wajib string berukuran valid (PIN 4..8 karakter numerik).
- **Global Invariant**:
  - Default deny-all catch-all pada `/{document=**}`.
  - Semua operasi penulisan wajib dilakukan oleh user terautentikasi (`isSignedIn()`).
  - Semua field string wajib memiliki batasan ukuran (`.size()`) untuk mencegah serangan Denial of Wallet.

---

## 2. The "Dirty Dozen" Threat Payloads

Berikut adalah 12 payload serangan yang dirancang untuk menguji kekokohan aturan keamanan:

### Payload 1: Unauthenticated Read / List
- **Target**: `GET /transactions`
- **Auth**: `null` (Anonymous / Unauthenticated)
- **Ekspektasi**: `PERMISSION_DENIED`

### Payload 2: Unauthenticated Create Transaction
- **Target**: `CREATE /transactions/tx_hacker_01`
- **Auth**: `null`
- **Data**: `{"id": "tx_hacker_01", "amount": 100000, "type": "pengeluaran", "date": "2026-11-02", "categoryId": "cat_food", "accountId": "acc_cash"}`
- **Ekspektasi**: `PERMISSION_DENIED`

### Payload 3: Negative Amount Injection (State Corruption)
- **Target**: `CREATE /transactions/tx_neg_01`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_neg_01", "amount": -5000000, "type": "pemasukan", "date": "2026-11-02", "categoryId": "cat_salary", "accountId": "acc_bank"}`
- **Ekspektasi**: `PERMISSION_DENIED` (amount <= 0)

### Payload 4: Zero Amount Exploitation
- **Target**: `CREATE /transactions/tx_zero_01`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_zero_01", "amount": 0, "type": "pengeluaran", "date": "2026-11-02", "categoryId": "cat_food", "accountId": "acc_cash"}`
- **Ekspektasi**: `PERMISSION_DENIED` (amount must be > 0)

### Payload 5: Invalid Transaction Type Spoofing
- **Target**: `CREATE /transactions/tx_spoof_01`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_spoof_01", "amount": 100000, "type": "dana_gelap", "date": "2026-11-02", "categoryId": "cat_food", "accountId": "acc_cash"}`
- **Ekspektasi**: `PERMISSION_DENIED` (type is not 'pemasukan' or 'pengeluaran')

### Payload 6: Path Traversal / Poisoned Document ID
- **Target**: `CREATE /transactions/..%2Fadmin_compromise`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_normal", "amount": 1000, "type": "pemasukan", "date": "2026-11-02", "categoryId": "cat_1", "accountId": "acc_1"}`
- **Ekspektasi**: `PERMISSION_DENIED` (fails isValidId check)

### Payload 7: Denial of Wallet (Gigantic String Payload)
- **Target**: `CREATE /transactions/tx_flood_01`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_flood_01", "amount": 5000, "type": "pengeluaran", "date": "2026-11-02", "categoryId": "cat_1", "accountId": "acc_1", "note": "A".repeat(50000)}`
- **Ekspektasi**: `PERMISSION_DENIED` (note exceeds maxLength 1000)

### Payload 8: Document ID Mismatch (Integrity Bypass)
- **Target**: `CREATE /transactions/tx_real_id`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_fake_id", "amount": 5000, "type": "pengeluaran", "date": "2026-11-02", "categoryId": "cat_1", "accountId": "acc_1"}`
- **Ekspektasi**: `PERMISSION_DENIED` (id in body must match path document id)

### Payload 9: Malicious Admin PIN Hijack (Arbitrary Alphanumeric PIN)
- **Target**: `UPDATE /settings/adminPin`
- **Auth**: `null` (Unauthenticated)
- **Data**: `{"key": "adminPin", "value": "hacked_pin"}`
- **Ekspektasi**: `PERMISSION_DENIED`

### Payload 10: PIN Format Violation
- **Target**: `UPDATE /settings/adminPin`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"key": "adminPin", "value": "12"}` (less than 4 digits)
- **Ekspektasi**: `PERMISSION_DENIED` (PIN must match `^\d{4,8}$`)

### Payload 11: Shadow Field Injection
- **Target**: `CREATE /transactions/tx_shadow_01`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_shadow_01", "amount": 5000, "type": "pemasukan", "date": "2026-11-02", "categoryId": "c1", "accountId": "a1", "isAdmin": true, "superBypass": "secret"}`
- **Ekspektasi**: `PERMISSION_DENIED` (affected/allowed keys constraint rejects unregistered fields)

### Payload 12: Invalid Date Format Attack
- **Target**: `CREATE /transactions/tx_baddate_01`
- **Auth**: `{uid: "attacker_1"}`
- **Data**: `{"id": "tx_baddate_01", "amount": 5000, "type": "pemasukan", "date": "02/11/2026; DROP TABLE", "categoryId": "c1", "accountId": "a1"}`
- **Ekspektasi**: `PERMISSION_DENIED` (date does not match `^\d{4}-\d{2}-\d{2}$`)

---

## 3. The Test Runner Reference (`firestore.rules.test.ts`)
Pengujian dilakukan terhadap emulator / rule assertions untuk memastikan setiap pelanggaran mengembalikan `PERMISSION_DENIED`.
