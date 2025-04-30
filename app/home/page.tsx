'use client';

import { useClerk } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";

const HomePage = () => {
  const { isSignedIn } = useClerk();

  return (
    <div>
      <Header />
      <main className="px-3 lg:px-14">
        <Hero />
      </main>
    </div>
  );
};

export default HomePage; 