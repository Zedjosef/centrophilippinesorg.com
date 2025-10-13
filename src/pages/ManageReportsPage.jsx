// src/pages/ManageReports.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";
import ExpandArrow from "../images/expandarrow.svg";
import supabase from "../config/supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";


function ManageReports() {
  const [showOngoing, setShowOngoing] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeButton, setActiveButton] = useState("Manage Reports");
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [ngoLogo, setNgoLogo] = useState("");
  const [ngoName, setNgoName] = useState("");

  const eventColors = [
    "bg-orange-400", "bg-yellow-400", "bg-red-400",
    "bg-gray-500", "bg-purple-500", "bg-amber-800",
    "bg-emerald-900", "bg-green-500", "bg-pink-500", "bg-gray-400",
  ];

  const handleButtonClick = (button) => setActiveButton(button);

  useEffect(() => {
    fetchNgoDetails();
    fetchEvents();
  }, []);

  // Fetch NGO logo & name
  const fetchNgoDetails = async () => {
    try {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      const adminId = adminData?.admin_id;
      if (!adminId) return;
      const { data, error } = await supabase
        .from("NGO_Information")
        .select("ngo_logo, name")
        .eq("admin_id", adminId)
        .single();
      if (error) throw error;
      setNgoLogo(data?.ngo_logo || "");
      setNgoName(data?.name || "CENTRO Organization");
    } catch (err) {
      console.error("Error fetching NGO details:", err);
    }
  };

  // Fetch events for NGO
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const adminData = JSON.parse(localStorage.getItem("admin"));
      if (!adminData?.NGO_Information) {
        setError("Admin data not found");
        return;
      }
      const ngoCode = adminData.NGO_Information.ngo_code;
      const { data: events, error: eventsError } = await supabase
        .from("Event_Information")
        .select("*")
        .eq("ngo_id", ngoCode)
        .order("date", { ascending: true });
      if (eventsError) throw eventsError;
      setAllEvents(events || []);
      setFilteredEvents(events || []);
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) setFilteredEvents(allEvents);
    else {
      const filtered = allEvents.filter(
        (event) =>
          (event.event_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.event_id || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, allEvents]);

  // Date helpers
  const categorizeEventByDate = (event) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const eventDate = new Date(event.date); eventDate.setHours(0,0,0,0);
    if (eventDate.getTime() === today.getTime()) {
      if (event.time_end) {
        const now = new Date();
        const [endHours, endMinutes] = (event.time_end || "23:59").split(":");
        const endTime = new Date(); endTime.setHours(parseInt(endHours), parseInt(endMinutes||0),0,0);
        return now < endTime ? "ongoing" : "completed";
      }
      return "ongoing";
    }
    if (eventDate < today) return "completed";
    return "upcoming";
  };

  const ongoingEvents = filteredEvents
    .filter((event) => event.status === "ONGOING" || categorizeEventByDate(event) === "ongoing")
    .sort((a, b) => (a.event_id || "").localeCompare(b.event_id || ""));
  const upcomingEvents = filteredEvents
    .filter((event) => event.status === "UPCOMING" && categorizeEventByDate(event) === "upcoming")
    .sort((a, b) => (a.event_id || "").localeCompare(b.event_id || ""));
  const completedEvents = filteredEvents
    .filter((event) => event.status === "COMPLETED" || categorizeEventByDate(event) === "completed")
    .sort((a, b) => (a.event_id || "").localeCompare(b.event_id || ""));

  // Formatting (restored to original sizes / style)
  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "TBA";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const mm = minutes ? minutes.padStart(2, "0") : "00";
    return `${hour12}:${mm} ${ampm}`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    try {
      const [sh, sm] = start.split(":").map((n) => parseInt(n||"0"));
      const [eh, em] = end.split(":").map((n) => parseInt(n||"0"));
      let diff = (eh*60+em) - (sh*60+sm);
      if (diff < 0) diff += 24*60;
      const hours = Math.floor(diff/60);
      const minutes = diff % 60;
      if (hours>0 && minutes>0) return `${hours} hour${hours>1?'s':''} ${minutes} mins`;
      if (hours>0) return `${hours} hour${hours>1?'s':''}`;
      return `${minutes} mins`;
    } catch { return ""; }
  };

 // Render event card (Enhanced Modern Design)
