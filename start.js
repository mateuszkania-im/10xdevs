// @ts-check
import 'dotenv/config';
import { spawn } from 'node:child_process';

console.log('Zmienne środowiskowe z dotenv wczytane pomyślnie');
console.log(`PUBLIC_SUPABASE_URL: ${process.env.PUBLIC_SUPABASE_URL ? 'ustawione' : 'brak'}`);
console.log(`PUBLIC_SUPABASE_ANON_KEY: ${process.env.PUBLIC_SUPABASE_ANON_KEY ? 'ustawione' : 'brak'}`);

// Uruchom dev server
const astroProcess = spawn('astro', ['dev'], { stdio: 'inherit' });

astroProcess.on('close', (code) => {
  console.log(`Proces Astro zakończył działanie z kodem: ${code}`);
}); 