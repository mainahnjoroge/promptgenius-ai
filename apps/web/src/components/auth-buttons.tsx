"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { authEnabled } from "@/lib/flags";
import { Button } from "./ui/button";

/** Renders auth controls. Falls back to plain links in mock mode (no Clerk). */
export function AuthButtons() {
  if (!authEnabled) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="sm">Get started</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">Get started</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Dashboard
          </Button>
        </Link>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
