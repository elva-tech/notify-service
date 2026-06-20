import { redirect } from 'next/navigation';

/** Legacy route — DLT suite moved to ApnaKart template group */
export default function LegacyEnandiPlaygroundPage() {
  redirect('/playground?view=dlt-suite&business=apnakart');
}
