# Construction Management Project

## Overview
This project is a construction management application that allows users to manage materials effectively. It includes features for creating, updating, and viewing materials, along with their types and unit measurements.

## Project Structure
```
constructionManagement
├── src
│   ├── components
│   │   └── material
│   │       └── MaterialForm.vue
│   ├── composables
│   │   ├── useMaterialManagement.js
│   │   ├── useMaterialType.js
│   │   └── useUnitMeasurement.js
│   ├── services
│   │   ├── api.js
│   │   └── unitMeasurementService.js
└── README.md
```

## Components
- **MaterialForm.vue**: This component contains the form for managing materials. It includes fields for:
  - Material Name
  - Material Type
  - Stock Quantity
  - Unit Price
  - Specifications
  - Notes
  - Unit Measurement (to be added)

## Composables
- **useMaterialManagement.js**: Functions related to material management, including creating and updating materials.
- **useMaterialType.js**: Functions for managing material types, including loading material types from an API.
- **useUnitMeasurement.js**: This file handles the API connection for unit measurements.

## Services
- **api.js**: Base configuration for API requests, setting up axios or fetch for making HTTP requests.
- **unitMeasurementService.js**: Defines the service for fetching unit measurement data from the API.

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the required dependencies using:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run serve
   ```

## Usage
- Access the application in your web browser at `http://localhost:8080`.
- Use the Material Form to add or update materials, selecting the appropriate unit measurement from the dropdown populated by the API.

## API Endpoints
- Unit Measurements: `http://localhost:5244/api/UnitofMeasurement`

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.