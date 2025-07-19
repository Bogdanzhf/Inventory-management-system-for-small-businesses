import React from 'react';
import { Card, Table, Typography, Tag, Button, Tooltip, Empty, Spin } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import './RestockRecommendations.scss';

const { Title } = Typography;

interface RestockRecommendation {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock: number;
  recommended_qty: number;
  days_until_stockout: number;
  avg_daily_demand: number;
}

interface RestockRecommendationsProps {
  recommendations: RestockRecommendation[];
  loading: boolean;
  onCreateOrder?: (productId: number, quantity: number) => void;
}

/**
 * Компонент для отображения рекомендаций по пополнению запасов
 */
const RestockRecommendations: React.FC<RestockRecommendationsProps> = ({ 
  recommendations,
  loading,
  onCreateOrder
}) => {
  // Определение цвета тега срочности
  const getUrgencyColor = (days: number): string => {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    if (days <= 14) return 'processing';
    return 'default';
  };

  // Определение срочности заказа
  const getUrgencyText = (days: number): string => {
    if (days <= 3) return 'Срочно';
    if (days <= 7) return 'Высокая';
    if (days <= 14) return 'Средняя';
    return 'Низкая';
  };

  // Определение колонок таблицы
  const columns = [
    {
      title: 'Товар',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: (a: RestockRecommendation, b: RestockRecommendation) => 
        a.product_name.localeCompare(b.product_name),
    },
    {
      title: 'Текущий запас',
      dataIndex: 'current_quantity',
      key: 'current_quantity',
      sorter: (a: RestockRecommendation, b: RestockRecommendation) => 
        a.current_quantity - b.current_quantity,
    },
    {
      title: 'Мин. запас',
      dataIndex: 'min_stock',
      key: 'min_stock',
    },
    {
      title: 'Дней до истощения',
      dataIndex: 'days_until_stockout',
      key: 'days_until_stockout',
      sorter: (a: RestockRecommendation, b: RestockRecommendation) => 
        a.days_until_stockout - b.days_until_stockout,
      render: (days: number) => (
        <Tooltip title={`${days.toFixed(1)} дней до истощения запаса`}>
          <Tag color={getUrgencyColor(days)}>
            {getUrgencyText(days)} ({days.toFixed(1)} дн.)
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Рекомендуемое кол-во',
      dataIndex: 'recommended_qty',
      key: 'recommended_qty',
      sorter: (a: RestockRecommendation, b: RestockRecommendation) => 
        a.recommended_qty - b.recommended_qty,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: RestockRecommendation) => (
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => onCreateOrder && onCreateOrder(record.product_id, record.recommended_qty)}
        >
          Заказать
        </Button>
      ),
    },
  ];

  return (
    <Card className="restock-recommendations-card">
      <Title level={4} className="restock-title">
        Рекомендации по пополнению запасов
      </Title>

      {loading ? (
        <div className="restock-loading">
          <Spin size="large" />
          <Typography.Text>Загрузка рекомендаций...</Typography.Text>
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <Table
          dataSource={recommendations.map(rec => ({...rec, key: rec.product_id}))}
          columns={columns}
          pagination={{ pageSize: 5 }}
          className="restock-table"
        />
      ) : (
        <Empty description="Нет рекомендаций по пополнению запасов" />
      )}
    </Card>
  );
};

export default RestockRecommendations; 