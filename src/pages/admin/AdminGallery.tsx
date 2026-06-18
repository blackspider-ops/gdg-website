import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Image as ImageIcon, Upload, Loader2, Trash2, Calendar } from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdmin } from '@/contexts/AdminContext';
import { MediaService, type MediaFile } from '@/services/mediaService';
import { EventsService, type Event } from '@/services/eventsService';

/**
 * Dedicated admin page for managing the public photo gallery. Lists events, each
 * with its published photos and an "Upload" button that uploads, marks public,
 * and assigns the photo to that event in one step. Photos appear on /gallery.
 */
const AdminGallery = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setIsLoading(true);
    const [eventList, media] = await Promise.all([
      EventsService.getEvents(),
      MediaService.getPublicMedia()
    ]);
    setEvents(eventList);
    setPhotos(media);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const photosByEvent = useMemo(() => {
    const map: Record<string, MediaFile[]> = {};
    for (const p of photos) {
      const key = p.event_id || '__none__';
      (map[key] ||= []).push(p);
    }
    return map;
  }, [photos]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const handleUpload = async (eventId: string, files: FileList | null) => {
    if (!files || files.length === 0 || !currentAdmin?.id) return;
    setUploadingFor(eventId);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const created = await MediaService.uploadFile(file, undefined, currentAdmin.id, { is_public: true });
        if (created) {
          await MediaService.updateFile(created.id, { is_public: true, event_id: eventId }, currentAdmin.id);
        }
      }
      await load();
    } catch (e) {
      console.error('Gallery upload failed:', e);
    } finally {
      setUploadingFor(null);
    }
  };

  const removeFromGallery = async (photo: MediaFile) => {
    if (!currentAdmin?.id) return;
    if (!confirm('Remove this photo from the public gallery? (The file stays in the Media library.)')) return;
    await MediaService.updateFile(photo.id, { is_public: false }, currentAdmin.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  const renderEventBlock = (eventId: string, title: string, date?: string) => {
    const eventPhotos = photosByEvent[eventId] || [];
    return (
      <div key={eventId} className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {date && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar size={12} />
                {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{eventPhotos.length} photo{eventPhotos.length !== 1 ? 's' : ''}</p>
          </div>
          {eventId !== '__none__' && (
            <>
              <input
                ref={el => (fileInputs.current[eventId] = el)}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(eventId, e.target.files)}
              />
              <button
                onClick={() => fileInputs.current[eventId]?.click()}
                disabled={uploadingFor === eventId}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploadingFor === eventId ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span>Upload</span>
              </button>
            </>
          )}
        </div>

        {eventPhotos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {eventPhotos.map(photo => (
              <div key={photo.id} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                <img
                  src={MediaService.getFileUrl(photo.file_path)}
                  alt={photo.alt_text || photo.original_name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFromGallery(photo)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove from gallery"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminPageWrapper pageName="Photo Gallery" pageTitle="Photo Gallery">
      <AdminLayout
        title="Photo Gallery"
        subtitle="Upload event photos shown on the public /gallery page"
        icon={ImageIcon}
      >
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Photos uploaded here are public and grouped by event on{' '}
              <a href="/gallery" target="_blank" rel="noreferrer" className="text-primary hover:underline">/gallery</a>.
            </p>
            {events.map(ev => renderEventBlock(ev.id, ev.title, ev.date))}
            {(photosByEvent['__none__']?.length || 0) > 0 &&
              renderEventBlock('__none__', 'Unassigned photos', undefined)}
          </div>
        )}
      </AdminLayout>
    </AdminPageWrapper>
  );
};

export default AdminGallery;
