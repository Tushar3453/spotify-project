import { cookies } from 'next/headers';
import HomeClient from './home-client';

// This is now a Dynamic Server Component
export default async function Page() {
  // Hum server par hi cookie check kar rahe hain
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get('is_logged_in')?.value === 'true';

  // Login status ko client component mein prop ki tarah bhej dein
  return <HomeClient isLoggedIn={isLoggedIn} />;
}