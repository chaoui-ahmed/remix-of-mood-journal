import { useEntries } from "@/hooks/useEntries";
import PhotoGallery from "@/components/ui/photo-gallery";
import { Navigation } from "@/components/layout/Navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function GalleryPage() {
    const { data: entries, isLoading } = useEntries();

    if (isLoading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;

    const pixels = entries?.filter(e => e.google_photos_ids && e.google_photos_ids.length > 0).map(e => ({
        id: e.id,
        date: format(new Date(e.date), "d MMMM yyyy", { locale: fr }),
        image: e.google_photos_ids[0],
        url: `/entry/${e.id}`
    })) || [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <div className="flex-1 flex items-center justify-center p-8">
                <PhotoGallery entries={pixels} />
            </div>
        </div>
    );
}