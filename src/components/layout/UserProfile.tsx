"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";

export default function UserProfile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const displayName = user.firstName || user.username || user.primaryEmailAddress?.emailAddress || "User";
  const avatarUrl = user.imageUrl;
  const email = user.primaryEmailAddress?.emailAddress;

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 rounded-lg p-3 hover:bg-white/10 transition-colors"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden border-2 border-white/20">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="text-left">
          <div className="text-base font-medium text-white">{displayName}</div>
          {email && (
            <div className="text-sm text-white/70">{email}</div>
          )}
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-5 h-5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-20">
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{displayName}</div>
                  {email && (
                    <div className="text-xs text-white/70">{email}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 text-sm text-white/90 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>

              <Link
                href="/account"
                className="flex items-center gap-3 px-3 py-2 text-sm text-white/90 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Account Details
              </Link>
            </div>

            <div className="border-t border-slate-700 py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/90 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}