import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { job_id, company_id } = req.query;
    let result;

    if (job_id) {
      result = await query(
        'SELECT * FROM transactions WHERE user_id = $1 AND job_id = $2 ORDER BY date DESC, created_at DESC',
        [userId, job_id]
      );
    } else if (company_id) {
      result = await query(
        'SELECT * FROM transactions WHERE user_id = $1 AND company_id = $2 ORDER BY date DESC, created_at DESC',
        [userId, company_id]
      );
    } else {
      result = await query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
        [userId]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      job_id,
      company_id,
      performed_by_id,
      date,
      description,
      income,
      expense,
      note,
      currency_type,
      payment_method,
      check_date,
      check_status,
      gold_weight,
      gold_price_per_gram,
      gold_total_price
    } = req.body;

    const result = await query(
      `INSERT INTO transactions (
        user_id, job_id, company_id, performed_by_id, date, description,
        income, expense, note, currency_type, payment_method, check_date,
        check_status, gold_weight, gold_price_per_gram, gold_total_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        userId,
        job_id || null,
        company_id || null,
        performed_by_id || null,
        date || new Date().toISOString().split('T')[0],
        description,
        income || 0,
        expense || 0,
        note || '',
        currency_type || 'TRY',
        payment_method || 'Nakit',
        check_date || null,
        check_status || 'Beklemede',
        gold_weight || 0,
        gold_price_per_gram || 0,
        gold_total_price || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      job_id,
      company_id,
      performed_by_id,
      date,
      description,
      income,
      expense,
      note,
      currency_type,
      payment_method,
      check_date,
      check_status,
      gold_weight,
      gold_price_per_gram,
      gold_total_price
    } = req.body;

    const result = await query(
      `UPDATE transactions
       SET job_id = $1, company_id = $2, performed_by_id = $3, date = $4,
           description = $5, income = $6, expense = $7, note = $8,
           currency_type = $9, payment_method = $10, check_date = $11,
           check_status = $12, gold_weight = $13, gold_price_per_gram = $14,
           gold_total_price = $15, updated_at = now()
       WHERE id = $16 AND user_id = $17
       RETURNING *`,
      [
        job_id,
        company_id,
        performed_by_id,
        date,
        description,
        income,
        expense,
        note,
        currency_type,
        payment_method,
        check_date,
        check_status,
        gold_weight,
        gold_price_per_gram,
        gold_total_price,
        req.params.id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
