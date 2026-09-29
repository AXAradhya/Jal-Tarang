import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  TrendingUp,
  Activity,
  BarChart3,
  Sparkles,
  RefreshCw,
  Percent,
} from 'lucide-react';
import {
  KpiCard,
  ForecastChart,
  FreightTrendChart,
} from '../../components/dashboard/widgets';
import { useUiStore } from '../../store/uiStore';
import { formatRateMt, formatCurrency } from '../../lib/utils';

export const AnalystDashboard: React.FC = () => {
  const currency = useUiStore((s) => s.currency);
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Market Intelligence & Econometrics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
              Role: Market Analyst
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Predictive freight curves, Bi-LSTM deep learning forecasts, Forward Freight Agreements (FFA), and bunker sensitivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/decision/analyst"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-purple-900/20 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            Econometric Scenario Engine
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Forward Rate Spread (3M FFA)"
          value={`+${(formatRateMt(2.40) || '').replace('/MT', '')}`}
          unit="/ MT"
          change="Contango"
          changeDirection="up"
          timeframe="Q3 forward curve"
          icon={TrendingUp}
          status="warning"
          subValue="Forward curve pricing premiums"
        />
        <KpiCard
          title="Bi-LSTM Forecast Accuracy"
          value="94.2%"
          change="+1.5%"
          changeDirection="up"
          timeframe="30-day backtest"
          icon={Brain}
          status="good"
          subValue={`MAE: ${formatRateMt(0.42)} on C5 West Aus`}
        />
        <KpiCard
          title="Freight Volatility (30D Ann.)"
          value="46.8%"
          change="+8.2%"
          changeDirection="up"
          timeframe="Baltic Capesize volatility"
          icon={Activity}
          status="danger"
          subValue="High cyclone/weather turbulence"
        />
        <KpiCard
          title="Bunker Sensitivity Beta"
          value="0.38"
          change="Neutral"
          changeDirection="neutral"
          timeframe="VLSFO pass-through"
          icon={Percent}
          status="normal"
          subValue={`${(formatRateMt(10) || '').replace('/MT', '')}/MT bunker = ${formatRateMt(0.24)} freight`}
        />
      </div>

      {/* Econometric Forecast Chart */}
      <div>
        <ForecastChart />
      </div>

      {/* Historical Freight Trend Comparison */}
      <div>
        <FreightTrendChart />
      </div>
    </div>
  );
};

export default AnalystDashboard;
