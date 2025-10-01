'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BranchDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/branch');
  }, [router]);

  return null;
}
