import { Wand2 } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const [prompt, setPrompt] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            navigate("/builder", { state: { prompt } });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
            <div className="container mx-auto px-4 py-8 sm:py-16">
                <div className="max-w-3xl mx-auto text-center px-4">
                    <div className="flex justify-center mb-6">
                        <Wand2 className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Create Your Dream Website
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12">
                        Describe your website vision, and we'll help you bring
                        it to life.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your website (e.g., 'Create a modern portfolio website with a dark theme')"
                                className="w-full p-3 sm:p-4 h-24 sm:h-32 text-base sm:text-lg rounded-xl border-2 border-indigo-500/30 bg-gray-800/50 text-gray-100 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Generate Website
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