const renderEventCard = (event, index) => {
  const colorClass = eventColors[index % eventColors.length];

  return (
    <Link
      to={`/event/${event.event_id}`}
      key={event.event_id}
      className="group block rounded-2xl overflow-hidden backdrop-blur-md bg-white/90 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200"
    >
      {/* Header */}
      <div
        className={`${colorClass} relative text-lg font-montserrat text-white font-semibold px-4 py-2 text-center`}
      >
        <span className="tracking-wider drop-shadow-md">
          {event.event_id}
        </span>

        {/* Decorative bottom bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/40"></div>
      </div>

      {/* Body */}
      <div className="p-4 text-center">
        <h3 className="font-bold font-montserrat text-emerald-900 mb-2 text-xl group-hover:text-emerald-700 transition-colors duration-200">
          {event.event_title}
        </h3>

        <div className="space-y-1 text-sm text-gray-800">
          <p>
            <span className="font-semibold text-emerald-900">Date:</span>{" "}
            {formatDate(event.date)}
          </p>
          <p>
            <span className="font-semibold text-emerald-900">Duration:</span>{" "}
            {formatTime(event.time_start)} – {formatTime(event.time_end)}
          </p>
          <p>
            <span className="font-semibold text-emerald-900">Location:</span>{" "}
            {event.location}
          </p>
        </div>
      </div>

      {/* Hover Accent Bar */}
      <div className="h-1 bg-emerald-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </Link>
  );
};

  // --- PDF HELPERS (kept/improved) ---

  // dash-separated text -> bullets
  const splitToBullets = (text) => {
    if (!text) return [];
    return String(text).replace(/\r\n/g, "\n").replace(/\n/g, " - ").split("-").map(s=>s.trim()).filter(Boolean);
  };

  // add NGO logo safely (with optional opacity)
  const addLogo = async (doc, x, y, width, height, opacity = 1) => {
    if (!ngoLogo) return;
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = ngoLogo;
      await new Promise((resolve) => {
        img.onload = () => {
          try { if (doc.setGState) doc.setGState(new doc.GState({ opacity })); } catch {}
          const aspect = img.width / img.height;
          let finalW = width, finalH = height;
          if (aspect > 1) {
            finalH = width / aspect;
            if (finalH > height) { finalH = height; finalW = height * aspect; }
          } else {
            finalW = height * aspect;
            if (finalW > width) { finalW = width; finalH = width / aspect; }
          }
          const offsetX = (width - finalW)/2, offsetY = (height - finalH)/2;
          try { doc.addImage(img, "PNG", x + offsetX, y + offsetY, finalW, finalH); } catch (e) { console.warn(e); }
          try { if (doc.setGState) doc.setGState(new doc.GState({ opacity: 1 })); } catch {}
          resolve();
        };
        img.onerror = () => resolve();
      });
    } catch (err) { console.error("addLogo err", err); }
  };

  // add event image on right, return {imageHeight, imageAdded}
  const addEventImageRight = async (doc, imageUrl, currentY, pageWidth, pageHeight) => {
    if (!imageUrl) return { imageHeight: 0, imageAdded: false };
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      return await new Promise((resolve) => {
        img.onload = () => {
          const maxImgWidth = 60;
          const aspectRatio = img.width / img.height || 1;
          const imgWidth = maxImgWidth;
          const imgHeight = maxImgWidth / aspectRatio;
          if (currentY + imgHeight + 10 > pageHeight - 20) {
            resolve({ imageHeight: 0, imageAdded: false });
            return;
          }
          const imgX = pageWidth - imgWidth - 16;
          doc.setDrawColor(0); doc.setLineWidth(0.3);
          doc.rect(imgX - 1, currentY - 1, imgWidth + 2, imgHeight + 2);
          try { doc.addImage(img, "JPEG", imgX, currentY, imgWidth, imgHeight); } catch (e) { console.warn(e); }
          resolve({ imageHeight: imgHeight, imageAdded: true });
        };
        img.onerror = () => resolve({ imageHeight: 0, imageAdded: false });
      });
    } catch (err) { console.error("addEventImageRight err", err); return { imageHeight: 0, imageAdded: false }; }
  };

  // Create modern decorative month title page (centered month + year)
  const createMonthSeparatorPage = async (doc, monthName, year, pageW, pageH) => {
    doc.addPage();
    // faint watermark/logo
    await addLogo(doc, pageW - 35, pageH - 35, 25, 25, 0.06);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(0, 100, 0);
    doc.text(monthName, pageW/2, pageH/2 - 10, { align: "center" });

    doc.setFontSize(24);
    doc.setTextColor(80,80,80);
    doc.text(String(year), pageW/2, pageH/2 + 12, { align: "center" });

    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(0.5);
    doc.line(40, pageH/2 + 22, pageW - 40, pageH/2 + 22);
  };

  // ------------------------------
  // PDF generation main function
  // ------------------------------
  const handleGenerateMonthlyReport = async () => {
    if (!selectedMonth || !selectedYear) {
      alert("Please select a month and year first.");
      return;
    }

    const adminData = JSON.parse(localStorage.getItem("admin"));
    const ngoCode = adminData?.NGO_Information?.ngo_code;
    if (!ngoCode) {
      alert("NGO information not found.");
      return;
    }

    setShowReportModal(false);

    // Fetch events
    const { data: events } = await supabase
      .from("Event_Information")
      .select("*")
      .eq("ngo_id", ngoCode);

    if (!events || events.length === 0) {
      alert("No events found.");
      return;
    }

    // Fetch event-user and applications
    const { data: eventUsers } = await supabase
      .from("Event_User")
      .select("user_id, event_id, status")
      .in("event_id", events.map((e) => e.event_id));

    const { data: applications } = await supabase
      .from("Application_Status")
      .select("*")
      .eq("ngo_id", ngoCode);

    const isAnnualReport = selectedMonth === "all";
    let filteredEvents;
    let reportTitle;

    if (isAnnualReport) {
      filteredEvents = events.filter(
        (ev) => new Date(ev.date).getFullYear() === parseInt(selectedYear)
      );
      reportTitle = `Year ${selectedYear}`;
    } else {
      filteredEvents = events.filter((ev) => {
        const d = new Date(ev.date);
        return (
          d.getMonth() + 1 === parseInt(selectedMonth) &&
          d.getFullYear() === parseInt(selectedYear)
        );
      });
      reportTitle = new Date(selectedYear, selectedMonth - 1).toLocaleString(
        "default",
        { month: "long", year: "numeric" }
      );
    }

    if (!filteredEvents || filteredEvents.length === 0) {
      alert("No events found for the selected period.");
      return;
    }

    const sortedEvents = filteredEvents.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // --- PDF setup ---
    const doc = new jsPDF("p", "mm", "a4");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 25;

    // --- COVER PAGE ---
    if (ngoLogo) {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = ngoLogo;
        await new Promise((resolve) => {
          img.onload = () => {
            const w = 70, h = 70;
            const cx = pageW / 2 - w / 2;
            doc.addImage(img, "PNG", cx, 20, w, h);
            resolve();
          };
          img.onerror = () => resolve();
        });
      } catch {}
    }

    y = 100;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 100, 0);
    doc.text(ngoName || "CENTRO Organization", pageW / 2, y, { align: "center" });
    y += 12;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Organization Accomplishment Report", pageW / 2, y, { align: "center" });
    y += 12;
    doc.setFontSize(14);
    doc.text(`Period: ${reportTitle}`, pageW / 2, y, { align: "center" });
    y += 20;

    // --- SUMMARY BOX ---
    const totalEvents = sortedEvents.length;
    const totalVolunteers = eventUsers ? new Set(eventUsers.map((v) => v.user_id)).size : 0;
    const completedCount = sortedEvents.filter((e) => e.status === "COMPLETED").length;
    const ongoingCount = sortedEvents.filter((e) => e.status === "ONGOING").length;
    const upcomingCount = sortedEvents.filter((e) => e.status === "UPCOMING").length;
    const monthlyApplications = (applications || []).filter((app) => {
      const appDate = new Date(app.date_application);
      return isAnnualReport
        ? appDate.getFullYear() === parseInt(selectedYear)
        : appDate.getFullYear() === parseInt(selectedYear) &&
          appDate.getMonth() + 1 === parseInt(selectedMonth);
    });

    doc.setDrawColor(0, 100, 0);
    doc.setFillColor(245, 250, 245);
    doc.roundedRect(20, y, pageW - 40, 50, 3, 3, "FD");
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 0);
    doc.text("Summary Overview", 25, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 8;
    doc.text(`•  Total Events: ${totalEvents}`, 30, y); y+=6;
    doc.text(`•  Completed: ${completedCount}`, 30, y); y+=6;
    doc.text(`•  Ongoing: ${ongoingCount}`, 30, y); y+=6;
    doc.text(`•  Upcoming: ${upcomingCount}`, 30, y); y+=6;
    doc.text(`•  Total Unique Volunteers: ${totalVolunteers}`, 30, y); y+=6;
    doc.text(`•  Total New Applications: ${monthlyApplications.length}`, 30, y);

    // --- Helper to render a single event ---
    const renderEvent = async (doc, event) => {
      let y = 25;

      if (ngoLogo) {
        try {
          await addLogo(doc, pageW - 35, pageH - 35, 25, 25, 0.06);
        } catch {}
      }

      // Event title header
      doc.setFillColor(235, 247, 235);
      doc.roundedRect(14, y - 5, pageW - 28, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(event.event_title || "Untitled Event", 16, y);
      y += 10;

      // Try to add event image on right side
      const imageStartY = y;
      const { imageHeight, imageAdded } = await addEventImageRight(doc, event.event_image, imageStartY, pageW, pageH);

      // Calculate text width based on whether image was added
      const leftColWidth = imageAdded ? pageW - 90 : pageW - 32;

      // Helper to print key-value pairs
      const printKV = (label, value) => {
        if (y > pageH - 30) { doc.addPage(); y = 25; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, 16, y);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(String(value || "-"), leftColWidth - 24);
        wrapped.forEach((line, i) => {
          if (y + i * 5 > pageH - 30) { doc.addPage(); y = 25; }
          doc.text(line, 40, y + i * 5);
        });
        y += Math.max(6, wrapped.length * 5);
      };

      printKV("Event ID:", event.event_id || "-");
      printKV("Status:", event.status || "TBA");
      printKV("Date:", formatDate(event.date));
      printKV("Time:", `${formatTime(event.time_start)} – ${formatTime(event.time_end)}${calculateDuration(event.time_start, event.time_end) ? ` (${calculateDuration(event.time_start, event.time_end)})` : ""}`);
      printKV("Call Time:", event.call_time ? formatTime(event.call_time) : "TBA");
      printKV("Location:", event.location || "TBA");

      // Ensure we're past the image before starting sections
      if (imageAdded && y < imageStartY + imageHeight + 5) {
        y = imageStartY + imageHeight + 5;
      }

      // Define sections
      const sections = [
        { label: "Event Objectives:", content: splitToBullets(event.event_objectives) },
        { label: "Event Description:", content: event.description ? [event.description] : [] },
        { label: "What to Expect:", content: splitToBullets(event.what_expect) },
        { label: "Volunteer Guidelines:", content: splitToBullets(event.volunteer_guidelines) },
        { label: "Volunteer Opportunities:", content: splitToBullets(event.volunteer_opportunities) }
      ];

      // Render sections with full width now (image is above)
      const fullWidth = pageW - 32;
      for (const sec of sections) {
        if (sec.content.length > 0) {
          if (y > pageH - 30) { doc.addPage(); y = 25; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(sec.label, 16, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          sec.content.forEach((line) => {
            const wrapped = doc.splitTextToSize(line, fullWidth - 12);
            wrapped.forEach((ln) => {
              if (y > pageH - 30) { doc.addPage(); y = 25; }
              doc.text(`•  ${ln}`, 20, y);
              y += 5;
            });
          });
          y += 3;
        }
      }

      // Volunteer engagement stats
      const eventVols = eventUsers?.filter((v) => v.event_id === event.event_id) || [];
      if (eventVols.length > 0) {
        if (y > pageH - 30) { doc.addPage(); y = 25; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Volunteer Engagement:", 16, y); y += 6;
        doc.setFont("helvetica", "normal");
        const approved = eventVols.filter((v) => v.status === "APPROVED").length;
        const pending = eventVols.filter((v) => v.status === "PENDING").length;
        const rejected = eventVols.filter((v) => v.status === "REJECTED").length;
        doc.text(`•  Total Volunteers Joined: ${eventVols.length}`, 20, y); y+=5;
        doc.text(`•  Approved: ${approved}`, 20, y); y+=5;
        doc.text(`•  Pending: ${pending}`, 20, y); y+=5;
        doc.text(`•  Rejected: ${rejected}`, 20, y); y+=8;
      }
    };

    // --- Render events ---
    if (isAnnualReport) {
      const eventsByMonth = {};
      sortedEvents.forEach((e) => {
        const m = new Date(e.date).getMonth();
        if (!eventsByMonth[m]) eventsByMonth[m] = [];
        eventsByMonth[m].push(e);
      });

      for (const monthNum of Object.keys(eventsByMonth).sort((a,b)=>a-b)) {
        const monthName = new Date(selectedYear, monthNum).toLocaleString("default", { month: "long" });
        await createMonthSeparatorPage(doc, monthName, selectedYear, pageW, pageH);

        for (const event of eventsByMonth[monthNum]) {
          doc.addPage();
          await renderEvent(doc, event);
        }
      }
    } else {
      for (const event of sortedEvents) {
        doc.addPage();
        await renderEvent(doc, event);
      }
    }

    // --- FOOTER ---
    const totalPages = doc.internal.getNumberOfPages();
    const generatedDate = new Date().toLocaleString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
      doc.text(`Generated: ${generatedDate}`, 14, pageH - 10);
    }

    const fileName = isAnnualReport
      ? `${ngoName || "NGO"}_Annual_Report_${selectedYear}.pdf`
      : `${ngoName || "NGO"}_Monthly_Report_${selectedYear}-${selectedMonth}.pdf`;
    doc.save(fileName);
  };

  // ---------------------
  // UI rendering (unchanged)
  // ---------------------

  
  if (loading) {
    return (
      <div
        className="flex min-h-screen bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${CentroAdminBg})`,
          backgroundSize: "100% 100%",
        }}
      >
        <Sidebar handleButtonClick={handleButtonClick} activeButton={activeButton} />
        <main className="flex-1 ml-64 p-4 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900 mx-auto"></div>
              <p className="mt-4 text-emerald-900 font-semibold font-montserrat">Loading events...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar handleButtonClick={handleButtonClick} activeButton={activeButton} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-4 overflow-y-auto">
        <div id="manage_reports" className="relative z-10 space-y-6">
          {/* Search Bar and Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-300 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center border border-emerald-900 bg-emerald-100 rounded-full px-4 py-2 w-full max-w-md">
              <input
                type="text"
                placeholder="Search Event by Title or ID"
                className="bg-transparent outline-none flex-1 text-emerald-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="text-emerald-900 text-lg font-semibold">
                Total Events: <span className="font-bold">{filteredEvents.length}</span>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="bg-emerald-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-emerald-800 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </button>
            </div>
          </div>

          {/* Report Generation Modal */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-emerald-900">Generate Report</h2>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Month
                    </label>
                    <select
                      value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full border-2 border-emerald-900 rounded-lg px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select Month --</option>
                      <option value="all">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString("default", { month: "long" })}
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
                      {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateMonthlyReport}
                    className="flex-1 bg-emerald-900 text-white font-semibold px-4 py-3 rounded-lg hover:bg-emerald-800 transition"
                  >
                    Generate PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          {/* No Events Message */}
          {!loading && filteredEvents.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {searchQuery ? "No events found matching your search." : "No events found."}
              </p>
            </div>
          )}

          {/* Ongoing Events Section */}
          <div
            className="rounded-2xl shadow-lg p-6 border-2 border-gray-300 relative"
            style={{ backgroundColor: "#9dc5b0" }}
          >
            <div className="relative mt-2 mb-6">
              <h2 className="text-5xl font-extrabold font-montserrat text-white text-center">
                ONGOING EVENTS
              </h2>
              <img
                src={ExpandArrow}
                alt="Expand Ongoing"
                onClick={() => setShowOngoing(!showOngoing)}
                className={`w-6 h-6 absolute top-1 right-6 transform translate-y-1/2 cursor-pointer transition-transform duration-300 ${
                  showOngoing ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            {showOngoing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-lg">
                {ongoingEvents.length > 0 ? (
                  ongoingEvents.map((event, index) => renderEventCard(event, index))
                ) : (
                  <p className="col-span-full text-center text-white font-semibold">
                    No ongoing events available.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Events Section */}
          <div
            className="rounded-2xl shadow-lg p-6 mt-8 border-2 border-white relative"
            style={{ backgroundColor: "#ebe9d8" }}
          >
            <div className="flex justify-center items-center mt-2 mb-6 relative">
              <h2 className="text-5xl font-montserrat font-extrabold text-emerald-900 text-center">
                UPCOMING EVENTS
              </h2>
              <img
                src={ExpandArrow}
                alt="Expand Upcoming"
                onClick={() => setShowUpcoming(!showUpcoming)}
                className={`w-6 h-6 absolute top-1 right-6 transform translate-y-1/2 cursor-pointer transition-transform duration-300 ${
                  showUpcoming ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            {showUpcoming && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-lg">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, index) =>
                    renderEventCard(event, index + ongoingEvents.length)
                  )
                ) : (
                  <p className="col-span-full text-center text-emerald-900 font-semibold">
                    No upcoming events available.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Completed Events Section */}
          <div
            className="rounded-2xl shadow-lg p-6 mt-8 border-2 border-gray-400 relative"
            style={{ backgroundColor: "#d1d5db" }}
          >
            <div className="flex justify-center items-center mt-2 mb-6 relative">
              <h2 className="text-5xl font-montserrat font-extrabold text-gray-700 text-center">
                COMPLETED EVENTS
              </h2>
              <img
                src={ExpandArrow}
                alt="Expand Completed"
                onClick={() => setShowCompleted(!showCompleted)}
                className={`w-6 h-6 absolute top-1 right-6 transform translate-y-1/2 cursor-pointer transition-transform duration-300 ${
                  showCompleted ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            {showCompleted && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-lg">
                {completedEvents.length > 0 ? (
                  completedEvents.map((event, index) =>
                    renderEventCard(event, index + ongoingEvents.length + upcomingEvents.length)
                  )
                ) : (
                  <p className="col-span-full text-center text-gray-700 font-semibold">
                    No completed events available.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ManageReports;