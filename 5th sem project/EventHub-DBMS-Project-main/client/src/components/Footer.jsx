import React from 'react';
import { Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white">EventHub</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              A comprehensive DBMS project implementing robust transaction-based event bookings, relational normalization, MongoDB Atlas ODM, and modern React UI.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Database Management Systems (Course Project 5th Sem)</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>Role-based Access Control (Admin, Organizer, Attendee)</li>
              <li>Mongoose Session ACID Seat Locking</li>
              <li>Dynamic Category & Venue Filtering</li>
              <li>Interactive Review & Rating System</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Stack</h4>
            <ul className="space-y-2 text-sm">
              <li>React 18 + Vite</li>
              <li>Tailwind CSS</li>
              <li>Node.js + Express.js</li>
              <li>MongoDB Atlas + Mongoose</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EventHub Event Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
