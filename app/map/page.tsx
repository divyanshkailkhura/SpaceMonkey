"use client";
import dynamic from 'next/dynamic';
import { usePageTitle } from '@/lib/page-title';

const Stellarium = dynamic(() => import('@/components/stellarium'), {
  ssr: false,
});

const StellariumPage: React.FC = () => {
  usePageTitle("Star Map - SpaceMonkey");

  return (
    <div>
      <Stellarium />
    </div>
  );
};

export default StellariumPage;