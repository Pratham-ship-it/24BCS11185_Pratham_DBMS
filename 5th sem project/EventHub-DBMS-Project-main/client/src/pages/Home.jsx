import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import EventCard from '../components/EventCard';
import { Search, Sparkles, Calendar, ShieldCheck, Zap, Ticket, ArrowRight } from 'lucide-react';

const popularCategories = [
  'Departmental activity',
  'Cultural activity',
  'Outside college activity',
  'Sports',
  'Other'
];

const Home = () => {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/events');
        setEvents(res.data || []);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/events');
    }
  };

  const featuredEvents = events.slice(0, 6);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-slate-900 to-slate-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-brand-300 text-xs sm:text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Discover Conferences, Workshops, Hackathons & Concerts</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Seamless Event Booking, <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">
              Engineered with Precision
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            Reserve seats in real-time with ACID-compliant concurrency, explore curated venues across tech and cultural festivals, and manage your tickets in one place.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-2 mt-8"
          >
            <div className="flex items-center gap-3 px-3 py-2 w-full flex-1">
              <Search className="w-5 h-5 text-slate-300 shrink-0" />
              <input
                type="text"
                placeholder="Search events by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/30 shrink-0"
            >
              Explore Now
            </button>
          </form>

          {/* Category Chips */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Popular categories:</span>
            {popularCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate(`/events?category=${encodeURIComponent(cat)}`)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Guaranteed Seat Locking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                MongoDB multi-document transactions ensure zero double-booking even under heavy concurrent traffic.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Instant Digital Pass</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive confirmed bookings instantly with unique booking references and dynamic payment receipts.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Curated Premier Venues</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse detailed auditorium capacities, audio-visual amenities, and mapped geographic locations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Ticket className="w-4 h-4" />
              <span>Trending Lineup</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Events Near You
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 hover:gap-2 transition-all"
          >
            <span>Browse All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-4">
                <div className="h-44 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((evt) => (
              <EventCard key={evt._id} event={evt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No events listed yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Your database doesn't have events or the seed data hasn't been loaded.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-brand-700"
            >
              Add First Event in Dashboard
            </Link>
          </div>
        )}
      </section>

      {/* Organizer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              For Organizers & Campus Leads
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Host Your Next Technical or Cultural Event With Us
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Create events, assign venues, track seat availability, and manage participant registrations seamlessly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/dashboard"
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm text-center shadow-lg transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm text-center border border-white/20 transition-all"
            >
              Register as Organizer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
