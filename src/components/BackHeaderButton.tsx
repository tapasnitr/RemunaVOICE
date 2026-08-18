"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackPageName({
    title,
    link,
    backPageName = "Back",
}: {
    title: string;
    link: string;
    backPageName?: string;
}) {
    const router = useRouter();

    return (
        <div className="relative flex items-center h-10">
            {/* LEFT: Back to Dashboard */}
            <button
                onClick={() => router.push(link)}
                className="flex items-center gap-1 text-sm text-yellow-800 font-medium"
            >
                <ArrowLeft size={18} />
                {backPageName
                }
            </button>

            {/* CENTER: Title */}
            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-yellow-800">
                {title}
            </h2>

            {/* RIGHT: Spacer (keeps title centered) */}
            <div className="ml-auto w-[140px]" />
        </div>
    );
}
