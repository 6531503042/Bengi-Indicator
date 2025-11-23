export interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TimeframeConfig {
  interval: string;
  label: string;
}

export interface Signal {
  timeframeLabel: string;
  time: string;
  price: number;
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAY';
  action: 'BUY' | 'SELL' | 'WAIT';
  sl: number | null;
  tp: number | null;
  patternText: string;
  sma50: number | null;
  sma200: number | null;
  status?: 'NO_SIGNAL';
  reason?: string;
  // Advanced indicators
  rsi?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHistogram?: number | null;
  volume?: number | null;
  volumeMA?: number | null;
  supportLevel?: number | null;
  resistanceLevel?: number | null;
  confidence?: number; // 0-100
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  entryReason?: string;
  exitStrategy?: string;
}

export interface TwelveDataResponse {
  status?: string;
  message?: string;
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }>;
}

