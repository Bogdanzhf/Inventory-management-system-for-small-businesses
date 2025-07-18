import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Container, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 8 }}>
      <ErrorOutlineIcon sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
      <Typography variant="h2" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        {t('common.pageNotFound')}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('common.pageNotFoundDescription')}
      </Typography>
      <Box mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          startIcon={<HomeIcon />}
          size="large"
        >
          {t('common.backToHome')}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 