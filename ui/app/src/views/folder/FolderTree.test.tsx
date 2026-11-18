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

import type { FolderItem, FolderResource } from '@perses-dev/client';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { FolderTree } from './FolderTree';

describe('FolderTree', () => {
  it('expands only the active folder path initially', () => {
    const items: FolderItem[] = [
      {
        kind: 'Folder',
        name: 'deep',
        items: [
          {
            kind: 'Folder',
            name: 'deeper',
            items: [
              {
                kind: 'Folder',
                name: 'deepest',
                items: [{ kind: 'Dashboard', name: 'hidden-deep-dashboard' }],
              },
              { kind: 'Dashboard', name: 'visible-dashboard' },
            ],
          },
        ],
      },
      {
        kind: 'Folder',
        name: 'shallow',
        items: [{ kind: 'Dashboard', name: 'hidden-sibling-dashboard' }],
      },
    ];

    const folder = {
      metadata: { name: 'root', project: 'mahmoud' },
      spec: { items },
    } as FolderResource;

    render(
      <MemoryRouter>
        <FolderTree
          folder={folder}
          projectName="mahmoud"
          targetPath={{
            path: [items[0]!, items[0]!.items![0]!],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('deep')).toBeTruthy();
    expect(screen.getByText('deeper')).toBeTruthy();
    expect(screen.getByText('visible-dashboard')).toBeTruthy();

    expect(screen.queryByText('hidden-deep-dashboard')).toBeNull();
    expect(screen.queryByText('hidden-sibling-dashboard')).toBeNull();

    expect(screen.getAllByRole('button', { name: 'Collapse folder' })).toHaveLength(2);
  });

  it('expands the newly selected path after navigation', () => {
    const alpha: FolderItem = {
      kind: 'Folder',
      name: 'alpha',
      items: [{ kind: 'Dashboard', name: 'Alpha Dashboard' }],
    };

    const beta: FolderItem = {
      kind: 'Folder',
      name: 'beta',
      items: [{ kind: 'Dashboard', name: 'Beta Dashboard' }],
    };

    const folder = {
      metadata: { name: 'root', project: 'mahmoud' },
      spec: { items: [alpha, beta] },
    } as FolderResource;

    const { rerender } = render(
      <MemoryRouter>
        <FolderTree key="alpha" folder={folder} projectName="mahmoud" targetPath={{ path: [alpha] }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Alpha Dashboard')).toBeTruthy();
    expect(screen.queryByText('Beta Dashboard')).toBeNull();

    rerender(
      <MemoryRouter>
        <FolderTree key="beta" folder={folder} projectName="mahmoud" targetPath={{ path: [beta] }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Beta Dashboard')).toBeTruthy();
    expect(screen.queryByText('Alpha Dashboard')).toBeNull();
  });

  it('expands and collapses folders independently', async () => {
    const user = userEvent;

    const alpha: FolderItem = {
      kind: 'Folder',
      name: 'alpha',
      items: [{ kind: 'Dashboard', name: 'Alpha Dashboard' }],
    };

    const beta: FolderItem = {
      kind: 'Folder',
      name: 'beta',
      items: [{ kind: 'Dashboard', name: 'Beta Dashboard' }],
    };

    const folder = {
      metadata: { name: 'root', project: 'mahmoud' },
      spec: { items: [alpha, beta] },
    } as FolderResource;

    render(
      <MemoryRouter>
        <FolderTree folder={folder} projectName="mahmoud" />
      </MemoryRouter>,
    );

    const alphaRow = screen.getByRole('link', { name: 'alpha' }).parentElement!;
    const betaRow = screen.getByRole('link', { name: 'beta' }).parentElement!;

    expect(screen.queryByText('Alpha Dashboard')).toBeNull();
    expect(screen.queryByText('Beta Dashboard')).toBeNull();

    await user.click(within(alphaRow).getByRole('button', { name: 'Expand folder' }));

    expect(screen.getByText('Alpha Dashboard')).toBeTruthy();
    expect(screen.queryByText('Beta Dashboard')).toBeNull();

    await user.click(within(betaRow).getByRole('button', { name: 'Expand folder' }));

    expect(screen.getByText('Alpha Dashboard')).toBeTruthy();
    expect(screen.getByText('Beta Dashboard')).toBeTruthy();

    await user.click(within(alphaRow).getByRole('button', { name: 'Collapse folder' }));

    expect(screen.queryByText('Alpha Dashboard')).toBeNull();
    expect(screen.getByText('Beta Dashboard')).toBeTruthy();
  });

  it('navigates to the correct nested folder URL', async () => {
    const deeper: FolderItem = {
      kind: 'Folder',
      name: 'deeper',
      items: [],
    };

    const deep: FolderItem = {
      kind: 'Folder',
      name: 'deep',
      items: [deeper],
    };

    const folder = {
      metadata: { name: 'root', project: 'mahmoud' },
      spec: { items: [deep] },
    } as FolderResource;

    // oxlint-disable-next-line unicorn/consistent-function-scoping
    const LocationIndicator = (): ReactElement => {
      const location = useLocation();
      return <span data-testid="pathname">{location.pathname}</span>;
    };

    render(
      <MemoryRouter initialEntries={['/projects/mahmoud/folders/root']}>
        <FolderTree folder={folder} projectName="mahmoud" targetPath={{ path: [deep] }} />
        <LocationIndicator />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'deeper' }));

    expect(screen.getByTestId('pathname').textContent).toBe('/projects/mahmoud/folders/root/deep/deeper');
  });
});
