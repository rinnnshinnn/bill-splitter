import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://mmgeueznceaxxteyjxmi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZ2V1ZXpuY2VheHh0ZXlqeG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDU4MzIsImV4cCI6MjA4NDU4MTgzMn0.9zEryCvz3vsBbkyeYiUHjjR6zUw4c4FS6pbIjuTx_e0"
);
