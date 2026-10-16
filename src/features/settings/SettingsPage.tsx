import { BellIcon, DatabaseIcon, HardDrivesIcon, PaletteIcon, TagIcon, UserCircleIcon, type Icon } from '@phosphor-icons/react';
import { useSession } from '../auth/SessionContext';
import { AccountSection } from './AccountSection';
import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { softSpring } from '../../components/ui/styles';
import { BackupSection } from './BackupSection';
import { LabelManager } from './LabelManager';
import { ReminderSection } from './ReminderSection';
import { StorageStatus } from './StorageStatus';
import { ThemeSection } from './ThemeSection';

function Section({
  title,
  description,
  icon: SectionIcon,
  index,
  children,
}: {
  title: string;
  description: string;
  icon: Icon;
  index: number;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <motion.section
      aria-labelledby={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay: index * 0.05 }}
      className="grid gap-4 py-8 first:pt-0 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:gap-10"
    >
      <div>
        <h2 id={id} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <SectionIcon className="size-4 text-zinc-400" aria-hidden="true" />
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </motion.section>
  );
}

export function SettingsPage() {
  const session = useSession();
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tuỳ chỉnh theo cách bạn làm việc</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tighter md:text-4xl">Cài đặt</h1>
      </header>
      <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
        {session && (
          <Section index={0} title="Tài khoản" icon={UserCircleIcon} description="Dữ liệu được lưu trên tài khoản này.">
            <AccountSection session={session} />
          </Section>
        )}
        <Section index={1} title="Nhãn" icon={TagIcon} description="Nhóm công việc theo chủ đề như Công việc, Cá nhân, Học tập.">
          <LabelManager />
        </Section>
        <Section
          index={2}
          title="Nhắc hạn chót"
          icon={BellIcon}
          description="Nhắc khi còn 1 giờ, khi vừa trễ hạn, và tóm tắt mỗi ngày."
        >
          <ReminderSection />
        </Section>
        <Section index={3} title="Giao diện" icon={PaletteIcon} description="Chọn sáng, tối, hoặc đi theo cài đặt của máy.">
          <ThemeSection />
        </Section>
        <Section
          index={4}
          title="Sao lưu"
          icon={DatabaseIcon}
          description={
            session
              ? 'Dữ liệu đã nằm trên tài khoản. Có thể xuất file để giữ một bản riêng hoặc chuyển sang tài khoản khác.'
              : 'Dữ liệu chỉ nằm trong trình duyệt này. Xuất file định kỳ để không bị mất.'
          }
        >
          <BackupSection cloud={session !== null} />
        </Section>
        {!session && (
          <Section index={5} title="Lưu trữ" icon={HardDrivesIcon} description="Trạng thái bảo vệ dữ liệu của trình duyệt.">
            <StorageStatus />
          </Section>
        )}
      </div>
    </div>
  );
}
