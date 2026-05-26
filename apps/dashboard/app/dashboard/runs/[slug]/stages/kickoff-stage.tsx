"use client";

import { motion } from "motion/react";

export function KickoffStage({
  url,
  siteName,
}: {
  url: string;
  siteName?: string;
}) {
  const host = safeHost(url);

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-3 text-center"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 22 }}
          className="rounded-full border bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          Initializing
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-xl font-semibold tracking-tight"
        >
          {siteName ?? host}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="font-mono text-xs text-muted-foreground"
        >
          {host}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-1 h-px w-32 origin-center bg-border"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-xs text-muted-foreground"
        >
          Preparing the design pipeline…
        </motion.p>
      </motion.div>
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
