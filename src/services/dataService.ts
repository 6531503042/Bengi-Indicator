import axios, { AxiosInstance } from 'axios';
import { Candle, TwelveDataResponse } from '../types';

export class DataService {
  private apiKey: string;
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.twelvedata.com',
      timeout: 10000,
    });
  }

  /**
   * Fetch BTC/USD candles from Twelve Data API
   */
  async fetchCandles(interval: string, outputsize: number = 200): Promise<Candle[]> {
    try {
      const response = await this.client.get<TwelveDataResponse>('/time_series', {
        params: {
          symbol: 'BTC/USD',
          interval,
          outputsize,
          apikey: this.apiKey,
          format: 'json',
        },
      });

      const data = response.data;

      if (data.status === 'error') {
        throw new Error(data.message || 'Twelve Data API error');
      }

      if (!data.values || data.values.length === 0) {
        throw new Error('No data returned from API');
      }

      // Convert API response to Candle array (latest first)
      return data.values.map((v) => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: v.volume ? parseFloat(v.volume) : undefined,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get current BTC/USD price
   */
  async getCurrentPrice(): Promise<number> {
    const candles = await this.fetchCandles('1min', 1);
    return candles[0].close;
  }
}

