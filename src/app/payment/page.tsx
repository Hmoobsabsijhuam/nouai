
'use client';

import { Suspense } from 'react';
import { PaymentFlow } from './payment-flow';

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading payment details...</div>}>
      <PaymentFlow />
    </Suspense>
  );
}
