# Safety Schedule - Master Schedule System

A comprehensive 40-hour master schedule system for managing staff assignments across multiple locations with pickup shift functionality.

## Features

### 🎯 Core Functionality
- **40-Hour Target System**: Base schedule designed to get everyone close to 40 hours per week
- **Multi-Location Support**: KL, Short North, and Safepoint locations
- **Pickup Shift System**: Voluntary shift signup for open slots
- **Analytics Dashboard**: Real-time hour tracking and analysis
- **Dark Mode**: Toggle between light and dark themes

### 📊 Schedule Management
- **4-Week Rotation**: Automated Saturday rotation for KL location (Kyle → Tyler → Mia → Kyle)
- **Staff Preferences**: Mike works every Saturday at Short North, Mondays off
- **Operating Hours Compliance**: All shifts within business hours only
- **Edit Mode**: Modify base schedule assignments
- **Start Date**: Monday, August 5th, 2024

### 🚀 Advanced Features
- **Export Functionality**: JSON export for JotForm integration
- **Mobile Responsive**: Optimized for all device sizes
- **Real-time Updates**: Instant hour calculations and pickup tracking
- **Visual Indicators**: Color-coded staff assignments and status

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000`

## Usage

### Basic Navigation
- **Week Selector**: Switch between 3-week rotation cycles
- **Edit Mode**: Toggle to modify base schedule assignments
- **Pickup Shifts**: View and sign up for available shifts
- **Analytics**: Monitor hour totals and targets

### Staff Management
- **Kyle**: Purple color scheme, 40-hour target
- **Mia**: Blue color scheme, 40-hour target  
- **Tyler**: Green color scheme, 40-hour target
- **Mike**: Red color scheme, 40-hour target, Monday off, Saturday Short North

### Location Details
- **KL**: 🏢 Mon-Fri 7:30a-7:30p, Sat 9a-3:30p
- **Short North**: 🌆 Mon-Fri 7:30a-7:30p, Sat 9a-3:30p
- **Safepoint**: 🛡️ Tue-Fri 11a-7:00p, Sat 9a-2:00p (closed Mondays)

## System Rules

### Operating Hours (Strict Limits)
- No shifts scheduled outside business hours
- Saturday hours vary by location
- Safepoint closed Mondays
- Safepoint closes at 7:00p (not 7:30p)

### Staff Rules
- Mike: Mondays off, works every Saturday at Short North
- KL Saturday rotation: Kyle → Tyler → Mia → Kyle (4-week cycle)
- Safepoint rotation: Staff rotate through Safepoint assignments
- All staff target 40 hours per week
- Pickup shifts are voluntary
- Start date: Monday, August 5th, 2024

### Pickup System
- Open shifts marked as "PICKUP"
- Staff can sign up for additional hours
- All pickups within business hours
- Real-time hour tracking

## Export & Integration

### JotForm Integration
- Export JSON data for form setup
- Includes base schedule, pickups, and analytics
- Ready for mobile form integration

### Data Structure
```json
{
  "baseSchedule": { /* 3-week rotation data */ },
  "pickupSignups": { /* staff pickup assignments */ },
  "weeklyTotals": { /* calculated hours per week */ },
  "openShifts": { /* available pickup opportunities */ }
}
```

## Technical Stack

- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Create React App**: Zero-configuration build setup

## Development

### Available Scripts
- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run test suite
- `npm eject`: Eject from Create React App

### Project Structure
```
src/
├── App.js          # Main application component
├── index.js        # React entry point
└── index.css       # Global styles with Tailwind
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Built with ❤️ for Safety Schedule Management** 