import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControl,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';

import { useStores } from '../../store';
import { useTranslation } from 'react-i18next';

const SettingsPage: React.FC = observer(() => {
  const { t } = useTranslation();
  const { authStore, uiStore } = useStores();
  const [profileForm, setProfileForm] = useState({
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || ''
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };

  const handleSaveProfile = () => {
    // Логика сохранения профиля
    uiStore.showSuccess(t('settings.profileSaved'));
  };

  const handleLanguageChange = (event: any) => {
    uiStore.setLanguage(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('settings.title')}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {t('settings.profile')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ width: 100, height: 100, mr: 2 }}
                alt={profileForm.name} 
                src="/path/to/avatar"
              />
              <IconButton color="primary" component="label">
                <CameraIcon />
                <input hidden type="file" accept="image/*" />
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('settings.name')}
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('settings.email')}
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('settings.phone')}
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSaveProfile}>
                  {t('settings.saveProfile')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {t('settings.preferences')}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  {uiStore.darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                </ListItemIcon>
                <ListItemText 
                  primary={t('settings.darkMode')} 
                  secondary={uiStore.darkMode ? t('settings.enabled') : t('settings.disabled')} 
                />
                <Switch 
                  edge="end"
                  checked={uiStore.darkMode}
                  onChange={() => uiStore.toggleDarkMode()}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <LanguageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={t('settings.language')}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={uiStore.language}
                    onChange={handleLanguageChange}
                    displayEmpty
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ru">Русский</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={t('settings.notifications')} 
                  secondary={t('settings.notificationDesc')}
                />
                <Switch edge="end" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
});

export default SettingsPage; 