"use client"

import { useState, useEffect } from "react";
import { useAuth, getCurrentRole } from "@/lib/auth";
import AdminMenu from "./menus/AdminMenu";
import InstructorMenu from "./menus/InstructorMenu";
import TraineeMenu from "./menus/TraineeMenu";

const Menu = () => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'admin' | 'instructor' | 'trainee'>('trainee');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    } else if (!loading && mounted) {
      // Only access localStorage after mount (client-side only)
      const tokenRole = getCurrentRole();
      setRole(tokenRole as 'admin' | 'instructor' | 'trainee');
    }
  }, [user, loading, mounted]);

  // During SSR or initial render, show trainee menu (matches server)
  // After mount, role will be updated via useEffect
  if (!mounted) {
    return <TraineeMenu />;
  }

  // Render role-specific menu
  switch (role) {
    case 'admin':
      return <AdminMenu />;
    case 'instructor':
      return <InstructorMenu />;
    case 'trainee':
      return <TraineeMenu />;
    default:
      return <TraineeMenu />;
  }
}

export default Menu