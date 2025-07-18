import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  Badge as EmployeeIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { useStores } from '../../store';
import { useTranslation } from 'react-i18next';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  active: boolean;
  created_at: string;
  last_login?: string;
}

const UserManagementPage: React.FC = observer(() => {
  const { t } = useTranslation();
  const { uiStore } = useStores();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    phone: '',
    password: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        uiStore.showError(t('errors.loadingFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [uiStore, t]);

  const handleOpenDialog = (user: User | null = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        password: '',
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'employee',
        phone: '',
        password: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: any) => {
    setFormData({
      ...formData,
      role: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (currentUser) {
        // Обновление существующего пользователя
        await fetch(`/api/users/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        // Обновляем список пользователей
        setUsers(users.map(user => 
          user.id === currentUser.id ? { ...user, ...formData } : user
        ));
        
        uiStore.showSuccess(t('users.userUpdated'));
      } else {
        // Создание нового пользователя
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        const newUser = await response.json();
        setUsers([...users, newUser]);
        
        uiStore.showSuccess(t('users.userCreated'));
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error);
      uiStore.showError(t('errors.savingFailed'));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm(t('users.confirmDelete'))) {
      return;
    }
    
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(user => user.id !== userId));
      uiStore.showSuccess(t('users.userDeleted'));
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      uiStore.showError(t('errors.deletionFailed'));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon color="error" />;
      case 'owner':
        return <AdminIcon color="primary" />;
      default:
        return <EmployeeIcon color="action" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'owner':
        return 'primary';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'name', 
      headerName: t('users.name'), 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1 }} />
          {params.value}
        </Box>
      )
    },
    { field: 'email', headerName: t('users.email'), width: 200 },
    { 
      field: 'role', 
      headerName: t('users.role'), 
      width: 150,
      renderCell: (params) => (
        <Chip
          icon={getRoleIcon(params.value)}
          label={t(`users.roles.${params.value}`)}
          color={getRoleColor(params.value) as any}
          size="small"
        />
      )
    },
    { field: 'phone', headerName: t('users.phone'), width: 150 },
    { 
      field: 'created_at', 
      headerName: t('users.createdAt'), 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      }
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<any, User>) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteUser(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('users.title')}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">{t('users.management')}</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              {t('users.addUser')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
        />
      </Paper>

      {/* Диалог добавления/редактирования пользователя */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentUser ? t('users.editUser') : t('users.addUser')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label={t('users.name')}
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label={t('users.email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  type="email"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>{t('users.role')}</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleSelectChange}
                    label={t('users.role')}
                  >
                    <MenuItem value="admin">{t('users.roles.admin')}</MenuItem>
                    <MenuItem value="owner">{t('users.roles.owner')}</MenuItem>
                    <MenuItem value="employee">{t('users.roles.employee')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="phone"
                  label={t('users.phone')}
                  value={formData.phone}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label={t('users.password')}
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  type="password"
                  helperText={currentUser ? t('users.passwordHelp') : ''}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
          >
            {currentUser ? t('common.save') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default UserManagementPage; 