import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export const PseudoPlay = () => {
  const { user, isGuest } = useAuth();
  const [showLines, setShowLines] = useState({
    command: false,
    init: false,
    assets: false,
    server: false,
    ready: false,
    prompt: false,
  });

  // Extract email from user object or use guest identifier
  const userEmail =
    user?.email || (isGuest ? "guest@hangar.local" : "user@hangar.local");
  const username = userEmail.split("@")[0];

  useEffect(() => {
    const delays = {
      command: 500,
      init: 1000,
      assets: 2000,
      server: 3000,
      ready: 4000,
      prompt: 4500,
    };

    Object.entries(delays).forEach(([key, delay]) => {
      setTimeout(() => {
        setShowLines((prev) => ({ ...prev, [key]: true }));
      }, delay);
    });
  }, []);
  return (
    <div className="w-full bg-black border border-gray-600 rounded-lg p-4 font-mono text-green-400 shadow-lg">
      <div className="flex items-center mb-2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="ml-4 text-gray-400 text-sm">
          Terminal - PseudoPlay
        </span>
      </div>
      <div className="text-sm">
        {showLines.command && (
          <div className="mb-2">
            <span className="text-blue-400">{username}@hangar:~$</span>
            <span className="ml-2">./pseudo-play --init</span>
          </div>
        )}
        {showLines.init && (
          <div className="mb-2 text-gray-300">
            Initializing pseudo-play environment...
          </div>
        )}
        {showLines.assets && (
          <div className="mb-2 text-gray-300">Loading game assets... ✓</div>
        )}
        {showLines.server && (
          <div className="mb-2 text-gray-300">
            Connecting to matchmaking server... ✓
          </div>
        )}
        {showLines.ready && (
          <div className="mb-2 text-green-300">Ready to simulate gameplay</div>
        )}
        {showLines.prompt && (
          <div className="flex items-center">
            <span className="text-blue-400">{username}@hangar:~$</span>
            <span className="ml-2 animate-pulse">_</span>
          </div>
        )}
      </div>
    </div>
  );
};
