"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      className="rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
      onClick={() => {
        signOut(auth);
        window.location.href = "/login";
      }}
    >
      Logout
    </Button>
  );
}
