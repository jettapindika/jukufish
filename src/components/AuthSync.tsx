"use client";
import { useEffect } from "react";
import { syncGetAllUsers } from "@/lib/auth-sync";
import { useFishStore } from "@/lib/store";

export default function AuthSync() {
  useEffect(() => {
    async function syncUsers() {
      try {
        const remoteUsers = await syncGetAllUsers();
        if (remoteUsers.length > 0) {
          useFishStore.setState({ users: remoteUsers });
        }
      } catch {
        // offline, use local
      }
    }
    syncUsers();
  }, []);

  return null;
}