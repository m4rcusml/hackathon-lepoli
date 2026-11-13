// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Evolution from './evolution';
import { createFixture } from '@/lib/demo/fixture';

vi.mock('recharts', () => Object.fromEntries([
  'CartesianGrid', 'Line', 'LineChart', 'ReferenceArea', 'ReferenceLine', 'ResponsiveContainer', 'Tooltip', 'XAxis', 'YAxis',
].map(name => [name, () => null])));
afterEach(cleanup);

it('opens a new series requested by the briefing without discarding period or wearable selection', () => {
  const snapshot = createFixture();
  const [first, second] = snapshot.exams.items;
  const openEvidence = vi.fn();
  const { rerender } = render(<Evolution snapshot={snapshot} openEvidence={openEvidence} initialSeries={first.id} />);
  const exam = screen.getByRole('combobox', { name: 'Exame' });
  const wearable = screen.getByRole('combobox', { name: 'Sinal do wearable' });
  const start = screen.getByLabelText('De', { exact: true });
  fireEvent.change(start, { target: { value: '2025-01-01' } });
  fireEvent.change(wearable, { target: { value: snapshot.wearables.items[0].id } });
  rerender(<Evolution snapshot={snapshot} openEvidence={openEvidence} initialSeries={second.id} />);
  expect(exam).toHaveValue(second.id);
  expect(start).toHaveValue('2025-01-01');
  expect(wearable).toHaveValue(snapshot.wearables.items[0].id);
  fireEvent.change(exam, { target: { value: first.id } });
  rerender(<Evolution snapshot={{ ...snapshot, id: 'snapshot-new' }} openEvidence={openEvidence} initialSeries={second.id} />);
  expect(exam).toHaveValue(first.id);
  expect(start).toHaveValue('2025-01-01');
});

it('switches measures in one click and opens the exact latest and previous evidence versions', () => {
  const snapshot = createFixture();
  const openEvidence = vi.fn();
  render(<Evolution snapshot={snapshot} openEvidence={openEvidence} />);
  fireEvent.click(screen.getByRole('button', { name: /^Selecionar\s*Ferritina Sérica/ }));
  expect(screen.getByRole('combobox', { name: 'Exame' })).toHaveValue('ferritina');
  fireEvent.click(screen.getByRole('button', { name: /Último registro.*18\/10\/2025.*22 ng\/mL/ }));
  expect(openEvidence).toHaveBeenLastCalledWith({ id: 'ex-fer-2025', version: '1' });
  fireEvent.click(screen.getByRole('button', { name: /Registro anterior.*20\/05\/2023.*65 ng\/mL/ }));
  expect(openEvidence).toHaveBeenLastCalledWith({ id: 'ex-fer-2023', version: '1' });
  expect(screen.getByText('-43 ng/mL')).toBeVisible();
});

it('does not compare values across different units or manufacture a missing latest measurement', () => {
  const snapshot = createFixture();
  const records = snapshot.evidence.filter(e => e.id.startsWith('ex-fer-'));
  records[0].unit = 'µg/L';
  records[1].value = null;
  render(<Evolution snapshot={snapshot} openEvidence={vi.fn()} initialSeries="ferritina" />);
  expect(screen.queryByText('Variação entre registros')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Último registro.*18\/10\/2025.*Sem valor/ })).toHaveTextContent('Sem valor');
});

it('toggles a wearable comparison directly without discarding the exam', () => {
  const snapshot = createFixture();
  render(<Evolution snapshot={snapshot} openEvidence={vi.fn()} />);
  const signal = screen.getByRole('button', { name: /^Comparar\s*Variabilidade cardíaca \(HRV\)/ });
  fireEvent.click(signal);
  expect(screen.getByRole('combobox', { name: 'Sinal do wearable' })).toHaveValue('hrv');
  fireEvent.click(signal);
  expect(screen.getByRole('combobox', { name: 'Sinal do wearable' })).toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Exame' })).toHaveValue(snapshot.exams.items[0].id);
});
