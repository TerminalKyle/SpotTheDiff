import React from "react";
import { FloatingDock } from "./ui/floating-dock";
import {
  IconUpload,
  IconGitCompare,
  IconEye,
  IconSettings,
  IconDownload,
  IconCopy,
  IconFileText,
} from "@tabler/icons-react";

export default function FloatingDockDemo() {
  const links = [
    {
      title: "Upload Files",
      icon: (
        <IconUpload className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#upload",
    },
    {
      title: "View Diff",
      icon: (
        <IconGitCompare className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#diff",
    },
    {
      title: "Visual Compare",
      icon: (
        <IconEye className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#visual",
    },
    {
      title: "Settings",
      icon: (
        <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#settings",
    },
    {
      title: "Copy Diff",
      icon: (
        <IconCopy className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#copy",
    },
    {
      title: "Download",
      icon: (
        <IconDownload className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#download",
    },
    {
      title: "File Info",
      icon: (
        <IconFileText className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#info",
    },
  ];
  
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <FloatingDock
        mobileClassName="translate-y-20"
        items={links}
      />
    </div>
  );
}
