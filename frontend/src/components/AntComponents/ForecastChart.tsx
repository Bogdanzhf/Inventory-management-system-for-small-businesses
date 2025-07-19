import React from 'react';
import { Card, Spin, Empty, Divider, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ForecastChart.scss';

const { Title } = Typography;

interface ForecastData {
  date: string;
  predicted_quantity: number;
}

interface ForecastChartProps {
  data: ForecastData[];
  productName?: string;
  loading: boolean;
}

/**
 * Компонент для отображения графика прогнозирования запасов
 */
const ForecastChart: React.FC<ForecastChartProps> = ({ data, productName, loading }) => {
  if (loading) {
    return (
      <Card className="forecast-chart-card">
        <div className="forecast-loading">
          <Spin size="large" />
          <Typography.Text>Загрузка данных прогноза...</Typography.Text>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="forecast-chart-card">
        <Empty
          description="Нет данных для прогноза"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // Подготовка данных для графика
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('ru-RU'),
    прогноз: item.predicted_quantity,
  }));

  return (
    <Card className="forecast-chart-card">
      <Title level={4} className="forecast-title">
        {productName 
          ? `Прогноз запасов: ${productName}`
          : 'Прогноз запасов'
        }
      </Title>
      <Divider />
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            padding={{ left: 20, right: 20 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            name="Количество" 
            tick={{ fontSize: 12 }} 
            domain={[0, 'dataMax + 5']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }} 
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="прогноз"
            stroke="#1890ff"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ForecastChart; 