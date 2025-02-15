
import { Box, CssBaseline } from '@mui/material';
import React from 'react';
import {Reacteroids} from './asteroids/Reacteroids';

const App: React.FC = () => {
  return (
    <>
    <CssBaseline/>
    <Box sx={{ maxWidth: '100%', maxHeight: '100vh', width: '100%', height: '100%' }}>
      <Reacteroids />
    </Box>
    </>
  );
};

export default App;
