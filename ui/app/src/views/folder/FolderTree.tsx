// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Box, Stack, Typography, IconButton } from '@mui/material';
import type { FolderItem, FolderResource } from '@perses-dev/client';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import FolderOutlineIcon from 'mdi-material-ui/FolderOutline';
import DashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { ResolvedPath } from './model';

export interface FolderTreeProps {
  folder: FolderResource;
  projectName: string;
  targetPath?: ResolvedPath;
}

export const renderFolders = (
  items: FolderItem[],
  cursor: FolderItem[],
  depth: number,
  projectName: string,
  parentUrl: string,
  collapsedPaths: ReadonlySet<string>,
  toggleFolder: (url: string) => void,
): ReactNode => {
  return items.map((item) => {
    const isFolder = item.kind === 'Folder';
    const url = !isFolder
      ? `/projects/${projectName}/dashboards/${encodeURIComponent(item.name)}`
      : `${parentUrl}/${encodeURIComponent(item.name)}`;
    const included = item.kind === 'Folder' && cursor[0] === item;
    const nextCursor = included ? cursor.slice(1) : [];

    const isExpanded = collapsedPaths.has(url);
    const hasChildren = isFolder && (item.items?.length ?? 0) > 0;

    return (
      <Box key={url}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: depth * 2, whiteSpace: 'nowrap' }}>
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={() => toggleFolder(url)}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? <ChevronDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 34, flexShrink: 0 }} />
          )}
          {item.kind === 'Folder' ? (
            <FolderOutlineIcon sx={{ color: included ? 'warning.main' : undefined }} fontSize="small" />
          ) : (
            <DashboardOutlineIcon fontSize="small" />
          )}
          <Typography component={Link} to={url} sx={{ color: 'text.primary', textDecoration: 'none' }} variant="body2">
            {item.name}
          </Typography>
        </Stack>
        {isFolder &&
          isExpanded &&
          renderFolders(item.items ?? [], nextCursor, depth + 1, projectName, url, collapsedPaths, toggleFolder)}
      </Box>
    );
  });
};

export const FolderTree = ({ folder, projectName, targetPath }: FolderTreeProps): ReactElement => {
  const cursor = targetPath ? [...(targetPath.path ?? [])] : [];
  const rootUrl = `/projects/${encodeURIComponent(projectName)}/folders/${encodeURIComponent(folder.metadata.name)}`;

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const paths = new Set<string>();
    let url = rootUrl;

    for (const item of targetPath?.path ?? []) {
      url += `/${encodeURIComponent(item.name)}`;
      paths.add(url);
    }
    return paths;
  });

  const toggleFolder = (url: string): void => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  return (
    <Box sx={{ width: 'max-content', minWidth: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FolderOutlineIcon sx={{ color: 'warning.main' }} fontSize="small" />
        <Typography
          component={Link}
          to={rootUrl}
          sx={{ color: 'text.primary', textDecoration: 'none' }}
          variant="body2"
        >
          {folder.spec.display?.name ?? folder.metadata.name}
        </Typography>
      </Stack>
      {renderFolders(folder.spec.items ?? [], cursor, 1, projectName, rootUrl, expandedPaths, toggleFolder)}
    </Box>
  );
};
