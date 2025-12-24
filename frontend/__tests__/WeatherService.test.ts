import { weatherService } from '@/backend/services/WeatherService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  it('returns default weather when API returns 401', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 401 } });

    const result = await weatherService.getCurrentWeather({ latitude: 0, longitude: 0 });

    expect(result.temperature).toBeDefined();
    expect(typeof result.temperature).toBe('number');
    expect(result.description).toBeDefined();
  });
});


