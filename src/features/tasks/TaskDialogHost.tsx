import { useEffect } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { useLabels } from '../../hooks/useLabels';
import { useCreateTask, useTasks, useUpdateTasks } from '../../hooks/useTasks';
import { toFormValues } from './taskFormModel';
import { TaskForm } from './TaskForm';
import { NEW_TASK, useTaskDialogParam } from './useTaskDialogParam';

export function TaskDialogHost() {
  const { dialogTaskId, close } = useTaskDialogParam();
  const { data: tasks, isSuccess } = useTasks();
  const { data: labels = [] } = useLabels();
  const createTask = useCreateTask();
  const updateTasks = useUpdateTasks();

  const isEdit = dialogTaskId !== null && dialogTaskId !== NEW_TASK;
  const editing = isEdit ? tasks?.find((t) => t.id === dialogTaskId) : undefined;

  useEffect(() => {
    if (isEdit && isSuccess && !editing) close();
  }, [isEdit, isSuccess, editing, close]);

  if (dialogTaskId === NEW_TASK) {
    return (
      <Dialog title="Thêm công việc" onClose={close}>
        <TaskForm
          initial={toFormValues()}
          labels={labels}
          submitLabel="Thêm"
          onCancel={close}
          onSubmit={async (input) => {
            await createTask.mutateAsync(input);
            close();
          }}
        />
      </Dialog>
    );
  }

  if (!editing) return null;

  return (
    <Dialog title="Sửa công việc" onClose={close}>
      <TaskForm
        key={editing.id}
        initial={toFormValues(editing)}
        labels={labels}
        submitLabel="Lưu"
        onCancel={close}
        onSubmit={async (input) => {
          await updateTasks.mutateAsync([{ id: editing.id, patch: input }]);
          close();
        }}
      />
    </Dialog>
  );
}
