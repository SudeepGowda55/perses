import { Typography, Stack } from '@mui/material';
import type { ReactElement } from 'react';

/* keep it an interface. Partial valid path may be included later */
export interface NestedPathNotFoundProps {
  nestedPath: string;
}
export const NestedPathNotFound = ({ nestedPath }: NestedPathNotFoundProps): ReactElement => {
  return (
    <Stack width="100%" minHeight="60vh" alignItems="center" justifyContent="center" spacing={1}>
      <Typography variant="h5">Nested path not found</Typography>
      <Typography color="text.secondary"> The nested path {nestedPath} could not be found!</Typography>
    </Stack>
  );
};
