import React, { useState, useEffect } from 'react';
import { Target, Clock, Settings, Edit3, Users, BarChart3, Upload, CalendarX, MapPin, Calendar } from 'lucide-react';

// ===== PASSWORD CONFIGURATION =====
// Change these passwords here for easy access
const PASSWORDS = {
  MASTER: 'safety2025',        // Master schedule access password
  STAFF: {
    Kyle: 'kdegoey25$',
    Mia: 'mia25$', 
    Tyler: 'tyrice25$',
    Mike: 'mike25$'
  }
};
// ===== END PASSWORD CONFIGURATION =====

const MasterScheduleSystem = () => {
  // State management
  const [darkMode, setDarkMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startDate = new Date(2024, 7, 4); // August 4th, 2024
    const diffTime = today.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, Math.min(4, diffWeeks + 1)); // Keep within 1-4 range
  });
  const [editMode, setEditMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPickupShifts, setShowPickupShifts] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [pickupSignups] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_pickupSignups');
    return saved ? JSON.parse(saved) : {};
  });
  const [showCallOffManager, setShowCallOffManager] = useState(false);
  const [callOffs, setCallOffs] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_callOffs');
    return saved ? JSON.parse(saved) : {};
  });
  const [ptoRequests, setPtoRequests] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_ptoRequests');
    return saved ? JSON.parse(saved) : {};
  });
  const [earlyArrivalRequests, setEarlyArrivalRequests] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_earlyArrivalRequests');
    return saved ? JSON.parse(saved) : {};
  });
  const [pickupRequests, setPickupRequests] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_pickupRequests');
    return saved ? JSON.parse(saved) : {};
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('master');
  const [selectedStaffView, setSelectedStaffView] = useState('Kyle');
  const [customHours, setCustomHours] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_customHours');
    return saved ? JSON.parse(saved) : {};
  });
  const [customTimes, setCustomTimes] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_customTimes');
    return saved ? JSON.parse(saved) : {};
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState({});
  const [showLogin, setShowLogin] = useState(true);
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [showRoster, setShowRoster] = useState(false);
  const [showSites, setShowSites] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', password: '', color: 'bg-blue-500' });
  const [newSite, setNewSite] = useState({ 
    name: '', 
    address: '', 
    startTime: '', 
    endTime: '', 
    saturdayStart: '', 
    saturdayEnd: '', 
    closedDays: [] 
  });
  const [pendingChanges, setPendingChanges] = useState({});
  const [editingTime, setEditingTime] = useState(null); // { day, location, field: 'start' | 'end' }

  // Force master view when calendar is open
  useEffect(() => {
    if (showCalendar && viewMode !== 'master') {
      setViewMode('master');
      console.log('Forcing master view in calendar');
    }
  }, [showCalendar, viewMode]);

  // Prevent view mode changes when calendar is open
  const handleViewModeChange = (newMode) => {
    if (showCalendar) {
      console.log('View mode change blocked - calendar is open');
      return;
    }
    setViewMode(newMode);
  };

  // Staff information
  const [staffInfo, setStaffInfo] = useState({
    Kyle: { color: 'bg-blue-500', textColor: 'bg-blue-500 text-white' },
    Mia: { color: 'bg-purple-500', textColor: 'bg-purple-500 text-white' },
    Tyler: { color: 'bg-green-500', textColor: 'bg-green-500 text-white' },
    Mike: { color: 'bg-orange-500', textColor: 'bg-orange-500 text-white' }
  });

  // Sites information
  const [sites, setSites] = useState({
    'Short North': {
      address: '123 Short North Ave, Columbus, OH 43215',
      startTime: '11:00a',
      endTime: '7:30p',
      saturdayStart: '9:00a',
      saturdayEnd: '3:30p',
      closedDays: ['Sunday'],
      icon: '🌆'
    },
    'KL': {
      address: '456 KL Business Center, Columbus, OH 43210',
      startTime: '11:00a',
      endTime: '7:30p',
      saturdayStart: '9:00a',
      saturdayEnd: '3:30p',
      closedDays: ['Sunday'],
      icon: '🏢'
    },
    'Safepoint': {
      address: '789 Safepoint Security, Columbus, OH 43201',
      startTime: '11:00a',
      endTime: '7:00p',
      saturdayStart: '9:00a',
      saturdayEnd: '2:00p',
      closedDays: ['Sunday', 'Monday'],
      icon: '🛡️'
    }
  });

  // Location icons (for backward compatibility)
  const locationIcons = {
    'Short North': '🌆',
    'KL': '🏢',
    'Safepoint': '🛡️'
  };

  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const locations = ['Short North', 'KL', 'Safepoint'];

  // Shift hours configuration
  const baseShiftHours = {
    'Short North': { start: '11:00a', end: '7:30p', duration: 8.5 },
    'KL': { start: '11:00a', end: '7:30p', duration: 8.5 },
    'Safepoint': { start: '11:00a', end: '7:00p', duration: 8.0 }
  };
  const saturdayHours = {
    'Short North': { start: '9:00a', end: '3:30p', duration: 6.5 },
    'KL': { start: '9:00a', end: '3:30p', duration: 6.5 },
    'Safepoint': { start: '9:00a', end: '2:00p', duration: 5.0 }
  };

  // Base schedule data
  const [baseSchedule, setBaseSchedule] = useState({
    1: {
      title: 'Week 1 - August 5-11',
      saturdayStaff: 'Kyle',
      assignments: {
        Monday: { 'Short North': 'Kyle', 'KL': 'Mia', 'Safepoint': null },
        Tuesday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
        Wednesday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
        Thursday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
        Friday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
        Saturday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Tyler' }
      }
    },
    2: {
      title: 'Week 2 - August 12-18',
      saturdayStaff: 'Tyler',
      assignments: {
        Monday: { 'Short North': 'Tyler', 'KL': 'Kyle', 'Safepoint': null },
        Tuesday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
        Wednesday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
        Thursday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Tyler' },
        Friday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
        Saturday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Mia' }
      }
    },
    3: {
      title: 'Week 3 - August 19-25',
      saturdayStaff: 'Mia',
      assignments: {
        Monday: { 'Short North': 'Mia', 'KL': 'Tyler', 'Safepoint': null },
        Tuesday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
        Wednesday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
        Thursday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
        Friday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
        Saturday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Kyle' }
      }
    },
    4: {
      title: 'Week 4 - August 26-September 1',
      saturdayStaff: 'Kyle',
      assignments: {
        Monday: { 'Short North': 'Kyle', 'KL': 'Mia', 'Safepoint': null },
        Tuesday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
        Wednesday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
        Thursday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
        Friday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
        Saturday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Tyler' }
      }
    }
  });

  // Date functions
  const getWeekDates = (weekNum) => {
    const startDate = new Date(2024, 7, 4); // August 4th, 2024 (Monday)
    const targetWeek = weekNum - 1;
    
    const monday = new Date(startDate);
    monday.setDate(monday.getDate() + (targetWeek * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const getWeekMonthYear = (weekNum) => {
    const dates = getWeekDates(weekNum);
    const firstDate = dates[0];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return { month: months[firstDate.getMonth()], year: firstDate.getFullYear() };
  };

  // Function to get the current week number based on today's date
  // eslint-disable-next-line no-unused-vars
  const getCurrentWeekNumber = () => {
    const today = new Date();
    const startDate = new Date(2024, 7, 4); // August 4th, 2024
    const diffTime = today.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, Math.min(4, diffWeeks + 1)); // Keep within 1-4 range
  };

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Authentication functions
  const handleMasterLogin = (password) => {
    if (password === PASSWORDS.MASTER) {
      setIsAuthenticated(true);
      setShowLogin(false);
    } else {
      alert('Incorrect password');
    }
  };

  const handleStaffLogin = (staff, password) => {
    if (password === PASSWORDS.STAFF[staff]) {
      setIsStaffAuthenticated(prev => ({
        ...prev,
        [staff]: true
      }));
      setLoggedInStaff(staff);
      setShowLogin(false);
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsStaffAuthenticated({});
    setLoggedInStaff(null);
    setShowLogin(true);
  };

  // Utility functions
  const isStaffOff = (staff, day, weekNum) => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    // Check call-offs
    const callOffList = callOffs[dateKey] || [];
    const isCallOff = callOffList.some(request => 
      typeof request === 'string' ? request === staff : request.staff === staff
    );
    
    // Check PTO requests
    const ptoList = ptoRequests[dateKey] || [];
    const isPTO = ptoList.some(request => 
      typeof request === 'string' ? request === staff : request.staff === staff
    );
    
    return isCallOff || isPTO;
  };

  const getAvailableStaff = (day, weekNum) => {
    return ['Kyle', 'Mia', 'Tyler', 'Mike'].filter(staff => !isStaffOff(staff, day, weekNum));
  };

  const getOperatingHours = (location, day) => {
    if (day === 'Saturday') {
      return saturdayHours[location];
    }
    return baseShiftHours[location];
  };

  const getShiftDuration = (day, location, weekNum) => {
    const shiftKey = `${weekNum}-${day}-${location}`;
    const customTime = getCustomShiftTime(day, location, weekNum);
    
    if (customTime && customTime.start && customTime.end) {
      const calculatedHours = calculateHoursFromTimes(customTime.start, customTime.end);
      return calculatedHours || (day === 'Saturday' ? saturdayHours[location].duration : baseShiftHours[location].duration);
    }
    
    return customHours[shiftKey] || (day === 'Saturday' ? saturdayHours[location].duration : baseShiftHours[location].duration);
  };

  const updateShiftDuration = (day, location, weekNum, newDuration) => {
    const shiftKey = `${weekNum}-${day}-${location}`;
    setCustomHours(prev => {
      const updated = {
        ...prev,
        [shiftKey]: newDuration
      };
      // Save to localStorage
      localStorage.setItem('safetySchedule_customHours', JSON.stringify(updated));
      return updated;
    });
  };

  const getCustomShiftTime = (day, location, weekNum) => {
    const shiftKey = `${weekNum}-${day}-${location}`;
    return customTimes[shiftKey];
  };



  const calculateHoursFromTimes = (startTime, endTime) => {
    console.log('calculateHoursFromTimes called with:', startTime, endTime);
    // Validate inputs
    if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') {
      console.log('Invalid inputs to calculateHoursFromTimes');
      return 0;
    }

    const parseTime = (timeStr) => {
      try {
        console.log('Parsing time:', timeStr, 'Type:', typeof timeStr, 'Length:', timeStr?.length);
        if (!timeStr || typeof timeStr !== 'string') {
          console.log('Invalid input');
          return null;
        }
        
        const cleanTime = timeStr.trim().toLowerCase();
        console.log('Cleaned time:', cleanTime, 'Length:', cleanTime.length);
        console.log('Clean time char codes:', [...cleanTime].map(c => c.charCodeAt(0)));
        
        // Simple regex to match time format (more flexible)
        const match = cleanTime.match(/^(\d{1,2}):(\d{2})([ap]m?)$/);
        console.log('Regex match result:', match);
        if (!match) {
          console.log('No match found');
          return null;
        }
        
        let hours = parseInt(match[1], 10);
        let minutes = parseInt(match[2], 10);
        const period = match[3];
        
        console.log('Extracted:', hours, minutes, period);
        
        // Validate
        if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
          console.log('Invalid values:', hours, minutes);
          return null;
        }
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        const result = hours + minutes / 60;
        console.log('Final result:', result);
        return result;
      } catch (error) {
        console.log('Error:', error);
        return null;
      }
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // Check if parsing failed
    if (start === null || end === null) {
      return 0;
    }
    
    let duration = end - start;
    
    if (duration < 0) duration += 24;
    
    // Ensure we don't return NaN
    const result = Math.round(duration * 10) / 10;
    return isNaN(result) ? 0 : result;
  };

  const getStaffSchedule = (staff, weekNum) => {
    const assignments = baseSchedule[weekNum].assignments;
    const staffShifts = [];
    
    days.forEach(day => {
      Object.entries(assignments[day] || {}).forEach(([location, assignedStaff]) => {
        if (assignedStaff === staff && !isStaffOff(staff, day, weekNum)) {
          const duration = getShiftDuration(day, location, weekNum);
          const customTime = getCustomShiftTime(day, location, weekNum);
          staffShifts.push({
            day,
            location,
            duration,
            shiftHours: customTime || (day === 'Saturday' ? saturdayHours[location] : baseShiftHours[location])
          });
        }
      });
    });
    
    return staffShifts;
  };

  const calculateBaseHours = (weekNum) => {
    const assignments = baseSchedule[weekNum].assignments;
    const hours = { Kyle: 0, Mia: 0, Tyler: 0, Mike: 0 };
    
    days.forEach(day => {
      Object.entries(assignments[day] || {}).forEach(([location, staff]) => {
        if (staff && !isStaffOff(staff, day, weekNum)) {
          const duration = getShiftDuration(day, location, weekNum);
          // Ensure we don't add NaN values
          if (!isNaN(duration) && duration > 0) {
            hours[staff] += duration;
          }
        }
      });
    });
    
    return hours;
  };

  const assignBaseShift = (day, location, staff) => {
    setBaseSchedule(prev => ({
      ...prev,
      [currentWeek]: {
        ...prev[currentWeek],
        assignments: {
          ...prev[currentWeek].assignments,
          [day]: {
            ...prev[currentWeek].assignments[day],
            [location]: staff
          }
        }
      }
    }));
  };

  // Roster management functions
  const addOfficer = () => {
    if (newOfficer.name && newOfficer.password) {
      const officerName = newOfficer.name;
      setStaffInfo(prev => ({
        ...prev,
        [officerName]: { 
          color: newOfficer.color, 
          textColor: `${newOfficer.color} text-white` 
        }
      }));
      
      // Add to passwords
      PASSWORDS.STAFF[officerName] = newOfficer.password;
      
      // Reset form
      setNewOfficer({ name: '', password: '', color: 'bg-blue-500' });
      setShowRoster(false);
    }
  };

  const removeOfficer = (officerName) => {
    if (officerName !== 'Mike' && officerName !== 'Kyle' && officerName !== 'Mia' && officerName !== 'Tyler') {
      setStaffInfo(prev => {
        const newStaffInfo = { ...prev };
        delete newStaffInfo[officerName];
        return newStaffInfo;
      });
      
      // Remove from passwords
      delete PASSWORDS.STAFF[officerName];
    }
  };

  const saveShiftChanges = (day, location, weekNum, changes = null) => {
    console.log('Save function called for:', day, location, weekNum);
    const changeKey = `${weekNum}-${day}-${location}`;
    console.log('Change key:', changeKey);
    
    // Use passed changes or fall back to pending changes
    const changesToApply = changes || pendingChanges[changeKey];
    console.log('Changes to apply:', changesToApply);
    
    if (changesToApply) {
      console.log('Found changes to apply:', changesToApply);
      // Apply the changes
      if (changesToApply.time) {
        console.log('Saving time changes:', changesToApply.time);
        setCustomTimes(prev => {
          const updated = {
            ...prev,
            [changeKey]: changesToApply.time
          };
          // Save to localStorage
          localStorage.setItem('safetySchedule_customTimes', JSON.stringify(updated));
          return updated;
        });
        
        // Calculate and save the hours from the times
        if (changesToApply.time.start && changesToApply.time.end) {
          const calculatedHours = calculateHoursFromTimes(changesToApply.time.start, changesToApply.time.end);
          console.log('Calculated hours:', calculatedHours);
          updateShiftDuration(day, location, weekNum, calculatedHours);
        }
      }
      
      // Clear pending changes if not using passed changes
      if (!changes) {
        setPendingChanges(prev => {
          const newPending = { ...prev };
          delete newPending[changeKey];
          return newPending;
        });
      }
      console.log('Changes saved and cleared');
    } else {
      console.log('No changes found to apply');
    }
  };

  const hasPendingChanges = (day, location, weekNum) => {
    const changeKey = `${weekNum}-${day}-${location}`;
    return !!pendingChanges[changeKey];
  };

  const handleInlineTimeEdit = (day, location, field, value) => {
    console.log('handleInlineTimeEdit called:', day, location, field, value);
    const currentTime = getCustomShiftTime(day, location, currentWeek) || { start: '', end: '' };
    const newTime = { ...currentTime, [field]: value };
    
    // Store as pending change for display
    const changeKey = `${currentWeek}-${day}-${location}`;
    setPendingChanges(prev => ({
      ...prev,
      [changeKey]: { ...prev[changeKey], time: newTime }
    }));
    
    // Auto-save immediately with the changes
    const changesToSave = { time: newTime };
    if (newTime.start && newTime.end) {
      const calculatedHours = calculateHoursFromTimes(newTime.start, newTime.end);
      changesToSave.duration = calculatedHours;
    }
    saveShiftChanges(day, location, currentWeek, changesToSave);
  };

  const currentSchedule = baseSchedule[currentWeek];
  const baseHours = calculateBaseHours(currentWeek);
  const currentMonthYear = getWeekMonthYear(currentWeek);
  const theme = darkMode ? 'dark' : '';

  // Render login screen
  if (showLogin) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} p-6 ${theme}`}>
        <div className="max-w-md mx-auto mt-20">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
            <div className="text-center mb-8">
              <div className="p-3 bg-indigo-600 rounded-xl inline-block mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Safety Schedule Login
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                Enter your password to access the schedule
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  const password = prompt('Enter master password:');
                  if (password) handleMasterLogin(password);
                }}
                className="w-full p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                🔐 Master Schedule Access
              </button>

              <div className="text-center text-sm text-gray-500">or</div>

              <div className="space-y-2">
                {['Kyle', 'Mia', 'Tyler', 'Mike'].map(staff => (
                  <button
                    key={staff}
                    onClick={() => {
                      const password = prompt(`Enter ${staff}'s password:`);
                      if (password) handleStaffLogin(staff, password);
                    }}
                    className={`w-full p-3 rounded-lg transition-colors font-medium ${staffInfo[staff].textColor} hover:opacity-80`}
                  >
                    👤 {staff}'s Schedule
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main application
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'}`}>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
                      <div className="flex items-center justify-center gap-3 mb-3 lg:mb-4">
              <div className="p-2 lg:p-3 bg-red-600 rounded-xl">
                <Target className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            <h1 className={`text-2xl lg:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {isAuthenticated ? '40-Hour Master Schedule' : `${Object.keys(isStaffAuthenticated).find(staff => isStaffAuthenticated[staff])}'s Schedule`}
            </h1>
          </div>
          <p className={`text-base lg:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isAuthenticated ? 'Base schedule targeting 40 hours + voluntary pickup shifts' : 'Personal schedule view'}
          </p>
          <p className={`text-xs lg:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-500'} mt-1 lg:mt-2`}>
            {currentMonthYear.month} {currentMonthYear.year} • 4-Week Rotation • Start: Monday, August 4th, 2024
          </p>
          {!isAuthenticated && (
            <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-yellow-900 bg-opacity-30 border border-yellow-600' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className={`text-xs ${darkMode ? 'text-yellow-100' : 'text-yellow-800'}`}>
                ⚠️ <strong>Important:</strong> Schedules may change periodically. Please check this app daily for updates, 
                especially for call-offs, PTO requests, and pickup opportunities. Your schedule is subject to change 
                based on operational needs and staff availability.
              </p>
            </div>
          )}
          {isAuthenticated && (
            <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-30 border border-blue-600' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs ${darkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                📅 <strong>Current Week:</strong> Week {currentWeek} of 4 • {currentMonthYear.month} {currentMonthYear.year} • 
                Schedule automatically progresses through months. The 4-week rotation repeats continuously.
              </p>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="mt-3 lg:mt-4 px-3 lg:px-4 py-1.5 lg:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs lg:text-sm"
          >
            🔓 Logout
          </button>
        </div>

        {/* Control Panel */}
        <div className="flex flex-wrap justify-center gap-2 lg:gap-4 mt-4 lg:mt-6">
          {/* Master-only controls */}
          {isAuthenticated && (
            <>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  editMode ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Edit3 className="w-3 h-3 lg:w-4 lg:h-4" />
                {editMode ? 'Exit Edit' : 'Edit Schedule'}
              </button>

              <button
                onClick={() => handleViewModeChange(viewMode === 'master' ? 'individual' : 'master')}
                disabled={showCalendar}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  viewMode === 'individual' ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${showCalendar ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                {viewMode === 'master' ? 'Individual View' : 'Master View'}
                {showCalendar && ' (Disabled in Calendar)'}
              </button>

              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  showAnalytics ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4" />
                Analytics
              </button>

              <button
                onClick={() => setShowPickupShifts(!showPickupShifts)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  showPickupShifts ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-3 h-3 lg:w-4 lg:h-4" />
                Pickup Shifts
              </button>

              <button
                onClick={() => setShowCallOffManager(!showCallOffManager)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  showCallOffManager ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CalendarX className="w-3 h-3 lg:w-4 lg:h-4" />
                Call-Off Manager
              </button>

              <button
                onClick={() => setShowRoster(!showRoster)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  showRoster ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                Roster
              </button>

              <button
                onClick={() => setShowSites(!showSites)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  showSites ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-3 h-3 lg:w-4 lg:h-4" />
                Sites
              </button>

              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  showCalendar ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                Calendar
              </button>
            </>
          )}

          {/* Staff-only controls */}
          {loggedInStaff && !isAuthenticated && (
            <div className={`text-xs lg:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Viewing {loggedInStaff}'s personal schedule
            </div>
          )}
        </div>

        {/* Roster Management Panel */}
        {showRoster && isAuthenticated && (
          <div className={`mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Users className="w-5 h-5" />
              Roster Management
            </h3>
            
            {/* Add New Officer */}
            <div className="mb-6">
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Add New Officer</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Officer Name"
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer(prev => ({ ...prev, name: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newOfficer.password}
                  onChange={(e) => setNewOfficer(prev => ({ ...prev, password: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <select
                  value={newOfficer.color}
                  onChange={(e) => setNewOfficer(prev => ({ ...prev, color: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-red-500">Red</option>
                  <option value="bg-pink-500">Pink</option>
                  <option value="bg-indigo-500">Indigo</option>
                </select>
                <button
                  onClick={addOfficer}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Add Officer
                </button>
              </div>
            </div>

            {/* Current Officers */}
            <div>
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Officers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(staffInfo).map(([name, info]) => (
                  <div key={name} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${info.color}`}></div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</span>
                      </div>
                      {name !== 'Mike' && name !== 'Kyle' && name !== 'Mia' && name !== 'Tyler' && (
                        <button
                          onClick={() => removeOfficer(name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sites Management Panel */}
        {showSites && isAuthenticated && (
          <div className={`mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <MapPin className="w-5 h-5" />
              Sites Management
            </h3>
            
            {/* Add New Site */}
            <div className="mb-6">
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Add New Site</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Site Name"
                  value={newSite.name}
                  onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newSite.address}
                  onChange={(e) => setNewSite(prev => ({ ...prev, address: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <input
                  type="text"
                  placeholder="Start Time (e.g., 11:00a)"
                  value={newSite.startTime}
                  onChange={(e) => setNewSite(prev => ({ ...prev, startTime: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <input
                  type="text"
                  placeholder="End Time (e.g., 7:30p)"
                  value={newSite.endTime}
                  onChange={(e) => setNewSite(prev => ({ ...prev, endTime: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <input
                  type="text"
                  placeholder="Saturday Start (e.g., 9:00a)"
                  value={newSite.saturdayStart}
                  onChange={(e) => setNewSite(prev => ({ ...prev, saturdayStart: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <input
                  type="text"
                  placeholder="Saturday End (e.g., 3:30p)"
                  value={newSite.saturdayEnd}
                  onChange={(e) => setNewSite(prev => ({ ...prev, saturdayEnd: e.target.value }))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Closed Days:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <label key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newSite.closedDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSite(prev => ({ ...prev, closedDays: [...prev.closedDays, day] }));
                            } else {
                              setNewSite(prev => ({ ...prev, closedDays: prev.closedDays.filter(d => d !== day) }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button
                    onClick={() => {
                      if (newSite.name && newSite.address && newSite.startTime && newSite.endTime) {
                        const newSiteData = {
                          ...newSite,
                          icon: '🏢' // Default icon
                        };
                        setSites(prev => ({ ...prev, [newSite.name]: newSiteData }));
                        setNewSite({ 
                          name: '', 
                          address: '', 
                          startTime: '', 
                          endTime: '', 
                          saturdayStart: '', 
                          saturdayEnd: '', 
                          closedDays: [] 
                        });
                        alert('Site added successfully!');
                      } else {
                        alert('Please fill in all required fields (Name, Address, Start Time, End Time)');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Add Site
                  </button>
                </div>
              </div>
            </div>

            {/* Current Sites */}
            <div>
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Sites</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sites).map(([name, site]) => (
                  <div key={name} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{site.icon}</span>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</span>
                      </div>
                      {name !== 'Short North' && name !== 'KL' && name !== 'Safepoint' && (
                        <button
                          onClick={() => {
                            setSites(prev => {
                              const updated = { ...prev };
                              delete updated[name];
                              return updated;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        📍 {site.address}
                      </div>
                      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        🕐 Mon-Fri: {site.startTime} - {site.endTime}
                      </div>
                      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        🕐 Sat: {site.saturdayStart} - {site.saturdayEnd}
                      </div>
                      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        ❌ Closed: {site.closedDays.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

                {/* Calendar View Panel */}
        {showCalendar && isAuthenticated && (
          <div 
            className={`mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
            onClick={(e) => {
              // Prevent any navigation when in calendar view
              e.stopPropagation();
              // Force master view and prevent any view mode changes
              if (viewMode !== 'master') {
                setViewMode('master');
                console.log('Forcing master view from calendar click');
              }
              console.log('Calendar view clicked - preventing navigation');
            }}
          >
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Calendar className="w-5 h-5" />
              Full Calendar View
            </h3>
            
            {/* Calendar Navigation */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  ← Previous Week
                </button>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Week {currentWeek} of 4
                </span>
                <button
                  onClick={() => setCurrentWeek(Math.min(4, currentWeek + 1))}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Next Week →
                </button>
              </div>
              
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentMonthYear.month} {currentMonthYear.year}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header Row */}
                <div className="grid grid-cols-9 gap-2 mb-2">
                  <div className={`p-2 font-semibold text-center ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                    Employee
                  </div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <div key={day} className={`p-2 font-semibold text-center ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Date Row */}
                <div className="grid grid-cols-9 gap-2 mb-4">
                  <div className={`p-2 text-center ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                    Week Total
                  </div>
                  {getWeekDates(currentWeek).map((date, index) => (
                    <div key={index} className={`p-2 text-center ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                      {formatDate(date)}
                    </div>
                  ))}
                </div>

                {/* Staff Rows */}
                {['Kyle', 'Mia', 'Tyler', 'Mike'].map(staff => {
                  const weeklyHours = calculateBaseHours(currentWeek)[staff];
                  return (
                    <div key={staff} className="grid grid-cols-9 gap-2 mb-4">
                      <div className={`p-3 font-semibold ${staffInfo[staff].textColor} rounded-lg flex items-center justify-between`}>
                        <span>{staff}</span>
                        <span className="text-xs opacity-90">
                          {weeklyHours >= 40 ? '🟢' : weeklyHours >= 30 ? '🟡' : '🔴'} {weeklyHours}h
                        </span>
                      </div>
                      {days.map((day, dayIndex) => {
                        const weekDates = getWeekDates(currentWeek);
                        const date = weekDates[dayIndex];
                        // eslint-disable-next-line no-unused-vars
                        const dateKey = date.toISOString().split('T')[0];
                        const isOff = isStaffOff(staff, day, currentWeek);
                        
                        // Get staff's assignment for this day
                        const location = baseSchedule[currentWeek]?.assignments[day] ? 
                          Object.keys(baseSchedule[currentWeek].assignments[day]).find(loc => 
                            baseSchedule[currentWeek].assignments[day][loc] === staff
                          ) : null;
                        
                        const shiftDuration = location ? getShiftDuration(day, location, currentWeek) : 0;
                        const customTime = location ? getCustomShiftTime(day, location, currentWeek) : null;
                        const operatingHours = location ? getOperatingHours(location, day) : null;
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className={`p-3 rounded-lg border ${
                              isOff ? 'bg-red-100 border-red-300' :
                              location ? `${staffInfo[staff].color} text-white` :
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                            }`}
                            onClick={(e) => {
                              // Prevent navigation when clicking on calendar cells
                              e.stopPropagation();
                              console.log('Calendar cell clicked:', day, location, staff);
                            }}
                          >
                            {isOff ? (
                              <div className="text-center">
                                <div className="text-xs font-semibold text-red-600">OFF</div>
                                <div className="text-xs text-red-500">Requested</div>
                              </div>
                            ) : location ? (
                              <div className="text-center">
                                <div className="text-xs font-semibold">{location}</div>
                                <div className="text-xs opacity-90">
                                  {(() => {
                                    const isEditing = editingTime && editingTime.day === day && editingTime.location === location;
                                    const timeText = customTime ? `${customTime.start}-${customTime.end}` : 
                                                   operatingHours ? `${operatingHours.start}-${operatingHours.end}` : '';
                                    
                                    if (isEditing && editingTime.field === 'start') {
                                      return (
                                        <input
                                          type="text"
                                          placeholder="7:30a"
                                          value={customTime?.start || operatingHours?.start || ''}
                                          onChange={(e) => handleInlineTimeEdit(day, location, 'start', e.target.value)}
                                          onBlur={() => setEditingTime(null)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              setEditingTime(null);
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                          autoFocus
                                        />
                                      );
                                    } else if (isEditing && editingTime.field === 'end') {
                                      return (
                                        <span>
                                          {customTime?.start || operatingHours?.start || ''} - 
                                          <input
                                            type="text"
                                            placeholder="7:30p"
                                            value={customTime?.end || operatingHours?.end || ''}
                                            onChange={(e) => handleInlineTimeEdit(day, location, 'end', e.target.value)}
                                            onBlur={() => setEditingTime(null)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                setEditingTime(null);
                                              }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold ml-1"
                                            autoFocus
                                          />
                                        </span>
                                      );
                                    } else {
                                      console.log('Calendar time display:', day, location, timeText);
                                      
                                      // If timeText is empty or doesn't contain a dash, show default times
                                      if (!timeText || !timeText.includes('-')) {
                                        const defaultStart = operatingHours?.start || '7:30a';
                                        const defaultEnd = operatingHours?.end || '7:30p';
                                        return (
                                          <span className="cursor-pointer hover:bg-white hover:bg-opacity-20 px-1 rounded border border-dashed border-white border-opacity-50">
                                            <span 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Calendar start time clicked (default):', day, location);
                                                setEditingTime({ day, location, field: 'start' });
                                              }}
                                              className="hover:underline"
                                              title="Click to edit start time"
                                            >
                                              {defaultStart}
                                            </span>
                                            {' - '}
                                            <span 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Calendar end time clicked (default):', day, location);
                                                setEditingTime({ day, location, field: 'end' });
                                              }}
                                              className="hover:underline"
                                              title="Click to edit end time"
                                            >
                                              {defaultEnd}
                                            </span>
                                          </span>
                                        );
                                      }
                                      
                                      const [startTime, endTime] = timeText.split('-');
                                      return (
                                        <span className="cursor-pointer hover:bg-white hover:bg-opacity-20 px-1 rounded border border-dashed border-white border-opacity-50">
                                          <span 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log('Calendar start time clicked:', day, location);
                                              setEditingTime({ day, location, field: 'start' });
                                            }}
                                            className="hover:underline"
                                            title="Click to edit start time"
                                          >
                                            {startTime || 'Click to set'}
                                          </span>
                                          {' - '}
                                          <span 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log('Calendar end time clicked:', day, location);
                                              setEditingTime({ day, location, field: 'end' });
                                            }}
                                            className="hover:underline"
                                            title="Click to edit end time"
                                          >
                                            {endTime || 'Click to set'}
                                          </span>
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                                <div className="text-xs opacity-90">{shiftDuration}h</div>
                              </div>
                            ) : (
                              <div className="text-center text-xs opacity-70">No Shift</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Call-Off & PTO Manager Panel */}
        {showCallOffManager && isAuthenticated && (
          <div className={`mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <CalendarX className="w-5 h-5" />
              Call-Off & PTO Manager
            </h3>
            
            {/* Add Request */}
            <div className="mb-6">
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Add Request</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="date"
                  onChange={(e) => setCurrentDate(new Date(e.target.value))}
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
                <select
                  id="requestType"
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                >
                  <option value="">Request Type</option>
                  <option value="calloff">Call-Off</option>
                  <option value="pto">PTO Request</option>
                </select>
                <select
                  id="staffSelect"
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                >
                  <option value="">Select Staff</option>
                  {Object.keys(staffInfo).map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
                <input
                  type="text"
                  id="reasonInput"
                  placeholder="Reason (optional)"
                  className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const dateKey = currentDate.toISOString().split('T')[0];
                    const requestType = document.getElementById('requestType').value;
                    const staff = document.getElementById('staffSelect').value;
                    const reason = document.getElementById('reasonInput').value;
                    
                    if (!requestType || !staff) return;
                    
                    const request = {
                      type: requestType,
                      staff: staff,
                      reason: reason || 'No reason provided',
                      date: dateKey,
                      timestamp: new Date().toISOString()
                    };
                    
                    if (requestType === 'calloff') {
                      setCallOffs(prev => {
                        const updated = {
                          ...prev,
                          [dateKey]: [...(prev[dateKey] || []), request]
                        };
                        localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
                        return updated;
                      });
                                          } else if (requestType === 'pto') {
                        setPtoRequests(prev => {
                          const updated = {
                            ...prev,
                            [dateKey]: [...(prev[dateKey] || []), request]
                          };
                          localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
                          return updated;
                        });
                      } else if (requestType === 'pickup') {
                        setPickupRequests(prev => {
                          const updated = {
                            ...prev,
                            [dateKey]: [...(prev[dateKey] || []), request]
                          };
                          localStorage.setItem('safetySchedule_pickupRequests', JSON.stringify(updated));
                          return updated;
                        });
                      }
                    
                    // Clear inputs
                    document.getElementById('requestType').value = '';
                    document.getElementById('staffSelect').value = '';
                    document.getElementById('reasonInput').value = '';
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Add Request
                </button>
              </div>
            </div>

            {/* Current Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call-Offs */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Call-Offs ({Object.values(callOffs).flat().length})
                </h4>
                <div className="space-y-3">
                  {Object.entries(callOffs).map(([date, requests]) => (
                    <div key={date} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setCallOffs(prev => {
                              const updated = { ...prev };
                              delete updated[date];
                              localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {requests.map((request, index) => (
                          <div key={index} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {typeof request === 'string' ? request : request.staff}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Approve the request
                                    const approvedRequest = {
                                      ...request,
                                      status: 'approved',
                                      approvedAt: new Date().toISOString()
                                    };
                                    
                                    // Update the request status
                                    setCallOffs(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].map((req, i) => i === index ? approvedRequest : req)
                                      };
                                      localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
                                      return updated;
                                    });
                                    
                                    alert(`Approved ${request.staff}'s call-off request`);
                                  }}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    // Deny the request
                                    const deniedRequest = {
                                      ...request,
                                      status: 'denied',
                                      deniedAt: new Date().toISOString()
                                    };
                                    
                                    setCallOffs(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].map((req, i) => i === index ? deniedRequest : req)
                                      };
                                      localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
                                      return updated;
                                    });
                                    
                                    alert(`Denied ${request.staff}'s call-off request`);
                                  }}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Deny
                                </button>
                                <button
                                  onClick={() => {
                                    setCallOffs(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].filter((_, i) => i !== index)
                                      };
                                      if (updated[date].length === 0) {
                                        delete updated[date];
                                      }
                                      localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {typeof request === 'object' && request.reason && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Reason: {request.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PTO Requests */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  PTO Requests ({Object.values(ptoRequests).flat().length})
                </h4>
                <div className="space-y-3">
                  {Object.entries(ptoRequests).map(([date, requests]) => (
                    <div key={date} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setPtoRequests(prev => {
                              const updated = { ...prev };
                              delete updated[date];
                              localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {requests.map((request, index) => (
                          <div key={index} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {typeof request === 'string' ? request : request.staff}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Approve the request
                                    const approvedRequest = {
                                      ...request,
                                      status: 'approved',
                                      approvedAt: new Date().toISOString()
                                    };
                                    
                                    setPtoRequests(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].map((req, i) => i === index ? approvedRequest : req)
                                      };
                                      localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
                                      return updated;
                                    });
                                    
                                    alert(`Approved ${request.staff}'s PTO request`);
                                  }}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    // Deny the request
                                    const deniedRequest = {
                                      ...request,
                                      status: 'denied',
                                      deniedAt: new Date().toISOString()
                                    };
                                    
                                    setPtoRequests(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].map((req, i) => i === index ? deniedRequest : req)
                                      };
                                      localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
                                      return updated;
                                    });
                                    
                                    alert(`Denied ${request.staff}'s PTO request`);
                                  }}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Deny
                                </button>
                                <button
                                  onClick={() => {
                                    setPtoRequests(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].filter((_, i) => i !== index)
                                      };
                                      if (updated[date].length === 0) {
                                        delete updated[date];
                                      }
                                      localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {typeof request === 'object' && request.reason && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Reason: {request.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Early Arrival Requests */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Early Arrival Requests ({Object.values(earlyArrivalRequests).flat().length})
                </h4>
                <div className="space-y-3">
                  {Object.entries(earlyArrivalRequests).map(([date, requests]) => (
                    <div key={date} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setEarlyArrivalRequests(prev => {
                              const updated = { ...prev };
                              delete updated[date];
                              localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {requests.map((request, index) => (
                          <div key={index} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {request.staff} - {request.location}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Approve the request
                                    const approvedRequest = {
                                      ...request,
                                      status: 'approved',
                                      approvedAt: new Date().toISOString()
                                    };
                                    
                                    setEarlyArrivalRequests(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].map((req, i) => i === index ? approvedRequest : req)
                                      };
                                      localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
                                      return updated;
                                    });
                                    
                                    alert(`Approved ${request.staff}'s early arrival request`);
                                  }}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    // Deny the request
                                    const deniedRequest = {
                                      ...request,
                                      status: 'denied',
                                      deniedAt: new Date().toISOString()
                                    };
                                    
                                    setEarlyArrivalRequests(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].map((req, i) => i === index ? deniedRequest : req)
                                      };
                                      localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
                                      return updated;
                                    });
                                    
                                    alert(`Denied ${request.staff}'s early arrival request`);
                                  }}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Deny
                                </button>
                                <button
                                  onClick={() => {
                                    setEarlyArrivalRequests(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].filter((_, i) => i !== index)
                                      };
                                      if (updated[date].length === 0) {
                                        delete updated[date];
                                      }
                                      localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {request.time ? (
                                <div>Requested Time: {request.time} ({request.hours}h)</div>
                              ) : (
                                <div>Current: {request.currentStart} → Requested: {request.requestedStart}</div>
                              )}
                              {request.reason && <div>Reason: {request.reason}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pickup Requests */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pickup Requests ({Object.values(pickupRequests).flat().length})
                </h4>
                <div className="space-y-3">
                  {Object.entries(pickupRequests).map(([date, requests]) => (
                    <div key={date} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setPickupRequests(prev => {
                              const updated = { ...prev };
                              delete updated[date];
                              localStorage.setItem('safetySchedule_pickupRequests', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {requests.map((request, index) => (
                          <div key={index} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {typeof request === 'string' ? request : request.staff}
                              </span>
                              <button
                                onClick={() => {
                                  setPickupRequests(prev => {
                                    const updated = {
                                      ...prev,
                                      [date]: prev[date].filter((_, i) => i !== index)
                                    };
                                    if (updated[date].length === 0) {
                                      delete updated[date];
                                    }
                                    localStorage.setItem('safetySchedule_pickupRequests', JSON.stringify(updated));
                                    return updated;
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            {typeof request === 'object' && request.reason && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Reason: {request.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex justify-center mt-6">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-2 flex gap-2`}>
            {[1, 2, 3, 4].map(week => (
              <button
                key={week}
                onClick={() => setCurrentWeek(week)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentWeek === week
                    ? 'bg-red-600 text-white shadow-lg transform scale-105'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                Week {week}
              </button>
            ))}
          </div>
        </div>

        {/* Individual Staff Selector */}
        {viewMode === 'individual' && (
          <div className="flex justify-center mb-6">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-2 flex gap-2`}>
              {['Kyle', 'Mia', 'Tyler', 'Mike'].map((staff) => (
                <button
                  key={staff}
                  onClick={() => setSelectedStaffView(staff)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    selectedStaffView === staff
                      ? `${staffInfo[staff].color} text-white shadow-lg transform scale-105`
                      : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${staffInfo[staff].color.replace('bg-', 'bg-')}`}></div>
                  {staff}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards - Master Only */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(baseHours).map(([staff, hours]) => (
              <div
                key={staff}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${staffInfo[staff].textColor}`}>
                    {staff}
                  </span>
                  <Target className={`w-5 h-5 ${hours >= 40 ? 'text-green-500' : 'text-yellow-500'}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{isNaN(hours) ? '0' : hours}</span>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>total hrs</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Base: {isNaN(hours) ? '0' : hours}hrs
                    </div>
                    <div className={`font-semibold ${(isNaN(hours) ? 0 : hours) >= 40 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {(isNaN(hours) ? 0 : hours) >= 40 ? '✓ Target met' : `Need ${40 - (isNaN(hours) ? 0 : hours)} more`}
                    </div>
                  </div>
                </div>
                {currentSchedule.saturdayStaff === staff && (
                  <div className="mt-2 text-xs text-yellow-600 font-semibold">
                    🎉 Saturday KL Duty
                  </div>
                )}
                {staff === 'Mike' && (
                  <div className="mt-2 text-xs text-green-600 font-semibold">
                    🌆 Every Saturday (Short North)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Schedule Grid */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden`}>
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="w-6 h-6" />
              {viewMode === 'master' ? `${currentSchedule.title} - Base Schedule` : `${selectedStaffView}'s Schedule - Week ${currentWeek}`}
              {editMode && (
                <span className="text-sm bg-white bg-opacity-25 px-2 py-1 rounded-full">
                  Edit Mode
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {/* Staff member logged in - show only their schedule */}
            {loggedInStaff && !isAuthenticated ? (
              <div className="space-y-4">
                                  <div className={`p-4 rounded-lg ${staffInfo[loggedInStaff].color} text-white`}>
                    <h3 className="text-lg font-semibold mb-2">{loggedInStaff}'s Schedule - Week {currentWeek}</h3>
                    
                    {/* Request Status Log */}
                    <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                      <h4 className="font-semibold mb-2">📋 My Request Status</h4>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const allRequests = [];
                          
                          // Get call-off requests
                          Object.entries(callOffs).forEach(([date, requests]) => {
                            requests.forEach(request => {
                              if (typeof request === 'object' && request.staff === loggedInStaff) {
                                allRequests.push({
                                  type: 'Call-Off',
                                  date: date,
                                  status: request.status || 'pending',
                                  reason: request.reason,
                                  timestamp: request.timestamp
                                });
                              }
                            });
                          });
                          
                          // Get PTO requests
                          Object.entries(ptoRequests).forEach(([date, requests]) => {
                            requests.forEach(request => {
                              if (typeof request === 'object' && request.staff === loggedInStaff) {
                                allRequests.push({
                                  type: 'PTO Request',
                                  date: date,
                                  status: request.status || 'pending',
                                  reason: request.reason,
                                  timestamp: request.timestamp
                                });
                              }
                            });
                          });
                          
                          // Get pickup requests
                          Object.entries(pickupRequests).forEach(([date, requests]) => {
                            requests.forEach(request => {
                              if (typeof request === 'object' && request.staff === loggedInStaff) {
                                allRequests.push({
                                  type: 'Pickup Request',
                                  date: date,
                                  status: request.status || 'pending',
                                  reason: request.reason,
                                  time: request.time,
                                  timestamp: request.timestamp
                                });
                              }
                            });
                          });
                          
                          // Get early arrival requests
                          Object.entries(earlyArrivalRequests).forEach(([date, requests]) => {
                            requests.forEach(request => {
                              if (typeof request === 'object' && request.staff === loggedInStaff) {
                                allRequests.push({
                                  type: 'Early Arrival',
                                  date: date,
                                  status: request.status || 'pending',
                                  reason: request.reason,
                                  time: request.time,
                                  timestamp: request.timestamp
                                });
                              }
                            });
                          });
                          
                          // Sort by timestamp (newest first)
                          allRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                          
                          if (allRequests.length === 0) {
                            return <div className="text-gray-300">No requests submitted yet.</div>;
                          }
                          
                                                     return allRequests.slice(0, 5).map((request, index) => (
                             <div key={index} className="flex items-center justify-between p-2 bg-white bg-opacity-10 rounded">
                               <div>
                                 <div className="font-medium">{request.type}</div>
                                 <div className="text-xs opacity-90">
                                   {new Date(request.date).toLocaleDateString()}
                                   {request.time && ` • ${request.time}`}
                                 </div>
                                 {request.reason && <div className="text-xs opacity-80">Reason: {request.reason}</div>}
                               </div>
                              <div className={`text-xs px-2 py-1 rounded font-semibold ${
                                request.status === 'approved' ? 'bg-green-600 text-white' :
                                request.status === 'denied' ? 'bg-red-600 text-white' :
                                'bg-yellow-600 text-white'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  <div className="text-sm opacity-90">
                    Total Hours: {calculateBaseHours(currentWeek)[loggedInStaff]} / 40 target
                  </div>
                  {calculateBaseHours(currentWeek)[loggedInStaff] < 40 && (
                    <div className="mt-3 p-3 bg-white bg-opacity-20 rounded-lg">
                      <div className="text-sm font-semibold mb-2">💡 Pickup Opportunities:</div>
                      <div className="text-xs space-y-1">
                        <div>• You're under 40 hours this week</div>
                        <div>• Submit pickup requests for additional shifts</div>
                        <div>• Consider offering to come in early on your scheduled shifts</div>
                        <div>• Check with management for available pickup opportunities</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getStaffSchedule(loggedInStaff, currentWeek).map((shift, index) => {
                    const date = getWeekDates(currentWeek)[days.indexOf(shift.day)];
                    const operatingHours = getOperatingHours(shift.location, shift.day);
                    const customTime = getCustomShiftTime(shift.day, shift.location, currentWeek);
                    const actualStartTime = customTime?.start || shift.shiftHours.start;
                    const actualEndTime = customTime?.end || shift.shiftHours.end;
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{shift.day}</span>
                          <span className="text-sm text-gray-500">{formatDate(date)}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{locationIcons[shift.location]}</span>
                            <span className="font-medium">{shift.location}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {actualStartTime} - {actualEndTime}
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {shift.duration} hours
                          </div>
                          <div className="text-xs text-gray-500 border-t pt-2">
                            <div className="flex items-center gap-1">
                              <span>🏢 Operating Hours:</span>
                              <span>{operatingHours.start} - {operatingHours.end}</span>
                            </div>
                          </div>
                          {/* Early Arrival Request Button */}
                          {actualStartTime !== operatingHours.start && (
                            <button
                              onClick={() => {
                                const dateKey = date.toISOString().split('T')[0];
                                const request = {
                                  staff: loggedInStaff,
                                  location: shift.location,
                                  day: shift.day,
                                  currentStart: actualStartTime,
                                  requestedStart: operatingHours.start,
                                  date: dateKey,
                                  timestamp: new Date().toISOString()
                                };
                                
                                setEarlyArrivalRequests(prev => {
                                  const updated = {
                                    ...prev,
                                    [dateKey]: [...(prev[dateKey] || []), request]
                                  };
                                  localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
                                  return updated;
                                });
                                
                                alert('Early arrival request submitted!');
                              }}
                              className="w-full mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              📅 Offer to come in at {operatingHours.start}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {getStaffSchedule(loggedInStaff, currentWeek).length === 0 && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>No shifts assigned this week</p>
                    <p className="text-sm mt-1">Check call-offs or PTO requests</p>
                  </div>
                )}

                {/* Staff Request Feature */}
                <div className={`mt-6 p-4 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Request Time Off
                  </h4>
                  <div className={`mb-4 p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-blue-50'} border-l-4 border-blue-500`}>
                    <div className="text-sm font-semibold mb-1">💡 Pro Tips:</div>
                    <div className="text-xs space-y-1">
                      <div>• Under 40 hours? Offer to come in early on your shifts</div>
                      <div>• Early arrival requests help you reach your target hours</div>
                      <div>• Submit pickup requests for additional shifts</div>
                      <div>• Check with management for available pickup opportunities</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                      type="date"
                      id="staffRequestDate"
                      className={`p-2 rounded border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-black'}`}
                    />
                    <select
                      id="staffRequestType"
                      onChange={(e) => {
                        const timeField = document.getElementById('staffRequestTime');
                        if (e.target.value === 'pickup' || e.target.value === 'early') {
                          timeField.style.display = 'block';
                        } else {
                          timeField.style.display = 'none';
                        }
                      }}
                      className={`p-2 rounded border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-black'}`}
                    >
                      <option value="">Request Type</option>
                      <option value="calloff">Call-Off</option>
                      <option value="pto">PTO Request</option>
                      <option value="pickup">Pickup Hours Request</option>
                      <option value="early">Early Arrival Request</option>
                    </select>
                    <input
                      type="text"
                      id="staffRequestTime"
                      placeholder="Time (e.g., 7:30a-3:30p for pickup, 7:30a for early arrival)"
                      className={`p-2 rounded border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-black'}`}
                      style={{display: 'none'}}
                    />
                    <input
                      type="text"
                      id="staffRequestReason"
                      placeholder="Reason (optional)"
                      className={`p-2 rounded border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-black'}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const date = document.getElementById('staffRequestDate').value;
                      const requestType = document.getElementById('staffRequestType').value;
                      const time = document.getElementById('staffRequestTime').value;
                      const reason = document.getElementById('staffRequestReason').value;
                      
                      if (!date || !requestType) {
                        alert('Please select a date and request type');
                        return;
                      }
                      
                      if ((requestType === 'pickup' || requestType === 'early') && !time) {
                        alert('Please enter the time for this request');
                        return;
                      }
                      
                      const request = {
                        type: requestType,
                        staff: loggedInStaff,
                        reason: reason || 'No reason provided',
                        date: date,
                        timestamp: new Date().toISOString()
                      };
                      
                      if (requestType === 'pickup' || requestType === 'early') {
                        request.time = time;
                        request.hours = calculateHoursFromTimes(time.split('-')[0], time.split('-')[1]);
                      }
                      
                      if (requestType === 'calloff') {
                        setCallOffs(prev => {
                          const updated = {
                            ...prev,
                            [date]: [...(prev[date] || []), request]
                          };
                          localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
                          return updated;
                        });
                      } else if (requestType === 'pto') {
                        setPtoRequests(prev => {
                          const updated = {
                            ...prev,
                            [date]: [...(prev[date] || []), request]
                          };
                          localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
                          return updated;
                        });
                      } else if (requestType === 'pickup') {
                        setPickupRequests(prev => {
                          const updated = {
                            ...prev,
                            [date]: [...(prev[date] || []), request]
                          };
                          localStorage.setItem('safetySchedule_pickupRequests', JSON.stringify(updated));
                          return updated;
                        });
                      } else if (requestType === 'early') {
                        setEarlyArrivalRequests(prev => {
                          const updated = {
                            ...prev,
                            [date]: [...(prev[date] || []), request]
                          };
                          localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
                          return updated;
                        });
                      }
                      
                      // Clear inputs
                      document.getElementById('staffRequestDate').value = '';
                      document.getElementById('staffRequestType').value = '';
                      document.getElementById('staffRequestTime').value = '';
                      document.getElementById('staffRequestReason').value = '';
                      document.getElementById('staffRequestTime').style.display = 'none';
                      
                      alert('Request submitted successfully!');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            ) : viewMode === 'master' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {days.map((day, index) => {
                  const date = getWeekDates(currentWeek)[index];
                  return (
                    <div
                      key={day}
                      className={`border rounded-xl transition-all duration-300 ${
                        darkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    >
                      <div className={`p-4 rounded-t-xl ${
                        day === 'Saturday' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <h3 className={`font-bold text-lg ${
                          day === 'Saturday' ? 'text-white' : darkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {day} {day === 'Saturday' && '🎉'}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          day === 'Saturday' ? 'text-white opacity-90' : darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {formatDate(date)}
                        </p>
                      </div>
                    
                      <div className="p-4 space-y-3">
                        {locations.filter(location => !(day === 'Monday' && location === 'Safepoint')).map((location) => {
                          const assignment = currentSchedule.assignments[day]?.[location];
                          const isOpen = !assignment;
                          const shiftHours = day === 'Saturday' ? saturdayHours[location] : baseShiftHours[location];
                          const customDuration = getShiftDuration(day, location, currentWeek);
                          
                          return (
                            <div
                              key={location}
                              className={`rounded-lg p-3 transition-all duration-200 ${
                                isOpen 
                                  ? 'bg-gray-300 dark:bg-gray-600 border-2 border-dashed border-gray-400' 
                                  : `${staffInfo[assignment].color} text-white`
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold flex items-center gap-2">
                                  {locationIcons[location]} {location}
                                </span>
                                {isOpen && (
                                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                                    PICKUP
                                  </span>
                                )}
                              </div>
                              
                              {editMode && (
                                <div className="space-y-2">
                                  <select
                                    value={assignment || ''}
                                    onChange={(e) => assignBaseShift(day, location, e.target.value || null)}
                                    className="w-full p-1 text-sm bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                  >
                                    <option value="">Make Pickup Shift</option>
                                    <option value={assignment}>{assignment} (current)</option>
                                    {getAvailableStaff(day, currentWeek).filter(staff => 
                                      staff !== assignment
                                    ).map(staff => (
                                      <option key={staff} value={staff}>{staff}</option>
                                    ))}
                                  </select>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <label className="text-xs text-white opacity-75">Start:</label>
                                      <input
                                        type="text"
                                        placeholder="7:30a"
                                        value={hasPendingChanges(day, location, currentWeek) ? 
                                          (pendingChanges[`${currentWeek}-${day}-${location}`]?.time?.start || getCustomShiftTime(day, location, currentWeek)?.start || '') :
                                          (getCustomShiftTime(day, location, currentWeek)?.start || '')
                                        }
                                        onChange={(e) => {
                                          console.log('Start time changed:', e.target.value, 'Length:', e.target.value.length, 'Char codes:', [...e.target.value].map(c => c.charCodeAt(0)));
                                          const currentTime = getCustomShiftTime(day, location, currentWeek) || { start: '', end: '' };
                                          const newTime = { ...currentTime, start: e.target.value };
                                          console.log('New time object:', newTime);
                                          
                                          // Store as pending change for display
                                          const changeKey = `${currentWeek}-${day}-${location}`;
                                          setPendingChanges(prev => ({
                                            ...prev,
                                            [changeKey]: { ...prev[changeKey], time: newTime }
                                          }));
                                          
                                          // Auto-save immediately with the changes
                                          const changesToSave = { time: newTime };
                                          if (newTime.start && newTime.end) {
                                            const calculatedHours = calculateHoursFromTimes(newTime.start, newTime.end);
                                            changesToSave.duration = calculatedHours;
                                          }
                                          saveShiftChanges(day, location, currentWeek, changesToSave);
                                        }}
                                        className="w-20 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                      />
                                      <label className="text-xs text-white opacity-75">End:</label>
                                      <input
                                        type="text"
                                        placeholder="7:30p"
                                        value={hasPendingChanges(day, location, currentWeek) ? 
                                          (pendingChanges[`${currentWeek}-${day}-${location}`]?.time?.end || getCustomShiftTime(day, location, currentWeek)?.end || '') :
                                          (getCustomShiftTime(day, location, currentWeek)?.end || '')
                                        }
                                        onChange={(e) => {
                                          console.log('End time changed:', e.target.value, 'Length:', e.target.value.length, 'Char codes:', [...e.target.value].map(c => c.charCodeAt(0)));
                                          const currentTime = getCustomShiftTime(day, location, currentWeek) || { start: '', end: '' };
                                          const newTime = { ...currentTime, end: e.target.value };
                                          console.log('New time object:', newTime);
                                          
                                          // Store as pending change for display
                                          const changeKey = `${currentWeek}-${day}-${location}`;
                                          setPendingChanges(prev => ({
                                            ...prev,
                                            [changeKey]: { ...prev[changeKey], time: newTime }
                                          }));
                                          
                                          // Auto-save immediately with the changes
                                          const changesToSave = { time: newTime };
                                          if (newTime.start && newTime.end) {
                                            const calculatedHours = calculateHoursFromTimes(newTime.start, newTime.end);
                                            changesToSave.duration = calculatedHours;
                                          }
                                          saveShiftChanges(day, location, currentWeek, changesToSave);
                                        }}
                                        className="w-20 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-white opacity-75">
                                        Hours: {(() => {
                                          if (hasPendingChanges(day, location, currentWeek)) {
                                            const pending = pendingChanges[`${currentWeek}-${day}-${location}`];
                                            if (pending?.time?.start && pending?.time?.end) {
                                              const calculatedHours = calculateHoursFromTimes(pending.time.start, pending.time.end);
                                              return isNaN(calculatedHours) ? '0' : calculatedHours;
                                            }
                                            return pending?.duration || 0;
                                          }
                                          return customDuration;
                                        })()}h
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {!editMode && (
                                <div>
                                  {assignment && (
                                    <div className="font-semibold flex items-center justify-between">
                                      <strong>{assignment}</strong>
                                    </div>
                                  )}
                                  <div className="text-xs opacity-75 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {(() => {
                                      const customTime = getCustomShiftTime(day, location, currentWeek);
                                      const isEditing = editingTime && editingTime.day === day && editingTime.location === location;
                                      
                                      if (isEditing && editingTime.field === 'start') {
                                        return (
                                          <input
                                            type="text"
                                            placeholder="7:30a"
                                            value={customTime?.start || shiftHours.start}
                                            onChange={(e) => handleInlineTimeEdit(day, location, 'start', e.target.value)}
                                            onBlur={() => setEditingTime(null)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                setEditingTime(null);
                                              }
                                            }}
                                            className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                            autoFocus
                                          />
                                        );
                                      } else if (isEditing && editingTime.field === 'end') {
                                        return (
                                          <span>
                                            {customTime?.start || shiftHours.start} - 
                                            <input
                                              type="text"
                                              placeholder="7:30p"
                                              value={customTime?.end || shiftHours.end}
                                              onChange={(e) => handleInlineTimeEdit(day, location, 'end', e.target.value)}
                                              onBlur={() => setEditingTime(null)}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  setEditingTime(null);
                                                }
                                              }}
                                              className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold ml-1"
                                              autoFocus
                                            />
                                            ({customDuration}h)
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="cursor-pointer hover:bg-white hover:bg-opacity-20 px-1 rounded">
                                            <span 
                                              onClick={() => {
                                                console.log('Start time clicked:', day, location);
                                                setEditingTime({ day, location, field: 'start' });
                                              }}
                                              className="hover:underline"
                                              title="Click to edit start time"
                                            >
                                              {customTime?.start || shiftHours.start}
                                            </span>
                                            {' - '}
                                            <span 
                                              onClick={() => {
                                                console.log('End time clicked:', day, location);
                                                setEditingTime({ day, location, field: 'end' });
                                              }}
                                              className="hover:underline"
                                              title="Click to edit end time"
                                            >
                                              {customTime?.end || shiftHours.end}
                                            </span>
                                            {' ('}{customDuration}h)
                                          </span>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                              {editMode && (
                                <div className="text-xs opacity-75 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {(() => {
                                    const customTime = getCustomShiftTime(day, location, currentWeek);
                                    const isEditing = editingTime && editingTime.day === day && editingTime.location === location;
                                    
                                    if (isEditing && editingTime.field === 'start') {
                                      return (
                                        <input
                                          type="text"
                                          placeholder="7:30a"
                                          value={customTime?.start || shiftHours.start}
                                          onChange={(e) => handleInlineTimeEdit(day, location, 'start', e.target.value)}
                                          onBlur={() => setEditingTime(null)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              setEditingTime(null);
                                            }
                                          }}
                                          className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                          autoFocus
                                        />
                                      );
                                    } else if (isEditing && editingTime.field === 'end') {
                                      return (
                                        <span>
                                          {customTime?.start || shiftHours.start} - 
                                          <input
                                            type="text"
                                            placeholder="7:30p"
                                            value={customTime?.end || shiftHours.end}
                                            onChange={(e) => handleInlineTimeEdit(day, location, 'end', e.target.value)}
                                            onBlur={() => setEditingTime(null)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                setEditingTime(null);
                                              }
                                            }}
                                            className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold ml-1"
                                            autoFocus
                                          />
                                          ({customDuration}h)
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span className="cursor-pointer hover:bg-white hover:bg-opacity-20 px-1 rounded">
                                          <span 
                                            onClick={() => {
                                              console.log('Start time clicked (edit mode):', day, location);
                                              setEditingTime({ day, location, field: 'start' });
                                            }}
                                            className="hover:underline"
                                            title="Click to edit start time"
                                          >
                                            {customTime?.start || shiftHours.start}
                                          </span>
                                          {' - '}
                                          <span 
                                            onClick={() => {
                                              console.log('End time clicked (edit mode):', day, location);
                                              setEditingTime({ day, location, field: 'end' });
                                            }}
                                            className="hover:underline"
                                            title="Click to edit end time"
                                          >
                                            {customTime?.end || shiftHours.end}
                                          </span>
                                          {' ('}{customDuration}h)
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${staffInfo[selectedStaffView].color} text-white`}>
                  <h3 className="text-lg font-semibold mb-2">{selectedStaffView}'s Schedule - Week {currentWeek}</h3>
                  <div className="text-sm opacity-90">
                    Total Hours: {calculateBaseHours(currentWeek)[selectedStaffView]} / 40 target
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getStaffSchedule(selectedStaffView, currentWeek).map((shift, index) => {
                    const date = getWeekDates(currentWeek)[days.indexOf(shift.day)];
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{shift.day}</span>
                          <span className="text-sm text-gray-500">{formatDate(date)}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{locationIcons[shift.location]}</span>
                            <span className="font-medium">{shift.location}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {(() => {
                              const customTime = getCustomShiftTime(shift.day, shift.location, currentWeek);
                              if (customTime && customTime.start && customTime.end) {
                                return `${customTime.start} - ${customTime.end}`;
                              }
                              return `${shift.shiftHours.start} - ${shift.shiftHours.end}`;
                            })()}
                          </div>

                          <div className="text-lg font-bold text-green-600">
                            {shift.duration} hours
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {getStaffSchedule(selectedStaffView, currentWeek).length === 0 && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>No shifts assigned this week</p>
                    <p className="text-sm mt-1">Check call-offs or PTO requests</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Schedule Information - Master Only */}
        {isAuthenticated && (
          <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Settings className="w-5 h-5" />
              Schedule System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Operating Hours (Strict Limits)</h4>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>🌆 <strong>Short North:</strong> Mon-Fri 7:30a-7:30p, Sat 9a-3:30p</li>
                  <li>🏢 <strong>KL:</strong> Mon-Fri 7:30a-7:30p, Sat 9a-3:30p</li>
                  <li>🛡️ <strong>Safepoint:</strong> Tue-Fri 11a-7:00p, Sat 9a-2:00p (closed Mondays)</li>
                  <li>⚠️ <strong>No shifts outside these hours</strong></li>
                </ul>
              </div>
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>System Rules</h4>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>🎯 <strong>Target:</strong> 40 hours per person per week</li>
                  <li>🚫 <strong>Mike:</strong> Mondays off, works Tuesday-Saturday at Short North (40.5 hours)</li>
                  <li>🔄 <strong>KL Saturday rotation:</strong> Kyle → Tyler → Mia → Kyle (4-week cycle)</li>
                  <li>🛡️ <strong>Safepoint rotation:</strong> Staff rotate through Safepoint assignments</li>
                  <li>📅 <strong>Start date:</strong> Monday, August 5th, 2024</li>
                  <li>⚡ <strong>Pickup shifts:</strong> Within business hours only</li>
                </ul>
              </div>
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>JotForm Integration</h4>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>📊 <strong>Export:</strong> JSON data for form setup</li>
                  <li>📝 <strong>Pickup form:</strong> Staff can sign up for open shifts</li>
                  <li>🔄 <strong>Updates:</strong> Import signups back to system</li>
                  <li>📱 <strong>Mobile friendly:</strong> Easy access for staff</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Master Only */}
        {isAuthenticated && (
          <div className={`text-center mt-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>🎯 40-Hour Master Schedule System • Base assignments + voluntary pickups • Ready for JotForm integration</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterScheduleSystem;