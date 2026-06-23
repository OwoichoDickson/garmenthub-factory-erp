import { supabase } from '../lib/supabase'

/**
 * Thin uniform CRUD wrapper over Supabase tables. Every page talks to the
 * backend through `table(name)` so swapping the data source later is a
 * one-file change. Mirrors the shape of the Base44 entities API.
 */
export function table(name) {
  return {
    async list({ order = 'created_at', ascending = false, limit } = {}) {
      let q = supabase.from(name).select('*').order(order, { ascending })
      if (limit) q = q.limit(limit)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },

    async filter(match = {}, { order = 'created_at', ascending = false } = {}) {
      const { data, error } = await supabase
        .from(name)
        .select('*')
        .match(match)
        .order(order, { ascending })
      if (error) throw error
      return data || []
    },

    async create(values) {
      const { data, error } = await supabase.from(name).insert(values).select().single()
      if (error) throw error
      return data
    },

    /** Fetch only specific columns (used to load existing keys for dedup). */
    async select(columns) {
      const { data, error } = await supabase.from(name).select(columns.join(','))
      if (error) throw error
      return data || []
    },

    /** Insert an array of rows in one request. Caller batches (e.g. 100/req). */
    async bulkCreate(rows) {
      const { data, error } = await supabase.from(name).insert(rows).select()
      if (error) throw error
      return data || []
    },

    async update(id, values) {
      const { data, error } = await supabase
        .from(name)
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async remove(id) {
      const { error } = await supabase.from(name).delete().eq('id', id)
      if (error) throw error
      return true
    },
  }
}
