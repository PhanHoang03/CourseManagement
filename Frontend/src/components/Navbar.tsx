"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useAuth, getCurrentRole } from "@/lib/auth"
import { useRouter } from "next/navigation"
import NotificationBell from "./NotificationBell"

const Navbar = () => {
  const { user, logout } = useAuth();
  const [userRole, setUserRole] = useState<string>('Guest');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.role) {
      setUserRole(user.role);
    } else if (mounted) {
      // Only access localStorage after mount (client-side only)
      setUserRole(getCurrentRole());
    }
  }, [user, mounted]);

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
  const userPhoto = user?.photoUrl || "/avatar.png";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/sign-in");
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        {/* ICONS AND USER */}
        <div className="flex items-center gap-4 justify-end w-full">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="flex flex-col text-right hidden md:block">
                <span className="text-xs leading-3 font-medium">
                  {userName}
                </span>
                <span className="text-[10px] text-gray-500 capitalize">
                  {userRole}
                </span>
              </div>
              <Image 
                src={userPhoto} 
                alt="Profile" 
                width={36} 
                height={36} 
                className="rounded-full"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Image src="/profile.png" alt="Profile" width={16} height={16} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Image src="/setting.png" alt="Settings" width={16} height={16} />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Image src="/logout.png" alt="Logout" width={16} height={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

export default Navbar