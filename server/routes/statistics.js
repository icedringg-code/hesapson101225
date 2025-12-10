import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/overall', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const jobsResult = await query('SELECT * FROM jobs WHERE user_id = $1', [userId]);
    const transactionsResult = await query('SELECT * FROM transactions WHERE user_id = $1', [userId]);
    const companiesResult = await query('SELECT * FROM companies WHERE user_id = $1', [userId]);

    const jobs = jobsResult.rows;
    const transactions = transactionsResult.rows;
    const companies = companiesResult.rows;

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      const company = companies.find((c) => c.id === transaction.company_id);
      if (!company) return;

      if (company.type === 'İşveren') {
        if (transaction.note === 'Gelir' || transaction.note === 'Tahsilat' || transaction.note === 'Hakediş Alındı') {
          totalIncome += Number(transaction.income);
        } else if (transaction.note === 'İşveren Harcaması' || transaction.note === 'Ödeme Yapıldı') {
          totalExpense += Number(transaction.expense);
        }
      }
    });

    const stats = {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'Aktif').length,
      completedJobs: jobs.filter((j) => j.status === 'Tamamlandı').length,
      pausedJobs: jobs.filter((j) => j.status === 'Duraklatıldı').length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error calculating overall stats:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/job/:jobId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobId } = req.params;

    const transactionsResult = await query(
      'SELECT * FROM transactions WHERE user_id = $1 AND job_id = $2',
      [userId, jobId]
    );

    const companiesResult = await query(
      'SELECT * FROM companies WHERE user_id = $1 AND job_id = $2',
      [userId, jobId]
    );

    const transactions = transactionsResult.rows;
    const companies = companiesResult.rows;

    let totalIncome = 0;
    let totalExpense = 0;
    let totalToBePaid = 0;
    let totalPaid = 0;

    transactions.forEach((transaction) => {
      const company = companies.find((c) => c.id === transaction.company_id);
      if (!company) return;

      if (company.type === 'İşveren') {
        if (transaction.note === 'Gelir' || transaction.note === 'Tahsilat' || transaction.note === 'Hakediş Alındı') {
          totalIncome += Number(transaction.income);
        } else if (transaction.note === 'İşveren Harcaması' || transaction.note === 'Ödeme Yapıldı') {
          totalExpense += Number(transaction.expense);
        }
      } else if (company.type === 'Çalışan') {
        if (transaction.note === 'Alacak') {
          totalToBePaid += Number(transaction.income);
        } else if (transaction.note === 'Ödeme Alındı') {
          totalPaid += Number(transaction.income);
        }
      }
    });

    const stats = {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      totalToBePaid,
      totalPaid,
      totalRemaining: totalToBePaid - totalPaid,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error calculating job stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
