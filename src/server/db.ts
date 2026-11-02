import pg from 'pg';
import dotenv from 'dotenv';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_ACCOUNTS,
  getInitialSampleTransactions,
} from '../data/defaultData';
import { Transaction, Category, AccountWallet } from '../types/finance';

dotenv.config();

const { Pool } = pg;

// Supabase PostgreSQL Credentials
const SUPABASE_DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:HhkRB8lchcqIXgKi@db.dlrlfvpmpobgeimmzdcw.supabase.co:5432/postgres';

export const pool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const SUPABASE_INFO = {
  organization: 'Denuda',
  projectName: 'keuangan',
  projectId: 'dlrlfvpmpobgeimmzdcw',
  restApiUrl: 'https://dlrlfvpmpobgeimmzdcw.supabase.co/rest/v1/',
  host: 'db.dlrlfvpmpobgeimmzdcw.supabase.co',
  publishableKey: 'sb_publishable_yzopiybjb6baTL2EU2TaQQ_s8fwpTsD',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscmxmdnBtcG9iZ2VpbW16ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjMwMjEsImV4cCI6MjEwOTA5OTAyMX0.mdpJmhsjfrw3wX9T_Q7ogKv8ZIDGy2YechC05_uEVVo',
};

// Live round-trip connection test for Supabase PostgreSQL & REST API
export async function testSupabaseConnection() {
  const startTime = Date.now();
  const client = await pool.connect();
  try {
    const timeQuery = await client.query('SELECT NOW() as current_time, version() as version');
    const catCount = await client.query('SELECT COUNT(*) as count FROM categories');
    const accCount = await client.query('SELECT COUNT(*) as count FROM accounts');
    const txCount = await client.query('SELECT COUNT(*) as count FROM transactions');
    const dbLatencyMs = Date.now() - startTime;

    // Test REST API using user anon key
    let restApiStatus = '200 OK';
    let restApiLatency = 0;
    try {
      const restStart = Date.now();
      const restRes = await fetch(`${SUPABASE_INFO.restApiUrl}categories?select=id&limit=1`, {
        headers: {
          apikey: SUPABASE_INFO.anonKey,
          Authorization: `Bearer ${SUPABASE_INFO.anonKey}`,
        },
      });
      restApiLatency = Date.now() - restStart;
      restApiStatus = restRes.ok ? `200 OK` : `HTTP ${restRes.status}`;
    } catch (e: any) {
      restApiStatus = `Error: ${e.message}`;
    }

    return {
      success: true,
      connected: true,
      dbLatencyMs,
      restApiStatus,
      restApiLatency,
      timestamp: timeQuery.rows[0].current_time,
      postgresVersion: (timeQuery.rows[0].version || '').split(' on ')[0],
      counts: {
        categories: parseInt(catCount.rows[0].count, 10),
        accounts: parseInt(accCount.rows[0].count, 10),
        transactions: parseInt(txCount.rows[0].count, 10),
      },
      info: {
        organization: SUPABASE_INFO.organization,
        project: SUPABASE_INFO.projectName,
        projectId: SUPABASE_INFO.projectId,
        restApiUrl: SUPABASE_INFO.restApiUrl,
        host: SUPABASE_INFO.host,
      },
    };
  } finally {
    client.release();
  }
}

// Initialize schema in Supabase
export async function initSupabaseDb() {
  const client = await pool.connect();
  try {
    // 1. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        is_custom BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'CreditCard',
        type TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'CreditCard';

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
        amount NUMERIC NOT NULL,
        category_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        note TEXT,
        recipient_or_payer TEXT,
        receipt_url TEXT,
        created_at BIGINT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Check if categories need seeding
    const catCheck = await client.query('SELECT COUNT(*) as count FROM categories');
    if (parseInt(catCheck.rows[0].count, 10) === 0) {
      const allDefaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
      for (const cat of allDefaultCats) {
        await client.query(
          `INSERT INTO categories (id, name, type, icon, color, description, is_custom)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.description || '', false]
        );
      }
      console.log('Seeded default categories to Supabase');
    }

    // 3. Check if accounts need seeding
    const accCheck = await client.query('SELECT COUNT(*) as count FROM accounts');
    if (parseInt(accCheck.rows[0].count, 10) === 0) {
      for (const acc of DEFAULT_ACCOUNTS) {
        await client.query(
          `INSERT INTO accounts (id, name, icon, type)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, type = EXCLUDED.type`,
          [acc.id, acc.name, acc.icon, acc.type]
        );
      }
      console.log('Seeded default accounts to Supabase');
    }

    // 4. Check if transactions need seeding
    const txCheck = await client.query('SELECT COUNT(*) as count FROM transactions');
    if (parseInt(txCheck.rows[0].count, 10) === 0) {
      const sampleTxs = getInitialSampleTransactions();
      for (const tx of sampleTxs) {
        await client.query(
          `INSERT INTO transactions (id, type, amount, category_id, account_id, date, time, note, recipient_or_payer, receipt_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            tx.id,
            tx.type,
            tx.amount,
            tx.categoryId,
            tx.accountId,
            tx.date,
            tx.time || '12:00',
            tx.note || '',
            tx.recipientOrPayer || null,
            tx.receiptUrl || null,
            tx.createdAt,
          ]
        );
      }
      console.log('Seeded sample transactions to Supabase');
    }

    // 5. Check if default PIN is set
    const pinCheck = await client.query("SELECT value FROM app_settings WHERE key = 'admin_pin'");
    if (pinCheck.rows.length === 0) {
      await client.query(
        "INSERT INTO app_settings (key, value) VALUES ('admin_pin', $1)",
        [JSON.stringify('123456')]
      );
    }

    console.log('Supabase Database initialized successfully!');
  } finally {
    client.release();
  }
}

