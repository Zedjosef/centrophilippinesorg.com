import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";
import CreateAnnouncementIcon from "../images/create-announcement.svg";
import CreateEventIcon from "../images/create-event.svg";
import MaleIcon from "../images/male.svg";
import FemaleIcon from "../images/female.svg";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const COLORS = {
  completion: ["#27ae60", "#bdc3c7"],
  participation: ["#2980b9", "#e74c3c"],
  growth: "#8e44ad",
  applications: "#f39c12",
  events: ["#27ae60", "#2980b9", "#f39c12", "#e74c3c"],
  gender: {
    male: "#3498db",
    female: "#e91e63",
  },
};

// ============================================
// HELPER FUNCTION FOR REAL-TIME GENDER COUNTING
// ============================================
const fetchGenderDataRealtime = async (volunteerIds) => {
  if (!volunteerIds || volunteerIds.length === 0) {
    return { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 };
  }

  try {
    const { data: usersData, error } = await supabase
      .from("User_Information")
      .select("user_id, gender")
      .in("user_id", volunteerIds);

    if (error) {
      console.error("Error fetching gender data:", error);
      return { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 };
    }

    let maleCount = 0;
    let femaleCount = 0;

    usersData?.forEach((user) => {
      if (user.gender === "Male") maleCount++;
      else if (user.gender === "Female") femaleCount++;
    });

    const total = maleCount + femaleCount;
    const malePercentage =
      total > 0 ? Math.round((maleCount / total) * 100) : 0;
    const femalePercentage =
      total > 0 ? Math.round((femaleCount / total) * 100) : 0;

    return {
      male: maleCount,
      female: femaleCount,
      malePercentage,
      femalePercentage,
    };
  } catch (error) {
    console.error("Error in fetchGenderDataRealtime:", error);
    return { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 };
  }
};

// Three Dots Menu Component
function ThreeDotsMenu({ onDownloadPDF, onDownloadWord }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-600 cursor-pointer"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadPDF();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download as PDF
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadWord();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download as Word
          </button>
        </div>
      )}
    </div>
  );
}

