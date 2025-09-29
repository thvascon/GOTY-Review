// Arquivo: src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js'
import { Database } from './types' // 1. Importa os tipos que acabamos de gerar

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// 2. A parte <Database> é a que deixa o cliente "inteligente"
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)