// Data Access Helpers
export async function getAllCategories(): Promise<Category[]> {
  const { rows } = await pool.query(
    'SELECT id, name, type, icon, color, description, is_custom as "isCustom" FROM categories ORDER BY name ASC'
  );
  return rows;
}

export async function insertCategory(cat: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
  const id = cat.id || `cat_${cat.type.slice(0, 3)}_${Date.now()}`;
  await pool.query(
    `INSERT INTO categories (id, name, type, icon, color, description, is_custom)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, cat.name, cat.type, cat.icon, cat.color, cat.description || '', true]
  );
  return { ...cat, id, isCustom: true };
}

export async function updateCategory(id: string, cat: Partial<Category>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (cat.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(cat.name);
  }
  if (cat.type !== undefined) {
    fields.push(`type = $${idx++}`);
    values.push(cat.type);
  }
  if (cat.icon !== undefined) {
    fields.push(`icon = $${idx++}`);
    values.push(cat.icon);
  }
  if (cat.color !== undefined) {
    fields.push(`color = $${idx++}`);
    values.push(cat.color);
  }
  if (cat.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(cat.description);
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  // Check if used in transactions
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE category_id = $1', [id]);
  const count = parseInt(rows[0].count, 10);
  if (count > 0) {
    return {
      success: false,
      message: `Kategori ini sedang digunakan oleh ${count} transaksi kas di database Supabase. Ubah transaksi terlebih dahulu.`,
    };
  }

  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  return { success: true };
}

export async function getAllAccounts(): Promise<AccountWallet[]> {
  const { rows } = await pool.query(
    'SELECT id, name, icon, type FROM accounts'
  );
  if (rows.length === 0) {
    return DEFAULT_ACCOUNTS;
  }
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon || 'CreditCard',
    type: r.type as 'tunai' | 'bank' | 'ewallet',
  }));
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { rows } = await pool.query(`
    SELECT 
      id, 
      type, 
      amount, 
      category_id as "categoryId", 
      account_id as "accountId", 
      date, 
      time, 
      note, 
      recipient_or_payer as "recipientOrPayer", 
      receipt_url as "receiptUrl", 
      created_at as "createdAt"
    FROM transactions 
    ORDER BY date DESC, time DESC, created_at DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    categoryId: r.categoryId,
    accountId: r.accountId,
    date: r.date,
    time: r.time,
    note: r.note,
    recipientOrPayer: r.recipientOrPayer,
    receiptUrl: r.receiptUrl,
    createdAt: Number(r.createdAt || Date.now()),
  }));
}

