import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import './StatisticsCards.scss';

const { Title } = Typography;

interface StatisticsCardsProps {
  totalProducts?: number;
  lowStockProducts?: number;
  totalOrders?: number;
  pendingOrders?: number;
  loading?: boolean;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  totalProducts = 0,
  lowStockProducts = 0,
  totalOrders = 0,
  pendingOrders = 0,
  loading = false,
}) => {
  return (
    <div className="statistics-cards">
      <Title level={4} className="statistics-title">
        Общая статистика
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="statistics-card product-card" loading={loading}>
            <Statistic title="Всего товаров" value={totalProducts} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="statistics-card low-stock-card" loading={loading}>
            <Statistic
              title="Низкий запас"
              value={lowStockProducts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: lowStockProducts > 0 ? '#ff4d4f' : 'inherit' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="statistics-card orders-card" loading={loading}>
            <Statistic
              title="Всего заказов"
              value={totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="statistics-card pending-card" loading={loading}>
            <Statistic
              title="Ожидающие заказы"
              value={pendingOrders}
              prefix={<UserOutlined />}
              valueStyle={{ color: pendingOrders > 5 ? '#faad14' : 'inherit' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsCards;
