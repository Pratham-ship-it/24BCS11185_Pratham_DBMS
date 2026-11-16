import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getEventStatus } from '../utils/eventStatus';
import {
  Calendar,
  PlusCircle,
  Users,
  Building,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  Tag,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const initialFormData = {
    title: '',
    description: '',
    category: '',
    venue: '',
    startDateTime: '',
    endDateTime: '',
    ticketPrice: '',
    totalSeats: '',
    imageUrl: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, venuesRes, categoriesRes] = await Promise.allSettled([
        API.get('/events'),
        API.get('/venues'),
        API.get('/categories')
      ]);

      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (venuesRes.status === 'fulfilled') setVenues(venuesRes.value.data);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'ticketPrice' || name === 'totalSeats') {
      if (value === '') {
        setFormData((prev) => ({ ...prev, [name]: '' }));
      } else {
        const parsed = Number(value);
        setFormData((prev) => ({
          ...prev,
          [name]: isNaN(parsed) ? '' : parsed
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setFormError('');
    setFormSuccess('');
    setFormData(initialFormData);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        ...formData,
        ticketPrice: formData.ticketPrice === '' ? 0 : Number(formData.ticketPrice),
        totalSeats: formData.totalSeats === '' ? 0 : Number(formData.totalSeats)
      };
      const res = await API.post('/events', payload);
      setFormSuccess('Event created successfully!');
      setEvents([res.data, ...events]);
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  // Filter events created by the logged-in organizer (or all if admin)
  const myEvents = events.filter((e) => {
    if (user?.role === 'admin') return true;
    const orgId = typeof e.organizer === 'object' && e.organizer !== null ? e.organizer._id : e.organizer;
    return orgId === user?.id || orgId === user?._id;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Organizer Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create events, manage hall bookings, and monitor attendee participation.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormData);
            setFormError('');
            setFormSuccess('');
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Published Events
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{myEvents.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Seats Capacity
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {myEvents.reduce((acc, curr) => acc + (curr.totalSeats || 0), 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Registered Venues
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{venues.length}</p>
          </div>
        </div>
      </div>

      {/* Events Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Events Managed By You</h2>
          <span className="text-xs text-slate-500 font-semibold">{myEvents.length} items</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading your events...</div>
        ) : myEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Event Title</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Category</th>
                  <th className="px-6 py-3.5 font-bold">Venue</th>
                  <th className="px-6 py-3.5 font-bold">Seats Status</th>
                  <th className="px-6 py-3.5 font-bold">Ticket Price</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myEvents.map((evt) => (
                  <tr key={evt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{evt.title}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const evtStatus = getEventStatus(evt);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              evtStatus === 'Completed'
                                ? 'bg-slate-100 text-slate-700'
                                : evtStatus === 'Cancelled'
                                ? 'bg-rose-100 text-rose-700'
                                : evtStatus === 'Ongoing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {evtStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {typeof evt.category === 'object' && evt.category !== null ? evt.category.name : (evt.category || 'General')}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {typeof evt.venue === 'object' && evt.venue !== null ? `${evt.venue.name}, ${evt.venue.city}` : (evt.venue || 'N/A')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">
                        {evt.availableSeats}
                      </span>{' '}
                      / {evt.totalSeats} seats open
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {evt.ticketPrice === 0 ? 'Free' : `₹${evt.ticketPrice}`}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <a
                        href={`/events/${evt._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-brand-600 inline-block"
                        title="View Public Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteEvent(evt._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 inline-block"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No events created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by clicking the "Create New Event" button to host your upcoming festival or workshop.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Publish a New Event</h3>
                <p className="text-xs text-slate-500">Fill in event specifications, venue allocation and ticket price.</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. National Hackathon 2026"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Briefly describe the schedule, keynote speakers, and eligibility..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a category</option>
                    <option value="Departmental activity">Departmental activity</option>
                    <option value="Cultural activity">Cultural activity</option>
                    <option value="Outside college activity">Outside college activity</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    name="venue"
                    required
                    placeholder="e.g. Auditorium Hall A, Campus"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    required
                    value={formData.startDateTime}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    required
                    value={formData.endDateTime}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ticket Price (₹) - Enter 0 for Free
                  </label>
                  <input
                    type="number"
                    name="ticketPrice"
                    min={0}
                    step="any"
                    required
                    placeholder="0"
                    value={formData.ticketPrice}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Seats Available
                  </label>
                  <input
                    type="number"
                    name="totalSeats"
                    min={1}
                    required
                    placeholder="100"
                    value={formData.totalSeats}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {formSubmitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
