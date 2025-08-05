import React, { useState, useEffect, useCallback } from 'react';
import { Target, Clock, Settings, Users, BarChart3, Upload, CalendarX, MapPin, Calendar } from 'lucide-react';

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

// ===== GLOBAL CONSTANTS =====
const TOTAL_WEEKS = 52; // Support up to 52 weeks (1 year)
const START_DATE = new Date(2025, 7, 4); // August 4th, 2025 (Monday)
// ===== END GLOBAL CONSTANTS =====

const MasterScheduleSystem = () => {
  // State management
  const [darkMode, setDarkMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startDate = new Date(2024, 7, 4); // August 4th, 2024
    const diffTime = today.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, Math.min(TOTAL_WEEKS, diffWeeks + 1)); // Allow all 52 weeks
  });
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

  // Approved early arrival requests state
  const [approvedEarlyArrivals, setApprovedEarlyArrivals] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_approvedEarlyArrivals');
    return saved ? JSON.parse(saved) : {};
  });
  

  
  const [pickupRequests, setPickupRequests] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_pickupRequests');
    return saved ? JSON.parse(saved) : {};
  });

  // Cancelled shifts state (for building closures, holidays, etc.)
  const [cancelledShifts, setCancelledShifts] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_cancelledShifts');
    return saved ? JSON.parse(saved) : {};
  });

  // Late employees state
  const [lateEmployees, setLateEmployees] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_lateEmployees');
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
  const [calendarEditingTime, setCalendarEditingTime] = useState(null); // Separate state for calendar editing
  const [dragState, setDragState] = useState(null); // { staff, day, location, week }
  const [dragOverState, setDragOverState] = useState(null); // { staff, day, location, week }

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

  // Separate handler for calendar time editing
  const handleCalendarTimeEdit = (day, location, field, value) => {
    console.log('Calendar time edit:', day, location, field, value);
    
    // Update customTimes in localStorage
    const updatedCustomTimes = {
      ...customTimes,
      [`${currentWeek}-${day}-${location}`]: {
        ...customTimes[`${currentWeek}-${day}-${location}`],
        [field]: value
      }
    };
    
    setCustomTimes(updatedCustomTimes);
    localStorage.setItem('safetySchedule_customTimes', JSON.stringify(updatedCustomTimes));
    
    // Update customHours based on the new times
    const timeKey = `${currentWeek}-${day}-${location}`;
    const timeData = updatedCustomTimes[timeKey];
    
    if (timeData && timeData.start && timeData.end) {
      const hours = calculateHoursFromTimes(timeData.start, timeData.end);
      const updatedCustomHours = {
        ...customHours,
        [timeKey]: hours
      };
      setCustomHours(updatedCustomHours);
      localStorage.setItem('safetySchedule_customHours', JSON.stringify(updatedCustomHours));
    }
  };

  // Drag and drop handlers for calendar staff swaps
  const handleDragStart = (e, staff, day, location) => {
    console.log('🎯 DRAG START:', { staff, day, location });
    
    // Basic validation
    if (!staff || !day || !location) {
      console.log('❌ Drag start failed - missing data');
      return;
    }
    
    const staffIsOff = isStaffOff(staff, day, currentWeek);
    if (staffIsOff) {
      console.log('❌ Drag start failed - staff is off');
      return;
    }
    
    // Set drag state
    const dragData = { staff, day, location, week: currentWeek };
    setDragState(dragData);
    console.log('✅ Drag started:', dragData);
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  const handleDragOver = (e, staff, day, location) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (staff && day && location) {
      setDragOverState({ staff, day, location, week: currentWeek });
    }
  };

  const handleDrop = (e, targetStaff, targetDay, targetLocation) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 DROP:', { targetStaff, targetDay, targetLocation });
    console.log('Drag state:', dragState);
    
    if (!dragState) {
      console.log('❌ No drag state');
      return;
    }
    
    const { staff: sourceStaff, day: sourceDay, location: sourceLocation } = dragState;
    
    // Don't drop on same location
    if (sourceDay === targetDay && sourceLocation === targetLocation) {
      console.log('❌ Same location drop');
      setDragState(null);
      setDragOverState(null);
      return;
    }
    
    // Perform the swap
    setBaseSchedule(prev => {
      const updated = { ...prev };
      
      // Ensure week exists
      if (!updated[currentWeek]) {
        updated[currentWeek] = { assignments: {} };
      }
      if (!updated[currentWeek].assignments) {
        updated[currentWeek].assignments = {};
      }
      
      // Remove source assignment
      if (updated[currentWeek].assignments[sourceDay]?.[sourceLocation]) {
        delete updated[currentWeek].assignments[sourceDay][sourceLocation];
      }
      
      // Add target assignment
      if (!updated[currentWeek].assignments[targetDay]) {
        updated[currentWeek].assignments[targetDay] = {};
      }
      updated[currentWeek].assignments[targetDay][targetLocation] = sourceStaff;
      
      // If target had staff, swap them to source
      if (targetStaff && targetStaff !== sourceStaff) {
        if (!updated[currentWeek].assignments[sourceDay]) {
          updated[currentWeek].assignments[sourceDay] = {};
        }
        updated[currentWeek].assignments[sourceDay][sourceLocation] = targetStaff;
      }
      
      console.log('✅ Schedule updated');
      saveDataWithSync('safetySchedule_baseSchedule', updated);
      return updated;
    });
    
    // Clear drag states
    setDragState(null);
    setDragOverState(null);
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    setDragState(null);
    setDragOverState(null);
  };

  // Simple staff swap function for calendar
  const handleCalendarStaffSwap = (day, location, newStaff, currentStaff) => {
    if (newStaff && newStaff !== currentStaff) {
      console.log('🔄 Staff swap:', currentStaff, '->', newStaff, 'at', day, location);
      setBaseSchedule(prev => {
        const updated = { ...prev };
        if (!updated[currentWeek]) {
          updated[currentWeek] = { assignments: {} };
        }
        if (!updated[currentWeek].assignments) {
          updated[currentWeek].assignments = {};
        }
        if (!updated[currentWeek].assignments[day]) {
          updated[currentWeek].assignments[day] = {};
        }
        updated[currentWeek].assignments[day][location] = newStaff;
        saveDataWithSync('safetySchedule_baseSchedule', updated);
        return updated;
      });
    }
  };

  // Calendar status management
  const handleCalendarStatusChange = (day, location, staff, newStatus) => {
    console.log('📅 Status change:', staff, '->', newStatus, 'at', day, location);
    
    if (newStatus === 'pto') {
      // Add to PTO requests
      const dateKey = getWeekDates(currentWeek)[days.indexOf(day)].toISOString().split('T')[0];
      const ptoRequest = {
        type: 'pto',
        staff: staff,
        reason: 'PTO Request',
        date: dateKey,
        timestamp: new Date().toISOString()
      };
      setPtoRequests(prev => {
        const updated = {
          ...prev,
          [dateKey]: [...(prev[dateKey] || []), ptoRequest]
        };
        localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
        return updated;
      });
    } else if (newStatus === 'calloff') {
      // Add to call-offs
      const dateKey = getWeekDates(currentWeek)[days.indexOf(day)].toISOString().split('T')[0];
      const callOffRequest = {
        type: 'calloff',
        staff: staff,
        reason: 'Call-Off Request',
        date: dateKey,
        timestamp: new Date().toISOString()
      };
      setCallOffs(prev => {
        const updated = {
          ...prev,
          [dateKey]: [...(prev[dateKey] || []), callOffRequest]
        };
        localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
        return updated;
      });
    } else if (newStatus === 'late') {
      // Add to late employees
      toggleEmployeeLate(staff, day, currentWeek, 'Late Arrival');
    } else if (newStatus === 'remove') {
      // Remove status - clear PTO, call-off, and late status
      const dateKey = getWeekDates(currentWeek)[days.indexOf(day)].toISOString().split('T')[0];
      
      // Remove from PTO requests
      setPtoRequests(prev => {
        const updated = { ...prev };
        if (updated[dateKey]) {
          updated[dateKey] = updated[dateKey].filter(req => req.staff !== staff);
          if (updated[dateKey].length === 0) delete updated[dateKey];
        }
        localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
        return updated;
      });
      
      // Remove from call-offs
      setCallOffs(prev => {
        const updated = { ...prev };
        if (updated[dateKey]) {
          updated[dateKey] = updated[dateKey].filter(req => req.staff !== staff);
          if (updated[dateKey].length === 0) delete updated[dateKey];
        }
        localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
        return updated;
      });
      
      // Remove from late employees
      setLateEmployees(prev => {
        const updated = { ...prev };
        const lateKey = `${staff}-${day}-${currentWeek}`;
        if (updated[lateKey]) {
          delete updated[lateKey];
        }
        localStorage.setItem('safetySchedule_lateEmployees', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Enhanced localStorage with better sync
  const saveDataWithSync = (key, data) => {
    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(data));
    
    // Add a timestamp for sync tracking
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    // Create a custom event for cross-tab sync
    const syncEvent = new CustomEvent('safetyScheduleDataChange', {
      detail: { key, data, timestamp: Date.now() }
    });
    window.dispatchEvent(syncEvent);
    
    console.log(`Data saved with sync: ${key}`);
  };

  // Listen for data changes from other tabs
  useEffect(() => {
    const handleDataChange = (event) => {
      const { key, data, timestamp } = event.detail;
      const lastSync = localStorage.getItem(`${key}_last_sync`) || '0';
      
      if (timestamp > parseInt(lastSync)) {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_last_sync`, timestamp.toString());
        
        // Update state if it's baseSchedule
        if (key === 'safetySchedule_baseSchedule') {
          setBaseSchedule(data);
        }
        
        console.log(`Synced data from other tab: ${key}`);
      }
    };

    window.addEventListener('safetyScheduleDataChange', handleDataChange);
    return () => window.removeEventListener('safetyScheduleDataChange', handleDataChange);
  }, []);

  // Staff information
  const [staffInfo, setStaffInfo] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_staffInfo');
    return saved ? JSON.parse(saved) : {
    Kyle: { color: 'bg-blue-500', textColor: 'bg-blue-500 text-white' },
    Mia: { color: 'bg-purple-500', textColor: 'bg-purple-500 text-white' },
    Tyler: { color: 'bg-green-500', textColor: 'bg-green-500 text-white' },
    Mike: { color: 'bg-orange-500', textColor: 'bg-orange-500 text-white' }
  };
  });

  // Sites information
  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_sites');
    return saved ? JSON.parse(saved) : {
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
  };
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

  // Shift hours configuration (staff shift times)
  const baseShiftHours = {
    'Short North': { start: '11:00a', end: '7:30p', duration: 8.5 },
    'KL': { start: '11:00a', end: '7:30p', duration: 8.5 },
    'Safepoint': { start: '11:00a', end: '7:00p', duration: 8.0 }
  };
  
  // Building operating hours (when buildings are actually open)
  const buildingOperatingHours = {
    'Short North': { start: '8:00a', end: '7:00p' },
    'KL': { start: '8:00a', end: '7:00p' },
    'Safepoint': { start: '11:00a', end: '7:00p' }
  };
  
  const saturdayHours = {
    'Short North': { start: '9:00a', end: '3:30p', duration: 6.5 },
    'KL': { start: '9:00a', end: '3:30p', duration: 6.5 },
    'Safepoint': { start: '9:00a', end: '2:00p', duration: 5.0 }
  };

  // Date functions (moved before generateWeekSchedule to avoid circular dependencies)
  
  const getWeekDates = useCallback((weekNum) => {
    try {
      const targetWeek = weekNum - 1;
      
      const monday = new Date(START_DATE);
      monday.setDate(monday.getDate() + (targetWeek * 7));
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date);
      }
      
      return dates;
    } catch (error) {
      console.error('Error getting week dates:', error);
      // Return fallback dates
      const fallbackDates = [];
      for (let i = 0; i < 7; i++) {
        fallbackDates.push(new Date(2025, 7, 4 + i));
      }
      return fallbackDates;
    }
  }, []);

  const getWeekMonthYear = useCallback((weekNum) => {
    const dates = getWeekDates(weekNum);
    const firstDate = dates[0];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return { month: months[firstDate.getMonth()], year: firstDate.getFullYear() };
  }, [getWeekDates]);

  const formatDate = useCallback((date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }, []);

  // Generate schedule for a specific week
  const generateWeekSchedule = useCallback((weekNum) => {
    try {
      console.log('=== GENERATING WEEK SCHEDULE ===');
      console.log('Week number:', weekNum);
      
      const dates = getWeekDates(weekNum);
      const firstDate = dates[0];
      const lastDate = dates[6];
      const monthYear = getWeekMonthYear(weekNum);
      
      console.log('Generated dates:', dates);
      console.log('Month/Year:', monthYear);
      
      // Staff rotation pattern (4-week cycle)
      const staffRotation = ['Kyle', 'Tyler', 'Mia', 'Kyle'];
      const saturdayStaff = staffRotation[(weekNum - 1) % 4];
      
      console.log('Saturday staff:', saturdayStaff);
      
      // Base assignments pattern (rotates every 4 weeks)
      const basePatterns = [
        // Week 1 pattern
        {
          Monday: { 'Short North': 'Kyle', 'KL': 'Mia', 'Safepoint': null },
          Tuesday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
          Wednesday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
          Thursday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
          Friday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
          Saturday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Tyler' }
        },
        // Week 2 pattern
        {
          Monday: { 'Short North': 'Tyler', 'KL': 'Kyle', 'Safepoint': null },
          Tuesday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
          Wednesday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
          Thursday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Tyler' },
          Friday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
          Saturday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Mia' }
        },
        // Week 3 pattern
        {
          Monday: { 'Short North': 'Mia', 'KL': 'Tyler', 'Safepoint': null },
          Tuesday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
          Wednesday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
          Thursday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
          Friday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
          Saturday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Kyle' }
        },
        // Week 4 pattern
        {
          Monday: { 'Short North': 'Kyle', 'KL': 'Mia', 'Safepoint': null },
          Tuesday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
          Wednesday: { 'Short North': 'Mike', 'KL': 'Tyler', 'Safepoint': 'Kyle' },
          Thursday: { 'Short North': 'Mike', 'KL': 'Mia', 'Safepoint': 'Tyler' },
          Friday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Mia' },
          Saturday: { 'Short North': 'Mike', 'KL': 'Kyle', 'Safepoint': 'Tyler' }
        }
      ];
      
      const patternIndex = (weekNum - 1) % 4;
      const assignments = basePatterns[patternIndex];
      
      console.log('Pattern index:', patternIndex);
      console.log('Selected assignments:', assignments);
      
      const result = {
        title: `Week ${weekNum} - ${monthYear.month} ${formatDate(firstDate)}-${formatDate(lastDate)}`,
        saturdayStaff,
        assignments
      };
      
      console.log('✅ Generated schedule:', result);
      return result;
    } catch (error) {
      console.error('❌ Error generating week schedule:', error);
      console.error('Error details:', error.message, error.stack);
      return {
        title: `Week ${weekNum}`,
        saturdayStaff: 'Kyle',
        assignments: {}
      };
    }
  }, [getWeekDates, getWeekMonthYear, formatDate]);

  // Base schedule data with dynamic generation
  const [baseSchedule, setBaseSchedule] = useState(() => {
    const saved = localStorage.getItem('safetySchedule_baseSchedule');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Generate initial schedule for first 4 weeks
    const initialSchedule = {};
    for (let week = 1; week <= 4; week++) {
      initialSchedule[week] = generateWeekSchedule(week);
    }
    
    return initialSchedule;
  });

  // Clean up corrupted data and generate missing weeks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const cleanupCorruptedData = () => {
      const updatedBaseSchedule = { ...baseSchedule };
      let hasChanges = false;
      
      Object.keys(updatedBaseSchedule).forEach(weekNum => {
        if (updatedBaseSchedule[weekNum]?.assignments) {
          Object.keys(updatedBaseSchedule[weekNum].assignments).forEach(day => {
            if (updatedBaseSchedule[weekNum].assignments[day]) {
              Object.keys(updatedBaseSchedule[weekNum].assignments[day]).forEach(location => {
                if (location === 'undefined' || location === undefined) {
                  console.log('Removing corrupted assignment:', weekNum, day, location);
                  delete updatedBaseSchedule[weekNum].assignments[day][location];
                  hasChanges = true;
                }
              });
            }
          });
        }
      });
      
      if (hasChanges) {
        console.log('Cleaning up corrupted data...');
        setBaseSchedule(updatedBaseSchedule);
        saveDataWithSync('safetySchedule_baseSchedule', updatedBaseSchedule);
      }
    };
    
    cleanupCorruptedData();
  }, []); // Run only once on mount

  // Generate missing weeks when currentWeek changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      console.log('=== WEEK GENERATION EFFECT ===');
      console.log('Current week:', currentWeek);
      console.log('Base schedule exists for week:', !!baseSchedule[currentWeek]);
      console.log('All weeks in baseSchedule:', Object.keys(baseSchedule));
      
      if (!baseSchedule[currentWeek]) {
        console.log('🔄 Generating schedule for week:', currentWeek);
        const newSchedule = generateWeekSchedule(currentWeek);
        
        if (newSchedule && newSchedule.assignments) {
          console.log('✅ Generated valid schedule for week:', currentWeek);
          setBaseSchedule(prev => {
            const updated = { ...prev, [currentWeek]: newSchedule };
            console.log('📝 Saving updated schedule to localStorage');
            saveDataWithSync('safetySchedule_baseSchedule', updated);
            return updated;
          });
        } else {
          console.error('❌ Generated schedule is invalid for week:', currentWeek);
          console.error('Generated schedule:', newSchedule);
        }
      } else {
        console.log('✅ Week', currentWeek, 'already exists in baseSchedule');
      }
      
      // Generate missing weeks in the current range (current week ± 2 weeks)
      const weekRange = [];
      for (let week = Math.max(1, currentWeek - 2); week <= Math.min(TOTAL_WEEKS, currentWeek + 2); week++) {
        if (!baseSchedule[week]) {
          weekRange.push(week);
        }
      }
      
      if (weekRange.length > 0) {
        console.log('🔄 Generating missing weeks in range:', weekRange);
        setBaseSchedule(prev => {
          const updated = { ...prev };
          weekRange.forEach(week => {
            try {
              const newSchedule = generateWeekSchedule(week);
              if (newSchedule && newSchedule.assignments) {
                updated[week] = newSchedule;
                console.log('✅ Generated week:', week);
              }
            } catch (error) {
              console.error('❌ Error generating week:', week, error);
              updated[week] = {
                title: `Week ${week}`,
                saturdayStaff: 'Kyle',
                assignments: {}
              };
            }
          });
          saveDataWithSync('safetySchedule_baseSchedule', updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('❌ Error generating missing week:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Fallback: create a basic schedule structure
      console.log('🔄 Creating fallback schedule for week:', currentWeek);
      setBaseSchedule(prev => {
        const fallbackSchedule = {
          title: `Week ${currentWeek}`,
          saturdayStaff: 'Kyle',
          assignments: {}
        };
        const updated = { ...prev, [currentWeek]: fallbackSchedule };
        console.log('📝 Saving fallback schedule to localStorage');
        saveDataWithSync('safetySchedule_baseSchedule', updated);
        return updated;
      });
    }
  }, [currentWeek, generateWeekSchedule]); // Include generateWeekSchedule to ensure it's available

  // Function to get the current week number based on today's date


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

  // Function to remove staff off status
  const removeStaffOff = (staff, day, weekNum) => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    if (dayIndex === -1) return;
    
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    // Remove from call-offs
    setCallOffs(prev => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        updated[dateKey] = updated[dateKey].filter(req => 
          (typeof req === 'string' && req !== staff) ||
          (typeof req === 'object' && req.staff !== staff)
        );
        if (updated[dateKey].length === 0) delete updated[dateKey];
      }
      localStorage.setItem('safetySchedule_callOffs', JSON.stringify(updated));
      return updated;
    });
    
    // Remove from PTO requests
    setPtoRequests(prev => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        updated[dateKey] = updated[dateKey].filter(req => 
          (typeof req === 'string' && req !== staff) ||
          (typeof req === 'object' && req.staff !== staff)
        );
        if (updated[dateKey].length === 0) delete updated[dateKey];
      }
      localStorage.setItem('safetySchedule_ptoRequests', JSON.stringify(updated));
      return updated;
    });
  };

  // Check if a shift is cancelled
  const isShiftCancelled = (day, location, weekNum) => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    const cancelledList = cancelledShifts[dateKey] || [];
    return cancelledList.some(cancellation => 
      cancellation.day === day && cancellation.location === location
    );
  };

  // Toggle shift cancellation
  const toggleShiftCancellation = (day, location, weekNum, reason = 'Building Closure') => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    const updatedCancelledShifts = { ...cancelledShifts };
    
    if (!updatedCancelledShifts[dateKey]) {
      updatedCancelledShifts[dateKey] = [];
    }
    
    const existingIndex = updatedCancelledShifts[dateKey].findIndex(
      cancellation => cancellation.day === day && cancellation.location === location
    );
    
    if (existingIndex >= 0) {
      // Remove cancellation
      updatedCancelledShifts[dateKey].splice(existingIndex, 1);
      if (updatedCancelledShifts[dateKey].length === 0) {
        delete updatedCancelledShifts[dateKey];
      }
    } else {
      // Add cancellation
      updatedCancelledShifts[dateKey].push({
        day,
        location,
        reason,
        timestamp: new Date().toISOString()
      });
    }
    
    setCancelledShifts(updatedCancelledShifts);
    localStorage.setItem('safetySchedule_cancelledShifts', JSON.stringify(updatedCancelledShifts));
  };

  // Check if employee is late
  const isEmployeeLate = (staff, day, weekNum) => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    const lateList = lateEmployees[dateKey] || [];
    return lateList.some(late => 
      late.staff === staff && late.day === day
    );
  };

  // Toggle employee late status
  const toggleEmployeeLate = (staff, day, weekNum, reason = 'Late Arrival') => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    const updatedLateEmployees = { ...lateEmployees };
    
    if (!updatedLateEmployees[dateKey]) {
      updatedLateEmployees[dateKey] = [];
    }
    
    const existingIndex = updatedLateEmployees[dateKey].findIndex(
      late => late.staff === staff && late.day === day
    );
    
    if (existingIndex >= 0) {
      // Remove late status
      updatedLateEmployees[dateKey].splice(existingIndex, 1);
      if (updatedLateEmployees[dateKey].length === 0) {
        delete updatedLateEmployees[dateKey];
      }
    } else {
      // Add late status
      updatedLateEmployees[dateKey].push({
        staff,
        day,
        reason,
        timestamp: new Date().toISOString()
      });
    }
    
    setLateEmployees(updatedLateEmployees);
    localStorage.setItem('safetySchedule_lateEmployees', JSON.stringify(updatedLateEmployees));
  };

  // Calculate early arrival opportunities
  const calculateEarlyArrivalOpportunities = (staff, day, weekNum) => {
    const opportunities = [];
    
    // Get staff's current assignment for this day
    const currentSchedule = baseSchedule[weekNum]?.assignments?.[day] || {};
    const currentLocation = Object.keys(currentSchedule).find(loc => currentSchedule[loc] === staff);
    const currentShift = getCustomShiftTime(day, currentLocation, weekNum) || getOperatingHours(currentLocation, day);
    
    if (!currentShift || !currentShift.start) return opportunities;
    
    const currentStartTime = currentShift.start;
    
    // Check all locations for early arrival opportunities
    Object.keys(sites).forEach(location => {
      const locationHours = getOperatingHours(location, day);
      if (!locationHours || !locationHours.start) return;
      
      const locationStartTime = locationHours.start;
      
      // If location opens earlier than staff's current start time
      if (locationStartTime < currentStartTime) {
        const timeDiff = calculateTimeDifference(locationStartTime, currentStartTime);
        
        opportunities.push({
          location,
          earlyStart: locationStartTime,
          currentStart: currentStartTime,
          hoursAvailable: timeDiff,
          reason: `Come in ${timeDiff} hours early at ${location}`
        });
      }
    });
    
    return opportunities;
  };

  // Calculate time difference in hours
  const calculateTimeDifference = (startTime, endTime) => {
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.toLowerCase().replace(/[ap]m?$/, '').split(/(?=[ap])/);
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'p' && hours !== 12) hours += 12;
      if (period === 'a' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };
    
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    return Math.round((end - start) * 10) / 10;
  };

  // Request early arrival
  const requestEarlyArrival = (staff, day, weekNum, opportunity) => {
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    const request = {
      staff,
      day,
      weekNum,
      location: opportunity.location,
      earlyStart: opportunity.earlyStart,
      currentStart: opportunity.currentStart,
      hoursAvailable: opportunity.hoursAvailable,
      reason: opportunity.reason,
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
  };

  // Approve early arrival request
  const approveEarlyArrival = (dateKey, requestIndex) => {
    const request = earlyArrivalRequests[dateKey][requestIndex];
    
    // Add to approved list
    setApprovedEarlyArrivals(prev => {
      const updated = {
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { ...request, approvedAt: new Date().toISOString() }]
      };
      localStorage.setItem('safetySchedule_approvedEarlyArrivals', JSON.stringify(updated));
      return updated;
    });
    
    // Remove from pending requests
    setEarlyArrivalRequests(prev => {
      const updated = { ...prev };
      updated[dateKey] = updated[dateKey].filter((_, index) => index !== requestIndex);
      if (updated[dateKey].length === 0) {
        delete updated[dateKey];
      }
      localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
      return updated;
    });
    
    // Update the actual schedule to reflect early arrival
    
    // Update custom times to reflect early arrival
    const shiftKey = `${request.weekNum}-${request.day}-${request.location}`;
    setCustomTimes(prev => {
      const updated = {
        ...prev,
        [shiftKey]: {
          start: request.earlyStart,
          end: request.currentStart // Keep the original end time
        }
      };
      localStorage.setItem('safetySchedule_customTimes', JSON.stringify(updated));
      return updated;
    });
    
    // Also update the base schedule if needed
    if (baseSchedule[request.weekNum]?.assignments?.[request.day]?.[request.location] === request.staff) {
      setBaseSchedule(prev => {
        const updated = { ...prev };
        if (!updated[request.weekNum]) updated[request.weekNum] = { assignments: {} };
        if (!updated[request.weekNum].assignments) updated[request.weekNum].assignments = {};
        if (!updated[request.weekNum].assignments[request.day]) updated[request.weekNum].assignments[request.day] = {};
        
        // Update the assignment to reflect early arrival
        updated[request.weekNum].assignments[request.day][request.location] = request.staff;
        
        saveDataWithSync('safetySchedule_baseSchedule', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Deny early arrival request
  const denyEarlyArrival = (dateKey, requestIndex) => {
    setEarlyArrivalRequests(prev => {
      const updated = { ...prev };
      updated[dateKey] = updated[dateKey].filter((_, index) => index !== requestIndex);
      if (updated[dateKey].length === 0) {
        delete updated[dateKey];
      }
      localStorage.setItem('safetySchedule_earlyArrivalRequests', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove approved early arrival and revert schedule
  const removeApprovedEarlyArrival = (dateKey, requestIndex) => {
    const request = approvedEarlyArrivals[dateKey][requestIndex];
    
    // Remove from approved list
    setApprovedEarlyArrivals(prev => {
      const updated = { ...prev };
      updated[dateKey] = updated[dateKey].filter((_, index) => index !== requestIndex);
      if (updated[dateKey].length === 0) {
        delete updated[dateKey];
      }
      localStorage.setItem('safetySchedule_approvedEarlyArrivals', JSON.stringify(updated));
      return updated;
    });
    
    // Revert the custom times to original
    const shiftKey = `${request.weekNum}-${request.day}-${request.location}`;
    setCustomTimes(prev => {
      const updated = { ...prev };
      delete updated[shiftKey]; // Remove the custom time to revert to default
      localStorage.setItem('safetySchedule_customTimes', JSON.stringify(updated));
      return updated;
    });
  };



  const getOperatingHours = (location, day) => {
    // Safety check for undefined location
    if (!location) {
      console.log('getOperatingHours called with undefined location:', location, day);
      return null;
    }
    
    // Saturday hours for all locations
    if (day === 'Saturday') {
      if (location === 'Short North' || location === 'KL') {
        return { start: '9:00a', end: '3:00p' };
      } else if (location === 'Safepoint') {
        return { start: '9:00a', end: '2:00p' };
      }
      return saturdayHours[location] || null;
    }
    
    // Special handling for Safepoint - different hours for different days
    if (location === 'Safepoint') {
      if (day === 'Monday') {
        return null; // Safepoint closed on Monday
      } else {
        // Tuesday - Friday
        return { start: '11:00a', end: '7:00p' };
      }
    }
    
    // Monday - Friday hours for Short North and KL
    if (location === 'Short North' || location === 'KL') {
      return { start: '8:00a', end: '7:00p' };
    }
    
    return buildingOperatingHours[location] || null;
  };

  const getShiftDuration = (day, location, weekNum) => {
    // Safety check for undefined location
    if (!location) {
      console.log('getShiftDuration called with undefined location:', day, location, weekNum);
      return 0;
    }
    
    const shiftKey = `${weekNum}-${day}-${location}`;
    const customTime = getCustomShiftTime(day, location, weekNum);
    
    if (customTime && customTime.start && customTime.end) {
      const calculatedHours = calculateHoursFromTimes(customTime.start, customTime.end);
      return calculatedHours || (day === 'Saturday' ? saturdayHours[location]?.duration || 0 : baseShiftHours[location]?.duration || 0);
    }
    
    return customHours[shiftKey] || (day === 'Saturday' ? saturdayHours[location]?.duration || 0 : baseShiftHours[location]?.duration || 0);
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
    const customTime = customTimes[shiftKey];
    
    // Check if there's an approved early arrival for this day/location
    const weekDates = getWeekDates(weekNum);
    const dayIndex = days.indexOf(day);
    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
    
    const approvedEarlyArrival = approvedEarlyArrivals[dateKey]?.find(
      req => req.day === day && req.location === location
    );
    
    // If there's an approved early arrival, use that time
    if (approvedEarlyArrival) {
      return {
        start: approvedEarlyArrival.earlyStart,
        end: approvedEarlyArrival.currentStart
      };
    }
    
    return customTime;
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
    // Safety check for undefined week
    if (!baseSchedule[weekNum]) {
      console.log('⚠️ getStaffSchedule: Week', weekNum, 'not found in baseSchedule');
      return [];
    }
    
    const assignments = baseSchedule[weekNum].assignments;
    
    // Safety check for undefined assignments
    if (!assignments) {
      console.log('⚠️ getStaffSchedule: No assignments found for week', weekNum);
      return [];
    }
    
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
    // Safety check for undefined week
    if (!baseSchedule[weekNum]) {
      console.log('⚠️ calculateBaseHours: Week', weekNum, 'not found in baseSchedule');
      return { Kyle: 0, Mia: 0, Tyler: 0, Mike: 0 };
    }
    
    const assignments = baseSchedule[weekNum].assignments;
    
    // Safety check for undefined assignments
    if (!assignments) {
      console.log('⚠️ calculateBaseHours: No assignments found for week', weekNum);
      return { Kyle: 0, Mia: 0, Tyler: 0, Mike: 0 };
    }
    
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

  // Get current schedule for the selected week
  const getCurrentSchedule = (weekNum) => {
    return baseSchedule[weekNum] || {
      title: `Week ${weekNum}`,
      saturdayStaff: 'Kyle',
      assignments: {}
    };
  };

  const currentSchedule = getCurrentSchedule(currentWeek);
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
            {currentMonthYear.month} {currentMonthYear.year} • 4-Week Rotation • Start: Monday, August 4th, 2025
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
                📅 <strong>Current Week:</strong> Week {currentWeek} of {TOTAL_WEEKS} • {currentMonthYear.month} {currentMonthYear.year} • 
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
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Add New Safety Team Member</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                                      placeholder="Team Member Name"
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
                    Add Team Member
                  </button>
              </div>
            </div>

                          {/* Current Safety Team Members */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Safety Team Members</h4>
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
              <span className="text-sm bg-blue-500 text-white px-2 py-1 rounded-full">
                🎯 Drag & Drop Staff Swaps
              </span>
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
                  Week {currentWeek} of {TOTAL_WEEKS}
                </span>
                <button
                  onClick={() => setCurrentWeek(Math.min(TOTAL_WEEKS, currentWeek + 1))}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Next Week →
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentMonthYear.month} {currentMonthYear.year}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      // Jump to August 2025 (weeks 1-4)
                      setCurrentWeek(1);
                    }}
                    className={`px-2 py-1 text-xs rounded ${currentWeek >= 1 && currentWeek <= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Aug
                  </button>
                  <button
                    onClick={() => {
                      // Jump to September 2024 (weeks 5-8)
                      setCurrentWeek(5);
                    }}
                    className={`px-2 py-1 text-xs rounded ${currentWeek >= 5 && currentWeek <= 8 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Sep
                  </button>
                  <button
                    onClick={() => {
                      // Jump to October 2024 (weeks 9-13)
                      setCurrentWeek(9);
                    }}
                    className={`px-2 py-1 text-xs rounded ${currentWeek >= 9 && currentWeek <= 13 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Oct
                  </button>
                  <button
                    onClick={() => {
                      // Jump to November 2024 (weeks 14-17)
                      setCurrentWeek(14);
                    }}
                    className={`px-2 py-1 text-xs rounded ${currentWeek >= 14 && currentWeek <= 17 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Nov
                  </button>
                  <button
                    onClick={() => {
                      // Jump to December 2024 (weeks 18-22)
                      setCurrentWeek(18);
                    }}
                    className={`px-2 py-1 text-xs rounded ${currentWeek >= 18 && currentWeek <= 22 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Dec
                  </button>
                  
                  {/* Dropdown for months past December */}
                  <select
                    onChange={(e) => {
                      const selectedWeek = parseInt(e.target.value);
                      if (selectedWeek > 0) {
                        setCurrentWeek(selectedWeek);
                      }
                    }}
                    value=""
                    className={`px-2 py-1 text-xs rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    <option value="">More Months...</option>
                    <option value="23">Jan 2025 (Week 23-26)</option>
                    <option value="27">Feb 2025 (Week 27-30)</option>
                    <option value="31">Mar 2025 (Week 31-35)</option>
                    <option value="36">Apr 2025 (Week 36-39)</option>
                    <option value="40">May 2025 (Week 40-43)</option>
                    <option value="44">Jun 2025 (Week 44-47)</option>
                    <option value="48">Jul 2025 (Week 48-52)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto" key={`calendar-${currentWeek}-${JSON.stringify(baseSchedule[currentWeek]?.assignments)}`}>
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
                        const assignments = baseSchedule[currentWeek]?.assignments?.[day];
                        let location = null;
                        
                        if (assignments) {
                          // Find the location where this staff is assigned
                          location = Object.keys(assignments).find(loc => {
                            const assignedStaff = assignments[loc];
                            return loc && loc !== 'undefined' && loc !== undefined && 
                                   assignedStaff && assignedStaff === staff;
                          });
                        }
                        
                        // Debug logging for assignment detection
                        if (staff === 'Kyle' && day === 'Wednesday') {
                          console.log('Kyle Wednesday assignment check:', {
                            currentWeek,
                            day,
                            assignments: assignments,
                            foundLocation: location,
                            staff,
                            allLocations: assignments ? Object.keys(assignments) : []
                          });
                        }
                        
                        // Additional debug for undefined locations
                        if (location === 'undefined' || location === undefined) {
                          console.log('⚠️ Undefined location detected:', {
                            staff,
                            day,
                            currentWeek,
                            assignments: assignments
                          });
                          location = null;
                        }
                        
                        const shiftDuration = location ? getShiftDuration(day, location, currentWeek) : 0;
                        const customTime = location ? getCustomShiftTime(day, location, currentWeek) : null;
                        const operatingHours = location ? getOperatingHours(location, day) : null;
                        
                        // Debug drag and drop setup
                        const isDraggable = location && !isOff;
                        if (isDraggable) {
                          console.log('🎯 Draggable cell found:', {
                            staff,
                            day,
                            location,
                            isOff,
                            isDraggable
                          });
                        }
                        
                        // Debug all draggable cells
                        if (isDraggable) {
                          console.log('🎯 All draggable cells:', {
                            staff,
                            day,
                            location,
                            isOff,
                            isDraggable
                          });
                        }
                        
                        return (
                          <div 
                            key={dayIndex} 
                            draggable={isDraggable}
                            onDragStart={(e) => {
                              console.log('🎯 DRAG START EVENT TRIGGERED:', { staff, day, location, isDraggable });
                              if (isDraggable) {
                                handleDragStart(e, staff, day, location);
                              } else {
                                console.log('❌ Drag prevented - not draggable');
                              }
                            }}
                            onDragOver={(e) => {
                              console.log('🎯 DRAG OVER EVENT TRIGGERED:', { staff, day, location });
                              handleDragOver(e, staff, day, location);
                            }}
                            onDrop={(e) => {
                              console.log('🎯 DROP EVENT TRIGGERED:', { staff, day, location });
                              handleDrop(e, staff, day, location);
                            }}
                            onDragEnd={(e) => {
                              console.log('🎯 DRAG END EVENT TRIGGERED');
                              handleDragEnd(e);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={`p-3 rounded-lg border transition-all duration-200 ${
                              isOff ? 'bg-red-100 border-red-300' :
                              location ? `${staffInfo[staff].color} text-white` :
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                            } ${
                              dragState && dragState.staff === staff && dragState.day === day && dragState.location === location
                                ? 'opacity-50 scale-95 shadow-lg' : ''
                            } ${
                              dragOverState && dragOverState.staff === staff && dragOverState.day === day && dragOverState.location === location
                                ? 'ring-2 ring-yellow-400 ring-opacity-75 scale-105' : ''
                            } ${
                              location && !isOff ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''
                            }`}
                            title={location && !isOff ? `Drag ${staff} to swap with another staff member` : ''}
                            onClick={(e) => {
                              // Only handle clicks for empty cells or when not dragging
                              if (!dragState && (!location || isOff)) {
                                e.stopPropagation();
                                console.log('Calendar cell clicked:', day, location, staff);
                              }
                            }}
                          >
                            {isOff ? (
                              <div className="text-center">
                                <div className="text-xs font-semibold text-red-600">OFF</div>
                                <div className="text-xs text-red-500">Requested</div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStaffOff(staff, day, currentWeek);
                                  }}
                                  className="mt-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  title="Restore shift"
                                >
                                  Restore
                                </button>
                              </div>
                            ) : location ? (
                              <div className="text-center">
                                <div className="text-xs font-semibold">{location}</div>
                                {location && isEmployeeLate(staff, day, currentWeek) && (
                                  <div className="text-xs bg-orange-500 text-white px-1 py-0.5 rounded-full mt-1">
                                    LATE
                                  </div>
                                )}
                                <div className="text-xs opacity-90">
                                  {(() => {
                                    const isEditing = calendarEditingTime && calendarEditingTime.day === day && calendarEditingTime.location === location;
                                    const timeText = customTime ? `${customTime.start}-${customTime.end}` : 
                                                   operatingHours ? `${operatingHours.start}-${operatingHours.end}` : '';
                                    
                                    if (isEditing && calendarEditingTime.field === 'start') {
                                      return (
                                        <input
                                          type="text"
                                          placeholder="7:30a"
                                          value={customTime?.start || operatingHours?.start || ''}
                                          onChange={(e) => handleCalendarTimeEdit(day, location, 'start', e.target.value)}
                                          onBlur={() => setCalendarEditingTime(null)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              setCalendarEditingTime(null);
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-16 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold"
                                          autoFocus
                                        />
                                      );
                                    } else if (isEditing && calendarEditingTime.field === 'end') {
                                      return (
                                        <span>
                                          {customTime?.start || operatingHours?.start || ''} - 
                                          <input
                                            type="text"
                                            placeholder="7:30p"
                                            value={customTime?.end || operatingHours?.end || ''}
                                            onChange={(e) => handleCalendarTimeEdit(day, location, 'end', e.target.value)}
                                            onBlur={() => setCalendarEditingTime(null)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                setCalendarEditingTime(null);
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
                                          <span 
                                            className="cursor-pointer hover:bg-white hover:bg-opacity-20 px-1 rounded border border-dashed border-white border-opacity-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log('Calendar time clicked - starting edit:', day, location);
                                              setCalendarEditingTime({ day, location, field: 'start' });
                                            }}
                                            title="Click to edit start time"
                                          >
                                            <span 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Calendar start time clicked (default):', day, location);
                                                setCalendarEditingTime({ day, location, field: 'start' });
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
                                                setCalendarEditingTime({ day, location, field: 'end' });
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
                                              setCalendarEditingTime({ day, location, field: 'start' });
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
                                              setCalendarEditingTime({ day, location, field: 'end' });
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
                                
                                {/* Staff Swap Dropdown */}
                                <select
                                  value={staff}
                                  onChange={(e) => handleCalendarStaffSwap(day, location, e.target.value, staff)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold mt-1"
                                >
                                  <option value="">Select Staff</option>
                                  {['Kyle', 'Mia', 'Tyler', 'Mike'].map(teamMember => (
                                    <option key={teamMember} value={teamMember}>{teamMember}</option>
                                  ))}
                                </select>
                                
                                {/* Status Dropdown */}
                                <select
                                  onChange={(e) => handleCalendarStatusChange(day, location, staff, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white font-semibold mt-1"
                                >
                                  <option value="">Set Status</option>
                                  <option value="pto">PTO</option>
                                  <option value="calloff">Call-Off</option>
                                  <option value="late">Late</option>
                                  <option value="remove">Remove Status</option>
                                </select>
                                
                                {/* Early Arrival Opportunities */}
                                {(() => {
                                  const opportunities = calculateEarlyArrivalOpportunities(staff, day, currentWeek);
                                  if (opportunities.length > 0) {
                                    return (
                                      <div className="space-y-1 mt-1">
                                        <div className="text-xs font-semibold text-blue-600">Early Options:</div>
                                        {opportunities.map((opp, index) => (
                                          <button
                                            key={index}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              requestEarlyArrival(staff, day, currentWeek, opp);
                                            }}
                                            className="w-full p-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            title={opp.reason}
                                          >
                                            {opp.location} {opp.earlyStart}
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
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

              {/* Late Employee Log */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Late Employees ({Object.values(lateEmployees).flat().length})
                </h4>
                <div className="space-y-3">
                  {Object.entries(lateEmployees).map(([date, lateList]) => (
                    <div key={date} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setLateEmployees(prev => {
                              const updated = { ...prev };
                              delete updated[date];
                              localStorage.setItem('safetySchedule_lateEmployees', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {lateList.map((late, index) => (
                          <div key={index} className={`p-2 rounded ${darkMode ? 'bg-orange-700' : 'bg-orange-100'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {late.staff} - {late.day}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setLateEmployees(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].filter((_, i) => i !== index)
                                      };
                                      if (updated[date].length === 0) {
                                        delete updated[date];
                                      }
                                      localStorage.setItem('safetySchedule_lateEmployees', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-green-600 hover:text-green-800 text-xs"
                                >
                                  Mark On Time
                                </button>
                                <button
                                  onClick={() => {
                                    setLateEmployees(prev => {
                                      const updated = {
                                        ...prev,
                                        [date]: prev[date].filter((_, i) => i !== index)
                                      };
                                      if (updated[date].length === 0) {
                                        delete updated[date];
                                      }
                                      localStorage.setItem('safetySchedule_lateEmployees', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {late.reason && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Reason: {late.reason}
                              </div>
                            )}
                            {late.timestamp && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Marked: {new Date(late.timestamp).toLocaleString()}
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
                                  onClick={() => approveEarlyArrival(date, index)}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => denyEarlyArrival(date, index)}
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
                              {request.requestedStart ? (
                                <div>Requested Time: {request.requestedStart} (currently {request.currentStart})</div>
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

              {/* Approved Early Arrival Log */}
              <div>
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Approved Early Arrivals ({Object.values(approvedEarlyArrivals).flat().length})
                </h4>
                <div className="space-y-3">
                  {Object.entries(approvedEarlyArrivals).map(([date, requests]) => (
                    <div key={date} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setApprovedEarlyArrivals(prev => {
                              const updated = { ...prev };
                              delete updated[date];
                              localStorage.setItem('safetySchedule_approvedEarlyArrivals', JSON.stringify(updated));
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
                          <div key={index} className={`p-2 rounded ${darkMode ? 'bg-green-700' : 'bg-green-100'} line-through`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                ✅ {request.staff} - {request.location}
                              </span>
                              <div className="flex gap-2">
                                <span className="text-xs text-green-600 font-semibold">
                                  APPROVED
                                </span>
                                <button
                                  onClick={() => removeApprovedEarlyArrival(date, index)}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Requested: {request.earlyStart} (currently {request.currentStart})
                            </div>
                            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Hours Available: {request.hoursAvailable}
                            </div>
                            {request.approvedAt && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Approved: {new Date(request.approvedAt).toLocaleString()}
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
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-2 flex gap-2 overflow-x-auto`}>
            {[...Array(TOTAL_WEEKS)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentWeek(i + 1)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentWeek === i + 1
                    ? 'bg-red-600 text-white shadow-lg transform scale-105'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                Week {i + 1}
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
                {currentSchedule?.saturdayStaff === staff && (
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
              {viewMode === 'master' ? `${currentSchedule?.title || `Week ${currentWeek}`} - Base Schedule` : `${selectedStaffView}'s Schedule - Week ${currentWeek}`}
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
                              <span>{getOperatingHours(shift.location, shift.day)?.start || 'N/A'} - {getOperatingHours(shift.location, shift.day)?.end || 'N/A'}</span>
                            </div>
                          </div>
                                                      {/* Early Arrival Request/Approval Section */}
                            {(() => {
                              const weekDates = getWeekDates(currentWeek);
                              const dayIndex = days.indexOf(shift.day);
                              const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
                              
                              // Check if there's a pending request for this staff/day
                              const pendingRequest = earlyArrivalRequests[dateKey]?.find(
                                req => req.staff === loggedInStaff && req.day === shift.day
                              );
                              
                              // Check if there's an approved early arrival
                              const approvedEarlyArrival = approvedEarlyArrivals[dateKey]?.find(
                                req => req.staff === loggedInStaff && req.day === shift.day
                              );
                              
                              if (approvedEarlyArrival) {
                                // Show approved early arrival with revert option
                                return (
                                  <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                                    <div className="text-xs text-green-800 font-semibold">
                                      ✅ Approved Early Arrival
                                    </div>
                                    <div className="text-xs text-green-700">
                                      {approvedEarlyArrival.earlyStart} - {approvedEarlyArrival.currentStart}
                                    </div>
                                    <button
                                      onClick={() => removeApprovedEarlyArrival(dateKey, approvedEarlyArrivals[dateKey].findIndex(req => req.staff === loggedInStaff && req.day === shift.day))}
                                      className="mt-1 w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    >
                                      Revert to Original Time
                                    </button>
                                  </div>
                                );
                              } else if (pendingRequest) {
                                // Show pending request with approve/deny options
                                return (
                                  <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                                    <div className="text-xs text-yellow-800 font-semibold">
                                      ⏳ Early Arrival Requested
                                    </div>
                                    <div className="text-xs text-yellow-700">
                                      {pendingRequest.earlyStart} - {pendingRequest.currentStart}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={() => approveEarlyArrival(dateKey, earlyArrivalRequests[dateKey].findIndex(req => req.staff === loggedInStaff && req.day === shift.day))}
                                        className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => denyEarlyArrival(dateKey, earlyArrivalRequests[dateKey].findIndex(req => req.staff === loggedInStaff && req.day === shift.day))}
                                        className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      >
                                        Deny
                                      </button>
                                    </div>
                                  </div>
                                );
                              } else if (actualStartTime !== operatingHours.start) {
                                // Show request button
                                return (
                                  <button
                                    onClick={() => {
                                      const request = {
                                        staff: loggedInStaff,
                                        location: shift.location,
                                        day: shift.day,
                                        weekNum: currentWeek,
                                        currentStart: actualStartTime,
                                        earlyStart: operatingHours.start,
                                        hoursAvailable: calculateTimeDifference(operatingHours.start, actualStartTime),
                                        reason: `Come in early at ${shift.location}`,
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
                                );
                              }
                              return null;
                            })()}
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
                          const assignment = currentSchedule?.assignments?.[day]?.[location] || 
                          (location && location !== 'undefined' ? currentSchedule?.assignments?.[day]?.[location] : null);
                          const isOpen = !assignment;
                          const shiftHours = day === 'Saturday' ? saturdayHours[location] : baseShiftHours[location];
                          const customDuration = getShiftDuration(day, location, currentWeek);
                          
                          return (
                            <div
                              key={location}
                              className={`rounded-lg p-3 transition-all duration-200 ${
                                isShiftCancelled(day, location, currentWeek)
                                  ? 'bg-gray-400 dark:bg-gray-500 border-2 border-dashed border-gray-500 opacity-60'
                                  : isOpen 
                                    ? 'bg-gray-300 dark:bg-gray-600 border-2 border-dashed border-gray-400' 
                                    : `${staffInfo[assignment].color} text-white`
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold flex items-center gap-2">
                                  {locationIcons[location]} {location}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isShiftCancelled(day, location, currentWeek) && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                                      CANCELLED
                                    </span>
                                  )}
                                  {assignment && isEmployeeLate(assignment, day, currentWeek) && (
                                    <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                      LATE
                                    </span>
                                  )}
                                  {isOpen && (
                                    <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                                      PICKUP
                                    </span>
                                  )}
                                </div>
                              </div>
                              

                                                              <div>
                                  {assignment && (
                                    <div className="font-semibold flex items-center justify-between">
                                      <strong>{assignment}</strong>
                                    </div>
                                  )}
                                  
                                  {/* Staff Assignment Dropdown */}
                                  <div className="mt-2">
                                    <select
                                      value={assignment || ''}
                                      onChange={(e) => {
                                        const newStaff = e.target.value || null;
                                        console.log('Changing assignment:', day, location, assignment, '->', newStaff);
                                        
                                        // Update the base schedule
                                        const updatedBaseSchedule = { ...baseSchedule };
                                        if (!updatedBaseSchedule[currentWeek]) {
                                          updatedBaseSchedule[currentWeek] = { assignments: {} };
                                        }
                                        if (!updatedBaseSchedule[currentWeek].assignments) {
                                          updatedBaseSchedule[currentWeek].assignments = {};
                                        }
                                        if (!updatedBaseSchedule[currentWeek].assignments[day]) {
                                          updatedBaseSchedule[currentWeek].assignments[day] = {};
                                        }
                                        
                                        if (newStaff) {
                                          updatedBaseSchedule[currentWeek].assignments[day][location] = newStaff;
                                        } else {
                                          delete updatedBaseSchedule[currentWeek].assignments[day][location];
                                        }
                                        
                                        setBaseSchedule(updatedBaseSchedule);
                                        saveDataWithSync('safetySchedule_baseSchedule', updatedBaseSchedule);
                                        
                                        console.log('Assignment updated:', updatedBaseSchedule[currentWeek].assignments[day]);
                                      }}
                                      className="w-full p-1 text-xs bg-white dark:bg-gray-800 rounded border border-white dark:border-gray-600 text-black dark:text-white"
                                    >
                                      <option value="">No Assignment</option>
                                      {['Kyle', 'Mia', 'Tyler', 'Mike'].map(staff => (
                                        <option key={staff} value={staff}>{staff}</option>
                                      ))}
                                    </select>
                                    
                                    {/* Restore Staff Off Status */}
                                    {['Kyle', 'Mia', 'Tyler', 'Mike'].map(staff => {
                                      if (isStaffOff(staff, day, currentWeek)) {
                                        return (
                                          <button
                                            key={staff}
                                            onClick={() => removeStaffOff(staff, day, currentWeek)}
                                            className="mt-1 w-full px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                            title={`Restore ${staff} from OFF status`}
                                          >
                                            Restore {staff}
                                          </button>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                  
                                  <div className="text-xs opacity-75 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {/* Cancellation Button */}
                                    <button
                                      onClick={() => toggleShiftCancellation(day, location, currentWeek)}
                                      className={`ml-2 px-2 py-1 text-xs rounded ${
                                        isShiftCancelled(day, location, currentWeek)
                                          ? 'bg-green-500 hover:bg-green-600 text-white'
                                          : 'bg-red-500 hover:bg-red-600 text-white'
                                      }`}
                                      title={isShiftCancelled(day, location, currentWeek) ? 'Restore Shift' : 'Cancel Shift'}
                                    >
                                      {isShiftCancelled(day, location, currentWeek) ? '🔄 Restore' : '❌ Cancel'}
                                    </button>
                                    
                                    {/* Late Employee Button */}
                                    {assignment && (
                                      <button
                                        onClick={() => toggleEmployeeLate(assignment, day, currentWeek)}
                                        className={`ml-2 px-2 py-1 text-xs rounded ${
                                          isEmployeeLate(assignment, day, currentWeek)
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                                        }`}
                                        title={isEmployeeLate(assignment, day, currentWeek) ? 'Mark On Time' : 'Mark Late'}
                                      >
                                        {isEmployeeLate(assignment, day, currentWeek) ? '✅ On Time' : '⏰ Late'}
                                      </button>
                                    )}
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
                                  
                                  {/* Early Arrival Request/Approval Section for Master View */}
                                  {assignment && (() => {
                                    const weekDates = getWeekDates(currentWeek);
                                    const dayIndex = days.indexOf(day);
                                    const dateKey = weekDates[dayIndex].toISOString().split('T')[0];
                                    
                                    // Check if there's a pending request for this staff/day
                                    const pendingRequest = earlyArrivalRequests[dateKey]?.find(
                                      req => req.staff === assignment && req.day === day
                                    );
                                    
                                    // Check if there's an approved early arrival
                                    const approvedEarlyArrival = approvedEarlyArrivals[dateKey]?.find(
                                      req => req.staff === assignment && req.day === day
                                    );
                                    
                                    const operatingHours = getOperatingHours(location, day);
                                    const customTime = getCustomShiftTime(day, location, currentWeek);
                                    const actualStartTime = customTime?.start || shiftHours.start;
                                    
                                    if (approvedEarlyArrival) {
                                      // Show approved early arrival with revert option
                                      return (
                                        <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                                          <div className="text-xs text-green-800 font-semibold">
                                            ✅ {assignment} - Approved Early Arrival
                                          </div>
                                          <div className="text-xs text-green-700">
                                            {approvedEarlyArrival.earlyStart} - {approvedEarlyArrival.currentStart}
                                          </div>
                                          <button
                                            onClick={() => removeApprovedEarlyArrival(dateKey, approvedEarlyArrivals[dateKey].findIndex(req => req.staff === assignment && req.day === day))}
                                            className="mt-1 w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                          >
                                            Revert to Original Time
                                          </button>
                                        </div>
                                      );
                                    } else if (pendingRequest) {
                                      // Show pending request with approve/deny options
                                      return (
                                        <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                                          <div className="text-xs text-yellow-800 font-semibold">
                                            ⏳ {assignment} - Early Arrival Requested
                                          </div>
                                          <div className="text-xs text-yellow-700">
                                            {pendingRequest.earlyStart} - {pendingRequest.currentStart}
                                          </div>
                                          <div className="flex gap-1 mt-1">
                                            <button
                                              onClick={() => approveEarlyArrival(dateKey, earlyArrivalRequests[dateKey].findIndex(req => req.staff === assignment && req.day === day))}
                                              className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => denyEarlyArrival(dateKey, earlyArrivalRequests[dateKey].findIndex(req => req.staff === assignment && req.day === day))}
                                              className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                            >
                                              Deny
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    } else if (operatingHours && actualStartTime !== operatingHours.start) {
                                      // Show request button for manager to request on behalf of staff
                                      return (
                                        <button
                                          onClick={() => {
                                            const request = {
                                              staff: assignment,
                                              location: location,
                                              day: day,
                                              weekNum: currentWeek,
                                              currentStart: actualStartTime,
                                              earlyStart: operatingHours.start,
                                              hoursAvailable: calculateTimeDifference(operatingHours.start, actualStartTime),
                                              reason: `Come in early at ${location}`,
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
                                            
                                            alert(`Early arrival request submitted for ${assignment}!`);
                                          }}
                                          className="w-full mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                          📅 Request {assignment} come in at {operatingHours.start}
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
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
                {/* Week Navigation for Individual View */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      ← Previous Week
                    </button>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Week {currentWeek} of {TOTAL_WEEKS}
                    </span>
                    <button
                      onClick={() => setCurrentWeek(Math.min(TOTAL_WEEKS, currentWeek + 1))}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Next Week →
                    </button>
                  </div>
                  
                  {/* Month Navigation for Individual View */}
                  <div className="flex items-center gap-2">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {currentMonthYear.month} {currentMonthYear.year}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentWeek(1)}
                        className={`px-2 py-1 text-xs rounded ${currentWeek >= 1 && currentWeek <= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Aug
                      </button>
                      <button
                        onClick={() => setCurrentWeek(5)}
                        className={`px-2 py-1 text-xs rounded ${currentWeek >= 5 && currentWeek <= 8 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Sep
                      </button>
                      <button
                        onClick={() => setCurrentWeek(9)}
                        className={`px-2 py-1 text-xs rounded ${currentWeek >= 9 && currentWeek <= 13 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Oct
                      </button>
                      <button
                        onClick={() => setCurrentWeek(14)}
                        className={`px-2 py-1 text-xs rounded ${currentWeek >= 14 && currentWeek <= 17 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Nov
                      </button>
                      <button
                        onClick={() => setCurrentWeek(18)}
                        className={`px-2 py-1 text-xs rounded ${currentWeek >= 18 && currentWeek <= 22 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Dec
                      </button>
                      
                      {/* Dropdown for months past December */}
                      <select
                        onChange={(e) => {
                          const selectedWeek = parseInt(e.target.value);
                          if (selectedWeek > 0) {
                            setCurrentWeek(selectedWeek);
                          }
                        }}
                        value=""
                        className={`px-2 py-1 text-xs rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                      >
                        <option value="">More Months...</option>
                        <option value="23">Jan 2025 (Week 23-26)</option>
                        <option value="27">Feb 2025 (Week 27-30)</option>
                        <option value="31">Mar 2025 (Week 31-35)</option>
                        <option value="36">Apr 2025 (Week 36-39)</option>
                        <option value="40">May 2025 (Week 40-43)</option>
                        <option value="44">Jun 2025 (Week 44-47)</option>
                        <option value="48">Jul 2025 (Week 48-52)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
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
                          
                          {/* Individual View Controls */}
                          <div className="space-y-2 mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                            {/* Time Editing */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Start time"
                                value={(() => {
                                  const customTime = getCustomShiftTime(shift.day, shift.location, currentWeek);
                                  return customTime?.start || shift.shiftHours.start;
                                })()}
                                onChange={(e) => handleInlineTimeEdit(shift.day, shift.location, 'start', e.target.value)}
                                className="flex-1 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-black dark:text-white"
                              />
                              <input
                                type="text"
                                placeholder="End time"
                                value={(() => {
                                  const customTime = getCustomShiftTime(shift.day, shift.location, currentWeek);
                                  return customTime?.end || shift.shiftHours.end;
                                })()}
                                onChange={(e) => handleInlineTimeEdit(shift.day, shift.location, 'end', e.target.value)}
                                className="flex-1 p-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-black dark:text-white"
                              />
                            </div>
                            
                            {/* Status Management */}
                            <select
                              onChange={(e) => handleCalendarStatusChange(shift.day, shift.location, selectedStaffView, e.target.value)}
                              className="w-full p-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-black dark:text-white"
                            >
                              <option value="">Set Status</option>
                              <option value="pto">PTO</option>
                              <option value="calloff">Call-Off</option>
                              <option value="late">Late</option>
                              <option value="remove">Remove Status</option>
                            </select>
                            
                            {/* Early Arrival Opportunities */}
                            {(() => {
                              const opportunities = calculateEarlyArrivalOpportunities(selectedStaffView, shift.day, currentWeek);
                              if (opportunities.length > 0) {
                                return (
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-blue-600">Early Arrival Opportunities:</div>
                                    {opportunities.map((opp, index) => (
                                      <button
                                        key={index}
                                        onClick={() => requestEarlyArrival(selectedStaffView, shift.day, currentWeek, opp)}
                                        className="w-full p-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        title={opp.reason}
                                      >
                                        {opp.location}: {opp.earlyStart} ({opp.hoursAvailable}h early)
                                      </button>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
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