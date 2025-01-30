
# Weather Index 🌦️

A real-time global weather statistics dashboard powered by WeatherXM. This application shows temperature changes and weather conditions across cities, states/regions, and countries worldwide.

## Features

- Real-time temperature tracking
- Global weather station statistics
- Temperature change visualization
- Weather condition indicators
- Filterable data by cities, states, and countries
- Temperature unit conversion (°C/°F)
- Dark/Light theme support

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)

### Installation

1. Clone the project in Replit or import it from GitHub
2. Install the dependencies:
```bash
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

The server will start on `0.0.0.0:3000`. You can view the application in your browser through the Replit webview.

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## API Endpoints

The application provides several API endpoints for weather data:

- `/api/weather-cities` - Get weather data for all cities
- `/api/weather-cities/stats` - Get global network statistics
- `/api/weather-cities/[city]` - Get detailed weather data for a specific city
- `/api/weather-cities/state/[state]` - Get weather data for a specific state
- `/api/weather-cities/country/[country]` - Get weather data for a specific country

## Tech Stack

- SvelteKit - Frontend framework
- TailwindCSS - Styling
- DaisyUI - UI components
- Chart.js - Data visualization
- PostgreSQL - Database

## Contributing

Feel free to contribute to this project! Visit our [GitHub repository](https://github.com/NateBrune/Weather-Index) to get started.

## Credits

Created by [@capitalisnn](https://x.com/capitalisnn) and [@0x_atd](https://x.com/0x_atd)

Powered by [WeatherXM](https://weatherxm.com)
