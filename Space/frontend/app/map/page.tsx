"use client";
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Stellarium = dynamic(() => import('@/components/Stellarium'), {
  ssr: false,
});

const StellariumPage: React.FC = () => {
  return (
    <div>
      <Head>
        <title>Stellarium - Astronomy Enthusiast</title>
        <meta name="description" content="Interactive Stellarium Web Engine" />
      </Head>
      <Stellarium />
    </div>
  );
};

export default StellariumPage;