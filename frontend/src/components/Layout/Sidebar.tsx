import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  ListItemButton,
} from '@mui/material';
import classNames from 'classnames';

import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

import { useStores } from '../../store';
import { UserRole } from '../../types/models';
import styles from './Sidebar.module.scss';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { uiStore, authStore } = useStores();
  const { sidebarOpen } = uiStore;
  const { user } = authStore;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const menuItems = [
    {
      text: t('navigation.dashboard'),
      icon: <DashboardIcon />,
      path: '/',
      roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.EMPLOYEE],
    },
    {
      text: t('navigation.products'),
      icon: <InventoryIcon />,
      path: '/products',
      roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.EMPLOYEE],
    },
    {
      text: t('navigation.suppliers'),
      icon: <LocalShippingIcon />,
      path: '/suppliers',
      roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.EMPLOYEE],
    },
    {
      text: t('navigation.orders'),
      icon: <ShoppingCartIcon />,
      path: '/orders',
      roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.EMPLOYEE],
    },
    {
      text: t('navigation.users'),
      icon: <PeopleIcon />,
      path: '/users',
      roles: [UserRole.ADMIN],
    },
  ];

  const accountItems = [
    {
      text: t('navigation.profile'),
      icon: <PersonIcon />,
      path: '/profile',
      roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.EMPLOYEE],
    },
    {
      text: t('navigation.settings'),
      icon: <SettingsIcon />,
      path: '/settings',
      roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.EMPLOYEE],
    },
  ];

  // Вспомогательная функция для проверки ролей пользователя
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user || !user.role) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role as UserRole);
    }

    return user.role === role;
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      className={styles.drawer}
      classes={{
        paper: styles.drawerPaper,
      }}
    >
      <Toolbar />
      <div className={styles.drawerContainer}>
        <List component="nav">
          {menuItems.map(
            item =>
              hasRole(item.roles) && (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive(item.path)}
                    className={classNames({
                      [styles.activeItem]: isActive(item.path),
                    })}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )
          )}
        </List>
        <Divider className={styles.divider} />
        <List component="nav">
          {accountItems.map(
            item =>
              hasRole(item.roles) && (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive(item.path)}
                    className={classNames({
                      [styles.activeItem]: isActive(item.path),
                    })}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )
          )}
        </List>
      </div>
    </Drawer>
  );
};

export default observer(Sidebar);