// Month Calendar Component
function MonthCalendar({ onClose, onApply, selectedMonths = [] }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [localSelectedMonths, setLocalSelectedMonths] =
    useState(selectedMonths);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthClick = (monthIndex) => {
    const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(
      2,
      "0"
    )}`;
    if (localSelectedMonths.includes(monthKey)) {
      setLocalSelectedMonths(localSelectedMonths.filter((m) => m !== monthKey));
    } else {
      setLocalSelectedMonths([...localSelectedMonths, monthKey]);
    }
  };

  const handleApply = () => {
    onApply(localSelectedMonths);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h3 className="text-lg font-bold">Select Months</h3>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-xl font-bold text-emerald-800">
              {currentYear}
            </span>
            <button
              onClick={() => setCurrentYear(currentYear + 1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const monthKey = `${currentYear}-${String(index + 1).padStart(
                2,
                "0"
              )}`;
              const isSelected = localSelectedMonths.includes(monthKey);
              return (
                <button
                  key={index}
                  onClick={() => handleMonthClick(index)}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {month.substring(0, 3)}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setLocalSelectedMonths([])}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
            >
              Apply ({localSelectedMonths.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Modal Component
function FilterModal({ isOpen, onClose, onApplyFilters, events }) {
  const [dateRange, setDateRange] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [volunteerRange, setVolunteerRange] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const handleApply = () => {
    onApplyFilters({
      dateRange,
      selectedEvent,
      gender,
      status,
      volunteerRange,
      customDateFrom,
      customDateTo,
      selectedMonths,
    });
    onClose();
  };

  const handleReset = () => {
    setDateRange("all");
    setSelectedEvent("all");
    setGender("all");
    setStatus("all");
    setVolunteerRange("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setSelectedMonths([]);
    onApplyFilters({
      dateRange: "all",
      selectedEvent: "all",
      gender: "all",
      status: "all",
      volunteerRange: "all",
      customDateFrom: "",
      customDateTo: "",
      selectedMonths: [],
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        style={{ backdropFilter: "blur(4px)" }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border-2 border-emerald-500 max-w-xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-xl font-bold font-montserrat flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Advanced Filters
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-emerald-700 text-3xl font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Date Range Filter */}
            <div className="border-b pb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value === "specific-months") {
                    setShowMonthCalendar(true);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Time</option>
                <option value="1week">Last Week</option>
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
                <option value="specific-months">Select Specific Months</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {dateRange === "specific-months" && selectedMonths.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedMonths.map((month) => (
                    <span
                      key={month}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm flex items-center gap-1"
                    >
                      {new Date(month + "-01").toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                      <button
                        onClick={() =>
                          setSelectedMonths(
                            selectedMonths.filter((m) => m !== month)
                          )
                        }
                        className="hover:bg-emerald-200 rounded-full"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Event Filter */}
            <div className="border-b pb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Events</option>
                {events.map((event) => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Status Filter */}
            <div className="border-b pb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div className="border-b pb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Volunteer Count Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Volunteer
              </label>
              <select
                value={volunteerRange}
                onChange={(e) => setVolunteerRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Ranges</option>
                <option value="1-50">1 - 50 volunteers</option>
                <option value="51-100">51 - 100 volunteers</option>
                <option value="101-200">101 - 200 volunteers</option>
                <option value="201+">201+ volunteers</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold transition-colors cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMonthCalendar && (
        <MonthCalendar
          onClose={() => setShowMonthCalendar(false)}
          onApply={(months) => setSelectedMonths(months)}
          selectedMonths={selectedMonths}
        />
      )}
    </>
  );
}

// Report Modal Component
function ReportModal({ isOpen, onClose, onGenerate }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [reportType, setReportType] = useState("single");

  const handleGenerate = () => {
    if (reportType === "single" && (!selectedMonth || !selectedYear)) {
      alert("Please select a month and year first.");
      return;
    }
    if (reportType === "multiple" && selectedMonths.length === 0) {
      alert("Please select at least one month.");
      return;
    }
    onGenerate(
      reportType === "single" ? selectedMonth : selectedMonths,
      selectedYear,
      reportType
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900">
              📄 Generate Report
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border-2 border-emerald-900 rounded-lg px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="single">Single Month</option>
                <option value="multiple">Multiple Months</option>
                <option value="annual">Annual Report</option>
              </select>
            </div>

            {reportType === "single" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border-2 border-emerald-900 rounded-lg px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Month --</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full border-2 border-emerald-900 rounded-lg px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Year --</option>
                    {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </>
            )}

            {reportType === "multiple" && (
              <div>
                <button
                  onClick={() => setShowMonthCalendar(true)}
                  className="w-full border-2 border-emerald-900 rounded-lg px-4 py-3 text-emerald-900 hover:bg-emerald-50 font-semibold"
                >
                  Select Months ({selectedMonths.length} selected)
                </button>
                {selectedMonths.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMonths.map((month) => (
                      <span
                        key={month}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                      >
                        {new Date(month + "-01").toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {reportType === "annual" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full border-2 border-emerald-900 rounded-lg px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Year --</option>
                  {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 bg-emerald-900 text-white font-semibold px-4 py-3 rounded-lg hover:bg-emerald-800 transition"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {showMonthCalendar && (
        <MonthCalendar
          onClose={() => setShowMonthCalendar(false)}
          onApply={(months) => {
            setSelectedMonths(months);
            setShowMonthCalendar(false);
          }}
          selectedMonths={selectedMonths}
        />
      )}
    </>
  );
}

// Chart Modal with Real-time Gender Breakdown
function ChartModal({
  isOpen,
  onClose,
  title,
  children,
  showGenderBreakdown,
  genderData,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-emerald-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-2xl font-bold font-montserrat text-emerald-800">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}

          {showGenderBreakdown && genderData && (
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                Real-time Gender Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 transform transition-all hover:scale-105">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                      <img src={MaleIcon} alt="Male Icon" className="w-5 h-5" />{" "}
                      Male
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold text-blue-600">
                    {genderData.male}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {genderData.malePercentage}% of total
                  </p>
                </div>
                <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200 transform transition-all hover:scale-105">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-pink-800 flex items-center gap-2">
                      <img
                        src={FemaleIcon}
                        alt="Female Icon"
                        className="w-5 h-5"
                      />{" "}
                      Female
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold text-pink-600">
                    {genderData.female}
                  </p>
                  <p className="text-sm text-pink-600 mt-1">
                    {genderData.femalePercentage}% of total
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Male", value: genderData.male },
                        { name: "Female", value: genderData.female },
                      ]}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={60}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill={COLORS.gender.male} />
                      <Cell fill={COLORS.gender.female} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
function DashboardPage() {
  const { ngoCode } = useParams();
  const [dashboardData, setDashboardData] = useState({
    ngoName: "",
    ngoCode: "",
    ngoLogo: "",
    totalVolunteers: 0,
    pendingApplications: 0,
    completionRate: 0,
    participationRate: 0,
    activeEvents: 0,
    beneficiaryReach: 0,
    feedbackScore: 5,
    events: [],
    volunteerGenderData: {
      male: 0,
      female: 0,
      malePercentage: 0,
      femalePercentage: 0,
    },
  });

  const [chartData, setChartData] = useState({
    growth: [],
    applications: { data: [], forecast: 0 },
    eventsPerformance: [],
    monthlyVolunteerData: [],
  });

  const [loading, setLoading] = useState(true);
  const [viewingContext, setViewingContext] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );

  const [draggableItems, setDraggableItems] = useState(() => {
    const saved = localStorage.getItem("dashboardLayout");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "completion", order: 0 },
          { id: "volunteers", order: 1 },
          { id: "participation", order: 2 },
          { id: "applications", order: 3 },
          { id: "growth", order: 4 },
          { id: "feedback", order: 5 },
          { id: "beneficiary", order: 6 },
          { id: "activeEvents", order: 7 },
        ];
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: "all",
    selectedEvent: "all",
    gender: "all",
    status: "all",
    volunteerRange: "all",
    customDateFrom: "",
    customDateTo: "",
    selectedMonths: [],
  });

  useEffect(() => {
    initializeDashboard();
  }, [ngoCode]);

  useEffect(() => {
    localStorage.setItem("dashboardLayout", JSON.stringify(draggableItems));
  }, [draggableItems]);

  useEffect(() => {
    if (viewingContext?.ngo_code) {
      applyFiltersToData();
    }
  }, [activeFilters]);

  const initializeDashboard = async () => {
    try {
      const admin = JSON.parse(localStorage.getItem("admin"));
      const viewingNGO = JSON.parse(localStorage.getItem("viewingNGO"));

      let contextToUse;

      if (ngoCode && admin.admin_type === "super_admin") {
        contextToUse = {
          ngo_code: ngoCode,
          ngo_name: null,
          is_super_admin_view: true,
        };
      } else if (admin.admin_type === "super_admin" && viewingNGO) {
        contextToUse = {
          ngo_code: viewingNGO.ngo_code,
          ngo_name: viewingNGO.ngo_name,
          is_super_admin_view: true,
        };
      } else {
        contextToUse = {
          ngo_code: admin.NGO_Information?.ngo_code,
          ngo_name: admin.NGO_Information?.name,
          is_super_admin_view: false,
        };
      }

      setViewingContext(contextToUse);
      await fetchDashboardData(contextToUse.ngo_code);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (ngoCode) => {
    try {
      const { data: ngoInfo } = await supabase
        .from("NGO_Information")
        .select("*")
        .eq("ngo_code", ngoCode)
        .single();

      const { data: registeredVols } = await supabase
        .from("Registered_Volunteers")
        .select("user_id, joined_ngo")
        .like("joined_ngo", `%${ngoCode}%`);

      const volunteerIds =
        registeredVols
          ?.filter((vol) => {
            if (!vol.joined_ngo) return false;
            const ngoCodes = vol.joined_ngo.split("-");
            return ngoCodes.includes(ngoCode);
          })
          .map((v) => v.user_id) || [];

      const totalVolunteers = volunteerIds.length;

      // ✅ USE REAL-TIME GENDER FETCH FUNCTION
      const genderData = await fetchGenderDataRealtime(volunteerIds);

      const { data: allApplications } = await supabase
        .from("Volunteer_Application")
        .select("application_id, user_id")
        .eq("ngo_id", ngoCode);

      let pendingApplications = 0;
      if (allApplications && allApplications.length > 0) {
        const { data: approvedApps } = await supabase
          .from("Application_Status")
          .select("application_id, result")
          .in(
            "application_id",
            allApplications.map((a) => a.application_id)
          )
          .not("result", "is", null);

        const approvedAppIds = new Set(
          approvedApps?.map((a) => a.application_id) || []
        );
        pendingApplications = allApplications.filter(
          (app) => !approvedAppIds.has(app.application_id)
        ).length;
      }

      const { data: events } = await supabase
        .from("Event_Information")
        .select("*")
        .eq("ngo_id", ngoCode)
        .order("date", { ascending: false });

      const completedEvents =
        events?.filter((e) => e.status === "COMPLETED").length || 0;
      const totalEvents = events?.length || 0;
      const completionRate =
        totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

      let participationRate = 0;
      if (volunteerIds.length > 0) {
        const { data: eventUsers } = await supabase
          .from("Event_User")
          .select("user_id")
          .eq("ngo_id", ngoCode)
          .in("user_id", volunteerIds);

        const uniqueParticipants = new Set(
          eventUsers?.map((eu) => eu.user_id) || []
        ).size;
        participationRate = Math.round(
          (uniqueParticipants / volunteerIds.length) * 100
        );
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      const activeEvents =
        events?.filter(
          (e) =>
            e.date &&
            e.date.startsWith(currentMonth) &&
            (e.status === "ONGOING" || e.status === "UPCOMING")
        ).length || 0;

      const beneficiaryReach =
        events?.reduce((sum, event) => {
          return sum + (parseInt(event.volunteer_joined) || 0);
        }, 0) || 0;

      setDashboardData({
        ngoName: ngoInfo?.name || "Organization",
        ngoCode: ngoCode,
        ngoLogo: ngoInfo?.ngo_logo || "",
        totalVolunteers,
        pendingApplications,
        completionRate,
        participationRate,
        activeEvents,
        beneficiaryReach,
        feedbackScore: 5,
        events: events || [],
        volunteerGenderData: genderData, // ✅ REAL-TIME GENDER DATA
      });

      await generateGrowthData(ngoCode);
      await generateApplicationsData(ngoCode);
      await generateMonthlyVolunteerData(ngoCode);
      generateEventsPerformanceData(events || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const applyFiltersToData = async () => {
    if (!viewingContext?.ngo_code) return;

    try {
      let query = supabase
        .from("Event_Information")
        .select("*")
        .eq("ngo_id", viewingContext.ngo_code);

      // Apply date filters
      if (activeFilters.dateRange !== "all") {
        const now = new Date();
        let startDate;

        switch (activeFilters.dateRange) {
          case "1week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "1month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case "3months":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case "6months":
            startDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
          case "1year":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          case "custom":
            if (activeFilters.customDateFrom) {
              query = query.gte("date", activeFilters.customDateFrom);
            }
            if (activeFilters.customDateTo) {
              query = query.lte("date", activeFilters.customDateTo);
            }
            break;
        }

        if (
          startDate &&
          activeFilters.dateRange !== "custom" &&
          activeFilters.dateRange !== "specific-months"
        ) {
          query = query.gte("date", startDate.toISOString().split("T")[0]);
        }
      }

      // Apply event filter
      if (activeFilters.selectedEvent !== "all") {
        query = query.eq("event_id", activeFilters.selectedEvent);
      }

      // Apply status filter
      if (activeFilters.status !== "all") {
        query = query.eq("status", activeFilters.status);
      }

      const { data: filteredEvents } = await query.order("date", {
        ascending: false,
      });

      // Apply volunteer range filter
      let finalEvents = filteredEvents || [];
      if (activeFilters.volunteerRange !== "all") {
        finalEvents = finalEvents.filter((event) => {
          const volCount = parseInt(event.volunteer_joined) || 0;
          switch (activeFilters.volunteerRange) {
            case "1-50":
              return volCount >= 1 && volCount <= 50;
            case "51-100":
              return volCount >= 51 && volCount <= 100;
            case "101-200":
              return volCount >= 101 && volCount <= 200;
            case "201+":
              return volCount >= 201;
            default:
              return true;
          }
        });
      }

      // Apply specific months filter if selected
      if (
        activeFilters.dateRange === "specific-months" &&
        activeFilters.selectedMonths.length > 0
      ) {
        finalEvents = finalEvents.filter((event) => {
          if (!event.date) return false;
          const eventMonth = event.date.substring(0, 7);
          return activeFilters.selectedMonths.includes(eventMonth);
        });
      }

      // ✅ FETCH VOLUNTEERS AND APPLY REAL-TIME GENDER COUNTING
      let filteredVolunteerIds = [];

      if (finalEvents.length > 0) {
        const eventIds = finalEvents.map((e) => e.event_id);

        const { data: eventUsers } = await supabase
          .from("Event_User")
          .select("user_id, event_id")
          .eq("ngo_id", viewingContext.ngo_code)
          .in("event_id", eventIds);

        if (eventUsers && eventUsers.length > 0) {
          filteredVolunteerIds = [
            ...new Set(eventUsers.map((eu) => eu.user_id)),
          ];
        }
      } else {
        const { data: registeredVols } = await supabase
          .from("Registered_Volunteers")
          .select("user_id, joined_ngo")
          .like("joined_ngo", `%${viewingContext.ngo_code}%`);

        filteredVolunteerIds =
          registeredVols
            ?.filter((vol) => {
              if (!vol.joined_ngo) return false;
              const ngoCodes = vol.joined_ngo.split("-");
              return ngoCodes.includes(viewingContext.ngo_code);
            })
            .map((v) => v.user_id) || [];
      }

      // ✅ Apply gender filter BEFORE counting
      if (activeFilters.gender !== "all") {
        const { data: usersData } = await supabase
          .from("User_Information")
          .select("user_id, gender")
          .in("user_id", filteredVolunteerIds)
          .eq("gender", activeFilters.gender);

        filteredVolunteerIds = usersData?.map((u) => u.user_id) || [];
      }

      // ✅ GET REAL-TIME GENDER DATA
      const genderData = await fetchGenderDataRealtime(filteredVolunteerIds);

      const totalFiltered = filteredVolunteerIds.length;

      // Update dashboard with filtered data
      const completedEvents = finalEvents.filter(
        (e) => e.status === "COMPLETED"
      ).length;
      const totalEvents = finalEvents.length;
      const completionRate =
        totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

      // Calculate participation rate
      let participationRate = 0;
      if (filteredVolunteerIds.length > 0 && finalEvents.length > 0) {
        const eventIds = finalEvents.map((e) => e.event_id);
        const { data: eventUsers } = await supabase
          .from("Event_User")
          .select("user_id")
          .eq("ngo_id", viewingContext.ngo_code)
          .in("event_id", eventIds)
          .in("user_id", filteredVolunteerIds);

        const uniqueParticipants = new Set(
          eventUsers?.map((eu) => eu.user_id) || []
        ).size;
        participationRate = Math.round(
          (uniqueParticipants / filteredVolunteerIds.length) * 100
        );
      }

      setDashboardData((prev) => ({
        ...prev,
        events: finalEvents,
        completionRate,
        totalVolunteers: totalFiltered,
        participationRate,
        volunteerGenderData: genderData, // ✅ REAL-TIME UPDATE
      }));

      generateEventsPerformanceData(finalEvents);
      await generateMonthlyVolunteerDataFiltered(
        viewingContext.ngo_code,
        finalEvents,
        filteredVolunteerIds
      );
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  const generateMonthlyVolunteerDataFiltered = async (
    ngoCode,
    events,
    filteredVolunteerIds
  ) => {
    try {
      if (events.length === 0) return;

      const eventIds = events.map((e) => e.event_id);

      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, date_joined, event_id")
        .eq("ngo_id", ngoCode)
        .in("event_id", eventIds);

      if (!eventUsers || eventUsers.length === 0) return;

      let filteredEventUsers = eventUsers;
      if (filteredVolunteerIds && filteredVolunteerIds.length > 0) {
        filteredEventUsers = eventUsers.filter((eu) =>
          filteredVolunteerIds.includes(eu.user_id)
        );
      }

      // ✅ GET REAL-TIME GENDER DATA
      const userIds = [...new Set(filteredEventUsers.map((eu) => eu.user_id))];
      const { data: usersData } = await supabase
        .from("User_Information")
        .select("user_id, gender")
        .in("user_id", userIds);

      const userGenderMap = {};
      usersData?.forEach((user) => {
        userGenderMap[user.user_id] = user.gender;
      });

      const monthlyData = {};
      filteredEventUsers.forEach((eu) => {
        if (!eu.date_joined) return;
        const month = eu.date_joined.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { male: 0, female: 0, total: 0 };
        }
        monthlyData[month].total++;
        const gender = userGenderMap[eu.user_id];
        if (gender === "Male") monthlyData[month].male++;
        else if (gender === "Female") monthlyData[month].female++;
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      const monthlyVolunteerData = sortedMonths.map((month) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        male: monthlyData[month].male,
        female: monthlyData[month].female,
        total: monthlyData[month].total,
      }));

      setChartData((prev) => ({ ...prev, monthlyVolunteerData }));
    } catch (error) {
      console.error("Error generating filtered monthly volunteer data:", error);
    }
  };

  const generateGrowthData = async (ngoCode) => {
    try {
      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, date_joined")
        .eq("ngo_id", ngoCode)
        .order("date_joined", { ascending: true });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentDate = new Date();

      const growthData = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthName = months[date.getMonth()];
        const yearMonth = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        const volunteersUpToMonth =
          eventUsers?.filter((eu) => {
            if (!eu.date_joined) return false;
            return eu.date_joined <= `${yearMonth}-31`;
          }).length || 0;

        growthData.push({
          month: monthName,
          volunteers: volunteersUpToMonth,
        });
      }

      setChartData((prev) => ({ ...prev, growth: growthData }));
    } catch (error) {
      console.error("Error generating growth data:", error);
    }
  };

  const generateApplicationsData = async (ngoCode) => {
    try {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

      const { data: applications } = await supabase
        .from("Application_Status")
        .select("application_id, date_application, result")
        .eq("ngo_id", ngoCode)
        .gte("date_application", sevenDaysAgoStr)
        .eq("result", true);

      const applicationsByDay = {};
      days.forEach((day) => (applicationsByDay[day] = 0));

      applications?.forEach((app) => {
        const date = new Date(app.date_application);
        const dayName = days[date.getDay()];
        applicationsByDay[dayName]++;
      });

      const applicationsData = days.map((day) => ({
        day,
        applications: applicationsByDay[day],
      }));

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const todayCount =
        applications?.filter((app) => app.date_application === todayStr)
          .length || 0;

      const avgApplications =
        applications?.length > 0 ? Math.round(applications.length / 7) : 0;

      const forecast = todayCount + Math.round(avgApplications * 0.3);

      setChartData((prev) => ({
        ...prev,
        applications: { data: applicationsData, forecast },
      }));
    } catch (error) {
      console.error("Error generating applications data:", error);
    }
  };

  const generateMonthlyVolunteerData = async (ngoCode) => {
    try {
      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, date_joined, event_id")
        .eq("ngo_id", ngoCode);

      if (!eventUsers || eventUsers.length === 0) return;

      // ✅ GET REAL-TIME GENDER DATA
      const userIds = [...new Set(eventUsers.map((eu) => eu.user_id))];
      const { data: usersData } = await supabase
        .from("User_Information")
        .select("user_id, gender")
        .in("user_id", userIds);

      const userGenderMap = {};
      usersData?.forEach((user) => {
        userGenderMap[user.user_id] = user.gender;
      });

      const monthlyData = {};
      eventUsers.forEach((eu) => {
        if (!eu.date_joined) return;
        const month = eu.date_joined.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { male: 0, female: 0, total: 0 };
        }
        monthlyData[month].total++;
        const gender = userGenderMap[eu.user_id];
        if (gender === "Male") monthlyData[month].male++;
        else if (gender === "Female") monthlyData[month].female++;
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      const monthlyVolunteerData = sortedMonths.map((month) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        male: monthlyData[month].male,
        female: monthlyData[month].female,
        total: monthlyData[month].total,
      }));

      setChartData((prev) => ({ ...prev, monthlyVolunteerData }));
    } catch (error) {
      console.error("Error generating monthly volunteer data:", error);
    }
  };

  const generateEventsPerformanceData = (events) => {
    const recentEvents = events
      .filter((e) => e.volunteer_joined && parseInt(e.volunteer_joined) > 0)
      .slice(0, 4)
      .map((event) => {
        const volunteerJoined = parseInt(event.volunteer_joined) || 0;
        const volunteerLimit = parseInt(event.volunteers_limit) || 100;

        const performance =
          volunteerLimit > 0
            ? Math.round((volunteerJoined / volunteerLimit) * 100)
            : volunteerJoined;

        return {
          event:
            event.event_title.length > 15
              ? event.event_title.substring(0, 15) + "..."
              : event.event_title,
          value: Math.min(performance, 100),
        };
      });

    setChartData((prev) => ({
      ...prev,
      eventsPerformance: recentEvents,
    }));
  };

  const handleGenerateReport = async (
    selectedData,
    selectedYear,
    reportType
  ) => {
    try {
      alert(
        `Generating ${reportType} report for ${
          reportType === "single"
            ? "month " + selectedData
            : selectedData.length + " months"
        } in ${selectedYear || "selected period"}...`
      );
      setReportModalOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report.");
    }
  };

  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, targetId) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      setDragOverItem(targetId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = draggableItems.findIndex(
      (item) => item.id === draggedItem
    );
    const targetIndex = draggableItems.findIndex(
      (item) => item.id === targetId
    );

    const newItems = [...draggableItems];
    const [draggedElement] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedElement);

    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    setDraggableItems(reorderedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const downloadAsPDF = (cardType) => {
    alert(`Downloading ${cardType} report as PDF...`);
  };

  const downloadAsWord = (cardType) => {
    alert(`Downloading ${cardType} report as Word document...`);
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState({ isOpen: false, type: null });

  const getSortedItems = () => {
    return [...draggableItems].sort((a, b) => a.order - b.order);
  };

  const renderDraggableCard = (itemId, content) => {
    const isDragOver = dragOverItem === itemId;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, itemId)}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, itemId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, itemId)}
        onDragEnd={handleDragEnd}
        className={`transition-all duration-200 h-full ${
          isDragOver ? "ring-4 ring-emerald-400 scale-105" : ""
        }`}
        style={{ cursor: "grab" }}
      >
        <div className="relative h-full">
          <div className="absolute top-2 left-2 text-gray-400 z-10 cursor-move">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 5h2v14H9V5zm4 0h2v14h-2V5z" />
            </svg>
          </div>
          {content}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const cardComponents = {
    completion: (
      <div
        onClick={() => openModal("completion")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px] flex flex-col justify-center"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Completion Rate")}
            onDownloadWord={() => downloadAsWord("Completion Rate")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mb-2 mt-6">
          Project & Event Completion Rate
        </h4>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie
              data={[
                { name: "Completed", value: dashboardData.completionRate },
                {
                  name: "Remaining",
                  value: 100 - dashboardData.completionRate,
                },
              ]}
              dataKey="value"
              innerRadius={30}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
            >
              {[0, 1].map((index) => (
                <Cell key={`cell-${index}`} fill={COLORS.completion[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-2xl font-extrabold font-montserrat text-emerald-600">
          {dashboardData.completionRate}%
        </p>
        <p className="text-xs text-gray-500 font-montserrat mt-1">
          Success Rate
        </p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    volunteers: (
      <div
        onClick={() => openModal("volunteers")}
        className="bg-white p-4 text-center flex flex-col justify-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px]"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Total Volunteers")}
            onDownloadWord={() => downloadAsWord("Total Volunteers")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mb-2 mt-6">
          Total Registered Volunteers
        </h4>
        <p className="text-4xl font-extrabold font-montserrat text-emerald-700">
          {dashboardData.totalVolunteers}
        </p>
        {/* REAL-TIME GENDER DISPLAY */}
        <div className="mt-3 flex justify-center gap-4">
          <div className="text-center transform transition-all hover:scale-110">
            <p className="text-sm text-blue-600 font-semibold flex items-center justify-center gap-1">
              <img src={MaleIcon} alt="Male Icon" className="w-4 h-4" />{" "}
              {dashboardData.volunteerGenderData.male}
            </p>
            <p className="text-xs text-gray-500">
              Male ({dashboardData.volunteerGenderData.malePercentage}%)
            </p>
          </div>
          <div className="text-center transform transition-all hover:scale-110">
            <p className="text-sm text-pink-600 font-semibold flex items-center justify-center gap-1">
              <img src={FemaleIcon} alt="Female Icon" className="w-4 h-4" />{" "}
              {dashboardData.volunteerGenderData.female}
            </p>{" "}
            <p className="text-xs text-gray-500">
              Female ({dashboardData.volunteerGenderData.femalePercentage}%)
            </p>
          </div>
        </div>
        <p className="text-xs mt-2 font-montserrat">
          As of {new Date().toLocaleDateString()}
        </p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    participation: (
      <div
        onClick={() => openModal("participation")}
        className="bg-white p-4 text-center font-montserrat rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px] flex flex-col justify-center"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Participation Rate")}
            onDownloadWord={() => downloadAsWord("Participation Rate")}
          />
        </div>
        <h4 className="font-bold mb-2 font-montserrat text-base mt-6">
          Volunteer Participation Rate
        </h4>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie
              data={[
                { name: "Active", value: dashboardData.participationRate },
                {
                  name: "Inactive",
                  value: 100 - dashboardData.participationRate,
                },
              ]}
              dataKey="value"
              innerRadius={30}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
            >
              {[0, 1].map((index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS.participation[index]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-2xl font-extrabold font-montserrat mt-2 text-emerald-600">
          {dashboardData.participationRate}%
        </p>
        <p className="text-xs text-gray-500 font-montserrat mt-2">
          Active Volunteers
        </p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    applications: (
      <div
        onClick={() => openModal("applications")}
        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Applications")}
            onDownloadWord={() => downloadAsWord("Applications")}
          />
        </div>
        <h4 className="font-bold mb-4 mt-8 font-montserrat text-sm">
          Expected Volunteer Applications - Current Week
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData.applications?.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="applications"
              stroke={COLORS.applications}
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-lg mb-2 font-montserrat">
            Projected Today:{" "}
            <span className="font-bold text-emerald-700 text-xl">
              {chartData.applications?.forecast || 0}
            </span>
          </p>
        </div>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    growth: (
      <div
        onClick={() => openModal("growth")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Growth Rate")}
            onDownloadWord={() => downloadAsWord("Growth Rate")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mb-6 mt-8">
          Volunteer Growth Rate
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData.growth}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Bar dataKey="volunteers" fill={COLORS.growth} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    feedback: (
      <div
        onClick={() => openModal("feedback")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[140px] flex flex-col justify-center"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Feedback Score")}
            onDownloadWord={() => downloadAsWord("Feedback Score")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mt-6">
          Volunteer Feedback Score
        </h4>
        <p className="text-yellow-500 text-2xl mt-2">
          {"⭐".repeat(dashboardData.feedbackScore)}
        </p>
        <p className="text-xs font-montserrat mt-2">High satisfaction</p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    beneficiary: (
      <div
        onClick={() => openModal("beneficiary")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[140px] flex flex-col justify-center"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Beneficiary Reach")}
            onDownloadWord={() => downloadAsWord("Beneficiary Reach")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mt-6">
          Beneficiary Reach
        </h4>
        <p className="text-3xl font-extrabold text-emerald-700 mt-2">
          {dashboardData.beneficiaryReach.toLocaleString()}
        </p>
        <p className="text-xs font-montserrat mt-1">Total served</p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    activeEvents: (
      <div
        onClick={() => openModal("activeEvents")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[140px] flex flex-col justify-center"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Active Events")}
            onDownloadWord={() => downloadAsWord("Active Events")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mt-6">
          Active Events This Month
        </h4>
        <p className="text-3xl font-extrabold text-emerald-700 mt-2">
          {dashboardData.activeEvents}
        </p>
        <p className="text-xs font-montserrat mt-1">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
  };

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      <main
        className="flex-1 p-6 overflow-y-auto transition-all duration-300"
        style={{
          filter:
            modalState.isOpen || filterModalOpen || reportModalOpen
              ? "blur(3px)"
              : "none",
          marginLeft: sidebarCollapsed ? "5rem" : "16rem",
        }}
      >
        <div
          className="relative z-10 space-y-6 w-full mx-auto"
          style={{ maxWidth: "1400px" }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex-1 text-3xl font-bold font-montserrat text-white text-center border border-emerald-500 bg-emerald-800/90 py-3 rounded-xl shadow">
              {viewingContext?.is_super_admin_view
                ? `${dashboardData.ngoName.toUpperCase()} DASHBOARD (SAV)`
                : "ORGANIZATION DASHBOARD"}
            </h2>
            <button
              onClick={() => setFilterModalOpen(true)}
              className="px-4 py-3 bg-white text-emerald-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hover:bg-emerald-50 cursor-pointer"
            >
              Filter
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hover:bg-emerald-700 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Report
            </button>
          </div>

          {viewingContext?.is_super_admin_view && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <p className="font-semibold">
                You are viewing {dashboardData.ngoName}'s dashboard.
                <Link
                  to="/ngohub"
                  onClick={() => localStorage.removeItem("viewingNGO")}
                  className="ml-4 underline hover:no-underline"
                >
                  Return to NGO Hub
                </Link>
              </p>
            </div>
          )}

          {/* Active Filters Display */}
          {(activeFilters.dateRange !== "all" ||
            activeFilters.selectedEvent !== "all" ||
            activeFilters.gender !== "all" ||
            activeFilters.status !== "all" ||
            activeFilters.volunteerRange !== "all") && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-emerald-800">
                    Filters:
                  </span>
                  {activeFilters.dateRange !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.dateRange === "custom"
                        ? `${activeFilters.customDateFrom} to ${activeFilters.customDateTo}`
                        : activeFilters.dateRange}
                    </span>
                  )}
                  {activeFilters.selectedEvent !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {dashboardData.events.find(
                        (e) => e.event_id === activeFilters.selectedEvent
                      )?.event_title || activeFilters.selectedEvent}
                    </span>
                  )}
                  {activeFilters.status !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.status}
                    </span>
                  )}
                  {activeFilters.gender !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm flex items-center gap-2">
                      {activeFilters.gender === "Male" ? (
                        <>
                          <img
                            src={MaleIcon}
                            alt="Male Icon"
                            className="w-4 h-4"
                          />
                          Male
                        </>
                      ) : (
                        <>
                          <img
                            src={FemaleIcon}
                            alt="Female Icon"
                            className="w-4 h-4"
                          />
                          Female
                        </>
                      )}
                    </span>
                  )}
                  {activeFilters.volunteerRange !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.volunteerRange}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    handleApplyFilters({
                      dateRange: "all",
                      selectedEvent: "all",
                      gender: "all",
                      status: "all",
                      volunteerRange: "all",
                      customDateFrom: "",
                      customDateTo: "",
                      selectedMonths: [],
                    })
                  }
                  className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* ROW 1: Fixed - Greetings, Create Announcement, Create Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <div
              className="p-5 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#d8eeeb" }}
            >
              <h3 className="text-emerald-900 font-extrabold text-xl font-montserrat mt-2 mb-1">
                Hi, {dashboardData.ngoName}!
              </h3>
              <p className="text-sm">
                You have{" "}
                <span className="underline decoration-double font-bold text-lg">
                  {dashboardData.pendingApplications}
                </span>{" "}
                pending applicants waiting for review.
              </p>
            </div>

            <Link
              to="/create-announcement"
              className="inline-flex items-center justify-center text-2xl font-montserrat text-emerald-900 font-bold p-5 gap-3 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#fff4d9" }}
            >
              <img
                src={CreateAnnouncementIcon}
                alt="Create Announcement"
                className="w-16 h-16"
              />
              <span>CREATE ANNOUNCEMENT</span>
            </Link>

            <Link
              to="/create-event"
              className="inline-flex items-center justify-center text-2xl text-emerald-900 font-bold font-montserrat p-5 gap-3 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#fbdb90" }}
            >
              <span>CREATE EVENT</span>
              <img
                src={CreateEventIcon}
                alt="Create Event"
                className="w-16 h-16"
              />
            </Link>
          </div>

          {/* ROW 2: Draggable Cards - 3 columns with equal height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {getSortedItems()
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="h-full">
                  {renderDraggableCard(item.id, cardComponents[item.id])}
                </div>
              ))}
          </div>

          {/* ROW 3: Draggable Cards - Mixed layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {/* First two large cards */}
            <div className="h-full">
              {getSortedItems()[3] &&
                renderDraggableCard(
                  getSortedItems()[3].id,
                  cardComponents[getSortedItems()[3].id]
                )}
            </div>
            <div className="h-full">
              {getSortedItems()[4] &&
                renderDraggableCard(
                  getSortedItems()[4].id,
                  cardComponents[getSortedItems()[4].id]
                )}
            </div>

            {/* Three stacked small cards with equal heights */}
            <div className="flex flex-col gap-4 h-full">
              {getSortedItems()
                .slice(5, 8)
                .map((item) => (
                  <div key={item.id} className="flex-1">
                    {renderDraggableCard(item.id, cardComponents[item.id])}
                  </div>
                ))}
            </div>
          </div>

          {/* ROW 4: Events Performance - Full Width */}
          {chartData.eventsPerformance.length > 0 && (
            <div
              onClick={() => openModal("eventsPerformance")}
              className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative"
            >
              <div
                className="absolute top-2 right-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <ThreeDotsMenu
                  onDownloadPDF={() => downloadAsPDF("Events Performance")}
                  onDownloadWord={() => downloadAsWord("Events Performance")}
                />
              </div>
              <h4 className="font-bold mt-2 mb-4 font-montserrat text-base">
                Events Performance Comparison
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.eventsPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {chartData.eventsPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.events[index % COLORS.events.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        events={dashboardData.events}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onGenerate={handleGenerateReport}
      />

      {/* ALL MODALS WITH REAL-TIME GENDER BREAKDOWN */}
      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "volunteers"}
        onClose={closeModal}
        title="Total Registered Volunteers"
        showGenderBreakdown={true}
        genderData={dashboardData.volunteerGenderData}
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 rounded-xl mb-6">
            <p className="text-5xl font-extrabold text-emerald-700 mb-4">
              {dashboardData.totalVolunteers}
            </p>
            <p className="text-2xl text-gray-700 font-montserrat">
              Registered Volunteers
            </p>
            <p className="text-lg text-gray-600 mt-2">
              As of{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-3xl font-bold text-blue-700">
                {dashboardData.pendingApplications}
              </p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Active Volunteers</p>
              <p className="text-3xl font-bold text-emerald-700">
                {Math.round(
                  dashboardData.totalVolunteers *
                    (dashboardData.participationRate / 100)
                )}
              </p>
            </div>
          </div>
        </div>
      </ChartModal>

      {/* Other modals remain the same, just adding the rest of them */}
      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "completion"}
        onClose={closeModal}
        title="Project & Event Completion Rate"
      >
        <div className="text-center">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: dashboardData.completionRate },
                  {
                    name: "Remaining",
                    value: 100 - dashboardData.completionRate,
                  },
                ]}
                dataKey="value"
                innerRadius={100}
                outerRadius={150}
                startAngle={90}
                endAngle={-270}
                label
              >
                {[0, 1].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.completion[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <p className="text-5xl font-extrabold text-emerald-600 mb-4">
              {dashboardData.completionRate}%
            </p>
            <p className="text-xl text-gray-600">Success Rate</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Completed Events</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {
                    dashboardData.events.filter((e) => e.status === "COMPLETED")
                      .length
                  }
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-700">
                  {dashboardData.events.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "participation"}
        onClose={closeModal}
        title="Volunteer Participation Rate"
        showGenderBreakdown={true}
        genderData={dashboardData.volunteerGenderData}
      >
        <div className="text-center">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: "Active", value: dashboardData.participationRate },
                  {
                    name: "Inactive",
                    value: 100 - dashboardData.participationRate,
                  },
                ]}
                dataKey="value"
                innerRadius={100}
                outerRadius={150}
                startAngle={90}
                endAngle={-270}
                label
              >
                {[0, 1].map((index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.participation[index]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <p className="text-5xl font-extrabold text-emerald-600 mb-4">
              {dashboardData.participationRate}%
            </p>
            <p className="text-xl text-gray-600">Active Volunteers</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Active Volunteers</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.round(
                    dashboardData.totalVolunteers *
                      (dashboardData.participationRate / 100)
                  )}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Inactive Volunteers</p>
                <p className="text-2xl font-bold text-red-700">
                  {dashboardData.totalVolunteers -
                    Math.round(
                      dashboardData.totalVolunteers *
                        (dashboardData.participationRate / 100)
                    )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "growth"}
        onClose={closeModal}
        title="Volunteer Growth Rate"
        showGenderBreakdown={true}
        genderData={dashboardData.volunteerGenderData}
      >
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volunteers" fill={COLORS.growth} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-8 flex gap-4 overflow-x-auto">
            {chartData.growth.map((data, index) => (
              <div
                key={index}
                className="bg-purple-50 p-4 rounded-lg text-center min-w-[150px] flex-shrink-0"
              >
                <p className="text-sm text-gray-600 font-semibold">
                  {data.month}
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {data.volunteers}
                </p>
                <p className="text-xs text-gray-500">volunteers</p>
              </div>
            ))}
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "applications"}
        onClose={closeModal}
        title="Expected Volunteer Applications - Current Week"
      >
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.applications?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="applications"
                stroke={COLORS.applications}
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-8">
            <div className="bg-orange-50 p-6 rounded-lg text-center mb-4">
              <p className="text-lg text-gray-600">Projected Today</p>
              <p className="text-4xl font-bold text-orange-600">
                {chartData.applications?.forecast || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                applications expected
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {chartData.applications?.data?.slice(0, 4).map((data, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg text-center"
                >
                  <p className="text-xs text-gray-600">{data.day}</p>
                  <p className="text-xl font-bold text-gray-700">
                    {data.applications}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "feedback"}
        onClose={closeModal}
        title="Volunteer Feedback Score"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-12 rounded-xl mb-6">
            <p className="text-6xl mb-4">
              {"⭐".repeat(dashboardData.feedbackScore)}
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {dashboardData.feedbackScore}.0 / 5.0
            </p>
            <p className="text-xl text-gray-700 mt-2">Excellent Rating</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-lg">
            <h5 className="font-bold text-lg mb-4 text-emerald-800">
              Satisfaction Breakdown
            </h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Organization Support</span>
                <span className="font-bold text-emerald-600">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Event Management</span>
                <span className="font-bold text-emerald-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Communication</span>
                <span className="font-bold text-emerald-600">97%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Overall Experience</span>
                <span className="font-bold text-emerald-600">96%</span>
              </div>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "beneficiary"}
        onClose={closeModal}
        title="Beneficiary Reach"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 rounded-xl mb-6">
            <p className="text-5xl font-extrabold text-emerald-700 mb-4">
              {dashboardData.beneficiaryReach.toLocaleString()}
            </p>
            <p className="text-2xl text-gray-700 font-montserrat">
              Total Individuals Served
            </p>
            <p className="text-lg text-gray-600 mt-2">
              Through all events and programs
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-blue-700">
                {dashboardData.events.length}
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Avg. per Event</p>
              <p className="text-3xl font-bold text-purple-700">
                {dashboardData.events.length > 0
                  ? Math.round(
                      dashboardData.beneficiaryReach /
                        dashboardData.events.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "activeEvents"}
        onClose={closeModal}
        title="Active Events This Month"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 rounded-xl mb-6">
            <p className="text-5xl font-extrabold text-emerald-700 mb-4">
              {dashboardData.activeEvents}
            </p>
            <p className="text-2xl text-gray-700 font-montserrat">
              Active Events
            </p>
            <p className="text-lg text-gray-600 mt-2">
              For{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Ongoing</p>
              <p className="text-3xl font-bold text-green-700">
                {
                  dashboardData.events.filter((e) => e.status === "ONGOING")
                    .length
                }
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-blue-700">
                {
                  dashboardData.events.filter((e) => e.status === "UPCOMING")
                    .length
                }
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-700">
                {
                  dashboardData.events.filter((e) => e.status === "COMPLETED")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "eventsPerformance"}
        onClose={closeModal}
        title="Events Performance Comparison"
      >
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.eventsPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.eventsPerformance.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.events[index % COLORS.events.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-8 space-y-3">
            {chartData.eventsPerformance.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        COLORS.events[index % COLORS.events.length],
                    }}
                  ></div>
                  <span className="font-semibold text-gray-700">
                    {event.event}
                  </span>
                </div>
                <div className="text-right">
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: COLORS.events[index % COLORS.events.length],
                    }}
                  >
                    {event.value}%
                  </p>
                  <p className="text-xs text-gray-500">participation</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartModal>
    </div>
  );
}

export default DashboardPage;
