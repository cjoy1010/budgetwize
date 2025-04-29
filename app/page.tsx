'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import HomeHeader from "@/components/home-header";
import { Hero } from "@/components/hero";

const HomePage = () => {
  const { isSignedIn } = useClerk(); // Check if the user is signed in
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      // If the user is signed in, redirect to the dashboard
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  return (
    <div>
      <HomeHeader />
      <Hero />
    </div>
  );
};

export default HomePage; 
