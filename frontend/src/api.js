import { supabase } from './lib/supabaseClient';

/**
 * FETCH ALL ITEMS
 */
export const fetchItems = async () => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return { success: true, data };
};

/**
 * FETCH TRANSACTION HISTORY
 */
export const fetchHistory = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { success: true, data };
};

/**
 * CREATE WITHDRAWAL
 * Uses Atomic RPC to ensure stock integrity.
 */
export const createWithdrawal = async ({ itemId, quantity, staffName, notes }) => {
  const { error } = await supabase.rpc('process_stock_transaction', {
    p_item_id: itemId,
    p_qty: quantity,
    p_type: 'WITHDRAWAL',
    p_person: staffName,
    p_notes: notes
  });

  if (error) throw error;
  return { success: true };
};

/**
 * ADD STOCK (RESTOCK)
 * Uses Atomic RPC to ensure stock integrity.
 */
export const addStock = async ({ itemId, quantity, source, notes }) => {
  const { error } = await supabase.rpc('process_stock_transaction', {
    p_item_id: itemId,
    p_qty: quantity,
    p_type: 'RESTOCK',
    p_person: source,
    p_notes: notes
  });

  if (error) throw error;
  return { success: true };
};

/**
 * AUTH HELPERS
 */
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const logout = async () => {
    await supabase.auth.signOut();
};
