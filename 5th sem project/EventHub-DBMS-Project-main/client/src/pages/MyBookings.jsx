import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import {
  Ticket,
  Calendar,
  CreditCard,
  XCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

/**
 * Live Countdown Badge Component
 * Displays "Expires in MM:SS" and triggers onExpire when countdown reaches 00:00.
 */
const BookingCountdown = ({ expiresAt, onExpire }) => {
  const getSecondsRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsRemaining);
  const onExpireCalledRef = useRef(false);

  useEffect(() => {
    // Reset trigger guard if expiresAt changes
    onExpireCalledRef.current = false;
    const current = getSecondsRemaining();
    setSecondsRemaining(current);

    if (current <= 0) {
      if (!onExpireCalledRef.current) {
        onExpireCalledRef.current = true;
        onExpire?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = getSecondsRemaining();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!onExpireCalledRef.current) {
          onExpireCalledRef.current = true;
          onExpire?.();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, getSecondsRemaining, onExpire]);

  const mm = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const ss = String(secondsRemaining % 60).padStart(2, '0');
  const isUrgent = secondsRemaining < 60;

  if (secondsRemaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-xl animate-pulse">
        <Clock className="w-3.5 h-3.5 text-rose-600" />
        <span>Expires in 00:00</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
        isUrgent
          ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
          : 'bg-amber-50 border-amber-300 text-amber-800'
      }`}
      title="Complete payment before timer expires to keep reserved seats"
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`} />
      <span>Expires in {mm}:{ss}</span>
    </span>
  );
};

const isBookingCancelled = (b) =>
  b.bookingStatus === 'cancelled' ||
  b.status === 'cancelled' ||
  b.paymentStatus === 'expired';

const isBookingPaid = (b) =>
  b.paymentStatus === 'paid' ||
  b.paymentStatus === 'completed';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  // Payment modal state
  const [payingBooking, setPayingBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');

  // Cancel action state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await API.get('/bookings/mine');
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your bookings.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookingExpired = (bookingId) => {
    if (payingBooking && payingBooking._id === bookingId) {
      setPaymentMsg('Reservation window expired. The seats have been released.');
      setTimeout(() => {
        setPayingBooking(null);
        setPaymentMsg('');
      }, 1500);
    }
    // Refresh bookings list so backend releases expired seats & updates status
    fetchBookings(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Reserved seats will be released.')) {
      return;
    }

    setActionLoadingId(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/cancel`);
      // Update local item
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, bookingStatus: 'cancelled', status: 'cancelled' } : b))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payingBooking) return;

    setPaymentLoading(true);
    setPaymentMsg('');

    try {
      await API.post('/payments', {
        bookingId: payingBooking._id,
        method: paymentMethod,
        transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      });

      // Update local booking status
      setBookings((prev) =>
        prev.map((b) =>
          b._id === payingBooking._id
            ? { ...b, paymentStatus: 'paid', expiresAt: null }
            : b
        )
      );

      setPaymentMsg('Payment successful! E-Ticket confirmed.');
      setTimeout(() => {
        setPayingBooking(null);
        setPaymentMsg('');
      }, 1200);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Payment processing failed.';
      setPaymentMsg(errMsg);
      if (errMsg.toLowerCase().includes('expired') || errMsg.toLowerCase().includes('cancelled')) {
        fetchBookings(true);
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const cancelled = isBookingCancelled(b);
    if (filter === 'confirmed') return !cancelled && (b.bookingStatus === 'confirmed' || b.status === 'confirmed');
    if (filter === 'cancelled') return cancelled;
    return true;
  });

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Event Bookings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your reserved seats, make payments, and view ticket passes.
          </p>
        </div>

        <button
          onClick={() => fetchBookings(false)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {['all', 'confirmed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} Bookings
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-sm text-red-600">
          {error}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const eventData = b.event || {};
            const isCancelled = isBookingCancelled(b);
            const isPaid = isBookingPaid(b);
            const isPendingPayment = !isPaid && !isCancelled && (b.paymentStatus === 'pending' || !b.paymentStatus);

            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-slate-300"
              >
                {/* Left: Event & booking details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isCancelled ? 'CANCELLED' : b.bookingStatus || b.status || 'CONFIRMED'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isPaid
                          ? 'bg-blue-100 text-blue-700'
                          : b.paymentStatus === 'expired'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Payment: {b.paymentStatus || 'pending'}
                    </span>

                    <span className="text-xs text-slate-400">
                      Ref: <code className="font-mono">{b._id ? b._id.slice(-6).toUpperCase() : ''}</code>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {eventData.title || 'Event Information Unavailable'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{formatDate(eventData.startDateTime || b.bookingDate)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-brand-500" />
                      <span>
                        <strong>{b.numberOfTickets}</strong> {b.numberOfTickets === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Booked on {formatDate(b.bookingDate)}</span>
                    </div>
                  </div>

                  {isPendingPayment && b.expiresAt && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-lg w-fit border border-amber-200/60">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Seats temporarily reserved. Complete payment before the countdown ends.</span>
                    </div>
                  )}
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Cost</span>
                    <p className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                      ₹{b.totalAmount}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Countdown Timer Badge */}
                    {isPendingPayment && b.expiresAt && (
                      <BookingCountdown
                        expiresAt={b.expiresAt}
                        onExpire={() => handleBookingExpired(b._id)}
                      />
                    )}

                    {/* Pay Button if pending payment */}
                    {isPendingPayment && (
                      <button
                        onClick={() => setPayingBooking(b)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay ₹{b.totalAmount}
                      </button>
                    )}

                    {/* Cancel Booking button */}
                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        disabled={actionLoadingId === b._id}
                        className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === b._id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-4">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No bookings found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            You haven't reserved any event tickets yet. Explore upcoming events and grab your pass!
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors shadow"
          >
            Browse Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Payment Simulation Modal */}
      {payingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Checkout & Payment</h3>
                <p className="text-xs text-slate-500">Ref: {payingBooking._id.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setPayingBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {paymentMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  paymentMsg.includes('successful')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {paymentMsg}
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Event</span>
                <span className="font-semibold text-slate-800 text-right">
                  {payingBooking.event?.title || 'Event Pass'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reserved Tickets</span>
                <span className="font-semibold text-slate-800">{payingBooking.numberOfTickets}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Amount Due</span>
                <span className="text-brand-600">₹{payingBooking.totalAmount}</span>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {['upi', 'credit_card', 'net_banking'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-xl border text-center uppercase tracking-wider text-[11px] transition-all ${
                        paymentMethod === m
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {paymentLoading ? 'Processing Payment...' : `Confirm & Pay ₹${payingBooking.totalAmount}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
