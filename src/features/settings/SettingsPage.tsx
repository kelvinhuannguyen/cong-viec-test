import { useId, type ReactNode } from 'react';
import { card } from '../../components/ui/styles';
import { BackupSection } from './BackupSection';
import { LabelManager } from './LabelManager';
import { ReminderSection } from './ReminderSection';
import { StorageStatus } from './StorageStatus';
import { ThemeSection } from './ThemeSection';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={card}>
      <h2 id={id} className="mb-3 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <Section title="Nhãn">
        <LabelManager />
      </Section>
      <Section title="Nhắc hạn chót">
        <ReminderSection />
      </Section>
      <Section title="Giao diện">
        <ThemeSection />
      </Section>
      <Section title="Sao lưu">
        <BackupSection />
      </Section>
      <Section title="Lưu trữ">
        <StorageStatus />
      </Section>
    </div>
  );
}
