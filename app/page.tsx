'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const RootPage = () => {
  const { isSignedIn } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/home");
    }
  }, [isSignedIn, router]);

  return null;
};

export default RootPage; 
