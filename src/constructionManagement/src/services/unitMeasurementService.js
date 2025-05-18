import axios from './api';

const getUnitMeasurements = async () => {
  try {
    const response = await axios.get('http://localhost:5244/api/UnitofMeasurement');
    return response.data;
  } catch (error) {
    console.error('Error fetching unit measurements:', error);
    throw error;
  }
};

export { getUnitMeasurements };