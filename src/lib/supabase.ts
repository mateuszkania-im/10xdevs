import { createClient } from '@supabase/supabase-js';

// Aby to zadziałało, potrzebujesz pakietu @supabase/supabase-js
// npm install @supabase/supabase-js

// Pobierz zmienne środowiskowe
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const isGithubPages = import.meta.env.GITHUB_PAGES as boolean;
const basePath = import.meta.env.VITE_BASE_PATH as string || '';

// Sprawdź czy zmienne środowiskowe są dostępne
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Utwórz klienta Supabase z odpowiednimi opcjami
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // Dostosuj ścieżki callback w zależności od środowiska
      // Na GitHub Pages musimy uwzględnić bazową ścieżkę
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // W środowisku GitHub Pages dodajemy basePath do URL
      ...(isGithubPages && basePath 
        ? { 
            redirectTo: window?.location?.origin + basePath + '/auth/callback',
          } 
        : {})
    }
  }
); 