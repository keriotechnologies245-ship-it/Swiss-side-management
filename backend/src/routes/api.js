import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { sendReceipt } from '../services/africasTalking.js';

const router = Router();

// Zod schema for withdrawing item (Strict Input Validation)
const withdrawalSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().positive(),
  staffName: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+2547\d{8}$/, "Must be a valid Kenyan phone number, format: +2547XXXXXXXX"),
  notes: z.string().max(250).optional()
});

router.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Items')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[API] GET /items Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch items.' });
  }
});

router.post('/withdrawals', async (req, res) => {
  try {
    // 1. Strict Request Validation
    const parsed = withdrawalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data.', 
        details: parsed.error.format() 
      });
    }

    const { itemId, quantity, staffName, phoneNumber, notes } = parsed.data;

    // 2. Database Transaction using Supabase RPC to prevent Race Conditions
    // We will call a Postgres function "process_withdrawal" that safely decrements and logs.
    // If we don't have RPC setup yet, we use a basic approach with careful checks.
    
    const { data: item, error: fetchError } = await supabase
      .from('Items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({ success: false, error: 'Insufficient stock in inventory.' });
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('Items')
      .update({ quantity: item.quantity - quantity, updated_at: new Date() })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    const { data: logData, error: logError } = await supabase
      .from('Withdrawals')
      .insert([{
        item_id: itemId,
        item_name: item.name,
        quantity,
        unit: item.unit,
        staff_name: staffName,
        phone_number: phoneNumber,
        notes: notes || null
      }])
      .select()
      .single();

    if (logError) throw logError;

    // 3. Trigger African's Talking Receipt
    const receiptText = `THE SWISS SIDE ITEN\nStock Withdrawal\n---\nRef: #${logData.id}\nStaff: ${staffName}\nItem: ${item.name}\nQty: ${quantity} ${item.unit}\n---\nThank you!`;
    
    // We run it async so it doesn't block the API response
    sendReceipt(phoneNumber, receiptText).catch(e => console.error('[Receipt Error]', e.message));

    return res.status(201).json({ success: true, data: logData });
  } catch (err) {
    console.error('[API] POST /withdrawals Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error processing withdrawal.' });
  }
});

export default router;
