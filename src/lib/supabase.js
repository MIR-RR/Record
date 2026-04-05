import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseInitError =
  !supabaseUrl || !supabaseAnonKey
    ? "Supabase 配置缺失。请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，并参考 .env.example。"
    : "";

export const supabase =
  supabaseInitError === "" ? createClient(supabaseUrl, supabaseAnonKey) : null;
