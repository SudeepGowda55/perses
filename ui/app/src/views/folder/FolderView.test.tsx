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
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import FolderView, { resolveFolderItems } from './FolderView';

const { mockUseFolderList } = vi.hoisted(() => ({
  mockUseFolderList: vi.fn(),
}));

vi.mock('../../model/folder-client', () => ({
  useFolderList: mockUseFolderList,
}));

vi.mock('@perses-dev/components', () => ({
  // oxlint-disable-next-line typescript/explicit-function-return-type
  useSnackbar: () => ({ exceptionSnackbar: vi.fn() }),
}));

vi.mock('./FolderTree', () => ({
  // oxlint-disable-next-line typescript/explicit-function-return-type
  FolderTree: () => null,
}));

vi.mock('./FolderContents', () => ({
  // oxlint-disable-next-line typescript/explicit-function-return-type
  FolderContents: ({ items }: { items: FolderItem[] }) => (
    <div data-testid="folder-contents">
      {items.length === 0 ? 'This folder is empty' : items.map((item) => item.name).join(', ')}
    </div>
  ),
}));

const ITEMS_NO_SIBLINGS: FolderItem[] = [
  {
    kind: 'Folder',
    name: 'deep',
    items: [
      {
        kind: 'Folder',
        name: 'deeper',
      },
    ],
  },
];

const ITEMS_WITH_SIBLINGS: FolderItem[] = [
  {
    kind: 'Folder',
    name: 'deep',
    items: [
      {
        kind: 'Folder',
        name: 'deeper',
      },
    ],
  },
  {
    kind: 'Folder',
    name: 'shallow',
    items: [
      {
        kind: 'Folder',
        name: 'shallower',
      },
    ],
  },
];

const MIXED_ITEMS = [ITEMS_NO_SIBLINGS, ITEMS_WITH_SIBLINGS];

describe('FolderView', () => {
  describe('resolveFolderItems', () => {
    describe('valid/invalid nested paths', () => {
      const tests = [
        {
          exp: 'deep',
          nestedPath: 'deep',
          desc: 'should return a complete valid nested path - for a valid nested paths',
        },
        {
          exp: undefined,
          nestedPath: 'deep/tooDeep',
          desc: 'should return a partial valid nested path - for an invalid nested path',
        },
        {
          exp: undefined,
          nestedPath: 'north/west',
          desc: 'should return all-undefined paths',
        },
        {
          exp: 'deep-deeper',
          nestedPath: 'deep/deeper',
          desc: 'should return the complete valid nested path',
        },
      ];

      for (const t of tests) {
        for (let i = 0; i < 2; i += 1) {
          it(`${t.desc}-${i === 0 ? 'no siblings' : 'with siblings'}`, () => {
            const resolved = resolveFolderItems(MIXED_ITEMS[i]!, t.nestedPath);
            expect(resolved.path?.map((i) => i.name).join('-')).toBe(t.exp);
          });
        }
      }
    });
  });
});

describe('FolderView integration', () => {
  it('does not fall back to root contents for an empty nested folder', () => {
    const folder = {
      metadata: {
        name: 'root',
        project: 'mahmoud',
      },
      spec: {
        items: [
          { kind: 'Folder', name: 'deep' },
          {
            kind: 'Folder',
            name: 'shallow',
            items: [{ kind: 'Folder', name: 'shallower' }],
          },
        ],
      },
    } as FolderResource;

    mockUseFolderList.mockReturnValue({
      data: [folder],
      isPending: false,
      isError: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/projects/mahmoud/folders/root/shallow/shallower']}>
        <Routes>
          <Route path="/projects/:projectName/folders/:rootFolder/*" element={<FolderView />} />
        </Routes>
      </MemoryRouter>,
    );

    const contents = screen.getByTestId('folder-contents');

    expect(contents.textContent).toBe('This folder is empty');
    expect(contents.textContent).not.toContain('deep');
    expect(contents.textContent).not.toContain('shallow');
  });
});
