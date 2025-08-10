import React from "react";
import { Cover } from "./ui/cover";

export default function CoverDemo() {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-semibold max-w-4xl mx-auto text-center relative z-20 py-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 dark:from-neutral-800 dark:via-white dark:to-white">
        Compare files with <Cover>precision</Cover>
      </h1>
    </div>
  );
}
