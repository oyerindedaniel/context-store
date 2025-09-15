"use client";

// import dynamic from "next/dynamic";
import Demo from "@/components/app/demo";

// const Demo = dynamic(() => import("@/components/app/Demo"), { ssr: false });

export default function Home() {
  return (
    <div className="font-mono min-h-screen p-8 sm:p-20">
      <div className="mx-auto max-w-3xl">
        <Demo />
      </div>
    </div>
  );
}