export async function insertTransaction(tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<Transaction> {
  const id = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = tx.createdAt || Date.now();

  await pool.query(
    `INSERT INTO transactions (id, type, amount, category_id, account_id, date, time, note, recipient_or_payer, receipt_url, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      tx.type,
      tx.amount,
      tx.categoryId,
      tx.accountId,
      tx.date,
      tx.time || '12:00',
      tx.note || '',
      tx.recipientOrPayer || null,
      tx.receiptUrl || null,
      createdAt,
    ]
  );

  return {
    ...tx,
    id,
    createdAt,
  };
}

export async function updateTransaction(id: string, tx: Partial<Transaction>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (tx.type !== undefined) {
    fields.push(`type = $${idx++}`);
    values.push(tx.type);
  }
  if (tx.amount !== undefined) {
    fields.push(`amount = $${idx++}`);
    values.push(tx.amount);
  }
  if (tx.categoryId !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(tx.categoryId);
  }
  if (tx.accountId !== undefined) {
    fields.push(`account_id = $${idx++}`);
    values.push(tx.accountId);
  }
  if (tx.date !== undefined) {
    fields.push(`date = $${idx++}`);
    values.push(tx.date);
  }
  if (tx.time !== undefined) {
    fields.push(`time = $${idx++}`);
    values.push(tx.time);
  }
  if (tx.note !== undefined) {
    fields.push(`note = $${idx++}`);
    values.push(tx.note);
  }
  if (tx.recipientOrPayer !== undefined) {
    fields.push(`recipient_or_payer = $${idx++}`);
    values.push(tx.recipientOrPayer);
  }
  if (tx.receiptUrl !== undefined) {
    fields.push(`receipt_url = $${idx++}`);
    values.push(tx.receiptUrl);
  }

  if (fields.length > 0) {
    fields.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
}

export async function getAdminPin(): Promise<string> {
  const { rows } = await pool.query("SELECT value FROM app_settings WHERE key = 'admin_pin'");
  if (rows.length > 0 && rows[0].value) {
    return typeof rows[0].value === 'string' ? rows[0].value : JSON.stringify(rows[0].value).replace(/"/g, '');
  }
  return '123456';
}

export async function setAdminPin(pin: string): Promise<void> {
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at) 
     VALUES ('admin_pin', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(pin)]
  );
}

export async function resetDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM accounts');

    // Re-seed categories
    const allDefaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    for (const cat of allDefaultCats) {
      await client.query(
        `INSERT INTO categories (id, name, type, icon, color, description, is_custom)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.description || '', false]
      );
    }

    // Re-seed accounts
    for (const acc of DEFAULT_ACCOUNTS) {
      await client.query(
        `INSERT INTO accounts (id, name, icon, type)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, type = EXCLUDED.type`,
        [acc.id, acc.name, acc.icon, acc.type]
      );
    }

    // Re-seed transactions
    const sampleTxs = getInitialSampleTransactions();
    for (const tx of sampleTxs) {
      await client.query(
        `INSERT INTO transactions (id, type, amount, category_id, account_id, date, time, note, recipient_or_payer, receipt_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          tx.id,
          tx.type,
          tx.amount,
          tx.categoryId,
          tx.accountId,
          tx.date,
          tx.time || '12:00',
          tx.note || '',
          tx.recipientOrPayer || null,
          tx.receiptUrl || null,
          tx.createdAt,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function importData(data: {
  categories?: Category[];
  accounts?: AccountWallet[];
  transactions?: Transaction[];
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (Array.isArray(data.categories) && data.categories.length > 0) {
      await client.query('DELETE FROM categories');
      for (const cat of data.categories) {
        await client.query(
          `INSERT INTO categories (id, name, type, icon, color, description, is_custom)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             type = EXCLUDED.type, 
             icon = EXCLUDED.icon, 
             color = EXCLUDED.color, 
             description = EXCLUDED.description`,
          [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.description || '', !!cat.isCustom]
        );
      }
    }

    if (Array.isArray(data.accounts) && data.accounts.length > 0) {
      await client.query('DELETE FROM accounts');
      for (const acc of data.accounts) {
        await client.query(
          `INSERT INTO accounts (id, name, icon, type)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, type = EXCLUDED.type`,
          [acc.id, acc.name, acc.icon || 'CreditCard', acc.type]
        );
      }
    }

    if (Array.isArray(data.transactions) && data.transactions.length > 0) {
      await client.query('DELETE FROM transactions');
      for (const tx of data.transactions) {
        await client.query(
          `INSERT INTO transactions (id, type, amount, category_id, account_id, date, time, note, recipient_or_payer, receipt_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET 
             type = EXCLUDED.type, 
             amount = EXCLUDED.amount, 
             category_id = EXCLUDED.category_id, 
             account_id = EXCLUDED.account_id, 
             date = EXCLUDED.date, 
             time = EXCLUDED.time, 
             note = EXCLUDED.note, 
             recipient_or_payer = EXCLUDED.recipient_or_payer, 
             receipt_url = EXCLUDED.receipt_url`,
          [
            tx.id,
            tx.type,
            tx.amount,
            tx.categoryId,
            tx.accountId,
            tx.date,
            tx.time || '12:00',
            tx.note || '',
            tx.recipientOrPayer || null,
            tx.receiptUrl || null,
            tx.createdAt || Date.now(),
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
