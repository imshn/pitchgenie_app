/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    try {
      setLoading(true);

      const user = await createUserWithEmailAndPassword(auth, email, password);

      // Create user doc with default credits
      await setDoc(doc(db, "users", user.user.uid), {
        email,
        credits: 20, // default free credits
        plan: "free",
        createdAt: new Date().toISOString(),
      });

      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button className="w-full" onClick={signup} disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </Button>

          <p className="text-sm text-center mt-2">
            Already have an account?{" "}
            <a href="/login" className="underline">
              Login
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
