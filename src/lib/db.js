/**
 * db.js — All database operations for the Inventory System
 * Handles camelCase (app) <-> snake_case (DB) conversions
 */

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────
// CONVERTERS
// ─────────────────────────────────────────────────────────────

function productToDb(product, userId) {
  return {
    id: product.id,
    user_id: userId,
    name: product.name,
    category: product.category || '',
    selling_price: product.sellingPrice,
    cost_price: product.costPrice,
    current_qty: product.currentQty,
  };
}

function dbToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sellingPrice: Number(row.selling_price),
    costPrice: Number(row.cost_price),
    currentQty: Number(row.current_qty),
  };
}

function logToDb(log, userId) {
  return {
    id: log.id,
    user_id: userId,
    product_id: log.productId,
    quantity: log.quantity,
    price: log.price,
    timestamp: log.timestamp,
  };
}

function dbToLog(row) {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: Number(row.quantity),
    price: Number(row.price),
    timestamp: row.timestamp,
  };
}

function settingsToDb(settings, userId) {
  return {
    user_id: userId,
    currency: settings.currency,
    date_format: settings.dateFormat,
    theme: settings.theme,
    accent: settings.accent,
    updated_at: new Date().toISOString(),
  };
}

function dbToSettings(row) {
  if (!row) return { currency: '₱', dateFormat: 'MM/DD/yyyy', theme: 'light', accent: 'sage' };
  return {
    currency: row.currency,
    dateFormat: row.date_format,
    theme: row.theme,
    accent: row.accent,
  };
}

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────

/** Find a user by email + pin. Returns { id, email, pin } or null. */
export async function findUser(email, pin) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, pin')
    .eq('email', email)
    .eq('pin', pin)
    .maybeSingle();
  if (error) console.error('findUser error:', error);
  return data || null;
}

/** Check if an email is already registered. */
export async function emailExists(email) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return !!data;
}

/** Create a new user account. Returns { id, email, pin }. */
export async function createUser(email, pin) {
  const { data, error } = await supabase
    .from('users')
    .insert({ email, pin })
    .select('id, email, pin')
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────

/** Load settings for a user. Returns defaults if none found. */
export async function getSettings(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('getSettings error:', error);
  return dbToSettings(data);
}

/** Save (upsert) settings for a user. */
export async function saveSettings(userId, settings) {
  const { error } = await supabase
    .from('user_settings')
    .upsert(settingsToDb(settings, userId), { onConflict: 'user_id' });
  if (error) console.error('saveSettings error:', error);
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────

/** Load all products for a user, ordered by created_at. */
export async function getProducts(userId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) console.error('getProducts error:', error);
  return (data || []).map(dbToProduct);
}

/** Insert or update a batch of products. */
export async function upsertProducts(products, userId) {
  if (!products.length) return;
  const { error } = await supabase
    .from('products')
    .upsert(products.map(p => productToDb(p, userId)), { onConflict: 'id' });
  if (error) console.error('upsertProducts error:', error);
}

/** Delete a product by ID. */
export async function deleteProduct(productId) {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) console.error('deleteProduct error:', error);
}

/** Full sync: upsert current list + delete removed items. */
export async function syncProducts(currentProducts, prevProducts, userId) {
  // Find deleted product IDs
  const deletedIds = prevProducts
    .filter(p => !currentProducts.find(c => c.id === p.id))
    .map(p => p.id);

  // Find added or changed products
  const changed = currentProducts.filter(p => {
    const old = prevProducts.find(o => o.id === p.id);
    return !old || JSON.stringify(old) !== JSON.stringify(p);
  });

  if (deletedIds.length > 0) {
    const { error } = await supabase.from('products').delete().in('id', deletedIds);
    if (error) console.error('deleteProducts error:', error);
  }
  if (changed.length > 0) {
    await upsertProducts(changed, userId);
  }
}

// ─────────────────────────────────────────────────────────────
// SALES LOGS
// ─────────────────────────────────────────────────────────────

/** Load all sales logs for a user, newest first. */
export async function getSalesLogs(userId) {
  const { data, error } = await supabase
    .from('sales_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error) console.error('getSalesLogs error:', error);
  return (data || []).map(dbToLog);
}

/** Insert new sale log entries. */
export async function insertSalesLogs(logs, userId) {
  if (!logs.length) return;
  const { error } = await supabase
    .from('sales_logs')
    .insert(logs.map(l => logToDb(l, userId)));
  if (error) console.error('insertSalesLogs error:', error);
}

/** Delete all sales logs for a user (used in Settings wipe). */
export async function deleteSalesLogs(userId) {
  const { error } = await supabase.from('sales_logs').delete().eq('user_id', userId);
  if (error) console.error('deleteSalesLogs error:', error);
}

/** Delete all products for a user (used in Settings wipe). */
export async function deleteAllProducts(userId) {
  const { error } = await supabase.from('products').delete().eq('user_id', userId);
  if (error) console.error('deleteAllProducts error:', error);
}
