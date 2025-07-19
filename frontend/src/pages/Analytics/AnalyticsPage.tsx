import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useStores } from '../../store';
import api from '../../services/api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import UpdateIcon from '@mui/icons-material/Update';
import ForecastChart from '../../components/AntComponents/ForecastChart';
import RestockRecommendations from '../../components/AntComponents/RestockRecommendations';

// Интерфейсы для данных
interface InventoryForecast {
  date: string;
  predicted_quantity: number;
}

interface RestockRecommendation {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_threshold: number;
  days_until_threshold: number;
  recommended_order_quantity: number;
}

interface SalesTrend {
  date: string;
  total_sales: number;
  order_count: number;
}

interface CategoryDistribution {
  category: string;
  value: number;
  percentage: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

// Цвета для графиков
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#8dd1e1',
  '#a4de6c',
  '#d0ed57',
];

// Добавляю импорт для Product
import { Product } from '../../types/models';

const AnalyticsPage: React.FC = observer(() => {
  const { t } = useTranslation();
  const { uiStore } = useStores();

  // Состояния для различных данных
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [products, setProducts] = useState<Product[]>([]);

  // Состояния для аналитических данных
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>(
    'idle'
  );

  // Загрузка списка продуктов
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/inventory');
        setProducts(response.data);

        // Выбор первого продукта по умолчанию, если список не пуст
        if (response.data.length > 0) {
          setSelectedProduct(response.data[0].id);
        }
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
        uiStore.showSnackbar('Ошибка при загрузке списка товаров', 'error');
      }
    };

    fetchProducts();
  }, [uiStore]);

  // Загрузка данных аналитики при изменении параметров
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!selectedProduct) return;

      setLoading(true);

      try {
        // Загрузка прогнозов для выбранного продукта
        const forecastResponse = await api.get(
          `/analytics/forecast/${selectedProduct}?days=${selectedPeriod}`
        );
        setForecasts(forecastResponse.data);

        // Загрузка рекомендаций по пополнению запасов
        const recommendationsResponse = await api.get('/analytics/restock-recommendations');
        setRecommendations(recommendationsResponse.data);

        // Загрузка трендов продаж
        const salesResponse = await api.get(`/analytics/sales-trends?period=${selectedPeriod}`);
        setSalesTrends(salesResponse.data);

        // Загрузка распределения по категориям
        const categoryResponse = await api.get('/analytics/category-distribution');
        setCategoryDistribution(categoryResponse.data);

        // Загрузка топ продуктов
        const topProductsResponse = await api.get(
          `/analytics/top-products?period=${selectedPeriod}`
        );
        setTopProducts(topProductsResponse.data);
      } catch (error) {
        console.error('Ошибка при загрузке аналитических данных:', error);
        uiStore.showSnackbar('Ошибка при загрузке аналитических данных', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedProduct, selectedPeriod, uiStore]);

  // Обработчик изменения вкладки
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Обучение ML-модели
  const handleTrainModel = async () => {
    setTrainingStatus('training');

    try {
      await api.post('/analytics/train-model', {
        product_id: selectedProduct !== '' ? selectedProduct : undefined,
      });

      setTrainingStatus('success');
      uiStore.showSnackbar('Модель успешно обучена', 'success');

      // Перезагрузка прогнозов
      const forecastResponse = await api.get(
        `/analytics/forecast/${selectedProduct}?days=${selectedPeriod}`
      );
      setForecasts(forecastResponse.data);
    } catch (error) {
      console.error('Ошибка при обучении модели:', error);
      setTrainingStatus('error');
      uiStore.showSnackbar('Ошибка при обучении модели', 'error');
    }
  };

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Расчет процентного изменения
  const calculateChange = (data: SalesTrend[]) => {
    if (data.length < 2) return 0;

    const firstValue = data[0].total_sales;
    const lastValue = data[data.length - 1].total_sales;

    if (firstValue === 0) return lastValue > 0 ? 100 : 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  };

  // Получение тренда продаж
  const getSalesTrend = () => {
    if (salesTrends.length < 2) return 0;

    const change = calculateChange(salesTrends);
    return change;
  };

  // Получение общей суммы продаж
  const getTotalSales = () => {
    return salesTrends.reduce((sum, item) => sum + item.total_sales, 0);
  };

  // Получение среднего количества заказов в день
  const getAverageOrdersPerDay = () => {
    if (salesTrends.length === 0) return 0;

    const totalOrders = salesTrends.reduce((sum, item) => sum + item.order_count, 0);
    return totalOrders / salesTrends.length;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('analytics.title')}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('inventory.product')}</InputLabel>
              <Select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value as number)}
                label={t('inventory.product')}
              >
                {products.map(product => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('analytics.period')}</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value as string)}
                label={t('analytics.period')}
              >
                <MenuItem value="7">{t('analytics.last7Days')}</MenuItem>
                <MenuItem value="30">{t('analytics.last30Days')}</MenuItem>
                <MenuItem value="90">{t('analytics.last90Days')}</MenuItem>
                <MenuItem value="365">{t('analytics.lastYear')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleTrainModel}
              startIcon={
                trainingStatus === 'training' ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <UpdateIcon />
                )
              }
              disabled={trainingStatus === 'training'}
            >
              {trainingStatus === 'training' ? t('analytics.training') : t('analytics.trainModel')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {trainingStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('analytics.modelTrainedSuccess')}
        </Alert>
      )}

      {trainingStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('analytics.modelTrainedError')}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label={t('analytics.dashboard')} />
          <Tab label={t('analytics.forecasts')} />
          <Tab label={t('analytics.recommendations')} />
          <Tab label={t('analytics.sales')} />
        </Tabs>
      </Box>

      {/* Панель управления */}
      {tabValue === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Карточки с ключевыми показателями */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={t('analytics.totalSales')} />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4">₽{getTotalSales().toLocaleString('ru-RU')}</Typography>
                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                      {getSalesTrend() > 0 ? (
                        <TrendingUpIcon color="success" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                      <Typography
                        variant="body2"
                        color={getSalesTrend() > 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {Math.abs(getSalesTrend()).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={t('analytics.avgOrdersPerDay')} />
                <CardContent>
                  <Typography variant="h4">{getAverageOrdersPerDay().toFixed(1)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={t('analytics.lowStockItems')} />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4">{recommendations.length}</Typography>
                    {recommendations.length > 0 && <WarningIcon color="warning" sx={{ ml: 1 }} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* График трендов продаж */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title={t('analytics.salesTrends')} />
                <Divider />
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={salesTrends}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                          interval={Math.ceil(salesTrends.length / 10)}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [
                            `₽${value.toLocaleString('ru-RU')}`,
                            t('analytics.sales'),
                          ]}
                          labelFormatter={formatDate}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total_sales"
                          name={t('analytics.sales')}
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* График распределения по категориям */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={t('analytics.categoryDistribution')} />
                <Divider />
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="value"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: { payload?: { percentage: number; category: string } }
                          ) => {
                            const item = props.payload!;
                            return [`${item.percentage.toFixed(1)}%`, item.category];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Топ продуктов */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title={t('analytics.topProducts')} />
                <Divider />
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topProducts.slice(0, 10)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="product_name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value}`, '']} />
                        <Legend />
                        <Bar
                          dataKey="quantity_sold"
                          name={t('analytics.quantitySold')}
                          fill="#8884d8"
                        />
                        <Bar dataKey="revenue" name={t('analytics.revenue')} fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Прогнозы */}
      {tabValue === 1 && (
        <Box>
          <ForecastChart
            data={forecasts.map(f => ({
              date: f.date,
              predicted_quantity: f.predicted_quantity,
            }))}
            productName={selectedProduct ? products.find(p => p.id === selectedProduct)?.name : ''}
            loading={loading}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('analytics.forecastExplanation')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('analytics.forecastExplanationText1')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('analytics.forecastExplanationText2')}
            </Typography>
            <Typography variant="body1">{t('analytics.forecastExplanationText3')}</Typography>
          </Box>
        </Box>
      )}

      {/* Рекомендации */}
      {tabValue === 2 && (
        <Box>
          <RestockRecommendations
            recommendations={recommendations.map(r => ({
              product_id: r.product_id,
              product_name: r.product_name,
              current_quantity: r.current_quantity,
              min_stock: r.min_threshold,
              recommended_qty: r.recommended_order_quantity,
              days_until_stockout: r.days_until_threshold,
              avg_daily_demand:
                r.days_until_threshold > 0 ? r.current_quantity / r.days_until_threshold : 0,
            }))}
            loading={loading}
            onCreateOrder={(_productId, _quantity) => {
              uiStore.showSnackbar(t('analytics.orderCreationNotImplemented'), 'info');
            }}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('analytics.recommendationsExplanation')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('analytics.recommendationsExplanationText1')}
            </Typography>
            <Typography variant="body1">
              {t('analytics.recommendationsExplanationText2')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* П��одажи */}
      {tabValue === 3 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title={t('analytics.salesTrends')} />
                <Divider />
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={salesTrends}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                          interval={Math.ceil(salesTrends.length / 15)}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: { payload: { percentage: number; category: string } }
                          ) => {
                            if (name === t('analytics.sales')) {
                              return [`₽${value.toLocaleString('ru-RU')}`, name];
                            }
                            return [value, name];
                          }}
                          labelFormatter={formatDate}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total_sales"
                          name={t('analytics.sales')}
                          stroke="#8884d8"
                          yAxisId="left"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="order_count"
                          name={t('analytics.orderCount')}
                          stroke="#82ca9d"
                          yAxisId="right"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title={t('analytics.categoryDistribution')} />
                <Divider />
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="value"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: { payload?: { percentage: number; category: string } }
                          ) => {
                            const item = props.payload!;
                            return [`${item.percentage.toFixed(1)}%`, item.category];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
});

export default AnalyticsPage;