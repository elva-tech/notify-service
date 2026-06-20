import { redirect } from 'next/navigation';

/** Legacy route — redirects to ApnaKart DLT suite */
export default function LegacyApnakartPlaygroundPage() {
  redirect('/playground?view=dlt-suite&business=apnakart');
}
