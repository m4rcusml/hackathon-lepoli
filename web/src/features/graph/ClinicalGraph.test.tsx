// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import ClinicalGraph from './clinical-graph';
import { createFixture } from '@/lib/demo/fixture';

vi.mock('@xyflow/react', () => ({
  Background: () => null,
  Controls: () => null,
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  ReactFlow: ({ nodes, nodeTypes }: {
    nodes: { id: string; data: Record<string, unknown> }[];
    nodeTypes: { clinical: ComponentType<{ data: Record<string, unknown> }> };
  }) => <div>{nodes.map(node => <nodeTypes.clinical key={node.id} data={node.data} />)}</div>,
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('focuses a topic or relation nature directly and keeps the equivalent selectors in sync', () => {
  const snapshot = createFixture();
  render(<ClinicalGraph snapshot={snapshot} openEvidence={vi.fn()} />);
  const topics = screen.getByRole('group', { name: 'Foco rápido do grafo' });
  fireEvent.click(within(topics).getByRole('button', { name: 'Ferritina Sérica' }));
  expect(screen.getByRole('combobox', { name: 'Tema' })).toHaveValue('node-ferritina');
  const nature = screen.getByRole('group', { name: 'Legenda das relações' });
  const fact = within(nature).getByRole('button', { name: 'Fato registrado' });
  fireEvent.click(fact);
  expect(screen.getByRole('combobox', { name: 'Natureza da relação' })).toHaveValue('recorded_fact');
  fireEvent.click(fact);
  expect(screen.getByRole('combobox', { name: 'Natureza da relação' })).toHaveValue('');
  fireEvent.click(within(topics).getByRole('button', { name: 'Visão completa' }));
  expect(screen.getByRole('combobox', { name: 'Tema' })).toHaveValue('');
});

it('opens the newest exact evidence version from a graph node without changing its clinical relationship', () => {
  const snapshot = createFixture();
  const openEvidence = vi.fn();
  render(<ClinicalGraph snapshot={snapshot} openEvidence={openEvidence} />);
  const topics = screen.getByRole('group', { name: 'Foco rápido do grafo' });
  fireEvent.click(within(topics).getByRole('button', { name: 'Ferritina Sérica' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver evidência: Ferritina Sérica' }));
  expect(openEvidence).toHaveBeenLastCalledWith({ id: 'ex-fer-2025', version: '1' });
  expect(screen.getByRole('list')).toHaveTextContent('Resultado laboratorial registrado');
  expect(screen.getByRole('list')).toHaveTextContent('Fato registrado');
});
