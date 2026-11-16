import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import EventCard from '../components/EventCard';
import { Search, Filter, Calendar, MapPin, X, RotateCcw } from 'lucide-react';

const EventList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [locationSearch, setLocationSearch] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState('date-asc');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events');
        setEvents(res.data || []);
      } catch (err) {
        console.error('Error fetching event list data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Sync from URL search params
  useEffect(() => {
    const querySearch = searchParams.get('search');
    const queryCategory = searchParams.get('category');
    const queryLocation = searchParams.get('location');
    if (querySearch !== null) setSearchTerm(querySearch);
    if (queryCategory !== null) setSelectedCategory(queryCategory);
    if (queryLocation !== null) setLocationSearch(queryLocation);
  }, [searchParams]);

  // Filter and sort events
  const filteredEvents = events.filter((evt) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.description && evt.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const eventCategory =
      typeof evt.category === 'object' && evt.category !== null
        ? evt.category.name
        : evt.category;
    const matchesCategory =
      selectedCategory === 'all' || eventCategory === selectedCategory;

    // Location/Venue filter (case-insensitive substring search)
    const eventLocation =
      typeof evt.venue === 'object' && evt.venue !== null
        ? `${evt.venue.name || ''} ${evt.venue.city || ''}`.trim()
        : (evt.venue || '');
    const matchesLocation =
      !locationSearch.trim() ||
      eventLocation.toLowerCase().includes(locationSearch.trim().toLowerCase());

    return matchesSearch && matchesCategory && matchesLocation;
  }).sort((a, b) => {
    if (sortBy === 'date-asc') {
      return new Date(a.startDateTime) - new Date(b.startDateTime);
    }
    if (sortBy === 'date-desc') {
      return new Date(b.startDateTime) - new Date(a.startDateTime);
    }
    if (sortBy === 'price-asc') {
      return a.ticketPrice - b.ticketPrice;
    }
    if (sortBy === 'price-desc') {
      return b.ticketPrice - a.ticketPrice;
    }
    return 0;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setLocationSearch('');
    setSortBy('date-asc');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore All Events
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Browse upcoming conferences, workshops, technical summits, and cultural shows.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Search & Filter Controls in a Flex Container */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          {/* Main Keyword Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search location..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            {locationSearch && (
              <button
                type="button"
                onClick={() => setLocationSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Hardcoded Category Dropdown */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Departmental activity">Departmental activity</option>
              <option value="Cultural activity">Cultural activity</option>
              <option value="Outside college activity">Outside college activity</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Sorting & Filter Reset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="date-asc">Date: Upcoming First</option>
              <option value="date-desc">Date: Latest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">
              Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
            {(searchTerm || selectedCategory !== 'all' || locationSearch.trim() || sortBy !== 'date-asc') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-4">
              <div className="h-48 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <EventCard key={evt._id} event={evt} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No events found matching your criteria</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, switching categories, or resetting the location filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EventList;
