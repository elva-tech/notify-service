import { redirect } from 'next/navigation';

/** Legacy route — DLT suite is now business-agnostic at /playground?view=dlt-suite */
export default function LegacyEnandiPlaygroundPage() {
  redirect('/playground?view=dlt-suite&business=enandi');
}
