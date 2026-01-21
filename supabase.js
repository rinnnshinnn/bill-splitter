import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://hfeplzzpsppihcbbcylg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZXBsenpwc3BwaWhjYmJjeWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTE1ODEsImV4cCI6MjA4NDU4NzU4MX0.iuRo3sUba3ly5so9C-ubgZtc6B4t_zE1B0IneW-miOo"
);
