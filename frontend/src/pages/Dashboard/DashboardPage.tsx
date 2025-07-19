import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Inventory2Outlined as InventoryIcon,
  WarningAmberOutlined as WarningIcon,
  ShoppingCartOutlined as OrderIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

import { apiService } from '../../services/api';
import { useStores } from '../../store';
import { Product, Order, OrderStatus } from '../../types/models';
import StatisticsCards from '../../components/AntComponents/StatisticsCards';

// Компонент для отображения низкого запаса товаров
const LowStockWidget: React.FC<{ products: Product[], navigate: (path: string) => void }> = ({ products, navigate }) => {
  const { t } = useTranslation();
  
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          {t('products.lowStockAlert')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {products.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {products.map((product) => (
              <ListItem 
                key={product.id} 
                divider 
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <ListItemIcon>
                  <InventoryIcon color={product.quantity === 0 ? 'error' : 'warning'} />
                </ListItemIcon>
                <ListItemText 
                  primary={product.name}
                  secondary={`${t('products.sku')}: ${product.sku}`}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Typography variant="body2" color="text.secondary" mr={1}>
                    {product.quantity}/{product.min_stock}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(product.quantity / product.min_stock) * 100}
                    color={product.quantity === 0 ? 'error' : 'warning'}
                    sx={{ width: 60 }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <InfoIcon color="info" sx={{ fontSize: 40, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              {t('common.noData')}
            </Typography>
          </Box>
        )}
      </CardContent>
      {products.length > 0 && (
        <CardActions>
          <Button size="small" onClick={() => navigate('/products?low_stock=true')}>
            {t('common.viewAll')}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

// Компонент для отображения последних заказов
const RecentOrdersWidget: React.FC<{ orders: Order[], navigate: (path: string) => void }> = ({ orders, navigate }) => {
  const { t } = useTranslation();

  // Функция для получения цвета статуса заказа
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.PROCESSING:
        return 'info';
      case OrderStatus.SHIPPED:
        return 'primary';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Функция для получения перевода статуса заказа
  const getStatusTranslation = (status: OrderStatus) => {
    return t(`orders.status${status.charAt(0).toUpperCase() + status.slice(1)}`);
  };
  
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <OrderIcon color="primary" sx={{ mr: 1 }} />
          {t('dashboard.recentActivity')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {orders.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {orders.map((order) => (
              <ListItem 
                key={order.id} 
                divider 
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <ListItemText 
                  primary={order.order_number}
                  secondary={`${t('orders.supplier')}: ${order.supplier?.name || ''}`}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Chip 
                    label={getStatusTranslation(order.status)} 
                    color={getStatusColor(order.status) as "warning" | "info" | "primary" | "success" | "error" | "default"}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <InfoIcon color="info" sx={{ fontSize: 40, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              {t('common.noData')}
            </Typography>
          </Box>
        )}
      </CardContent>
      {orders.length > 0 && (
        <CardActions>
          <Button size="small" onClick={() => navigate('/orders')}>
            {t('common.viewAll')}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uiStore } = useStores();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Загрузка данных о товарах с низким запасом
        const lowStockResponse = await apiService.products.getLowStock();
        setLowStockProducts(lowStockResponse.data.products || []);
        
        // Загрузка последних заказов
        const ordersResponse = await apiService.orders.getAll({ limit: 5 });
        setRecentOrders(ordersResponse.data || []);
        
        // Загрузка общей статистики
        const productsResponse = await apiService.products.getAll();
        const allOrdersResponse = await apiService.orders.getAll();
        
        const products = productsResponse.data || [];
        const allOrders = allOrdersResponse.data || [];
        const pendingOrders = allOrders.filter((order: Order) => order.status === OrderStatus.PENDING);
        
        setStats({
          totalProducts: products.length,
          lowStockCount: lowStockProducts.length,
          totalOrders: allOrders.length,
          pendingOrders: pendingOrders.length,
        });
      } catch (error) {
        console.error('Ошибка загрузки данных для дашборда:', error);
        uiStore.showSnackbar(t('common.error'), 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [uiStore, t, lowStockProducts.length]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('dashboard.title')}
      </Typography>

      {/* Статистика с использованием Ant Design компонента */}
      <StatisticsCards
        totalProducts={stats.totalProducts}
        lowStockProducts={stats.lowStockCount}
        totalOrders={stats.totalOrders}
        pendingOrders={stats.pendingOrders}
        loading={isLoading}
      />

      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={6}>
          <LowStockWidget products={lowStockProducts} navigate={navigate} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RecentOrdersWidget orders={recentOrders} navigate={navigate} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default observer(DashboardPage); 