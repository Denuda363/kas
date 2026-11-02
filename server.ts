import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import {
  initSupabaseDb,
  SUPABASE_INFO,
  testSupabaseConnection,
  getAllTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  getAllCategories,
  insertCategory,
  updateCategory,
  deleteCategory,
  getAllAccounts,
  getAdminPin,
  setAdminPin,
  resetDatabase,
  importData,
} from './src/server/db';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Increase body parser limit for base64 receipt images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 1. Supabase Status and Info
app.get('/api/status', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      database: 'Supabase (PostgreSQL)',
      connected: true,
      info: {
        organization: SUPABASE_INFO.organization,
        project: SUPABASE_INFO.projectName,
        projectId: SUPABASE_INFO.projectId,
        restApiUrl: SUPABASE_INFO.restApiUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Live Connection Test Endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const result = await testSupabaseConnection();
    res.json(result);
  } catch (err: any) {
    console.error('Test connection failed:', err);
    res.status(500).json({
      success: false,
      connected: false,
      message: err.message,
    });
  }
});

// 2. Initial Bootstrap
app.get('/api/bootstrap', async (req, res) => {
  try {
    const [categories, accounts, transactions, adminPin] = await Promise.all([
      getAllCategories(),
      getAllAccounts(),
      getAllTransactions(),
      getAdminPin(),
    ]);

    res.json({
      success: true,
      supabaseConnected: true,
      database: 'Supabase',
      project: SUPABASE_INFO.projectName,
      projectId: SUPABASE_INFO.projectId,
      organization: SUPABASE_INFO.organization,
      categories,
      accounts,
      transactions,
      adminPin,
    });
  } catch (err: any) {
    console.error('Failed to bootstrap from Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Transactions CRUD
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await getAllTransactions();
    res.json({ success: true, data: transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const tx = await insertTransaction(req.body);
    res.json({ success: true, data: tx });
  } catch (err: any) {
    console.error('Error inserting transaction to Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    await updateTransaction(req.params.id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating transaction in Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await deleteTransaction(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting transaction in Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Categories CRUD
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const cat = await insertCategory(req.body);
    res.json({ success: true, data: cat });
  } catch (err: any) {
    console.error('Error inserting category in Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    await updateCategory(req.params.id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating category in Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const result = await deleteCategory(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting category in Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await getAllAccounts();
    res.json({ success: true, data: accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Admin PIN Settings
app.get('/api/settings/pin', async (req, res) => {
  try {
    const pin = await getAdminPin();
    res.json({ success: true, pin });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/settings/pin', async (req, res) => {
  try {
    const { newPin } = req.body;
    if (!newPin || !/^\d{4,8}$/.test(newPin)) {
      return res.status(400).json({ success: false, message: 'Format PIN tidak valid.' });
    }
    await setAdminPin(newPin);
    res.json({ success: true, message: 'PIN Admin berhasil disimpan ke Supabase!' });
  } catch (err: any) {
    console.error('Error setting PIN in Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Reset and Import
app.post('/api/reset', async (req, res) => {
  try {
    await resetDatabase();
    const [categories, accounts, transactions] = await Promise.all([
      getAllCategories(),
      getAllAccounts(),
      getAllTransactions(),
    ]);
    res.json({
      success: true,
      message: 'Database Supabase berhasil direset ke data awal.',
      categories,
      accounts,
      transactions,
    });
  } catch (err: any) {
    console.error('Error resetting Supabase database:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    await importData(req.body);
    const [categories, accounts, transactions] = await Promise.all([
      getAllCategories(),
      getAllAccounts(),
      getAllTransactions(),
    ]);
    res.json({
      success: true,
      message: 'Data cadangan berhasil diimpor ke Supabase.',
      categories,
      accounts,
      transactions,
    });
  } catch (err: any) {
    console.error('Error importing data to Supabase:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server and Mount Vite
async function start() {
  try {
    console.log('Connecting to Supabase and initializing tables...');
    await initSupabaseDb();
  } catch (err) {
    console.error('Warning: Supabase initial connection attempt failed:', err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite in middleware mode with HMR explicitly disabled
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} with Supabase backend!`);
  });
}

start();
