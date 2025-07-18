import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import {
  AppBar as MuiAppBar,
  AppBarProps as MuiAppBarProps,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useStores } from '../../store';

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth: number;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth',
})<AppBarProps>(({ theme, open, drawerWidth }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface Props {
  drawerWidth: number;
}

const AppBar: React.FC<Props> = ({ drawerWidth }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uiStore, authStore } = useStores();
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, language, setLanguage } = uiStore;
  const { user, logout } = authStore;
  
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElLang, setAnchorElLang] = useState<null | HTMLElement>(null);
  
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  const handleOpenLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElLang(event.currentTarget);
  };
  
  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleCloseUserMenu();
  };
  
  const handleProfile = () => {
    navigate('/profile');
    handleCloseUserMenu();
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    handleCloseLangMenu();
  };

  return (
    <StyledAppBar position="fixed" open={sidebarOpen} drawerWidth={drawerWidth}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={toggleSidebar}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {t('common.appName')}
        </Typography>
        
        {/* Theme toggle */}
        <Tooltip title={darkMode ? t('settings.lightMode') : t('settings.darkMode')}>
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Language menu */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title={t('settings.language')}>
            <IconButton onClick={handleOpenLangMenu} color="inherit">
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="lang-menu"
            anchorEl={anchorElLang}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElLang)}
            onClose={handleCloseLangMenu}
          >
            <MenuItem 
              onClick={() => handleLanguageChange('ru')} 
              selected={language === 'ru'}
            >
              Русский
            </MenuItem>
            <MenuItem 
              onClick={() => handleLanguageChange('en')} 
              selected={language === 'en'}
            >
              English
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Notifications */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title={t('common.notifications')}>
            <IconButton color="inherit">
              <Badge badgeContent={2} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* User menu */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title={user?.name || ''}>
            <IconButton onClick={handleOpenUserMenu} color="inherit">
              {user?.name ? (
                <Avatar alt={user.name} src="/static/avatar.jpg">
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>
          <Menu
            id="user-menu"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem onClick={handleProfile}>
              {t('navigation.profile')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              {t('auth.logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default observer(AppBar); 