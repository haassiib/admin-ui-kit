import { redirect } from 'next/navigation';

/**
 * The component listing moved to `/` when the Overview page was removed. This
 * keeps the old address working rather than 404ing a link somebody saved.
 */
export default function Page() {
  redirect('/');
}
