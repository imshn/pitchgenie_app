import { Skeleton } from "@/components/ui/skeleton";

export function ScraperSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pb-12">
            {/* Metadata Skeleton */}
            <div className="md:col-span-3 border rounded-xl p-6 space-y-4">
                <div className="flex gap-6">
                    <Skeleton className="w-64 h-40 rounded-lg" />
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>

            {/* Contacts Skeleton */}
            <div className="md:col-span-1 border rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>

            {/* Tech Skeleton */}
            <div className="md:col-span-1 space-y-6">
                <div className="border rounded-xl p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <div className="flex gap-2 flex-wrap">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                </div>
                <div className="border rounded-xl p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            </div>

            {/* Summary Skeleton */}
            <div className="md:col-span-1 border rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );
}
