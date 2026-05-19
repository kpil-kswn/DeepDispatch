'use client' 

import { useState, Suspense } from "react"; // Added Suspense import here
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { useSession, signOut } from "next-auth/react";
// IMPORTANT: Adjust this import path if your SubscriptionModel is in a different folder!
import SubscriptionModel from "./SubscriptionModel"; 

export default function Navbar() {
    const { data: session } = useSession();
    const router = useRouter();
    
    // State to control the Razorpay Pro Modal
    const [isProModalOpen, setIsProModalOpen] = useState(false);

    // This triggers your existing Login Modal
    const openModal = () => {
        window.dispatchEvent(new Event('openLoginModal'));
    };

    // NEW: The smart interceptor for the AI Optimizer
    const handleOptimizerClick = () => {
        // 1. If not logged in -> Trigger your Login Modal
        if (!session) {
            openModal();
            return;
        }

        // 2. If logged in but NOT Pro -> Trigger the Subscription Modal
        if (!session.user.isPro) {
            setIsProModalOpen(true);
            return;
        }

        // 3. If logged in AND Pro -> Send them to the Optimizer!
        router.push("/optimize");
    };

    return (
        <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                
                {/* 1. BRANDING */}
                <Link href="/" className="flex items-center gap-3 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    <Logo />
                    DeepDispatch
                </Link>

                {/* 2. NAVIGATION LINKS */}
                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300 items-center">
                    <Link href="/predict/solar" className="hover:text-white transition-colors">Solar Forecast</Link>
                    <Link href="/predict/wind" className="hover:text-white transition-colors">Wind Forecast</Link>
                    
                    {/* CHANGED: Replaced the Link with our smart button */}
                    <button 
                        onClick={handleOptimizerClick} 
                        className="hover:text-emerald-400 transition-colors font-medium"
                    >
                        AI Optimizer
                    </button>
                </div>

                {/* 3. AUTHENTICATION UI */}
                <div className="flex gap-4 items-center text-sm font-medium">
                    {session ? (
                        // IF LOGGED IN: Show Profile Link, Avatar, and Logout
                        <div className="flex items-center gap-6">
                            <Link href="/profile" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                                Profile Dashboard
                            </Link>
                            <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
                                <img 
                                    src={session.user?.image || "/default-avatar.png"} 
                                    alt="Profile" 
                                    className="w-9 h-9 rounded-full border-2 border-emerald-500/50"
                                    referrerPolicy="no-referrer" 
                                />
                                <button 
                                    onClick={() => signOut()} 
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Log out
                                </button>
                            </div>
                        </div>
                    ) : (
                        // IF LOGGED OUT: Trigger the Login Modal
                        <>
                            <button 
                                onClick={openModal} 
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Log in
                            </button>
                            <button 
                                onClick={openModal} 
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-md shadow-blue-500/20"
                            >
                                Sign up
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* SLEDGEHAMMER 3: Shield the Subscription Model directly inside the Navbar */}
            <Suspense fallback={null}>
                <SubscriptionModel 
                    isOpen={isProModalOpen} 
                    onClose={() => setIsProModalOpen(false)} 
                />
            </Suspense>
        </nav>
    );
}