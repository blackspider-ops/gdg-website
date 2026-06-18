import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Calendar, X, Loader2 } from 'lucide-react';
import { MediaService, type MediaFile } from '@/services/mediaService';
import { EventsService, type Event } from '@/services/eventsService';

interface Album {
  key: string;
  title: string;
  date?: string;
  photos: MediaFile[];
}

const Gallery = () => {
  const [photos, setPhotos] = useState<MediaFile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);
  const [lightbox, setLightbox] = useState<MediaFile | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setHadError(false);
      try {
        const [media, eventList] = await Promise.all([
          MediaService.getPublicMedia(),
          EventsService.getEvents()
        ]);
        setPhotos(media);
        setEvents(eventList);
      } catch (error) {
        console.error('Error loading gallery:', error);
        setHadError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const albums = useMemo<Album[]>(() => {
    const eventMap = new Map(events.map(e => [e.id, e]));
    const byEvent = new Map<string, MediaFile[]>();
    const uncategorized: MediaFile[] = [];

    for (const photo of photos) {
      if (photo.event_id && eventMap.has(photo.event_id)) {
        const arr = byEvent.get(photo.event_id) || [];
        arr.push(photo);
        byEvent.set(photo.event_id, arr);
      } else {
        uncategorized.push(photo);
      }
    }

    const eventAlbums: Album[] = Array.from(byEvent.entries()).map(([eventId, eventPhotos]) => {
      const ev = eventMap.get(eventId)!;
      return {
        key: eventId,
        title: ev.title,
        date: ev.date,
        photos: eventPhotos
      };
    });

    // Newest events first
    eventAlbums.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (uncategorized.length > 0) {
      eventAlbums.push({ key: 'other', title: 'More Photos', photos: uncategorized });
    }
    return eventAlbums;
  }, [photos, events]);

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="text-display text-responsive-2xl font-semibold mb-4 flex items-center gap-3">
              <ImageIcon className="text-gdg-blue" /> Photo Gallery
            </h1>
            <p className="text-editorial text-responsive-base text-muted-foreground content-measure">
              Moments from our events, workshops, and community gatherings.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="editorial-grid">
          <div className="col-span-12">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : hadError ? (
              <div className="text-center py-20">
                <ImageIcon size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-muted-foreground">Couldn't load the gallery. Please try again later.</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="text-center py-20">
                <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No photos yet</h3>
                <p className="text-muted-foreground">Check back after our next event!</p>
              </div>
            ) : (
              <div className="space-y-16">
                {albums.map(album => (
                  <div key={album.key}>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <h2 className="text-display text-2xl font-semibold">{album.title}</h2>
                        {album.date && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar size={14} />
                            {new Date(album.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-sm text-muted-foreground">
                        {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {album.photos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setLightbox(photo)}
                          className="aspect-square overflow-hidden rounded-lg bg-muted group"
                        >
                          <img
                            src={MediaService.getFileUrl(photo.file_path)}
                            alt={photo.alt_text || photo.original_name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X size={28} />
          </button>
          <img
            src={MediaService.getFileUrl(lightbox.file_path)}
            alt={lightbox.alt_text || lightbox.original_name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Gallery;
