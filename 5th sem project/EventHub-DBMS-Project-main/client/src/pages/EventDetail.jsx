import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getEventStatus, isEventEnded, isEventCancelled } from '../utils/eventStatus';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  CheckCircle,
  AlertCircle,
  Star,
  Send,
  ArrowLeft,
  Building,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review eligibility state
  const [eligibility, setEligibility] = useState({
    checked: false,
    canReview: false,
    hasPaidBooking: false,
    hasStarted: false,
    hasReviewed: false,
    reason: ''
  });

  // Booking form state
  const [ticketCount, setTicketCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const checkEligibility = useCallback(async () => {
    if (!isAuthenticated) {
      setEligibility({
        checked: true,
        canReview: false,
        hasPaidBooking: false,
        hasStarted: false,
        hasReviewed: false,
        reason: 'Sign in to review'
      });
      return;
    }

    try {
      const res = await API.get(`/reviews/eligibility/${id}`);
      setEligibility({
        checked: true,
        ...res.data
      });
    } catch {
      // Fallback client-side check
      try {
        const bookingsRes = await API.get('/bookings/mine');
        const userBookings = bookingsRes.data || [];
        const hasPaidBooking = userBookings.some((b) => {
          const bookingEventId = typeof b.event === 'object' && b.event ? b.event._id : b.event;
          const isConfirmed = b.bookingStatus === 'confirmed' || b.status === 'confirmed';
          const isPaid = b.paymentStatus === 'paid' || b.paymentStatus === 'completed';
          return bookingEventId === id && isConfirmed && isPaid;
        });

        const eventStart = event?.startDateTime || event?.startDate || event?.date;
        const hasStarted = eventStart ? new Date() >= new Date(eventStart) : true;
        const hasReviewed = reviews.some(
          (r) => (r.user?._id || r.user) === (user?.id || user?._id)
        );

        let canReview = false;
        let reason = '';
        if (hasReviewed) {
          reason = 'You have already reviewed this event';
        } else if (!hasPaidBooking) {
          reason = 'Only verified attendees with a paid booking can review this event.';
        } else if (!hasStarted) {
          reason = 'You can submit a review once the event has started.';
        } else {
          canReview = true;
        }

        setEligibility({
          checked: true,
          canReview,
          hasPaidBooking,
          hasStarted,
          hasReviewed,
          reason
        });
      } catch {
        setEligibility({ checked: true, canReview: false });
      }
    }
  }, [id, isAuthenticated, event, reviews, user]);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError('');
      try {
        const [eventRes, reviewsRes] = await Promise.allSettled([
          API.get(`/events/${id}`),
          API.get(`/reviews/event/${id}`)
        ]);

        if (eventRes.status === 'fulfilled') {
          setEvent(eventRes.value.data);
        } else {
          setError('Event not found or failed to load.');
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value.data);
        }
      } catch {
        setError('Error loading event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  useEffect(() => {
    if (event) {
      checkEligibility();
    }
  }, [event, checkEligibility]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (isEventEnded(event)) {
      setBookingError('Cannot book tickets for an event that has already ended.');
      return;
    }

    if (isEventCancelled(event)) {
      setBookingError('Cannot book tickets for a cancelled event.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(null);

    try {
      const res = await API.post('/bookings', {
        eventId: id,
        numberOfTickets: ticketCount
      });

      setBookingSuccess(res.data);
      // Update local available seats
      setEvent((prev) => ({
        ...prev,
        availableSeats: Math.max(0, prev.availableSeats - ticketCount)
      }));
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await API.post('/reviews', {
        eventId: id,
        rating: reviewRating,
        comment: reviewComment
      });

      // Add to reviews list with current user's name
      const newReview = {
        ...res.data,
        user: { name: user.name, _id: user.id },
        isVerifiedAttendee: true
      };
      setReviews([newReview, ...reviews]);
      setReviewComment('');
      setReviewSuccess('Your review has been submitted!');
      setEligibility((prev) => ({
        ...prev,
        canReview: false,
        hasReviewed: true,
        reason: 'You have already reviewed this event'
      }));
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to display this event.'}</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";
  const isSoldOut = event.availableSeats <= 0;
  const totalPrice = ticketCount * (event.ticketPrice || 0);

  const formatDateTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all events
        </Link>
      </div>

      {/* Main Grid: Details (Left 2 cols) & Booking Card (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Event details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Banner */}
          <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 shadow-lg bg-slate-950">
            <img
              src={event.bannerUrl || event.imageUrl || event.bannerImage || event.image || defaultImage}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = defaultImage;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            {/* Badges on image */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow">
                {typeof event.category === 'object' && event.category !== null ? event.category.name : (event.category || 'General Event')}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold shadow capitalize ${
                  isEventEnded(event)
                    ? 'bg-slate-600 text-white'
                    : isEventCancelled(event)
                    ? 'bg-rose-600 text-white'
                    : getEventStatus(event) === 'Ongoing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-brand-500 text-white'
                }`}
              >
                {getEventStatus(event)}
              </span>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Quick Info bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Date & Time</p>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(event.startDateTime)}</p>
                <p className="text-slate-500 mt-0.5 text-[11px]">to {formatDateTime(event.endDateTime)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Location</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {typeof event.venue === 'object' && event.venue !== null ? event.venue.name : (event.venue || 'Main Auditorium')}
                </p>
                {typeof event.venue === 'object' && event.venue !== null && event.venue.city && (
                  <p className="text-slate-500 mt-0.5">{event.venue.city}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Seat Capacity</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {event.availableSeats} / {event.totalSeats} seats open
                </p>
                <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{
                      width: `${Math.round(((event.totalSeats - event.availableSeats) / (event.totalSeats || 1)) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* About This Event */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About the Event</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {event.description || 'No detailed description provided for this event.'}
            </p>
          </div>

          {/* Venue & Organizer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Venue Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Building className="w-5 h-5 text-brand-600" />
                <h3>Venue Details</h3>
              </div>
              <div className="text-sm space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">
                  {typeof event.venue === 'object' && event.venue !== null ? event.venue.name : (event.venue || 'Designated Hall')}
                </p>
                {typeof event.venue === 'object' && event.venue !== null && (
                  <>
                    <p>{event.venue.address || 'Main Campus Ground'}</p>
                    <p>{event.venue.city}</p>
                  </>
                )}
                {event.venue?.capacity && (
                  <p className="text-xs text-slate-500 pt-1">
                    Maximum Hall Capacity: <strong>{event.venue.capacity} people</strong>
                  </p>
                )}
                {event.venue?.amenities && event.venue.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {event.venue.amenities.map((amenity, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3>Organizer</h3>
              </div>
              <div className="text-sm space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">{event.organizer?.name || 'Faculty / Club Coordinator'}</p>
                <p className="text-xs text-slate-500">{event.organizer?.email || 'events@college.edu'}</p>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/60">
                  <span className="font-medium text-slate-700">Official Campus Event</span>
                  <p className="text-slate-500 mt-0.5">Tickets verified by DBMS transaction ledger.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Participant Reviews</h3>
                <p className="text-xs text-slate-500">{reviews.length} total reviews submitted</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>
                  {reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Conditional Review Form or Informational Notice */}
            {!isAuthenticated ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="inline-flex p-2.5 rounded-xl bg-slate-100 text-slate-500">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Verified Attendee Reviews</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only verified participants with a completed booking can rate this event once it starts.
                </p>
                <div className="pt-1">
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/events/${id}` } }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    Sign in to Write a Review
                  </Link>
                </div>
              </div>
            ) : eligibility.hasReviewed ? (
              <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center space-y-1.5">
                <div className="inline-flex p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-emerald-950">Review Submitted</h4>
                <p className="text-xs text-emerald-800">
                  You have already reviewed this event as a verified attendee. Thank you for your feedback!
                </p>
              </div>
            ) : !eligibility.hasStarted ? (
              <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 text-center space-y-2">
                <div className="inline-flex p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Reviews Open When Event Starts</h4>
                <p className="text-xs text-amber-800 max-w-md mx-auto">
                  Only verified participants with a completed booking can rate this event once it starts. You can submit a review once the event has started on {formatDateTime(event.startDateTime)}.
                </p>
              </div>
            ) : !eligibility.hasPaidBooking ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="inline-flex p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Verified Attendees Only</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only verified participants with a completed booking can rate this event once it starts. Reserve and complete payment for your tickets to share your experience.
                </p>
              </div>
            ) : (
              /* Eligible: Show Write a Review Form */
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Write a Review</h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Verified Attendee
                  </span>
                </div>

                {reviewError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{reviewSuccess}</p>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Share your experience attending this event..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {reviewLoading ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4 pt-2">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">
                          {rev.user?.name || 'Anonymous Attendee'}
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Verified Attendee
                        </span>
                      </div>
                      <div className="flex items-center">
                        {[...Array(Math.max(0, Math.min(5, rev.rating || 0)))].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No reviews yet for this event.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Ticket Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`}
                </span>
                <span className="text-xs text-slate-500">/ person</span>
              </div>
            </div>

            {/* Booking State Notice */}
            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-800">Seats Reserved!</h4>
                <p className="text-xs text-emerald-700">
                  Reserved {bookingSuccess.numberOfTickets} seat(s) successfully.
                </p>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Seats reserved for 5 minutes. Complete payment in My Bookings.</span>
                </div>
                <div className="pt-2">
                  <Link
                    to="/my-bookings"
                    className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
                  >
                    View in My Bookings & Pay
                  </Link>
                </div>
              </div>
            ) : isEventEnded(event) ? (
              <div className="space-y-5">
                <div className="p-4 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs flex items-start gap-3">
                  <Clock className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Event Ended</h4>
                    <p className="text-slate-500 mt-1 leading-relaxed">
                      This event has already ended. Ticket bookings and registrations are closed.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 bg-slate-200 text-slate-500 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Event Ended</span>
                </button>
              </div>
            ) : isEventCancelled(event) ? (
              <div className="space-y-5">
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">Event Cancelled</h4>
                    <p className="text-rose-600 mt-1 leading-relaxed">
                      This event was cancelled by the organizer. Registrations are closed.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 bg-slate-200 text-slate-500 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Registration Closed</span>
                </button>
              </div>
            ) : isSoldOut ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-red-800">Event is Sold Out</h4>
                <p className="text-xs text-red-600">
                  All {event.totalSeats} seats have been reserved. Check back later in case of cancellations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-5">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Ticket Quantity Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Number of Tickets
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      disabled={ticketCount <= 1}
                      className="px-4 py-3 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-bold text-slate-900 text-sm">
                      {ticketCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.min(event.availableSeats, ticketCount + 1))}
                      disabled={ticketCount >= event.availableSeats}
                      className="px-4 py-3 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Max tickets available right now: {event.availableSeats}
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Ticket (x{ticketCount})</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Convenience Fee</span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Amount</span>
                    <span className="text-brand-600">₹{totalPrice}</span>
                  </div>
                </div>

                {/* CTA Submit Button */}
                <button
                  type="submit"
                  disabled={bookingLoading || isEventEnded(event) || isEventCancelled(event)}
                  className={`w-full py-3.5 px-4 font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isEventEnded(event) || isEventCancelled(event)
                      ? 'bg-slate-200 text-slate-500 shadow-none cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 disabled:opacity-50'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>
                    {bookingLoading
                      ? 'Reserving Seats...'
                      : isEventEnded(event)
                      ? 'Event Ended'
                      : isEventCancelled(event)
                      ? 'Registration Closed'
                      : 'Book Tickets Now'}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Instant seat lock via DBMS multi-doc transaction</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
