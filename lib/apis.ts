/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts
import axios from "axios";
import { auth } from "./firebase";

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function post(path: string, body: any) {
  const headers = await getAuthHeader();
  return axios.post(path, body, { headers });
}

export async function get(path: string) {
  const headers = await getAuthHeader();
  return axios.get(path, { headers });
}