"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [sites, setSites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        if (data.success) {
          setSites(data.sites);
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfileData();
    }
  }, [status]);

  // --- THIS IS YOUR MATCHING LOGIC ---
  // It finds all history runs that share the exact coordinates and type of a given site
  const getMatchingHistory = (site) => {
    return history.filter((run) => {
      const isSameType = run.serviceType === site.siteType;
      const isSameLat = run.inputsUsed?.latitude === site.configuration?.location?.latitude;
      const isSameLon = run.inputsUsed?.longitude === site.configuration?.location?.longitude;
      
      return isSameType && isSameLat && isSameLon;
    });
  };

  // Find "Orphaned" runs (History runs that don't match ANY saved site coordinates)
  const orphanedHistory = history.filter((run) => {
    return !sites.some((site) => {
      return (
        run.serviceType === site.siteType &&
        run.inputsUsed?.latitude === site.configuration?.location?.latitude &&
        run.inputsUsed?.longitude === site.configuration?.location?.longitude
      );
    });
  });

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Profile...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Please log in to view your profile.</div>;
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8 font-sans text-gray-100">
      <div className="max-w-5xl mx-auto">
        
        {/* PROFILE HEADER */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Welcome, {session?.user?.name || "Operator"}
            </h1>
            <p className="text-gray-400">{session?.user?.email}</p>
          </div>
          <div>
            {session?.user?.isPro ? (
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                ⭐ Premium Mode
              </span>
            ) : (
              <span className="px-4 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-full font-bold">
                Free Mode
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-3">📁 Your Saved Sites & Associated Runs</h2>
          
          {sites.length === 0 && (
            <p className="text-gray-500 italic">You haven't saved any sites yet.</p>
          )}

          {/* MAP THROUGH ALL SITES */}
          {sites.map((site) => {
            const siteRuns = getMatchingHistory(site);

            return (
              <div key={site._id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                
                {/* SITE HEADER */}
                <div className="bg-gray-800/50 p-5 flex justify-between items-center border-b border-gray-700">
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                      📍 {site.siteName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Lat: {site.configuration?.location?.latitude} | Lon: {site.configuration?.location?.longitude}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider bg-gray-950 border border-gray-700 px-3 py-1 rounded-full text-emerald-400 font-bold">
                    {site.siteType.replace("_", " ")}
                  </span>
                </div>

                {/* NESTED HISTORY RUNS FOR THIS SITE */}
                <div className="p-5 bg-gray-950/30">
                  <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Associated Optimizations ({siteRuns.length})</h4>
                  
                  {siteRuns.length === 0 ? (
                    <p className="text-sm text-gray-600">No runs match these exact coordinates yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {siteRuns.map((run) => (
                        <div key={run._id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg hover:border-emerald-900/50 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-gray-300">
                              {new Date(run.runDate).toLocaleDateString()} at {new Date(run.runDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                              Profit: ${run.metrices?.total_profit_used?.toLocaleString() || 0}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Status: {run.metrices?.status || "Completed"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ORPHANED RUNS (History that doesn't match any saved site) */}
          {orphanedHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-400 border-b border-gray-800 pb-3 mb-6">👻 Unsaved Location Runs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {orphanedHistory.map((run) => (
                  <div key={run._id} className="bg-gray-900 border border-gray-800 border-dashed p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400 uppercase">{run.serviceType.replace("_", " ")}</span>
                      <span className="text-xs font-mono text-gray-300">
                        Profit: ${run.metrices?.total_profit_used?.toLocaleString() || 0}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">
                      Lat: {run.inputsUsed?.latitude} | Lon: {run.inputsUsed?.longitude}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(run.runDate).toLocaleDateString()} {new Date(run.runDate).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}