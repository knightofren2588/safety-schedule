# Safety Schedule - Master Schedule System

A comprehensive 40-hour master schedule system for managing staff assignments across multiple locations with pickup shift functionality, enhanced dark mode support, and real-time analytics.

## 🚀 Live Demo

**Production URL**: [safety-schedule.vercel.app](https://safety-schedule.vercel.app)

## ✨ Features

### 📅 Core Scheduling
- **40-Hour Target System**: Base schedule designed to get everyone close to 40 hours per week
- **Multi-Location Support**: KL, Short North, and Safepoint locations
- **4-Week Rotation**: Automated Saturday rotation for KL location
- **Pickup Shift System**: Voluntary shift signup for open slots
- **Real-time Analytics**: Live hour tracking and target monitoring

### 🎨 User Experience
- **Enhanced Dark Mode**: Optimized text visibility with bright, readable fonts
- **Mobile Responsive**: Optimized for all device sizes
- **Visual Indicators**: Color-coded staff assignments and status
- **Edit Mode**: Modify base schedule assignments in real-time
- **Export Functionality**: JSON export for JotForm integration

### 📊 Management Features
- **Request Tracking**: PTO and call-off request management
- **Staff Preferences**: Individual staff rules and preferences
- **Operating Hours Compliance**: All shifts within business hours only
- **Analytics Dashboard**: Comprehensive hour tracking and analysis

## 🏢 Location Details

| Location | Icon | Operating Hours | Special Notes |
|----------|------|----------------|---------------|
| **KL** | 🏢 | Mon-Fri 7:30a-7:30p, Sat 9a-3:30p | Main location |
| **Short North** | 🌆 | Mon-Fri 7:30a-7:30p, Sat 9a-3:30p | Mike's Saturday location |
| **Safepoint** | 🛡️ | Tue-Fri 11a-7:00p, Sat 9a-2:00p | Closed Mondays |

## 👥 Staff Management

| Staff | Color | Target Hours | Special Rules |
|-------|-------|--------------|---------------|
| **Kyle** | Purple | 40 | KL Saturday rotation |
| **Mia** | Blue | 40 | KL Saturday rotation |
| **Tyler** | Green | 40 | KL Saturday rotation |
| **Mike** | Red | 40 | Mondays off, Saturday at Short North |

## 📋 System Rules

### Operating Hours (Strict Limits)
- ✅ No shifts scheduled outside business hours
- ✅ Saturday hours vary by location
- ✅ Safepoint closed Mondays
- ✅ Safepoint closes at 7:00p (not 7:30p)

### Staff Rules
- **Mike**: Mondays off, works every Saturday at Short North
- **KL Saturday rotation**: Kyle → Tyler → Mia → Kyle (4-week cycle)
- **Safepoint rotation**: Staff rotate through Safepoint assignments
- **All staff**: Target 40 hours per week
- **Pickup shifts**: Voluntary only
- **Start date**: Monday, August 4th, 2024

## 🌙 Dark Mode Enhancements

### Improved Visibility
- **Bright Text**: All text elements optimized for dark mode readability
- **High Contrast**: Enhanced contrast ratios for better accessibility
- **Clear Headers**: Calendar headers in bright white text (`text-gray-100`)
- **Readable Dates**: Date information in light gray for visibility (`text-gray-200`)
- **Visible Times**: Shift times with increased opacity (90%)
- **Bright Status**: Hour displays and weekly totals clearly visible

### Color Scheme
- **Header Text**: `text-gray-100` (bright white)
- **Date Text**: `text-gray-200` (light gray)
- **Shift Times**: 90% opacity for clarity
- **Status Indicators**: Bright colors for easy reading
- **Navigation**: High contrast elements throughout

## 🛠️ Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/knightofren2588/safety-schedule.git
   cd safety-schedule
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## 📱 Usage Guide

### Basic Navigation
- **Week Selector**: Switch between 4-week rotation cycles
- **Edit Mode**: Toggle to modify base schedule assignments
- **Pickup Shifts**: View and sign up for available shifts
- **Analytics**: Monitor hour totals and targets
- **Dark Mode Toggle**: Switch between light and dark themes

### Pickup System
- Open shifts marked as "PICKUP"
- Staff can sign up for additional hours
- All pickups within business hours
- Real-time hour tracking

### Request Management
- Track PTO requests
- Monitor call-off requests
- View request status and history
- Manage staff availability

## 🔧 Development

### Available Scripts
```bash
npm start    # Start development server
npm build    # Build for production
npm test     # Run test suite
npm eject    # Eject from Create React App
```

### Project Structure
```
src/
├── App.js          # Main application component
├── index.js        # React entry point
└── index.css       # Global styles with Tailwind
```

## 📊 Export & Integration

### JotForm Integration
- Export JSON data for form setup
- Includes base schedule, pickups, and analytics
- Ready for mobile form integration

### Data Structure
```json
{
  "baseSchedule": { /* 4-week rotation data */ },
  "pickupSignups": { /* staff pickup assignments */ },
  "weeklyTotals": { /* calculated hours per week */ },
  "openShifts": { /* available pickup opportunities */ },
  "requests": { /* PTO and call-off requests */ }
}
```

## 🛡️ Technical Stack

- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Create React App**: Zero-configuration build setup
- **Vercel**: Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for Safety Schedule Management**

*Last updated: December 2024* 