"use client";

/**
 * Client-only Sanity Studio. Loaded with ssr: false to avoid
 * createContext / React mismatch in the server bundle.
 *
 * Wrapped in StyleSheetManager to filter unknown props (items, disableTransition)
 * that Sanity Studio's styled-components pass to the DOM and trigger React warnings.
 */

import { NextStudio } from "next-sanity/studio";
import { StyleSheetManager } from "styled-components";
import config from "@/sanity.config";
import { isSanityConfigured } from "@/sanity/env";

const SANITY_STUDIO_FILTERED_PROPS = ["items", "disableTransition"];

function shouldForwardProp(prop: string): boolean {
  return !SANITY_STUDIO_FILTERED_PROPS.includes(prop);
}

export function StudioClient() {
  if (!isSanityConfigured()) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold">Sanity Studio not configured</h2>
        <p className="max-w-md text-muted-foreground">
          Set <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_SANITY_DATASET</code> in your
          production environment variables to use the Studio.
        </p>
      </div>
    );
  }

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <NextStudio config={config} />
    </StyleSheetManager>
  );
}
