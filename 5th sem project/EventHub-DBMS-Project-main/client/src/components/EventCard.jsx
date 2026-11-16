import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, ArrowRight } from 'lucide-react';
import { getEventStatus } from '../utils/eventStatus';

const EventCard = ({ event }) => {
  const {
    _id,
    title,
    description,
    category,
    venue,
    startDateTime,
    ticketPrice,
    availableSeats,
    totalSeats,
    imageUrl,
    status
  } = event;

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const computedStatus = getEventStatus(event);
  const isEnded = computedStatus === 'Completed';
  const isCancelled = computedStatus === 'Cancelled';
  const isSoldOut = !isEnded && !isCancelled && availableSeats <= 0;
  const isFewSeats = !isEnded && !isCancelled && availableSeats > 0 && availableSeats <= 10;

  // Fallback banner placeholder if image is missing
  const defaultImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";

  // Dynamic banner image URL from database with static placeholder fallback
  const eventBanner =
    (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') ? imageUrl.trim() :
    (event.bannerUrl && typeof event.bannerUrl === 'string' && event.bannerUrl.trim() !== '') ? event.bannerUrl.trim() :
    (event.bannerImage && typeof event.bannerImage === 'string' && event.bannerImage.trim() !== '') ? event.bannerImage.trim() :
    (event.image && typeof event.image === 'string' && event.image.trim() !== '') ? event.image.trim() :
    (event.banner && typeof event.banner === 'string' && event.banner.trim() !== '') ? event.banner.trim() :
    defaultImage;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={eventBanner}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            if (e.currentTarget.src !== defaultImage) {
              e.currentTarget.src = defaultImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
            {typeof category === 'object' && category !== null ? category.name : (category || 'Event')}
          </span>
        </div>

        {/* Status Pill */}
        <div className="absolute top-3 right-3">
          {isEnded ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-600 text-white shadow-sm">
              Completed
            </span>
          ) : isCancelled ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-600 text-white shadow-sm">
              Cancelled
            </span>
          ) : isSoldOut ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-600 text-white shadow-sm">
              Sold Out
            </span>
          ) : isFewSeats ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500 text-white shadow-sm animate-pulse">
              Only {availableSeats} left!
            </span>
          ) : computedStatus === 'Ongoing' ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-600 text-white shadow-sm">
              Ongoing
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-600/90 text-white shadow-sm capitalize">
              Upcoming
            </span>
          )}
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-white/20">
          <span className="text-xs text-slate-500 block leading-none">Starting from</span>
          <span className="text-base font-extrabold text-brand-700">
            {ticketPrice === 0 ? 'Free' : `₹${ticketPrice}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
          {description || 'Join this exciting event with fellow participants and experts in the field.'}
        </p>

        {/* Metadata info */}
        <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="font-medium text-slate-700">{formatDate(startDateTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="truncate">
              {typeof venue === 'object' && venue !== null
                ? `${venue.name}, ${venue.city}`
                : (venue || 'Venue to be announced')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500 shrink-0" />
            <span>
              <strong className="text-slate-800 font-semibold">{availableSeats}</strong> of {totalSeats} seats available
            </span>
          </div>
        </div>

        {/* Card footer CTA */}
        <div className="mt-5 pt-3">
          <Link
            to={`/events/${_id}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all bg-slate-900 text-white hover:bg-brand-600 shadow-sm group-hover:shadow"
          >
            <span>{isEnded ? 'View Details' : 'View Details & Book'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
